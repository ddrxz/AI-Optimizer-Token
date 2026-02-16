async function testAdvancedOptimizations() {
    console.log("--- Testing Slash Command (/explain) ---");
    try {
        const templateResponse = await fetch('http://localhost:4000/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: '/explain const x = 10;' }],
                model: 'gpt-4'
            })
        });
        const templateData = await templateResponse.json();
        console.log("Slash Command Result Metadata:", JSON.stringify(templateData._gateway_metadata, null, 2));
        console.log("Response starts with:", templateData.choices[0]?.message?.content?.substring(0, 100));
    } catch (e) {
        console.error("Slash command test failed:", e.message);
    }

    console.log("\n--- Testing Context Summarization (Long History) ---");
    try {
        const historyResponse = await fetch('http://localhost:4000/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'My name is Gaston.' },
                    { role: 'assistant', content: 'Hello Gaston!' },
                    { role: 'user', content: 'I like pizza.' },
                    { role: 'assistant', content: 'Pizza is great!' },
                    { role: 'user', content: 'I live in Argentina.' },
                    { role: 'assistant', content: 'Nice country!' },
                    { role: 'user', content: 'What did I tell you about myself?' }
                ],
                model: 'gpt-4'
            })
        });
        const historyData = await historyResponse.json();
        console.log("History Result Metadata:", JSON.stringify(historyData._gateway_metadata, null, 2));
        console.log("Response:", historyData.choices[0]?.message?.content);
    } catch (e) {
        console.error("History test failed:", e.message);
    }
}

testAdvancedOptimizations();
