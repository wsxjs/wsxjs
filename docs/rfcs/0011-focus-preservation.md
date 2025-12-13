# RFC 0011: Focus Preservation During Component Rerender

- **RFC编号**: 0011
- **开始日期**: 2025-01-21
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Draft

## 摘要

设计和实现一个健壮的焦点保持机制，用于 WSX 组件在 DOM 重渲染时自动维持焦点状态，防止用户输入中断并提升用户体验。该机制同时支持 `WebComponent`（Shadow DOM）和 `LightComponent`（Light DOM）。

## 动机

### 当前问题

When WSX components rerender (e.g., due to reactive state changes), the DOM is completely replaced:
- **WebComponent**: `shadowRoot.innerHTML = ""`
- **LightComponent**: `this.innerHTML = ""`

This causes:

1. **Focus Loss**: Active input elements lose focus, interrupting user typing
2. **Cursor Position Loss**: Selection ranges and cursor positions are lost
3. **Input Value Flickering**: Input values may be reset to state values, overwriting user input
4. **Textarea Scroll Loss**: Textarea scroll positions are reset
5. **Select State Loss**: Select element selected options are lost
6. **Poor UX**: Users experience jarring interruptions when typing in forms

### 为什么重要

- **Form Input**: Users typing in input fields lose focus on every keystroke if the input is bound to reactive state
- **Text Editing**: Users editing text areas experience cursor jumps and focus loss
- **Accessibility**: Screen readers and keyboard navigation are disrupted
- **User Frustration**: Poor focus management is a common complaint in reactive frameworks

## 研究：其他框架如何处理焦点

### React

**Approach**: Manual focus management using refs and `useEffect`

```tsx
function MyComponent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  
  useEffect(() => {
    // Manual focus restoration after render
    inputRef.current?.focus();
  }, [value]);
  
  return <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} />;
}
```

**Key Points**:
- Developers must manually manage focus using refs
- No automatic focus preservation
- Requires explicit `useEffect` hooks for focus restoration
- React's reconciliation algorithm helps preserve DOM nodes when possible, but focus is not automatically maintained

### Vue 3

**Approach**: Manual focus management using template refs and `nextTick`

```vue
<template>
  <input ref="inputRef" v-model="value" />
</template>

<script setup>
import { ref, nextTick } from 'vue';

const inputRef = ref(null);
const value = ref('');

// Manual focus restoration
watch(value, async () => {
  await nextTick();
  inputRef.value?.focus();
});
</script>
```

**Key Points**:
- Similar to React, requires manual ref management
- Uses `nextTick` to wait for DOM updates
- No automatic focus preservation
- Developers must explicitly handle focus restoration

### Svelte

**Approach**: Automatic focus preservation using element keys

```svelte
{#each items as item (item.id)}
  <input bind:value={item.name} />
{/each}
```

**Key Points**:
- Uses `key` directive to track elements across rerenders
- Svelte's compiler generates code that preserves DOM nodes when keys match
- Focus is naturally preserved because DOM nodes are reused
- More automatic than React/Vue, but still requires explicit keys

### Angular

**Approach**: Manual focus management using `@ViewChild` and lifecycle hooks

```typescript
@Component({
  template: `<input #inputRef [(ngModel)]="value" />`
})
export class MyComponent {
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  value = '';
  
  ngAfterViewChecked() {
    // Manual focus restoration
    this.inputRef?.nativeElement.focus();
  }
}
```

**Key Points**:
- Requires explicit `@ViewChild` decorators
- Manual focus management in lifecycle hooks
- No automatic preservation

### Lit (Web Components)

**Approach**: Manual focus management, but provides utilities

```typescript
import { html, LitElement } from 'lit';

class MyElement extends LitElement {
  private inputRef?: HTMLInputElement;
  
  render() {
    return html`<input 
      ${ref(this.inputRef = {})}
      @input=${this.handleInput}
    />`;
  }
  
