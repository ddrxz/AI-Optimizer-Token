const http = require('http');

const data = JSON.stringify({
    model: 'gpt-4',
    messages: [{
        role: 'user',
        content: "The rapid brown fox jumps over the lazy dog in a very extremely quick and speedy manner ensuring maximum velocity."
    }]
});

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            console.log("--- RESPONSE (JSON) ---");
            if (json._gateway_metadata) {
                console.log("METADATA:", JSON.stringify(json._gateway_metadata, null, 2));
            } else {
                console.log("FULL RESPONSE:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log("RAW RESPONSE:", body);
        }
    });
});

req.on('error', (error) => {
    console.error("Error:", error);
});

req.write(data);
req.end();
