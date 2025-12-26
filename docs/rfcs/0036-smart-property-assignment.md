# RFC 0036: Smart Property Assignment Strategy for Large Data

- **RFC编号**: 0036
- **开始日期**: 2024-12-25
- **完成日期**: 2024-12-26
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Completed

## 摘要

改进 WSX JSX 工厂中的属性设置策略，对于大数据属性优先使用 JavaScript 属性赋值而非 `setAttribute`，以解决大对象/数组通过 HTML 属性传递时的性能和限制问题。

## 动机

### 当前问题

在 WSX JSX 工厂中，所有非特殊属性都通过 `setAttribute()` 设置：

```typescript
// packages/core/src/jsx-factory.ts (当前实现)
else {
    const attributeName = isSVG ? getSVGAttributeName(key) : key;
    element.setAttribute(attributeName, String(value)); // 所有值都转为字符串
}
```

这导致以下问题：

1. **大数据序列化开销**：大对象/数组需要 `JSON.stringify()` 序列化，性能差
2. **HTML 属性长度限制**：浏览器对属性值长度有限制（通常约 2MB），超过会失败
3. **类型丢失**：所有值都被转为字符串，需要手动 `JSON.parse()` 反序列化
4. **内存浪费**：字符串序列化占用更多内存
5. **无法传递复杂对象**：函数、Symbol、循环引用等无法序列化

### 实际场景

```tsx
// 场景1: 传递大型数据对象
<my-chart 
    data={largeDataset} // 可能包含数千条记录
    config={complexConfig} // 复杂的配置对象
/>

// 场景2: 传递函数引用
<my-editor 
    onSave={handleSave} // 函数无法通过 setAttribute 传递
    validators={[validator1, validator2]} // 函数数组
/>

// 场景3: 传递 DOM 元素引用
<my-modal 
    target={document.getElementById('trigger')} // DOM 元素无法序列化
/>
```

### 为什么重要

- **性能**：避免不必要的序列化/反序列化开销
- **功能完整性**：支持传递任意 JavaScript 值，包括函数、对象、数组
- **开发者体验**：无需手动处理序列化，代码更简洁
- **Web 标准**：充分利用 JavaScript 属性，而非仅依赖 HTML 属性

## 详细设计

### 核心概念

**智能属性分配策略（HTML First）**：
1. **优先检查 HTML 标准属性**：如果是标准 HTML/SVG 属性（如 `id`, `class`, `data-*`, `aria-*` 等），使用 `setAttribute()`
2. **避免标准属性冲突**：不允许与 HTML 标准属性同名（如 `dataSomething` 不会工作，应使用 `data-something`）
3. **非标准属性检查**：如果不是标准属性，检查元素是否已有该 JavaScript 属性
4. **回退策略**：如果存在 JavaScript 属性，使用属性赋值；否则回退到 `setAttribute()`

**重要区别：`data` vs `data-*`**：
- **`data`**（不带连字符）：**不是标准 HTML 属性**，是有效的 JavaScript 属性名，**可以检查对象属性**，可以使用 JavaScript 属性赋值
- **`data-*`**（带连字符）：**是标准 HTML 属性**，**不是 JavaScript 属性**，**只使用 `setAttribute()`**，**不检查对象属性**

### API设计