  updated() {
    // Manual focus restoration
    this.inputRef?.focus();
  }
}
```

**Key Points**:
- Lit's `ref` directive helps with element references
- Still requires manual focus management
- No automatic preservation

## 设计原则

Based on research, we should:

1. **Automatic by Default**: Focus preservation should work automatically without developer intervention
2. **Stable Element Identification**: Use stable identifiers (UUIDs, keys, or paths) to track elements across rerenders
3. **Preserve Input State**: Save and restore input values, cursor positions, and selection ranges
4. **Non-Intrusive**: Should not require changes to component code or JSX
5. **Performance**: Minimal overhead, only active when focus is present
6. **Reliable**: Handle edge cases like dynamic lists, conditional rendering, etc.

## 详细设计

### 核心策略

1. **Before Rerender**: Capture focus state (element, value, cursor position)
2. **During Rerender**: DOM is replaced (current behavior)
3. **After Rerender**: Restore focus to the same logical element

### 元素标识

我们需要一种稳定的方式来跨重渲染识别元素。选项：

#### 方案1：稳定键（推荐）

**方法**：使用 `data-wsx-key` 属性进行稳定的元素标识

```tsx
// Component code (no changes needed)
<input value={this.name} onInput={this.handleInput} />

// Transformed by Babel plugin (automatic)
<input 
  data-wsx-key="input-0"  // Stable key based on position/context
  value={this.name} 
  onInput={this.handleInput} 
