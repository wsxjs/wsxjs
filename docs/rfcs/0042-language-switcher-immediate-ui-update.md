# RFC-0042: LanguageSwitcher 立即 UI 更新修复

**状态**: Implemented
**创建日期**: 2024-12-27
**作者**: WSX Team

## 摘要

修复了 LanguageSwitcher 组件中的关键问题：选择新语言后，按钮标签不会立即更新，需要再次点击才能看到更新后的标签。

## 问题描述

### 用户报告的症状（初始问题）

1. 用户点击下拉菜单选择新语言（例如从 English 切换到中文）
2. 下拉菜单关闭，但按钮标签仍然显示 "English"
3. 用户再次点击按钮，这时标签才更新为 "中文"，并且下拉菜单再次打开

### 用户报告的症状（元素复用场景问题）

在元素复用改进后，发现了更复杂的状态同步问题：

1. **初始状态不同步**：
   - 初始语言设置为 Deutsch，但语言切换器显示 English
   - 点击显示下拉菜单后，标签才变为 Deutsch

2. **标签显示延迟或不正确**：
   - 切换到中文时，标签先显示中文，然后切换回 Deutsch，但页面其他部分是中文
   - 切换到法语时，页面是法语，但语言切换器显示中文
   - 切换到日语时，页面是日语，但标签显示法语

3. **下拉菜单状态不正确**：
   - 切换到法语后，下拉菜单关闭，但再次点击时没有下拉菜单显示
   - 切换到日语后，下拉菜单没有关闭，仍然显示法语选项
   - 切换到 Deutsch 后，下拉菜单关闭，但再次点击时没有下拉菜单显示

4. **状态不同步**：
   - `this.currentLanguage` 和 `i18nInstance.language` 不同步
   - 页面翻译已更新，但语言切换器标签未更新
   - 语言切换器标签已更新，但页面翻译未更新

### 根本原因分析

**核心问题：缓存元素的文本节点没有被更新（框架层面）**

当语言切换时的调用链：

1. 用户点击语言选项 → `this.currentLanguage` 改变（响应式状态）
2. 组件重新渲染 → `render()` 返回新的 JSX 树
3. 对于 `<span class="language-switcher-text">{displayName}</span>`：
   - `h("span", { class: "language-switcher-text" }, displayName)` 被调用
   - `cacheManager.get(cacheKey)` 返回缓存的 `<span>` 元素
   - `updateElement(element, props, [displayName], "span", cacheManager)` 被调用
   - `updateChildren(element, oldChildren, [displayName], cacheManager)` 被调用
4. **问题发生在这里**：`updateChildren` 检查是否需要更新文本节点时，使用了**元数据中的旧文本**进行比较：

```typescript
// 错误的逻辑（从元数据获取旧文本）
const oldText = String(oldChild);  // oldChild 来自元数据，可能已过时
const newText = String(newChild);
const needsUpdate = oldText !== newText;  // 如果元数据未更新，这个比较会失败
```

**问题**：
- `oldChild` 来自缓存的元数据 `oldMetadata.children`
- 如果元数据在某个时刻没有被正确更新（例如并发渲染），`oldChild` 可能包含过时的文本值
- 比较 `oldText !== newText` 会认为文本没有变化，跳过更新
- **但 DOM 中的实际文本可能与元数据不一致**

**次要问题 1: render() 曾经依赖非响应式数据源**（已在初步修复中解决）

```typescript
// 旧代码（有问题）
render(): HTMLElement {
    const currentLang = this.languages.find((lang) => lang.code === i18nInstance.language);
    // i18nInstance.language 不是响应式变量
}
```

**次要问题 2: 异步状态更新**（已在初步修复中解决）

```typescript
// 旧代码（有问题）
private selectLanguage = (languageCode: string): void => {
    i18nInstance.changeLanguage(languageCode).then(() => {
        this.currentLanguage = languageCode;  // UI 更新延迟
    });
};
```

**次要问题 3: 元素复用场景下的文本节点查找失败**（新增问题）

当元素被缓存复用时，`findTextNode` 可能因为 `domIndex` 不正确而返回 `null`：

```typescript
// 问题场景
// 1. <span class="language-switcher-text">{displayName}</span> 被缓存复用
// 2. updateChildren 调用 findTextNode(element, domIndex)
// 3. domIndex 可能不正确（因为元素节点处理时已更新）
// 4. findTextNode 返回 null
// 5. updateOrCreateTextNode 被调用，但 oldNode 为 null
// 6. 如果 updateOrCreateTextNode 创建新节点，会导致文本节点累积
// 7. 如果 updateOrCreateTextNode 尝试查找现有节点，可能更新错误的节点
```

