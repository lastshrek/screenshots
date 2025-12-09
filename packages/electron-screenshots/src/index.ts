import { Debugger } from 'debug';
import {
  BrowserView,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  systemPreferences,
} from 'electron';
import Events from 'events';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import Event from './event';
import { Display, getAllDisplays } from './getDisplay';
import padStart from './padStart';
import { Bounds, ScreenshotsData } from './preload';

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
  // 截图窗口对象
  public $wins: Map<number, BrowserWindow> = new Map();

  public $views: Map<number, BrowserView> = new Map();

  // 记录当前使用的临时文件，用于清理
  private tempFiles: Set<string> = new Set();

  private logger: Logger;

  private singleWindow: boolean;

  private useKiosk: boolean;

  private isReady: Promise<void>;

  // 预加载的窗口和视图（用于加速启动）
  private preloadedWins: Map<number, BrowserWindow> = new Map();

  private preloadedViews: Map<number, BrowserView> = new Map();

  private preloadReady: Map<number, boolean> = new Map();

  constructor(opts?: ScreenshotsOpts) {
    super();
    // 强制使用 console.log 以便调试，除非用户指定了自定义 logger
    this.logger = opts?.logger
      || ((...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log('[electron-screenshots]', ...args);
      });
    this.singleWindow = opts?.singleWindow ?? true; // Default to true for performance
    this.useKiosk = opts?.kiosk ?? true;
    // 初始化 isReady
    this.isReady = this.createReadyPromise();
    this.listenIpc();
    if (opts?.lang) {
      this.setLang(opts.lang);
    }

    // 清理旧的临时文件（异步，不阻塞）
    this.cleanupOldTempFiles();

    // 尽快预加载窗口（使用 setImmediate 在当前事件循环结束后立即执行）
    if (this.singleWindow) {
      setImmediate(() => this.preloadWindows());
    }
  }

  /**
   * 预加载窗口（后台静默创建，不显示）
   */
  private async preloadWindows(): Promise<void> {
    this.logger('Preloading windows...');
    const displays = getAllDisplays();

    // 串行创建预加载窗口，避免资源竞争
    await displays.reduce(
      (promise, display) => promise.then(() => this.createPreloadWindow(display)),
      Promise.resolve(),
    );
    this.logger('Windows preloaded');
  }

  /**
   * 创建预加载窗口（隐藏状态）
   */
  private async createPreloadWindow(display: Display): Promise<void> {
    if (this.preloadedWins.has(display.id)) {
      return;
    }

    const windowTypes: Record<string, string | undefined> = {
      darwin: 'panel',
      linux: undefined,
      win32: undefined,
    };

    const win = new BrowserWindow({
      title: 'screenshots',
      x: display.x,
      y: display.y,
      width: display.width,
      height: display.height,
      useContentSize: true,
      type: windowTypes[process.platform],
      frame: false,
      show: false, // 关键：不显示
      autoHideMenuBar: true,
      transparent: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false, // 禁用关闭按钮
      focusable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      fullscreen: false,
      fullscreenable: false,
      kiosk: false,
      backgroundColor: '#00000001',
      hasShadow: false,
      paintWhenInitiallyHidden: true, // 允许后台渲染
      roundedCorners: false,
      enableLargerThanScreen: true, // 允许窗口覆盖整个屏幕包括 Dock
      acceptFirstMouse: true,
    });

    // macOS: 确保窗口在所有工作区可见，并覆盖 Dock
    if (process.platform === 'darwin') {
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    const view = new BrowserView({
      webPreferences: {
        preload: require.resolve('./preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // 查找 HTML 路径
    let htmlPath: string;
    try {
      const reactScreenshotsPath = require.resolve('react-screenshots');
      htmlPath = path.join(
        path.dirname(reactScreenshotsPath),
        '../electron/electron.html',
      );
    } catch (err) {
      htmlPath = path.join(
        __dirname,
        '../../react-screenshots/electron/electron.html',
      );
    }

    win.setBrowserView(view);
    view.setBounds({
      x: 0,
      y: 0,
      width: display.width,
      height: display.height,
    });

    // 加载 UI
    view.webContents.loadURL(`file://${htmlPath}`);

    // 等待加载完成
    view.webContents.once('did-finish-load', () => {
      this.logger(`Preload window ready for display ${display.id}`);
      this.preloadReady.set(display.id, true);
    });

    this.preloadedWins.set(display.id, win);
    this.preloadedViews.set(display.id, view);

    win.on('closed', () => {
      this.preloadedWins.delete(display.id);
      this.preloadedViews.delete(display.id);
      this.preloadReady.delete(display.id);
    });
  }

  private createReadyPromise(): Promise<void> {
    return new Promise<void>((resolve) => {
      ipcMain.once('SCREENSHOTS:ready', () => {
        this.logger('SCREENSHOTS:ready');
        resolve();
      });
    });
  }

  /**
   * 清理旧的临时文件
   */
  private async cleanupOldTempFiles(): Promise<void> {
    try {
      const tempDir = path.join(os.tmpdir(), 'electron-screenshots');
      if (await fs.pathExists(tempDir)) {
        const files = await fs.readdir(tempDir);
        const now = Date.now();
        // 清理超过1小时的文件
        await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            if (now - stats.mtimeMs > 60 * 60 * 1000) {
              await fs.remove(filePath);
              this.logger('Cleaned up old temp file:', filePath);
            }
          }),
        );
      }
    } catch (err) {
      this.logger('Failed to cleanup old temp files:', err);
    }
  }

  /**
   * 检查屏幕录制权限
   * 注意：macOS 的权限状态可能有缓存，即使用户已授权，状态也可能不会立即更新
   * 因此这个方法只做日志记录，不阻止截图操作
   */
  private checkScreenRecordingPermission(): boolean {
    if (process.platform !== 'darwin') {
      // 非 macOS 平台不需要检查
      this.logger('[Permission] Not macOS, skipping permission check');
      return true;
    }

    this.logger('[Permission] ========== macOS Permission Check ==========');
    this.logger('[Permission] Platform:', process.platform);
    this.logger('[Permission] Electron version:', process.versions.electron);
    this.logger('[Permission] Node version:', process.versions.node);

    const status = systemPreferences.getMediaAccessStatus('screen');
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
      this.logger(
        '[Permission] ⚠️ Warning: Screen recording permission appears to be denied/restricted.',
      );
      this.logger(
        '[Permission] If you have already granted permission, try restarting the application.',
      );
    } else if (status === 'granted') {
      this.logger('[Permission] ✅ Screen recording permission granted');
    } else if (status === 'not-determined') {
      this.logger('[Permission] ℹ️ Screen recording permission not yet requested');
    }

    this.logger('[Permission] ==========================================');

    // 始终返回 true，让实际截图操作去验证权限
    return true;
  }

  /**
   * 开始截图
   */
  public async startCapture(): Promise<void> {
    this.logger('startCapture');
    const startTime = Date.now();

    // 检查屏幕录制权限（仅 macOS，仅做日志记录，不阻止截图）
    if (process.platform === 'darwin') {
      this.checkScreenRecordingPermission();
    }

    // 注册全局 ESC 快捷键，确保能退出
    globalShortcut.register('Esc', () => {
      this.logger('Global ESC pressed, canceling capture');
      const event = new Event();
      this.emit('cancel', event);
      if (event.defaultPrevented) {
        return;
      }
      this.endCapture();
    });

    const displays = getAllDisplays();

    // 并行执行：批量截图 + 准备窗口
    const [captureMap] = await Promise.all([
      // 一次性截取所有屏幕（避免多次调用 desktopCapturer）
      this.captureAllDisplays(displays),
      // 确保窗口已准备好（如果使用预加载）
      this.singleWindow ? this.ensureWindowsReady(displays) : Promise.resolve(),
    ]);

    this.logger(`Capture completed in ${Date.now() - startTime}ms`);

    // 构建有效的截图数据
    const validCaptures = displays
      .filter((display) => captureMap.has(display.id))
      .map((display) => ({ display, url: captureMap.get(display.id)! }));

    // 同步显示所有窗口（预加载窗口是同步操作）
    validCaptures.forEach((cap) => this.showWindowWithCapture(cap.display, cap.url));

    // 设置焦点到鼠标所在的显示器
    const cursorPoint = screen.getCursorScreenPoint();
    const focusDisplay = screen.getDisplayNearestPoint(cursorPoint);
    const focusWin = this.$wins.get(focusDisplay.id);
    if (focusWin && !focusWin.isDestroyed()) {
      focusWin.focus();
    }

    this.logger(`Total startup time: ${Date.now() - startTime}ms`);
  }

  /**
   * 显示窗口并发送截图数据
   */
  private showWindowWithCapture(display: Display, url: string): void {
    // 尝试使用预加载的窗口
    const win = this.preloadedWins.get(display.id);
    const view = this.preloadedViews.get(display.id);

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
      setTimeout(() => {
        if (!win.isDestroyed()) {
          win.setAlwaysOnTop(true, 'screen-saver');
          win.show();
          win.moveTop();
        }
      }, 50); // 50ms 足够渲染进程处理图片

      this.emit('windowCreated', win);
      win.on('closed', () => {
        this.emit('windowClosed', win);
        this.$wins.delete(display.id);
        this.$views.delete(display.id);
      });
    } else {
      // 回退：创建新窗口（较慢路径）
      this.logger(`Creating new window for display ${display.id}`);
      this.createWindowFast(display, url);
    }
  }

  /**
   * 快速创建窗口（简化版，用于回退场景）
   */
  private createWindowFast(display: Display, url: string): void {
    const windowTypes: Record<string, string | undefined> = {
      darwin: 'panel',
      linux: undefined,
      win32: undefined,
    };

    const win = new BrowserWindow({
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
      closable: false, // 禁用关闭按钮
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
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    const view = new BrowserView({
      webPreferences: {
        preload: require.resolve('./preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    let htmlPath: string;
    try {
      const reactScreenshotsPath = require.resolve('react-screenshots');
      htmlPath = path.join(path.dirname(reactScreenshotsPath), '../electron/electron.html');
    } catch (err) {
      htmlPath = path.join(__dirname, '../../react-screenshots/electron/electron.html');
    }

    win.setBrowserView(view);
    view.setBounds({
      x: 0, y: 0, width: display.width, height: display.height,
    });
    view.webContents.loadURL(`file://${htmlPath}`);

    view.webContents.once('did-finish-load', () => {
      // 先发送截图数据
      view.webContents.send('SCREENSHOTS:capture', display, url);
      // 延迟显示窗口，等待渲染进程处理图片，避免黑屏闪烁
      setTimeout(() => {
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

    win.on('closed', () => {
      this.emit('windowClosed', win);
      this.$wins.delete(display.id);
      this.$views.delete(display.id);
    });
  }

  /**
   * 确保预加载窗口已准备好
   */
  private async ensureWindowsReady(displays: Display[]): Promise<void> {
    const promises = displays.map((display) => new Promise<void>((resolve) => {
      if (this.preloadReady.get(display.id)) {
        resolve();
        return;
      }

      // 如果还没预加载，立即创建
      if (!this.preloadedWins.has(display.id)) {
        this.createPreloadWindow(display).then(() => {
          // 等待加载完成
          const checkReady = () => {
            if (this.preloadReady.get(display.id)) {
              resolve();
            } else {
              setTimeout(checkReady, 10);
            }
          };
          checkReady();
        });
        return;
      }

      // 等待已有窗口加载完成
      const checkReady = () => {
        if (this.preloadReady.get(display.id)) {
          resolve();
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    }));

    await Promise.all(promises);
  }

  /**
   * 结束截图
   */
  public async endCapture(): Promise<void> {
    this.logger('endCapture');

    // 注销全局 ESC 快捷键
    globalShortcut.unregister('Esc');

    await this.reset();

    // 处理所有窗口
    this.$wins.forEach((win, id) => {
      const view = this.$views.get(id);
      if (win && !win.isDestroyed()) {
        if (win.isKiosk()) {
          win.setKiosk(false);
        }
        win.blurWebView();
        win.unmaximize();

        if (this.singleWindow && view && !view.webContents.isDestroyed()) {
          // 复用模式：隐藏窗口，放回预加载池
          win.hide();
          this.preloadedWins.set(id, win);
          this.preloadedViews.set(id, view);
          this.preloadReady.set(id, true);
          this.logger(`Window ${id} returned to preload pool`);
        } else {
          // 非复用模式：销毁窗口
          setTimeout(() => {
            if (win.isDestroyed()) return;
            if (view) {
              try {
                win.removeBrowserView(view);
              } catch (e) {
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
  }

  /**
   * 清理当前截图产生的临时文件
   */
  private async cleanupCurrentTempFiles(): Promise<void> {
    const files = Array.from(this.tempFiles);
    await Promise.all(
      files.map(async (tempFile) => {
        try {
          if (await fs.pathExists(tempFile)) {
            await fs.remove(tempFile);
            this.logger('Cleaned up temp file:', tempFile);
          }
        } catch (err) {
          this.logger('Failed to cleanup temp file:', tempFile, err);
        }
      }),
    );
    this.tempFiles.clear();
  }

  /**
   * 设置语言
   */
  public async setLang(lang: Partial<Lang>): Promise<void> {
    this.logger('setLang', lang);

    await this.isReady;

    this.$views.forEach((view) => {
      view.webContents.send('SCREENSHOTS:setLang', lang);
    });
  }

  private async reset() {
    // 重置截图区域
    this.$views.forEach((view) => {
      view.webContents.send('SCREENSHOTS:reset');
    });

    // 保证 UI 有足够的时间渲染
    await Promise.race([
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 100);
      }),
      new Promise<void>((resolve) => {
        ipcMain.once('SCREENSHOTS:reset', () => resolve());
      }),
    ]);
  }

  /**
   * 初始化窗口
   */
  /**
   * 初始化窗口
   */
  private async createWindow(display: Display, show: boolean = true): Promise<void> {
    // 只在显示窗口时才重置截图区域,预加载时跳过
    if (show) {
      await this.reset();
    }

    // 复用未销毁的窗口
    let win = this.$wins.get(display.id);
    let view = this.$views.get(display.id);

    if (!win || win.isDestroyed()) {
      const windowTypes: Record<string, string | undefined> = {
        darwin: 'panel',
        // linux 必须设置为 undefined，否则会在部分系统上不能触发focus 事件
        // https://github.com/nashaofu/screenshots/issues/203#issuecomment-1518923486
        linux: undefined,
        // win32: 'toolbar', // 移除 toolbar 类型，使用默认类型以避免全屏窗口层级问题
        win32: undefined,
      };

      win = new BrowserWindow({
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
        closable: false, // 禁用关闭按钮
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
        kiosk: false, // 先不启用 kiosk，等窗口显示后再启用
        // 使用极低透明度的黑色，防止 Windows 下完全透明导致的鼠标穿透问题
        backgroundColor: '#00000001',
        hasShadow: false,
        paintWhenInitiallyHidden: false,
        // mac 特有的属性
        roundedCorners: false,
        enableLargerThanScreen: true, // 允许窗口覆盖整个屏幕包括 Dock
        acceptFirstMouse: true,
      });

      // macOS: 确保窗口在所有工作区可见，并覆盖 Dock
      if (process.platform === 'darwin') {
        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      }

      this.$wins.set(display.id, win);

      this.emit('windowCreated', win);
      win.on('show', () => {
        // focus 在 did-finish-load 中处理
        // kiosk 也在那里处理
      });

      win.on('closed', () => {
        this.emit('windowClosed', win);
        this.$wins.delete(display.id);
        this.$views.delete(display.id);
      });
    }

    if (!view) {
      view = new BrowserView({
        webPreferences: {
          preload: require.resolve('./preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      // 保存视图
      this.$views.set(display.id, view);

      // 使用 require.resolve 来查找 react-screenshots 包的位置
      // 这样无论是在开发环境还是在 node_modules 中都能正确找到路径
      let htmlPath: string;
      try {
        // 尝试从 react-screenshots 包中解析路径
        const reactScreenshotsPath = require.resolve('react-screenshots');
        htmlPath = path.join(
          path.dirname(reactScreenshotsPath),
          '../electron/electron.html',
        );
      } catch (err) {
        // 如果找不到包，使用相对路径（开发环境）
        htmlPath = path.join(
          __dirname,
          '../../react-screenshots/electron/electron.html',
        );
      }

      this.logger('Loading UI from:', htmlPath);

      // 监听加载失败
      view.webContents.on(
        'did-fail-load',
        (event, errorCode, errorDescription, validatedURL) => {
          this.logger(
            'UI failed to load:',
            errorCode,
            errorDescription,
            validatedURL,
          );
        },
      );

      // 监听资源加载失败
      view.webContents.session.webRequest.onErrorOccurred((details) => {
        this.logger('Resource load error:', details.url, details.error);
      });

      // 监听控制台消息 (0=log, 1=info, 2=warn, 3=error)
      view.webContents.on(
        'console-message',
        (event, level, message, line, sourceId) => {
          const levelNames = ['log', 'info', 'warn', 'error'];
          this.logger(
            `UI Console [${levelNames[level] || level}]:`,
            message,
            line > 0 ? `(${sourceId}:${line})` : '',
          );
        },
      );

      view.webContents.loadURL(`file://${htmlPath}`);

      // 添加超时保护，确保窗口最终会显示
      let didFinishLoadCalled = false;
      const finishLoadTimeout = setTimeout(() => {
        if (!didFinishLoadCalled && show) {
          this.logger('WARNING: did-finish-load timeout, forcing window display for display', display.id);
          win!.setBrowserView(view!);
          // 强制提升窗口层级到最高
          win!.setAlwaysOnTop(true, 'screen-saver');
          win!.show();
          win!.focus();
          win!.moveTop();
        }
      }, 3000); // 3秒超时

      // 等待 UI 加载完成后再把 view 加到窗口并显示
      view.webContents.once('did-finish-load', () => {
        didFinishLoadCalled = true;
        clearTimeout(finishLoadTimeout);

        this.logger('UI loaded successfully for display', display.id);
        win!.setBrowserView(view!);

        if (show) {
          this.logger('Showing window for display', display.id, 'at', display.x, display.y);
          // 强制提升窗口层级到最高
          win!.setAlwaysOnTop(true, 'screen-saver');
          win!.show();

          // 先获得焦点，再启用 kiosk 模式
          win!.focus();
          win!.moveTop();

          // 延迟启用 kiosk 模式，确保焦点已获得
          setTimeout(() => {
            // 重新设置 BrowserView 的 bounds，确保正确
            view!.setBounds({
              x: 0,
              y: 0,
              width: display.width,
              height: display.height,
            });

            if (this.shouldUseKiosk()) {
              win!.setKiosk(true);
            }
            win!.focus(); // 再次确保窗口焦点
            view!.webContents.focus(); // 再次确保BrowserView焦点
            // this.logger('Window focused, moved to top, and kiosk enabled');

            // 诊断焦点状态
            // console.log('DEBUG: Window isFocused:', win!.isFocused());
          }, 100);
        }
      });
    } else {
      // 已有 view，直接绑定并显示窗口
      win.setBrowserView(view!);

      if (show) {
        win.show();
        win.focus();
        win.moveTop();

        // 延迟启用 kiosk 模式
        setTimeout(() => {
          // 重新设置 BrowserView 的 bounds，确保正确
          view!.setBounds({
            x: 0,
            y: 0,
            width: display.width,
            height: display.height,
          });

          if (this.shouldUseKiosk()) {
            win!.setKiosk(true);
          }
          win!.focus();
          view!.webContents.focus(); // 确保BrowserView的webContents也获得焦点
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
      win.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true,
      });
    }

    // 不要blur，否则窗口无法接收键盘和鼠标事件
    // win.blur();
    win.setBounds(display);
    view!.setBounds({
      x: 0,
      y: 0,
      width: display.width,
      height: display.height,
    });
    win.setAlwaysOnTop(true);

    // 诊断信息：确认窗口和view的状态
    setTimeout(() => {
      this.logger('Window bounds:', win!.getBounds());
      this.logger('View bounds:', view!.getBounds());
      this.logger('Window is visible:', win!.isVisible());
      this.logger('Window is focused:', win!.isFocused());
      this.logger('BrowserView attached:', win!.getBrowserViews().length);
    }, 200);

    // win.show() 已在 view 加载完成的回调或已有 view 的 else 分支中处理，无需再次调用
  }

  // 缓存的截图源，避免多显示器时重复调用 desktopCapturer
  private cachedSources: Electron.DesktopCapturerSource[] | null = null;

  private cachedSourcesTime: number = 0;

  /**
   * macOS 原生截图（使用 screencapture 命令，速度更快）
   * 一次性截取所有屏幕到一个文件，然后根据显示器位置裁剪
   */
  private async captureWithNativeCommand(displays: Display[]): Promise<Map<number, string>> {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const captureStart = Date.now();
    const result = new Map<number, string>();
    const tempDir = path.join(os.tmpdir(), 'electron-screenshots');
    await fs.ensureDir(tempDir);

    this.logger('[Capture] Using native screencapture command...');

    // 方案：为每个显示器单独截图（并行执行）
    // 使用 -D 参数指定显示器，但需要先获取显示器顺序
    const timestamp = Date.now();

    // 并行截取所有显示器
    const capturePromises = displays.map(async (display, index) => {
      const tempFile = path.join(tempDir, `capture-${display.id}-${timestamp}.jpg`);
      this.tempFiles.add(tempFile);

      const startTime = Date.now();
      try {
        // -x: 静音（不播放快门声）
        // -D: 指定显示器（从1开始）
        // -t jpg: 使用 jpg 格式，比 png 快
        // -C: 不包含窗口阴影（可选，可能加快速度）
        await execFileAsync('screencapture', [
          '-x',
          '-D', String(index + 1),
          '-t', 'jpg',
          tempFile,
        ]);

        const imageBuffer = await fs.readFile(tempFile);
        const image = nativeImage.createFromBuffer(imageBuffer);

        if (!image.isEmpty()) {
          result.set(display.id, image.toDataURL());
          this.logger(`[Capture] ✅ Display ${display.id} captured in ${Date.now() - startTime}ms`);
        } else {
          this.logger(`[Capture] ⚠️ Display ${display.id} returned empty image`);
        }
      } catch (err) {
        this.logger(`[Capture] ❌ Display ${display.id} capture failed:`, err);
      }
    });

    await Promise.all(capturePromises);
    this.logger(`[Capture] Native capture completed in ${Date.now() - captureStart}ms`);

    return result;
  }

  /**
   * 批量获取所有显示器的截图（一次 API 调用）
   */
  private async captureAllDisplays(displays: Display[]): Promise<Map<number, string>> {
    const captureStart = Date.now();
    const result = new Map<number, string>();

    this.logger('[Capture] ========== Starting Screen Capture ==========');
    this.logger('[Capture] Number of displays:', displays.length);
    displays.forEach((d, i) => {
      this.logger(`[Capture] Display ${i}: id=${d.id}, ${d.width}x${d.height}, scale=${d.scaleFactor}`);
    });

    // macOS: 暂时禁用原生截图，使用 desktopCapturer
    // 经测试，desktopCapturer 对高分辨率屏幕可能更快

    // 找出最大的屏幕尺寸，用于 thumbnailSize
    const maxWidth = Math.max(...displays.map((d) => d.width * d.scaleFactor));
    const maxHeight = Math.max(...displays.map((d) => d.height * d.scaleFactor));
    this.logger(`[Capture] Max thumbnail size: ${maxWidth}x${maxHeight}`);

    // 一次性获取所有屏幕截图（带重试机制）
    this.logger('[Capture] Calling desktopCapturer.getSources...');
    let sources: Electron.DesktopCapturerSource[] = [];
    const maxRetries = 3;
    const retryDelay = 500; // ms

    // 定义重试函数
    const attemptCapture = async (attempt: number): Promise<boolean> => {
      try {
        const attemptStart = Date.now();
        sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: maxWidth, height: maxHeight },
        });
        this.logger(`[Capture] Attempt ${attempt}: desktopCapturer.getSources returned ${sources.length} sources in ${Date.now() - attemptStart}ms`);

        // 检查是否有有效的截图数据
        const hasValidData = sources.length > 0 && sources.some((s) => !s.thumbnail.isEmpty());

        if (hasValidData) {
          this.logger(`[Capture] ✅ Got valid capture data on attempt ${attempt}`);
          return true;
        }

        // 没有有效数据，可能是首次权限请求
        this.logger(`[Capture] ⚠️ Attempt ${attempt}: No valid data`);
        this.logger('[Capture] (This is normal for first-time permission request on macOS)');
        return false;
      } catch (err) {
        this.logger(`[Capture] ❌ Attempt ${attempt}: desktopCapturer.getSources FAILED:`, err);
        if (attempt === maxRetries) {
          throw err;
        }
        return false;
      }
    };

    // 延迟函数
    const delay = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

    // 执行重试
    let success = await attemptCapture(1);
    if (!success && maxRetries >= 2) {
      await delay(retryDelay);
      success = await attemptCapture(2);
    }
    if (!success && maxRetries >= 3) {
      await delay(retryDelay);
      await attemptCapture(3);
    }

    // 打印每个 source 的详细信息
    sources.forEach((s, i) => {
      const size = s.thumbnail.getSize();
      this.logger(`[Capture] Source ${i}: id=${s.id}, display_id=${s.display_id}, name=${s.name}, size=${size.width}x${size.height}, isEmpty=${s.thumbnail.isEmpty()}`);
    });

    if (sources.length === 0 || sources.every((s) => s.thumbnail.isEmpty())) {
      this.logger('[Capture] ⚠️ No valid sources after all retries! This usually means:');
      this.logger('[Capture]   1. Screen recording permission is not granted');
      this.logger('[Capture]   2. User needs to grant permission and restart the app');
    }

    // 为每个显示器匹配对应的截图源
    // 记录已使用的 source，避免重复匹配
    const usedSources = new Set<string>();

    displays.forEach((display) => {
      let source;
      if (sources.length === 1) {
        [source] = sources;
      } else {
        // 优先使用 display_id 匹配（Win10/11、macOS）
        source = sources.find(
          (item) => !usedSources.has(item.id)
            && item.display_id
            && item.display_id === display.id.toString(),
        );

        // 如果 display_id 为空（Win7/Linux），使用 source.id 中的索引匹配
        if (!source) {
          source = sources.find(
            (item) => !usedSources.has(item.id)
              && item.id.startsWith(`screen:${display.id}:`),
          );
        }

        // Win7 回退：尝试通过截图尺寸匹配
        if (!source) {
          const displayWidth = Math.round(display.width * display.scaleFactor);
          const displayHeight = Math.round(display.height * display.scaleFactor);

          // 尝试找尺寸匹配的 source
          source = sources.find((item) => {
            if (usedSources.has(item.id)) return false;
            const size = item.thumbnail.getSize();
            // 允许一定误差（缩放可能导致几像素差异）
            return Math.abs(size.width - displayWidth) < 10
              && Math.abs(size.height - displayHeight) < 10;
          });

          // 如果尺寸匹配失败，使用剩余的第一个 source
          if (!source) {
            source = sources.find((item) => !usedSources.has(item.id));
          }

          if (source) {
            const size = source.thumbnail.getSize();
            this.logger(
              `Fallback matching: display ${display.id} (${displayWidth}x${displayHeight}) -> source ${source.id} (${size.width}x${size.height})`,
            );
          }
        }
      }

      if (source) {
        usedSources.add(source.id);
        const dataUrl = source.thumbnail.toDataURL();
        result.set(display.id, dataUrl);
        this.logger(`[Capture] ✅ Display ${display.id} matched to source ${source.id}, dataUrl length: ${dataUrl.length}`);
      } else {
        this.logger(`[Capture] ❌ No source found for display ${display.id}`);
      }
    });

    this.logger(`[Capture] Total captures: ${result.size}/${displays.length}`);
    this.logger(`[Capture] All captures completed in ${Date.now() - captureStart}ms`);
    this.logger('[Capture] =============================================');
    return result;
  }

  /**
   * 绑定ipc时间处理
   */
  private listenIpc(): void {
    /**
     * OK事件
     */
    ipcMain.on('SCREENSHOTS:ok', (e, buffer: Buffer, data: ScreenshotsData) => {
      this.logger(
        'SCREENSHOTS:ok buffer.length %d, data: %o',
        buffer.length,
        data,
      );

      const event = new Event();
      this.emit('ok', event, buffer, data);
      if (event.defaultPrevented) {
        return;
      }
      clipboard.writeImage(nativeImage.createFromBuffer(buffer));
      this.endCapture();
    });
    /**
     * CANCEL事件
     */
    ipcMain.on('SCREENSHOTS:cancel', () => {
      this.logger('SCREENSHOTS:cancel');

      const event = new Event();
      this.emit('cancel', event);
      if (event.defaultPrevented) {
        return;
      }
      this.endCapture();
    });

    /**
     * SAVE事件
     */
    ipcMain.on(
      'SCREENSHOTS:save',
      async (e, buffer: Buffer, data: ScreenshotsData) => {
        this.logger(
          'SCREENSHOTS:save buffer.length %d, data: %o',
          buffer.length,
          data,
        );

        const event = new Event();
        this.emit('save', event, buffer, data);
        if (event.defaultPrevented) {
          return;
        }

        let win: BrowserWindow | undefined;
        this.$views.forEach((view, id) => {
          if (view.webContents === e.sender) {
            win = this.$wins.get(id);
          }
        });

        if (!win) {
          return;
        }

        const time = new Date();
        const year = time.getFullYear();
        const month = padStart(time.getMonth() + 1, 2, '0');
        const date = padStart(time.getDate(), 2, '0');
        const hours = padStart(time.getHours(), 2, '0');
        const minutes = padStart(time.getMinutes(), 2, '0');
        const seconds = padStart(time.getSeconds(), 2, '0');
        const milliseconds = padStart(time.getMilliseconds(), 3, '0');

        win.setAlwaysOnTop(false);

        const { canceled, filePath } = await dialog.showSaveDialog(win, {
          defaultPath: `${year}${month}${date}${hours}${minutes}${seconds}${milliseconds}.png`,
          filters: [
            { name: 'Image (png)', extensions: ['png'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (!win) {
          this.emit('afterSave', new Event(), buffer, data, false); // isSaved = false
          return;
        }

        win.setAlwaysOnTop(true);
        if (canceled || !filePath) {
          this.emit('afterSave', new Event(), buffer, data, false); // isSaved = false
          return;
        }

        await fs.writeFile(filePath, buffer as Uint8Array);
        this.emit('afterSave', new Event(), buffer, data, true); // isSaved = true
        this.endCapture();
      },
    );

    /**
     * MOVE_BOUNDS事件 - 处理跨屏选框移动
     */
    ipcMain.on(
      'SCREENSHOTS:moveBounds',
      (e, bounds: Bounds, globalX: number, globalY: number) => {
        this.logger(
          'SCREENSHOTS:moveBounds bounds: %o, globalPos: (%d, %d)',
          bounds,
          globalX,
          globalY,
        );

        // 根据全局坐标找到目标显示器
        const targetDisplay = screen.getDisplayNearestPoint({
          x: globalX,
          y: globalY,
        });

        // 找到源窗口（发送事件的窗口）
        let sourceDisplayId: number | undefined;
        this.$views.forEach((view, id) => {
          if (view.webContents === e.sender) {
            sourceDisplayId = id;
          }
        });

        if (!sourceDisplayId) {
          this.logger('SCREENSHOTS:moveBounds source display not found');
          return;
        }

        // 如果目标显示器和源显示器相同，不需要处理
        if (targetDisplay.id === sourceDisplayId) {
          return;
        }

        this.logger(
          'SCREENSHOTS:moveBounds moving from display %d to %d',
          sourceDisplayId,
          targetDisplay.id,
        );

        // 将选框坐标转换为目标显示器的本地坐标
        const localBounds = {
          x: globalX - targetDisplay.bounds.x,
          y: globalY - targetDisplay.bounds.y,
          width: bounds.width,
          height: bounds.height,
        };

        // 通知目标显示器的窗口显示选框
        const targetView = this.$views.get(targetDisplay.id);
        if (targetView) {
          targetView.webContents.send('SCREENSHOTS:syncBounds', localBounds);
        }

        // 通知源显示器的窗口隐藏选框
        const sourceView = this.$views.get(sourceDisplayId);
        if (sourceView) {
          sourceView.webContents.send('SCREENSHOTS:syncBounds', null);
        }
      },
    );
  }

  /**
   * kiosk 模式会让整个应用进入“单窗口”全屏。
   * 对于存在其他 BrowserWindow 的项目，在开启截图时会把它们隐藏，
   * 因此需要在检测到其他窗口存在时跳过 kiosk。
   */
  private shouldUseKiosk(): boolean {
    if (!this.useKiosk) {
      return false;
    }

    const screenshotWins = new Set(this.$wins.values());
    const hasExternalWindows = BrowserWindow.getAllWindows().some(
      (win) => !screenshotWins.has(win),
    );

    if (hasExternalWindows) {
      this.logger('Skipping kiosk mode: other app windows detected.');
      return false;
    }

    return true;
  }
}
