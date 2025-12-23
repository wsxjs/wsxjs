# RFC-0015: 数组响应式覆盖说明

- **RFC编号**: 0015
- **开始日期**: 2025-12-14
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

本文档详细说明 WSXJS 中所有可能触发重渲染的数组操作及其测试覆盖情况。确保开发者了解哪些数组操作会触发响应式更新，哪些不会，以及如何正确使用数组响应式功能。

## 动机

### 为什么需要这个文档？

在使用 `@state` 装饰器管理数组状态时，开发者需要明确了解：

1. **哪些操作会触发重渲染**：避免不必要的性能开销
2. **哪些操作不会触发重渲染**：理解只读操作的安全性
3. **测试覆盖情况**：确保所有场景都有测试保障
4. **实现机制**：理解底层 Proxy 拦截和 setter 包装机制

### 问题场景

开发者可能不清楚哪些数组操作会触发重渲染：

```typescript
class TodoList extends WebComponent {
    @state private todos: Todo[] = [];
    
    addTodo(todo: Todo) {
        // ✅ 会触发重渲染
        this.todos.push(todo);
        
        // ✅ 会触发重渲染
        this.todos = [...this.todos, todo];
        
        // ❌ 不会触发重渲染（只读操作）
        const count = this.todos.length;
        const first = this.todos[0];
    }
}
```

### 目标用户

所有使用数组响应式状态的 WSX 开发者，特别是：
- 需要理解响应式系统工作原理的开发者
- 需要优化性能的开发者
- 需要编写测试的开发者

## 详细设计

### 核心概念

**数组响应式**：通过 Proxy 拦截数组的变异操作，自动触发组件重渲染。

**两种触发机制**：
1. **Proxy 拦截**：拦截数组方法调用（push, pop, splice 等）和属性赋值（索引、length）
2. **Setter 包装**：当整个数组被替换时，自动包装新数组为响应式

### 已覆盖的数组操作

#### 1. 数组替换（Array Replacement）

**操作**: `this.todos = [...]`  
**触发方式**: setter 自动包装新数组为响应式并调用 `scheduleRerender()`  
**测试**: `should automatically wrap new arrays in reactive when replaced`

```typescript
// 示例
this.todos = [newTodo1, newTodo2]; // ✅ 触发重渲染
```

#### 2. 数组方法（Array Methods）

所有数组变异方法都会触发重渲染：

##### 2.1 push()
**操作**: `this.todos.push(item)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on push()`

##### 2.2 pop()
**操作**: `this.todos.pop()`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on pop()`

##### 2.3 shift()
**操作**: `this.todos.shift()`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on shift()`

##### 2.4 unshift()
**操作**: `this.todos.unshift(item)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on unshift()`

##### 2.5 splice()
**操作**: `this.todos.splice(index, deleteCount, ...items)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on splice()`

##### 2.6 sort()
**操作**: `this.todos.sort()` 或 `this.todos.sort(compareFn)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on sort()`

##### 2.7 reverse()
**操作**: `this.todos.reverse()`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on reverse()`

#### 3. 数组索引赋值（Array Index Assignment）

**操作**: `this.todos[0] = newValue`  
**触发方式**: Proxy set trap 检测到值变化，触发更新  
**测试**: `should trigger rerender on array index assignment`

```typescript
// 示例
this.todos[0] = updatedTodo; // ✅ 触发重渲染
```

#### 4. 数组长度修改（Array Length Modification）

**操作**: `this.todos.length = 0` 或 `this.todos.length = newLength`  
**触发方式**: Proxy set trap 检测到 length 属性变化，触发更新  
**测试**: `should trigger rerender on array length modification`

```typescript
// 示例
this.todos.length = 0; // ✅ 触发重渲染（清空数组）
this.todos.length = 5; // ✅ 触发重渲染（扩展数组）
```

#### 5. 组合操作（Multiple Operations）

**操作**: 连续多个数组操作  
**触发方式**: 每个操作都会触发更新（可能被批量处理）  
**测试**: `should trigger rerender on multiple array operations`

```typescript
// 示例
this.todos.push(item1); // 可能触发更新
this.todos.push(item2); // 可能触发更新
this.todos.push(item3); // 可能触发更新
// 实际可能只触发一次重渲染（批量处理）
```

### 实现细节

#### Proxy 拦截机制

```typescript
// 数组方法拦截
get(target: T, key: string | symbol): any {
    const value = target[key as keyof T];
    
    // 如果是数组，拦截数组变异方法
    if (isArray && typeof key === "string" && ARRAY_MUTATION_METHODS.includes(key as any)) {
        return function (this: any, ...args: any[]) {
            // 调用原始方法
            const result = (Array.prototype[key as keyof Array<any>] as Function).apply(
                target,
                args
            );
            
            // 数组内容已改变，触发更新
            scheduler.schedule(onChange);
            
            return result;
        };
    }
    
    return value;
}

