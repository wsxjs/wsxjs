# Chrome调试指南 - WSXJS

## 概述

本指南介绍如何使用Chrome DevTools调试WSXJS应用，包括Web Components、JSX渲染和性能分析。

## 快速开始

### 1. 启动调试模式

```bash
# 启动WSX应用和Chrome调试
pnpm debug:wsx

# 或者分别启动
pnpm dev                    # 启动WSX应用 (http://localhost:5174)
pnpm debug:chrome          # 启动Chrome调试模式
```

### 2. 访问调试页面

- **WSX应用**: http://localhost:5174
- **Chrome调试**: http://localhost:9222

## Chrome DevTools功能

### 🔍 检查Web Components

1. **打开DevTools**: F12 或右键 → 检查
2. **Elements面板**: 查看DOM结构
3. **Shadow DOM**: 展开Web Components查看Shadow DOM
4. **样式检查**: 实时修改CSS样式

### 🐛 JavaScript调试

1. **Sources面板**: 设置断点
2. **Console面板**: 查看日志和错误
3. **Network面板**: 监控网络请求
4. **Performance面板**: 分析性能

### 🎨 CSS调试

1. **Styles面板**: 查看和修改CSS
2. **Computed面板**: 查看计算样式
3. **Layout面板**: 检查布局和盒模型

## WSXJS特定调试

### Web Components调试

```javascript
// 在Console中检查Web Components
document.querySelector('wsx-app');           // 检查主应用组件
document.querySelector('color-picker');      // 检查颜色选择器
document.querySelector('wsx-button');         // 检查按钮组件

// 检查Shadow DOM
const app = document.querySelector('wsx-app');
console.log(app.shadowRoot);                 // 查看Shadow DOM
```

### JSX渲染调试

```javascript
// 检查组件渲染
const app = document.querySelector('wsx-app');
console.log(app.render());                   // 查看渲染结果

// 检查组件状态
console.log(app.appTitle);                   // 查看标题
console.log(app.appTheme);                   // 查看主题
```

### 事件调试

```javascript
// 监听组件事件
document.addEventListener('colorchange', (e) => {
    console.log('Color changed:', e.detail);
});

// 监听按钮点击
document.addEventListener('click', (e) => {
    if (e.target.matches('wsx-button')) {
        console.log('Button clicked:', e.target);
    }
});
```

## 性能分析

### 1. 组件渲染性能

```javascript
// 测量组件渲染时间
console.time('app-render');
const app = document.querySelector('wsx-app');
app.rerender();
console.timeEnd('app-render');
```

### 2. 内存使用分析

1. **Memory面板**: 检查内存泄漏
2. **Performance面板**: 分析渲染性能
3. **Timeline面板**: 查看事件时间线

## 常见问题调试

### 组件不显示

```javascript
// 检查组件是否正确注册
console.log(customElements.get('wsx-app'));      // 应该返回类定义
console.log(customElements.get('color-picker')); // 应该返回类定义
```

### 样式不生效

```javascript
// 检查Shadow DOM样式
const app = document.querySelector('wsx-app');
const styles = app.shadowRoot.querySelector('style');
console.log(styles.textContent);                 // 查看注入的样式
```

### 事件不触发

```javascript
// 检查事件监听器
const button = document.querySelector('wsx-button');
console.log(button.onclick);                     // 查看点击事件
console.log(button.eventListeners);              // 查看所有事件监听器
```

## 调试技巧

### 1. 使用断点

```javascript
// 在组件方法中设置断点
class App extends WebComponent {
    render() {
        debugger; // 在这里设置断点
        return <div>...</div>;
    }
}
```

### 2. 使用Console API

```javascript
// 分组日志
console.group('WSX Debug');
console.log('App rendered');
console.log('Color picker initialized');
console.groupEnd();

// 表格显示
console.table([
    { component: 'wsx-app', status: 'rendered' },
    { component: 'color-picker', status: 'initialized' }
]);
```

### 3. 使用Performance API

```javascript
// 测量性能
performance.mark('render-start');
app.rerender();
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');
```

## 高级调试

### 1. 远程调试

```bash
# 启动远程调试
chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### 2. 移动设备调试

1. 在Chrome中访问 `chrome://inspect`
2. 连接移动设备
3. 启用USB调试
4. 选择设备进行调试

### 3. 网络调试

```javascript
// 监控网络请求
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.log('Network request:', entry.name, entry.duration);
    }
});
observer.observe({ entryTypes: ['resource'] });
```

## 调试工具扩展

### 推荐的Chrome扩展

1. **React Developer Tools** - 类似工具可用于Web Components
2. **Vue.js devtools** - 参考其调试方式
3. **Web Components DevTools** - 专门用于Web Components调试

### 自定义调试工具

```javascript
// 创建WSX调试工具
window.WSXDebug = {
    inspect(selector) {
        const element = document.querySelector(selector);
        if (element && element.shadowRoot) {
            console.log('Shadow DOM:', element.shadowRoot);
            return element.shadowRoot;
        }
        return element;
    },
    
    logComponents() {
        const components = document.querySelectorAll('*');
        const wsxComponents = Array.from(components).filter(el => 
            el.tagName.toLowerCase().includes('-')
        );
        console.table(wsxComponents.map(el => ({
            tagName: el.tagName,
            className: el.constructor.name,
            hasShadowRoot: !!el.shadowRoot
        })));
    }
};
```

## 总结

使用Chrome DevTools调试WSXJS应用可以：

- 🔍 **深入检查Web Components结构**
- 🐛 **调试JSX渲染过程**
- 🎨 **实时修改样式和布局**
- ⚡ **分析性能和内存使用**
- 📱 **测试响应式设计**

通过掌握这些调试技巧，您可以更高效地开发和维护WSXJS应用。 
