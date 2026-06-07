# RFC: ESLint 规则增强

- **RFC编号**: 0010
- **开始日期**: 2025-01-21
- **RFC PR**: [待提交]
- **WSX Issue**: [待创建]
- **状态**: Draft

## 摘要

扩展 `@wsxjs/eslint-plugin-wsx` 插件，添加更多针对 WSX 框架特性的 ESLint 规则，提升代码质量、确保框架最佳实践，并帮助开发者避免常见错误。

## 动机

### 为什么需要这个功能？

当前 ESLint 插件只有 3 个规则：
1. `render-method-required` - 确保实现 render() 方法
2. `no-react-imports` - 禁止 React 导入
3. `web-component-naming` - Web Component 命名规范

这些规则覆盖了基础需求，但 WSX 框架还有很多特性需要额外的规则来确保正确使用：
- 原生优先的属性命名（`class` vs `className`）
- 组件自动注册要求
- 响应式状态使用规范
- 生命周期钩子一致性
- render 方法纯净性

### 当前状况

```typescript
// 当前没有规则检查这些问题：

// ❌ 使用 className 而不是 class（不符合原生优先理念）
<div className="container">Content</div>

// ❌ 忘记使用 @autoRegister 装饰器
export class MyButton extends WebComponent {
  render() { return <button>Click</button>; }
}

// ❌ observedAttributes 和 onAttributeChanged 不一致
static get observedAttributes() {
  return ["disabled", "loading"]; // 定义了 loading
}
protected onAttributeChanged(name: string) {
  if (name === "disabled") { } // 只处理了 disabled，遗漏 loading
}

// ❌ 在 render 中直接操作 DOM
render() {
  const div = document.createElement("div");
  this.appendChild(div); // 不应该在 render 中操作 DOM
  return div;
}

// ❌ 直接修改属性值，可能不会触发重渲染
private count = 0;
increment() {
  this.count++; // 应该使用 reactive() 或 @state
}
```

### 目标用户

- WSX 框架的所有开发者
- 从 React 迁移到 WSX 的开发者（需要规则帮助适应原生优先理念）
- 团队协作项目（需要统一的代码规范）
- 组件库维护者（需要确保组件质量）

## 详细设计

### 核心概念

新增 8 个 ESLint 规则，分为三个优先级：

**高优先级规则**（立即实现）：
1. `prefer-class-over-classname` - 建议使用原生 `class` 属性
2. `require-auto-register` - 要求使用 `@autoRegister` 装饰器

**中优先级规则**（后续实现）：
3. `observed-attributes-consistency` - 检查属性观察一致性
4. `no-direct-dom-manipulation-in-render` - 禁止在 render 中操作 DOM
5. `reactive-state-usage` - 检查响应式状态使用

**低优先级规则**（可选）：
6. `lifecycle-hook-naming` - 确保生命周期钩子命名正确
7. `component-base-class` - 确保组件继承正确基类
8. `no-inline-styles-in-jsx` - 建议使用 styles 配置（需谨慎）

### API设计

```typescript
// 规则配置示例
{
  "rules": {
    // 高优先级规则
    "wsx/prefer-class-over-classname": "warn", // 或 "error"
    "wsx/require-auto-register": "error",
    
    // 中优先级规则
    "wsx/observed-attributes-consistency": "warn",
    "wsx/no-direct-dom-manipulation-in-render": "error",
    "wsx/reactive-state-usage": "warn",
    
    // 低优先级规则
    "wsx/lifecycle-hook-naming": "warn",
    "wsx/component-base-class": "error",
    "wsx/no-inline-styles-in-jsx": "off" // 默认关闭，可选启用
  }
}
```

### 实现细节

#### 1. prefer-class-over-classname

**规则类型**: `suggestion`  
**可自动修复**: 是

```typescript
// packages/eslint-plugin/src/rules/prefer-class-over-classname.ts
export const preferClassOverClassName: WSXRuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "prefer native 'class' attribute over 'className'",
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferClass: "Use native 'class' attribute instead of 'className'",
    },
    schema: [
      {
        type: "object",
        properties: {
          severity: {
            enum: ["warn", "error"],
            default: "warn",
          },
        },
      },
    ],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === "className") {
          context.report({
            node,
            messageId: "preferClass",
            fix(fixer) {
              return fixer.replaceText(node.name, "class");
            },
          });
        }
      },
    };
  },
};
```

