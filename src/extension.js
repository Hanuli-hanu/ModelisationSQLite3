"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
var vscode = require("vscode");
var path = require("path");
var fs = require("fs");
function activate(context) {
    var _this = this;
    var disposable = vscode.commands.registerCommand('agentic.start', function () {
        var panel = vscode.window.createWebviewPanel('agenticWebview', 'Agentic Assistant', vscode.ViewColumn.One, {
            enableScripts: true
        });
        var htmlPath = path.join(context.extensionPath, 'webview-ui', 'index.html');
        panel.webview.html = fs.readFileSync(htmlPath, 'utf-8');
        panel.webview.onDidReceiveMessage(function (message) { return __awaiter(_this, void 0, void 0, function () {
            var story_1, projectDir_1, socket_1;
            var _a;
            return __generator(this, function (_b) {
                switch (message.command) {
                    case 'startStory':
                        story_1 = message.story;
                        projectDir_1 = ((_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0].uri.fsPath) || '.';
                        try {
                            socket_1 = new WebSocket('ws://localhost:8000/ws/agent');
                            socket_1.onopen = function () {
                                socket_1.send(JSON.stringify({
                                    story: story_1,
                                    project_dir: projectDir_1
                                }));
                            };
                            socket_1.onmessage = function (event) {
                                var data = JSON.parse(event.data);
                                panel.webview.postMessage({ command: 'log', data: data });
                            };
                            socket_1.onerror = function (err) {
                                vscode.window.showErrorMessage('WebSocket error: ' + err);
                            };
                            socket_1.onclose = function () {
                                panel.webview.postMessage({ command: 'log', data: { status: 'CLOSED' } });
                            };
                        }
                        catch (err) {
                            vscode.window.showErrorMessage('Connection failed: ' + err);
                        }
                        return [2 /*return*/];
                }
                return [2 /*return*/];
            });
        }); }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
