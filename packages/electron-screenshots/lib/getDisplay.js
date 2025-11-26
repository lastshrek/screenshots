"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDisplays = void 0;
var electron_1 = require("electron");
var getAllDisplays = function () { return electron_1.screen.getAllDisplays()
    .map(function (_a) {
    var id = _a.id, bounds = _a.bounds, scaleFactor = _a.scaleFactor;
    return ({
        id: id,
        x: Math.floor(bounds.x),
        y: Math.floor(bounds.y),
        width: Math.floor(bounds.width),
        height: Math.floor(bounds.height),
        scaleFactor: scaleFactor,
    });
}); };
exports.getAllDisplays = getAllDisplays;
exports.default = (function () {
    var point = electron_1.screen.getCursorScreenPoint();
    var _a = electron_1.screen.getDisplayNearestPoint(point), id = _a.id, bounds = _a.bounds, scaleFactor = _a.scaleFactor;
    // https://github.com/nashaofu/screenshots/issues/98
    return {
        id: id,
        x: Math.floor(bounds.x),
        y: Math.floor(bounds.y),
        width: Math.floor(bounds.width),
        height: Math.floor(bounds.height),
        scaleFactor: scaleFactor,
    };
});
