# RFC-0039: 强制生命周期方法调用 super 的 ESLint 规则

- **RFC编号**: 0039
- **开始日期**: 2025-12-26
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

添加 ESLint 规则强制要求组件在重写生命周期方法（`onConnected`, `onDisconnected`, `onAttributeChanged`, `onRendered`）时必须调用对应的 `super` 方法，防止因遗漏 super 调用导致的初始化失败和功能异常。

## 动机

### 问题描述

在 LanguageSwitcher 组件中发现了一个关键 bug：组件重写了 `onConnected()` 方法但没有调用 `super.onConnected()`，导致：

1. **父类/Mixin 初始化逻辑被跳过**：
   - 如果使用了 i18next 装饰器或其他 Mixin，它们在 `onConnected()` 中的初始化逻辑不会执行
   - 父类的事件监听器、状态初始化等逻辑被跳过

2. **组件行为异常**：
   - LanguageSwitcher 语言切换功能失效
   - 初始语言显示错误（显示英文而非保存的语言）
   - 需要点击两次下拉框才能正常工作

3. **难以发现的 Bug**：
   - TypeScript 编译器不会警告缺少 super 调用
   - 运行时没有明显的错误提示
   - 只在特定场景下才会暴露问题

### 问题场景

**场景 1：LanguageSwitcher Bug**

```typescript
// ❌ 错误：缺少 super.onConnected()
@autoRegister({ tagName: "language-switcher" })
export default class LanguageSwitcher extends WebComponent {
    protected onConnected(): void {
        // 缺少: super.onConnected();

        const savedLanguage = localStorage.getItem("wsx-language");
        const i18nLanguage = i18nInstance.language || "en";
        const baseLanguage = (savedLanguage || i18nLanguage).split("-")[0];

        if (baseLanguage !== this.currentLanguage) {
            this.currentLanguage = baseLanguage;
            if (savedLanguage && savedLanguage !== i18nLanguage) {
                i18nInstance.changeLanguage(savedLanguage);
            }
        }

        i18nInstance.on("languageChanged", this.handleLanguageChanged);
    }
}
```

**结果**：
- 如果父类或 Mixin 有初始化逻辑，完全被跳过
- 语言切换功能异常，需要多次点击才能生效

**场景 2：使用 Mixin 时**

```typescript
// 假设有一个 i18n Mixin
class I18nMixin {
    protected onConnected(): void {
        // 初始化 i18n 监听器
        this.setupI18nListeners();
    }
}

// ❌ 错误：子类重写但未调用 super
class MyComponent extends I18nMixin {
    protected onConnected(): void {
        // 缺少: super.onConnected();
        this.doMyStuff();
    }
    // 结果：setupI18nListeners() 永远不会被调用
}
```

### 当前状况

- **没有编译时检查**：TypeScript 不强制要求调用 super
- **没有运行时检查**：框架不检测是否调用了 super
- **依赖开发者记忆**：完全依靠开发者记住要调用 super
- **文档不足**：缺少明确的最佳实践指南

### 目标用户

所有 WSXJS 组件开发者，特别是：
- 使用装饰器或 Mixin 的开发者
- 重写生命周期方法的开发者
- 团队协作项目中的新手开发者

## 详细设计

### 核心概念

创建 ESLint 规则 `require-super-lifecycle` 检测生命周期方法重写时是否调用了 `super`：

1. **检测目标方法**：
   - `onConnected()`
   - `onDisconnected()`
   - `onAttributeChanged()`
   - `onRendered()`

2. **检测逻辑**：
   - 检测方法是否重写了父类方法
   - 检查方法体中是否包含对应的 `super.methodName()` 调用
   - 忽略空方法或明确注释说明不需要 super 的情况

### ESLint 规则设计

