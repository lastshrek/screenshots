"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 如果string字符串长度小于 length 则在左侧填充字符
 * 如果超出length长度则截断超出的部分。
 * @param {unknown} string
 * @param {string} chars
 * @param {number} length
 */
function padStart(string, length, chars) {
    if (length === void 0) { length = 0; }
    if (chars === void 0) { chars = ' '; }
    var str = String(string);
    while (str.length < length) {
        str = "".concat(chars).concat(str);
    }
    return str;
}
exports.default = padStart;
