"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ws_1 = __importDefault(require("ws"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('agentic.start', () => {
        const panel = vscode.window.createWebviewPanel('agenticWebview', 'Agentic Assistant', vscode.ViewColumn.One, {
            enableScripts: true
        });
        const htmlPath = path.join(context.extensionPath, 'webview-ui', 'index.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');
        panel.webview.onDidReceiveMessage(async (message) => {
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
                        const socket = new ws_1.default('ws://127.0.0.1:8000/ws/agent');
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
                        socket.onmessage = (event) => {
                            const data = JSON.parse(event.data.toString());
                            panel.webview.postMessage({ command: 'log', data: data });
                        };
                        socket.onerror = (err) => {
                            const errorMsg = 'WebSocket error: Make sure the agent server is running on ws://127.0.0.1:8000';
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
                    }
                    catch (err) {
                        const errorMsg = 'Connection failed: ' + err;
                        vscode.window.showErrorMessage(errorMsg);
                        panel.webview.postMessage({
                            command: 'log',
                            data: { status: 'ERROR', message: errorMsg }
                        });
                    }
                    return;
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map