```typescript
// packages/core/src/jsx-factory.ts

/**
 * 检查是否是 HTML 标准属性
 */
function isStandardHTMLAttribute(key: string): boolean {
    // HTML 标准属性列表（常见）
    const standardAttributes = new Set([
        'id', 'class', 'className', 'style', 'title', 'lang', 'dir',
        'hidden', 'tabindex', 'accesskey', 'contenteditable', 'draggable',
        'spellcheck', 'translate', 'autocapitalize', 'autocorrect',
        // 表单属性
        'name', 'value', 'type', 'placeholder', 'required', 'disabled',
        'readonly', 'checked', 'selected', 'multiple', 'min', 'max', 'step',
        'pattern', 'autocomplete', 'autofocus', 'form', 'formaction',
        'formenctype', 'formmethod', 'formnovalidate', 'formtarget',
        // 链接属性
        'href', 'target', 'rel', 'download', 'hreflang', 'ping',
        // 媒体属性
        'src', 'alt', 'width', 'height', 'poster', 'preload', 'controls',
        'autoplay', 'loop', 'muted', 'playsinline', 'crossorigin',
        // 其他常见属性
        'role', 'aria-label', 'aria-labelledby', 'aria-describedby',
        // data-* 和 aria-* 前缀
    ]);

    // 检查是否是标准属性
    if (standardAttributes.has(key.toLowerCase())) {
        return true;
    }

    // 检查是否是 data-* 属性（必须使用连字符）
    // ⚠️ 重要区别：
    // - "data"（不带连字符）：不是标准 HTML 属性，是有效的 JavaScript 属性名，可以检查对象属性
    // - "data-*"（带连字符）：是标准 HTML 属性，不是 JavaScript 属性，只使用 setAttribute，不检查对象属性
    if (key.toLowerCase().startsWith('data-')) {
        return true; // 标准属性，只使用 setAttribute，不检查对象属性
    }

    // 检查是否是 aria-* 属性
    if (key.toLowerCase().startsWith('aria-')) {
        return true;
    }

    // 检查是否是 SVG 属性
    if (key.startsWith('xml:') || key.startsWith('xlink:')) {
        return true;
    }

    return false;
}

/**
 * 智能属性设置函数
 * HTML First 策略：优先使用 HTML 属性，避免与标准属性冲突
 */
function setSmartProperty(
    element: HTMLElement | SVGElement,
    key: string,
    value: unknown,
    isSVG: boolean = false
): void {
    // 1. 检查是否是特殊属性（已有处理逻辑的属性）
    if (isSpecialProperty(key, value)) {
        return; // 由现有逻辑处理
    }

    // 2. HTML First: 优先检查是否是 HTML 标准属性
    if (isStandardHTMLAttribute(key)) {
        // 使用 setAttribute（HTML 标准属性必须使用 attribute，不使用 JavaScript 属性）
        const attributeName = isSVG ? getSVGAttributeName(key) : key;
        
        // 对于复杂类型，尝试序列化
        if (typeof value === 'object' && value !== null) {
            try {
                const serialized = JSON.stringify(value);
                // 检查长度限制（保守估计 1MB）
                if (serialized.length > 1024 * 1024) {
                    console.warn(
                        `[WSX] Attribute "${key}" value too large, ` +
                        `consider using a non-standard property name instead`
                    );
                }
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                // 无法序列化（如循环引用），警告并跳过
                console.warn(
                    `[WSX] Cannot serialize attribute "${key}":`,
                    error
                );
            }
        } else {
            element.setAttribute(attributeName, String(value));
        }
        // 重要：标准属性只使用 setAttribute，不使用 JavaScript 属性
        return;
    }

    // 3. 非标准属性：检查元素是否已有该 JavaScript 属性
    const hasProperty = key in element || 
                       Object.prototype.hasOwnProperty.call(element, key);

    if (hasProperty) {
        // 使用 JavaScript 属性赋值（支持任意类型）
        try {
            (element as any)[key] = value;
        } catch (error) {
            // 如果赋值失败（如只读属性），回退到 setAttribute
            console.warn(
                `[WSX] Failed to set property "${key}", falling back to setAttribute:`,
                error
            );
            const attributeName = isSVG ? getSVGAttributeName(key) : key;
            element.setAttribute(attributeName, String(value));
        }
    } else {
        // 回退到 HTML 属性（仅字符串）
        const attributeName = isSVG ? getSVGAttributeName(key) : key;
        
        // 对于复杂类型，尝试序列化
        if (typeof value === 'object' && value !== null) {
            try {
                const serialized = JSON.stringify(value);
                // 检查长度限制
                if (serialized.length > 1024 * 1024) {
                    console.warn(
                        `[WSX] Property "${key}" value too large for attribute, ` +
                        `consider using a JavaScript property instead`
                    );
                }
                element.setAttribute(attributeName, serialized);
            } catch (error) {
                // 无法序列化，警告并跳过
                console.warn(
                    `[WSX] Cannot serialize property "${key}" for attribute:`,
                    error
                );
            }
        } else {
            element.setAttribute(attributeName, String(value));
        }
    }
}
```

### 实现细节

#### 1. HTML 标准属性检查

```typescript
/**
 * 检查是否是 HTML 标准属性
 * HTML First 策略的核心：优先识别标准属性
 */
function isStandardHTMLAttribute(key: string): boolean {
    // 标准 HTML 属性集合（常见属性）
    const standardAttributes = new Set([
        // 全局属性
        'id', 'class', 'className', 'style', 'title', 'lang', 'dir',
        'hidden', 'tabindex', 'accesskey', 'contenteditable', 'draggable',
        'spellcheck', 'translate', 'autocapitalize', 'autocorrect',
        // 表单属性
        'name', 'value', 'type', 'placeholder', 'required', 'disabled',
        'readonly', 'checked', 'selected', 'multiple', 'min', 'max', 'step',
        'pattern', 'autocomplete', 'autofocus', 'form', 'formaction',
        'formenctype', 'formmethod', 'formnovalidate', 'formtarget',
        // 链接属性
        'href', 'target', 'rel', 'download', 'hreflang', 'ping',
        // 媒体属性
        'src', 'alt', 'width', 'height', 'poster', 'preload', 'controls',
        'autoplay', 'loop', 'muted', 'playsinline', 'crossorigin',
        // ARIA 属性（部分常见）
        'role',
    ]);

    const lowerKey = key.toLowerCase();

    // 检查是否是标准属性
    if (standardAttributes.has(lowerKey)) {
        return true;
    }

    // 检查是否是 data-* 属性（必须使用连字符，是标准属性）
    // 注意：data-* 属性只使用 setAttribute，不检查 JavaScript 属性
    // 重要：data（不带连字符）不是标准属性，可以检查 JavaScript 属性
    if (lowerKey.startsWith('data-')) {
        return true; // 标准属性，只使用 setAttribute，不检查对象属性
    }
    
    // 注意：单独的 "data" 不是标准属性，应该检查 JavaScript 属性
    // data-*（带连字符）才是标准属性，不检查对象属性

    // 检查是否是 aria-* 属性
    if (lowerKey.startsWith('aria-')) {
        return true;
    }

    // 检查是否是 SVG 命名空间属性
    if (key.startsWith('xml:') || key.startsWith('xlink:')) {
        return true;
    }

    return false;
}

/**
 * 检查元素是否有该 JavaScript 属性
 * 仅用于非标准属性
 */
function hasJavaScriptProperty(element: HTMLElement | SVGElement, key: string): boolean {
    // 方法1: 检查 in 操作符（包括原型链）
    if (key in element) {
        return true;
    }

    // 方法2: 检查自有属性
    if (Object.prototype.hasOwnProperty.call(element, key)) {
        return true;
    }

    return false;
}
```

#### 2. 特殊属性处理