**测试用例**：
```typescript
// ❌ Invalid
<div className="container">Content</div>

// ✅ Valid
<div class="container">Content</div>
```

#### 2. require-auto-register

**规则类型**: `problem`  
**可自动修复**: 否

```typescript
// packages/eslint-plugin/src/rules/require-auto-register.ts
export const requireAutoRegister: WSXRuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "require @autoRegister decorator for WSX components",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      missingAutoRegister:
        "WSX component '{{componentName}}' must use @autoRegister decorator",
    },
    schema: [],
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        // 检查是否继承自 WebComponent 或 LightComponent
        const isWSXComponent =
          node.superClass &&
          node.superClass.type === "Identifier" &&
          (node.superClass.name === "WebComponent" ||
            node.superClass.name === "LightComponent");

        if (!isWSXComponent) return;

        // 检查是否有 @autoRegister 装饰器
        const hasAutoRegister = node.decorators?.some(
          (decorator: any) =>
            decorator.expression.type === "CallExpression" &&
            decorator.expression.callee.type === "Identifier" &&
            decorator.expression.callee.name === "autoRegister"
        );

        if (!hasAutoRegister) {
          const componentName = node.id?.name || "Unknown";
          context.report({
            node,
            messageId: "missingAutoRegister",
            data: { componentName },
          });
        }
      },
    };
  },
};
```

**测试用例**：
```typescript
// ❌ Invalid
export class MyButton extends WebComponent {
  render() { return <button>Click</button>; }
}

// ✅ Valid
@autoRegister({ tagName: "my-button" })
export class MyButton extends WebComponent {
  render() { return <button>Click</button>; }
}
```

#### 3. observed-attributes-consistency

**规则类型**: `suggestion`  
**可自动修复**: 否

检查 `observedAttributes` 中定义的属性是否在 `onAttributeChanged` 中有对应的处理。

```typescript
// packages/eslint-plugin/src/rules/observed-attributes-consistency.ts
export const observedAttributesConsistency: WSXRuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "ensure observedAttributes are handled in onAttributeChanged",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      unhandledAttribute:
        "Attribute '{{attribute}}' is observed but not handled in onAttributeChanged",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowUnhandled: {
            type: "boolean",
            default: false,
            description: "Allow attributes that don't need special handling",
          },
        },
      },
    ],
  },
  create(context) {
    // 解析 observedAttributes 和 onAttributeChanged
    // 比较两者，报告未处理的属性
    // ...
  },
};
```

#### 4. no-direct-dom-manipulation-in-render

**规则类型**: `problem`  
**可自动修复**: 否

禁止在 `render()` 方法中直接操作 DOM。

```typescript
// packages/eslint-plugin/src/rules/no-direct-dom-manipulation-in-render.ts
export const noDirectDOMManipulationInRender: WSXRuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow direct DOM manipulation in render method",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      noDOMInRender:
        "Do not manipulate DOM directly in render(). Return JSX elements instead.",
    },
    schema: [],
  },
  create(context) {
    return {
      MethodDefinition(node: any) {
        if (node.key.name !== "render") return;

        // 检查方法体中是否有 DOM 操作
        const body = node.value.body;
        // 检测 appendChild, removeChild, insertBefore, innerHTML =, querySelector 等
        // ...
      },
    };
  },
};
```

#### 5. reactive-state-usage

**规则类型**: `suggestion`  
**可自动修复**: 否

检查响应式状态的使用是否正确。

```typescript
// packages/eslint-plugin/src/rules/reactive-state-usage.ts
export const reactiveStateUsage: WSXRuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "ensure reactive state is used correctly",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      directPropertyAssignment:
        "Direct property assignment may not trigger rerender. Use reactive(), useState(), or @state decorator.",
    },
    schema: [],
  },
  create(context) {
    // 检测在组件类中直接修改属性值
    // 检查是否使用了 reactive(), useState(), 或 @state
    // ...
  },
};
```

### 示例用法

