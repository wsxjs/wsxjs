# RFC: 响应式状态系统

- **RFC编号**: 0001
- **开始日期**: 2025-01-20
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Implemented

## 摘要

为WSX框架引入轻量级响应式状态系统，基于浏览器原生API（Proxy），提供简单的状态变化自动重渲染能力。

## 动机

### 为什么需要这个功能？

当前WSX组件需要手动调用`rerender()`来更新视图，这在复杂组件中容易遗漏，降低开发体验。需要一个轻量级的响应式状态系统来自动处理状态变化。

### 当前状况

```tsx
export class Counter extends WebComponent {
    private count = 0;
    
    private increment = () => {
        this.count++;
        this.rerender(); // 容易忘记！
    };
    
    render() {
        return <button onClick={this.increment}>{this.count}</button>;
    }
}
```

### 目标用户

所有WSX开发者，特别是：
- 构建有状态组件的开发者
- 需要频繁状态更新的交互组件
- 希望减少样板代码的开发者

## 详细设计

### 核心概念

1. **响应式状态**：使用Proxy包装的状态对象，自动监听变化
2. **自动重渲染**：状态变化时自动调用组件的`rerender()`方法
3. **批量更新**：使用`queueMicrotask`批量处理多个状态变化

### API设计

```typescript
// 核心API
export function reactive<T extends object>(
    obj: T, 
    onchange: () => void
): T;

// WebComponent基类扩展
export abstract class ReactiveWebComponent extends WebComponent {
    protected reactive<T extends object>(obj: T): T;
    protected state<T>(initialValue: T): [() => T, (value: T) => void];
}
```

### 实现细节

```typescript
// packages/core/src/reactive.ts
export function reactive<T extends object>(
    obj: T, 
    onchange: () => void
): T {
    return new Proxy(obj, {
        set(target, key, value) {
            if (target[key] !== value) {
                target[key] = value;
                // 使用浏览器的微任务队列批量更新
                queueMicrotask(onchange);
            }
            return true;
        }
    });
}

// 简单的批量更新调度器
class SimpleScheduler {
    private pending = new Set<() => void>();
    
    schedule(fn: () => void) {
        this.pending.add(fn);
        queueMicrotask(() => {
            this.pending.forEach(f => f());
            this.pending.clear();
        });
    }
}
```

### 示例用法

```tsx
// 方式1：直接使用reactive函数
export class Counter extends WebComponent {
    private state = reactive({
        count: 0,
        message: 'Hello'
    }, () => this.rerender());
    
    private increment = () => {
        this.state.count++; // 自动重渲染！
    };
    
    render() {
        return (
            <div>
                <span>{this.state.count}</span>
                <button onClick={this.increment}>+</button>
            </div>
        );
    }
}

// 方式2：使用ReactiveWebComponent基类
export class TodoList extends ReactiveWebComponent {
    private todos = this.reactive([
        { id: 1, text: 'Learn WSX', done: false }
    ]);
    
    private addTodo = () => {
        this.todos.push({
            id: Date.now(),
            text: 'New todo',
            done: false
        }); // 自动重渲染！
    };
    
    render() {
        return (
            <div>
                {this.todos.map(todo => 
                    <div key={todo.id}>
                        <input 
                            type="checkbox" 
                            checked={todo.done}
                            onChange={() => todo.done = !todo.done}
                        />
                        {todo.text}
                    </div>
                )}
                <button onClick={this.addTodo}>Add Todo</button>
            </div>
        );
    }
}
```

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：增强了JSX的开发体验，减少样板代码
- [x] **信任浏览器**：基于原生Proxy和queueMicrotask，无自定义调度器
- [x] **零运行时**：最小化运行时开销，只在状态变化时触发
- [x] **Web标准**：使用标准Web API，不依赖框架特有抽象

### 理念契合说明

这个响应式系统完全基于浏览器原生能力：
1. **Proxy**：ES6标准，浏览器原生支持
2. **queueMicrotask**：浏览器原生的批量更新机制
3. **简单直接**：不引入复杂的依赖追踪或虚拟DOM

## 权衡取舍

### 优势

