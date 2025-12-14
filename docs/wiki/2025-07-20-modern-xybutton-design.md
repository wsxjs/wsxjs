# Modern XyButton 组件设计文档

## 设计理念

Modern XyButton 是一个完全重新设计的按钮组件，遵循现代 Web 设计标准和最佳实践。

### 核心原则

1. **语义化设计** - 清晰的视觉层次和状态表达
2. **无障碍访问** - 完整的键盘导航和屏幕阅读器支持
3. **响应式设计** - 适配各种屏幕尺寸和设备
4. **现代视觉效果** - 微妙的阴影、圆角、过渡动画
5. **灵活主题系统** - 支持 CSS 变量自定义
6. **性能优化** - 轻量级实现，零运行时开销

## 组件特性

### 1. 按钮变体 (Variants)

支持 6 种标准变体，适应不同的使用场景：

- **Primary** - 主要操作，如提交、确认
- **Secondary** - 次要操作，如取消、返回
- **Outline** - 边框样式，适合表单操作
- **Ghost** - 透明背景，适合工具栏
- **Danger** - 危险操作，如删除、警告
- **Link** - 链接样式，保持视觉一致性

### 2. 按钮尺寸 (Sizes)

三种标准尺寸，确保界面的一致性：

- **Small (sm)** - 紧凑空间，如表格操作
- **Medium (md)** - 默认尺寸，适合大多数场景
- **Large (lg)** - 重要操作，如登录按钮

### 3. 状态支持

完整的状态管理系统：

- **Normal** - 默认状态
- **Hover** - 悬停状态，提供视觉反馈
- **Active** - 激活状态，表示当前选中
- **Pressed** - 按下状态，提供触觉反馈
- **Disabled** - 禁用状态，防止交互
- **Loading** - 加载状态，显示进度指示器

### 4. 图标支持

灵活的图标系统：

- **左侧图标** - 增强按钮语义
- **右侧图标** - 表示操作方向
- **仅图标** - 节省空间的设计
- **SVG 动画** - 加载状态的自定义动画

### 5. 布局选项

多种布局选择：

- **Inline** - 默认内联布局
- **Block** - 块级布局，占满容器宽度
- **Rounded** - 圆角样式，现代感更强

## 技术实现

### 1. 组件结构

```typescript
@autoRegister({ tagName: "xy-button" })
export default class XyButton extends WebComponent {
    // 基础属性
    private disabled: boolean = false;
    private loading: boolean = false;
    
    // 按钮类型
    private variant: string = "primary";
    private size: string = "md";
    
    // 表单属性
    private type: string = "button";
    
    // 图标和内容
    private icon: string | null = null;
    private iconPosition: string = "left";
    
    // 布局
    private block: boolean = false;
    private rounded: boolean = false;
}
```

### 2. CSS 架构

采用 BEM 命名规范和 CSS 自定义属性：

```css
/* 基础样式 */
.xy-button {
    /* 使用 CSS 自定义属性 */
    --xy-button-primary-bg: #3b82f6;
    --xy-button-border-radius: 0.5rem;
    --xy-button-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 变体样式 */
.xy-button--primary { /* ... */ }
.xy-button--secondary { /* ... */ }

/* 尺寸样式 */
.xy-button--sm { /* ... */ }
.xy-button--lg { /* ... */ }

/* 状态样式 */
.xy-button--disabled { /* ... */ }
.xy-button--loading { /* ... */ }
```

### 3. 无障碍访问

完整的无障碍支持：

```typescript
// 键盘导航
private handleKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
        case "Enter":
        case " ":
            event.preventDefault();
            this.handleClick();
            break;
    }
};

// ARIA 属性
this.buttonElement.setAttribute("aria-disabled", "true");
```

### 4. 事件系统

自定义事件支持：

```typescript
this.dispatchEvent(new CustomEvent("xy-button-click", {
    detail: {
        variant: this.variant,
        size: this.size,
        disabled: this.disabled,
        loading: this.loading,
    },
    bubbles: true,
    composed: true,
}));
```

## 使用示例

### 基础用法

