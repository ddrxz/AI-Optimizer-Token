# IDE Integration Guide

## Overview
Your AI Gateway now supports an OpenAI-compatible API endpoint at `/v1/chat/completions`. This allows you to use it as a drop-in replacement for OpenAI in any IDE or tool that supports custom OpenAI endpoints.

## Benefits
- ✅ **Semantic Caching**: Repeated or similar queries are served from cache instantly
- ✅ **Free AI**: Uses Gemini (free tier) instead of paid OpenAI
- ✅ **Token Savings**: Track how many tokens you save via the dashboard
- ✅ **Privacy**: All data stays local (embeddings run on your machine)

## Quick Start

### 1. Start Your Gateway
```bash
npm run dev:backend
```

The gateway will be available at `http://localhost:4000`

### 2. Test the Endpoint
```powershell
$body = @{
    model = "gpt-4"
    messages = @(
        @{ role = "user"; content = "What is 2+2?" }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Method Post -Uri http://localhost:4000/v1/chat/completions -ContentType "application/json" -Body $body
```

## IDE Configuration

### VS Code with Continue Extension

1. Install the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue)
2. Open Continue settings (Cmd/Ctrl + Shift + P → "Continue: Open config.json")
3. Add your custom model:

```json
{
  "models": [
    {
      "title": "AI Gateway (Gemini + Cache)",
      "provider": "openai",
      "model": "gpt-4",
      "apiBase": "http://localhost:4000/v1",
      "apiKey": "not-needed"
    }
  ]
}
```

### VS Code with Cody Extension

1. Install [Cody](https://marketplace.visualstudio.com/items?itemName=sourcegraph.cody-ai)
2. Go to Settings → Extensions → Cody
3. Set:
   - **Custom API Endpoint**: `http://localhost:4000/v1`
   - **Access Token**: `any-value` (not validated)

### Cursor IDE

1. Open Settings (Cmd/Ctrl + ,)
2. Go to **Models** tab
3. Click **Add Custom Model**
4. Configure:
   - **Model Name**: `AI Gateway`
   - **API Base URL**: `http://localhost:4000/v1`
   - **API Key**: `any-value`
   - **Model**: `gpt-4`

### JetBrains IDEs (IntelliJ, PyCharm, etc.)

1. Install the [AI Assistant plugin](https://plugins.jetbrains.com/plugin/20724-ai-assistant)
2. Go to Settings → Tools → AI Assistant
3. Add Custom Provider:
   - **Base URL**: `http://localhost:4000/v1`
   - **API Key**: `any-value`
   - **Model**: `gpt-4`

### Google Antigravity

Currently, Google Antigravity uses Google's infrastructure by default. Custom endpoint support may vary based on your configuration.

## Response Format

The gateway returns standard OpenAI-compatible responses with additional metadata:

```json
{
  "id": "chatcmpl-1771234567890",
  "object": "chat.completion",
  "created": 1771234567,
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "2+2 equals 4."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  },
  "_gateway_metadata": {
    "source": "ai",
    "model": "gemini-3-flash-preview",
    "similarity": null
  }
}
```

### Custom Metadata Fields
- **source**: `"cache"` or `"ai"` - indicates if response came from cache
- **model**: The actual model used (e.g., `gemini-3-flash-preview`)
- **similarity**: Similarity score if from cache (0.0-1.0)

## Monitoring

Access the dashboard at [http://localhost:3000](http://localhost:3000) to see:
- Cache hit rate
- Tokens saved
- Recent activity
- Unique prompts cached

## Troubleshooting

### Connection Refused
- Ensure the backend is running: `npm run dev:backend`
- Check the port is 4000: `netstat -an | findstr :4000`

### No Response
- Check backend logs for errors
- Verify your `GEMINI_API_KEY` is set in `.env`
- Test with the `/proxy` endpoint first

### IDE Not Recognizing Endpoint
- Some IDEs require HTTPS. Consider using a local proxy like [ngrok](https://ngrok.com/)
- Ensure the API Base URL ends with `/v1` (not `/v1/chat/completions`)

## Advanced: HTTPS Setup (Optional)

For IDEs that require HTTPS:

1. Install ngrok: `choco install ngrok` (Windows) or `brew install ngrok` (Mac)
2. Start ngrok: `ngrok http 4000`
3. Use the HTTPS URL provided (e.g., `https://abc123.ngrok.io/v1`)

## Next Steps

- Try asking similar questions to see cache hits
- Monitor token savings in the dashboard
- Experiment with different complexity prompts to see routing in action
