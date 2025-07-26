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

export function activate(context: vscode.ExtensionContext) {
    // Global socket reference for cleanup
    let globalSocket: WebSocket | null = null;

    let disposable = vscode.commands.registerCommand('agentic.start', () => {
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

        let currentSocket: WebSocket | null = null;

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
                                                
                                                // Highlight the file being modified
                                                await highlightModifiedFile(fileName);
                                            }
                                        }
                                        
                                        // Handle multiple files modified
                                        if (data.files_modified && Array.isArray(data.files_modified)) {
                                            for (const file of data.files_modified) {
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
                                                    break;
                                                case 'ERROR':
                                                    data.agent = 'Error Handler';
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
        });
    });

    context.subscriptions.push(disposable);

    // Add stop command
    let stopDisposable = vscode.commands.registerCommand('agentic.stop', () => {
        // Close any active WebSocket connections
        if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
            globalSocket.close();
            vscode.window.showInformationMessage('🛑 Agentic Assistant stopped');
        } else {
            vscode.window.showInformationMessage('ℹ️ No active Agentic Assistant session');
        }
    });

    context.subscriptions.push(stopDisposable);
}

export function deactivate() {
    // Clean up any remaining connections
}