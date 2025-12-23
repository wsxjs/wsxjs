# @wsxjs/wsx-base-components

现代化的 Web Components 基础组件库，基于 WSXJS 构建。

## 🚀 快速开始

### 安装

```bash
npm install @wsxjs/wsx-base-components
```

### 使用

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { Button } from '@wsxjs/wsx-base-components';
    </script>
</head>
<body>
    <wsx-button variant="primary">Hello World</wsx-button>
</body>
</html>
```

## 🎨 组件

### Button - 现代按钮组件

一个完全重新设计的现代化按钮组件，具有语义化设计、无障碍访问和响应式布局。

#### 特性

- **6种变体** - Primary, Secondary, Outline, Ghost, Danger, Link
- **3种尺寸** - Small, Medium, Large
- **完整状态** - Normal, Hover, Active, Disabled, Loading
- **图标支持** - 左侧/右侧图标，SVG动画加载器
- **布局选项** - Block, Rounded
- **无障碍访问** - 键盘导航，ARIA支持
- **响应式设计** - 移动端适配，高对比度模式

#### 使用示例

```html
<!-- 基础用法 -->
<wsx-button variant="primary">Primary Button</wsx-button>
<wsx-button variant="secondary">Secondary Button</wsx-button>
<wsx-button variant="danger">Delete</wsx-button>

<!-- 图标按钮 -->
<wsx-button icon="🚀" variant="primary">Launch</wsx-button>
<wsx-button icon="→" icon-position="right" variant="primary">Next</wsx-button>

<!-- 状态按钮 -->
<wsx-button loading variant="primary">Loading...</wsx-button>
<wsx-button disabled variant="primary">Disabled</wsx-button>

<!-- 布局按钮 -->
<wsx-button block variant="primary">Full Width</wsx-button>
<wsx-button rounded variant="primary">Rounded</wsx-button>
```

#### API

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `string` | `"primary"` | 按钮变体：primary, secondary, outline, ghost, danger, link |
| `size` | `string` | `"md"` | 按钮尺寸：sm, md, lg |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `icon` | `string` | `null` | 图标内容 |
| `icon-position` | `string` | `"left"` | 图标位置：left, right |
| `block` | `boolean` | `false` | 是否块级布局 |
| `rounded` | `boolean` | `false` | 是否圆角样式 |
| `href` | `string` | `null` | 链接地址（作为链接使用） |
| `target` | `string` | `"_blank"` | 链接目标 |
| `type` | `string` | `"button"` | 按钮类型：button, submit, reset |

#### 事件

```javascript
// 监听点击事件
button.addEventListener('wsx-button-click', (event) => {
    console.log('Button clicked:', event.detail);
    // event.detail 包含：variant, size, disabled, loading
});
```

## 🛠️ 开发

### 安装依赖

```bash
pnpm install
```

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 启动演示服务器

```bash
# 构建并启动演示服务器
npm run demo

# 或者直接启动静态服务器
npm run start
```

访问 http://localhost:3000 查看演示页面。

### 可用的脚本

- `npm run build` - 构建生产版本
- `npm run dev` - 开发模式（监听文件变化）
- `npm run serve` - 启动预览服务器
- `npm run demo` - 构建并启动演示服务器
- `npm run start` - 启动静态文件服务器
- `npm run clean` - 清理构建文件
- `npm run typecheck` - TypeScript 类型检查
- `npm run lint` - ESLint 检查
- `npm run lint:fix` - ESLint 自动修复

## 🎯 主题定制

所有样式都通过 CSS 自定义属性控制：

```css
:host {
    /* 颜色系统 */
    --wsx-button-primary-bg: #3b82f6;
    --wsx-button-primary-hover-bg: #2563eb;
    --wsx-button-primary-color: #ffffff;
    
    /* 尺寸系统 */
    --wsx-button-sm-padding: 0.5rem 0.75rem;
    --wsx-button-md-padding: 0.75rem 1rem;
    --wsx-button-lg-padding: 1rem 1.5rem;
    
    /* 视觉效果 */
    --wsx-button-border-radius: 0.5rem;
    --wsx-button-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --wsx-button-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 深色主题

```css
[data-theme="dark"] {
    --wsx-button-primary-bg: #1e40af;
    --wsx-button-secondary-bg: #374151;
    --wsx-button-outline-border: #4b5563;
}
```

## ♿ 无障碍访问

组件完全支持无障碍访问：

- **键盘导航** - 支持 Enter 和 Space 键激活
- **ARIA 属性** - 完整的屏幕阅读器支持
- **焦点管理** - 清晰的焦点指示器
- **语义化标签** - 正确的 HTML 结构

## 📱 响应式设计

- **移动端适配** - 自动调整尺寸和间距
- **高对比度模式** - 支持用户偏好设置
- **减少动画** - 尊重用户的可访问性偏好
- **打印样式** - 完整的打印支持

## 🌐 浏览器支持

- Chrome 67+
- Firefox 63+
- Safari 11.1+
- Edge 79+

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📚 相关链接

- [WSXJS](https://github.com/wsxjs/wsxjs)
- [设计文档](./docs/modern-button-design.md)
- [在线演示](http://localhost:3000) 
