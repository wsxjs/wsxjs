# RFC: 组件组合和Slot增强

- **RFC编号**: 0002
- **开始日期**: 2025-01-20
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Rejected
- **拒绝日期**: 2026-01
- **拒绝原因**: 与当前 WSX 类组件模型及已有能力重复。when/unless/each 可由 JSX 与 key-based reconciliation 覆盖；useEventBus/useLocalStorage 等 Hooks 风格与类组件不符。若仅保留 emit/listen 与 slot fallback 可后续以更小范围单独提案。

## 摘要

增强WSX框架的组件组合能力，提供更好的Slot支持、组件通信机制和组合模式，同时保持原生WebComponent的特性。

## 动机

### 为什么需要这个功能？

当前WSX组件主要依赖原生WebComponent的`<slot>`机制，但在复杂应用中需要：
1. 更灵活的内容分发机制
2. 父子组件通信
3. 组件组合模式
4. 条件渲染和列表渲染的优化

### 当前状况

```tsx
// 目前的组合方式比较基础
export class Card extends WebComponent {
    render() {
        return (
            <div class="card">
                <slot name="header"></slot>
                <slot></slot>
                <slot name="footer"></slot>
            </div>
        );
    }
}

// 使用时
<my-card>
    <h2 slot="header">标题</h2>
    <p>内容</p>
    <button slot="footer">确定</button>
</my-card>
```

### 目标用户

- 构建复杂UI组件库的开发者
- 需要组件组合和重用的应用开发者
- 希望更好的组件通信机制的团队

## 详细设计

### 核心概念

1. **增强的Slot系统**：提供条件slot、动态slot等
2. **组件通信**：基于原生CustomEvent的标准化通信
3. **组合Hooks**：提供常用组合逻辑的简单抽象
4. **渲染优化**：条件渲染和列表渲染的性能优化

### API设计

```typescript
// 1. 增强的WebComponent基类
export abstract class ComposableWebComponent extends WebComponent {
    // 组件通信
    protected emit<T = any>(eventName: string, detail?: T): void;
    protected listen<T = any>(eventName: string, handler: (event: CustomEvent<T>) => void): void;
    
    // 条件渲染助手
    protected when(condition: boolean, renderFn: () => HTMLElement): HTMLElement | null;
    protected unless(condition: boolean, renderFn: () => HTMLElement): HTMLElement | null;
    
    // 列表渲染助手
    protected each<T>(
        items: T[], 
        renderFn: (item: T, index: number) => HTMLElement,
        keyFn?: (item: T) => string | number
    ): HTMLElement[];
    
    // Slot增强
    protected slot(name?: string, fallback?: () => HTMLElement): HTMLElement;
    protected hasSlotContent(name?: string): boolean;
}

// 2. 组合函数
export function useEventBus<T = any>(): {
    emit(event: string, data?: T): void;
    on(event: string, handler: (data: T) => void): void;
    off(event: string, handler: (data: T) => void): void;
};

export function useLocalStorage<T>(key: string, defaultValue: T): {
    value: T;
    setValue(newValue: T): void;
};

// 3. 高阶组件
export function withEventBus<T extends WebComponent>(ComponentClass: new (...args: any[]) => T): new (...args: any[]) => T;
```

### 实现细节

```typescript
// packages/core/src/composable.ts
export abstract class ComposableWebComponent extends WebComponent {
    // 标准化事件发射
    protected emit<T = any>(eventName: string, detail?: T): void {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true,
            composed: true // 穿透Shadow DOM
        });
        this.dispatchEvent(event);
    }
    
    // 标准化事件监听
    protected listen<T = any>(
        eventName: string, 
        handler: (event: CustomEvent<T>) => void
    ): void {
        this.addEventListener(eventName, handler as EventListener);
    }
    
    // 条件渲染
    protected when(condition: boolean, renderFn: () => HTMLElement): HTMLElement | null {
        return condition ? renderFn() : null;
    }
    
    // 列表渲染优化
    protected each<T>(
        items: T[], 
        renderFn: (item: T, index: number) => HTMLElement,
        keyFn?: (item: T) => string | number
    ): HTMLElement[] {
        return items.map((item, index) => {
            const element = renderFn(item, index);
            // 为性能优化添加key
            if (keyFn) {
                element.setAttribute('data-key', String(keyFn(item)));
            }
            return element;
        });
    }
    
    // 增强的slot处理
    protected slot(name?: string, fallback?: () => HTMLElement): HTMLElement {
        const slotElement = document.createElement('slot');
        if (name) {
            slotElement.name = name;
        }
        
        // 检查是否有内容，没有则使用fallback
        if (fallback && !this.hasSlotContent(name)) {
            return fallback();
        }
        
        return slotElement;
    }
    
    protected hasSlotContent(name?: string): boolean {
        const selector = name ? `[slot="${name}"]` : ':not([slot])';
        return this.querySelector(selector) !== null;
    }
}
```

