# 跨屏选框移动功能 - 实现进度

## 已完成的工作

### 1. 主进程（electron-screenshots）
- ✅ 添加了 `SCREENSHOTS:moveBounds` IPC 监听器
- ✅ 实现了跨屏选框坐标转换逻辑
- ✅ 实现了 `SCREENSHOTS:syncBounds` 事件分发

### 2. Preload 脚本
- ✅ 添加了 `moveBounds` 方法到 contextBridge

### 3. 前端（react-screenshots/app.tsx）
- ✅ 添加了 `syncedBounds` 状态管理
- ✅ 添加了 `syncBounds` 事件监听器

## 待完成的工作

### 1. 修改 Screenshots 组件
需要在 `/packages/react-screenshots/src/Screenshots/index.tsx` 中：
- 添加 `syncedBounds` prop
- 将 `syncedBounds` 传递给 `ScreenshotsCanvas` 组件

```typescript
export interface ScreenshotsProps {
  url?: string
  width: number
  height: number
  lang?: Partial<Lang>
  className?: string
  syncedBounds?: Bounds | null  // 新增
  [key: string]: unknown
}
```

### 2. 修改 ScreenshotsCanvas 组件
需要在 `/packages/react-screenshots/src/Screenshots/ScreenshotsCanvas/index.tsx` 中：

#### 2.1 接收 syncedBounds prop
```typescript
// 在组件 props 中添加
const { url, image, width, height, syncedBounds } = useStore()
```

#### 2.2 监听 syncedBounds 变化
```typescript
useEffect(() => {
  if (syncedBounds) {
    boundsDispatcher.set(syncedBounds)
  } else if (syncedBounds === null && bounds) {
    // 当前屏幕的选框被移到其他屏幕，清空本地选框
    boundsDispatcher.reset()
  }
}, [syncedBounds])
```

#### 2.3 修改 updateBounds 方法
在 `updateBounds` 方法中添加边界检测和跨屏移动逻辑：

```typescript
const updateBounds = useCallback(
  (e: MouseEvent) => {
    if (
      !resizeOrMoveRef.current ||
      !pointRef.current ||
      !boundsRef.current ||
      !bounds
    ) {
      return
    }

    // 计算新的选框位置
    const points = getPoints(
      e,
      resizeOrMoveRef.current,
      pointRef.current,
      boundsRef.current
    )
    const newBounds = getBoundsByPoints(
      points[0],
      points[1],
      bounds,
      width,
      height,
      resizeOrMoveRef.current
    )

    // 检测是否移出当前屏幕边界
    const isOutOfBounds = 
      newBounds.x < 0 || 
      newBounds.y < 0 || 
      newBounds.x + newBounds.width > width || 
      newBounds.y + newBounds.height > height

    if (isOutOfBounds && resizeOrMoveRef.current === 'move') {
      // 计算全局坐标
      const globalX = display.x + newBounds.x
      const globalY = display.y + newBounds.y

      // 通知主进程选框移动
      window.screenshots.moveBounds(newBounds, globalX, globalY)

      // 清空当前选框
      boundsDispatcher.reset()
      resizeOrMoveRef.current = undefined
      pointRef.current = null
      boundsRef.current = null
    } else {
      // 正常更新选框
      boundsDispatcher.set(newBounds)
    }
  },
  [width, height, bounds, boundsDispatcher, display]
)
```

### 3. 更新 TypeScript 类型定义
需要在 `/packages/react-screenshots/src/global.d.ts` 中添加 `moveBounds` 方法的类型定义：

```typescript
interface Window {
  screenshots: {
    ready: () => void
    reset: () => void
    save: (arrayBuffer: ArrayBuffer, data: ScreenshotsData) => void
    cancel: () => void
    ok: (arrayBuffer: ArrayBuffer, data: ScreenshotsData) => void
    moveBounds: (bounds: Bounds, globalX: number, globalY: number) => void  // 新增
    on: (channel: string, fn: (...args: unknown[]) => void) => void
    off: (channel: string, fn: (...args: unknown[]) => void) => void
  }
}
```

## 测试建议

1. 在双屏环境下测试选框拖动
2. 测试从左屏拖到右屏
3. 测试从右屏拖到左屏
4. 测试选框尺寸在跨屏后是否保持
5. 测试快速拖动时的响应性

## 注意事项

- 需要确保 `display` 对象在 `ScreenshotsCanvas` 中可用
- 可能需要添加防抖逻辑，避免频繁的跨屏切换
- 需要处理选框部分超出屏幕边界的情况