```typescript
// .eslintrc.json 或 eslint.config.js
{
  "extends": ["plugin:wsx/recommended"],
  "rules": {
    // 高优先级规则
    "wsx/prefer-class-over-classname": "warn",
    "wsx/require-auto-register": "error",
    
    // 中优先级规则
    "wsx/observed-attributes-consistency": "warn",
    "wsx/no-direct-dom-manipulation-in-render": "error",
    "wsx/reactive-state-usage": "warn"
  }
}
```

```tsx
// 使用规则后的代码示例

// ✅ 正确：使用 class 而不是 className
@autoRegister({ tagName: "my-button" })
export class MyButton extends WebComponent {
  @state private count = 0; // ✅ 使用 @state 装饰器
  
  static get observedAttributes() {
    return ["disabled", "loading"];
  }
  
  render() {
    // ✅ 只返回 JSX，不操作 DOM
    return (
      <button class="btn" disabled={this.disabled}>
        Count: {this.count}
      </button>
    );
  }
  
  protected onAttributeChanged(name: string) {
    // ✅ 处理所有 observedAttributes 中定义的属性
    switch (name) {
      case "disabled":
        // 处理 disabled
        break;
      case "loading":
        // 处理 loading
        break;
    }
  }
  
  private increment = () => {
    // ✅ 使用 @state 装饰的属性，自动触发重渲染
    this.count++;
  };
}
```

## 与WSX理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：规则确保正确使用 JSX 语法和原生属性
- [x] **信任浏览器**：`prefer-class-over-classname` 强调使用原生 HTML 属性
- [x] **零运行时**：ESLint 规则只在开发时运行，不影响生产代码
- [x] **Web标准**：规则基于 Web Components 标准和原生 Web API

### 理念契合说明

这些规则完全服务于 WSX 的核心理念：

1. **原生优先**：`prefer-class-over-classname` 确保使用原生 HTML 属性
2. **框架一致性**：`require-auto-register` 确保组件正确注册
3. **代码质量**：所有规则帮助开发者编写更可靠、更易维护的代码
4. **开发体验**：自动修复和清晰的错误信息提升开发效率

## 权衡取舍

### 优势

- **提升代码质量**：自动检测常见错误和反模式
- **统一代码风格**：确保团队代码一致性
- **减少运行时错误**：在开发阶段捕获问题
- **自动修复**：部分规则支持自动修复，提升效率
- **渐进式采用**：规则可以逐步启用，不强制一次性采用

### 劣势

- **增加维护成本**：需要维护更多规则和测试
- **学习曲线**：开发者需要了解新规则
- **可能的误报**：某些规则可能在某些场景下产生误报
- **配置复杂度**：规则配置可能变得复杂

### 替代方案

1. **只实现高优先级规则**：减少工作量，但功能不完整
2. **使用 TypeScript 类型检查**：某些规则可以通过类型系统实现，但 ESLint 规则更灵活
3. **文档和指南**：只提供文档而不提供自动检查，但效果较差

选择实现完整规则集，但分阶段实施，平衡功能和复杂度。

## 未解决问题

1. `no-inline-styles-in-jsx` 规则是否应该默认启用？（某些场景下内联样式是必要的）
2. `reactive-state-usage` 规则如何准确检测响应式状态的使用？
3. 是否需要提供规则配置预设（如 `strict`、`recommended`）？
4. 如何处理大型代码库的迁移？（可能需要提供迁移工具）

## 实现计划

### 阶段规划

1. **阶段1（高优先级）**: 实现 `prefer-class-over-classname` 和 `require-auto-register`
   - 实现规则逻辑
   - 编写完整测试用例
   - 更新推荐配置
   - 文档和示例

2. **阶段2（中优先级）**: 实现 `observed-attributes-consistency`、`no-direct-dom-manipulation-in-render`、`reactive-state-usage`
   - 实现规则逻辑（可能需要更复杂的 AST 分析）
   - 编写测试用例
   - 处理边界情况
   - 文档更新

3. **阶段3（低优先级）**: 实现剩余规则（如果社区需要）
   - 根据社区反馈决定是否实现
   - 实现和测试
   - 文档更新

### 时间线

