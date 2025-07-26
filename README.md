
# Frontend - VS Code Webview UI

## 🧩 Description
This is the frontend UI for the Agentic Code Extension. It connects to the FastAPI backend over WebSocket and displays progress.

## 🛠 Structure
- `src/extension.ts` - VS Code extension entrypoint
- `webview-ui/index.html` - Webview content

## 🔧 Setup
1. Build the extension using VS Code tools
2. Make sure the backend FastAPI is running
3. The webview will connect to `ws://localhost:8000/ws/agent`
