# RFC 0009: SCSS/SASS Preprocessing Support

- **RFC编号**: 0009
- **开始日期**: 2025-12-10
- **状态**: Draft (Future Enhancement)
- **关联**: Extracted from RFC 0008

## 摘要

为 WSX 组件添加 SCSS/SASS 预处理支持，允许开发者使用 `.scss` 或 `.sass` 文件而非纯 CSS。这将自动编译 SCSS/SASS 到 CSS 并注入到组件中。

## 动机

### 为什么需要这个功能？

虽然 RFC 0008 实现了自动 CSS 注入（`A.wsx` → `A.css`），但许多开发者习惯使用 SCSS/SASS 来获得：
- 嵌套语法
- 变量和 mixin
- 函数和运算
- 模块化导入

### 当前状况

目前，WSX 组件只支持纯 CSS 文件自动注入。如果开发者想使用 SCSS：
1. 必须手动配置 Vite 的 CSS 预处理
2. 手动导入编译后的 CSS
3. 无法享受自动注入的便利

## 详细设计

### 核心概念

扩展 RFC 0008 的自动样式注入机制，支持以下文件匹配：
- `A.wsx` → `A.css` (当前支持)
- `A.wsx` → `A.scss` (新增)
- `A.wsx` → `A.sass` (新增)

### 优先级规则

如果同时存在多个样式文件，按以下优先级选择：
1. `A.scss` (最高优先级 - 推荐)
2. `A.sass`
3. `A.css` (最低优先级 - 后备)

### 实现策略

**方案 1: Vite 内置支持**（推荐）
- Vite 已经内置 SCSS/SASS 支持
- 只需在样式注入时检测 `.scss`/`.sass` 文件
- Vite 会自动编译为 CSS

```typescript
// In babel-plugin-wsx-style.ts
const styleExtensions = ['.scss', '.sass', '.css'];
for (const ext of styleExtensions) {
    const stylePath = id.replace(/\.wsx$/, ext);
    if (await fileExists(stylePath)) {
        // Inject: import styles from "./A.scss?inline";
        break; // Use first match
    }
}
```

**方案 2: 独立预处理器**（备选）
- 使用 `sass` 或 `node-sass` 直接编译
- 更多控制，但增加复杂度

## 与 WSX 理念的契合度

### 符合核心原则

- [x] **JSX语法糖**：增强开发体验，不改变 JSX 语法
- [x] **信任浏览器**：编译时转换，运行时仍是标准 CSS
- [x] **零运行时**：SCSS/SASS 在构建时编译，无运行时开销
- [x] **Web标准**：最终产物仍是标准 CSS

## 权衡取舍

### 优势

- ✅ 开发者体验提升（变量、嵌套、mixin 等）
- ✅ 代码可维护性增强
- ✅ 利用 Vite 已有的 SCSS 支持，实现简单
- ✅ 向后兼容（不影响现有 `.css` 文件）

### 劣势

- ⚠️ 增加构建时依赖（`sass` 包）
- ⚠️ 构建时间可能稍微增加
- ⚠️ 需要开发者熟悉 SCSS/SASS 语法

### 替代方案

1. **不支持 SCSS/SASS**：保持简单，只支持 CSS
   - 拒绝原因：限制了开发者的选择

2. **支持 PostCSS 插件**：更灵活的 CSS 处理
   - 拒绝原因：增加配置复杂度，与自动注入理念不符

## 未解决问题

1. **多个样式文件的优先级**：如果 `A.css` 和 `A.scss` 同时存在？
   - 建议：优先使用 `.scss`

2. **SCSS 依赖安装提示**：如果项目未安装 `sass` 包怎么办？
   - 建议：友好的错误提示，引导安装

3. **Source maps**：是否需要生成 SCSS source maps？
   - 建议：开发环境生成，生产环境不生成

## 实现计划

### 阶段规划

**阶段 0: 前提条件**
- RFC 0008 必须先实现并稳定
- 确保基础的 CSS 自动注入机制工作正常

**阶段 1: 基础支持（1-2 天）**
1. 扩展文件检测逻辑（`.scss`, `.sass`）
2. 添加优先级选择机制
3. 更新 Babel 插件以支持多种扩展名

**阶段 2: 测试和文档（1 天）**
1. 编写单元测试
2. 编写集成测试
3. 更新文档和示例

**阶段 3: 优化和错误处理（1 天）**
1. 友好的错误提示（缺少 `sass` 依赖）
2. Source map 支持
3. 性能优化

### 依赖项

- Vite 的 SCSS/SASS 支持（已内置）
- 用户项目需要安装 `sass` 包（按需依赖）

## 测试策略

### 单元测试

- 文件检测逻辑（优先级规则）
- Babel 插件转换（`.scss`/`.sass` import）

### 集成测试

- 实际 `.scss` 文件编译和注入
- 嵌套语法、变量等 SCSS 特性

### 端到端测试

- 完整的组件渲染（使用 SCSS 样式）

## 文档计划

### 需要的文档

- [x] API 文档更新（支持的文件扩展名）
- [x] 使用指南（如何使用 SCSS/SASS）
- [x] 迁移指南（从 CSS 到 SCSS）
- [x] 示例代码
- [x] 最佳实践

## 向后兼容性

### 破坏性变更

**无破坏性变更**：
- 现有 `.css` 文件继续工作
- 新功能是可选的

## 性能影响

### 构建时性能

- SCSS/SASS 编译会增加构建时间（取决于文件大小和复杂度）
- 影响预计：每个文件增加 10-50ms

### 运行时性能

- **零影响**：SCSS/SASS 在构建时编译为 CSS，运行时无差异

## 安全考虑

- SCSS/SASS 编译在构建时进行，无运行时安全风险
- 需确保 `sass` 包版本安全（定期更新）

## 开发者体验

### 学习曲线

- 对熟悉 SCSS/SASS 的开发者：无学习成本
- 对新手：可选功能，不影响使用纯 CSS

### 错误处理

```typescript
// 友好的错误提示
if (usingSCSS && !sassInstalled) {
    throw new Error(
        `SCSS file detected but 'sass' package is not installed.\n` +
        `Please run: npm install -D sass`
    );
}
```

## 先例

### 业界实践

- **Vue**: 支持 `<style lang="scss">`
- **React (Vite)**: 支持 `.scss` 文件自动编译
- **Svelte**: 支持 `<style lang="scss">`

## 附录

### 参考资料

- [Vite SCSS/SASS Support](https://vitejs.dev/guide/features.html#css-pre-processors)
- [Sass Documentation](https://sass-lang.com/documentation)
- RFC 0008: Auto Style Injection

### 实现检查清单

- [ ] 扩展 `babel-plugin-wsx-style` 以检测 `.scss`/`.sass`
- [ ] 实现文件优先级选择逻辑
- [ ] 添加 `sass` 包依赖检测和友好错误提示
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新文档
- [ ] 创建示例组件

---

**状态**: 本 RFC 目前处于 Draft 状态，等待 RFC 0008 实现并稳定后再启动。
