# 🚀 Agentic VS Code Assistant

An intelligent AI-powered VS Code extension that analyzes your project and implements user stories using advanced agent workflows. Features a modern, professional UI with real-time feedback and seamless file management.

## ✨ Key Features

### 🎨 Enhanced UI/UX
- **Modern Design**: Clean, professional interface that integrates seamlessly with VS Code themes
- **Smooth Animations**: Elegant transitions and progress indicators for better user experience  
- **Real-time Feedback**: Live status updates with animated progress bars and agent visualization
- **Responsive Layout**: Optimized for different screen sizes and VS Code layouts

### 🤖 Intelligent Agent System
- **Multi-Agent Workflow**: Different specialized agents handle various tasks:
  - 📊 **Code Analyzer**: Analyzes project structure and dependencies
  - 📝 **Story Processor**: Breaks down user requirements
  - 🔍 **File Analyzer**: Scans and understands existing codebase
  - ⚙️ **Code Generator**: Creates implementation code
  - 📝 **File Manager**: Handles file creation and updates
- **Agent Visualization**: See which agent is currently active with avatars and status

### 📁 Advanced File Handling
- **File Modification Tracking**: Clear indication of which files are being edited
- **Smart Notifications**: Non-intrusive alerts when files are created or modified
- **Quick File Access**: One-click option to view modified files
- **Context-Aware Updates**: Code placement respects existing file structure

### 🔧 Developer Experience
- **Keyboard Shortcuts**: `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac) to start
- **Command Palette Integration**: Access via "Agentic Assistant" commands
- **Context Menu Support**: Right-click in explorer to start assistant
- **Progress Tracking**: Visual progress indicators for long-running tasks

## 🚀 Getting Started

### Prerequisites
- VS Code 1.80.0 or higher
- Node.js 18+ 
- Backend agent server running on `ws://localhost:8000` (provided separately)

### Installation & Setup

1. **Clone and Setup Extension:**
   ```bash
   git clone <repository-url>
   cd Hanuli
   npm install
   ```

2. **Development Mode:**
   ```bash
   npm run watch    # Start TypeScript watch mode
   ```

3. **Launch Extension:**
   - Press `F5` to open a new VS Code window with the extension loaded
   - Or press `Ctrl+Shift+P` and search for "Agentic Assistant"

### Usage

1. **Start the Assistant:**
   - Use `Ctrl+Shift+A` shortcut
   - Or open Command Palette (`Ctrl+Shift+P`) → "Start Agentic Assistant"
   - Or right-click in Explorer → "Start Agentic Assistant"

2. **Enter User Story:**
   ```
   Example: "Create a todo list component with add/remove functionality"
   ```

3. **Watch the Magic:**
   - See real-time progress as different agents work
   - Get notifications when files are modified
   - View enhanced logs with timestamps and agent information

## 🎯 Example User Stories

- "Create a REST API endpoint for user authentication"
- "Add dark mode toggle to the header component"  
- "Implement form validation with error handling"
- "Create a dashboard with charts and data visualization"
- "Add unit tests for the user service module"

## ⚙️ Configuration

Access extension settings via VS Code Settings:

- **Server URL**: WebSocket endpoint for the agent backend
- **Auto Open Files**: Automatically open modified files in editor
- **Show Notifications**: Toggle file modification notifications

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   VS Code       │ ◄──────────────► │   Backend        │
│   Extension     │    ws://8000     │   Agent Server   │
│                 │                  │                  │
│  ┌─────────────┐│                  │ ┌──────────────┐ │
│  │  Webview    ││                  │ │   AI Agents  │ │
│  │     UI      ││                  │ │   Workflow   │ │
│  └─────────────┘│                  │ └──────────────┘ │
└─────────────────┘                  └──────────────────┘
```

## 🛠️ Development

### Project Structure
```
├── src/
│   └── extension.ts     # Main extension logic
├── webview-ui/
│   └── index.html       # Enhanced UI with animations
├── package.json         # Extension manifest
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

### Key Files

- **`src/extension.ts`**: Core extension logic with enhanced WebSocket handling
- **`webview-ui/index.html`**: Modern UI with animations and agent visualization
- **`package.json`**: Extension configuration with commands and keybindings

### Building & Testing

```bash
# Compile TypeScript
npm run compile

# Watch mode for development  
npm run watch

# Package extension
vsce package
```

## 🔄 Backend Integration

The extension connects to a separate backend server that should be running on `ws://localhost:8000/ws/agent`. The backend handles:

- Natural language processing of user stories
- Project analysis and code generation
- File system operations
- Multi-agent coordination

**Note**: Backend server is provided separately and must be running before using the extension.

## 🎨 UI Enhancements

### Visual Features
- **Gradient Backgrounds**: Modern gradient buttons and headers
- **Smooth Transitions**: 0.3s ease transitions for all interactive elements
- **Progress Animations**: Animated progress bars and status indicators
- **Agent Avatars**: Visual representation of active agents
- **Status Bar**: Real-time connection and task status
- **Enhanced Logging**: Color-coded, timestamped logs with file indicators

### Animations
- **Slide Down**: Agent info panels slide in smoothly
- **Fade In Up**: Log entries appear with subtle upward motion
- **Pulse Animation**: Status indicators pulse to show activity
- **Loading Spinners**: Smooth rotating spinners for processing states

## 🔧 Technical Features

- **TypeScript**: Fully typed codebase for better reliability
- **WebSocket Integration**: Real-time bidirectional communication
- **Error Handling**: Comprehensive error handling and user feedback
- **File System Integration**: Smart file modification tracking
- **VS Code API**: Deep integration with VS Code's extension APIs

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test with the backend server
5. Submit a pull request

## 🐛 Troubleshooting

**Extension won't start:**
- Ensure VS Code version is 1.80.0+
- Check that TypeScript compiled successfully (`npm run compile`)

**Can't connect to backend:**
- Verify backend server is running on `ws://localhost:8000`
- Check firewall settings
- Look for connection errors in the extension logs

**Files not updating:**
- Ensure workspace folder is open in VS Code
- Check file permissions
- Verify backend has write access to project directory

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ for the VS Code community** 