- 极简API，学习成本低
- 基于浏览器原生能力，性能好
- 可选使用，不破坏现有组件
- 零运行时依赖

### 劣势

- 只支持对象和数组的浅层监听
- 不支持复杂的依赖追踪
- Proxy兼容性（IE不支持）

### 替代方案

1. **Observable模式**：更复杂，但功能更强
2. **Signal-based**：类似Solid.js，但偏离了简单理念
3. **MobX-style**：功能完整，但运行时开销大

选择Proxy方案因为它最符合WSX的简单直接理念。

## 未解决问题

1. 是否需要支持深层对象监听？
2. 如何处理循环引用？
3. 是否需要提供取消监听的API？

## 实现计划

### 阶段规划

1. **阶段1**: 实现基础响应式函数和测试
2. **阶段2**: 扩展WebComponent基类
3. **阶段3**: 文档和示例

### 时间线

- **Week 1**: 核心响应式函数实现
- **Week 2**: WebComponent集成和测试
- **Week 3**: 文档、示例和发布

### 依赖项

- 现有WebComponent基类
- TypeScript支持
- 测试基础设施

## 测试策略

### 单元测试

```typescript
describe('reactive', () => {
    it('should trigger callback on property change', () => {
        let called = false;
        const obj = reactive({ count: 0 }, () => { called = true; });
        obj.count++;
        expect(called).toBe(true);
    });
    
    it('should batch multiple changes', async () => {
        let callCount = 0;
        const obj = reactive({ a: 1, b: 2 }, () => { callCount++; });
        obj.a++;
        obj.b++;
        await new Promise(resolve => queueMicrotask(resolve));
        expect(callCount).toBe(1); // 批量处理
    });
});
```

### 集成测试

- 测试在WebComponent中的自动重渲染
- 测试复杂状态更新场景
- 测试性能影响

### 端到端测试

- 在examples应用中构建响应式组件
- 测试用户交互的状态更新

## 文档计划

### 需要的文档

- [x] API文档更新
- [x] 响应式状态使用指南  
- [ ] 从手动rerender迁移指南
- [x] 示例代码
- [x] 最佳实践

### 文档位置

- `docs/REACTIVE_STATE.md` - 详细使用指南
- `packages/core/README.md` - API文档更新
- `packages/examples/` - 示例组件

## 向后兼容性

### 破坏性变更

无破坏性变更。新的响应式系统是可选的，现有组件继续工作。

### 迁移策略

渐进式采用：
1. 开发者可以选择使用响应式功能
2. 现有组件无需修改
3. 可以混合使用手动和自动重渲染

### 废弃计划

不废弃任何现有功能。

## 性能影响

### 构建时性能

无影响，不增加构建复杂度。

### 运行时性能

- **Proxy开销**：现代浏览器优化良好
- **批量更新**：减少不必要的重渲染
- **内存**：每个响应式对象增加一个Proxy包装

### 内存使用

最小影响，Proxy包装开销很小。

## 安全考虑

使用标准Proxy API，无安全风险。

## 开发者体验

### 学习曲线

极低，API设计直观：
```tsx
const state = reactive({ count: 0 }, () => this.rerender());
state.count++; // 就这么简单！
```

### 调试体验

- 状态变化清晰可见
- 可以在开发者工具中检查Proxy对象
- 提供调试模式显示状态变化日志

### 错误处理

- Proxy操作失败时提供清晰错误信息
- 避免在响应式回调中的循环调用

## 社区影响

### 生态系统

为WSX生态带来现代响应式能力，同时保持简单性。

### 第三方集成

响应式状态可以与任何状态管理库集成。

## 先例

### 业界实践

- **Vue 3 Reactivity**：使用Proxy实现响应式
- **Solid.js Signals**：细粒度响应式更新
- **MobX**：基于Proxy的状态管理

### 学习借鉴

借鉴Vue 3的Proxy响应式设计，但大幅简化以符合WSX理念。

## 附录

### 参考资料

- [MDN Proxy文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [Vue 3 Reactivity原理](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [queueMicrotask API](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask)

### 讨论记录

[待补充社区讨论记录]

---

*这个RFC提供了在保持WSX简单理念的同时，引入现代响应式能力的方案。*