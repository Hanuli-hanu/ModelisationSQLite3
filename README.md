# 🚀 Agentic VS Code Assistant

An intelligent AI-powered VS Code extension that integrates directly into the sidebar with a native-like interface. Features real-time agent visualization, task history, and seamless file management - just like Cody and other modern VS Code extensions.

## ✨ Key Features

### 🎨 Native Sidebar Integration
- **Activity Bar Icon**: Clean robot icon in the VS Code Activity Bar (left sidebar)
- **Embedded UI**: Complete interface directly in the sidebar panel (no separate windows)
- **Native Feel**: Matches VS Code's native styling and behavior patterns
- **Responsive Design**: Optimized for narrow sidebar width with collapsible sections

### 🤖 Intelligent Agent System
- **Multi-Agent Workflow**: Specialized agents for different tasks:
  - 📊 **Code Analyzer**: Analyzes project structure and dependencies
  - 📝 **Story Processor**: Breaks down user requirements
  - 🔍 **File Analyzer**: Scans and understands existing codebase
  - ⚙️ **Code Generator**: Creates implementation code
  - 📝 **File Manager**: Handles file creation and updates
- **Real-time Agent Visualization**: See which agent is active with avatars and progress
- **Live Progress Tracking**: Visual progress bar showing task completion (0-100%)

### 📁 Advanced File Handling
- **File Modification Tracking**: Clear indication of which files are being edited
- **Smart Notifications**: Non-intrusive alerts when files are created or modified
- **Quick File Access**: One-click option to view modified files
- **Context-Aware Updates**: Code placement respects existing file structure

### � Task History & Management
- **History Panel**: Separate collapsible section showing past tasks
- **Task Status**: Visual indicators for completed, failed, and running tasks
- **File Tracking**: See which files were modified for each task
- **Quick Actions**: Clear history, refresh status, and more

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
   - Look for the 🤖 robot icon in the Activity Bar (left sidebar)
   - Click the icon to open the Agentic Assistant panel

### Usage

#### Sidebar Interface

1. **Open the Sidebar:**
   - Click the 🤖 robot icon in the Activity Bar
   - The Agentic Assistant panel will open on the left

2. **Using the Assistant:**
   - Enter your user story in the text area
   - Click "Run" or press `Ctrl+Enter`
   - Watch real-time progress and agent activity
   - View file modifications as they happen

3. **Monitor Progress:**
   - Connection status indicator (🔴 Disconnected, 🟡 Connecting, 🟢 Connected)
   - Current task display when running
   - Agent progress section with avatar and status
   - Live progress bar (0-100%)

4. **Task History:**
   - Expand the "Task History" section
   - See all previous tasks with status icons
   - Click on tasks to see details and modified files
   - Use the clear button to reset history

#### Full Interface (Optional)
- Click the window icon in the sidebar to open the full webview interface
- Provides the same functionality in a larger, dedicated panel

## 🎯 Example User Stories

- "Create a REST API endpoint for user authentication"
- "Add dark mode toggle to the header component"  
- "Implement form validation with error handling"
- "Create a dashboard with charts and data visualization"
- "Add unit tests for the user service module"

## ⚙️ Configuration

Access extension settings via VS Code Settings (`Ctrl+,`):

