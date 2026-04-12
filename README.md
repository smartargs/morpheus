# Neo N3 Assistant

A premium AI-powered guide for navigating the Neo N3 blockchain Matrix. Morpheus combines the reasoning power of Claude Models or local open-source models (via Ollama) with deep Neo N3 integration to help you manage wallets, check balances, and perform secure token transfers—all through a natural conversation.

![Preview](https://pbs.twimg.com/media/HCUG2iIasAIWGsm?format=jpg&name=4096x4096)

## ✨ Features

- **🧠 AI-Driven Blockchain Interaction**: Powered by Claude Models or local models via Ollama for intelligent tool use and blockchain analysis.
- **🦙 Local Model Support**: Run fully private with Ollama — no data leaves your machine.
- **🔐 Secure Wallet Management**: Create or import Neo N3 wallets locally. Private keys (WIF) never leave your backend.
- **💸 Local Token Transfers**: Perform NEO and GAS transfers with real-time fee estimation signed locally on your machine.
- **🛡️ Supervised Mode**: A built-in approval workflow for critical blockchain operations (transfers, contract calls).
- **🔧 MCP Integration**: Connects to the `@r3e/neo-n3-mcp` server for real-time blockchain data (block counts, asset details, etc.).
- **📋 Persistent History**: Securely stay organized with chat history and settings stored in a local SQLite database.
- **🌗 Modern UI**: High-performance Vanilla JS frontend with a sleek, responsive design and premium dark mode.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- An [Anthropic API Key](https://console.anthropic.com/) (optional if using local models only)

### Setup

1. **Clone the repository** (or navigate to the project folder).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   ANTHROPIC_API_KEY=your_api_key_here   # Optional if using Ollama only
   NEO_NETWORK=testnet
   ```

### Using Local Models (Ollama)

For fully private, offline operation you can use local models via [Ollama](https://ollama.com/):

1. **Install Ollama**:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
2. **Start Ollama and pull a model**:
   ```bash
   ollama serve &
   ollama pull llama3.1:8b
   ```
3. **Configure in the app**: Go to **Settings** and set the Ollama endpoint (default: `http://localhost:11434`). Use the **Test Connection** button to verify.
4. **Select a local model**: Open the model selector in chat — local models appear under the "Local (Ollama)" section.

Models with tool/function calling support (e.g., `llama3.1`, `qwen2.5`, `mistral`) work best as they can use blockchain tools.

### Running the Application

Start both the frontend (Vite) and backend (Express) in development mode:

```bash
npm run dev
```

The application will be available at:
- **Frontend**: [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## 📜 License

MIT