**问题**：
- `findTextNode` 依赖 `domIndex` 来查找文本节点
- 当处理元素节点时，`domIndex` 会被更新以跳过该元素
- 但在元素复用场景中，`domIndex` 可能已经不正确
- 导致 `findTextNode` 返回 `null`，无法找到正确的文本节点
- 文本节点无法更新，标签显示过时内容

**次要问题 4: handleLanguageChanged 覆盖用户选择**（新增问题）

当用户主动选择语言时，`i18nInstance.changeLanguage()` 会异步执行，完成后触发 `languageChanged` 事件：

```typescript
// 问题场景
// 1. 用户点击选择中文
// 2. selectLanguage 立即更新 this.currentLanguage = "zh"
// 3. 异步调用 i18nInstance.changeLanguage("zh")
// 4. changeLanguage 完成后触发 languageChanged 事件
// 5. handleLanguageChanged 被调用，再次更新 this.currentLanguage
// 6. 如果异步延迟，handleLanguageChanged 可能使用旧值覆盖用户选择
```

**问题**：
- `handleLanguageChanged` 会在 `changeLanguage` 完成后触发
- 如果异步延迟，可能使用过时的值覆盖用户选择
- 导致状态不同步：用户选择中文，但 `this.currentLanguage` 被设置为其他值

## 解决方案

### 核心修复 1：检查 DOM 实际文本内容而非元数据（框架层面）

**位置**：`packages/core/src/utils/element-update.ts`

```typescript
// 旧代码（有问题）
const oldText = String(oldChild);  // 来自元数据，可能过时
const newText = String(newChild);
const needsUpdate =
    oldText !== newText ||
    (oldNode && oldNode.nodeType === Node.TEXT_NODE && oldNode.textContent !== newText);

// 新代码（修复后）
const newText = String(newChild);

// 关键修复：始终检查 DOM 中的实际文本内容，而不是依赖元数据
const actualTextContent = oldNode?.textContent || "";
const needsUpdate =
    actualTextContent !== newText ||  // DOM 中的实际文本内容与新文本不同
    !oldNode;  // 或者根本没有找到文本节点（需要创建）

if (needsUpdate) {
    updateOrCreateTextNode(element, oldNode, newText);
}
```

**改进**：
- **不再依赖元数据**：直接读取 `oldNode.textContent` 获取 DOM 中的实际文本
- **避免元数据不一致问题**：即使元数据过时，也能正确更新文本节点
- **健壮性提升**：无论元数据是否正确，都能保证 DOM 与新数据一致

**原理**：
1. 元数据（metadata）是框架缓存的"上次渲染时的 props 和 children"
2. 在并发渲染或其他边缘情况下，元数据可能与 DOM 实际状态不一致
3. **真相的来源应该是 DOM 本身**，而不是缓存的元数据
4. 通过检查 `oldNode.textContent`，我们读取的是 DOM 的真实状态

### 核心修复 2：元素复用场景下的文本节点查找（框架层面）

**问题**：当元素被缓存复用时，`findTextNode` 可能因为 `domIndex` 不正确而返回 `null`，导致文本节点无法更新。

**位置**：`packages/core/src/utils/element-update.ts`

```typescript
// 修复前：如果 oldNode 为 null，直接调用 updateOrCreateTextNode
// 这会导致 updateOrCreateTextNode 创建新节点，而不是更新现有节点
const actualTextContent = oldNode?.textContent || "";
const needsUpdate = !oldNode || actualTextContent !== newText;

// 修复后：如果 oldNode 为 null，尝试查找 element 中唯一的文本节点
let actualTextContent = "";
if (oldNode && oldNode.nodeType === Node.TEXT_NODE) {
    actualTextContent = oldNode.textContent || "";
} else if (!oldNode) {
    // oldNode 为 null，尝试查找 element 中唯一的文本节点（缓存复用场景）
    let textNodeCount = 0;
    let firstTextNode: Node | null = null;
    for (let k = 0; k < element.childNodes.length; k++) {
        const node = element.childNodes[k];
        if (node.nodeType === Node.TEXT_NODE) {
            textNodeCount++;
            if (!firstTextNode) {
                firstTextNode = node;
            }
        }
    }
    // 只有在只有一个文本节点时才使用它（符合 RFC-0040 Bug 2 修复）
    if (textNodeCount === 1 && firstTextNode) {
        oldNode = firstTextNode;
        actualTextContent = firstTextNode.textContent || "";
    }
}

const needsUpdate = !oldNode || actualTextContent !== newText;
```