- **Server URL**: WebSocket endpoint for the agent backend (default: `ws://localhost:8000`)
- **Auto Open Files**: Automatically open modified files in editor (default: `true`)
- **Show Notifications**: Toggle file modification notifications (default: `true`)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Interface                        │
├─────────────────────────────────────────────────────────────┤
│  Activity Bar  │           Sidebar Panel                    │
│  ┌─────────┐   │  ┌─────────────────────────────────────┐   │
│  │    🤖   │───┼─►│  Agentic Assistant Chat View       │   │
│  │         │   │  │  • User story input                │   │
│  │ (Icon)  │   │  │  • Real-time progress             │   │
│  └─────────┘   │  │  • Agent visualization            │   │
│                │  │  • Live log feed                  │   │
│                │  └─────────────────────────────────────┘   │
│                │  ┌─────────────────────────────────────┐   │
│                │  │  Task History View                 │   │
│                │  │  • Previous tasks                  │   │
│                │  │  • File modifications             │   │
│                │  │  • Status indicators              │   │
│                │  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                    WebSocket   │
                                ▼
                ┌─────────────────────────────┐
                │     Backend Agent Server    │
                │     (ws://localhost:8000)   │
                └─────────────────────────────┘
```

## 🛠️ Development

### Project Structure
```
├── src/
│   └── extension.ts         # Main extension logic with webview provider
├── webview-ui/
│   ├── index.html          # Full webview interface
│   └── sidebar.html        # Optimized sidebar interface
├── resources/
│   └── robot-icon.svg      # Activity bar icon
├── package.json            # Extension manifest with sidebar configuration
└── README.md              # This file
```

### Key Components

- **`AgenticChatViewProvider`**: Webview provider for sidebar UI
- **`AgenticHistoryProvider`**: Tree data provider for task history
- **Sidebar HTML**: Responsive interface optimized for narrow panels
- **WebSocket Integration**: Real-time communication with backend

### Building & Testing

```bash
# Compile TypeScript
npm run compile

# Watch mode for development  
npm run watch

# Test the extension
# Press F5 in VS Code to launch extension development host
```

## 🎨 UI Features

### Sidebar Optimizations
- **Responsive Layout**: Adapts to narrow sidebar width
- **Collapsible Sections**: Current task and progress can be hidden when inactive
- **Compact Controls**: Buttons and inputs sized for sidebar usage
- **Smooth Animations**: Slide-in effects for new log entries
- **Status Indicators**: Color-coded connection and task status

### Visual Enhancements
- **Agent Avatars**: Different emoji avatars for each agent type
- **Progress Visualization**: Animated progress bar with gradient fill
- **File Badges**: Highlighted file names in logs
- **Status Colors**: Color-coded messages based on agent status
- **Hover Effects**: Interactive elements with subtle hover states

## 🔧 VS Code Integration

### Native Features
- **Activity Bar Integration**: Custom icon alongside Explorer, Git, etc.
- **Sidebar Panel**: Native webview embedded in sidebar
- **Command Palette**: All commands accessible via `Ctrl+Shift+P`
- **Context Menus**: Right-click options in file explorer
- **Keyboard Shortcuts**: `Ctrl+Shift+A` to open, `Ctrl+Enter` to submit
- **Settings Integration**: Configuration options in VS Code settings

### Extension Points
- **View Containers**: Custom activity bar container
- **Webview Views**: Embedded webview for sidebar UI
- **Tree Data Providers**: History management
- **Commands**: All actions registered as VS Code commands
- **Configurations**: User-configurable options

## 📝 Usage Tips

1. **Quick Start**: Click the robot icon → enter story → click Run
2. **Keyboard Shortcuts**: Use `Ctrl+Enter` in the text area to submit
3. **Monitor Progress**: Watch the agent avatars and progress bar
4. **Track Changes**: File notifications show what's being modified  
5. **History Review**: Expand task history to see previous work
6. **Full Interface**: Use window icon for expanded view when needed

## 🚀 What's New

### Sidebar Integration
- ✅ Native Activity Bar icon (🤖)
- ✅ Embedded webview in sidebar panel
- ✅ Optimized responsive design for narrow width
- ✅ Real-time agent visualization with progress
- ✅ Task history with collapsible details
- ✅ Native VS Code styling and behavior

### Enhanced UX
- ✅ Cody-like sidebar experience
- ✅ No separate windows or popups
- ✅ Smooth animations and transitions
- ✅ Color-coded status indicators
- ✅ Compact, efficient interface design

## 🐛 Troubleshooting

**Sidebar doesn't appear:**
- Ensure extension is installed and activated
- Look for the 🤖 icon in the Activity Bar
- Try reloading VS Code window (`Ctrl+Shift+P` → "Developer: Reload Window")

**Can't connect to backend:**
- Verify backend server is running on `ws://localhost:8000`
- Check connection status indicator in sidebar header
- Review WebSocket URL in extension settings

**Interface looks broken:**
- Ensure VS Code is version 1.80.0 or higher
- Try refreshing the webview (click refresh icon in sidebar title)
- Check browser console for JavaScript errors

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎉 Now with native sidebar integration - just like the extensions you love!**

The Agentic Assistant now provides a seamless, native VS Code experience with:
- One-click access from the Activity Bar
- Complete interface embedded in the sidebar
- Real-time agent visualization and progress tracking
- Task history and file modification tracking
- Professional, responsive design optimized for productivity

**Backend Note**: The extension connects to your separately running backend server. The frontend is complete and ready for integration with any compatible agent service. 