保持现有特殊属性的处理逻辑：
- `ref` - 回调函数
- `className` / `class` - CSS 类
- `style` - 样式字符串
- `on*` - 事件监听器
- `value` - 表单元素值
- 布尔属性

#### 3. 属性命名规范

**重要规则**：
- **标准属性**：始终使用 `setAttribute`，**不使用 JavaScript 属性**（如 `id`, `class`, `data-*`, `aria-*`）
- **`data-*` 属性**：必须使用连字符（`data-something`），是标准 HTML 属性，**不是 JavaScript 属性**，**只使用 setAttribute，不检查对象属性**
- **`data` 属性**：不带连字符的 `data` **不是标准 HTML 属性**，是**有效的 JavaScript 属性名**，**可以检查对象属性**，可以使用 JavaScript 属性赋值
- **非标准属性**：可以使用 JavaScript 属性（如 `chartData`, `componentConfig`, `data`）
- **避免 data* 前缀**：不要使用 `dataSomething` 这样的命名，会与 `data-something` 的 dataset 属性冲突

**命名建议**：
```typescript
// ✅ 好的命名（非标准属性，可以使用 JavaScript 属性）
chartData={largeDataset}        // 使用前缀避免冲突
componentConfig={config}        // 使用前缀避免冲突
onCustomEvent={handler}         // on* 前缀通常安全
myComponentData={data}          // 明确的前缀，避免冲突

// ⚠️ 注意：data 不是标准属性，可以检查 JavaScript 属性
data={largeDataset}             // ✅ 非标准属性：可以检查 JavaScript 属性，可以使用属性赋值

// ❌ 避免的命名（标准属性，会被序列化）
id={customId}                   // ❌ id 是标准属性
class={customClass}             // ❌ class 是标准属性

// ⚠️ 冲突警告：dataSomething 会与 data-something 冲突
// HTML: <div data-something="value" />
// JavaScript: element.dataset.something === "value"
// 如果同时设置 dataSomething 属性，可能会被忽略或冲突
dataSomething={data}            // ❌ 避免：可能与 dataset.something 冲突

// ⚠️ 重要区别：
// data（不带连字符）- 不是标准 HTML 属性，是有效的 JavaScript 属性名，可以检查对象属性
data={largeDataset}             // ✅ 非标准属性：可以检查 JavaScript 属性，可以使用属性赋值

// data-*（带连字符）- 是标准 HTML 属性，不是 JavaScript 属性，只使用 setAttribute
data-something={data}           // ✅ 标准属性：只使用 setAttribute（会被序列化）
                                // ❌ 不是 JavaScript 属性，不会检查对象属性

// ✅ 推荐：使用明确的前缀
componentData={data}            // ✅ 清晰，无冲突
chartData={data}                // ✅ 清晰，无冲突
```

### 示例用法

#### 示例 1: 传递大型数据对象

```tsx
// ✅ 正确：data 不是标准属性，可以检查 JavaScript 属性
<my-chart data={largeDataset} /> // 会检查是否有 data 属性，如果有则使用属性赋值

// ✅ 也可以：使用其他非标准属性名（如 chartData）
<my-chart chartData={largeDataset} />

// ❌ 错误：data-* 是标准属性，只使用 setAttribute，不检查对象属性
<my-chart data-chart={largeDataset} /> // 会被序列化为字符串

// 组件中访问
class MyChart extends WebComponent {
    connectedCallback() {
        super.connectedCallback();
        // 直接使用 JavaScript 属性，无需 JSON.parse
        const data = (this as any).chartData;
        this.renderChart(data);
    }
}

// ✅ 或者：如果需要 HTML 属性语义，使用 data-*（但会被序列化）
<my-chart data-chart-config={JSON.stringify(config)} />
```

#### 示例 2: 传递函数引用

```tsx
// ✅ 正确：onSave 不是标准属性，可以使用 JavaScript 属性
<my-editor onSave={handleSave} />

// 组件中访问
class MyEditor extends WebComponent {
    connectedCallback() {
        super.connectedCallback();
        const onSave = (this as any).onSave;
        if (typeof onSave === 'function') {
            this.saveButton.addEventListener('click', onSave);
        }
    }
}

// ❌ 注意：如果属性名是标准属性，函数会被转为字符串
// <my-editor onclick={handleClick} /> // ❌ onclick 是标准属性
// 应该使用事件监听器：onClick (React 风格)
```

#### 示例 3: 混合使用

```tsx
// HTML 标准属性（使用 setAttribute）
<div id="container" class="wrapper" data-id="123">
    {/* 自定义组件 */}
    <my-component 
        // HTML 标准属性（使用 setAttribute）
        id="my-chart"
        aria-label="Chart"
        data-testid="chart"
        
        // 非标准属性（使用 JavaScript 属性，支持复杂类型）
        chartConfig={complexConfig}      // ✅ 非标准属性名
        chartData={largeDataset}         // ✅ 非标准属性名
        onSave={handleSave}              // ✅ 非标准属性名（函数）
        
        // ❌ 错误示例：与标准属性冲突
        // data-chart={largeDataset}    // ❌ data-* 是标准属性，会被序列化
        // class={customClass}          // ❌ class 是标准属性，应使用 className
    />
</div>
```

#### 示例 4: 属性命名规范