**改进**：
- **处理元素复用场景**：当 `findTextNode` 返回 `null` 时，检查 element 中是否只有一个文本节点
- **符合 RFC-0040 Bug 2**：只有在只有一个文本节点时才更新它，避免更新错误的节点
- **符合 RFC-0042 原则**：DOM 是真相的唯一来源，直接读取 DOM 中的文本节点

**原理**：
1. 在元素复用场景中（如 LanguageSwitcher 的 `<span>` 元素），`findTextNode` 可能因为 `domIndex` 不正确而返回 `null`
2. 如果 element 中只有一个文本节点，这很可能是我们要更新的节点（缓存复用场景）
3. 如果有多个文本节点，我们无法确定应该更新哪个，应该创建新节点（符合 RFC-0040 Bug 2）
4. 通过检查文本节点数量，我们确保只在安全的情况下更新现有节点

### 核心修复 3：简化 updateOrCreateTextNode（框架层面）

**位置**：`packages/core/src/utils/update-children-helpers.ts`

```typescript
// 修复前：当 oldNode 为 null 时，尝试查找并更新第一个文本节点
// 这可能导致更新错误的节点（RFC-0040 Bug 2）
if (!oldNode) {
    // 查找所有文本节点并计数
    for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
            textNodeCount++;
            if (!existingTextNode) {
                existingTextNode = node;
            }
        }
    }
    // 只有在只有一个文本节点时才更新它
    if (existingTextNode && textNodeCount === 1) {
        existingTextNode.textContent = newText;
    }
}

// 修复后：当 oldNode 为 null 时，直接创建新节点
// 查找逻辑已经在上层（element-update.ts）处理
else {
    // 关键修复 (RFC-0040 Bug 2 + RFC-0042)：如果 oldNode 为 null，必须创建新节点
    // RFC-0040 Bug 2 修复：当 oldNode 为 null 时，说明 findTextNode 没有找到对应的文本节点
    // 此时不应该盲目更新第一个找到的文本节点，而应该创建新节点
    const newTextNode = document.createTextNode(newText);
    if (oldNode && !shouldPreserveElement(oldNode)) {
        parent.replaceChild(newTextNode, oldNode);
    } else {
        parent.insertBefore(newTextNode, oldNode || null);
    }
}
```

**改进**：
- **简化逻辑**：将文本节点查找逻辑移到上层（`element-update.ts`），`updateOrCreateTextNode` 只负责更新或创建
- **符合 RFC-0040 Bug 2**：当 `oldNode` 为 null 时，直接创建新节点，不尝试查找现有节点
- **职责分离**：`element-update.ts` 负责查找，`updateOrCreateTextNode` 负责更新或创建

### 辅助修复 1: 使用响应式状态而非外部数据源（组件层面）

**位置**：`site/src/components/LanguageSwitcher.wsx`

```typescript
// 新代码（修复后）
render(): HTMLElement {
    // 使用响应式状态 this.currentLanguage
    const currentLang = this.languages.find((lang) => lang.code === this.currentLanguage);
    const displayName = currentLang?.name || this.currentLanguage.toUpperCase();
}
```

**改进**：
- `this.currentLanguage` 是响应式状态，改变时触发重新渲染
- 不依赖外部非响应式的 `i18nInstance.language`

### 辅助修复 2: 立即更新状态，异步更新 i18next（组件层面）

**位置**：`site/src/components/LanguageSwitcher.wsx`

```typescript
// 新代码（修复后）
private selectLanguage = (languageCode: string): void => {
    // 立即更新状态（同步）
    this.currentLanguage = languageCode;
    this.isOpen = false;
    localStorage.setItem("wsx-language", languageCode);

    // i18next 异步更新（后台）
    i18nInstance.changeLanguage(languageCode).catch(console.error);
};
```

**改进**：
- UI 立即响应（同步更新状态）
- i18next 后台更新（异步）

## 技术细节

### 响应式状态流程

1. 用户点击语言选项
2. `selectLanguage()` 立即更新 `this.currentLanguage`（响应式状态）
3. 框架检测到状态变化，触发 `rerender()`
4. `render()` 使用新的 `this.currentLanguage` 计算 `displayName`
5. DOM 更新，按钮标签显示新语言
6. i18next 异步加载新语言资源，页面其他翻译逐步更新

### 与 i18next 的同步

组件通过以下机制与 i18next 保持同步：

1. **初始化时** (`onConnected`)：
   - 从 localStorage 或 i18next 读取当前语言
   - 设置 `this.currentLanguage` 初始值