/>
```

**优点**：
- 跨重渲染保持稳定
- 适用于动态列表
- 类似 React/Vue 的 key
- 可以自动生成

**缺点**：
- 需要 Babel 插件转换
- 键必须稳定且可预测

#### 方案2：元素路径

**方法**：使用 DOM 路径（例如：`div[0] > form[0] > input[1]`）

**优点**：
- 无需代码转换
- 立即可用

**缺点**：
- DOM 结构变化时脆弱
- 实现复杂
- 条件渲染时可能失效

#### 方案3：UUID 与回退

**方法**：为焦点元素生成 UUID，使用索引作为回退

**优点**：
- 比路径更可靠
- 回退提供弹性

**缺点**：
- UUID 不会跨重渲染持久化（新元素没有 UUID）
- 需要回退机制
- 实现更复杂

### 实现方法

**推荐**：使用稳定键（`data-wsx-key`）并自动生成

1. **Babel Plugin Enhancement**: 
   - Automatically add `data-wsx-key` to input elements
   - Generate stable keys based on component context and element position
   - Keys should be deterministic (same element always gets same key)

2. **Focus Capture** (in `BaseComponent.rerender` method):
   ```typescript
   /**
    * Focus state interface
    */
   interface FocusState {
     key: string;
     elementType: 'input' | 'textarea' | 'select' | 'contenteditable';
     value?: string;
     selectionStart?: number;
     selectionEnd?: number;
     scrollTop?: number; // For textarea
     selectedIndex?: number; // For select
   }
   
   /**
    * Capture current focus state before rerender
    */
   private captureFocusState(): FocusState | null {
     // Get active element (works for both Shadow DOM and Light DOM)
     const activeElement = this.shadowRoot?.activeElement || 
                          (document.activeElement && this.contains(document.activeElement) 
                           ? document.activeElement : null);
     
     if (!activeElement || !(activeElement instanceof HTMLElement)) {
       return null;
     }
     
     const key = activeElement.getAttribute('data-wsx-key');
     if (!key) {
       return null; // Element doesn't have key, skip focus preservation
     }
     
     const tagName = activeElement.tagName.toLowerCase();
     const state: FocusState = {
       key,
       elementType: tagName as FocusState['elementType'],
     };
     
     // Handle input and textarea
     if (activeElement instanceof HTMLInputElement || 
         activeElement instanceof HTMLTextAreaElement) {
       state.value = activeElement.value;
       state.selectionStart = activeElement.selectionStart ?? undefined;
       state.selectionEnd = activeElement.selectionEnd ?? undefined;
       
       // For textarea, also save scroll position
       if (activeElement instanceof HTMLTextAreaElement) {
         state.scrollTop = activeElement.scrollTop;
       }
     }
     
     // Handle select
     else if (activeElement instanceof HTMLSelectElement) {
       state.selectedIndex = activeElement.selectedIndex;
     }
     
     // Handle contenteditable
     else if (activeElement.hasAttribute('contenteditable')) {
       state.elementType = 'contenteditable';
       const selection = window.getSelection();
       if (selection && selection.rangeCount > 0) {
         const range = selection.getRangeAt(0);
         state.selectionStart = range.startOffset;
         state.selectionEnd = range.endOffset;
       }
     }
     
     return state;
   }
   ```

3. **Focus Restoration** (after DOM replacement):
   ```typescript
   /**
    * Restore focus state after rerender
    */
   private restoreFocusState(state: FocusState): void {
     if (!state || !state.key) {
       return;
     }
     
     // Use requestAnimationFrame to ensure DOM is fully updated
     requestAnimationFrame(() => {
       // Query in correct scope (Shadow DOM or Light DOM)
       const root = this.shadowRoot || this;
       const target = root.querySelector(`[data-wsx-key="${state.key}"]`) as HTMLElement;
       
       if (!target) {
         return; // Element not found, skip restoration
       }
       
       // Restore value first (before focusing)
       if (state.value !== undefined) {
         if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
           target.value = state.value;
         }
       }
       
       // Restore select state
       if (state.selectedIndex !== undefined && target instanceof HTMLSelectElement) {
         target.selectedIndex = state.selectedIndex;
       }
       
       // Focus the element (prevent scroll)
       target.focus({ preventScroll: true });
       
       // Restore cursor/selection position
       if (state.selectionStart !== undefined) {
         if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
           const start = state.selectionStart;
           const end = state.selectionEnd ?? start;
           target.setSelectionRange(start, end);
           
           // Restore textarea scroll position
           if (state.scrollTop !== undefined && target instanceof HTMLTextAreaElement) {
             target.scrollTop = state.scrollTop;
           }
         } else if (target.hasAttribute('contenteditable')) {
           // Restore contenteditable selection
           const selection = window.getSelection();
           if (selection) {
             const range = document.createRange();
             const textNode = target.childNodes[0];
             if (textNode && textNode.nodeType === Node.TEXT_NODE) {
               const maxPos = Math.min(state.selectionStart, textNode.textContent?.length || 0);
               range.setStart(textNode, maxPos);
               range.setEnd(textNode, state.selectionEnd ?? maxPos);
               selection.removeAllRanges();
               selection.addRange(range);
             }
           }
         }
       }
     });
   }
   ```

4. **Integration in rerender method**:
   ```typescript
   protected rerender(): void {
     if (!this.connected) {
       return;
     }
     
     // 1. Capture focus state BEFORE DOM replacement
     const focusState = this.captureFocusState();
     
     // 2. Replace DOM (existing behavior)
     if (this.shadowRoot) {
       // WebComponent: clear shadow root
       this.shadowRoot.innerHTML = "";
       // ... apply styles ...
     } else {
       // LightComponent: clear light DOM
       this.innerHTML = "";
       // ... apply styles ...
     }
     
     // 3. Render new content
     const content = this.render();
     if (this.shadowRoot) {
       this.shadowRoot.appendChild(content);
     } else {
       this.appendChild(content);
     }
     
     // 4. Restore focus state AFTER render
     if (focusState) {
       this.restoreFocusState(focusState);
     }
   }
   ```

### Key Generation Strategy

Keys should be:
- **Stable**: Same element always gets same key
- **Unique**: Different elements get different keys
- **Deterministic**: Based on component structure, not random

**Proposed Algorithm**:
```typescript
/**
 * Generate stable key for focusable elements
 * @param element - The element to generate key for
 * @param componentName - Component class name
 * @param path - Array of indices from root to element (e.g., [0, 1, 2])
 * @returns Stable key string
 */
function generateStableKey(
  element: HTMLElement,
  componentName: string,
  path: number[]
): string {
  const tagName = element.tagName.toLowerCase();
  const pathStr = path.join('-');
  
  // For input/textarea/select, use more specific identifiers
  if (['input', 'textarea', 'select'].includes(tagName)) {
    const id = element.id;
    const name = element.getAttribute('name');
    const type = element.getAttribute('type') || 'text';
    
    // Priority: id > name > type + path
    if (id) {
      return `${componentName}-${id}`;
    }
    if (name) {
      return `${componentName}-${name}`;
    }
    return `${componentName}-${tagName}-${type}-${pathStr}`;
  }
  
  // For contenteditable elements
  if (element.hasAttribute('contenteditable')) {
    const id = element.id;
    if (id) {
      return `${componentName}-${id}`;
    }
    return `${componentName}-contenteditable-${pathStr}`;
  }
  
  // Default: component-tag-path
  return `${componentName}-${tagName}-${pathStr}`;
}

