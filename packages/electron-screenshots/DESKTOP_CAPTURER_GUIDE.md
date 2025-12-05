# Electron desktopCapturer 截图接入指南

## 概述

`desktopCapturer` 是 Electron 内置的截图 API，**全平台通用**（Win7/10/11、macOS、Linux），无需编译原生模块。

## 前置要求

### Electron 版本要求

| 目标系统 | Electron 版本要求 |
|----------|-------------------|
| Windows 7 | <= 22 |
| Windows 10/11 | 任意版本 |
| macOS 10.13+ | 任意版本 |
| Linux | 任意版本 |

检查当前版本：
```bash
npm list electron
```

如需支持 Win7，降级到 Electron 22：
```bash
npm install electron@22
```

---

## 完整代码示例

### 方式一：主进程直接使用

创建文件 `screenshot.js`：

```javascript
/**
 * Electron desktopCapturer 截图模块
 * 兼容 Win7/10/11、macOS、Linux
 */

const { desktopCapturer, clipboard, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ScreenCapture {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.debug = options.debug || false;
  }

  /**
   * 记录调试日志
   */
  log(...args) {
    if (this.debug) {
      this.logger.log('[ScreenCapture]', ...args);
    }
  }

  /**
   * 记录错误日志
   */
  error(...args) {
    this.logger.error('[ScreenCapture]', ...args);
  }

  /**
   * 获取所有显示器信息
   */
  getDisplays() {
    try {
      const displays = screen.getAllDisplays();
      this.log('Found displays:', displays.length);
      displays.forEach((d, i) => {
        this.log(`  Display ${i}: id=${d.id}, bounds=${JSON.stringify(d.bounds)}, scaleFactor=${d.scaleFactor}`);
      });
      return displays;
    } catch (err) {
      this.error('Failed to get displays:', err.message);
      return [];
    }
  }

  /**
   * 截取所有屏幕
   * @returns {Promise<Array<{displayId: number, image: NativeImage, buffer: Buffer}>>}
   */
  async captureAllScreens() {
    this.log('captureAllScreens() called');

    try {
      const displays = this.getDisplays();
      if (displays.length === 0) {
        throw new Error('No displays found');
      }

      // 计算最大分辨率（考虑缩放因子）
      const maxWidth = Math.max(...displays.map(d => d.bounds.width * d.scaleFactor));
      const maxHeight = Math.max(...displays.map(d => d.bounds.height * d.scaleFactor));

      this.log(`Requesting thumbnails with size: ${maxWidth}x${maxHeight}`);

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: maxWidth,
          height: maxHeight
        }
      });

      this.log(`Got ${sources.length} screen sources`);

      if (sources.length === 0) {
        throw new Error('No screen sources found. Check screen recording permissions.');
      }

      const results = [];
      for (const source of sources) {
        this.log(`Processing source: id=${source.id}, name=${source.name}, display_id=${source.display_id}`);
        
        const image = source.thumbnail;
        if (image.isEmpty()) {
          this.error(`Source ${source.id} returned empty image`);
          continue;
        }

        results.push({
          displayId: source.display_id || source.id,
          name: source.name,
          image: image,
          buffer: image.toPNG(),
          size: image.getSize()
        });

        this.log(`  Image size: ${image.getSize().width}x${image.getSize().height}`);
      }

      return results;
    } catch (err) {
      this.error('captureAllScreens() failed:', err.message);
      this.error('Stack:', err.stack);
      throw err;
    }
  }

  /**
   * 截取主屏幕
   * @returns {Promise<{image: NativeImage, buffer: Buffer}>}
   */
  async capturePrimaryScreen() {
    this.log('capturePrimaryScreen() called');

    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      this.log(`Primary display: id=${primaryDisplay.id}, size=${primaryDisplay.bounds.width}x${primaryDisplay.bounds.height}`);

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: primaryDisplay.bounds.width * primaryDisplay.scaleFactor,
          height: primaryDisplay.bounds.height * primaryDisplay.scaleFactor
        }
      });

      this.log(`Got ${sources.length} sources`);

      // 尝试匹配主显示器
      let source = sources.find(s => 
        s.display_id === primaryDisplay.id.toString() ||
        s.id.includes(primaryDisplay.id.toString())
      );

      // 如果没找到，使用第一个
      if (!source && sources.length > 0) {
        this.log('Could not match primary display, using first source');
        source = sources[0];
      }

      if (!source) {
        throw new Error('No screen source found');
      }

      const image = source.thumbnail;
      if (image.isEmpty()) {
        throw new Error('Captured image is empty');
      }

      this.log(`Captured image size: ${image.getSize().width}x${image.getSize().height}`);

      return {
        image: image,
        buffer: image.toPNG(),
        size: image.getSize()
      };
    } catch (err) {
      this.error('capturePrimaryScreen() failed:', err.message);
      throw err;
    }
  }

  /**
   * 截图并复制到剪贴板
   * @returns {Promise<boolean>}
   */
  async captureToClipboard() {
    this.log('captureToClipboard() called');

    try {
      const result = await this.capturePrimaryScreen();
      clipboard.writeImage(result.image);
      this.log('Image copied to clipboard');
      return true;
    } catch (err) {
      this.error('captureToClipboard() failed:', err.message);
      return false;
    }
  }

  /**
   * 截图并保存到文件
   * @param {string} filePath - 保存路径，如果为空则保存到临时目录
   * @returns {Promise<string>} 保存的文件路径
   */
  async captureToFile(filePath) {
    this.log('captureToFile() called, path:', filePath);

    try {
      const result = await this.capturePrimaryScreen();

      // 如果没有指定路径，保存到临时目录
      if (!filePath) {
        filePath = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
      }

      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, result.buffer);
      this.log('Image saved to:', filePath);

      return filePath;
    } catch (err) {
      this.error('captureToFile() failed:', err.message);
      throw err;
    }
  }

  /**
   * 兼容原有 screenCapture 接口
   * @param {string} outputPath - 输出路径（可选）
   * @param {boolean} isHideWindow - 是否隐藏窗口（忽略）
   * @param {Function} callback - 回调函数 (result) => {}
   */
  async screenCapture(outputPath, isHideWindow, callback) {
    // 兼容不同的调用方式
    if (typeof outputPath === 'function') {
      callback = outputPath;
      outputPath = '';
    } else if (typeof isHideWindow === 'function') {
      callback = isHideWindow;
    }

    this.log('screenCapture() called (legacy interface)');

    try {
      await this.captureToClipboard();
      callback('image');
    } catch (err) {
      this.error('screenCapture() failed:', err.message);
      callback('error');
    }
  }
}

module.exports = { ScreenCapture };
```

