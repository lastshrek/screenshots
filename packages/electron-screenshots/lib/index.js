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
        var _a, _b;
        _this = _super.call(this) || this;
        // 截图窗口对象
        _this.$wins = new Map();
        _this.$views = new Map();
        // 记录当前使用的临时文件，用于清理
        _this.tempFiles = new Set();
        // 预加载的窗口和视图（用于加速启动）
        _this.preloadedWins = new Map();
        _this.preloadedViews = new Map();
        _this.preloadReady = new Map();
        // 缓存的截图源，避免多显示器时重复调用 desktopCapturer
        _this.cachedSources = null;
        _this.cachedSourcesTime = 0;
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
        _this.useKiosk = (_b = opts === null || opts === void 0 ? void 0 : opts.kiosk) !== null && _b !== void 0 ? _b : true;
        // 初始化 isReady
        _this.isReady = _this.createReadyPromise();
        _this.listenIpc();
        if (opts === null || opts === void 0 ? void 0 : opts.lang) {
            _this.setLang(opts.lang);
        }
        // 清理旧的临时文件（异步，不阻塞）
        _this.cleanupOldTempFiles();
        // 尽快预加载窗口（使用 setImmediate 在当前事件循环结束后立即执行）
        if (_this.singleWindow) {
            setImmediate(function () { return _this.preloadWindows(); });
        }
        return _this;
    }
    /**
     * 预加载窗口（后台静默创建，不显示）
     */
    Screenshots.prototype.preloadWindows = function () {
        return __awaiter(this, void 0, void 0, function () {
            var displays;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger('Preloading windows...');
                        displays = (0, getDisplay_1.getAllDisplays)();
                        // 串行创建预加载窗口，避免资源竞争
                        return [4 /*yield*/, displays.reduce(function (promise, display) { return promise.then(function () { return _this.createPreloadWindow(display); }); }, Promise.resolve())];
                    case 1:
                        // 串行创建预加载窗口，避免资源竞争
                        _a.sent();
                        this.logger('Windows preloaded');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 创建预加载窗口（隐藏状态）
     */
    Screenshots.prototype.createPreloadWindow = function (display) {
        return __awaiter(this, void 0, void 0, function () {
            var windowTypes, win, view, htmlPath, reactScreenshotsPath;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.preloadedWins.has(display.id)) {
                    return [2 /*return*/];
                }
                windowTypes = {
                    darwin: 'panel',
                    linux: undefined,
                    win32: undefined,
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
                    closable: false,
                    focusable: true,
                    skipTaskbar: true,
                    alwaysOnTop: true,
                    fullscreen: false,
                    fullscreenable: false,
                    kiosk: false,
                    backgroundColor: '#00000001',
                    hasShadow: false,
                    paintWhenInitiallyHidden: true,
                    roundedCorners: false,
                    enableLargerThanScreen: true,
                    acceptFirstMouse: true,
                });
                // macOS: 确保窗口在所有工作区可见，并覆盖 Dock
                if (process.platform === 'darwin') {
                    try {
                        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                    }
                    catch (_b) {
                        // 旧版本 Electron 可能不支持第二个参数
                        win.setVisibleOnAllWorkspaces(true);
                    }
                }
                view = new electron_1.BrowserView({
                    webPreferences: {
                        preload: require.resolve('./preload.js'),
                        nodeIntegration: false,
                        contextIsolation: true,
                    },
                });
                try {
                    reactScreenshotsPath = require.resolve('react-screenshots');
                    htmlPath = path_1.default.join(path_1.default.dirname(reactScreenshotsPath), '../electron/electron.html');
                }
                catch (err) {
                    htmlPath = path_1.default.join(__dirname, '../../react-screenshots/electron/electron.html');
                }
                win.setBrowserView(view);
                view.setBounds({
                    x: 0,
                    y: 0,
                    width: display.width,
                    height: display.height,
                });
                // 加载 UI
                view.webContents.loadURL("file://".concat(htmlPath));
                // 等待加载完成
                view.webContents.once('did-finish-load', function () {
                    _this.logger("Preload window ready for display ".concat(display.id));
                    _this.preloadReady.set(display.id, true);
                });
                this.preloadedWins.set(display.id, win);
                this.preloadedViews.set(display.id, view);
                win.on('closed', function () {
                    _this.preloadedWins.delete(display.id);
                    _this.preloadedViews.delete(display.id);
                    _this.preloadReady.delete(display.id);
                });
                return [2 /*return*/];
            });
        });
    };
    Screenshots.prototype.createReadyPromise = function () {
        var _this = this;
        return new Promise(function (resolve) {
            electron_1.ipcMain.once('SCREENSHOTS:ready', function () {
                _this.logger('SCREENSHOTS:ready');
                resolve();
            });
        });
    };
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
     * 检查屏幕录制权限
     * 注意：macOS 的权限状态可能有缓存，即使用户已授权，状态也可能不会立即更新
     * 因此这个方法只做日志记录，不阻止截图操作
     */
    Screenshots.prototype.checkScreenRecordingPermission = function () {
        if (process.platform !== 'darwin') {
            // 非 macOS 平台不需要检查
            this.logger('[Permission] Not macOS, skipping permission check');
            return true;
        }
        this.logger('[Permission] ========== macOS Permission Check ==========');
        this.logger('[Permission] Platform:', process.platform);
        this.logger('[Permission] Electron version:', process.versions.electron);
        this.logger('[Permission] Node version:', process.versions.node);
        var status = electron_1.systemPreferences.getMediaAccessStatus('screen');
        this.logger('[Permission] Screen recording status:', status);
        // macOS 权限状态说明：
        // - 'granted': 已授权
        // - 'denied': 用户明确拒绝
        // - 'restricted': 系统限制（如家长控制）
        // - 'not-determined': 尚未请求过权限
        //
        // 重要：即使状态显示 'denied'，也不应该阻止截图尝试，因为：
        // 1. 权限状态可能有缓存，用户授权后状态不会立即更新
        // 2. desktopCapturer.getSources() 会触发系统权限请求
        // 3. 让实际的截图操作去验证权限更可靠
        if (status === 'denied' || status === 'restricted') {
            this.logger('[Permission] ⚠️ Warning: Screen recording permission appears to be denied/restricted.');
            this.logger('[Permission] If you have already granted permission, try restarting the application.');
        }
        else if (status === 'granted') {
            this.logger('[Permission] ✅ Screen recording permission granted');
        }
        else if (status === 'not-determined') {
            this.logger('[Permission] ℹ️ Screen recording permission not yet requested');
        }
        this.logger('[Permission] ==========================================');
        // 始终返回 true，让实际截图操作去验证权限
        return true;
    };
    /**
     * 开始截图
     */
    Screenshots.prototype.startCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, escHandler, registered, displays, captureMap, validCaptures, cursorPoint, focusDisplay, focusWin;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger('startCapture');
                        startTime = Date.now();
                        // 检查屏幕录制权限（仅 macOS，仅做日志记录，不阻止截图）
                        if (process.platform === 'darwin') {
                            this.checkScreenRecordingPermission();
                        }
                        escHandler = function () {
                            _this.logger('Global ESC pressed, canceling capture');
                            var event = new event_1.default();
                            _this.emit('cancel', event);
                            if (event.defaultPrevented) {
                                return;
                            }
                            _this.endCapture();
                        };
                        try {
                            registered = electron_1.globalShortcut.register('Escape', escHandler);
                            if (!registered) {
                                this.logger('[Shortcut] Failed to register Escape shortcut');
                            }
                        }
                        catch (err) {
                            this.logger('[Shortcut] Error registering Escape shortcut:', err);
                            // 忽略错误，截图功能仍然可以通过其他方式退出
                        }
                        displays = (0, getDisplay_1.getAllDisplays)();
                        return [4 /*yield*/, Promise.all([
                                // 一次性截取所有屏幕（避免多次调用 desktopCapturer）
                                this.captureAllDisplays(displays),
                                // 确保窗口已准备好（如果使用预加载）
                                this.singleWindow ? this.ensureWindowsReady(displays) : Promise.resolve(),
                            ])];
                    case 1:
                        captureMap = (_a.sent())[0];
                        this.logger("Capture completed in ".concat(Date.now() - startTime, "ms"));
                        validCaptures = displays
                            .filter(function (display) { return captureMap.has(display.id); })
                            .map(function (display) { return ({ display: display, url: captureMap.get(display.id) }); });
                        // 同步显示所有窗口（预加载窗口是同步操作）
                        validCaptures.forEach(function (cap) { return _this.showWindowWithCapture(cap.display, cap.url); });
                        cursorPoint = electron_1.screen.getCursorScreenPoint();
                        focusDisplay = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                        focusWin = this.$wins.get(focusDisplay.id);
                        if (focusWin && !focusWin.isDestroyed()) {
                            focusWin.focus();
                        }
                        this.logger("Total startup time: ".concat(Date.now() - startTime, "ms"));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 显示窗口并发送截图数据
     */
    Screenshots.prototype.showWindowWithCapture = function (display, url) {
        var _this = this;
        // 尝试使用预加载的窗口
        var win = this.preloadedWins.get(display.id);
        var view = this.preloadedViews.get(display.id);
        if (win && !win.isDestroyed() && view && this.preloadReady.get(display.id)) {
            // 使用预加载的窗口（最快路径）
            this.$wins.set(display.id, win);
            this.$views.set(display.id, view);
            this.preloadedWins.delete(display.id);
            this.preloadedViews.delete(display.id);
            this.preloadReady.delete(display.id);
            // 更新窗口位置
            win.setBounds(display);
            view.setBounds({
                x: 0, y: 0, width: display.width, height: display.height,
            });
            // 先发送截图数据，让渲染进程准备好图片
            view.webContents.send('SCREENSHOTS:capture', display, url);
            // 短暂延迟后显示窗口，让渲染进程有时间渲染图片
            // 这样可以避免看到黑屏/空白窗口
            setTimeout(function () {
                if (!win.isDestroyed()) {
                    win.setAlwaysOnTop(true, 'screen-saver');
                    win.show();
                    win.moveTop();
                }
            }, 50); // 50ms 足够渲染进程处理图片
            this.emit('windowCreated', win);
            win.on('closed', function () {
                _this.emit('windowClosed', win);
                _this.$wins.delete(display.id);
                _this.$views.delete(display.id);
            });
        }
        else {
            // 回退：创建新窗口（较慢路径）
            this.logger("Creating new window for display ".concat(display.id));
            this.createWindowFast(display, url);
        }
    };
    /**
     * 快速创建窗口（简化版，用于回退场景）
     */
    Screenshots.prototype.createWindowFast = function (display, url) {
        var _this = this;
        var windowTypes = {
            darwin: 'panel',
            linux: undefined,
            win32: undefined,
        };
        var win = new electron_1.BrowserWindow({
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
            closable: false,
            focusable: true,
            skipTaskbar: true,
            alwaysOnTop: true,
            fullscreen: false,
            fullscreenable: false,
            kiosk: false,
            backgroundColor: '#00000001',
            hasShadow: false,
            enableLargerThanScreen: true, // 允许窗口覆盖整个屏幕包括 Dock
        });
        // macOS: 确保窗口在所有工作区可见，并覆盖 Dock
        if (process.platform === 'darwin') {
            try {
                win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            }
            catch (_a) {
                // 旧版本 Electron 可能不支持第二个参数
                win.setVisibleOnAllWorkspaces(true);
            }
        }
        var view = new electron_1.BrowserView({
            webPreferences: {
                preload: require.resolve('./preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });
        var htmlPath;
        try {
            var reactScreenshotsPath = require.resolve('react-screenshots');
            htmlPath = path_1.default.join(path_1.default.dirname(reactScreenshotsPath), '../electron/electron.html');
        }
        catch (err) {
            htmlPath = path_1.default.join(__dirname, '../../react-screenshots/electron/electron.html');
        }
        win.setBrowserView(view);
        view.setBounds({
            x: 0, y: 0, width: display.width, height: display.height,
        });
        view.webContents.loadURL("file://".concat(htmlPath));
        view.webContents.once('did-finish-load', function () {
            // 先发送截图数据
            view.webContents.send('SCREENSHOTS:capture', display, url);
            // 延迟显示窗口，等待渲染进程处理图片，避免黑屏闪烁
            setTimeout(function () {
                if (!win.isDestroyed()) {
                    win.setAlwaysOnTop(true, 'screen-saver');
                    win.show();
                    win.moveTop();
                }
            }, 50);
        });
        this.$wins.set(display.id, win);
        this.$views.set(display.id, view);
        this.emit('windowCreated', win);
        win.on('closed', function () {
            _this.emit('windowClosed', win);
            _this.$wins.delete(display.id);
            _this.$views.delete(display.id);
        });
    };
    /**
     * 确保预加载窗口已准备好
     */
    Screenshots.prototype.ensureWindowsReady = function (displays) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = displays.map(function (display) { return new Promise(function (resolve) {
                            if (_this.preloadReady.get(display.id)) {
                                resolve();
                                return;
                            }
                            // 如果还没预加载，立即创建
                            if (!_this.preloadedWins.has(display.id)) {
                                _this.createPreloadWindow(display).then(function () {
                                    // 等待加载完成
                                    var checkReady = function () {
                                        if (_this.preloadReady.get(display.id)) {
                                            resolve();
                                        }
                                        else {
                                            setTimeout(checkReady, 10);
                                        }
                                    };
                                    checkReady();
                                });
                                return;
                            }
                            // 等待已有窗口加载完成
                            var checkReady = function () {
                                if (_this.preloadReady.get(display.id)) {
                                    resolve();
                                }
                                else {
                                    setTimeout(checkReady, 10);
                                }
                            };
                            checkReady();
                        }); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
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
                        // 注销全局 ESC 快捷键
                        try {
                            electron_1.globalShortcut.unregister('Escape');
                        }
                        catch (_b) {
                            // 忽略错误
                        }
                        return [4 /*yield*/, this.reset()];
                    case 1:
                        _a.sent();
                        // 处理所有窗口
                        this.$wins.forEach(function (win, id) {
                            var view = _this.$views.get(id);
                            if (win && !win.isDestroyed()) {
                                if (win.isKiosk()) {
                                    win.setKiosk(false);
                                }
                                win.blurWebView();
                                win.unmaximize();
                                if (_this.singleWindow && view && !view.webContents.isDestroyed()) {
                                    // 复用模式：隐藏窗口，放回预加载池
                                    win.hide();
                                    _this.preloadedWins.set(id, win);
                                    _this.preloadedViews.set(id, view);
                                    _this.preloadReady.set(id, true);
                                    _this.logger("Window ".concat(id, " returned to preload pool"));
                                }
                                else {
                                    // 非复用模式：销毁窗口
                                    setTimeout(function () {
                                        if (win.isDestroyed())
                                            return;
                                        if (view) {
                                            try {
                                                win.removeBrowserView(view);
                                            }
                                            catch (e) {
                                                // ignore
                                            }
                                        }
                                        win.destroy();
                                    }, 100);
                                }
                            }
                        });
                        // 清理当前引用
                        this.$wins.clear();
                        this.$views.clear();
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
    Screenshots.prototype.createWindow = function (display, show) {
        if (show === void 0) { show = true; }
        return __awaiter(this, void 0, void 0, function () {
            var win, view, windowTypes, htmlPath, reactScreenshotsPath, didFinishLoadCalled_1, finishLoadTimeout_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!show) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reset()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        win = this.$wins.get(display.id);
                        view = this.$views.get(display.id);
                        if (!win || win.isDestroyed()) {
                            windowTypes = {
                                darwin: 'panel',
                                // linux 必须设置为 undefined，否则会在部分系统上不能触发focus 事件
                                // https://github.com/nashaofu/screenshots/issues/203#issuecomment-1518923486
                                linux: undefined,
                                // win32: 'toolbar', // 移除 toolbar 类型，使用默认类型以避免全屏窗口层级问题
                                win32: undefined,
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
                                closable: false,
                                // focusable 必须设置为 true, 否则窗口不能及时响应esc按键，输入框也不能输入
                                focusable: true,
                                skipTaskbar: true,
                                // 使用 screen-saver 级别 (2) 确保在 Windows 上覆盖所有窗口（包括任务栏）
                                alwaysOnTop: true,
                                /**
                                 * linux 下必须设置为false，否则不能全屏显示在最上层
                                 * mac 下设置为false，否则可能会导致程序坞不恢复问题，且与 kiosk 模式冲突
                                 * win32 下强制全屏，以解决最大化窗口遮挡问题
                                 */
                                fullscreen: false,
                                // mac fullscreenable 设置为 true 会导致应用崩溃
                                fullscreenable: false,
                                kiosk: false,
                                // 使用极低透明度的黑色，防止 Windows 下完全透明导致的鼠标穿透问题
                                backgroundColor: '#00000001',
                                hasShadow: false,
                                paintWhenInitiallyHidden: false,
                                // mac 特有的属性
                                roundedCorners: false,
                                enableLargerThanScreen: true,
                                acceptFirstMouse: true,
                            });
                            // macOS: 确保窗口在所有工作区可见，并覆盖 Dock
                            if (process.platform === 'darwin') {
                                try {
                                    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                                }
                                catch (_b) {
                                    // 旧版本 Electron 可能不支持第二个参数
                                    win.setVisibleOnAllWorkspaces(true);
                                }
                            }
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
                            didFinishLoadCalled_1 = false;
                            finishLoadTimeout_1 = setTimeout(function () {
                                if (!didFinishLoadCalled_1 && show) {
                                    _this.logger('WARNING: did-finish-load timeout, forcing window display for display', display.id);
                                    win.setBrowserView(view);
                                    // 强制提升窗口层级到最高
                                    win.setAlwaysOnTop(true, 'screen-saver');
                                    win.show();
                                    win.focus();
                                    win.moveTop();
                                }
                            }, 3000);
                            // 等待 UI 加载完成后再把 view 加到窗口并显示
                            view.webContents.once('did-finish-load', function () {
                                didFinishLoadCalled_1 = true;
                                clearTimeout(finishLoadTimeout_1);
                                _this.logger('UI loaded successfully for display', display.id);
                                win.setBrowserView(view);
                                if (show) {
                                    _this.logger('Showing window for display', display.id, 'at', display.x, display.y);
                                    // 强制提升窗口层级到最高
                                    win.setAlwaysOnTop(true, 'screen-saver');
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
                                        if (_this.shouldUseKiosk()) {
                                            win.setKiosk(true);
                                        }
                                        win.focus(); // 再次确保窗口焦点
                                        view.webContents.focus(); // 再次确保BrowserView焦点
                                        // this.logger('Window focused, moved to top, and kiosk enabled');
                                        // 诊断焦点状态
                                        // console.log('DEBUG: Window isFocused:', win!.isFocused());
                                    }, 100);
                                }
                            });
                        }
                        else {
                            // 已有 view，直接绑定并显示窗口
                            win.setBrowserView(view);
                            if (show) {
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
                                    if (_this.shouldUseKiosk()) {
                                        win.setKiosk(true);
                                    }
                                    win.focus();
                                    view.webContents.focus(); // 确保BrowserView的webContents也获得焦点
                                    // this.logger('Reused window focused, moved to top, and kiosk enabled');
                                    // 诊断焦点状态
                                    // console.log('DEBUG: Reused Window isFocused:', win!.isFocused());
                                }, 100);
                            }
                        }
                        // 适定平台
                        if (process.platform === 'darwin') {
                            win.setWindowButtonVisibility(false);
                        }
                        if (process.platform !== 'win32') {
                            try {
                                win.setVisibleOnAllWorkspaces(true, {
                                    visibleOnFullScreen: true,
                                    skipTransformProcessType: true,
                                });
                            }
                            catch (_c) {
                                // 旧版本 Electron 可能不支持第二个参数
                                win.setVisibleOnAllWorkspaces(true);
                            }
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
    /**
     * macOS 原生截图（使用 screencapture 命令，速度更快）
     * 一次性截取所有屏幕到一个文件，然后根据显示器位置裁剪
     */
    Screenshots.prototype.captureWithNativeCommand = function (displays) {
        return __awaiter(this, void 0, void 0, function () {
            var execFile, promisify, execFileAsync, captureStart, result, tempDir, timestamp, capturePromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('child_process')); })];
                    case 1:
                        execFile = (_a.sent()).execFile;
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('util')); })];
                    case 2:
                        promisify = (_a.sent()).promisify;
                        execFileAsync = promisify(execFile);
                        captureStart = Date.now();
                        result = new Map();
                        tempDir = path_1.default.join(os_1.default.tmpdir(), 'electron-screenshots');
                        return [4 /*yield*/, fs_extra_1.default.ensureDir(tempDir)];
                    case 3:
                        _a.sent();
                        this.logger('[Capture] Using native screencapture command...');
                        timestamp = Date.now();
                        capturePromises = displays.map(function (display, index) { return __awaiter(_this, void 0, void 0, function () {
                            var tempFile, startTime, imageBuffer, image, err_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        tempFile = path_1.default.join(tempDir, "capture-".concat(display.id, "-").concat(timestamp, ".jpg"));
                                        this.tempFiles.add(tempFile);
                                        startTime = Date.now();
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 4, , 5]);
                                        // -x: 静音（不播放快门声）
                                        // -D: 指定显示器（从1开始）
                                        // -t jpg: 使用 jpg 格式，比 png 快
                                        // -C: 不包含窗口阴影（可选，可能加快速度）
                                        return [4 /*yield*/, execFileAsync('screencapture', [
                                                '-x',
                                                '-D', String(index + 1),
                                                '-t', 'jpg',
                                                tempFile,
                                            ])];
                                    case 2:
                                        // -x: 静音（不播放快门声）
                                        // -D: 指定显示器（从1开始）
                                        // -t jpg: 使用 jpg 格式，比 png 快
                                        // -C: 不包含窗口阴影（可选，可能加快速度）
                                        _a.sent();
                                        return [4 /*yield*/, fs_extra_1.default.readFile(tempFile)];
                                    case 3:
                                        imageBuffer = _a.sent();
                                        image = electron_1.nativeImage.createFromBuffer(imageBuffer);
                                        if (!image.isEmpty()) {
                                            result.set(display.id, image.toDataURL());
                                            this.logger("[Capture] \u2705 Display ".concat(display.id, " captured in ").concat(Date.now() - startTime, "ms"));
                                        }
                                        else {
                                            this.logger("[Capture] \u26A0\uFE0F Display ".concat(display.id, " returned empty image"));
                                        }
                                        return [3 /*break*/, 5];
                                    case 4:
                                        err_3 = _a.sent();
                                        this.logger("[Capture] \u274C Display ".concat(display.id, " capture failed:"), err_3);
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(capturePromises)];
                    case 4:
                        _a.sent();
                        this.logger("[Capture] Native capture completed in ".concat(Date.now() - captureStart, "ms"));
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * 批量获取所有显示器的截图（一次 API 调用）
     */
    Screenshots.prototype.captureAllDisplays = function (displays) {
        return __awaiter(this, void 0, void 0, function () {
            var captureStart, result, safeScale, rawMaxWidth, rawMaxHeight, maxWidth, maxHeight, sources, maxRetries, retryDelay, attemptCapture, delay, success, usedSources;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        captureStart = Date.now();
                        result = new Map();
                        this.logger('[Capture] ========== Starting Screen Capture ==========');
                        this.logger('[Capture] Number of displays:', displays.length);
                        this.logger('[Capture] displays:', JSON.stringify(displays.map(function (d) { return ({
                            id: d.id, width: d.width, height: d.height, scaleFactor: d.scaleFactor,
                        }); })));
                        safeScale = function (sf) { return (Number.isFinite(sf) && sf > 0 ? sf : 1); };
                        rawMaxWidth = Math.max.apply(Math, displays.map(function (d) { return d.width * safeScale(d.scaleFactor); }));
                        rawMaxHeight = Math.max.apply(Math, displays.map(function (d) { return d.height * safeScale(d.scaleFactor); }));
                        maxWidth = Math.min(Math.max(1, Math.round(rawMaxWidth) || 1920), 8192);
                        maxHeight = Math.min(Math.max(1, Math.round(rawMaxHeight) || 1080), 8192);
                        this.logger("[Capture] Max thumbnail size: ".concat(maxWidth, "x").concat(maxHeight));
                        this.logger("[Capture] (raw: ".concat(rawMaxWidth, "x").concat(rawMaxHeight, ")"));
                        // 一次性获取所有屏幕截图（带重试机制）
                        this.logger('[Capture] Calling desktopCapturer.getSources...');
                        sources = [];
                        maxRetries = 3;
                        retryDelay = 500;
                        attemptCapture = function (attempt) { return __awaiter(_this, void 0, void 0, function () {
                            var attemptStart, hasValidData, err_4;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        attemptStart = Date.now();
                                        return [4 /*yield*/, electron_1.desktopCapturer.getSources({
                                                types: ['screen'],
                                                thumbnailSize: { width: maxWidth, height: maxHeight },
                                            })];
                                    case 1:
                                        sources = _a.sent();
                                        this.logger("[Capture] Attempt ".concat(attempt, ": desktopCapturer.getSources returned ").concat(sources.length, " sources in ").concat(Date.now() - attemptStart, "ms"));
                                        hasValidData = sources.length > 0 && sources.some(function (s) { return !s.thumbnail.isEmpty(); });
                                        if (hasValidData) {
                                            this.logger("[Capture] \u2705 Got valid capture data on attempt ".concat(attempt));
                                            return [2 /*return*/, true];
                                        }
                                        // 没有有效数据，可能是首次权限请求
                                        this.logger("[Capture] \u26A0\uFE0F Attempt ".concat(attempt, ": No valid data"));
                                        this.logger('[Capture] (This is normal for first-time permission request on macOS)');
                                        return [2 /*return*/, false];
                                    case 2:
                                        err_4 = _a.sent();
                                        this.logger("[Capture] \u274C Attempt ".concat(attempt, ": desktopCapturer.getSources FAILED:"), err_4);
                                        if (attempt === maxRetries) {
                                            throw err_4;
                                        }
                                        return [2 /*return*/, false];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); };
                        delay = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
                        return [4 /*yield*/, attemptCapture(1)];
                    case 1:
                        success = _a.sent();
                        if (!(!success && maxRetries >= 2)) return [3 /*break*/, 4];
                        return [4 /*yield*/, delay(retryDelay)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, attemptCapture(2)];
                    case 3:
                        success = _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!(!success && maxRetries >= 3)) return [3 /*break*/, 7];
                        return [4 /*yield*/, delay(retryDelay)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, attemptCapture(3)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        // 打印每个 source 的详细信息
                        sources.forEach(function (s, i) {
                            var size = s.thumbnail.getSize();
                            _this.logger("[Capture] Source ".concat(i, ": id=").concat(s.id, ", display_id=").concat(s.display_id, ", name=").concat(s.name, ", size=").concat(size.width, "x").concat(size.height, ", isEmpty=").concat(s.thumbnail.isEmpty()));
                        });
                        if (sources.length === 0 || sources.every(function (s) { return s.thumbnail.isEmpty(); })) {
                            this.logger('[Capture] ⚠️ No valid sources after all retries! This usually means:');
                            this.logger('[Capture]   1. Screen recording permission is not granted');
                            this.logger('[Capture]   2. User needs to grant permission and restart the app');
                        }
                        usedSources = new Set();
                        displays.forEach(function (display) {
                            var source;
                            if (sources.length === 1) {
                                source = sources[0];
                            }
                            else {
                                // 优先使用 display_id 匹配（Win10/11、macOS）
                                source = sources.find(function (item) { return !usedSources.has(item.id)
                                    && item.display_id
                                    && item.display_id === display.id.toString(); });
                                // 如果 display_id 为空（Win7/Linux），使用 source.id 中的索引匹配
                                if (!source) {
                                    source = sources.find(function (item) { return !usedSources.has(item.id)
                                        && item.id.startsWith("screen:".concat(display.id, ":")); });
                                }
                                // Win7 回退：尝试通过截图尺寸匹配
                                if (!source) {
                                    var displayWidth_1 = Math.round(display.width * display.scaleFactor);
                                    var displayHeight_1 = Math.round(display.height * display.scaleFactor);
                                    // 尝试找尺寸匹配的 source
                                    source = sources.find(function (item) {
                                        if (usedSources.has(item.id))
                                            return false;
                                        var size = item.thumbnail.getSize();
                                        // 允许一定误差（缩放可能导致几像素差异）
                                        return Math.abs(size.width - displayWidth_1) < 10
                                            && Math.abs(size.height - displayHeight_1) < 10;
                                    });
                                    // 如果尺寸匹配失败，使用剩余的第一个 source
                                    if (!source) {
                                        source = sources.find(function (item) { return !usedSources.has(item.id); });
                                    }
                                    if (source) {
                                        var size = source.thumbnail.getSize();
                                        _this.logger("Fallback matching: display ".concat(display.id, " (").concat(displayWidth_1, "x").concat(displayHeight_1, ") -> source ").concat(source.id, " (").concat(size.width, "x").concat(size.height, ")"));
                                    }
                                }
                            }
                            if (source) {
                                usedSources.add(source.id);
                                // 使用临时文件代替 dataURL，避免大图片 base64 转换耗时
                                // 使用 JPEG 格式，比 PNG 快很多
                                var tempDir = path_1.default.join(os_1.default.tmpdir(), 'electron-screenshots');
                                fs_extra_1.default.ensureDirSync(tempDir);
                                var tempFile = path_1.default.join(tempDir, "capture-".concat(display.id, "-").concat(Date.now(), ".jpg"));
                                var convertStart = Date.now();
                                fs_extra_1.default.writeFileSync(tempFile, source.thumbnail.toJPEG(90));
                                _this.tempFiles.add(tempFile);
                                var fileUrl = "file://".concat(tempFile);
                                result.set(display.id, fileUrl);
                                _this.logger("[Capture] \u2705 Display ".concat(display.id, " -> ").concat(source.id, ", saved in ").concat(Date.now() - convertStart, "ms"));
                            }
                            else {
                                _this.logger("[Capture] \u274C No source found for display ".concat(display.id));
                            }
                        });
                        this.logger("[Capture] Total captures: ".concat(result.size, "/").concat(displays.length));
                        this.logger("[Capture] All captures completed in ".concat(Date.now() - captureStart, "ms"));
                        this.logger('[Capture] =============================================');
                        return [2 /*return*/, result];
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
        /**
         * MOVE_BOUNDS事件 - 处理跨屏选框移动
         */
        electron_1.ipcMain.on('SCREENSHOTS:moveBounds', function (e, bounds, globalX, globalY) {
            _this.logger('SCREENSHOTS:moveBounds bounds: %o, globalPos: (%d, %d)', bounds, globalX, globalY);
            // 根据全局坐标找到目标显示器
            var targetDisplay = electron_1.screen.getDisplayNearestPoint({
                x: globalX,
                y: globalY,
            });
            // 找到源窗口（发送事件的窗口）
            var sourceDisplayId;
            _this.$views.forEach(function (view, id) {
                if (view.webContents === e.sender) {
                    sourceDisplayId = id;
                }
            });
            if (!sourceDisplayId) {
                _this.logger('SCREENSHOTS:moveBounds source display not found');
                return;
            }
            // 如果目标显示器和源显示器相同，不需要处理
            if (targetDisplay.id === sourceDisplayId) {
                return;
            }
            _this.logger('SCREENSHOTS:moveBounds moving from display %d to %d', sourceDisplayId, targetDisplay.id);
            // 将选框坐标转换为目标显示器的本地坐标
            var localBounds = {
                x: globalX - targetDisplay.bounds.x,
                y: globalY - targetDisplay.bounds.y,
                width: bounds.width,
                height: bounds.height,
            };
            // 通知目标显示器的窗口显示选框
            var targetView = _this.$views.get(targetDisplay.id);
            if (targetView) {
                targetView.webContents.send('SCREENSHOTS:syncBounds', localBounds);
            }
            // 通知源显示器的窗口隐藏选框
            var sourceView = _this.$views.get(sourceDisplayId);
            if (sourceView) {
                sourceView.webContents.send('SCREENSHOTS:syncBounds', null);
            }
        });
    };
    /**
     * kiosk 模式会让整个应用进入“单窗口”全屏。
     * 对于存在其他 BrowserWindow 的项目，在开启截图时会把它们隐藏，
     * 因此需要在检测到其他窗口存在时跳过 kiosk。
     */
    Screenshots.prototype.shouldUseKiosk = function () {
        if (!this.useKiosk) {
            return false;
        }
        var screenshotWins = new Set(this.$wins.values());
        var hasExternalWindows = electron_1.BrowserWindow.getAllWindows().some(function (win) { return !screenshotWins.has(win); });
        if (hasExternalWindows) {
            this.logger('Skipping kiosk mode: other app windows detected.');
            return false;
        }
        return true;
    };
    return Screenshots;
}(events_1.default));
exports.default = Screenshots;
