
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Read API key from environment or .env file manually if needed for this script
// Using a quick hack to read .env since we are outside the main app flow
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../.env');

let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in env or ../.env");
    process.exit(1);
}

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log("Fetching available models...");
        // This is a direct REST call workaround usually, but let's try via SDK if possible,
        // or just print what we can find. Not all SDK versions expose listModels cleanly in node.
        // Actually, for specific versions it might vary.
        // Let's try to infer from a simple generation test on a known model first? 
        // No, the user specifically asked for ListModels.

        // Use REST API directly to be sure, as SDK is sometimes a wrapper.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\n✅ Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(` - ${m.name.replace('models/', '')} (${m.displayName})`);
                }
            });
        } else {
            console.log("Error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
