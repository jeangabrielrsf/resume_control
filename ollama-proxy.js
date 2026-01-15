const http = require('http');

const target = {
    host: '127.0.0.1',
    port: 11434,
};

console.log(`Starting proxy 0.0.0.0:11435 -> ${target.host}:${target.port}`);

const server = http.createServer((clientReq, clientRes) => {
    const options = {
        hostname: target.host,
        port: target.port,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(clientRes, { end: true });
    });

    clientReq.pipe(proxyReq, { end: true });

    proxyReq.on('error', (e) => {
        console.error('Proxy Error:', e.message);
        clientRes.writeHead(500, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: 'Proxy Error', details: e.message }));
    });
});

server.listen(11435, '0.0.0.0', () => {
    console.log('Ollama Proxy running on 0.0.0.0:11435');
});