### 使用示例

```javascript
const { ScreenCapture } = require('./screenshot');

// 创建实例，开启调试模式
const capture = new ScreenCapture({ debug: true });

// 方式1：截图到剪贴板
capture.captureToClipboard().then(success => {
  console.log('截图成功:', success);
});

// 方式2：截图到文件
capture.captureToFile('./screenshot.png').then(filePath => {
  console.log('保存到:', filePath);
});

// 方式3：兼容旧接口
capture.screenCapture('', false, (result) => {
  if (result === 'image') {
    console.log('截图成功，已复制到剪贴板');
  } else {
    console.log('截图失败');
  }
});
```

---

## 方式二：通过 IPC 在渲染进程中调用

### 主进程 (main.js)

```javascript
const { ipcMain } = require('electron');
const { ScreenCapture } = require('./screenshot');

const capture = new ScreenCapture({ debug: true });

// 注册 IPC 处理器
ipcMain.handle('screenshot:capture', async () => {
  try {
    const result = await capture.capturePrimaryScreen();
    return {
      success: true,
      // 将 Buffer 转为 base64 传输
      data: result.buffer.toString('base64'),
      size: result.size
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

ipcMain.handle('screenshot:captureToClipboard', async () => {
  return await capture.captureToClipboard();
});

ipcMain.handle('screenshot:captureToFile', async (event, filePath) => {
  try {
    const savedPath = await capture.captureToFile(filePath);
    return { success: true, path: savedPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
```

### 预加载脚本 (preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('screenshot', {
  capture: () => ipcRenderer.invoke('screenshot:capture'),
  captureToClipboard: () => ipcRenderer.invoke('screenshot:captureToClipboard'),
  captureToFile: (filePath) => ipcRenderer.invoke('screenshot:captureToFile', filePath)
});
```

### 渲染进程使用

```javascript
// 截图并获取 base64 数据
const result = await window.screenshot.capture();
if (result.success) {
  const imgSrc = `data:image/png;base64,${result.data}`;
  document.getElementById('preview').src = imgSrc;
} else {
  console.error('截图失败:', result.error);
}

// 截图到剪贴板
const success = await window.screenshot.captureToClipboard();
console.log('截图到剪贴板:', success);

// 截图到文件
const fileResult = await window.screenshot.captureToFile('C:/screenshots/test.png');
console.log('保存结果:', fileResult);
```

---

## 常见问题排查

### 1. 截图返回空图片

**可能原因：**
- macOS 未授予屏幕录制权限
- thumbnailSize 设置过小

**解决方案：**
```javascript
// macOS 检查权限
const { systemPreferences } = require('electron');
if (process.platform === 'darwin') {
  const status = systemPreferences.getMediaAccessStatus('screen');
  console.log('Screen recording permission:', status);
  // 'granted' | 'denied' | 'restricted' | 'not-determined'
}
```

### 2. Win7 上无法运行

**可能原因：**
- Electron 版本 >= 23（不支持 Win7）

**解决方案：**
```bash
npm install electron@22
```

### 3. 多显示器只截取了一个

**解决方案：**
使用 `captureAllScreens()` 方法获取所有屏幕。

### 4. 截图分辨率不对

**解决方案：**
```javascript
const display = screen.getPrimaryDisplay();
const sources = await desktopCapturer.getSources({
  types: ['screen'],
  thumbnailSize: {
    // 考虑 DPI 缩放
    width: display.bounds.width * display.scaleFactor,
    height: display.bounds.height * display.scaleFactor
  }
});
```

### 5. 调试日志

开启调试模式查看详细日志：
```javascript
const capture = new ScreenCapture({ 
  debug: true,
  logger: console // 或自定义 logger
});
```

---

## 与 electron-screenshots 库配合使用

如果你同时使用 `electron-screenshots` 库，它内部已经使用了 `desktopCapturer`，无需额外配置。

安装最新版本：
```bash
npm install github:lastshrek/screenshots#2592ed9
```

该版本已移除 `node-screenshots` 依赖，统一使用 `desktopCapturer`，完全兼容 Win7。
