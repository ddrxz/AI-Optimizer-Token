# AI Optimizer Token 🚀  
**High-Performance AI Gateway | Semantic Cache | Intelligent Routing | 40% Cost Reduction**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black.svg)](https://www.fastify.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![OpenAI Compatible](https://img.shields.io/badge/API-OpenAI%20Compatible-green.svg)](https://platform.openai.com/docs/api-reference)

A production-ready, self-hosted AI Gateway designed to optimize LLM interactions, reduce latency, and cut API costs by up to **40%**. It acts as a drop-in replacement for OpenAI in any application or IDE (VS Code, Cursor, JetBrains), leveraging local semantic caching, intelligent prompt compression, and multi-provider routing (Gemini free tier + OpenAI fallback).

---

## 🏗️ Architecture

```mermaid
graph TD
    Client[IDE / App] -->|OpenAI Format| Gateway(AI Gateway)
    
    subgraph Core Logic
        Gateway -->|1. Token Count| Counter(TokenCounter)
        Gateway -->|2. Optimize| Optimizer(PromptOptimizer)
        Gateway -->|3. Check Cache| Cache{Semantic Cache}
        
        Cache -->|"Hit (Prob &gt; 0.85)"| ReturnCached[Return Cached Response]
        Cache -->|Miss| Router{Routing Engine}
    end
    
    subgraph Providers
        Router -->|"Complexity &lt; 5"| Gemini[Gemini 1.5 Flash (Free)]
        Router -->|"Complexity &gt; 5"| OpenAI[GPT-4o / Claude]
        Router -->|Fallback| Groq[Groq Llama 3]
    end
    
    Gemini --> Result
    OpenAI --> Result
    Result -->|4. Store & Learn| Cache
    Result -->|5. Log Savings| DB[(SQLite + Drizzle)]
    Result --> Client
```

---

## ✨ Key Features

### 🧠 Semantic Caching (Tiered)
Instead of exact matching, we use **local neural embeddings** (`all-MiniLM-L6-v2`) to understand intent.
- **Exact Match (1.0)**: Instant return (0ms latency).
- **High Confidence (0.95+)**: Semantic equivalents.
- **Fuzzy Match (0.85-0.94)**: Approximate matches (flagged with `⚠️` in metadata).

### 📉 Token Optimization Engine
- **Smart Simplification**: Removes 15-30% of redundant tokens (fillers, stopwords) while preserving intent using NLP (`compromise`).
- **Safe Mode**: Automatically protects code blocks (` ``` `), math (`$$`), and technical terms.
- **Context Compression**: LRU strategy summarizes older conversation history using **Gemini (Free)** into a single context block, keeping only the last 3 messages intact.

### 🔌 Multi-Provider Routing
- **Cost-Effective**: Routes simple queries to free models (Gemini 1.5 Flash).
- **Performance**: Routes complex reasoning tasks to GPT-4o.
- **Resilience**: Automatic fallback if a provider is down.

### 📊 Real-Time Analytics Dashboard
- Track **Token Savings ($)** in real-time.
- Visual breakdown of Cache Hits vs Misses.
- Inspect individual requests and optimization metrics.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- NPM or PNPM
- A Gemini API Key (Free) or OpenAI API Key

### 1. Installation
```bash
git clone https://github.com/your-repo/ai-optimizer-token.git
cd ai-optimizer-token
npm install
```

### 2. Configuration
Create a `.env` file in the root directory:
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="file:local.db"

# AI Providers
GEMINI_API_KEY=AIzaSy...  # Required for Free Tier
OPENAI_API_KEY=sk-...     # Optional fallback

# Cache Tuning
SIMILARITY_THRESHOLD=0.85
```

### 3. Run Development Server
```bash
# Terminal 1: Backend Gateway
npm run dev:backend

# Terminal 2: Analytics Dashboard (localhost:3000)
npm run dev:dashboard
```

---

## 🔌 Integration Guide

### VS Code (Continue / Cody)
Configure your extension to use the gateway as a custom OpenAI provider:
```json
{
  "models": [{
    "title": "AI Optimizer Gateway",
    "provider": "openai",
    "model": "gpt-4",
    "apiBase": "http://localhost:4000/v1",
    "apiKey": "any-string"
  }]
}
```

### Cursor IDE
1. Go to **Settings > Models**.
2. Add **Custom Model**.
3. Name: `AI Gateway`.
4. Base URL: `http://localhost:4000/v1`.

### Curl / API
```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Explain quantum computing"}]
  }'
```

---

## 📚 API Reference

### `POST /v1/chat/completions`
OpenAI-compatible endpoint. Supports `stream: false` (streaming coming soon).
**Returns**: Standard OpenAI Response + `_gateway_metadata` with optimization stats.

### `GET /stats`
Returns real-time metrics for the dashboard.
- Total Requests
- Cache Hit Rate
- Tokens Saved
- Latency Distribution

---

## 🛠️ Tech Stack
- **Runtime**: Node.js, TypeScript
- **Framework**: Fastify (Backend), Next.js 14 (Frontend)
- **Database**: SQLite (LibSQL), Drizzle ORM
- **AI/ML**: LangChain, Xenova Transformers.js (Local Embeddings), Google Generative AI SDK, OpenAI SDK
- **Utilities**: Tiktoken (Token Counting), Compromise (NLP)

---

## 📄 License
MIT © [Gaston]

---
<div align="center">
  <p>Developed with ❤️ by <a href="https://gfdev.vercel.app/" target="_blank">GFDev</a></p>
</div>