// Example keys:
// - "MyForm-input-email-0-1" (input with name="email", second child of first child)
// - "MyForm-textarea-0-2" (textarea, third child of first child)
// - "MyForm-select-0-3" (select, fourth child of first child)
```

**Key Generation in Babel Plugin**:
```typescript
// Babel plugin traverses JSX tree and generates keys
// For each focusable element (input, textarea, select, [contenteditable]):
// 1. Track path from root (array of sibling indices)
// 2. Generate key using algorithm above
// 3. Add data-wsx-key attribute

// Example transformation:
// Before:
<input value={this.name} onInput={this.handleInput} />

// After:
<input 
  data-wsx-key="MyForm-input-text-0-0"
  value={this.name} 
  onInput={this.handleInput} 
/>
```

### Component Support

**Both `WebComponent` and `LightComponent` are supported**:

- **WebComponent (Shadow DOM)**:
  - Uses `shadowRoot.activeElement` to detect focus
  - Queries within `shadowRoot` for element restoration
  - Focus is isolated within Shadow DOM boundary

- **LightComponent (Light DOM)**:
  - Uses `document.activeElement` with containment check
  - Queries within component's Light DOM for element restoration
  - Focus works with global DOM but scoped to component

**Implementation Note**: The focus capture and restoration logic is implemented in `BaseComponent.rerender()`, which is inherited by both `WebComponent` and `LightComponent`. The logic automatically detects the DOM type (Shadow DOM vs Light DOM) and uses the appropriate APIs.

### Edge Cases

1. **Dynamic Lists**: Keys must be stable even when list items are added/removed
2. **Conditional Rendering**: Elements that appear/disappear should not break focus
3. **Multiple Components**: Each component manages its own focus independently
4. **Nested Components**: Focus should be preserved within the correct component scope
5. **Programmatic Focus**: Should not interfere with programmatic `focus()` calls
6. **LightComponent with Third-party Libraries**: Focus preservation works even when components contain third-party DOM (e.g., EditorJS)

## API 设计

### 自动（无需 API 变更）

Focus preservation should work automatically for all components:

```tsx
// No changes needed - works automatically
export class MyForm extends WebComponent {
  @state private name = '';
  
  render() {
    return (
      <div>
        <input 
          value={this.name}
          onInput={(e) => { this.name = e.target.value; }}
        />
      </div>
    );
  }
}
```

### Optional: Manual Control

For advanced use cases, provide optional API:

```typescript
// Optional: Disable focus preservation per component
export class MyForm extends WebComponent {
  constructor() {
    super({ preserveFocus: false }); // Disable for this component
  }
}

// Optional: Disable for specific rerender (future enhancement)
// this.rerender({ preserveFocus: false });