```typescript
// packages/eslint-plugin/src/rules/require-super-lifecycle.ts
import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'missingSuperCall';
type Options = [];

const LIFECYCLE_METHODS = [
    'onConnected',
    'onDisconnected',
    'onAttributeChanged',
    'onRendered'
] as const;

export default ESLintUtils.RuleCreator(
    name => `https://wsxjs.dev/docs/eslint/${name}`
)<Options, MessageIds>({
    name: 'require-super-lifecycle',
    meta: {
        type: 'problem',
        docs: {
            description: 'Require super calls in lifecycle methods',
            recommended: 'error',
        },
        messages: {
            missingSuperCall:
                'Lifecycle method "{{method}}" must call super.{{method}}()',
        },
        schema: [],
    },
    defaultOptions: [],

    create(context) {
        return {
            MethodDefinition(node: TSESTree.MethodDefinition) {
                // 检查是否是生命周期方法
                const methodName = node.key.type === 'Identifier'
                    ? node.key.name
                    : null;

                if (!methodName || !LIFECYCLE_METHODS.includes(methodName as any)) {
                    return;
                }

                // 检查是否有修饰符（protected/private/public）
                if (!node.accessibility) {
                    return;
                }

                // 检查方法体
                const body = node.value.body;
                if (!body || body.type !== 'BlockStatement') {
                    return;
                }

                // 检查是否调用了 super
                const hasSuperCall = body.body.some(statement => {
                    if (statement.type !== 'ExpressionStatement') {
                        return false;
                    }

                    const expr = statement.expression;
                    if (expr.type !== 'CallExpression') {
                        return false;
                    }

                    const callee = expr.callee;
                    if (callee.type !== 'MemberExpression') {
                        return false;
                    }

                    const object = callee.object;
                    const property = callee.property;

                    return (
                        object.type === 'Super' &&
                        property.type === 'Identifier' &&
                        property.name === methodName
                    );
                });

                if (!hasSuperCall) {
                    context.report({
                        node: node.key,
                        messageId: 'missingSuperCall',
                        data: {
                            method: methodName,
                        },
                    });
                }
            },
        };
    },
});
```

### 示例用法

**✅ 正确用法**

```typescript
export class MyComponent extends WebComponent {
    protected onConnected(): void {
        super.onConnected(); // ✅ 调用 super

        // 组件自己的初始化逻辑
        this.setupEventListeners();
    }

    protected onDisconnected(): void {
        super.onDisconnected(); // ✅ 调用 super

        // 清理逻辑
        this.cleanup();
    }
}
```

**❌ 错误用法**

```typescript
export class MyComponent extends WebComponent {
    protected onConnected(): void {
        // ❌ ESLint 错误：缺少 super.onConnected()
        this.setupEventListeners();
    }

