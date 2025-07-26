import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import WebSocket from 'ws';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('agentic.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'agenticWebview',
            'Agentic Assistant',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        const htmlPath = path.join(context.extensionPath, 'webview-ui', 'index.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'startStory':
                        const story = message.story;
                        const projectDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '.';

                        try {
                            // Send immediate feedback to webview
                            panel.webview.postMessage({ 
                                command: 'log', 
                                data: { status: 'CONNECTING', message: 'Connecting to agent server...' } 
                            });

                            const socket = new WebSocket('ws://localhost:8000/ws/agent');

                            socket.onopen = () => {
                                panel.webview.postMessage({ 
                                    command: 'log', 
                                    data: { status: 'CONNECTED', message: 'Connected to agent server' } 
                                });
                                
                                socket.send(JSON.stringify({
                                    story: story,
                                    project_dir: projectDir
                                }));
                            };

                            socket.onmessage = (event: any) => {
                                const data = JSON.parse(event.data.toString());
                                panel.webview.postMessage({ command: 'log', data: data });
                            };

                            socket.onerror = (err: any) => {
                                const errorMsg = 'WebSocket error: Make sure the agent server is running on ws://localhost:8000';
                                vscode.window.showErrorMessage(errorMsg);
                                panel.webview.postMessage({ 
                                    command: 'log', 
                                    data: { status: 'ERROR', message: errorMsg } 
                                });
                            };

                            socket.onclose = () => {
                                panel.webview.postMessage({ 
                                    command: 'log', 
                                    data: { status: 'CLOSED', message: 'Connection closed' } 
                                });
                            };

                        } catch (err) {
                            const errorMsg = 'Connection failed: ' + err;
                            vscode.window.showErrorMessage(errorMsg);
                            panel.webview.postMessage({ 
                                command: 'log', 
                                data: { status: 'ERROR', message: errorMsg } 
                            });
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}