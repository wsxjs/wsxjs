# RFC 0037: 第三方库元素保留机制

- **RFC编号**: 0037
- **开始日期**: 2024-12-26
- **完成日期**: 2024-12-26
- **状态**: Completed

## 问题描述

当第三方库（如 Monaco Editor、Editor.js）在组件内部插入 DOM 元素时，框架的重新渲染机制可能会删除这些元素，导致第三方库功能失效。

## 解决方案

### 核心原则

**所有由 `h()` 创建的元素都会被标记（`__wsxCacheKey`），未标记的元素应该被保留。**

### 机制说明

#### 1. 元素标记机制

- **标记的元素**：所有通过 `h()` 函数创建的元素都会被标记 `__wsxCacheKey`
- **未标记的元素**：第三方库通过 `document.createElement()` 或直接 DOM 操作创建的元素不会被标记

#### 2. 元素保留判断

`shouldPreserveElement()` 函数判断元素是否应该被保留：

```typescript
export function shouldPreserveElement(element: Node): boolean {
    // 规则 1: 非元素节点保留（文本节点等）
    if (!(element instanceof HTMLElement || element instanceof SVGElement)) {
        return true;
    }

    // 规则 2: 没有标记的元素保留（第三方库注入、自定义元素）
    if (!isCreatedByH(element)) {
        return true;
    }

    // 规则 3: 显式标记保留
    if (element.hasAttribute("data-wsx-preserve")) {
        return true;
    }

    // 规则 4: 由 h() 创建的元素 → 不保留（由框架管理）
    return false;
}
```

#### 3. WebComponent 中的保护

在 `WebComponent._rerender()` 中：

```typescript
// 移除旧内容（保留样式元素和未标记元素）
const oldChildren = Array.from(this.shadowRoot.children).filter((child) => {
    // 保留新添加的内容
    if (child === content) {
        return false;
    }
    // 保留样式元素
    if (child instanceof HTMLStyleElement) {
        return false;
    }
    // 保留未标记的元素（第三方库注入的元素、自定义元素）
    if (shouldPreserveElement(child)) {
        return false;
    }
    return true;
});
```

#### 4. LightComponent 中的保护

在 `LightComponent._rerender()` 中：

```typescript
// 移除旧内容（保留 JSX children、样式元素和未标记元素）
const oldChildren = Array.from(this.children).filter((child) => {
    // 保留新添加的内容
    if (child === content) {
        return false;
    }
    // 保留样式元素
    if (stylesToApply && child instanceof HTMLStyleElement && ...) {
        return false;
    }
    // 保留 JSX children
    if (child instanceof HTMLElement && jsxChildren.includes(child)) {
        return false;
    }
    // 保留未标记的元素（手动创建的元素、第三方库注入的元素）
    if (shouldPreserveElement(child)) {
        return false;
    }
    return true;
});
```

#### 5. updateChildren() 中的保护

在 `updateChildren()` 函数中，当移除多余子节点时：

```typescript
// 移除多余子节点（阶段 5：正确处理元素保留）
const nodesToRemove: Node[] = [];
for (let i = flatNew.length; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (!shouldPreserveElement(child)) {
        // 只有不应该保留的节点才添加到移除列表
        nodesToRemove.push(child);
    }
    // 如果应该保留，跳过（不添加到移除列表）
}
```

### 使用场景

#### 场景 1: 第三方库在容器内插入元素

```typescript
class MyComponent extends LightComponent {
    private editorContainer: HTMLElement | null = null;

    onConnected() {
        // 手动创建容器
        const container = this.querySelector('.panel-content');
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'editor-container';
        container!.appendChild(this.editorContainer);

        // 第三方库在容器内插入元素
        const editor = new MonacoEditor(this.editorContainer);
    }

    render() {
        return (
            <div class="panel-content">
                {/* 编辑器容器在 onConnected() 中手动创建 */}
            </div>
        );
    }
}
```

**工作原理**：
1. `editorContainer` 通过 `document.createElement()` 创建，**不会被标记**
2. 第三方库在 `editorContainer` 内插入的元素也**不会被标记**
3. 重新渲染时，`shouldPreserveElement()` 返回 `true`，这些元素被保留

#### 场景 2: 显式标记保留

```typescript
render() {
    return (
        <div>
            <div data-wsx-preserve>
                {/* 这个元素及其子元素都会被保留 */}
            </div>
        </div>
    );
}
```

### 决策流程

当框架需要决定是否替换/删除一个元素时：

```
1. 元素是否有 __wsxCacheKey 标记？
   ├─ 是 → 由 h() 创建 → 框架管理 → 可以替换/删除
   └─ 否 → 继续检查

2. 元素是否有 data-wsx-preserve 属性？
   ├─ 是 → 显式标记保留 → 保留
   └─ 否 → 继续检查

3. 元素是否是自定义元素？
   ├─ 是 → 保留
   └─ 否 → 继续检查

4. 其他未标记元素 → 保留（第三方库注入）
```

### 关键点

1. **自动识别**：未标记的元素自动被识别为第三方库注入的元素
2. **无需配置**：不需要额外的配置或 API，自动工作
3. **向后兼容**：不影响现有代码，只保护未标记的元素
4. **显式控制**：可以通过 `data-wsx-preserve` 属性显式标记需要保留的元素

### 限制

1. **只能保护直接子元素**：如果第三方库在深层嵌套的元素中插入内容，需要确保父元素也被保护
2. **不能保护被 h() 创建的元素内部**：如果第三方库在由 `h()` 创建的元素内部插入内容，这些内容会被 `updateChildren()` 保护，但父元素本身可能被替换

### 最佳实践

1. **使用容器模式**：为第三方库创建专门的容器元素，在 `onConnected()` 中手动创建
2. **避免在 render() 中创建容器**：如果容器在 `render()` 中创建，它会被标记，可能被替换
3. **使用 data-wsx-preserve**：对于需要明确保护的元素，使用 `data-wsx-preserve` 属性

## 总结

通过元素标记机制和 `shouldPreserveElement()` 函数，框架能够自动识别和保护第三方库注入的元素，无需额外的配置或 API。这确保了第三方库（如 Monaco Editor、Editor.js）能够正常工作，同时保持了框架的 DOM 优化能力。