2. **监听 i18next 事件** (`handleLanguageChanged`)：
   - 监听 `languageChanged` 事件
   - 如果外部代码改变了 i18next 语言，同步更新 `this.currentLanguage`

3. **用户操作时** (`selectLanguage`)：
   - 立即更新 `this.currentLanguage`（UI 响应）
   - 异步调用 `i18nInstance.changeLanguage()`（后台更新）

## 测试验证

创建了测试用例 `site/src/components/__tests__/LanguageSwitcher.test.ts`：

```typescript
test("选择新语言后，按钮标签应该立即更新", async () => {
    // 点击中文选项
    (zhOption as HTMLButtonElement).click();

    // 关键验证：语言文本应该立即更新，不需要等待异步 i18next.changeLanguage
    await new Promise((resolve) => setTimeout(resolve, 10));
    const updatedText = textSpan!.textContent;
    expect(updatedText).toBe("中文");
});
```

## 性能影响

**正面影响**：
- UI 响应速度提升（从异步延迟到立即更新）
- 用户体验改善（无感知延迟）

**无负面影响**：
- i18next 异步加载不受影响
- 内存使用无变化
- 重新渲染开销可忽略（单个组件）

## 向后兼容性

✅ 完全向后兼容：
- 不改变公开 API
- 不改变组件使用方式
- 只修复内部实现逻辑
- i18next 集成方式不变

## 相关问题

### 与 RFC-0041 的关系

RFC-0041 和 RFC-0042 都涉及缓存复用时的文本节点更新问题，但解决的是不同层面的问题：

- **RFC-0041 问题 4**：框架层面的修复 - 移除跳过逻辑，确保即使元素引用相同也继续处理子元素更新
- **RFC-0042**：框架层面的修复 - 检查 DOM 实际文本内容而非元数据，确保使用正确的数据源进行比较

两者是**互补的修复**：
- RFC-0041 确保框架**会继续处理**（不跳过更新）
- RFC-0042 确保处理时**使用正确的数据源**（DOM 而非可能过时的元数据）

两个修复共同确保了缓存复用场景下文本节点的正确更新。

### 与 RFC-0040 的关系

RFC-0040 修复了文本节点更新逻辑的两个 Bug：
- **Bug 1**：Fallback 搜索未尊重 `domIndex.value`
- **Bug 2**：文本内容未变化时仍可能更新错误节点

RFC-0042 的修复建立在 RFC-0040 的基础上，进一步解决了：
1. **元数据过时问题**：使用 DOM 实际内容而非元数据进行比较
2. **元素复用场景**：当 `findTextNode` 返回 `null` 时，智能处理单个文本节点的情况

当前实现中：
- `element-update.ts` 负责查找文本节点（包括元素复用场景的处理）
- `updateOrCreateTextNode` 函数符合 RFC-0040 Bug 2 的修复意图（当 `oldNode` 为 null 时创建新节点）
- 两者共同确保缓存复用场景下文本节点的正确更新

## 最佳实践建议

基于这次修复，我们总结以下最佳实践：

1. **优先使用组件内部响应式状态**
   ```typescript
   // ❌ 不好：依赖外部非响应式数据
   render() {
       const value = externalLibrary.getValue();
   }

   // ✅ 好：使用内部响应式状态
   @state private value: string;
   render() {
       const value = this.value;
   }
   ```

2. **立即更新 UI 状态，异步执行副作用**
   ```typescript
   // ❌ 不好：等待异步完成才更新状态
   async handleClick() {
       await api.call();
       this.state = newValue; // UI 延迟更新
   }

   // ✅ 好：立即更新状态，异步处理副作用
   handleClick() {
       this.state = newValue; // UI 立即更新
       api.call().catch(handleError); // 后台处理
   }
   ```

3. **使用事件监听同步外部状态**
   ```typescript
   onConnected() {
       externalLibrary.on('change', (newValue) => {
           this.state = newValue; // 同步到内部状态
       });
   }
   ```

## 结论

这次修复确保了 LanguageSwitcher 组件的 UI 响应速度，用户选择新语言后能够立即看到按钮标签的更新，而不需要额外的操作。

修复的核心原则：**组件应该依赖内部响应式状态，而不是外部非响应式数据源**。

## 相关 RFC

- [RFC-0041](./0041-cache-reuse-element-order-and-ref-callback-fixes.md): 缓存复用元素顺序和 Ref 回调修复
- [RFC-0029](./0029-i18next-integration.md): i18next 国际化支持