### 示例用法

```tsx
// 增强的Card组件
@autoRegister()
export class EnhancedCard extends ComposableWebComponent {
    private showFooter = true;
    
    constructor() {
        super({ styles });
        // 监听子组件事件
        this.listen('card-action', (event) => {
            console.log('Card action:', event.detail);
        });
    }
    
    render() {
        return (
            <div class="card">
                {/* 带fallback的slot */}
                {this.slot('header', () => <h3>默认标题</h3>)}
                
                <div class="card-content">
                    {this.slot()}
                </div>
                
                {/* 条件渲染 */}
                {this.when(this.showFooter, () => 
                    this.slot('footer', () => 
                        <div class="default-footer">
                            <button onClick={() => this.emit('card-close')}>
                                关闭
                            </button>
                        </div>
                    )
                )}
            </div>
        );
    }
    
    private toggleFooter = () => {
        this.showFooter = !this.showFooter;
        this.rerender();
    };
}

// 列表组件示例
@autoRegister()
export class TodoList extends ComposableWebComponent {
    private todos = [
        { id: 1, text: 'Learn WSX', done: false },
        { id: 2, text: 'Build app', done: true }
    ];
    
    render() {
        return (
            <div class="todo-list">
                {this.each(
                    this.todos,
                    (todo, index) => (
                        <div class={`todo ${todo.done ? 'done' : ''}`}>
                            <input 
                                type="checkbox" 
                                checked={todo.done}
                                onChange={() => this.toggleTodo(todo.id)}
                            />
                            <span>{todo.text}</span>
                            <button onClick={() => this.removeTodo(todo.id)}>
                                删除
                            </button>
                        </div>
                    ),
                    todo => todo.id // key函数用于性能优化
                )}
            </div>
        );
    }
    
    private toggleTodo = (id: number) => {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.done = !todo.done;
            this.emit('todo-changed', { id, done: todo.done });
            this.rerender();
        }
    };
}

// 使用组合函数
@autoRegister()
export class UserSettings extends ComposableWebComponent {
    private eventBus = useEventBus();
    private theme = useLocalStorage('theme', 'light');
    
    render() {
        return (
            <div class={`settings theme-${this.theme.value}`}>
                <label>
                    主题：
                    <select onChange={this.handleThemeChange}>
                        <option value="light" selected={this.theme.value === 'light'}>
                            浅色
                        </option>
                        <option value="dark" selected={this.theme.value === 'dark'}>
                            深色
                        </option>
                    </select>
                </label>
            </div>
        );
    }
    
    private handleThemeChange = (event: Event) => {
        const select = event.target as HTMLSelectElement;
        this.theme.setValue(select.value);
        this.eventBus.emit('theme-changed', select.value);
        this.rerender();
    };
}
```

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：增强JSX中的组件组合体验
- [x] **信任浏览器**：基于原生CustomEvent、slot等Web标准
- [x] **零运行时**：只是更好的API封装，无额外运行时
- [x] **Web标准**：完全基于WebComponent标准的组合机制

### 理念契合说明

这个组合系统完全基于Web标准：
1. **CustomEvent**：浏览器原生的事件系统
2. **Slot机制**：WebComponent标准的内容分发
3. **简单抽象**：只是让原生能力更好用，不重新发明

