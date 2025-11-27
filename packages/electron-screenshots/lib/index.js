"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var events_1 = __importDefault(require("events"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var os_1 = __importDefault(require("os"));
var event_1 = __importDefault(require("./event"));
var getDisplay_1 = require("./getDisplay");
var padStart_1 = __importDefault(require("./padStart"));
var Screenshots = /** @class */ (function (_super) {
    __extends(Screenshots, _super);
    function Screenshots(opts) {
        var _this = this;
        var _a;
        _this = _super.call(this) || this;
        // 截图窗口对象
        _this.$wins = new Map();
        _this.$views = new Map();
        // 记录当前使用的临时文件，用于清理
        _this.tempFiles = new Set();
        _this.isReady = new Promise(function (resolve) {
            electron_1.ipcMain.once('SCREENSHOTS:ready', function () {
                _this.logger('SCREENSHOTS:ready');
                resolve();
            });
        });
        // 强制使用 console.log 以便调试，除非用户指定了自定义 logger
        _this.logger = (opts === null || opts === void 0 ? void 0 : opts.logger)
            || (function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                // eslint-disable-next-line no-console
                console.log.apply(console, __spreadArray(['[electron-screenshots]'], args, false));
            });
        _this.singleWindow = (_a = opts === null || opts === void 0 ? void 0 : opts.singleWindow) !== null && _a !== void 0 ? _a : true; // Default to true for performance
        _this.listenIpc();
        if (opts === null || opts === void 0 ? void 0 : opts.lang) {
            _this.setLang(opts.lang);
        }
        if (_this.singleWindow) {
            // Pre-create window to speed up first capture
            // We need a dummy display or primary display to create it
            // But createWindow requires a display.
            // We can defer it or just let the first capture be slightly slower but subsequent ones fast.
            // Or we can just rely on singleWindow reuse.
        }
        // 清理旧的临时文件
        _this.cleanupOldTempFiles();
        return _this;
    }
    /**
     * 清理旧的临时文件
     */
    Screenshots.prototype.cleanupOldTempFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tempDir_1, files, now_1, err_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        tempDir_1 = path_1.default.join(os_1.default.tmpdir(), 'electron-screenshots');
                        return [4 /*yield*/, fs_extra_1.default.pathExists(tempDir_1)];
                    case 1:
                        if (!_a.sent()) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs_extra_1.default.readdir(tempDir_1)];
                    case 2:
                        files = _a.sent();
                        now_1 = Date.now();
                        // 清理超过1小时的文件
                        return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(_this, void 0, void 0, function () {
                                var filePath, stats;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            filePath = path_1.default.join(tempDir_1, file);
                                            return [4 /*yield*/, fs_extra_1.default.stat(filePath)];
                                        case 1:
                                            stats = _a.sent();
                                            if (!(now_1 - stats.mtimeMs > 60 * 60 * 1000)) return [3 /*break*/, 3];
                                            return [4 /*yield*/, fs_extra_1.default.remove(filePath)];
                                        case 2:
                                            _a.sent();
                                            this.logger('Cleaned up old temp file:', filePath);
                                            _a.label = 3;
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 3:
                        // 清理超过1小时的文件
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        err_1 = _a.sent();
                        this.logger('Failed to cleanup old temp files:', err_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 开始截图
     */
    Screenshots.prototype.startCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            var displays, captures;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger('startCapture');
                        displays = (0, getDisplay_1.getAllDisplays)();
                        return [4 /*yield*/, Promise.all(displays.map(function (display) { return _this.capture(display)
                                .then(function (url) { return ({ display: display, url: url }); })
                                .catch(function (err) {
                                _this.logger("Failed to capture display ".concat(display.id, ":"), err);
                                return null;
                            }); }))];
                    case 1:
                        captures = _a.sent();
                        // 等待所有窗口创建完成
                        return [4 /*yield*/, Promise.all(captures.map(function (cap) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!cap) return [3 /*break*/, 2];
                                            return [4 /*yield*/, this.createWindow(cap.display)];
                                        case 1:
                                            _a.sent();
                                            _a.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        // 等待所有窗口创建完成
                        _a.sent();
                        // 延迟发送截图数据，确保React应用已经ready并注册了事件监听器
                        return [4 /*yield*/, Promise.race([
                                this.isReady,
                                new Promise(function (resolve) {
                                    setTimeout(function () { return resolve(undefined); }, 500);
                                }),
                            ])];
                    case 3:
                        // 延迟发送截图数据，确保React应用已经ready并注册了事件监听器
                        _a.sent();
                        // 再等待一小段时间，确保React应用完全初始化
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(function () { return resolve(undefined); }, 200);
                            })];
                    case 4:
                        // 再等待一小段时间，确保React应用完全初始化
                        _a.sent();
                        // 现在发送截图数据
                        this.logger('Now sending screenshot data to all displays...');
                        captures.forEach(function (cap) {
                            if (cap) {
                                var view = _this.$views.get(cap.display.id);
                                _this.logger('Sending screenshot data to display', cap.display.id, 'url length:', cap.url.length);
                                view === null || view === void 0 ? void 0 : view.webContents.send('SCREENSHOTS:capture', cap.display, cap.url);
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 结束截图
     */
    Screenshots.prototype.endCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger('endCapture');
                        return [4 /*yield*/, this.reset()];
                    case 1:
                        _a.sent();
                        // Iterate over all windows
                        this.$wins.forEach(function (win, id) {
                            var view = _this.$views.get(id);
                            if (win && !win.isDestroyed()) {
                                win.setKiosk(false);
                                win.blur();
                                win.blurWebView();
                                win.unmaximize();
                                if (view) {
                                    win.removeBrowserView(view);
                                }
                                if (_this.singleWindow) {
                                    win.hide();
                                }
                                else {
                                    win.destroy();
                                }
                            }
                        });
                        if (!this.singleWindow) {
                            this.$wins.clear();
                            this.$views.clear();
                        }
                        // 清理本次截图产生的临时文件
                        this.cleanupCurrentTempFiles();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 清理当前截图产生的临时文件
     */
    Screenshots.prototype.cleanupCurrentTempFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = Array.from(this.tempFiles);
                        return [4 /*yield*/, Promise.all(files.map(function (tempFile) { return __awaiter(_this, void 0, void 0, function () {
                                var err_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 4, , 5]);
                                            return [4 /*yield*/, fs_extra_1.default.pathExists(tempFile)];
                                        case 1:
                                            if (!_a.sent()) return [3 /*break*/, 3];
                                            return [4 /*yield*/, fs_extra_1.default.remove(tempFile)];
                                        case 2:
                                            _a.sent();
                                            this.logger('Cleaned up temp file:', tempFile);
                                            _a.label = 3;
                                        case 3: return [3 /*break*/, 5];
                                        case 4:
                                            err_2 = _a.sent();
                                            this.logger('Failed to cleanup temp file:', tempFile, err_2);
                                            return [3 /*break*/, 5];
                                        case 5: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        this.tempFiles.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 设置语言
     */
    Screenshots.prototype.setLang = function (lang) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger('setLang', lang);
                        return [4 /*yield*/, this.isReady];
                    case 1:
                        _a.sent();
                        this.$views.forEach(function (view) {
                            view.webContents.send('SCREENSHOTS:setLang', lang);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Screenshots.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // 重置截图区域
                        this.$views.forEach(function (view) {
                            view.webContents.send('SCREENSHOTS:reset');
                        });
                        // 保证 UI 有足够的时间渲染
                        return [4 /*yield*/, Promise.race([
                                new Promise(function (resolve) {
                                    setTimeout(function () { return resolve(); }, 100);
                                }),
                                new Promise(function (resolve) {
                                    electron_1.ipcMain.once('SCREENSHOTS:reset', function () { return resolve(); });
                                }),
                            ])];
                    case 1:
                        // 保证 UI 有足够的时间渲染
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 初始化窗口
     */
    /**
     * 初始化窗口
     */
    Screenshots.prototype.createWindow = function (display) {
        return __awaiter(this, void 0, void 0, function () {
            var win, view, windowTypes, htmlPath, reactScreenshotsPath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // 重置截图区域
                    return [4 /*yield*/, this.reset()];
                    case 1:
                        // 重置截图区域
                        _a.sent();
                        win = this.$wins.get(display.id);
                        view = this.$views.get(display.id);
                        if (!win || win.isDestroyed()) {
                            windowTypes = {
                                darwin: 'panel',
                                // linux 必须设置为 undefined，否则会在部分系统上不能触发focus 事件
                                // https://github.com/nashaofu/screenshots/issues/203#issuecomment-1518923486
                                linux: undefined,
                                win32: 'toolbar',
                            };
                            win = new electron_1.BrowserWindow({
                                title: 'screenshots',
                                x: display.x,
                                y: display.y,
                                width: display.width,
                                height: display.height,
                                useContentSize: true,
                                type: windowTypes[process.platform],
                                frame: false,
                                show: false,
                                autoHideMenuBar: true,
                                transparent: true,
                                resizable: false,
                                movable: false,
                                minimizable: false,
                                maximizable: false,
                                // focusable 必须设置为 true, 否则窗口不能及时响应esc按键，输入框也不能输入
                                focusable: true,
                                skipTaskbar: true,
                                alwaysOnTop: true,
                                /**
                                 * linux 下必须设置为false，否则不能全屏显示在最上层
                                 * mac 下设置为false，否则可能会导致程序坞不恢复问题，且与 kiosk 模式冲突
                                 */
                                fullscreen: false,
                                // mac fullscreenable 设置为 true 会导致应用崩溃
                                fullscreenable: false,
                                kiosk: false,
                                backgroundColor: '#00000000',
                                titleBarStyle: 'hidden',
                                hasShadow: false,
                                paintWhenInitiallyHidden: false,
                                // mac 特有的属性
                                roundedCorners: false,
                                enableLargerThanScreen: false,
                                acceptFirstMouse: true,
                            });
                            this.$wins.set(display.id, win);
                            this.emit('windowCreated', win);
                            win.on('show', function () {
                                // focus 在 did-finish-load 中处理
                                // kiosk 也在那里处理
                            });
                            win.on('closed', function () {
                                _this.emit('windowClosed', win);
                                _this.$wins.delete(display.id);
                                _this.$views.delete(display.id);
                            });
                        }
                        if (!view) {
                            view = new electron_1.BrowserView({
                                webPreferences: {
                                    preload: require.resolve('./preload.js'),
                                    nodeIntegration: false,
                                    contextIsolation: true,
                                },
                            });
                            // 保存视图
                            this.$views.set(display.id, view);
                            htmlPath = void 0;
                            try {
                                reactScreenshotsPath = require.resolve('react-screenshots');
                                htmlPath = path_1.default.join(path_1.default.dirname(reactScreenshotsPath), '../electron/electron.html');
                            }
                            catch (err) {
                                // 如果找不到包，使用相对路径（开发环境）
                                htmlPath = path_1.default.join(__dirname, '../../react-screenshots/electron/electron.html');
                            }
                            this.logger('Loading UI from:', htmlPath);
                            // 监听加载失败
                            view.webContents.on('did-fail-load', function (event, errorCode, errorDescription, validatedURL) {
                                _this.logger('UI failed to load:', errorCode, errorDescription, validatedURL);
                            });
                            // 监听资源加载失败
                            view.webContents.session.webRequest.onErrorOccurred(function (details) {
                                _this.logger('Resource load error:', details.url, details.error);
                            });
                            // 监听控制台消息 (0=log, 1=info, 2=warn, 3=error)
                            view.webContents.on('console-message', function (event, level, message, line, sourceId) {
                                var levelNames = ['log', 'info', 'warn', 'error'];
                                _this.logger("UI Console [".concat(levelNames[level] || level, "]:"), message, line > 0 ? "(".concat(sourceId, ":").concat(line, ")") : '');
                            });
                            view.webContents.loadURL("file://".concat(htmlPath));
                            // 等待 UI 加载完成后再把 view 加到窗口并显示
                            view.webContents.once('did-finish-load', function () {
                                _this.logger('UI loaded successfully');
                                win.setBrowserView(view);
                                win.show();
                                // 先获得焦点，再启用 kiosk 模式
                                win.focus();
                                win.moveTop();
                                // 延迟启用 kiosk 模式，确保焦点已获得
                                setTimeout(function () {
                                    // 重新设置 BrowserView 的 bounds，确保正确
                                    view.setBounds({
                                        x: 0,
                                        y: 0,
                                        width: display.width,
                                        height: display.height,
                                    });
                                    win.setKiosk(true);
                                    win.focus(); // 再次确保窗口焦点
                                    view.webContents.focus(); // 再次确保BrowserView焦点
                                    _this.logger('Window focused, moved to top, and kiosk enabled');
                                }, 100);
                                // 开启开发者工具查看错误（暂时关闭以测试焦点问题）
                                // view!.webContents.openDevTools();
                                // 延迟检查DOM是否正确渲染和事件监听
                                setTimeout(function () {
                                    view.webContents
                                        .executeJavaScript("\n            const app = document.getElementById('app');\n            const screenshotDiv = document.querySelector('.screenshots');\n            const result = {\n              appExists: !!app,\n              appHasChildren: app ? app.children.length > 0 : false,\n              appInnerHTML: app ? app.innerHTML.substring(0, 200) : 'no app element',\n              bodyChildren: document.body.children.length,\n              scriptsCount: document.querySelectorAll('script').length,\n              hasReact: typeof window.React !== 'undefined',\n              screenshotsElement: !!screenshotDiv,\n              hasMouseListeners: screenshotDiv ? 'onmousedown' in screenshotDiv : false,\n              windowFocused: document.hasFocus()\n            };\n            console.log('DOM Check:', JSON.stringify(result, null, 2));\n            \n            // \u6D4B\u8BD5\u70B9\u51FB\u4E8B\u4EF6 - \u5728\u591A\u4E2A\u5C42\u7EA7\u76D1\u542C\n            if (screenshotDiv) {\n              const testClick = (e) => {\n                console.log('\uD83C\uDF89 Mouse click detected on screenshotDiv!', e.target.className);\n              };\n              screenshotDiv.addEventListener('mousedown', testClick, {once: false, capture: true});\n              \n              // \u4E5F\u5728 document \u7EA7\u522B\u76D1\u542C\n              document.addEventListener('mousedown', (e) => {\n                console.log('\uD83C\uDFAF Document mousedown:', e.target.tagName, e.target.className);\n              }, {once: false, capture: true});\n              \n              // \u76D1\u542C\u6240\u6709\u9F20\u6807\u4E8B\u4EF6\n              ['mousemove', 'mouseenter', 'mouseover'].forEach(eventType => {\n                document.addEventListener(eventType, () => {\n                  console.log('\uD83D\uDC46 Mouse event:', eventType);\n                }, {once: true, capture: true});\n              });\n            }\n            \n            result;\n          ")
                                        .then(function (result) {
                                        _this.logger('DOM Check Result:', result);
                                    })
                                        .catch(function (err) {
                                        _this.logger('DOM Check Error:', err);
                                    });
                                }, 1000);
                            });
                        }
                        else {
                            // 已有 view，直接绑定并显示窗口
                            win.setBrowserView(view);
                            win.show();
                            win.focus();
                            win.moveTop();
                            // 延迟启用 kiosk 模式
                            setTimeout(function () {
                                // 重新设置 BrowserView 的 bounds，确保正确
                                view.setBounds({
                                    x: 0,
                                    y: 0,
                                    width: display.width,
                                    height: display.height,
                                });
                                win.setKiosk(true);
                                win.focus();
                                view.webContents.focus(); // 确保BrowserView的webContents也获得焦点
                                _this.logger('Reused window focused, moved to top, and kiosk enabled');
                            }, 100);
                        }
                        // 适定平台
                        if (process.platform === 'darwin') {
                            win.setWindowButtonVisibility(false);
                        }
                        if (process.platform !== 'win32') {
                            win.setVisibleOnAllWorkspaces(true, {
                                visibleOnFullScreen: true,
                                skipTransformProcessType: true,
                            });
                        }
                        // 不要blur，否则窗口无法接收键盘和鼠标事件
                        // win.blur();
                        win.setBounds(display);
                        view.setBounds({
                            x: 0,
                            y: 0,
                            width: display.width,
                            height: display.height,
                        });
                        win.setAlwaysOnTop(true);
                        // 诊断信息：确认窗口和view的状态
                        setTimeout(function () {
                            _this.logger('Window bounds:', win.getBounds());
                            _this.logger('View bounds:', view.getBounds());
                            _this.logger('Window is visible:', win.isVisible());
                            _this.logger('Window is focused:', win.isFocused());
                            _this.logger('BrowserView attached:', win.getBrowserViews().length);
                        }, 200);
                        return [2 /*return*/];
                }
            });
        });
    };
    Screenshots.prototype.capture = function (display) {
        return __awaiter(this, void 0, void 0, function () {
            var Monitor, monitor, image, buffer, tempDir, tempFile, err_3, sources, source, pngBuffer, tempDir, tempFile;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger('SCREENSHOTS:capture');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 11]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('node-screenshots')); })];
                    case 2:
                        Monitor = (_a.sent()).Monitor;
                        monitor = Monitor.fromPoint(display.x + display.width / 2, display.y + display.height / 2);
                        this.logger('SCREENSHOTS:capture Monitor.fromPoint arguments %o', display);
                        this.logger('SCREENSHOTS:capture Monitor.fromPoint return %o', {
                            id: monitor === null || monitor === void 0 ? void 0 : monitor.id,
                            name: monitor === null || monitor === void 0 ? void 0 : monitor.name,
                            x: monitor === null || monitor === void 0 ? void 0 : monitor.x,
                            y: monitor === null || monitor === void 0 ? void 0 : monitor.y,
                            width: monitor === null || monitor === void 0 ? void 0 : monitor.width,
                            height: monitor === null || monitor === void 0 ? void 0 : monitor.height,
                            rotation: monitor === null || monitor === void 0 ? void 0 : monitor.rotation,
                            scaleFactor: monitor === null || monitor === void 0 ? void 0 : monitor.scaleFactor,
                            frequency: monitor === null || monitor === void 0 ? void 0 : monitor.frequency,
                            isPrimary: monitor === null || monitor === void 0 ? void 0 : monitor.isPrimary,
                        });
                        if (!monitor) {
                            throw new Error("Monitor.fromDisplay(".concat(display.id, ") get null"));
                        }
                        return [4 /*yield*/, monitor.captureImage()];
                    case 3:
                        image = _a.sent();
                        return [4 /*yield*/, image.toPng(true)];
                    case 4:
                        buffer = _a.sent();
                        tempDir = path_1.default.join(os_1.default.tmpdir(), 'electron-screenshots');
                        return [4 /*yield*/, fs_extra_1.default.ensureDir(tempDir)];
                    case 5:
                        _a.sent();
                        tempFile = path_1.default.join(tempDir, "screenshot-".concat(display.id, "-").concat(Date.now(), ".png"));
                        return [4 /*yield*/, fs_extra_1.default.writeFile(tempFile, buffer)];
                    case 6:
                        _a.sent();
                        this.tempFiles.add(tempFile); // 记录临时文件用于后续清理
                        this.logger('Screenshot saved to temp file:', tempFile, 'size:', buffer.length);
                        return [2 /*return*/, "file://".concat(tempFile)];
                    case 7:
                        err_3 = _a.sent();
                        this.logger('SCREENSHOTS:capture Monitor capture() error %o', err_3);
                        return [4 /*yield*/, electron_1.desktopCapturer.getSources({
                                types: ['screen'],
                                thumbnailSize: {
                                    width: display.width * display.scaleFactor,
                                    height: display.height * display.scaleFactor,
                                },
                            })];
                    case 8:
                        sources = _a.sent();
                        source = void 0;
                        // Linux系统上，screen.getDisplayNearestPoint 返回的 Display 对象的 id
                        // 和这里 source 对象上的 display_id(Linux上，这个值是空字符串) 或 id 的中间部分，都不一致
                        // 但是，如果只有一个显示器的话，其实不用判断，直接返回就行
                        if (sources.length === 1) {
                            source = sources[0];
                        }
                        else {
                            source = sources.find(function (item) { return item.display_id === display.id.toString()
                                || item.id.startsWith("screen:".concat(display.id, ":")); });
                        }
                        if (!source) {
                            this.logger("SCREENSHOTS:capture Can't find screen source. sources: %o, display: %o", sources, display);
                            throw new Error("Can't find screen source");
                        }
                        pngBuffer = source.thumbnail.toPNG();
                        tempDir = path_1.default.join(os_1.default.tmpdir(), 'electron-screenshots');
                        return [4 /*yield*/, fs_extra_1.default.ensureDir(tempDir)];
                    case 9:
                        _a.sent();
                        tempFile = path_1.default.join(tempDir, "screenshot-".concat(display.id, "-").concat(Date.now(), ".png"));
                        return [4 /*yield*/, fs_extra_1.default.writeFile(tempFile, pngBuffer)];
                    case 10:
                        _a.sent();
                        this.tempFiles.add(tempFile); // 记录临时文件用于后续清理
                        this.logger('Screenshot saved to temp file (desktopCapturer):', tempFile, 'size:', pngBuffer.length);
                        return [2 /*return*/, "file://".concat(tempFile)];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 绑定ipc时间处理
     */
    Screenshots.prototype.listenIpc = function () {
        var _this = this;
        /**
         * OK事件
         */
        electron_1.ipcMain.on('SCREENSHOTS:ok', function (e, buffer, data) {
            _this.logger('SCREENSHOTS:ok buffer.length %d, data: %o', buffer.length, data);
            var event = new event_1.default();
            _this.emit('ok', event, buffer, data);
            if (event.defaultPrevented) {
                return;
            }
            electron_1.clipboard.writeImage(electron_1.nativeImage.createFromBuffer(buffer));
            _this.endCapture();
        });
        /**
         * CANCEL事件
         */
        electron_1.ipcMain.on('SCREENSHOTS:cancel', function () {
            _this.logger('SCREENSHOTS:cancel');
            var event = new event_1.default();
            _this.emit('cancel', event);
            if (event.defaultPrevented) {
                return;
            }
            _this.endCapture();
        });
        /**
         * SAVE事件
         */
        electron_1.ipcMain.on('SCREENSHOTS:save', function (e, buffer, data) { return __awaiter(_this, void 0, void 0, function () {
            var event, win, time, year, month, date, hours, minutes, seconds, milliseconds, _a, canceled, filePath;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger('SCREENSHOTS:save buffer.length %d, data: %o', buffer.length, data);
                        event = new event_1.default();
                        this.emit('save', event, buffer, data);
                        if (event.defaultPrevented) {
                            return [2 /*return*/];
                        }
                        this.$views.forEach(function (view, id) {
                            if (view.webContents === e.sender) {
                                win = _this.$wins.get(id);
                            }
                        });
                        if (!win) {
                            return [2 /*return*/];
                        }
                        time = new Date();
                        year = time.getFullYear();
                        month = (0, padStart_1.default)(time.getMonth() + 1, 2, '0');
                        date = (0, padStart_1.default)(time.getDate(), 2, '0');
                        hours = (0, padStart_1.default)(time.getHours(), 2, '0');
                        minutes = (0, padStart_1.default)(time.getMinutes(), 2, '0');
                        seconds = (0, padStart_1.default)(time.getSeconds(), 2, '0');
                        milliseconds = (0, padStart_1.default)(time.getMilliseconds(), 3, '0');
                        win.setAlwaysOnTop(false);
                        return [4 /*yield*/, electron_1.dialog.showSaveDialog(win, {
                                defaultPath: "".concat(year).concat(month).concat(date).concat(hours).concat(minutes).concat(seconds).concat(milliseconds, ".png"),
                                filters: [
                                    { name: 'Image (png)', extensions: ['png'] },
                                    { name: 'All Files', extensions: ['*'] },
                                ],
                            })];
                    case 1:
                        _a = _b.sent(), canceled = _a.canceled, filePath = _a.filePath;
                        if (!win) {
                            this.emit('afterSave', new event_1.default(), buffer, data, false); // isSaved = false
                            return [2 /*return*/];
                        }
                        win.setAlwaysOnTop(true);
                        if (canceled || !filePath) {
                            this.emit('afterSave', new event_1.default(), buffer, data, false); // isSaved = false
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fs_extra_1.default.writeFile(filePath, buffer)];
                    case 2:
                        _b.sent();
                        this.emit('afterSave', new event_1.default(), buffer, data, true); // isSaved = true
                        this.endCapture();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return Screenshots;
}(events_1.default));
exports.default = Screenshots;
