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
    /**
     * 是否启用 kiosk 模式。kiosk 会强制应用进入单窗口全屏，
     * 在多窗口项目中可能导致其它窗口被系统隐藏。
     * 默认开启以保持历史行为。
     */
    kiosk?: boolean;
}
export { Bounds };
export default class Screenshots extends Events {
    $wins: Map<number, BrowserWindow>;
    $views: Map<number, BrowserView>;
    private tempFiles;
    private usedMonitorIds;
    private logger;
    private singleWindow;
    private useKiosk;
    private isReady;
    constructor(opts?: ScreenshotsOpts);
    private createReadyPromise;
    /**
     * 清理旧的临时文件
     */
    private cleanupOldTempFiles;
    /**
     * 检查屏幕录制权限
     */
    private checkScreenRecordingPermission;
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
    /**
     * kiosk 模式会让整个应用进入“单窗口”全屏。
     * 对于存在其他 BrowserWindow 的项目，在开启截图时会把它们隐藏，
     * 因此需要在检测到其他窗口存在时跳过 kiosk。
     */
    private shouldUseKiosk;
}