## 权衡取舍

### 优势

- 基于Web标准，兼容性好
- 提升组件组合的开发体验
- 保持WSX的简单理念
- 可选使用，不影响现有代码

### 劣势

- 增加了API复杂度
- 学习成本略有增加
- 某些高级组合模式仍需手动实现

### 替代方案

1. **React-style Composition**：更灵活但偏离Web标准
2. **Vue-style Slots**：功能强大但需要编译时支持
3. **原生方案**：保持现状，手动处理组合

选择增强的Web标准方案平衡了功能和简单性。

## 未解决问题

1. 是否需要支持异步组件？
2. 如何处理深层组件通信？
3. 是否需要提供状态管理集成？

## 实现计划

### 阶段规划

1. **阶段1**: ComposableWebComponent基类和核心API
2. **阶段2**: 组合函数和工具库
3. **阶段3**: 文档、示例和最佳实践

### 时间线

- **Week 1-2**: 核心组合API实现
- **Week 3**: 组合函数库开发
- **Week 4**: 测试和文档
- **Week 5**: 示例应用和发布

### 依赖项

- 现有WebComponent基类
- JSX factory支持
- TypeScript类型定义

## 测试策略

### 单元测试

```typescript
describe('ComposableWebComponent', () => {
    it('should emit and listen to custom events', () => {
        // 测试事件通信
    });
    
    it('should handle conditional rendering', () => {
        // 测试条件渲染
    });
    
    it('should optimize list rendering with keys', () => {
        // 测试列表渲染优化
    });
});
```

### 集成测试

- 测试复杂组件组合场景
- 测试事件冒泡和传播
- 测试slot内容分发

### 端到端测试

- 构建复杂的组合组件示例
- 测试用户交互和组件通信

## 文档计划

### 需要的文档

- [x] 组件组合指南
- [x] 事件通信最佳实践
- [x] Slot使用进阶教程
- [x] 组合函数API文档
- [x] 迁移指南

### 文档位置

- `docs/COMPONENT_COMPOSITION.md`
- `docs/EVENT_COMMUNICATION.md`
- `packages/examples/` - 复杂组合示例

## 向后兼容性

### 破坏性变更

无破坏性变更。所有功能都是可选的增强。

### 迁移策略

- 现有组件继续工作
- 可以渐进式采用新的组合能力
- 提供迁移工具和指南

### 废弃计划

不废弃任何现有功能。

## 性能影响

### 构建时性能

无影响，只是API增强。

### 运行时性能

- **事件系统**：使用原生CustomEvent，性能优秀
- **列表渲染**：通过key优化减少不必要的DOM操作
- **条件渲染**：避免不必要的DOM创建

### 内存使用

最小影响，主要是事件监听器的内存开销。

## 安全考虑

使用标准Web API，无额外安全风险。注意事件数据的安全性。

## 开发者体验

### 学习曲线

中等，建立在Web标准之上：
```tsx
// 简单直观的API
this.emit('my-event', data);
this.when(condition, () => <div>Conditional</div>);
```

### 调试体验

- 使用浏览器DevTools查看CustomEvent
- Slot内容在Elements面板中清晰可见
- 组件树结构保持标准WebComponent形式

### 错误处理

- 提供清晰的事件类型错误信息
- Slot fallback机制防止空内容
- 组合函数的边界情况处理

## 社区影响

### 生态系统

为WSX生态提供强大的组件组合能力，促进组件库发展。

### 第三方集成

标准的WebComponent组合机制与任何框架兼容。

## 先例

### 业界实践

- **Lit Framework**：WebComponent的组合模式
- **Stencil**：编译时优化的组件组合
- **Angular Elements**：Angular组件的WebComponent化

### 学习借鉴

借鉴Lit的组合模式，但保持WSX的简单性。

## 附录

### 参考资料

- [WebComponent Slots](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)
- [CustomEvent API](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
- [Lit Component Composition](https://lit.dev/docs/composition/)

### 讨论记录

[待补充社区讨论记录]

---

*这个RFC在保持Web标准兼容的同时，为WSX提供了强大的组件组合能力。*