"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var electron_1 = require("electron");
var map = new Map();
electron_1.contextBridge.exposeInMainWorld('screenshots', {
    ready: function () {
        console.log('contextBridge ready');
        electron_1.ipcRenderer.send('SCREENSHOTS:ready');
    },
    reset: function () {
        console.log('contextBridge reset');
        electron_1.ipcRenderer.send('SCREENSHOTS:reset');
    },
    save: function (arrayBuffer, data) {
        console.log('contextBridge save', arrayBuffer, data);
        electron_1.ipcRenderer.send('SCREENSHOTS:save', Buffer.from(arrayBuffer), data);
    },
    cancel: function () {
        console.log('contextBridge cancel');
        electron_1.ipcRenderer.send('SCREENSHOTS:cancel');
    },
    ok: function (arrayBuffer, data) {
        console.log('contextBridge ok', arrayBuffer, data);
        electron_1.ipcRenderer.send('SCREENSHOTS:ok', Buffer.from(arrayBuffer), data);
    },
    on: function (channel, fn) {
        var _a;
        console.log('contextBridge on', fn);
        var listener = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            console.log.apply(console, __spreadArray(['contextBridge on', channel, fn], args, false));
            fn.apply(void 0, args);
        };
        var listeners = (_a = map.get(fn)) !== null && _a !== void 0 ? _a : {};
        listeners[channel] = listener;
        map.set(fn, listeners);
        electron_1.ipcRenderer.on("SCREENSHOTS:".concat(channel), listener);
    },
    off: function (channel, fn) {
        var _a;
        console.log('contextBridge off', fn);
        var listeners = (_a = map.get(fn)) !== null && _a !== void 0 ? _a : {};
        var listener = listeners[channel];
        delete listeners[channel];
        if (!listener) {
            return;
        }
        electron_1.ipcRenderer.off("SCREENSHOTS:".concat(channel), listener);
    },
});