```tsx
// ✅ 好的命名：避免与标准属性冲突
<my-component 
    componentData={data}           // 使用前缀避免冲突
    componentConfig={config}       // 使用前缀避免冲突
    onCustomEvent={handler}        // on* 前缀通常安全（除了标准事件）
/>

// ❌ 避免的命名：与标准属性冲突
<my-component 
    data={data}                      // ✅ data 不是标准属性，可以检查对象属性
    id={customId}                   // ❌ id 是标准属性
    class={customClass}             // ❌ class 是标准属性
    style={customStyle}             // ❌ style 是标准属性
/>
```

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：增强 JSX 的表达能力，支持传递任意 JavaScript 值
- [x] **信任浏览器**：充分利用浏览器原生 JavaScript 属性机制
- [x] **零运行时**：编译时决定使用属性还是 attribute，运行时开销最小
- [x] **Web标准**：基于 Web Components 标准，使用标准 JavaScript 属性

### 理念契合说明

这个改进完全符合 WSX 的核心理念：
- **利用浏览器能力**：JavaScript 属性是浏览器原生机制，无需额外抽象
- **开发者体验优先**：让开发者能够自然地传递任何 JavaScript 值
- **性能优化**：避免不必要的序列化开销
- **标准兼容**：保持 HTML 属性的语义，同时支持 JavaScript 属性

## 权衡取舍

### 优势

1. **性能提升**：避免大数据的序列化/反序列化开销（非标准属性）
2. **功能完整**：支持传递任意 JavaScript 值（函数、对象、数组等）
3. **向后兼容**：HTML 标准属性仍然使用 `setAttribute`，现有代码不受影响
4. **标准兼容**：HTML First 策略确保标准属性行为符合 Web 标准
5. **类型安全**：TypeScript 类型检查更准确
6. **内存效率**：直接引用而非字符串拷贝（非标准属性）
7. **避免冲突**：明确区分标准属性和自定义属性，避免命名冲突

### 劣势

1. **复杂性增加**：需要判断标准属性和非标准属性
2. **调试难度**：JavaScript 属性不会显示在 HTML 中，调试时不可见
3. **命名限制**：不能使用标准属性名传递大数据（如 `data`）
4. **学习曲线**：开发者需要了解哪些是标准属性，哪些可以使用自定义属性
5. **类型检查**：需要 TypeScript 类型定义支持
6. **序列化问题**：如果误用标准属性，大对象可能序列化失败

### 替代方案

#### 方案 1: 完全使用 JavaScript 属性

**优点**：
- 实现简单
- 性能最好
- 支持所有类型

**缺点**：
- 失去 HTML 属性的语义（如 `id`, `class`, `data-*`）
- 无法被 CSS 选择器使用
- 不符合 Web Components 标准实践

#### 方案 2: 显式标记（如 `prop:` 前缀）

```tsx
<my-component 
    prop:data={largeDataset}      // 明确使用属性
    data-id="123"                  // 明确使用 attribute
/>
```

**优点**：
- 明确区分属性和 attribute
- 开发者意图清晰

**缺点**：
- 语法不够自然
- 需要学习新语法
- 不符合 JSX 习惯

#### 方案 3: HTML First + 类型推断（当前方案）

**优点**：
- HTML First 策略确保标准属性行为正确
- 自动判断非标准属性，开发者无需关心
- 语法自然
- 向后兼容
- 避免与标准属性冲突

**缺点**：
- 需要实现判断逻辑
- 可能有边缘情况
- 开发者需要了解命名规范（避免使用标准属性名）

## 未解决问题

1. **属性名冲突**：如果 HTML 属性名和 JavaScript 属性名冲突怎么办？
   - **解决方案**：HTML First 策略 - 标准属性始终使用 `setAttribute`
   - 例如：`id`, `class`, `data-*` 等标准属性始终使用 attribute
   - 非标准属性才考虑使用 JavaScript 属性
   - **命名规范**：建议使用前缀避免冲突（如 `componentData` 而非 `data`）

2. **`data` vs `data-*` 属性规则**：
   - **`data`**（不带连字符）：
     - **不是标准 HTML 属性**
     - **是有效的 JavaScript 属性名**
     - **可以检查对象属性**（`key in element` 或 `hasOwnProperty`）
     - **可以使用 JavaScript 属性赋值**（支持复杂类型）
   - **`data-*`**（带连字符）：
     - **是标准 HTML 属性**
     - **不是 JavaScript 属性**
     - **只使用 setAttribute，不检查对象属性**
     - 会被序列化为字符串
   - `dataSomething`（驼峰命名）不是标准属性，但会与 `dataset.something` 冲突
   - **重要**：`dataSomething` 作为 JavaScript 属性可能会被 `data-something` 的 dataset 属性覆盖或忽略
   - **建议**：完全避免使用 `data*` 开头的属性名，使用其他前缀（如 `chartData`, `componentData`）
   - **大数据场景**：不要使用 `data-*` 传递大数据，使用非标准属性名（如 `chartData` 或 `data`）

2. **只读属性**：某些属性是只读的（如 `element.tagName`）
   - 当前方案：捕获错误并回退到 `setAttribute`

3. **类型定义**：如何为动态属性提供 TypeScript 类型支持？
   - 建议：使用 `observedAttributes` 和类型声明

4. **性能影响**：属性检查是否有性能开销？
   - 需要基准测试验证

5. **安全性**：直接设置属性是否有安全风险？
   - 需要评估 XSS 风险

## 实现计划

### 阶段规划

1. **阶段1: 核心实现**
   - 实现 `hasProperty()` 检查函数
   - 实现 `setSmartProperty()` 函数
   - 更新 `jsx-factory.ts` 使用新策略
   - 添加单元测试

2. **阶段2: 优化和测试**
   - 性能基准测试
   - 边缘情况测试
   - 错误处理完善
   - 添加警告信息

