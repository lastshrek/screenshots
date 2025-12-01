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

    // 清理旧的临时文件
    this.cleanupOldTempFiles();

    // 延迟预加载窗口，避免影响应用启动
    if (this.singleWindow) {
      setTimeout(() => this.preloadWindows(), 1000);
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
      focusable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      fullscreen: false,
      fullscreenable: false,
      kiosk: false,
      backgroundColor: '#00000001',
      titleBarStyle: 'hidden',
      hasShadow: false,
      paintWhenInitiallyHidden: true, // 允许后台渲染
      roundedCorners: false,
      enableLargerThanScreen: false,
      acceptFirstMouse: true,
    });

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
   */
  private checkScreenRecordingPermission(): boolean {
    if (process.platform !== 'darwin') {
      // 非 macOS 平台不需要检查
      return true;
    }

    const status = systemPreferences.getMediaAccessStatus('screen');
    this.logger('Screen recording permission status:', status);

    // 允许 'granted' 和 'not-determined' 状态
    // 'not-determined' 时系统会在首次截图时自动弹出权限请求
    // 只有明确 'denied' 或 'restricted' 时才阻止
    return status !== 'denied' && status !== 'restricted';
  }

  /**
   * 开始截图
   */
  public async startCapture(): Promise<void> {
    this.logger('startCapture');
    const startTime = Date.now();

    // 检查屏幕录制权限（仅 macOS）
    if (process.platform === 'darwin' && !this.checkScreenRecordingPermission()) {
      this.logger('Screen recording permission denied');
      throw new Error(
        'Screen recording permission was denied. Please grant permission in System Preferences > Privacy & Security > Screen Recording, then restart the application.',
      );
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

    // 并行执行：截图 + 准备窗口
    const [captures] = await Promise.all([
      // 截图
      Promise.all(
        displays.map((display) => this.capture(display)
          .then((url) => ({ display, url }))
          .catch((err) => {
            this.logger(`Failed to capture display ${display.id}:`, err);
            return null;
          })),
      ),
      // 确保窗口已准备好（如果使用预加载）
      this.singleWindow ? this.ensureWindowsReady(displays) : Promise.resolve(),
    ]);

    this.logger(`Capture completed in ${Date.now() - startTime}ms`);

    // 显示窗口并发送数据
    const validCaptures = captures.filter((cap): cap is NonNullable<typeof cap> => cap !== null);

    await Promise.all(validCaptures.map((cap) => this.showWindowWithCapture(cap.display, cap.url)));

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
  private async showWindowWithCapture(display: Display, url: string): Promise<void> {
    // 尝试使用预加载的窗口
    const win = this.preloadedWins.get(display.id);
    const view = this.preloadedViews.get(display.id);

    if (win && !win.isDestroyed() && view && this.preloadReady.get(display.id)) {
      // 使用预加载的窗口
      this.logger(`Using preloaded window for display ${display.id}`);
      this.$wins.set(display.id, win);
      this.$views.set(display.id, view);
      this.preloadedWins.delete(display.id);
      this.preloadedViews.delete(display.id);
      this.preloadReady.delete(display.id);

      // 更新窗口位置（以防显示器配置变化）
      win.setBounds(display);
      view.setBounds({
        x: 0, y: 0, width: display.width, height: display.height,
      });

      // 显示窗口
      win.setAlwaysOnTop(true, 'screen-saver');
      win.show();
      win.focus();
      win.moveTop();

      // 发送截图数据
      view.webContents.send('SCREENSHOTS:capture', display, url);

      this.emit('windowCreated', win);
      win.on('closed', () => {
        this.emit('windowClosed', win);
        this.$wins.delete(display.id);
        this.$views.delete(display.id);
      });
    } else {
      // 回退：创建新窗口
      this.logger(`Creating new window for display ${display.id}`);
      await this.createWindow(display, true);
      const newView = this.$views.get(display.id);
      if (newView) {
        // 等待 UI 加载完成后发送数据
        if (newView.webContents.getURL()) {
          newView.webContents.send('SCREENSHOTS:capture', display, url);
        } else {
          newView.webContents.once('did-finish-load', () => {
            newView.webContents.send('SCREENSHOTS:capture', display, url);
          });
        }
      }
    }
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

  private async capture(display: Display): Promise<string> {
    this.logger('SCREENSHOTS:capture display:', display.id);
    const captureStart = Date.now();

    // 使用 Electron 内置的 desktopCapturer，全平台通用（Win7/10/11、macOS、Linux）
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: display.width * display.scaleFactor,
        height: display.height * display.scaleFactor,
      },
    });

    this.logger(`desktopCapturer.getSources took ${Date.now() - captureStart}ms`);

    let source;
    // Linux系统上，screen.getDisplayNearestPoint 返回的 Display 对象的 id
    // 和这里 source 对象上的 display_id(Linux上，这个值是空字符串) 或 id 的中间部分，都不一致
    // 但是，如果只有一个显示器的话，其实不用判断，直接返回就行
    if (sources.length === 1) {
      [source] = sources;
    } else {
      source = sources.find(
        (item) => item.display_id === display.id.toString()
          || item.id.startsWith(`screen:${display.id}:`),
      );
    }

    if (!source) {
      this.logger(
        "SCREENSHOTS:capture Can't find screen source. sources: %o, display: %o",
        sources,
        display,
      );
      throw new Error("Can't find screen source");
    }

    // 直接使用 Data URL，避免文件 I/O 开销
    // 对于大多数屏幕分辨率，这比写入临时文件更快
    const dataUrl = source.thumbnail.toDataURL();
    this.logger(
      `Screenshot captured for display ${display.id}, size: ${dataUrl.length}, took ${Date.now() - captureStart}ms`,
    );

    return dataUrl;
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
