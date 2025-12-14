# WSX 响应式状态系统

> **注意**: 本文档已合并到 RFC 格式。请查看 [RFC-0004: 响应式状态系统](../rfcs/0004-reactive-state-system.md) 获取最新和完整的信息。

WSX 响应式状态系统提供了基于浏览器原生 Proxy API 的轻量级状态管理，让组件能够自动响应状态变化并重新渲染。

## 核心设计理念

- **信任浏览器**：基于原生 Proxy 和 queueMicrotask API
- **零运行时开销**：编译时优化，运行时最小化
- **可选使用**：不破坏现有组件，可以渐进式采用
- **批量更新**：自动合并多个状态变化为一次重渲染

## 快速开始

### 基础响应式对象

```tsx
import { reactive } from '@wsxjs/wsx-core';

// 创建响应式对象
const state = reactive({
    count: 0,
    message: 'Hello'
}, () => {
    console.log('State changed!');
});

// 修改状态会自动触发回调
state.count++; // 输出: "State changed!"
state.message = 'Updated'; // 输出: "State changed!"
```

### 响应式组件

```tsx
import { ReactiveWebComponent, autoRegister } from '@wsxjs-core';

@autoRegister()
export class Counter extends ReactiveWebComponent {
    // 响应式状态 - 自动触发重渲染
    private state = this.reactive({
        count: 0,
        step: 1
    });
    
    // useState API - 类似 React
    private [getTheme, setTheme] = this.useState('theme', 'light');
    
    render() {
        return (
            <div class={`counter theme-${this.getTheme()}`}>
                <span>Count: {this.state.count}</span>
                <button onClick={this.increment}>+{this.state.step}</button>
                <button onClick={this.decrement}>-{this.state.step}</button>
            </div>
        );
    }
    
    private increment = () => {
        this.state.count += this.state.step; // 自动重渲染！
    };
    
    private decrement = () => {
        this.state.count -= this.state.step; // 自动重渲染！
    };
}
```

## API 参考

### `reactive<T>(obj: T, onChange: () => void): T`

创建响应式对象，当对象属性发生变化时自动调用回调函数。

```tsx
const state = reactive({
    name: 'John',
    age: 30,
    hobbies: ['coding', 'reading']
}, () => {
    console.log('State changed');
});

// 所有这些操作都会触发回调
state.name = 'Jane';
state.age++;
state.hobbies = ['swimming', 'hiking'];
```

**特性：**
- 基于 Proxy，性能优秀
- 自动批量更新，多个变化合并为一次回调
- 保持对象原型链
- 只在值真正改变时触发

### `createState<T>(initialValue: T, onChange: () => void)`

创建单个响应式状态值，返回 getter 和 setter。

```tsx
const [getValue, setValue] = createState(0, () => {
    console.log('Value changed');
});

console.log(getValue()); // 0

setValue(5); // 触发回调
setValue(prev => prev + 1); // 支持函数更新

console.log(getValue()); // 6
```

### `ReactiveWebComponent`

扩展的 WebComponent 基类，提供响应式状态管理能力。

```tsx
export class MyComponent extends ReactiveWebComponent {
    constructor() {
        super({
            debug: true // 可选：启用调试模式
        });
    }
    
    // 创建响应式对象
    private state = this.reactive({ count: 0 });
    
    // 创建响应式状态
    private [getTheme, setTheme] = this.useState('theme', 'light');
    
    render() {
        // 状态变化时自动重渲染
        return <div>{this.state.count}</div>;
    }
}
```

**方法：**
- `reactive<T>(obj: T): T` - 创建响应式对象
- `useState<T>(key: string, initialValue: T)` - 创建响应式状态
- `getStateSnapshot()` - 获取所有状态快照（调试用）
- `enableDebug()` / `disableDebug()` - 控制调试模式

### `makeReactive(debugMode?: boolean)`

装饰器函数，为普通 WebComponent 添加响应式能力。

```tsx
@makeReactive(true) // 启用调试
@autoRegister()
export class MyComponent extends WebComponent {
    private state = this.reactive({ count: 0 });
    
    render() {
        return <div>{this.state.count}</div>;
    }
}
```

## 批量更新机制

WSX 使用浏览器原生的 `queueMicrotask` API 实现批量更新：

```tsx
const state = reactive({ a: 1, b: 2 }, () => {
    console.log('Callback triggered');
});

// 这些修改会被批量处理
state.a = 10;
state.b = 20;
state.a = 30;

// 只会输出一次 "Callback triggered"
```