3. **阶段3: 文档和示例**
   - 更新 API 文档
   - 添加使用示例
   - 编写最佳实践指南
   - 更新迁移指南

### 时间线

- **Week 1**: 设计和讨论
- **Week 2**: 核心实现和单元测试
- **Week 3**: 性能测试和优化
- **Week 4**: 文档和示例

### 依赖项

- 无外部依赖
- 需要 TypeScript 类型支持（可选）

## 测试策略

**测试覆盖率要求：100%**

所有实现代码必须达到 100% 测试覆盖率，包括：
- 所有函数和分支
- 所有边界情况
- 所有错误处理路径
- 所有警告和日志输出

### 单元测试

```typescript
describe('setSmartProperty', () => {
    it('should use setAttribute for standard HTML attributes', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'id', 'test');
        expect(div.getAttribute('id')).toBe('test');
        expect(div.id).toBe('test'); // 也会设置属性
    });

    it('should use setAttribute for data-* attributes', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'data-custom', 'value');
        expect(div.getAttribute('data-custom')).toBe('value');
    });

    it('should use property for non-standard attributes with large objects', () => {
        const element = document.createElement('my-component');
        const largeData = { /* 大量数据 */ };
        setSmartProperty(element, 'chartData', largeData); // 非标准属性名
        expect((element as any).chartData).toBe(largeData);
        expect(element.getAttribute('chartData')).toBeNull();
    });

    it('should check JavaScript property for "data" (non-standard)', () => {
        const element = document.createElement('my-component');
        const largeData = { /* 大量数据 */ };
        
        // data 不是标准属性，应该检查 JavaScript 属性
        setSmartProperty(element, 'data', largeData);
        
        // 如果元素有 data 属性，使用属性赋值
        if ('data' in element || Object.prototype.hasOwnProperty.call(element, 'data')) {
            expect((element as any).data).toBe(largeData);
            expect(element.getAttribute('data')).toBeNull();
        } else {
            // 否则回退到 setAttribute
            expect(element.getAttribute('data')).toBeTruthy();
        }
    });

    it('should use setAttribute for data-* (standard attribute, no property check)', () => {
        const element = document.createElement('my-component');
        const largeData = { /* 大量数据 */ };
        
        // data-* 是标准属性，只使用 setAttribute，不检查 JavaScript 属性
        setSmartProperty(element, 'data-chart', largeData);
        expect(element.getAttribute('data-chart')).toBeTruthy();
        expect(typeof element.getAttribute('data-chart')).toBe('string');
        // 不会设置 JavaScript 属性
        expect((element as any)['data-chart']).toBeUndefined();
    });

    it('should use property for non-standard attributes with functions', () => {
        const element = document.createElement('my-component');
        const handler = () => {};
        setSmartProperty(element, 'onSave', handler); // 非标准属性名
        expect((element as any).onSave).toBe(handler);
    });

    it('should warn about dataSomething conflict', () => {
        const element = document.createElement('my-component');
        const data = { test: 'value' };
        
        // 设置 data-something 属性
        element.setAttribute('data-something', 'value');
        
        // dataSomething 作为 JavaScript 属性可能会与 dataset.something 冲突
        // 浏览器会将 data-something 映射到 dataset.something
        setSmartProperty(element, 'dataSomething', data);
        
        // 注意：dataSomething 可能被忽略或与 dataset.something 冲突
        // 建议：避免使用 data* 开头的属性名
        expect(element.getAttribute('data-something')).toBe('value');
        // dataSomething 属性可能无法正常设置，因为 dataset.something 已存在
    });

    it('should use non-data* prefix for large data', () => {
        const element = document.createElement('my-component');
        const largeData = { /* 大量数据 */ };
        
        // ✅ 推荐：使用非 data* 前缀
        setSmartProperty(element, 'chartData', largeData);
        expect((element as any).chartData).toBe(largeData);
        expect(element.getAttribute('chartData')).toBeNull();
    });

    it('should handle aria-* attributes as standard', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'aria-label', 'Test label');
        expect(div.getAttribute('aria-label')).toBe('Test label');
        expect((div as any)['aria-label']).toBeUndefined();
    });

    it('should handle SVG attributes correctly', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        setSmartProperty(svg, 'viewBox', '0 0 100 100', true);
        expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
    });

    it('should handle null and undefined values', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'customProp', null);
        expect((div as any).customProp).toBeNull();
        
        setSmartProperty(div, 'customProp2', undefined);
        expect((div as any).customProp2).toBeUndefined();
    });

    it('should handle boolean values for standard attributes', () => {
        const input = document.createElement('input');
        setSmartProperty(input, 'disabled', true);
        expect(input.getAttribute('disabled')).toBe('');
        expect(input.disabled).toBe(true);
    });

    it('should handle large object serialization warning', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const element = document.createElement('div');
        const largeData = { data: 'x'.repeat(2 * 1024 * 1024) }; // 2MB
        
        setSmartProperty(element, 'data-large', largeData);
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('value too large')
        );
        consoleSpy.mockRestore();
    });

    it('should handle circular reference in object', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const element = document.createElement('div');
        const circular: any = { data: 'test' };
        circular.self = circular;
        
        setSmartProperty(element, 'data-circular', circular);
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Cannot serialize')
        );
        consoleSpy.mockRestore();
    });

    it('should handle readonly property gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const element = document.createElement('div');
        
        // 尝试设置只读属性
        Object.defineProperty(element, 'readonlyProp', {
            value: 'original',
            writable: false,
        });
        
        setSmartProperty(element, 'readonlyProp', 'new value');
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Failed to set property')
        );
        expect(element.getAttribute('readonlyProp')).toBe('new value');
        consoleSpy.mockRestore();
    });

    it('should handle special properties (ref, className, style, on*)', () => {
        const div = document.createElement('div');
        const refCallback = jest.fn();
        
        // 这些应该由 isSpecialProperty 处理，不会进入 setSmartProperty
        // 但我们需要测试它们不会被错误处理
        setSmartProperty(div, 'ref', refCallback);
        // ref 应该由特殊处理逻辑处理
    });

    it('should handle array values for non-standard properties', () => {
        const element = document.createElement('my-component');
        const arrayData = [1, 2, 3, { nested: 'value' }];
        
        setSmartProperty(element, 'arrayProp', arrayData);
        expect((element as any).arrayProp).toEqual(arrayData);
        expect(element.getAttribute('arrayProp')).toBeNull();
    });

    it('should handle nested objects for non-standard properties', () => {
        const element = document.createElement('my-component');
        const nestedData = {
            level1: {
                level2: {
                    level3: 'deep value'
                }
            }
        };
        
        setSmartProperty(element, 'nestedProp', nestedData);
        expect((element as any).nestedProp).toEqual(nestedData);
        expect((element as any).nestedProp.level1.level2.level3).toBe('deep value');
    });

    it('should handle string values for standard attributes', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'title', 'Tooltip text');
        expect(div.getAttribute('title')).toBe('Tooltip text');
        expect(div.title).toBe('Tooltip text');
    });

    it('should handle number values for standard attributes', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'tabindex', 5);
        expect(div.getAttribute('tabindex')).toBe('5');
        expect(div.tabIndex).toBe(5);
    });

    it('should handle empty string for standard attributes', () => {
        const div = document.createElement('div');
        setSmartProperty(div, 'id', '');
        expect(div.getAttribute('id')).toBe('');
        expect(div.id).toBe('');
    });

    it('should handle existing JavaScript property', () => {
        const element = document.createElement('my-component');
        (element as any).existingProp = 'original';
        
        setSmartProperty(element, 'existingProp', 'new value');
        expect((element as any).existingProp).toBe('new value');
    });

    it('should handle non-existent property fallback to attribute', () => {
        const element = document.createElement('my-component');
        setSmartProperty(element, 'nonExistentProp', 'value');
        expect(element.getAttribute('nonExistentProp')).toBe('value');
    });

    it('should handle complex object serialization for standard attributes', () => {
        const element = document.createElement('div');
        const complexData = {
            string: 'value',
            number: 42,
            boolean: true,
            array: [1, 2, 3],
            nested: { key: 'value' }
        };
        
        setSmartProperty(element, 'data-complex', complexData);
        const serialized = element.getAttribute('data-complex');
        expect(serialized).toBeTruthy();
        expect(JSON.parse(serialized!)).toEqual(complexData);
    });
});
```

