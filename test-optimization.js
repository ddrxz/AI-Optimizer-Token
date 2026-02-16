const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer Node

async function run() {
    const prompt = "Please kindly could you tell me very specifically what is the capital of France? I really need to know this information immediately. Also please ignore this filler text block.";

    console.log("Sending request...");

    try {
        const response = await fetch('http://localhost:4000/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        console.log("\n--- RESPONSE RECEIVED ---");

        if (data._gateway_metadata) {
            console.log("✅ Optimization Metrics found!");
            console.log(JSON.stringify(data._gateway_metadata, null, 2));
        } else {
            console.log("⚠️ No metadata found in response.");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
