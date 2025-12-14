# RFC-0013: @state 装饰器初始值验证

- **RFC编号**: 0013
- **开始日期**: 2025-01-20
- **状态**: Implemented

## 摘要

确保 `@state` 装饰器的属性必须在编译时（Babel 插件）和开发时（ESLint）验证初始值。这是强制性的，因为 Babel 插件需要初始值来判断属性类型（primitive vs object/array），并生成正确的响应式初始化代码。缺少初始值会导致构建失败，ESLint 会在开发时提前报告错误。

## 动机

### 为什么需要这个功能？

`@state` 装饰器是 WSX 框架的核心功能，用于创建响应式状态。为了在编译时正确转换装饰器，Babel 插件必须：

1. **判断属性类型**：根据初始值判断是 primitive（使用 `useState`）还是 object/array（使用 `reactive`）
2. **提取初始值**：从 AST 中提取初始值，生成构造函数中的初始化代码
3. **类型安全**：确保状态有明确的初始值，避免运行时错误

**问题场景**：

```typescript
class MyComponent extends WebComponent {
    @state private count; // ❌ 没有初始值
    @state private user;  // ❌ 没有初始值
    
    render() {
        // 如果 count 和 user 没有初始值，Babel 插件无法判断：
        // - 应该使用 useState 还是 reactive？
        // - 初始值是什么？
        // - 类型是什么？
    }
}
```

### 当前状况

在实现验证之前，缺少初始值的 `@state` 属性会导致：

1. **构建时问题**：
   - Babel 插件无法判断属性类型
   - 生成的代码可能不正确
   - 错误延迟到运行时才发现

2. **运行时问题**：
   - 状态未正确初始化
   - 响应式系统无法正常工作
   - 难以调试的错误

3. **开发体验问题**：
   - 没有早期错误提示
   - 需要运行代码才能发现问题
   - 错误信息不明确

### 目标用户

所有使用 `@state` 装饰器的 WSX 开发者，特别是：
- 新接触 WSX 框架的开发者
- 从其他框架迁移到 WSX 的开发者
- 需要类型安全和编译时验证的开发者

## 详细设计

### 核心概念

**初始值验证**：确保 `@state` 装饰器的属性必须有明确的初始值，这是编译时转换的前提条件。

**两层验证**：
1. **ESLint 规则**：开发时（编辑器中）实时检查，提供即时反馈
2. **Babel 插件**：构建时验证，确保编译失败而不是运行时失败

### API设计

#### ESLint 规则

**规则名称**: `wsx/state-requires-initial-value`

**错误级别**: `error`（默认）

**配置**：

```javascript
// eslint.config.js
{
    rules: {
        "wsx/state-requires-initial-value": "error"
    }
}
```

**错误消息**：

```
@state decorator on property 'count' requires an initial value.

Examples:
  @state private count = '';  // for string
  @state private count = 0;  // for number
  @state private count = {};  // for object
  @state private count = [];  // for array
  @state private count = undefined;  // for optional
```

#### Babel 插件验证

**验证时机**: 编译时（Babel transform 阶段）

**错误行为**: 抛出 `buildCodeFrameError`，停止构建

**错误消息**：

```
@state decorator on property 'count' requires an initial value.

Examples:
  @state private count = "";  // for string
  @state private count = 0;  // for number
  @state private count = {};  // for object
  @state private count = [];  // for array
  @state private count = undefined;  // for optional

Current code: @state private count;

This error should be caught during build time.
If you see this at runtime, it means the Babel plugin did not process this file.
```

### 实现细节

#### 1. ESLint 规则实现

**文件**: `packages/eslint-plugin/src/rules/state-requires-initial-value.ts`

**检测逻辑**：

```typescript
// 检测 @state 装饰器
const hasStateDecorator = member.decorators?.some(
    (decorator) => decorator.expression.name === "state"
);

// 检查是否有初始值
const hasInitialValue = member.value !== undefined && 
                       member.value !== null &&
                       !isUndefinedIdentifier(member.value);

if (hasStateDecorator && !hasInitialValue) {
    context.report({
        node: member,
        messageId: "missingInitialValue",
        data: { propertyName: member.key.name }
    });
}
```

**检测的无效情况**：

```typescript
// ❌ 没有初始值
@state private count;
@state private user;
@state private items;

// ❌ 显式 undefined（视为没有初始值）
@state private count = undefined;
@state private user: User | undefined = undefined;
```

**检测的有效情况**：

