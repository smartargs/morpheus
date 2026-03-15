# Neo N3 Assistant

A premium AI-powered guide for navigating the Neo N3 blockchain Matrix. Morpheus combines the reasoning power of Claude Models with deep Neo N3 integration to help you manage wallets, check balances, and perform secure token transfers—all through a natural conversation.

## ✨ Features

- **🧠 AI-Driven Blockchain Interaction**: Powered by Claude Models for intelligent tool use and blockchain analysis.
- **🔐 Secure Wallet Management**: Create or import Neo N3 wallets locally. Private keys (WIF) never leave your backend.
- **💸 Local Token Transfers**: Perform NEO and GAS transfers with real-time fee estimation signed locally on your machine.
- **🛡️ Supervised Mode**: A built-in approval workflow for critical blockchain operations (transfers, contract calls).
- **🔧 MCP Integration**: Connects to the `@r3e/neo-n3-mcp` server for real-time blockchain data (block counts, asset details, etc.).
- **📋 Persistent History**: Securely stay organized with chat history and settings stored in a local SQLite database.
- **🌗 Modern UI**: High-performance Vanilla JS frontend with a sleek, responsive design and premium dark mode.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- An [Anthropic API Key](https://console.anthropic.com/)

### Setup

1. **Clone the repository** (or navigate to the project folder).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the root directory and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your_api_key_here
   NEO_NETWORK=testnet
   ```

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
