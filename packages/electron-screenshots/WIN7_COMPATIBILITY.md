# Windows 7 截图兼容性修改指南

## 问题背景

原代码中的 PowerShell 脚本在 Windows 7 上可能存在兼容性问题：

1. Win7 默认是 PowerShell 2.0，部分语法不支持
2. `Add-Type -AssemblyName` 在某些 Win7 环境下可能失败
3. 路径转义可能导致问题
4. **PowerShell 脚本执行可能被静默阻止**

---

## 方案一：使用 VBS 脚本（最兼容 Win7）

VBScript 在所有 Windows 版本上都原生支持，不需要 PowerShell。

```javascript
captureWindows(callback) {
  screenshotLogger.info('[captureWindows] Starting Windows screenshot (VBS method)...');
  
  const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
  const vbsFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.vbs`);
  
  // VBScript 调用 .NET 截图
  const vbsScript = `
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

' 使用 PowerShell 执行截图（VBS 作为启动器）
Dim psCmd
psCmd = "powershell -NoProfile -NoLogo -ExecutionPolicy Bypass -Command ""Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b=[System.Windows.Forms.SystemInformation]::VirtualScreen; $bmp=New-Object System.Drawing.Bitmap($b.Width,$b.Height); $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$b.Size); $bmp.Save('${tempFile.replace(/\\/g, '\\\\')}'); $g.Dispose(); $bmp.Dispose(); $img=[System.Drawing.Image]::FromFile('${tempFile.replace(/\\/g, '\\\\')}'); [System.Windows.Forms.Clipboard]::SetImage($img); $img.Dispose()"""

shell.Run psCmd, 0, True
`.trim();

  const fs = require('fs');
  fs.writeFileSync(vbsFile, vbsScript);
  
  exec(`cscript //NoLogo "${vbsFile}"`, { timeout: 30000, windowsHide: true }, (error) => {
    // 清理 VBS 文件
    try { fs.unlinkSync(vbsFile); } catch (e) {}
    
    if (error) {
      screenshotLogger.error('[captureWindows] VBS error:', error.message);
      callback('error');
    } else {
      screenshotLogger.info('[captureWindows] Screenshot successful');
      callback('image');
    }
  });
}
```

---

## 方案二：使用批处理 + mshta（更简单）

```javascript
captureWindows(callback) {
  screenshotLogger.info('[captureWindows] Starting Windows screenshot...');
  
  const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.bmp`);
  const tempFilePng = tempFile.replace('.bmp', '.png');
  
  // 使用 snippingtool（Win7 自带）
  exec('snippingtool /clip', { timeout: 30000, windowsHide: true }, (error) => {
    if (error) {
      // snippingtool 失败，尝试 PowerShell
      this.captureWindowsPowerShell(callback);
    } else {
      callback('image');
    }
  });
}

captureWindowsPowerShell(callback) {
  const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`).replace(/\\/g, '/');
  
  const psScript = `
    [void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
    [void][System.Reflection.Assembly]::LoadWithPartialName('System.Drawing')
    $b = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bmp = New-Object System.Drawing.Bitmap($b.Width, $b.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
    $bmp.Save('${tempFile}')
    $g.Dispose()
    $bmp.Dispose()
    $img = [System.Drawing.Image]::FromFile('${tempFile}')
    [System.Windows.Forms.Clipboard]::SetImage($img)
    $img.Dispose()
    Write-Host 'OK'
  `.replace(/\n/g, '; ').replace(/;[\s;]+/g, '; ').trim();

  exec(
    `powershell -NoProfile -NoLogo -ExecutionPolicy Bypass -WindowStyle Hidden -Command "${psScript}"`,
    { timeout: 30000, windowsHide: true },
    (error, stdout) => {
      if (error || !stdout.includes('OK')) {
        screenshotLogger.error('[captureWindows] PowerShell failed');
        callback('error');
      } else {
        callback('image');
      }
    }
  );
}
```

---

## 方案三：修复当前 PowerShell 方案

### 修改 `captureWindows` 方法

将原来的代码：

```javascript
captureWindows(callback) {
  screenshotLogger.info('[captureWindows] Starting Windows screenshot...');
  
  const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`).replace(/\\/g, '\\\\');
  screenshotLogger.info(`[captureWindows] Temp file: ${tempFile}`);

  const psScript = `Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bmp.Save('${tempFile}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
$img = [System.Drawing.Image]::FromFile('${tempFile}')
[System.Windows.Forms.Clipboard]::SetImage($img)
$img.Dispose()`.replace(/\n/g, '; ').replace(/;[\s;]+/g, '; ').trim();

  screenshotLogger.info('[captureWindows] Executing PowerShell command...');
  exec(`powershell -ExecutionPolicy Bypass -Command "${psScript}"`, { timeout: 30000 }, (error, stdout, stderr) => {
    // ...
  });
}
```

替换为：

```javascript
captureWindows(callback) {
  screenshotLogger.info('[captureWindows] Starting Windows screenshot...');
  
  // 使用正斜杠路径，PowerShell 支持且避免转义问题
  const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`).replace(/\\/g, '/');
  screenshotLogger.info(`[captureWindows] Temp file: ${tempFile}`);

  // Win7 兼容的 PowerShell 脚本
  // 使用 LoadWithPartialName 替代 Add-Type（PowerShell 2.0 更兼容）
  const psScript = `
    [void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
    [void][System.Reflection.Assembly]::LoadWithPartialName('System.Drawing')
    $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
    $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bmp.Save('${tempFile}')
    $graphics.Dispose()
    $bmp.Dispose()
    $img = [System.Drawing.Image]::FromFile('${tempFile}')
    [System.Windows.Forms.Clipboard]::SetImage($img)
    $img.Dispose()
  `.replace(/\n/g, '; ').replace(/;[\s;]+/g, '; ').trim();

  screenshotLogger.info('[captureWindows] Executing PowerShell command...');
  
  // -NoProfile: 不加载用户配置，加速启动
  // -WindowStyle Hidden: 隐藏 PowerShell 窗口
  // windowsHide: true: 隐藏 cmd 窗口
  exec(
    `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "${psScript}"`,
    { timeout: 30000, windowsHide: true },
    (error, stdout, stderr) => {
      if (error) {
        screenshotLogger.error('[captureWindows] PowerShell error:', error.message);
        if (stderr) {
          screenshotLogger.error('[captureWindows] stderr:', stderr);
        }
        if (stdout) {
          screenshotLogger.info('[captureWindows] stdout:', stdout);
        }
        callback('error');
      } else {
        screenshotLogger.info('[captureWindows] Screenshot successful');
        if (stdout) {
          screenshotLogger.info('[captureWindows] stdout:', stdout);
        }
        callback('image');
      }
    }
  );
}
```

## 修改说明

| 修改点 | 原代码 | 新代码 | 原因 |
|--------|--------|--------|------|
| 程序集加载 | `Add-Type -AssemblyName` | `LoadWithPartialName` | PowerShell 2.0 兼容性更好 |
| 路径转义 | `replace(/\\/g, '\\\\')` | `replace(/\\/g, '/')` | 正斜杠避免转义问题 |
| 图片保存 | `$bmp.Save(path, ImageFormat::Png)` | `$bmp.Save(path)` | 简化调用，默认就是 PNG |
| PowerShell 参数 | `-ExecutionPolicy Bypass` | `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden` | 加速启动、隐藏窗口 |
| exec 选项 | `{ timeout: 30000 }` | `{ timeout: 30000, windowsHide: true }` | 隐藏命令行窗口 |

## 测试方法

1. 在 Win7 虚拟机或真机上测试
2. 检查日志输出是否有错误
3. 确认截图是否成功保存到剪贴板

## 注意事项

- Win7 需要安装 .NET Framework 2.0 或更高版本（通常已预装）
- 如果仍有问题，检查 PowerShell 版本：`$PSVersionTable.PSVersion`
- Win7 SP1 默认 PowerShell 2.0，可升级到 PowerShell 5.1 获得更好兼容性
