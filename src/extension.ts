import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import WebSocket from 'ws';

interface AgentMessage {
    status?: string;
    message?: string;
    file?: string;
    filename?: string;
    code?: string;
    agent?: string;
    progress?: number;
    files_modified?: string[];
}

interface TaskHistoryItem {
    id: string;
    story: string;
    timestamp: Date;
    status: 'completed' | 'failed' | 'running';
    filesModified: string[];
}

// Webview Provider for Chat View
class AgenticChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'agentic.chatView';
    private _view?: vscode.WebviewView;
    private globalSocket: WebSocket | null = null;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly updateConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void,
        private readonly updateCurrentTask: (task: string | null) => void,
        private readonly addToHistory: (story: string, status: 'completed' | 'failed' | 'running', filesModified?: string[]) => void
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'startStory':
                    await this.handleStartStory(data.story);
                    break;
            }
        });
    }

    private async handleStartStory(story: string) {
        const config = vscode.workspace.getConfiguration('agentic');
        const serverUrl = config.get<string>('serverUrl', 'ws://localhost:8000');
        const autoOpenFiles = config.get<boolean>('autoOpenFiles', true);
        const showNotifications = config.get<boolean>('showNotifications', true);
        const projectDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '.';

        // Update status
        this.updateConnectionStatus('connecting');
        this.updateCurrentTask(story);
        this.addToHistory(story, 'running');

        // Helper function to send messages to webview
        const sendToWebview = (data: AgentMessage) => {
            if (this._view) {
                this._view.webview.postMessage({ command: 'log', data });
            }
        };

        // Helper function to highlight files being modified
        const highlightModifiedFile = async (filePath: string) => {
            if (!showNotifications) return;
            
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const fullPath = path.isAbsolute(filePath) 
                        ? filePath 
                        : path.join(workspaceFolder.uri.fsPath, filePath);
                    
                    const uri = vscode.Uri.file(fullPath);
                    
                    if (fs.existsSync(fullPath)) {
                        if (autoOpenFiles) {
                            const document = await vscode.workspace.openTextDocument(uri);
                            await vscode.window.showTextDocument(document, { preview: true });
                        }
                        
                        vscode.window.showInformationMessage(
                            `📝 File updated: ${path.basename(filePath)}`,
                            'View File'
                        ).then(selection => {
                            if (selection === 'View File') {
                                vscode.workspace.openTextDocument(uri).then(doc => {
                                    vscode.window.showTextDocument(doc);
                                });
                            }
                        });
                    } else {
                        vscode.window.showInformationMessage(
                            `📄 New file created: ${path.basename(filePath)}`,
                            'View File'
                        ).then(selection => {
                            if (selection === 'View File') {
                                setTimeout(() => {
                                    if (fs.existsSync(fullPath)) {
                                        vscode.workspace.openTextDocument(uri).then(doc => {
                                            vscode.window.showTextDocument(doc);
                                        });
                                    }
                                }, 1000);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error highlighting file:', error);
            }
        };

        try {
            // Close existing socket if any
            if (this.globalSocket) {
                this.globalSocket.close();
            }

            sendToWebview({ 
                status: 'CONNECTING', 
                message: 'Establishing connection to agent server...',
                agent: 'Connection Manager'
            });

            const socket = new WebSocket(`${serverUrl}/ws/agent`);
            this.globalSocket = socket;

            socket.onopen = () => {
                this.updateConnectionStatus('connected');
                sendToWebview({ 
                    status: 'CONNECTED', 
                    message: 'Successfully connected to agent server',
                    agent: 'Connection Manager'
                });
                
                sendToWebview({
                    status: 'PROCESSING',
                    message: `Sending user story: "${story}"`,
                    agent: 'Story Processor'
                });
                
                socket.send(JSON.stringify({
                    story: story,
                    project_dir: projectDir
                }));
            };

            const modifiedFiles: string[] = [];

            socket.onmessage = async (event: any) => {
                try {
                    const data: AgentMessage = JSON.parse(event.data.toString());
                    
                    if (data.status) {
                        data.status = data.status.toUpperCase();
                        
                        // Handle file operations
                        if (data.file || data.filename) {
                            const fileName = data.file || data.filename;
                            if (fileName) {
                                data.status = 'FILE_UPDATE';
                                data.message = data.message || `Modifying file: ${fileName}`;
                                modifiedFiles.push(fileName);
                                await highlightModifiedFile(fileName);
                            }
                        }
                        
                        // Handle multiple files modified
                        if (data.files_modified && Array.isArray(data.files_modified)) {
                            for (const file of data.files_modified) {
                                modifiedFiles.push(file);
                                await highlightModifiedFile(file);
                                sendToWebview({
                                    status: 'FILE_UPDATE',
                                    message: `Updated file: ${path.basename(file)}`,
                                    file: file,
                                    agent: 'File Manager'
                                });
                            }
                        }
                        
                        // Set agent based on status
                        if (!data.agent) {
                            switch (data.status) {
                                case 'ANALYZING':
                                case 'FILE_ANALYSIS':
                                    data.agent = 'Code Analyzer';
                                    break;
                                case 'GENERATING':
                                case 'CODE_GENERATION':
                                    data.agent = 'Code Generator';
                                    break;
                                case 'WRITING':
                                case 'FILE_UPDATE':
                                    data.agent = 'File Manager';
                                    break;
                                case 'COMPLETED':
                                    data.agent = 'Task Manager';
                                    this.updateCurrentTask(null);
                                    this.addToHistory(story, 'completed', modifiedFiles);
                                    break;
                                case 'ERROR':
                                    data.agent = 'Error Handler';
                                    this.updateCurrentTask(null);
                                    this.addToHistory(story, 'failed', modifiedFiles);
                                    break;
                                default:
                                    data.agent = 'AI Agent';
                            }
                        }
                    }
                    
                    sendToWebview(data);
                    
                } catch (parseError) {
                    console.error('Error parsing agent message:', parseError);
                    sendToWebview({
                        status: 'ERROR',
                        message: `Failed to parse agent response: ${event.data}`,
                        agent: 'Error Handler'
                    });
                }
            };

            socket.onerror = (err: any) => {
                const errorMsg = `WebSocket connection failed. Make sure the agent server is running on ${serverUrl}`;
                vscode.window.showErrorMessage(errorMsg);
                this.updateConnectionStatus('disconnected');
                this.updateCurrentTask(null);
                sendToWebview({ 
                    status: 'ERROR', 
                    message: errorMsg,
                    agent: 'Connection Manager'
                });
            };

            socket.onclose = (event) => {
                const closeMsg = event.wasClean 
                    ? 'Connection closed normally' 
                    : 'Connection lost unexpectedly';
                    
                this.updateConnectionStatus('disconnected');
                this.updateCurrentTask(null);
                sendToWebview({ 
                    status: 'CLOSED', 
                    message: closeMsg,
                    agent: 'Connection Manager'
                });
                
                this.globalSocket = null;
            };

        } catch (err) {
            const errorMsg = 'Failed to establish connection: ' + err;
            vscode.window.showErrorMessage(errorMsg);
            this.updateConnectionStatus('disconnected');
            this.updateCurrentTask(null);
            sendToWebview({ 
                status: 'ERROR', 
                message: errorMsg,
                agent: 'Connection Manager'
            });
        }
    }

    public cleanup() {
        if (this.globalSocket) {
            this.globalSocket.close();
            this.globalSocket = null;
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = path.join(vscode.Uri.parse(this._extensionUri.toString()).fsPath, 'webview-ui', 'sidebar.html');
        try {
            return fs.readFileSync(htmlPath, 'utf-8');
        } catch (error) {
            return `
                <html><body>
                    <div style="padding: 20px; color: red;">
                        Error loading sidebar UI: ${error}
                    </div>
                </body></html>
            `;
        }
    }
}

// Tree Data Provider for History View
class AgenticHistoryProvider implements vscode.TreeDataProvider<AgenticTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AgenticTreeItem | undefined | null | void> = new vscode.EventEmitter<AgenticTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AgenticTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private history: TaskHistoryItem[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addTask(item: TaskHistoryItem): void {
        this.history.unshift(item); // Add to beginning
        if (this.history.length > 20) { // Keep only last 20 items
            this.history = this.history.slice(0, 20);
        }
        this.refresh();
    }

    clearHistory(): void {
        this.history = [];
        this.refresh();
    }

    getTreeItem(element: AgenticTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AgenticTreeItem): Thenable<AgenticTreeItem[]> {
        if (!element) {
            if (this.history.length === 0) {
                return Promise.resolve([new AgenticTreeItem('No tasks yet', vscode.TreeItemCollapsibleState.None, 'emptyItem')]);
            }

            const items = this.history.map(task => {
                const statusIcon = task.status === 'completed' ? '✅' : 
                                 task.status === 'failed' ? '❌' : '🔄';
                const label = `${statusIcon} ${task.story.substring(0, 50)}${task.story.length > 50 ? '...' : ''}`;
                return new AgenticTreeItem(label, vscode.TreeItemCollapsibleState.Collapsed, 'historyItem', undefined, task);
            });

            return Promise.resolve(items);
        } else if (element.contextValue === 'historyItem' && element.taskData) {
            // Show task details
            const task = element.taskData;
            const items: AgenticTreeItem[] = [];
            
            items.push(new AgenticTreeItem(`📅 ${task.timestamp.toLocaleString()}`, vscode.TreeItemCollapsibleState.None, 'detailItem'));
            
            if (task.filesModified.length > 0) {
                items.push(new AgenticTreeItem('📁 Files Modified:', vscode.TreeItemCollapsibleState.Expanded, 'filesHeader'));
                task.filesModified.forEach(file => {
                    items.push(new AgenticTreeItem(`  📄 ${path.basename(file)}`, vscode.TreeItemCollapsibleState.None, 'fileItem'));
                });
            }

            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}

class AgenticTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly command?: vscode.Command,
        public readonly taskData?: TaskHistoryItem
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        
        // Set icons based on context
        switch (contextValue) {
            case 'startItem':
                this.iconPath = new vscode.ThemeIcon('play');
                break;
            case 'webviewItem':
                this.iconPath = new vscode.ThemeIcon('window');
                break;
            case 'statusItem':
                this.iconPath = new vscode.ThemeIcon('pulse');
                break;
            case 'taskItem':
                this.iconPath = new vscode.ThemeIcon('loading');
                break;
            case 'historyItem':
                this.iconPath = new vscode.ThemeIcon('history');
                break;
            case 'fileItem':
                this.iconPath = new vscode.ThemeIcon('file');
                break;
            case 'filesHeader':
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    // Global socket reference for cleanup
    let globalSocket: WebSocket | null = null;

    // Initialize tree data providers
    const historyProvider = new AgenticHistoryProvider();

    // Helper functions for communication between providers
    function updateConnectionStatus(status: 'connected' | 'disconnected' | 'connecting') {
        // Status is now handled in the webview
    }

    function updateCurrentTask(task: string | null) {
        // Task status is now handled in the webview
    }

    function addToHistory(story: string, status: 'completed' | 'failed' | 'running', filesModified: string[] = []) {
        const historyItem: TaskHistoryItem = {
            id: Date.now().toString(),
            story,
            timestamp: new Date(),
            status,
            filesModified
        };
        historyProvider.addTask(historyItem);
    }

    // Initialize webview provider for chat view
    const chatViewProvider = new AgenticChatViewProvider(
        context.extensionUri,
        updateConnectionStatus,
        updateCurrentTask,
        addToHistory
    );

    // Register webview provider
    const chatViewDisposable = vscode.window.registerWebviewViewProvider(
        AgenticChatViewProvider.viewType,
        chatViewProvider
    );

    // Register tree data providers for history
    const historyViewDisposable = vscode.window.createTreeView('agentic.historyView', {
        treeDataProvider: historyProvider,
        showCollapseAll: true
    });

    // Set context to enable views
    vscode.commands.executeCommand('setContext', 'agentic:enabled', true);

    // Function to create webview panel
    function createWebviewPanel() {
        // Get configuration settings
        const config = vscode.workspace.getConfiguration('agentic');
        const serverUrl = config.get<string>('serverUrl', 'ws://localhost:8000');
        const autoOpenFiles = config.get<boolean>('autoOpenFiles', true);
        const showNotifications = config.get<boolean>('showNotifications', true);

        const panel = vscode.window.createWebviewPanel(
            'agenticWebview',
            'Agentic Assistant',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'webview-ui'))
                ],
                retainContextWhenHidden: true
            }
        );

        // Enhanced HTML loading with error handling
        const htmlPath = path.join(context.extensionPath, 'webview-ui', 'index.html');
        try {
            panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load webview: ${error}`);
            return;
        }

        // Helper function to send structured messages to webview
        function sendToWebview(data: AgentMessage) {
            panel.webview.postMessage({ command: 'log', data });
        }

        // Helper function to highlight files being modified
        async function highlightModifiedFile(filePath: string) {
            if (!showNotifications) return; // Respect user settings
            
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const fullPath = path.isAbsolute(filePath) 
                        ? filePath 
                        : path.join(workspaceFolder.uri.fsPath, filePath);
                    
                    const uri = vscode.Uri.file(fullPath);
                    
                    // Check if file exists, if not we'll create a notification
                    if (fs.existsSync(fullPath)) {
                        // Optionally open the file in the editor based on settings
                        if (autoOpenFiles) {
                            const document = await vscode.workspace.openTextDocument(uri);
                            await vscode.window.showTextDocument(document, { preview: true });
                        }
                        
                        // Show a subtle notification
                        vscode.window.showInformationMessage(
                            `📝 File updated: ${path.basename(filePath)}`,
                            'View File'
                        ).then(selection => {
                            if (selection === 'View File') {
                                vscode.workspace.openTextDocument(uri).then(doc => {
                                    vscode.window.showTextDocument(doc);
                                });
                            }
                        });
                    } else {
                        vscode.window.showInformationMessage(
                            `📄 New file created: ${path.basename(filePath)}`,
                            'View File'
                        ).then(selection => {
                            if (selection === 'View File') {
                                // Wait a moment for the file to be created by the backend
                                setTimeout(() => {
                                    if (fs.existsSync(fullPath)) {
                                        vscode.workspace.openTextDocument(uri).then(doc => {
                                            vscode.window.showTextDocument(doc);
                                        });
                                    }
                                }, 1000);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error highlighting file:', error);
            }
        }

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'startStory':
                        const story = message.story;
                        const projectDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '.';

                        // Update sidebar status
                        updateConnectionStatus('connecting');
                        updateCurrentTask(story);
                        addToHistory(story, 'running');

                        try {
                            // Close existing socket if any
                            if (globalSocket) {
                                globalSocket.close();
                            }

                            // Send immediate feedback to webview
                            sendToWebview({ 
                                status: 'CONNECTING', 
                                message: 'Establishing connection to agent server...',
                                agent: 'Connection Manager'
                            });

                            const socket = new WebSocket(`${serverUrl}/ws/agent`);
                            globalSocket = socket;

                            socket.onopen = () => {
                                updateConnectionStatus('connected');
                                sendToWebview({ 
                                    status: 'CONNECTED', 
                                    message: 'Successfully connected to agent server',
                                    agent: 'Connection Manager'
                                });
                                
                                sendToWebview({
                                    status: 'PROCESSING',
                                    message: `Sending user story: "${story}"`,
                                    agent: 'Story Processor'
                                });
                                
                                socket.send(JSON.stringify({
                                    story: story,
                                    project_dir: projectDir
                                }));
                            };

                            const modifiedFiles: string[] = [];

                            socket.onmessage = async (event: any) => {
                                try {
                                    const data: AgentMessage = JSON.parse(event.data.toString());
                                    
                                    // Enhanced message processing
                                    if (data.status) {
                                        data.status = data.status.toUpperCase();
                                        
                                        // Special handling for file operations
                                        if (data.file || data.filename) {
                                            const fileName = data.file || data.filename;
                                            if (fileName) {
                                                data.status = 'FILE_UPDATE';
                                                data.message = data.message || `Modifying file: ${fileName}`;
                                                modifiedFiles.push(fileName);
                                                
                                                // Highlight the file being modified
                                                await highlightModifiedFile(fileName);
                                            }
                                        }
                                        
                                        // Handle multiple files modified
                                        if (data.files_modified && Array.isArray(data.files_modified)) {
                                            for (const file of data.files_modified) {
                                                modifiedFiles.push(file);
                                                await highlightModifiedFile(file);
                                                sendToWebview({
                                                    status: 'FILE_UPDATE',
                                                    message: `Updated file: ${path.basename(file)}`,
                                                    file: file,
                                                    agent: 'File Manager'
                                                });
                                            }
                                        }
                                        
                                        // Determine agent based on status
                                        if (!data.agent) {
                                            switch (data.status) {
                                                case 'ANALYZING':
                                                case 'FILE_ANALYSIS':
                                                    data.agent = 'Code Analyzer';
                                                    break;
                                                case 'GENERATING':
                                                case 'CODE_GENERATION':
                                                    data.agent = 'Code Generator';
                                                    break;
                                                case 'WRITING':
                                                case 'FILE_UPDATE':
                                                    data.agent = 'File Manager';
                                                    break;
                                                case 'COMPLETED':
                                                    data.agent = 'Task Manager';
                                                    updateCurrentTask(null);
                                                    addToHistory(story, 'completed', modifiedFiles);
                                                    break;
                                                case 'ERROR':
                                                    data.agent = 'Error Handler';
                                                    updateCurrentTask(null);
                                                    addToHistory(story, 'failed', modifiedFiles);
                                                    break;
                                                default:
                                                    data.agent = 'AI Agent';
                                            }
                                        }
                                    }
                                    
                                    sendToWebview(data);
                                    
                                } catch (parseError) {
                                    console.error('Error parsing agent message:', parseError);
                                    sendToWebview({
                                        status: 'ERROR',
                                        message: `Failed to parse agent response: ${event.data}`,
                                        agent: 'Error Handler'
                                    });
                                }
                            };

                            socket.onerror = (err: any) => {
                                const errorMsg = `WebSocket connection failed. Make sure the agent server is running on ${serverUrl}`;
                                vscode.window.showErrorMessage(errorMsg);
                                updateConnectionStatus('disconnected');
                                updateCurrentTask(null);
                                sendToWebview({ 
                                    status: 'ERROR', 
                                    message: errorMsg,
                                    agent: 'Connection Manager'
                                });
                            };

                            socket.onclose = (event) => {
                                const closeMsg = event.wasClean 
                                    ? 'Connection closed normally' 
                                    : 'Connection lost unexpectedly';
                                    
                                updateConnectionStatus('disconnected');
                                updateCurrentTask(null);
                                sendToWebview({ 
                                    status: 'CLOSED', 
                                    message: closeMsg,
                                    agent: 'Connection Manager'
                                });
                                
                                globalSocket = null;
                            };

                        } catch (err) {
                            const errorMsg = 'Failed to establish connection: ' + err;
                            vscode.window.showErrorMessage(errorMsg);
                            updateConnectionStatus('disconnected');
                            updateCurrentTask(null);
                            sendToWebview({ 
                                status: 'ERROR', 
                                message: errorMsg,
                                agent: 'Connection Manager'
                            });
                        }
                        return;
                        
                    case 'showError':
                        vscode.window.showErrorMessage(message.message);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        // Clean up on panel disposal
        panel.onDidDispose(() => {
            if (globalSocket) {
                globalSocket.close();
                globalSocket = null;
            }
            updateConnectionStatus('disconnected');
            updateCurrentTask(null);
        });
    }

    // Refresh command
    let refreshDisposable = vscode.commands.registerCommand('agentic.refresh', () => {
        historyProvider.refresh();
        vscode.window.showInformationMessage('🔄 Agentic Assistant refreshed');
    });

    // Clear history command
    let clearHistoryDisposable = vscode.commands.registerCommand('agentic.clearHistory', () => {
        historyProvider.clearHistory();
        vscode.window.showInformationMessage('🗑️ Task history cleared');
    });

    // Open panel command (opens the full webview)
    let openPanelDisposable = vscode.commands.registerCommand('agentic.openPanel', () => {
        createWebviewPanel();
    });

    // Register main start command (opens full webview)
    let startDisposable = vscode.commands.registerCommand('agentic.start', () => {
        createWebviewPanel();
    });

    // Command to show webview (main interface) - opens full webview
    let showWebviewDisposable = vscode.commands.registerCommand('agentic.showWebview', () => {
        createWebviewPanel();
    });

    // Stop command
    let stopDisposable = vscode.commands.registerCommand('agentic.stop', () => {
        // Close any active WebSocket connections
        chatViewProvider.cleanup();
        if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
            globalSocket.close();
            vscode.window.showInformationMessage('🛑 Agentic Assistant stopped');
        } else {
            vscode.window.showInformationMessage('ℹ️ No active Agentic Assistant session');
        }
    });

    // Register all disposables
    context.subscriptions.push(
        chatViewDisposable,
        historyViewDisposable,
        startDisposable,
        stopDisposable,
        showWebviewDisposable,
        refreshDisposable,
        clearHistoryDisposable,
        openPanelDisposable
    );

    // Cleanup on deactivation
    context.subscriptions.push({
        dispose: () => {
            chatViewProvider.cleanup();
            if (globalSocket) {
                globalSocket.close();
            }
        }
    });
}

export function deactivate() {
    // Clean up any remaining connections
}