    protected onDisconnected(): void {
        // ❌ ESLint 错误：缺少 super.onDisconnected()
        this.cleanup();
    }
}
```

**特殊情况：使用注释禁用规则**

```typescript
export class MyComponent extends WebComponent {
    // eslint-disable-next-line @wsxjs/require-super-lifecycle
    protected onConnected(): void {
        // 明确知道不需要调用 super 的情况
        // （例如：父类没有实现此方法）
        this.doSomething();
    }
}
```

## 与 WSX 理念的契合度

### 符合核心原则

- [x] **开发体验优先**：通过 ESLint 规则提供即时反馈，减少 Bug
- [x] **最佳实践强制**：将最佳实践编码为可自动检查的规则
- [x] **类型安全补充**：弥补 TypeScript 类型系统的不足
- [x] **框架质量保证**：确保组件遵循正确的生命周期模式

### 理念契合说明

这个 ESLint 规则符合 WSX 的"开发者友好"理念：
- 在编写代码时立即发现问题，而不是等到运行时
- 强制执行最佳实践，减少团队内的代码审查负担
- 提供清晰的错误信息，帮助开发者快速定位和修复问题

## 权衡取舍

### 优势

1. **提前发现 Bug**：
   - 在编写代码时就能发现缺少 super 调用的问题
   - 避免运行时才暴露的难以调试的 Bug

2. **强制最佳实践**：
   - 不依赖开发者记忆
   - 新手也能写出正确的代码

3. **文档即代码**：
   - 规则本身就是一种文档
   - 清晰传达框架的要求

4. **团队协作**：
   - 统一代码风格
   - 减少代码审查时的争论

### 劣势

1. **可能的误报**：
   - 某些情况下确实不需要调用 super（极少见）
   - 需要使用 eslint-disable 注释

2. **学习成本**：
   - 新手需要理解为什么要调用 super
   - 需要完善文档说明

### 替代方案

**方案 1：框架运行时检查**

```typescript
protected onConnected(): void {
    // 框架自动检测是否调用了 super
    if (!this._superOnConnectedCalled) {
        throw new Error('Must call super.onConnected()');
    }
}
```

**缺点**：
- 只能在运行时发现问题
- 增加运行时开销
- 错误发现太晚

**方案 2：TypeScript 装饰器检查**

```typescript
@requireSuper
protected onConnected(): void {
    // ...
}
```

**缺点**：
- 需要额外的装饰器
- 仍然是运行时检查
- 代码更冗长

**结论**：ESLint 规则是最佳方案，在编译时检查，零运行时开销。

## 实现计划

### 阶段规划

1. ✅ **阶段 1**：实现 ESLint 规则
   - 创建规则文件
   - 实现检测逻辑
   - 添加单元测试

2. ✅ **阶段 2**：配置和集成
   - 更新 ESLint 配置
   - 添加到推荐规则集
   - 修复现有代码中的违规

3. **阶段 3**：文档和推广
   - 更新组件开发文档
   - 添加最佳实践指南
   - 发布变更日志

### 依赖项

- TypeScript ESLint Parser
- @typescript-eslint/utils
- 现有的 @wsxjs/wsx-eslint-plugin 包

## 测试策略

### 单元测试

```typescript
// packages/eslint-plugin/src/rules/__tests__/require-super-lifecycle.test.ts
import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../require-super-lifecycle';

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
});

ruleTester.run('require-super-lifecycle', rule, {
    valid: [
        {
            code: `
                class MyComponent extends WebComponent {
                    protected onConnected(): void {
                        super.onConnected();
                        this.doStuff();
                    }
                }
            `,
        },
        {
            code: `
                class MyComponent extends WebComponent {
                    // 不是生命周期方法，不检查
                    protected myMethod(): void {
                        this.doStuff();
                    }
                }
            `,
        },
    ],
    invalid: [
        {
            code: `
                class MyComponent extends WebComponent {
                    protected onConnected(): void {
                        this.doStuff();
                    }
                }
            `,
            errors: [
                {
                    messageId: 'missingSuperCall',
                    data: { method: 'onConnected' },
                },
            ],
        },
        {
            code: `
                class MyComponent extends WebComponent {
                    protected onDisconnected(): void {
                        this.cleanup();
                    }
                }
            `,
            errors: [
                {
                    messageId: 'missingSuperCall',
                    data: { method: 'onDisconnected' },
                },
            ],
        },
    ],
});
```

### 集成测试

- 在实际项目中测试规则
- 验证 VSCode ESLint 插件集成
- 确保 CI/CD 流程中正确运行

## 文档计划

### 需要的文档

- [x] ESLint 规则文档
- [x] 组件生命周期最佳实践
- [x] 迁移指南（修复现有代码）
- [ ] FAQ（常见问题解答）

### 文档位置

- `docs/guide/component-lifecycle.md` - 生命周期指南
- `docs/guide/eslint-rules.md` - ESLint 规则说明
- `packages/eslint-plugin/docs/rules/require-super-lifecycle.md` - 规则详细文档

## 向后兼容性

### 破坏性变更

**严格程度**：新增 ESLint 规则会导致现有代码出现 lint 错误

**影响范围**：
- 所有重写生命周期方法但未调用 super 的组件
- 估计影响 < 5% 的现有代码

### 迁移策略

1. **自动修复**（不推荐）：
   - ESLint 可以提供自动修复建议
   - 但需要人工验证是否真的需要 super 调用

2. **手动修复**（推荐）：
   - 逐个检查违规代码
   - 理解为什么需要 super 调用
   - 手动添加 `super.lifecycleMethod()` 调用

3. **临时禁用**（不推荐）：
   - 对于确实不需要 super 的情况
   - 使用 `eslint-disable-next-line` 注释

### 废弃计划

无废弃内容，这是新增功能。

## 性能影响

### 构建时性能

- **ESLint 规则检查**：每个组件 < 1ms
- **整体影响**：可忽略不计（< 0.1s 对于中型项目）

### 运行时性能

**零运行时影响**：ESLint 规则仅在开发时和 CI 中运行，不影响生产代码。

## 安全考虑

**安全提升**：
- 防止因缺少初始化导致的安全漏洞
- 例如：事件监听器未正确设置可能导致 XSS 漏洞

## 开发者体验

### 学习曲线

**极低**：
- 规则非常直观：重写方法就调用 super
- 错误信息清晰明确
- 符合面向对象编程的常规做法

### 调试体验

**改进**：
- 在编写代码时就发现问题
- VSCode 中有红色波浪线提示
- 鼠标悬停显示详细错误信息

### 错误处理

错误信息示例：
```
Lifecycle method "onConnected" must call super.onConnected()
  @wsxjs/require-super-lifecycle

