/// <reference types="node" />
import { Debugger } from 'debug';
import { BrowserView, BrowserWindow } from 'electron';
import Events from 'events';
import { Bounds } from './preload';
export type LoggerFn = (...args: unknown[]) => void;
export type Logger = Debugger | LoggerFn;
export interface Lang {
    magnifier_position_label?: string;
    operation_ok_title?: string;
    operation_cancel_title?: string;
    operation_save_title?: string;
    operation_redo_title?: string;
    operation_undo_title?: string;
    operation_mosaic_title?: string;
    operation_text_title?: string;
    operation_brush_title?: string;
    operation_arrow_title?: string;
    operation_ellipse_title?: string;
    operation_rectangle_title?: string;
}
export interface ScreenshotsOpts {
    lang?: Lang;
    logger?: Logger;
    singleWindow?: boolean;
}
export { Bounds };
export default class Screenshots extends Events {
    $wins: Map<number, BrowserWindow>;
    $views: Map<number, BrowserView>;
    private tempFiles;
    private logger;
    private singleWindow;
    private isReady;
    constructor(opts?: ScreenshotsOpts);
    /**
     * 预加载窗口
     */
    private preloadWindows;
    /**
     * 清理旧的临时文件
     */
    private cleanupOldTempFiles;
    /**
     * 开始截图
     */
    startCapture(): Promise<void>;
    /**
     * 结束截图
     */
    endCapture(): Promise<void>;
    /**
     * 清理当前截图产生的临时文件
     */
    private cleanupCurrentTempFiles;
    /**
     * 设置语言
     */
    setLang(lang: Partial<Lang>): Promise<void>;
    private reset;
    /**
     * 初始化窗口
     */
    /**
     * 初始化窗口
     */
    private createWindow;
    private capture;
    /**
     * 绑定ipc时间处理
     */
    private listenIpc;
}
