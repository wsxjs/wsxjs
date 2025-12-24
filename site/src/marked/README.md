# Marked Custom Renderer with WSX

## 使用 `marked.lexer()` + 手动 WSX JSX 渲染

**原理**：使用 `marked.lexer()` 获取 tokens，然后手动将 tokens 转换为 WSX JSX 元素。这种方式返回实际的 WSX JSX 元素，完全类型安全，并且不需要 HTML 转义。

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

## 架构图

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

使用 `marked.lexer()` + 手动 WSX JSX 渲染的方式，可以：
- ✅ 返回实际的 WSX JSX 元素
- ✅ 完全类型安全（TypeScript 支持）
- ✅ 使用 JSX 语法，代码更清晰
- ✅ 不需要 HTML 转义
- ✅ 组件化架构，易于维护和扩展