```html
<!-- 主要按钮 -->
<xy-button variant="primary">Primary Button</xy-button>

<!-- 次要按钮 -->
<xy-button variant="secondary">Secondary Button</xy-button>

<!-- 危险按钮 -->
<xy-button variant="danger">Delete</xy-button>
```

### 图标按钮

```html
<!-- 左侧图标 -->
<xy-button icon="🚀" variant="primary">Launch</xy-button>

<!-- 右侧图标 -->
<xy-button icon="→" icon-position="right" variant="primary">Next</xy-button>

<!-- 仅图标 -->
<xy-button icon="⚙️" variant="ghost"></xy-button>
```

### 状态按钮

```html
<!-- 加载状态 -->
<xy-button loading variant="primary">Loading...</xy-button>

<!-- 禁用状态 -->
<xy-button disabled variant="primary">Disabled</xy-button>

<!-- 激活状态 -->
<xy-button active variant="primary">Active</xy-button>
```

### 布局按钮

```html
<!-- 块级按钮 -->
<xy-button block variant="primary">Full Width</xy-button>

<!-- 圆角按钮 -->
<xy-button rounded variant="primary">Rounded</xy-button>
```

### 链接按钮

```html
<!-- 外部链接 -->
<xy-button href="https://example.com" target="_blank" variant="primary">
    External Link
</xy-button>

<!-- 内部链接 -->
<xy-button href="/about" variant="link">About</xy-button>
```

## 主题定制

### CSS 变量

所有样式都通过 CSS 自定义属性控制：

```css
:host {
    /* 颜色系统 */
    --xy-button-primary-bg: #3b82f6;
    --xy-button-primary-hover-bg: #2563eb;
    --xy-button-primary-color: #ffffff;
    
    /* 尺寸系统 */
    --xy-button-sm-padding: 0.5rem 0.75rem;
    --xy-button-md-padding: 0.75rem 1rem;
    --xy-button-lg-padding: 1rem 1.5rem;
    
    /* 视觉效果 */
    --xy-button-border-radius: 0.5rem;
    --xy-button-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --xy-button-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 自定义主题

```css
/* 深色主题 */
[data-theme="dark"] {
    --xy-button-primary-bg: #1e40af;
    --xy-button-secondary-bg: #374151;
    --xy-button-outline-border: #4b5563;
}

/* 品牌主题 */
[data-brand="acme"] {
    --xy-button-primary-bg: #ff6b35;
    --xy-button-primary-hover-bg: #e55a2b;
}
```

## 响应式设计

### 移动端适配

```css
@media (max-width: 640px) {
    .xy-button {
        min-height: 2.25rem;
    }
    
    .xy-button--sm {
        min-height: 1.75rem;
    }
    
    .xy-button--lg {
        min-height: 2.75rem;
    }
}
```

### 高对比度模式

```css
@media (prefers-contrast: high) {
    .xy-button {
        border: 1px solid currentColor;
    }
    
    .xy-button--outline {
        border-width: 2px;
    }
}
```

### 减少动画

```css
@media (prefers-reduced-motion: reduce) {
    .xy-button {
        transition: none;
    }
    
    .xy-button__spinner {
        animation: none;
    }
}
```

## 性能优化

### 1. 轻量级实现

- 使用原生 Web Components
- 零运行时依赖
- 最小化 DOM 操作

### 2. CSS 优化

- 使用 CSS 自定义属性
- 避免不必要的重绘
- 硬件加速的动画

### 3. 事件优化

- 事件委托
- 防抖处理
- 内存泄漏防护

## 浏览器支持

- Chrome 67+
- Firefox 63+
- Safari 11.1+
- Edge 79+

## 总结

Modern XyButton 组件代表了现代 Web 组件设计的最佳实践：

1. **设计系统化** - 统一的视觉语言和交互模式
2. **开发友好** - 清晰的 API 和完整的文档
3. **用户友好** - 无障碍访问和响应式设计
4. **性能优化** - 轻量级实现和最佳实践
5. **可扩展性** - 灵活的主题系统和自定义选项

这个组件为 WSX 框架提供了一个现代化的、可复用的按钮解决方案，可以作为其他组件设计的参考标准。 