```typescript
// ✅ 有初始值
@state private count = 0;
@state private name = "";
@state private enabled = false;
@state private user = { name: "John" };
@state private items = [];
@state private optional: string | undefined = undefined; // 显式 undefined 是允许的
```

#### 2. Babel 插件验证

**文件**: `packages/vite-plugin/src/babel-plugin-wsx-state.ts`

**验证逻辑**：

```typescript
// 检查是否有初始值
const hasInitialValue = !!(
    member.value &&
    !(member.value.type === "Identifier" && 
      member.value.name === "undefined") &&
    !(member.value.type === "UnaryExpression" && 
      member.value.operator === "void")
);

if (!hasInitialValue) {
    // 构建时错误，停止构建
    const error = path.buildCodeFrameError(
        `@state decorator on property '${key}' requires an initial value.`
        // ... 详细的错误消息和示例
    );
    throw error; // 停止构建
}
```

**关键点**：

1. **构建时失败**：使用 `path.buildCodeFrameError()` 提供精确的错误位置
2. **不静默失败**：抛出错误，停止构建，不允许 fallback
3. **清晰的错误消息**：提供修复示例和说明

### 示例用法

#### 有效用法

```typescript
import { WebComponent } from "@wsxjs/wsx-core";
import { state } from "@wsxjs/wsx-core";

class Counter extends WebComponent {
    // ✅ 字符串初始值
    @state private name = "";
    
    // ✅ 数字初始值
    @state private count = 0;
    
    // ✅ 布尔初始值
    @state private enabled = false;
    
    // ✅ 对象初始值（使用 reactive）
    @state private user = { name: "John", age: 30 };
    
    // ✅ 数组初始值（使用 reactive）
    @state private items = [];
    
    // ✅ 可选类型（显式 undefined）
    @state private optional: string | undefined = undefined;
    
    render() {
        return h("div", {}, [
            h("p", {}, `Name: ${this.name}`),
            h("p", {}, `Count: ${this.count}`),
            h("button", { onClick: () => this.count++ }, "Increment")
        ]);
    }
}
```

#### 无效用法（会被 ESLint 和 Babel 检测）

```typescript
class MyComponent extends WebComponent {
    // ❌ ESLint 错误：缺少初始值
    // ❌ Babel 构建错误：无法判断类型
    @state private count;
    
    // ❌ ESLint 错误：缺少初始值
    @state private user;
    
    // ❌ ESLint 错误：显式 undefined（视为没有初始值）
    @state private optional = undefined;
}
```

#### 修复方法

```typescript
// 修复前
@state private count;

// 修复后
@state private count = 0; // 根据实际类型选择初始值
```

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：验证确保 `@state` 装饰器正确使用，提升开发体验
- [x] **信任浏览器**：编译时验证，不增加运行时开销
- [x] **零运行时**：验证在编译时完成，运行时无额外检查
- [x] **Web标准**：基于 TypeScript 和 Babel 标准工具链

### 理念契合说明

这个功能完全符合 WSX 的核心理念：

1. **编译时验证**：在构建时发现问题，而不是运行时
2. **类型安全**：确保状态有明确的类型和初始值
3. **开发者体验**：ESLint 提供即时反馈，Babel 提供精确的错误位置
4. **零运行时开销**：所有验证在编译时完成

## 权衡取舍

### 优势

1. **早期错误检测**：
   - ESLint 在编辑器中实时提示
   - Babel 在构建时验证，防止错误代码进入生产环境

2. **清晰的错误消息**：
   - 提供修复示例
   - 指出问题位置
   - 说明为什么需要初始值

3. **类型安全**：
   - 确保状态有明确的类型
   - 避免运行时类型错误

4. **开发者体验**：
   - 即时反馈（ESLint）
   - 构建时验证（Babel）
   - 减少调试时间

### 劣势

1. **严格性**：
   - 不允许没有初始值的 `@state` 属性
   - 可能对某些用例过于严格

2. **学习曲线**：
   - 新开发者需要了解为什么需要初始值
   - 需要理解 primitive vs object/array 的区别

3. **可选类型处理**：
   - 显式 `undefined` 是允许的，但可能不够直观
   - 需要开发者明确声明可选类型

### 替代方案

#### 方案1：运行时默认值

**描述**：允许没有初始值，在运行时使用默认值

**问题**：
- 无法判断类型（primitive vs object/array）
- 运行时错误，难以调试
- 不符合编译时验证的理念

#### 方案2：类型推断

**描述**：从 TypeScript 类型推断初始值类型

