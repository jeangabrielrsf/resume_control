#!/bin/bash

# Function to kill background proxy on exit
cleanup() {
    if [ -n "$PROXY_PID" ]; then
        echo "Stopping Ollama Proxy (PID $PROXY_PID)..."
        kill $PROXY_PID
    fi
}
trap cleanup EXIT

echo "🔍 Job Tracker - Smart Start"
echo "============================"

# Default settings
OLLAMA_PORT=11434
NEEDS_PROXY=false
DOCKER_HOST_URL="http://host.docker.internal:11434/api/generate"

# Detect OS/Environment
if grep -q "WSL" /proc/version 2>/dev/null; then
    IS_WSL=true
    echo "✅ Environment: WSL2 detected"
else
    IS_WSL=false
    echo "✅ Environment: Linux/Other detected"
fi

# Check for Ollama Process
if pgrep -x "ollama" > /dev/null; then
    echo "✅ Ollama is running locally."
    
    # Check if Ollama is bound to localhost only (requires proxy for Docker)
    # Using ss (socket statistics) to check listening ports
    if ss -tuln | grep ":11434" | grep -q "127.0.0.1"; then
        echo "⚠️  Ollama is bound to localhost (127.0.0.1)."
        if [ "$IS_WSL" = true ]; then
             echo "   WSL2 + Localhost detected. Starting Proxy..."
             NEEDS_PROXY=true
        else
             echo "   Linux + Localhost detected. Docker might not reach it. Warning only."
        fi
    else
        echo "✅ Ollama is listening on all interfaces (0.0.0.0 or equivalent)."
        
        # In standard WSL2 setups without Docker Desktop, 'host.docker.internal' is flaky.
        # We will dynamically find the Windows Host IP from the default route.
        if [ "$IS_WSL" = true ]; then
            WSL_HOST_IP=$(ip route show | grep default | awk '{print $3}')
            echo "   WSL2 detected. Using Host IP: $WSL_HOST_IP"
            DOCKER_HOST_URL="http://$WSL_HOST_IP:11434/api/generate"
        fi
    fi
else
    echo "⚠️  Ollama process NOT found locally. Assuming it's running on Windows host or external."
    if [ "$IS_WSL" = true ]; then
        WSL_HOST_IP=$(ip route show | grep default | awk '{print $3}')
        echo "   WSL2 detected. Using Host IP: $WSL_HOST_IP"
        DOCKER_HOST_URL="http://$WSL_HOST_IP:11434/api/generate"
    fi
fi

# Start Proxy if needed
if [ "$NEEDS_PROXY" = true ]; then
    node ollama-proxy.js > /dev/null 2>&1 &
    PROXY_PID=$!
    echo "🚀 Proxy started on port 11435 (PID: $PROXY_PID)"
    DOCKER_HOST_URL="http://host.docker.internal:11435/api/generate"
fi

# Create/Update .env file for Docker
echo "📝 Configuring Docker environment..."
cat > .env <<EOL
OLLAMA_API_URL=$DOCKER_HOST_URL
EOL

echo "   OLLAMA_API_URL set to: $DOCKER_HOST_URL"

# Start Docker
echo "🐳 Starting Docker Containers..."
docker compose up --build

# Cleanup happens automatically via trap on exit
