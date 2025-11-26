"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var electron_1 = require("electron");
var _1 = __importDefault(require("."));
electron_1.app.whenReady().then(function () {
    var screenshots = new _1.default({
        lang: {
            operation_rectangle_title: '矩形2323',
        },
        singleWindow: true,
    });
    // screenshots.$view.webContents.openDevTools(); // 已改为多窗口模式
    electron_1.globalShortcut.register('ctrl+shift+a', function () {
        screenshots.startCapture();
    });
    screenshots.on('windowCreated', function ($win) {
        $win.on('focus', function () {
            electron_1.globalShortcut.register('esc', function () {
                if ($win === null || $win === void 0 ? void 0 : $win.isFocused()) {
                    screenshots.endCapture();
                }
            });
        });
        $win.on('blur', function () {
            electron_1.globalShortcut.unregister('esc');
        });
    });
    // 防止不能关闭截图界面
    electron_1.globalShortcut.register('ctrl+shift+q', function () {
        electron_1.app.quit();
    });
    // 点击确定按钮回调事件
    screenshots.on('ok', function (e, buffer, bounds) {
        console.log('capture', buffer, bounds);
    });
    // 点击取消按钮回调事件
    screenshots.on('cancel', function () {
        console.log('capture', 'cancel1');
        screenshots.setLang({
            operation_ellipse_title: 'ellipse',
            operation_rectangle_title: 'rectangle',
        });
    });
    // 点击保存按钮回调事件
    screenshots.on('save', function (e, buffer, bounds) {
        console.log('capture', buffer, bounds);
    });
    var mainWin = new electron_1.BrowserWindow({
        show: true,
    });
    mainWin.removeMenu();
    mainWin.loadURL('https://github.com/nashaofu');
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