**问题**：
- TypeScript 类型可能不够精确（如 `string | number`）
- 无法推断运行时值
- 增加实现复杂度

#### 方案3：可选验证

**描述**：将验证设为可选，允许开发者禁用

**问题**：
- 降低类型安全性
- 增加配置复杂度
- 可能导致运行时错误

**选择**：采用强制验证方案，因为：
- 确保类型安全
- 提供最佳开发者体验
- 符合 WSX 编译时验证的理念

## 未解决问题

1. **可选类型的处理**：
   - 当前允许显式 `undefined`，但可能不够直观
   - 是否需要更明确的语法（如 `@state private count?: number = undefined`）？

2. **复杂初始值**：
   - 函数调用作为初始值（如 `@state private date = new Date()`）是否支持？
   - 当前支持，但需要确保 Babel 插件正确处理

3. **迁移路径**：
   - 对于已有代码，如何批量修复缺少初始值的问题？
   - 是否需要提供自动修复工具？

## 实现计划

### 阶段规划

1. **阶段1**: ESLint 规则实现 ✅
   - 实现 `state-requires-initial-value` 规则
   - 添加测试用例
   - 更新文档

2. **阶段2**: Babel 插件验证 ✅
   - 在 Babel 插件中添加初始值验证
   - 使用 `buildCodeFrameError` 提供精确错误位置
   - 添加测试用例

3. **阶段3**: 文档和示例 ✅
   - 更新 ESLint 规则文档
   - 添加使用示例
   - 更新迁移指南

### 时间线

- **Week 1**: ESLint 规则设计和实现
- **Week 2**: Babel 插件验证实现
- **Week 3**: 测试和文档
- **Week 4**: 发布和推广

### 依赖项

- `@wsxjs/eslint-plugin-wsx`: ESLint 规则实现
- `@wsxjs/wsx-vite-plugin`: Babel 插件实现
- TypeScript: 类型检查支持
- Babel: AST 解析和转换

## 测试策略

### 单元测试

#### ESLint 规则测试

```typescript
describe("state-requires-initial-value", () => {
    test("应该报告缺少初始值的错误", () => {
        const code = `
            class MyComponent extends WebComponent {
                @state private count;
            }
        `;
        // 应该报告错误
    });
    
    test("不应该报告有初始值的属性", () => {
        const code = `
            class MyComponent extends WebComponent {
                @state private count = 0;
            }
        `;
        // 不应该报告错误
    });
});
```

#### Babel 插件测试

```typescript
describe("babel-plugin-wsx-state", () => {
    test("应该抛出缺少初始值的错误", () => {
        const code = `
            class MyComponent extends WebComponent {
                @state private count;
            }
        `;
        expect(() => transform(code)).toThrow();
    });
    
    test("应该正确处理有初始值的属性", () => {
        const code = `
            class MyComponent extends WebComponent {
                @state private count = 0;
            }
        `;
        expect(() => transform(code)).not.toThrow();
    });
});
```

### 集成测试

1. **Vite 构建测试**：
   - 测试缺少初始值时构建失败
   - 测试有初始值时构建成功

2. **ESLint 集成测试**：
   - 测试在真实项目中 ESLint 规则工作正常
   - 测试错误消息格式正确

### 端到端测试

1. **开发体验测试**：
   - 在编辑器中测试 ESLint 实时提示
   - 测试错误消息的可读性

2. **构建流程测试**：
   - 测试 Babel 插件在构建时正确验证
   - 测试错误消息包含文件位置和代码帧

## 文档计划

### 需要的文档

- [x] ESLint 规则文档（README.md）
- [x] Babel 插件错误消息文档
- [x] 使用示例和最佳实践
- [x] 常见问题解答

### 文档位置

- **ESLint 规则**: `packages/eslint-plugin/README.md`
- **使用指南**: `docs/LIGHT_COMPONENT_GUIDE.md` 和 `docs/QUICK_START.md`
- **错误处理**: `docs/rfcs/0012-babel-transform-error-handling.md`

## 向后兼容性

### 破坏性变更

这是一个**破坏性变更**，因为：

1. **之前允许**：`@state private count;`（没有初始值）
2. **现在要求**：`@state private count = 0;`（必须有初始值）

### 迁移策略

#### 自动迁移（推荐）

提供 ESLint 自动修复功能：

```bash
# 运行 ESLint 自动修复
npx eslint --fix src/**/*.ts src/**/*.tsx
```