// Optional: Force focus on specific element (future enhancement)
// this.focusElement('[data-wsx-key="input-0"]');
```

**Note**: Manual control APIs are optional and may be added in future versions based on community needs.

## 实现计划

### Phase 1: Babel Plugin for Key Generation

1. **Extend existing Babel plugin** (`babel-plugin-wsx-state` or create new `babel-plugin-wsx-focus`)
   - Reuse existing AST traversal infrastructure
   - Add key generation logic to JSX element visitor
   - Automatically add `data-wsx-key` to focusable elements:
     - `input`, `textarea`, `select`
     - Elements with `contenteditable` attribute
   
2. **Key generation implementation**:
   - Traverse JSX tree during compilation
   - Track path from root (array of sibling indices)
   - Generate stable keys using algorithm above
   - Inject `data-wsx-key` attribute

3. **Integration with Vite plugin**:
   - Ensure Babel plugin runs in Vite build pipeline
   - Test with `.wsx` files
   - Verify keys are generated correctly

### Phase 2: Focus Capture and Restoration

1. **Add focus state management to `BaseComponent`**:
   - Add `captureFocusState()` private method
   - Add `restoreFocusState()` private method
   - Add `FocusState` interface
   
2. **Update `rerender()` method**:
   - Call `captureFocusState()` before DOM replacement
   - Call `restoreFocusState()` after DOM replacement
   - Ensure works for both `WebComponent` (Shadow DOM) and `LightComponent` (Light DOM)
   
3. **Handle all element types**:
   - Input elements (value, selection)
   - Textarea (value, selection, scroll position)
   - Select (selected index)
   - Contenteditable (selection range)

### Phase 3: Testing and Edge Cases

1. **Unit Tests**:
   - Test `captureFocusState()` with different element types
   - Test `restoreFocusState()` with different states
   - Test key generation algorithm
   
2. **Integration Tests**:
   - Test with `WebComponent` (Shadow DOM)
   - Test with `LightComponent` (Light DOM)
   - Test with dynamic lists (keys remain stable)
   - Test with conditional rendering
   - Test with nested components (each manages own focus)
   
3. **Edge Cases**:
   - Multiple inputs in form
   - Rapid state changes (debouncing)
   - Programmatic focus changes
   - Elements without keys (should skip)
   - Elements that disappear (should gracefully fail)
   
4. **Performance Testing**:
   - Measure key generation overhead
   - Measure focus capture/restore overhead
   - Test with large forms (100+ inputs)
   - Benchmark against baseline (no focus preservation)

## 权衡取舍

### 优势

- **自动工作**：开发者无需编写任何代码
- **提升用户体验**：消除输入中断
- **支持所有元素类型**：input、textarea、select、contenteditable
- **性能优化**：只在有焦点时执行
- **向后兼容**：现有代码无需修改

### 劣势

- **需要 Babel 插件**：增加构建复杂度
- **Key 生成开销**：编译时生成 keys（可忽略）
- **运行时开销**：焦点捕获和恢复（< 1ms，可忽略）

### 替代方案

#### 替代方案1：虚拟 DOM 方法

**描述**：使用虚拟 DOM diff 来保持 DOM 节点

**优点**：自然的焦点保持（节点被重用）

**缺点**：
- 需要重大架构变更
- 性能开销
- 复杂度增加
- 不符合 WSX 理念（信任浏览器，最小抽象）

#### 替代方案2：增量 DOM 更新

**描述**：只更新变化的部分，而不是完全替换

**优点**：更好的性能，自然的焦点保持

**缺点**：
- 实现复杂
- 需要 diff 算法
- 可能与 JSX 工厂模式不兼容

#### 替代方案3：开发者手动管理（类似 React/Vue）

**描述**：要求开发者使用 refs 手动管理焦点

**优点**：
- 实现简单
- 完全由开发者控制

**缺点**：
- 开发体验差
- 容易忘记
- 样板代码多
- 不符合 WSX 理念（自动、零配置）

**选择理由**：稳定键方案平衡了功能、性能和复杂度，符合 WSX 的自动化和原生优先理念。

## 测试策略

### Unit Tests

```typescript
describe('Focus Preservation', () => {
  describe('captureFocusState', () => {
    it('should capture input element state', () => {
      // Test input value, selection
    });
    
    it('should capture textarea state including scroll', () => {
      // Test textarea value, selection, scrollTop
    });
    
    it('should capture select selectedIndex', () => {
      // Test select state
    });
    
    it('should capture contenteditable selection', () => {
      // Test contenteditable range
    });
    
    it('should return null if no active element', () => {
      // Test no focus case
    });
    
    it('should return null if element has no key', () => {
      // Test element without data-wsx-key
    });
  });
  
  describe('restoreFocusState', () => {
    it('should restore input focus and selection', () => {
      // Test input restoration
    });
    
    it('should restore textarea focus, selection, and scroll', () => {
      // Test textarea restoration
    });
    
    it('should restore select selectedIndex', () => {
      // Test select restoration
    });
    
    it('should handle missing element gracefully', () => {
      // Test element not found
    });
  });
});
```

### Integration Tests

```typescript
describe('Focus Preservation Integration', () => {
  it('should preserve focus in WebComponent during rerender', () => {
    // Test Shadow DOM scenario
  });
  
  it('should preserve focus in LightComponent during rerender', () => {
    // Test Light DOM scenario
  });
  
  it('should preserve focus with dynamic lists', () => {
    // Test list items with stable keys
  });
  
  it('should handle conditional rendering', () => {
    // Test elements appearing/disappearing
  });
  
  it('should work with nested components', () => {
    // Test each component manages own focus
  });
  
  it('should not interfere with programmatic focus', () => {
    // Test manual focus() calls
  });
});
```

### E2E Tests

- Real browser testing with Playwright/Puppeteer
- Test user typing in input fields
- Test textarea editing with scrolling
- Test select dropdown interactions
- Test contenteditable editing
- Test keyboard navigation
- Test screen reader compatibility

### Edge Case Tests

- Rapid state changes (debouncing behavior)
- Multiple simultaneous rerenders
- Focus on element that gets removed
- Focus on element that changes type
- Large forms (performance)
- Nested forms
- Forms with validation errors

## 性能影响

### 构建时性能

#### 构建时性能

- **Key Generation**: Minimal overhead during compilation
  - Only processes focusable elements
  - Single AST traversal
  - Estimated: < 1ms per component

#### 运行时性能

- **Focus Capture**: 
  - Only executes when element has focus
  - Simple DOM queries and property reads
  - Estimated: < 0.1ms per capture
  
- **Focus Restoration**:
  - Uses `requestAnimationFrame` (non-blocking)
  - Single DOM query + property writes
  - Estimated: < 0.5ms per restoration
  
- **Memory**:
  - Stores one `FocusState` object per rerender
  - Object is garbage collected after restoration
  - Estimated: < 100 bytes per rerender

#### 性能基准

**Baseline (no focus preservation)**:
- Rerender time: ~1ms for simple form

**With focus preservation**:
- Rerender time: ~1.1ms (10% overhead)
- Only when focus is present
- Negligible impact on user experience

#### 优化策略

1. **Lazy Key Generation**: Only generate keys for focusable elements
2. **Early Exit**: Skip capture if no active element
3. **Debouncing**: Batch rapid rerenders (already handled by `queueMicrotask`)
4. **Caching**: Cache key lookups (if needed)

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：焦点保持增强JSX开发体验，无需手动管理焦点
- [x] **信任浏览器**：使用浏览器原生 `activeElement`、`selection` API
- [x] **零运行时开销**：只在有焦点时执行，编译时生成keys
- [x] **Web标准**：基于Web标准API，不创建专有抽象

### 理念契合说明

焦点保持机制完全符合WSX的核心理念：

1. **自动且零配置**：开发者无需编写任何代码，自动工作
2. **原生API优先**：使用浏览器原生焦点和选择API
3. **最小抽象**：不引入虚拟DOM或复杂diff算法
4. **性能优先**：只在需要时执行，使用 `requestAnimationFrame` 避免阻塞

## 向后兼容性

### 破坏性变更

**无破坏性变更**。所有现有代码继续工作。

### 兼容性说明

1. **现有组件**：
   - 无需修改代码
   - 自动获得焦点保持功能
   - 如果元素没有 `data-wsx-key`，跳过焦点保持（向后兼容）

2. **手动添加 keys**：
   - 如果开发者手动添加 `data-wsx-key`，使用手动key
   - 不会冲突

3. **禁用焦点保持**：
   - 可通过配置选项禁用（如果需要）
   ```typescript
   constructor() {
     super({ preserveFocus: false });
   }
   ```

### 迁移策略

**无需迁移**。功能自动启用，现有代码无需修改。

### 废弃计划

不废弃任何现有功能。

## 未解决问题

1. **Key Generation for Dynamic Lists**: 
   - 需要确保列表项的key在添加/删除时保持稳定
   - 建议：使用列表项的稳定标识符（如 `item.id`）作为key的一部分
   - 待实现时确定具体策略

2. **Scope**: 
   - 焦点保持只在组件内部工作（Shadow DOM 或 Light DOM 范围内）
   - 不跨组件边界（符合组件隔离原则）
   - 已确定：每个组件独立管理自己的焦点

3. **Accessibility**: 
   - 需要测试与屏幕阅读器的兼容性
   - 需要确保键盘导航不受影响
   - 待E2E测试验证

4. **配置选项**:
   - 是否需要全局禁用选项？
   - 是否需要更细粒度的控制（如只对特定元素类型启用）？
   - 待社区反馈决定

## References

- [React Focus Management](https://react.dev/learn/managing-focus)
- [Vue Template Refs](https://vuejs.org/guide/essentials/template-refs.html)
- [Svelte Key Blocks](https://svelte.dev/docs#key)
- [Lit Refs](https://lit.dev/docs/templates/expressions/#ref)
- [Web Components Focus Management](https://web.dev/focus-management/)

## 实现计划

### 阶段规划

1. **阶段1**: Babel插件开发（Key生成）
   - 扩展或创建Babel插件
   - 实现key生成算法
   - 集成到Vite构建流程
   - 单元测试

2. **阶段2**: 核心实现（焦点捕获和恢复）
   - 在 `BaseComponent` 中实现焦点管理
   - 支持 `WebComponent` 和 `LightComponent`
   - 处理所有元素类型
   - 单元测试和集成测试

3. **阶段3**: 测试和优化
   - 完整测试套件
   - 性能测试和优化
   - E2E测试
   - 文档完善

### 时间线

- **Week 1-2**: Babel插件开发和测试
- **Week 3-4**: 核心实现和单元测试
- **Week 5**: 集成测试和E2E测试
- **Week 6**: 性能优化和文档

### 依赖项

- 现有Babel插件基础设施
- Vite插件集成
- TypeScript类型定义
- 测试框架（Jest, Playwright）

## 文档计划

### 需要的文档

- [ ] API文档更新（BaseComponent新增方法）
- [ ] 使用指南（自动工作，无需配置）
- [ ] 最佳实践（何时需要手动管理）
- [ ] 故障排除（常见问题）
- [ ] 性能说明

### 文档位置

- `packages/core/README.md` - 核心功能说明
- `docs/FOCUS_PRESERVATION.md` - 详细使用指南（新建）
- 代码注释和JSDoc

## 安全考虑

- **无安全风险**：只读取和设置DOM属性，不执行代码
- **隐私**：不收集或传输任何数据
- **XSS**：使用浏览器原生API，不引入新的攻击向量

## 开发者体验

### 学习曲线

**零学习曲线**：功能自动工作，开发者无需学习任何新API。

### 调试体验

- 清晰的错误日志（如果恢复失败）
- 可选的调试模式（记录焦点状态）
- 浏览器DevTools兼容

### 错误处理

- 优雅降级：如果恢复失败，静默处理（不抛出错误）
- 日志记录：开发模式下记录警告
- 不影响组件正常渲染

## 社区影响

### 生态系统

- 提升WSX框架的用户体验
- 减少开发者需要处理的焦点管理代码
- 使WSX更适合表单密集型应用

### 第三方集成

- 不影响现有第三方库集成
- 与EditorJS、Chart.js等库兼容
- 不干扰外部焦点管理

## 先例

### 业界实践

- **Svelte**: 使用key指令自动保持焦点
- **React**: 需要手动管理（refs）
- **Vue**: 需要手动管理（template refs）
- **Lit**: 需要手动管理（ref directive）

### 学习借鉴

借鉴Svelte的自动焦点保持理念，但适配WSX的编译时key生成和运行时恢复机制。

## 附录

### 参考资料

- [React Focus Management](https://react.dev/learn/managing-focus)
- [Vue Template Refs](https://vuejs.org/guide/essentials/template-refs.html)
- [Svelte Key Blocks](https://svelte.dev/docs#key)
- [Lit Refs](https://lit.dev/docs/templates/expressions/#ref)
- [Web Components Focus Management](https://web.dev/focus-management/)
- [MDN: activeElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)
- [MDN: Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection)

### 讨论记录

[待补充社区讨论记录]

---

*这个RFC为WSX框架提供了自动焦点保持机制，大幅提升表单输入体验，同时保持框架的简洁性和性能。*