More info: https://wsxjs.dev/docs/eslint/require-super-lifecycle
```

## 社区影响

### 生态系统

**积极影响**：
- 提高整体代码质量
- 减少新手犯错
- 促进最佳实践传播

### 第三方集成

**兼容性**：
- 与所有 ESLint 工具兼容
- 与 VSCode、WebStorm 等 IDE 集成良好
- 支持 Prettier 等格式化工具

## 先例

### 业界实践

1. **React ESLint Plugin**：
   - `react-hooks/exhaustive-deps` - 强制 useEffect 依赖
   - `react/require-render-return` - 强制 render 返回值

2. **Vue ESLint Plugin**：
   - `vue/require-valid-default-prop` - 强制 prop 默认值类型
   - `vue/component-api-style` - 强制 API 风格

3. **Angular ESLint**：
   - `@angular-eslint/no-lifecycle-call` - 防止手动调用生命周期

### 学习借鉴

借鉴 React 和 Vue 的经验：
- ESLint 规则是强制最佳实践的有效手段
- 清晰的错误信息和文档是关键
- 提供自动修复选项（如果可能）

## 附录

### 参考资料

- [ESLint 规则开发指南](https://eslint.org/docs/developer-guide/working-with-rules)
- [TypeScript ESLint 文档](https://typescript-eslint.io/)
- [Web Components 生命周期](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)

### 根本原因分析

**LanguageSwitcher Bug 的完整调用链**：

1. 用户打开页面
2. App 组件渲染，创建 `<language-switcher>` 元素
3. `language-switcher` 的 `connectedCallback()` 被调用
4. `connectedCallback()` 调用 `this.onConnected?.()`
5. LanguageSwitcher.onConnected() 执行，但**缺少 `super.onConnected()` 调用**
6. 如果父类/Mixin 有初始化逻辑，完全被跳过
7. 组件状态初始化不完整，导致语言切换功能异常

**教训**：
- 生命周期方法是组件初始化的关键路径
- 缺少 super 调用等同于跳过父类初始化
- 这类 Bug 很难发现，因为组件"看起来"能工作，只是在特定场景下出错

### 讨论记录

**2025-12-26**：
- 发现 LanguageSwitcher 缺少 `super.onConnected()` 导致的 Bug
- 决定添加 ESLint 规则防止类似问题
- 确定检查所有四个生命周期方法
- 实现并测试 ESLint 规则
- 修复现有代码中的违规情况

---

*此 RFC 记录了一个重要的代码质量改进，通过工具化最佳实践来防止常见错误。*