**自动修复规则**：
- 如果类型是 `string`，添加 `= ""`
- 如果类型是 `number`，添加 `= 0`
- 如果类型是 `boolean`，添加 `= false`
- 如果类型是对象，添加 `= {}`
- 如果类型是数组，添加 `= []`
- 如果类型是可选的，添加 `= undefined`

#### 手动迁移

1. **识别问题**：运行 ESLint 或尝试构建
2. **查看错误消息**：错误消息会提供修复示例
3. **添加初始值**：根据属性类型添加合适的初始值

#### 迁移示例

```typescript
// 迁移前
class MyComponent extends WebComponent {
    @state private count: number;
    @state private name: string;
    @state private user: User;
    @state private items: Item[];
}

// 迁移后
class MyComponent extends WebComponent {
    @state private count: number = 0;
    @state private name: string = "";
    @state private user: User = { name: "", age: 0 };
    @state private items: Item[] = [];
}
```

### 废弃计划

不适用（这是新功能，不是废弃旧功能）

## 性能影响

### 构建时性能

**ESLint 规则**：
- 影响：最小（AST 遍历，O(n) 复杂度）
- 优化：使用 ESLint 缓存机制

**Babel 插件验证**：
- 影响：最小（AST 检查，已包含在 Babel transform 中）
- 优化：验证逻辑与转换逻辑合并，无额外开销

### 运行时性能

**无影响**：所有验证在编译时完成，运行时无额外检查

### 内存使用

**无影响**：验证不增加运行时内存使用

## 安全考虑

**无安全影响**：这是编译时验证，不涉及运行时安全

## 开发者体验

### 学习曲线

**低**：概念简单，容易理解

**学习资源**：
- ESLint 错误消息提供修复示例
- Babel 错误消息提供详细说明
- 文档提供完整示例

### 调试体验

**优秀**：
- ESLint 在编辑器中实时提示
- Babel 提供精确的错误位置（文件、行号、代码帧）
- 错误消息包含修复示例

### 错误处理

**错误消息设计**：

1. **清晰的问题描述**：明确指出缺少初始值
2. **修复示例**：提供多种类型的修复示例
3. **位置信息**：精确的文件位置和代码帧
4. **上下文说明**：解释为什么需要初始值

## 社区影响

### 生态系统

**正面影响**：
- 提高代码质量
- 减少运行时错误
- 改善开发者体验

### 第三方集成

**兼容性**：
- 与所有支持 ESLint 的编辑器兼容
- 与所有支持 Babel 的构建工具兼容
- 不影响现有代码（通过迁移）

## 先例

### 业界实践

1. **TypeScript 严格模式**：
   - 要求明确的类型和初始值
   - 编译时验证，运行时无开销

2. **React Hooks 规则**：
   - ESLint 规则确保 Hooks 正确使用
   - 编译时验证，防止运行时错误

3. **Vue 3 Composition API**：
   - `ref()` 和 `reactive()` 需要初始值
   - TypeScript 类型系统确保类型安全

### 学习借鉴

- **ESLint 规则设计**：参考 React Hooks 规则的错误消息格式
- **Babel 插件验证**：参考 TypeScript 编译器的错误报告方式
- **错误消息**：参考 Rust 编译器的详细错误消息

## 附录

### 参考资料

- [ESLint Rule Development Guide](https://eslint.org/docs/latest/developer-guide/working-with-rules)
- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
- [TypeScript Decorators Proposal](https://github.com/tc39/proposal-decorators)
- [RFC-0012: Babel Transform 错误处理策略](./0012-babel-transform-error-handling.md)

### 讨论记录

**决策1：是否允许显式 `undefined`？**

- **选项A**：不允许，必须提供实际值
- **选项B**：允许，但需要显式声明（当前选择）

**决定**：选择选项B，因为：
- 支持可选类型的使用场景
- 显式声明更清晰
- 与 TypeScript 可选类型兼容

**决策2：错误级别**

- **选项A**：`warning`（警告）
- **选项B**：`error`（错误，当前选择）

**决定**：选择选项B，因为：
- 缺少初始值会导致构建失败
- 应该作为错误处理，而不是警告
- 强制开发者修复问题

**决策3：自动修复策略**

- **选项A**：不提供自动修复
- **选项B**：提供自动修复（当前选择）

**决定**：选择选项B，因为：
- 减少迁移成本
- 提高开发者体验
- 大多数情况可以自动推断初始值

---

*这个 RFC 确保了 `@state` 装饰器的正确使用，提供了编译时和开发时的双重验证，符合 WSX 框架的类型安全和开发者体验理念。*

