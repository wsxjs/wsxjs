# Array Reactive Coverage - 数组响应式覆盖说明

本文档说明所有可能触发重渲染的数组操作及其测试覆盖情况。

## 已覆盖的数组操作

### 1. 数组替换（Array Replacement）
**操作**: `this.todos = [...]`  
**触发方式**: setter 自动包装新数组为响应式并调用 `scheduleRerender()`  
**测试**: `should automatically wrap new arrays in reactive when replaced`

### 2. 数组方法（Array Methods）

#### 2.1 push()
**操作**: `this.todos.push(item)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on push()`

#### 2.2 pop()
**操作**: `this.todos.pop()`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on pop()`

#### 2.3 shift()
**操作**: `this.todos.shift()`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on shift()`

#### 2.4 unshift()
**操作**: `this.todos.unshift(item)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on unshift()`

#### 2.5 splice()
**操作**: `this.todos.splice(index, deleteCount, ...items)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on splice()`

#### 2.6 sort()
**操作**: `this.todos.sort()` 或 `this.todos.sort(compareFn)`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on sort()`

#### 2.7 reverse()
**操作**: `this.todos.reverse()`  
**触发方式**: Proxy get trap 拦截方法调用，执行后触发更新  
**测试**: `should trigger rerender on reverse()`

### 3. 数组索引赋值（Array Index Assignment）
**操作**: `this.todos[0] = newValue`  
**触发方式**: Proxy set trap 检测到值变化，触发更新  
**测试**: `should trigger rerender on array index assignment`

### 4. 数组长度修改（Array Length Modification）
**操作**: `this.todos.length = 0` 或 `this.todos.length = newLength`  
**触发方式**: Proxy set trap 检测到 length 属性变化，触发更新  
**测试**: `should trigger rerender on array length modification`

### 5. 组合操作（Multiple Operations）
**操作**: 连续多个数组操作  
**触发方式**: 每个操作都会触发更新（可能被批量处理）  
**测试**: `should trigger rerender on multiple array operations`

## 实现细节

### Proxy 拦截机制

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

### Setter 自动包装机制

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

## 测试覆盖情况

所有数组操作都有对应的测试用例，位于：
- `packages/core/__tests__/reactive-decorator.test.ts`
- `packages/core/__tests__/reactive.test.ts`

### 测试套件

```
describe("Array mutation methods that trigger rerender", () => {
    - push()
    - pop()
    - shift()
    - unshift()
    - splice()
    - sort()
    - reverse()
    - array index assignment
    - array length modification
    - multiple operations
})
```

## 未覆盖的情况

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

## 性能考虑

1. **批量更新**: 使用 `queueMicrotask` 进行批量更新，多个操作可能只触发一次重渲染
2. **值比较**: 只有当值真正改变时才触发更新（`oldValue !== value`）
3. **异步调度**: 所有更新都是异步的，避免阻塞主线程

## 最佳实践

1. **使用数组方法**: 优先使用 `push()`, `pop()`, `splice()` 等方法，而不是替换整个数组
2. **批量操作**: 多个数组操作会自动批量处理，无需手动优化
3. **避免不必要的操作**: 只读操作不会触发更新，可以安全使用

## 总结

✅ **所有可能触发重渲染的数组操作都已完全覆盖**：
- 数组替换 ✓
- 所有数组变异方法 (push, pop, shift, unshift, splice, sort, reverse) ✓
- 数组索引赋值 ✓
- 数组长度修改 ✓
- 组合操作 ✓

所有测试用例都位于 `packages/core/__tests__/reactive-decorator.test.ts` 中的 `"Array mutation methods that trigger rerender"` 测试套件中。