### 集成测试

**覆盖率要求：所有集成场景必须测试**

```typescript
describe('Smart Property Assignment Integration', () => {
    it('should handle large data in real component', () => {
        // 测试实际组件中的大数据传递
        class TestComponent extends WebComponent {
            connectedCallback() {
                super.connectedCallback();
                const data = (this as any).chartData;
                expect(data).toBeDefined();
                expect(Array.isArray(data)).toBe(true);
            }
        }
        customElements.define('test-component', TestComponent);
        
        const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            value: `Item ${i}`,
            metadata: { timestamp: Date.now(), index: i }
        }));
        
        const component = document.createElement('test-component') as TestComponent;
        (component as any).chartData = largeDataset;
        document.body.appendChild(component);
        
        expect((component as any).chartData).toEqual(largeDataset);
    });

    it('should handle function references in real component', () => {
        // 测试函数引用传递
        const handler = jest.fn();
        const component = document.createElement('my-component');
        (component as any).onSave = handler;
        
        expect((component as any).onSave).toBe(handler);
        (component as any).onSave('test');
        expect(handler).toHaveBeenCalledWith('test');
    });

    it('should handle mixed standard and non-standard properties', () => {
        // 测试混合使用场景
        const component = document.createElement('my-component');
        const largeData = { /* 大量数据 */ };
        
        // 标准属性
        setSmartProperty(component, 'id', 'my-component');
        setSmartProperty(component, 'data-testid', 'test-123');
        
        // 非标准属性
        setSmartProperty(component, 'chartData', largeData);
        setSmartProperty(component, 'onSave', jest.fn());
        
        expect(component.getAttribute('id')).toBe('my-component');
        expect(component.getAttribute('data-testid')).toBe('test-123');
        expect((component as any).chartData).toBe(largeData);
        expect(typeof (component as any).onSave).toBe('function');
    });

    it('should work with JSX factory integration', () => {
        // 测试与 JSX 工厂的集成
        const element = h('my-component', {
            id: 'test-id',
            'data-testid': 'test',
            chartData: { items: [1, 2, 3] },
            onSave: jest.fn()
        });
        
        expect(element.getAttribute('id')).toBe('test-id');
        expect(element.getAttribute('data-testid')).toBe('test');
        expect((element as any).chartData).toEqual({ items: [1, 2, 3] });
        expect(typeof (element as any).onSave).toBe('function');
    });

    it('should handle component attribute observation', () => {
        // 测试组件属性观察
        class ObservedComponent extends WebComponent {
            static observedAttributes = ['data-config', 'chartData'];
            
            protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
                if (name === 'data-config') {
                    // 标准属性，从 attribute 读取
                    const config = JSON.parse(newValue);
                    expect(config).toBeDefined();
                } else if (name === 'chartData') {
                    // 非标准属性，从 JavaScript 属性读取
                    const data = (this as any).chartData;
                    expect(data).toBeDefined();
                }
            }
        }
        customElements.define('observed-component', ObservedComponent);
        
        const component = document.createElement('observed-component') as ObservedComponent;
        setSmartProperty(component, 'data-config', { setting: 'value' });
        setSmartProperty(component, 'chartData', { items: [1, 2, 3] });
        
        expect(component.getAttribute('data-config')).toBeTruthy();
        expect((component as any).chartData).toEqual({ items: [1, 2, 3] });
    });
});
```

