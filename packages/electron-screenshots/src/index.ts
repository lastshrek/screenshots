import { Debugger } from 'debug';
import {
  BrowserView,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  dialog,
  ipcMain,
  nativeImage,
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

  private isReady = new Promise<void>((resolve) => {
    ipcMain.once('SCREENSHOTS:ready', () => {
      this.logger('SCREENSHOTS:ready');

      resolve();
    });
  });

  constructor(opts?: ScreenshotsOpts) {
    super();
    // 强制使用 console.log 以便调试，除非用户指定了自定义 logger
    this.logger = opts?.logger
      || ((...args: unknown[]) => {
        // eslint-disable-next-line no-console
        console.log('[electron-screenshots]', ...args);
      });
    this.singleWindow = opts?.singleWindow ?? true; // Default to true for performance
    this.listenIpc();
    if (opts?.lang) {
      this.setLang(opts.lang);
    }
    if (this.singleWindow) {
      // Pre-create window to speed up first capture
      // We need a dummy display or primary display to create it
      // But createWindow requires a display.
      // We can defer it or just let the first capture be slightly slower but subsequent ones fast.
      // Or we can just rely on singleWindow reuse.
    }

    // 清理旧的临时文件
    this.cleanupOldTempFiles();
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
   * 开始截图
   */
  public async startCapture(): Promise<void> {
    this.logger('startCapture');

    const displays = getAllDisplays();

    const captures = await Promise.all(
      displays.map((display) => this.capture(display)
        .then((url) => ({ display, url }))
        .catch((err) => {
          this.logger(`Failed to capture display ${display.id}:`, err);
          return null;
        })),
    );

    // 等待所有窗口创建完成
    await Promise.all(
      captures.map(async (cap) => {
        if (cap) {
          await this.createWindow(cap.display);
        }
      }),
    );

    // 延迟发送截图数据，确保React应用已经ready并注册了事件监听器
    await Promise.race([
      this.isReady,
      new Promise((resolve) => {
        setTimeout(() => resolve(undefined), 500);
      }),
    ]);

    // 再等待一小段时间，确保React应用完全初始化
    await new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 200);
    });

    // 现在发送截图数据
    this.logger('Now sending screenshot data to all displays...');
    captures.forEach((cap) => {
      if (cap) {
        const view = this.$views.get(cap.display.id);
        this.logger(
          'Sending screenshot data to display',
          cap.display.id,
          'url length:',
          cap.url.length,
        );
        view?.webContents.send('SCREENSHOTS:capture', cap.display, cap.url);
      }
    });
  }

  /**
   * 结束截图
   */
  public async endCapture(): Promise<void> {
    this.logger('endCapture');
    await this.reset();

    // Iterate over all windows
    this.$wins.forEach((win, id) => {
      const view = this.$views.get(id);
      if (win && !win.isDestroyed()) {
        win.setKiosk(false);
        win.blur();
        win.blurWebView();
        win.unmaximize();
        if (view) {
          win.removeBrowserView(view);
        }

        if (this.singleWindow) {
          win.hide();
        } else {
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
  private async createWindow(display: Display): Promise<void> {
    // 重置截图区域
    await this.reset();

    // 复用未销毁的窗口
    let win = this.$wins.get(display.id);
    let view = this.$views.get(display.id);

    if (!win || win.isDestroyed()) {
      const windowTypes: Record<string, string | undefined> = {
        darwin: 'panel',
        // linux 必须设置为 undefined，否则会在部分系统上不能触发focus 事件
        // https://github.com/nashaofu/screenshots/issues/203#issuecomment-1518923486
        linux: undefined,
        win32: 'toolbar',
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
        alwaysOnTop: true,
        /**
         * linux 下必须设置为false，否则不能全屏显示在最上层
         * mac 下设置为false，否则可能会导致程序坞不恢复问题，且与 kiosk 模式冲突
         */
        fullscreen: false,
        // mac fullscreenable 设置为 true 会导致应用崩溃
        fullscreenable: false,
        kiosk: false, // 先不启用 kiosk，等窗口显示后再启用
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
      // 等待 UI 加载完成后再把 view 加到窗口并显示
      view.webContents.once('did-finish-load', () => {
        this.logger('UI loaded successfully');
        win!.setBrowserView(view!);
        win!.show();

        // 先获得焦点，再启用 kiosk 模式
        win!.focus();
        win!.moveTop();

        // 延迟启用 kiosk 模式，确保焦点已获得
        setTimeout(() => {
          win!.setKiosk(true);
          win!.focus(); // 再次确保焦点
          this.logger('Window focused, moved to top, and kiosk enabled');
        }, 100);

        // 开启开发者工具查看错误
        view!.webContents.openDevTools();

        // 延迟检查DOM是否正确渲染和事件监听
        setTimeout(() => {
          view!.webContents
            .executeJavaScript(
              `
            const app = document.getElementById('app');
            const screenshotDiv = document.querySelector('.screenshots');
            const result = {
              appExists: !!app,
              appHasChildren: app ? app.children.length > 0 : false,
              appInnerHTML: app ? app.innerHTML.substring(0, 200) : 'no app element',
              bodyChildren: document.body.children.length,
              scriptsCount: document.querySelectorAll('script').length,
              hasReact: typeof window.React !== 'undefined',
              screenshotsElement: !!screenshotDiv,
              hasMouseListeners: screenshotDiv ? 'onmousedown' in screenshotDiv : false,
              windowFocused: document.hasFocus()
            };
            console.log('DOM Check:', JSON.stringify(result, null, 2));
            
            // 测试点击事件
            if (screenshotDiv) {
              const testClick = () => console.log('🎉 Mouse click detected!');
              screenshotDiv.addEventListener('mousedown', testClick, {once: true});
              setTimeout(() => screenshotDiv.removeEventListener('mousedown', testClick), 5000);
            }
            
            result;
          `,
            )
            .then((result: any) => {
              this.logger('DOM Check Result:', result);
            })
            .catch((err: any) => {
              this.logger('DOM Check Error:', err);
            });
        }, 1000);
      });
    } else {
      // 已有 view，直接绑定并显示窗口
      win.setBrowserView(view!);
      win.show();
      win.focus();
      win.moveTop();

      // 延迟启用 kiosk 模式
      setTimeout(() => {
        win!.setKiosk(true);
        win!.focus();
        this.logger('Reused window focused, moved to top, and kiosk enabled');
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
    view!.setBounds({
      x: 0,
      y: 0,
      width: display.width,
      height: display.height,
    });
    win.setAlwaysOnTop(true);
    // win.show() 已在 view 加载完成的回调或已有 view 的 else 分支中处理，无需再次调用
  }

  private async capture(display: Display): Promise<string> {
    this.logger('SCREENSHOTS:capture');

    try {
      const { Monitor } = await import('node-screenshots');
      const monitor = Monitor.fromPoint(
        display.x + display.width / 2,
        display.y + display.height / 2,
      );
      this.logger(
        'SCREENSHOTS:capture Monitor.fromPoint arguments %o',
        display,
      );
      this.logger('SCREENSHOTS:capture Monitor.fromPoint return %o', {
        id: monitor?.id,
        name: monitor?.name,
        x: monitor?.x,
        y: monitor?.y,
        width: monitor?.width,
        height: monitor?.height,
        rotation: monitor?.rotation,
        scaleFactor: monitor?.scaleFactor,
        frequency: monitor?.frequency,
        isPrimary: monitor?.isPrimary,
      });

      if (!monitor) {
        throw new Error(`Monitor.fromDisplay(${display.id}) get null`);
      }

      const image = await monitor.captureImage();
      const buffer = await image.toPng(true);

      // 保存到临时文件避免IPC传输大数据导致崩溃
      const tempDir = path.join(os.tmpdir(), 'electron-screenshots');
      await fs.ensureDir(tempDir);
      const tempFile = path.join(
        tempDir,
        `screenshot-${display.id}-${Date.now()}.png`,
      );
      await fs.writeFile(tempFile, buffer);
      this.tempFiles.add(tempFile); // 记录临时文件用于后续清理
      this.logger(
        'Screenshot saved to temp file:',
        tempFile,
        'size:',
        buffer.length,
      );

      return `file://${tempFile}`;
    } catch (err) {
      this.logger('SCREENSHOTS:capture Monitor capture() error %o', err);

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: display.width * display.scaleFactor,
          height: display.height * display.scaleFactor,
        },
      });

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

      // 保存到临时文件避免IPC传输大数据导致崩溃
      const pngBuffer = source.thumbnail.toPNG();
      const tempDir = path.join(os.tmpdir(), 'electron-screenshots');
      await fs.ensureDir(tempDir);
      const tempFile = path.join(
        tempDir,
        `screenshot-${display.id}-${Date.now()}.png`,
      );
      await fs.writeFile(tempFile, pngBuffer);
      this.tempFiles.add(tempFile); // 记录临时文件用于后续清理
      this.logger(
        'Screenshot saved to temp file (desktopCapturer):',
        tempFile,
        'size:',
        pngBuffer.length,
      );

      return `file://${tempFile}`;
    }
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

        await fs.writeFile(filePath, buffer);
        this.emit('afterSave', new Event(), buffer, data, true); // isSaved = true
        this.endCapture();
      },
    );
  }
}
