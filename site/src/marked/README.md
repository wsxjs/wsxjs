# Marked Custom Renderer with WSX

## 两种模式对比

有两种方法可以将自定义 renderer 注册到 marked：

---

## Pattern 1: 使用 `marked.use({ renderer })` ✅

**原理**：Renderer 返回包含 WSX 自定义元素标签的 HTML 字符串。由于 WSX 组件已注册为自定义元素，浏览器会自动实例化它们。

### 实现方式

```typescript
import { marked } from "marked";
import type { RendererObject, Tokens } from "marked";

// 创建自定义 renderer - 返回 HTML 字符串（包含 WSX 自定义元素标签）
const customRenderer: Partial<RendererObject> = {
    heading(token: Tokens.Heading) {
        // 返回 HTML 字符串，包含 WSX 自定义元素标签
        return `<wsx-marked-heading level="${token.depth}" text="${escapeHtml(token.text)}"></wsx-marked-heading>`;
    },
    code(token: Tokens.Code) {
        return `<wsx-marked-code code="${escapeHtml(token.text)}" language="${token.lang || ""}"></wsx-marked-code>`;
    }
};

// 注册 renderer
marked.use({ renderer: customRenderer as RendererObject });

// 使用
const html = marked.parse(markdown); // 返回 HTML 字符串
element.innerHTML = html; // 浏览器自动实例化 WSX 自定义元素
```

### 为什么这样可以工作？

1. **WSX 组件已注册为自定义元素**：通过 `@autoRegister({ tagName: "wsx-marked-heading" })` 注册
2. **浏览器自动识别**：当 HTML 字符串中包含 `<wsx-marked-heading>` 时，浏览器会自动查找并实例化对应的自定义元素
3. **属性传递**：通过 HTML 属性传递数据，组件通过 `observedAttributes` 和 `attributeChangedCallback` 接收

### 优点
- ✅ 使用 marked 的内置系统
- ✅ 简单直接
- ✅ 与 marked 生态系统兼容

### 缺点
- ❌ 返回 HTML 字符串，不是 JSX 元素
- ❌ 需要手动转义 HTML
- ❌ 类型安全性较低

---

## Pattern 2: 使用 `marked.lexer()` + 手动 WSX JSX 渲染 ✅

**原理**：使用 `marked.lexer()` 获取 tokens，然后手动将 tokens 转换为 WSX JSX 元素。

### 实现方式

```typescript
import { marked } from "marked";
import type { Tokens } from "marked";

render() {
    // 1. 使用 lexer 获取 tokens（不渲染）
    const tokens = marked.lexer(this.markdown);
    
    // 2. 手动将 tokens 转换为 WSX JSX 元素
    return (
        <div class="marked-content">
            {this.renderTokens(tokens)}
        </div>
    );
}

private renderToken(token: Tokens.Generic): HTMLElement | null {
    switch (token.type) {
        case "heading": {
            const headingToken = token as Tokens.Heading;
            // 直接返回 WSX JSX 元素！
            return (
                <wsx-marked-heading
                    level={headingToken.depth.toString()}
                    text={this.renderInlineTokens(headingToken.tokens)}
                />
            );
        }
        case "code": {
            const codeToken = token as Tokens.Code;
            return (
                <wsx-marked-code 
                    code={codeToken.text} 
                    language={codeToken.lang || ""} 
                />
            );
        }
        // ... 其他类型
    }
}
```

### 优点
- ✅ 返回实际的 WSX JSX 元素
- ✅ 完全使用 WSX JSX 语法
- ✅ 类型安全（TypeScript 支持）
- ✅ 组件化架构
- ✅ 不需要 HTML 转义

### 缺点
- ❌ 需要手动处理所有 token 类型
- ❌ 不使用 marked 的内置 renderer 系统

---

## 两种模式对比

| 特性 | Pattern 1 (`marked.use`) | Pattern 2 (`lexer` + JSX) |
|------|-------------------------|---------------------------|
| **返回类型** | HTML 字符串 | WSX JSX 元素 |
| **语法** | 字符串拼接 | JSX 语法 |
| **类型安全** | 较低 | 完全类型安全 |
| **复杂度** | 简单 | 中等 |
| **marked 集成** | 使用内置系统 | 手动处理 |
| **HTML 转义** | 需要 | 不需要 |
| **推荐场景** | 简单项目 | 复杂项目，需要类型安全 |

---

## 架构图

### Pattern 1 流程

```
Markdown Text
    ↓
marked.parse() (使用自定义 renderer)
    ↓
HTML 字符串 (包含 WSX 自定义元素标签)
    ↓
element.innerHTML = html
    ↓
浏览器自动实例化 WSX 自定义元素
    ↓
WSX Components 渲染
```

### Pattern 2 流程

```
Markdown Text
    ↓
marked.lexer() → Tokens[]
    ↓
renderTokens() → 遍历所有 tokens
    ↓
renderToken() → 根据 token.type 返回对应的 WSX JSX 元素
    ↓
WSX JSX Elements (直接返回)
    ↓
render() → 返回完整的 JSX 树
```

---

## Token 类型映射

两种模式都使用相同的 WSX 组件：

| Markdown Token | WSX Component |
|---------------|---------------|
| `heading` | `<wsx-marked-heading>` |
| `code` | `<wsx-marked-code>` |
| `blockquote` | `<wsx-marked-blockquote>` |
| `paragraph` | `<wsx-marked-paragraph>` |
| `list` | `<wsx-marked-list>` |
| `html` | `<div innerHTML={...}>` |
| `hr` | `<hr />` |

---

## 代码示例

### Pattern 1 完整示例

```typescript
// WsxMarkedRendererPattern1.wsx
private setupCustomRenderer() {
    const customRenderer: Partial<RendererObject> = {
        heading(token: Tokens.Heading) {
            const text = renderInlineTokens(token.tokens);
            return `<wsx-marked-heading level="${token.depth}" text="${escapeHtml(text)}"></wsx-marked-heading>`;
        },
        // ... 其他方法
    };
    
    marked.use({ renderer: customRenderer as RendererObject });
}

private renderMarkdown() {
    const html = marked.parse(this.markdown);
    this.rendererContainer.innerHTML = html; // 浏览器自动实例化 WSX 组件
}
```

### Pattern 2 完整示例

```typescript
// WsxMarkedRenderer.wsx
render() {
    const tokens = marked.lexer(this.markdown);
    return (
        <div class="marked-content">
            {this.renderTokens(tokens)}  // 直接返回 JSX 元素
        </div>
    );
}

private renderToken(token: Tokens.Generic): HTMLElement | null {
    switch (token.type) {
        case "heading": {
            return <wsx-marked-heading level={...} text={...} />;
        }
        // ... 其他类型
    }
}
```

---

## 总结

- **Pattern 1**：适合简单场景，使用 marked 内置系统，返回 HTML 字符串（包含 WSX 自定义元素标签）
- **Pattern 2**：适合复杂场景，需要类型安全和 JSX 语法，直接返回 WSX JSX 元素

两种模式都使用相同的 WSX 组件，只是渲染方式不同！