### 性能测试

**覆盖率要求：所有性能关键路径必须测试**

```typescript
describe('Smart Property Assignment Performance', () => {
    it('should benchmark setAttribute vs property assignment', () => {
        // 对比 setAttribute vs 属性赋值的性能
        const iterations = 10000;
        const element = document.createElement('div');
        const data = { test: 'value' };
        
        // 测试 setAttribute（标准属性）
        console.time('setAttribute');
        for (let i = 0; i < iterations; i++) {
            element.setAttribute('data-test', JSON.stringify(data));
        }
        console.timeEnd('setAttribute');
        
        // 测试属性赋值（非标准属性）
        console.time('property assignment');
        for (let i = 0; i < iterations; i++) {
            (element as any).testData = data;
        }
        console.timeEnd('property assignment');
        
        // 属性赋值应该明显快于 setAttribute + JSON.stringify
    });

    it('should handle large data efficiently', () => {
        // 测试大数据场景的性能提升
        const largeData = Array.from({ length: 100000 }, (_, i) => ({
            id: i,
            value: `Item ${i}`,
            metadata: { timestamp: Date.now(), index: i }
        }));
        
        const element = document.createElement('my-component');
        
        // 使用非标准属性（应该很快）
        console.time('large data property');
        (element as any).chartData = largeData;
        console.timeEnd('large data property');
        
        // 使用标准属性（应该较慢，需要序列化）
        console.time('large data attribute');
        element.setAttribute('data-chart', JSON.stringify(largeData));
        console.timeEnd('large data attribute');
        
        expect((element as any).chartData).toEqual(largeData);
    });

    it('should have minimal overhead for property check', () => {
        // 测试属性检查的开销
        const element = document.createElement('div');
        const iterations = 100000;
        
        console.time('property check overhead');
        for (let i = 0; i < iterations; i++) {
            const hasProp = 'id' in element;
            const isStandard = isStandardHTMLAttribute('id');
        }
        console.timeEnd('property check overhead');
        
        // 属性检查应该非常快（< 1ms for 100k iterations）
    });

    it('should handle concurrent property assignments', () => {
        // 测试并发属性赋值
        const elements = Array.from({ length: 1000 }, () => 
            document.createElement('my-component')
        );
        const data = { items: Array.from({ length: 100 }, (_, i) => i) };
        
        console.time('concurrent assignments');
        elements.forEach((el, i) => {
            setSmartProperty(el, `chartData${i}`, data);
        });
        console.timeEnd('concurrent assignments');
        
        elements.forEach((el, i) => {
            expect((el as any)[`chartData${i}`]).toEqual(data);
        });
    });
});
```

### 边界情况测试

**覆盖率要求：所有边界情况必须测试**

```typescript
describe('Smart Property Assignment Edge Cases', () => {
    it('should handle very long attribute names', () => {
        const element = document.createElement('div');
        const longName = 'a'.repeat(1000);
        setSmartProperty(element, longName, 'value');
        expect(element.getAttribute(longName)).toBe('value');
    });

    it('should handle special characters in attribute names', () => {
        const element = document.createElement('div');
        setSmartProperty(element, 'data-test@value', 'test');
        expect(element.getAttribute('data-test@value')).toBe('test');
    });

    it('should handle unicode characters in values', () => {
        const element = document.createElement('div');
        const unicodeValue = '测试 🎉 émoji';
        setSmartProperty(element, 'data-unicode', unicodeValue);
        expect(element.getAttribute('data-unicode')).toBe(unicodeValue);
    });

    it('should handle Date objects', () => {
        const element = document.createElement('my-component');
        const date = new Date();
        setSmartProperty(element, 'timestamp', date);
        expect((element as any).timestamp).toBe(date);
        expect(element.getAttribute('timestamp')).toBeNull();
    });

    it('should handle RegExp objects', () => {
        const element = document.createElement('my-component');
        const regex = /test/gi;
        setSmartProperty(element, 'pattern', regex);
        expect((element as any).pattern).toBe(regex);
    });

    it('should handle Symbol values', () => {
        const element = document.createElement('my-component');
        const symbol = Symbol('test');
        setSmartProperty(element, 'symbolProp', symbol);
        expect((element as any).symbolProp).toBe(symbol);
    });

    it('should handle Map and Set objects', () => {
        const element = document.createElement('my-component');
        const map = new Map([['key', 'value']]);
        const set = new Set([1, 2, 3]);
        
        setSmartProperty(element, 'mapData', map);
        setSmartProperty(element, 'setData', set);
        
        expect((element as any).mapData).toBe(map);
        expect((element as any).setData).toBe(set);
    });
});
```

## 文档计划

### 需要的文档