**优势：**
- 避免不必要的重复渲染
- 基于浏览器原生调度，性能最佳
- 保证状态的一致性

## 调试功能

### 全局调试

```tsx
import { ReactiveDebug } from '@wsxjs-core';

// 启用全局调试
ReactiveDebug.enable();

// 创建带调试的响应式对象
const state = reactiveWithDebug({
    count: 0
}, () => {
    console.log('State changed');
}, 'MyComponent'); // 调试名称
```

### 组件级调试

```tsx
export class MyComponent extends ReactiveWebComponent {
    constructor() {
        super({ debug: true }); // 启用组件调试
    }
    
    private state = this.reactive({ count: 0 }, 'counter'); // 调试名称
}
```

调试模式会在控制台输出状态变化日志：
```
[WSX Reactive] State change in MyComponent: {key: "count", oldValue: 0, newValue: 1}
```

## 性能考虑

### 最佳实践

1. **合理使用响应式对象**
   ```tsx
   // 好：只对需要触发重渲染的数据使用响应式
   private uiState = this.reactive({ count: 0, visible: true });
   private staticConfig = { maxCount: 100 }; // 不需要响应式
   ```

2. **避免不必要的嵌套**
   ```tsx
   // 避免：深度嵌套的响应式对象
   private state = this.reactive({
       user: { profile: { settings: { theme: 'light' } } }
   });
   
   // 推荐：扁平化状态结构
   private userTheme = this.reactive({ theme: 'light' });
   ```

3. **使用批量更新**
   ```tsx
   // 好：批量更新会自动合并
   private updateUserInfo = (name: string, age: number) => {
       this.state.name = name;
       this.state.age = age;
       // 只会触发一次重渲染
   };
   ```

### 性能指标

- **内存开销**：每个响应式对象增加一个 Proxy 包装（~100 bytes）
- **CPU开销**：Proxy 访问性能接近原生对象访问
- **渲染性能**：批量更新显著减少重渲染次数

## 与现有组件的兼容性

### 渐进式采用

```tsx
// 现有组件无需修改
export class ExistingComponent extends WebComponent {
    private count = 0;
    
    private increment = () => {
        this.count++;
        this.rerender(); // 仍然可以手动重渲染
    };
}

// 新组件可以使用响应式
export class NewComponent extends ReactiveWebComponent {
    private state = this.reactive({ count: 0 });
    
    private increment = () => {
        this.state.count++; // 自动重渲染
    };
}
```

### 混合使用

```tsx
export class HybridComponent extends ReactiveWebComponent {
    // 响应式状态
    private uiState = this.reactive({ loading: false });
    
    // 普通状态
    private cache = new Map();
    
    private async loadData() {
        this.uiState.loading = true; // 自动重渲染显示loading
        
        const data = await fetch('/api/data');
        this.cache.set('data', data); // 不触发重渲染
        
        this.uiState.loading = false; // 自动重渲染隐藏loading
    }
}
```

## 常见问题

### Q: 响应式对象的属性修改不生效？

A: 确保修改的是对象属性，而不是嵌套对象的属性：

```tsx
// ❌ 这不会触发更新
this.state.user.name = 'John';

// ✅ 这会触发更新
this.state.user = { ...this.state.user, name: 'John' };
```

### Q: 如何处理数组操作？

A: 替换整个数组而不是修改数组元素：

```tsx
// ❌ 这不会触发更新
this.state.items.push(newItem);

// ✅ 这会触发更新
this.state.items = [...this.state.items, newItem];
```

### Q: 性能会有影响吗？

A: 现代浏览器对 Proxy 有很好的优化，性能影响微乎其微。批量更新机制还能减少重渲染次数，实际上可能提升性能。

### Q: 可以在服务器端使用吗？

A: 可以，但需要确保环境支持 Proxy 和 queueMicrotask API。

## 示例

查看完整的示例代码：
- [ReactiveCounter.wsx](../packages/examples/src/components/ReactiveCounter.wsx) - 完整的响应式计数器示例
- [响应式待办事项列表](../packages/examples/src/components/ReactiveTodoList.wsx)
- [响应式表单验证](../packages/examples/src/components/ReactiveForm.wsx)

## 相关资源

- [RFC-0001: 响应式状态系统](../rfcs/2025-01-20-reactive-state-system.md) - 设计文档
- [WebComponent 基础](./QUICK_START.md) - WSX 基础用法
- [组件组合](./COMPONENT_COMPOSITION.md) - 高级组合模式