- **Week 1-2**: 阶段1实现和测试
- **Week 3-4**: 阶段2实现和测试
- **Week 5**: 文档完善和社区反馈收集
- **Week 6**: 发布和推广

### 依赖项

- 现有 ESLint 插件基础设施
- ESLint RuleTester 用于测试
- TypeScript AST 类型定义
- 现有规则作为参考实现

## 测试策略

### 单元测试

每个规则都需要完整的测试覆盖：

```typescript
// packages/eslint-plugin/__tests__/rules/prefer-class-over-classname.test.ts
import { RuleTester } from "eslint";
import { preferClassOverClassName } from "../../src/rules/prefer-class-over-classname";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run("prefer-class-over-classname", preferClassOverClassName, {
  valid: [
    '<div class="container">Content</div>',
    '<button class="btn btn-primary">Click</button>',
  ],
  invalid: [
    {
      code: '<div className="container">Content</div>',
      errors: [
        {
          messageId: "preferClass",
        },
      ],
      output: '<div class="container">Content</div>',
    },
  ],
});
```

### 集成测试

- 在 examples 包中测试规则
- 验证规则与现有配置的兼容性
- 测试自动修复功能

### 端到端测试

- 在真实项目中验证规则效果
- 收集开发者反馈
- 调整规则严格程度

## 文档计划

### 需要的文档

- [x] 规则文档（每个规则的详细说明）
- [x] 配置指南
- [x] 迁移指南（从 React 迁移）
- [x] 示例代码
- [x] 最佳实践

### 文档位置

- `packages/eslint-plugin/README.md` - 插件主文档
- `docs/ESLINT_RULES.md` - 规则详细文档（新建）
- 每个规则的 JSDoc 注释

## 向后兼容性

### 破坏性变更

无破坏性变更。新规则默认关闭，需要显式启用。

### 迁移策略

1. 更新推荐配置，包含新规则（默认 `warn`）
2. 提供迁移工具（可选）帮助修复代码
3. 提供详细的迁移文档

### 废弃计划

不废弃任何现有功能。

## 性能影响

### 构建时性能

- ESLint 规则执行可能略微增加 lint 时间
- 通过优化 AST 遍历减少影响
- 提供缓存机制（ESLint 内置支持）

### 运行时性能

无影响。ESLint 规则只在开发时运行。

### 内存使用

- 规则实现需要内存存储 AST 信息
- 影响可忽略不计

## 安全考虑

无安全影响。ESLint 规则只进行代码分析，不执行代码。

## 开发者体验

### 学习曲线

低到中等：
- 规则设计直观，错误信息清晰
- 提供自动修复减少手动工作
- 文档和示例帮助快速上手

### 调试体验

- 清晰的错误消息，包含修复建议
- 自动修复功能减少手动修改
- IDE 集成显示实时错误

### 错误处理

- 提供详细的错误上下文
- 建议修复方案
- 链接到相关文档

## 社区影响

### 生态系统

- 提升 WSX 框架的专业度
- 帮助开发者编写更高质量的代码
- 减少常见错误，提升开发效率

### 第三方集成

- 与现有 ESLint 配置兼容
- 支持与 Prettier、TypeScript 等工具集成
- 可以集成到 CI/CD 流程

## 先例

### 业界实践

- **React ESLint Plugin**: `react/jsx-uses-react`, `react/prop-types` 等规则
- **Vue ESLint Plugin**: `vue/require-v-for-key`, `vue/no-unused-components` 等规则
- **Angular ESLint**: `@angular-eslint/component-class-suffix` 等规则

### 学习借鉴

借鉴成熟框架的 ESLint 规则设计，但适配 WSX 的原生优先理念和 Web Components 特性。

## 附录

### 参考资料

- [ESLint Rule Development Guide](https://eslint.org/docs/latest/contribute/rule-development-guide)
- [TypeScript ESLint Parser](https://github.com/typescript-eslint/typescript-eslint)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [Vue ESLint Plugin](https://eslint.vuejs.org/)

### 讨论记录

[待补充社区讨论记录]

---

*这个RFC为WSX框架提供了完整的ESLint规则增强，提升代码质量和开发体验。*