// 数组索引和 length 修改拦截
set(target: T, key: string | symbol, value: any): boolean {
    const oldValue = target[key as keyof T];
    
    if (oldValue !== value) {
        target[key as keyof T] = value;
        scheduler.schedule(onChange);
    }
    
    return true;
}
```

#### Setter 自动包装机制

当执行 `this.todos = [...]` 时，Babel 插件生成的 setter 会：

1. 检查新值是否为数组或对象
2. 如果是，自动调用 `this.reactive(newValue)` 包装为响应式
3. 调用 `this.scheduleRerender()` 触发重渲染

```javascript
set: (newValue) => {
    _todosReactive = Array.isArray(newValue) || typeof newValue === "object"
        ? this.reactive(newValue)
        : newValue;
    this.scheduleRerender();
}
```

### 未覆盖的情况（预期行为）

以下情况**不会**触发重渲染（这是预期的行为）：

1. **只读操作**：
   - `this.todos.length` (读取)
   - `this.todos[0]` (读取)
   - `this.todos.slice()` (不修改原数组)
   - `this.todos.map()` (不修改原数组)
   - `this.todos.filter()` (不修改原数组)
   - `this.todos.find()` (不修改原数组)

2. **非变异方法**：
   - `concat()`, `join()`, `indexOf()`, `includes()`, `forEach()`, `reduce()`, 等

这些操作不会触发重渲染，因为它们不会修改数组本身，可以安全使用。

## 测试覆盖情况

所有数组操作都有对应的测试用例，位于：
- `packages/core/__tests__/reactive-decorator.test.ts`
- `packages/core/__tests__/reactive.test.ts`

### 测试套件

```typescript
describe("Array mutation methods that trigger rerender", () => {
    test("should trigger rerender on push()", () => { ... });
    test("should trigger rerender on pop()", () => { ... });
    test("should trigger rerender on shift()", () => { ... });
    test("should trigger rerender on unshift()", () => { ... });
    test("should trigger rerender on splice()", () => { ... });
    test("should trigger rerender on sort()", () => { ... });
    test("should trigger rerender on reverse()", () => { ... });
    test("should trigger rerender on array index assignment", () => { ... });
    test("should trigger rerender on array length modification", () => { ... });
    test("should trigger rerender on multiple array operations", () => { ... });
    test("should automatically wrap new arrays in reactive when replaced", () => { ... });
});
```

## 性能考虑

1. **批量更新**: 使用 `queueMicrotask` 进行批量更新，多个操作可能只触发一次重渲染
2. **值比较**: 只有当值真正改变时才触发更新（`oldValue !== value`）
3. **异步调度**: 所有更新都是异步的，避免阻塞主线程

### 批量更新示例

```typescript
// 多个操作可能只触发一次重渲染
this.todos.push(item1);
this.todos.push(item2);
this.todos.push(item3);
// 实际可能只触发一次重渲染（批量处理）
```

## 最佳实践

1. **使用数组方法**: 优先使用 `push()`, `pop()`, `splice()` 等方法，而不是替换整个数组
2. **批量操作**: 多个数组操作会自动批量处理，无需手动优化
3. **避免不必要的操作**: 只读操作不会触发更新，可以安全使用

### 推荐用法

```typescript
class TodoList extends WebComponent {
    @state private todos: Todo[] = [];
    
    // ✅ 推荐：使用数组方法
    addTodo(todo: Todo) {
        this.todos.push(todo);
    }
    
    // ✅ 推荐：使用 splice 删除
    removeTodo(index: number) {
        this.todos.splice(index, 1);
    }
    
    // ✅ 推荐：使用数组方法排序
    sortTodos() {
        this.todos.sort((a, b) => a.priority - b.priority);
    }
    
    // ⚠️ 不推荐：替换整个数组（性能较差）
    replaceTodos(newTodos: Todo[]) {
        this.todos = newTodos; // 会触发重渲染，但性能不如直接修改
    }
}
```

## 与WSX理念的契合度

### 符合核心原则

- ✅ **JSX语法糖**：数组响应式让开发者可以像使用普通数组一样使用响应式数组
- ✅ **信任浏览器**：使用原生 Proxy API，充分利用浏览器能力
- ✅ **零运行时开销**：只在数组被修改时触发更新，只读操作无开销
- ✅ **Web标准**：基于 Web 标准的 Proxy API，而非专有抽象

### 理念契合说明

数组响应式系统完全符合 WSX 的核心理念：
- 使用原生 Proxy API 实现，不引入额外的运行时库
- 开发者体验友好，可以像使用普通数组一样使用
- 性能优化，批量更新和异步调度确保流畅体验

## 权衡取舍

### 优势

- ✅ **完整的测试覆盖**：所有数组操作都有测试保障
- ✅ **性能优化**：批量更新和异步调度
- ✅ **开发者友好**：可以像使用普通数组一样使用
- ✅ **类型安全**：TypeScript 支持完整

### 劣势

- ⚠️ **Proxy 兼容性**：需要支持 Proxy 的现代浏览器（IE11 不支持）
- ⚠️ **调试复杂度**：Proxy 拦截可能增加调试难度

### 替代方案

考虑过的其他方案：
1. **手动调用更新**：要求开发者手动调用 `rerender()`，但体验较差
2. **Immutable 库**：使用 Immutable.js 等库，但增加了依赖和复杂度
3. **自定义数组类**：创建自定义数组类，但破坏了原生数组的使用体验

最终选择 Proxy 方案，因为它：
- 保持原生数组的使用体验
- 不需要额外的依赖
- 性能优秀
- 符合 Web 标准

## 总结

✅ **所有可能触发重渲染的数组操作都已完全覆盖**：
- 数组替换 ✓
- 所有数组变异方法 (push, pop, shift, unshift, splice, sort, reverse) ✓
- 数组索引赋值 ✓
- 数组长度修改 ✓
- 组合操作 ✓

所有测试用例都位于 `packages/core/__tests__/reactive-decorator.test.ts` 中的 `"Array mutation methods that trigger rerender"` 测试套件中。

## 相关文档

- [RFC-0004: 响应式状态系统](./0004-reactive-state-system.md)
- [RFC-0007: 响应式装饰器](./0007-reactive-decorator.md)
- [RFC-0013: @state 装饰器初始值验证](./0013-state-initial-value-validation.md)