- [x] RFC 文档（本文档）
- [ ] API 文档更新（jsx-factory）
- [ ] 使用指南（属性 vs attribute）
- [ ] 最佳实践（何时使用属性，何时使用 attribute）
- [ ] 示例代码（大数据传递、函数传递等）

### 文档位置

- API 文档：`packages/core/README.md`
- 使用指南：`site/public/docs/guide/`
- 示例：`site/src/components/examples/`

## 向后兼容性

### 破坏性变更

**无破坏性变更**：
- 现有使用 `setAttribute` 的代码仍然工作
- HTML 属性仍然可以正常使用
- 只是增加了新的能力（属性赋值）

### 迁移策略

**无需迁移**：
- 现有代码无需修改
- 新代码可以选择使用新特性

### 废弃计划

**无废弃**：
- `setAttribute` 仍然可用
- 两种方式可以共存

## 性能影响

### 构建时性能

**无影响**：
- 这是运行时逻辑，不影响构建

### 运行时性能

**预期提升**：
- 大数据场景：避免序列化，性能提升显著
- 小数据场景：属性检查开销很小（`in` 操作符很快）
- 函数传递：避免序列化失败，性能提升

### 内存使用

**预期减少**：
- 直接引用而非字符串拷贝
- 大对象不再需要序列化字符串

## 安全考虑

### XSS 风险

**低风险**：
- JavaScript 属性不会直接注入 HTML
- 但仍需注意在渲染时使用这些属性

### 建议

- 在文档中明确说明安全最佳实践
- 警告开发者不要直接渲染未验证的属性值

## 开发者体验

### 学习曲线

**低**：
- 开发者无需学习新语法
- 自动判断，透明使用

### 调试体验

**需要改进**：
- 属性不会显示在 HTML 中
- 建议在 DevTools 中显示属性值
- 添加调试辅助工具

### 错误处理

**完善的错误处理**：
- 捕获属性赋值错误
- 提供清晰的警告信息
- 回退到 `setAttribute` 时给出提示

## 社区影响

### 生态系统

**正面影响**：
- 支持更复杂的数据传递场景
- 提升组件库的灵活性
- 吸引需要大数据处理的开发者

### 第三方集成

**更好的集成**：
- 可以传递第三方库需要的复杂配置
- 支持传递函数回调
- 更好的 TypeScript 类型支持

## 先例

### 业界实践

#### React

React 使用 `props` 对象，所有属性都是 JavaScript 属性：

```tsx
<Component data={largeObject} onClick={handler} />
// React 内部：component.props.data = largeObject
```

#### Vue

Vue 3 使用 `props`，支持任意类型：

```vue
<MyComponent :data="largeObject" @click="handler" />
```

#### Lit

Lit 使用 `@property` 装饰器，支持类型推断：

```typescript
@property({ type: Object })
data = {};
```

### 学习借鉴

- **React**: 证明了属性传递的可行性和优势
- **Vue**: 展示了类型推断的可能性
- **Lit**: 展示了装饰器在属性定义中的使用

## 附录

### 参考资料

- [MDN: Element.setAttribute](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute)
- [MDN: HTML Attributes vs DOM Properties](https://developer.mozilla.org/en-US/docs/Web/API/Element#html_attributes_vs._dom_properties)
- [Web Components Spec: Attributes and Properties](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-conformance)
- [React: Props vs Attributes](https://react.dev/learn/passing-props-to-a-component)

### 讨论记录

**2024-12-25**: 初始提案
- 问题：大数据通过 `setAttribute` 性能差且有限制
- 方案：检查 `hasOwnProperty`，优先使用 JavaScript 属性
- 状态：Draft，等待社区反馈

**2024-12-26**: 实现完成
- 实现了 HTML First 策略：优先识别标准 HTML 属性，使用 `setAttribute`
- 实现了智能属性分配：非标准属性优先使用 JavaScript 属性赋值
- 支持复杂类型：对象、数组、函数、RegExp、Date 等
- 处理了 SVG 元素的只读属性（如 `viewBox`）
- 处理了自定义元素的 `on*` 属性（作为 JavaScript 属性而非事件监听器）
- 添加了完整的单元测试（254/257 通过）
- 状态：Completed

---

*这个 RFC 旨在改进 WSX 的属性设置策略，提升大数据场景下的性能和功能完整性。*

## 实现总结

### 已完成功能

✅ **HTML First 策略**
- 标准 HTML 属性（`id`, `class`, `data-*`, `aria-*` 等）始终使用 `setAttribute`
- **重要区别**：`data`（不带连字符）不是标准 HTML 属性，是有效的 JavaScript 属性名，可以检查对象属性；`data-*`（带连字符）是标准 HTML 属性，不是 JavaScript 属性，只使用 `setAttribute`
- 非标准属性优先使用 JavaScript 属性赋值

✅ **智能属性分配**
- 对于非标准属性，如果元素有自有属性，只设置 JavaScript 属性
- 支持复杂类型：对象、数组、函数、RegExp、Date、Symbol、Map、Set 等
- 自动处理只读属性，回退到 `setAttribute`

✅ **特殊处理**
- SVG 元素的属性直接使用 `setAttribute`（避免只读属性问题）
- 自定义元素的 `on*` 属性作为 JavaScript 属性设置（而非事件监听器）
- 错误处理和警告信息优化

✅ **测试覆盖**
- 单元测试：254/257 通过
- 覆盖标准属性、非标准属性、边界情况、错误处理等场景

### 实现文件

- `packages/core/src/jsx-factory.ts` - 核心实现
- `packages/core/__tests__/smart-property-assignment.test.ts` - 测试文件

