---
title: Site to Base Components — Deep Review & Migration
status: Draft
author: WSXJS Team
created: 2026-01
---

# RFC 0063: Site to Base Components — Deep Review & Migration

## 1. Introduction

本 RFC 对 site 中所有区块/组件做**基于结构的深度审查**，识别可复用的 **base 组件**（或可被 base 替代的用法），并约定迁移前测试计划与迁移顺序。目标：减少重复、统一设计语言、为文档站与其它消费方提供可复用基座。

**本 RFC 中「base 组件」包含两类**：(1) **基元组件**：已在 `packages/base-components` 中实现的通用控件，如 **Button**、**Dropdown**、**Combobox**、**ThemeSwitcher**、**ResponsiveNav**、**SvgIcon**、**CodeBlock**、**ButtonGroup**、**ColorPicker**、**OverflowDetector**；(2) **由 site 抽成或组合而成的组件**：如 LanguageSwitcher、Card、Stat、EmptyState 等。审查时同时考虑「site 应在何处改用基元」与「哪些模式应抽成新 base 组件」。

## 2. Base Components 现状清单

当前 `packages/base-components/src/index.ts` **已导出**的基元组件与能力：

| 组件/能力 | 标签名 | 用途 |
|----------|--------|------|
| Button | `wsx-button` | 通用按钮（variant: primary / danger / flat / dashed / text；支持 icon、loading） |
| ButtonGroup | `wsx-button-group` | 按钮组布局 |
| Dropdown | `wsx-dropdown` | 下拉选项（options、selectedValue、change 事件） |
| Combobox | `wsx-combobox` | 组合框（可搜索选择） |
| ColorPicker | `wsx-color-picker` | 颜色选择 |
| ThemeSwitcher | `wsx-theme-switcher` | 主题切换 |
| ResponsiveNav | `wsx-responsive-nav` | 响应式主导航（含 overflow / 移动端菜单） |
| SvgIcon | `wsx-svg-icon` | 图标 |
| CodeBlock | `wsx-code-block` | 代码块展示 |
| OverflowDetector | （无标签，工具类） | 溢出检测工具 |

**存在但未导出**：

- **LanguageSwitcher**（`LanguageSwitcher.wsx`）：与 site 内实现重复，site 版含 RFC-0042 的「语言切换立即 UI 更新」行为。

Site 当前对 base 的**实际使用**：仅 `wsx-responsive-nav`、`wsx-theme-switcher`、`wsx-svg-icon`、`wsx-code-block`。Site **未使用** `wsx-button`、`wsx-dropdown`、`wsx-combobox`，而是使用裸 `<button>`、`<select>` 或自定义「按钮 + 下拉面板」实现。

## 3. 深度审查：Site 组件的结构模式与 base 候选

以下按**结构模式**归纳 site 组件，并判断是否应成为或使用 base 组件。

### 3.0 基元 base 组件（Button、Dropdown 等）在 site 中的使用

基元组件（Button、Dropdown、Combobox）在 site 中**几乎未被使用**，大量为裸 `<button>`、`<select>` 或自定义下拉。建议在迁移/重构时优先考虑以下替换，以统一交互与样式。

| 基元 | Site 当前用法 | 建议替换位置 | 优先级 |
|------|----------------|-------------|--------|
| **wsx-button** | `<button class="btn-primary">` / `btn-secondary` / `btn-ghost` | **HomeSection**（Hero：Try Online、View GitHub）、**NotFoundSection**（Go Back）、**App**（footer 社交按钮）、**UseCaseSection**（锚点 nav 按钮） | 中：主站 CTA 统一为 wsx-button 可收敛样式与无障碍 |
| **wsx-button** | 示例页内 `<button class="btn btn-primary">` 等 | **TodoList / TodoListLight**、**ReactiveCounter**、**UserProfile**、**SvgDemo**、**SlotExamples** 等 | 低：示例可保留裸 button 以展示原生用法，或统一用 wsx-button 展示 base 用法 |
| **wsx-dropdown** / **wsx-combobox** | **LanguageSwitcher** 内自定义「按钮 + 下拉面板 + 选项」 | 若 base 的 Dropdown 支持「当前值展示 + 选项列表 + change」且可挂 i18n，可考虑 LanguageSwitcher **基于 wsx-dropdown** 实现，减少重复逻辑 | 中：与 LanguageSwitcher 迁入 base 一并评估 |
| **wsx-dropdown** / **wsx-combobox** | **UserProfile** 内原生 `<select>`（theme、language） | 替换为 wsx-dropdown 可与其他表单控件风格一致 | 低 |
| **wsx-dropdown** | **WsxCodeComponent**（EditorJS）内 `<select class="language-select">` | 替换为 wsx-dropdown 可复用 base 样式与键盘/无障碍 | 低 |

**小结**：基元 Button、Dropdown、Combobox 应在主站关键路径（Hero、404、导航、语言切换）上逐步采用；示例与工具页可后续按需替换。

### 3.1 重复实现 / 应使用 base

| 项目 | 说明 | 建议 |
|------|------|------|
| **LanguageSwitcher** | base 内有实现但未导出；site 有独立实现且含「立即 UI 更新」。**两版均手写了完整下拉逻辑（toggle、outside click、option list、aria），与 `wsx-dropdown` 90% 重叠。** | **重构为 wsx-dropdown 的薄封装**（详见 3.1.1）。 |
| **Hero / 404 等 CTA 按钮** | HomeSection、NotFoundSection 使用 `<button class="btn-*">` 与 `wsx-link`，未用 `wsx-button`。 | **可选**：若希望全站 CTA 统一为 base 的 Button，可逐步把 `btn-primary` / `btn-secondary` 替换为 `wsx-button`（见 3.0）；非本 RFC 强制范围。 |

#### 3.1.1 LanguageSwitcher 重构方案：基于 wsx-dropdown 组合

**问题分析**：当前 LanguageSwitcher（site 版 160 行，base 版 175 行）手动实现了完整的下拉交互逻辑：

| 能力 | wsx-dropdown 已有 | LanguageSwitcher 重复实现 |
|------|-------------------|--------------------------|
| 按钮 + 箭头切换 | `toggleDropdown` | `handleToggleDropdown` |
| 选项列表渲染 + selected 样式 | `options.map()` + `.selected` | `languages.map()` + `.active` |
| 外部点击关闭 | `attachOutsideClickHandler` | `handleOutsideClick` |
| aria-expanded / listbox / option | 完整支持 | 完整支持（重复） |
| 选中触发事件 | `CustomEvent("change")` | 直接调 `i18nInstance.changeLanguage` |
| 自定义选项渲染 | `option.render()` | 手写 `language-name` + `language-code` |

**方案**：

**Step 1 — wsx-dropdown 增强**：增加 `renderTrigger` 配置（或 `icon` attribute/配置），允许自定义触发按钮内容。当前按钮只渲染 `displayText + arrow`，但 LanguageSwitcher 需要 `🌐 + 语言名 + arrow`。

```typescript
// Dropdown.types.ts 新增
export interface DropdownConfig {
    // ...existing...
    /** 自定义触发按钮渲染 */
    renderTrigger?: (selectedOption: DropdownOption | undefined, isOpen: boolean) => HTMLElement;
    /** 触发按钮前缀图标 */
    icon?: string;
}
```

**Step 2 — LanguageSwitcher 重构为薄封装**：仅负责 i18n 逻辑，下拉交互完全委托给 `wsx-dropdown`。

```tsx
// 重构后 ~50 行（从 160 行缩减）
@autoRegister({ tagName: "wsx-language-switcher" })
export default class LanguageSwitcher extends WebComponent {
    @state private currentLanguage: string = "en";

    private languages: LanguageOption[] = [
        { code: "en", name: "English" },
        { code: "zh", name: "中文" },
        // ...
    ];

    protected onConnected(): void {
        super.onConnected?.();
        this.currentLanguage = i18nInstance.language;
        i18nInstance.off("languageChanged", this.onLangChanged);
        i18nInstance.on("languageChanged", this.onLangChanged);
    }

    protected onDisconnected(): void {
        super.onDisconnected?.();
        i18nInstance.off("languageChanged", this.onLangChanged);
    }

    private onLangChanged = (lng: string): void => {
        this.currentLanguage = lng.split("-")[0];
    };

    private handleChange = (e: CustomEvent): void => {
        const code = e.detail.value;
        this.currentLanguage = code;  // 同步先更新 UI
        requestAnimationFrame(() => i18nInstance.changeLanguage(code));
    };

    render(): HTMLElement {
        const options = this.languages.map(lang => ({
            value: lang.code,
            label: lang.name,
            render: () => (
                <span class="lang-option">
                    <span class="language-name">{lang.name}</span>
                    <span class="language-code">{lang.code.toUpperCase()}</span>
                </span>
            ),
        }));

        return (
            <wsx-dropdown
                icon="🌐"
                options={options}
                selectedValue={this.currentLanguage}
                onChange={this.handleChange}
            />
        );
    }
}
```

**收益**：
- LanguageSwitcher 从 ~160 行缩减到 ~50 行
- 下拉逻辑零重复（toggle、outside click、aria 全部复用 wsx-dropdown）
- wsx-dropdown 的 bug 修复和增强自动惠及 LanguageSwitcher
- 其他需要自定义触发按钮的 dropdown 场景也能受益于 `renderTrigger` / `icon` 增强

### 3.2 可抽成新 base 组件的 UI 通用模式

以下从 **UI 原语** 角度分析（非 domain-specific），识别出任何项目都会复用的通用 UI 模式。分为两层：**CSS-only 设计系统层**（无交互逻辑，纯布局/排版）和 **组件层**（有结构/交互逻辑）。

#### CSS-only 设计系统层

设计系统样式**不**以 site 的 `design-system/` 为定义源头；应遵循**标准品牌/组件设计**（RFC 0064）：组件/主题包用 **@layer** 提供默认值 → **preset** 覆盖 → **API** 覆盖。布局与按钮等令牌与 class 由 theme 包（`wsx-branding`）在默认层提供，site 通过 preset 或覆盖 API 定制。

##### 3.2.1 Section / Container / Typography — 最高优先级

纯布局和排版规范，**不应做成组件**。做成 CSS class 更简单、更灵活，不强制依赖 base-components。

- **数据**：`.container` + `.section-header` + `.section-title` + `.section-description` 在 15 个 CSS 文件中共 **71 处重复定义**。
- **方案**：由 **theme 包**在 `@layer theme-default`（或等价层）中提供 `.ds-container`、`.ds-section-header`、`.ds-section-title`、`.ds-section-description` 等；site 仅引用 theme 包并通过 preset/API 覆盖，不在 site 的 `design-system/` 下新增 layout 定义作为设计系统源头。

##### 3.2.2 Button 样式统一 — 最高优先级

- **数据**：`.btn-primary/.btn-secondary/.btn-ghost` 在 **14 个 CSS 文件中 131 处重复定义**。site 未使用已有的 `wsx-button`。
- **方案**：按钮令牌与默认样式由 **theme 包**在默认层提供；可选由 preset 提供 `.btn-primary` 等兼容 class。后续关键 CTA 逐步替换为 `wsx-button`。不在 site 的 `design-system/` 下新增 `buttons.css` 作为设计系统源头。

#### 组件层 — 通用 UI 原语

##### 3.2.3 Card — 高优先级（容器原语）

任何「带边框/阴影的内容容器」。site 中 `.feature-card`、`.ecosystem-card`、`.use-case-card`、`.comparison-item`、`.example-card`、`.core-feature-card` 本质上都是同一个 UI 原语 — 一个有 header/body/footer 三区的容器，区别只在内容和样式 variant。

```
┌─────────────────────┐
│  [header slot]       │  ← 可选：任意标题区内容
│─────────────────────│
│  [default slot]      │  ← 主内容区
│─────────────────────│
│  [footer slot]       │  ← 可选：操作区
└─────────────────────┘
```

- **出现位置**：FeaturesSection（3）、EcosystemSection（6）、ExamplesSection（8）、UseCaseSection（4）、ComparisonSection（3）、SlotExamples（4）、WebComponentExamples（2）、LightComponentExamples（2）。共计 **32 张卡片**跨 8 个组件。
- **Props**: `variant?` (`default` | `outlined` | `elevated`)、`clickable?`、`href?`
- **Slots**: `header`、default、`footer`
- **CSS Custom Properties**: `--card-padding`、`--card-radius`、`--card-shadow` 等，映射到 design tokens。
- **优先级**：**高**（复用面最广）。

##### 3.2.4 Badge — 高优先级（内联标记原语）

site 中到处出现的 `<span class="xxx-badge">`：`example-badge`、`core-feature-badge`、`use-case-badge`、`comparison-badge`。本质上都是同一个东西 — 一个内联小标签。

- **Props**: `variant?` (`default` | `success` | `warning` | `info`)、`size?` (`sm` | `md`)
- **Slot**: default（文本内容）
- **优先级**：**高**（极简但高频，可做组件或 CSS-only class `.ds-badge`）。

##### 3.2.5 List — 中优先级（列表原语）

带图标/标记前缀的列表项在 site 中大量重复，有两种变体：

**变体 A — IconList**（icon + text）：
```html
<li><span class="check-icon">✅</span><span>{text}</span></li>
```
出现位置：ComparisonSection（12 项）、UseCaseSection（32 项）、FeaturesSection（9 项）。

**变体 B — DescriptionList**（label: description）：
```html
<li><strong>{label}:</strong> {description}</li>
```
出现位置：WebComponentExamples、LightComponentExamples、SlotExamples（各 5-6 项）。

- **方案**：可做 CSS-only class（`.ds-icon-list`、`.ds-desc-list`），或轻量组件。
- **优先级**：**中**。

##### 3.2.6 Stat — 中优先级（数值展示原语）

任何「大数值 + 标签」的展示。dashboard、landing page、pricing page 都会用。

```
  📦           ← icon（可选）
 0 KB          ← value（大字号）
Runtime Size   ← label
No runtime...  ← description（可选）
```

- **出现位置**：StatsSection（3）、PerformanceMetrics（3）。
- **Props**: `icon?`、`value`、`label`、`description?`
- **优先级**：**中**（6 次使用，模式通用）。

##### 3.2.7 Steps — 中优先级（步骤/流程原语）

有序步骤列表，带数字标记。教程、onboarding、checkout flow 都会用。

```
① Install       ② Create       ③ Build
  description      description     description
```

- **出现位置**：QuickStartSection（3 步）。CSS 在 7 个文件中 28 处重复。
- **Props**: `items: { title, description }[]`、`direction?` (`horizontal` | `vertical`)
- **优先级**：**中**。

##### 3.2.8 EmptyState — 低优先级（空状态原语）

```
     🔍 / 404 / icon
    Page Not Found
   Description text
   [Action Button]
```

404、搜索无结果、空列表、权限不足 — 所有「没有内容」的场景。

- **出现位置**：当前仅 NotFoundSection（1 处）。
- **Props**: `icon?`、`title`、`description?`
- **Slot**: `action`（操作按钮区）
- **优先级**：**低**（模式通用但当前仅 1 处使用，按需再议）。

### 3.3 保持 site 专属、不迁入 base

| 组件/区块 | 说明 |
|----------|------|
| HomeSection, QuickStartSection | 页面级编排与 hero 内容，强绑定文案与路由。 |
| QuickStartCode | 内容编排，已使用 base 的 CodeBlock，本身非通用组件。 |
| PerformanceMetrics（文案与布局） | 指标文案与「WSX 性能」强绑定；仅「指标项」结构建议抽成 Stat/Metric（见上）。 |
| DocSection | 仅包装 wsx-doc-layout，站点文档用。 |
| TermsOfService, PrivacyPolicy | 法律页结构可复用性有限，内容与 i18n/站点强绑定，暂不抽。 |
| EditorJSDemo、MarkedBuilder、CalendarJSDemo、SlideJSDemo 等 | 集成示例与工具，非通用 base。 |
| TodoList、TodoListLight、ReactiveCounter、UserProfile、SlotCard、WsxLogo、SvgDemo、SimpleReactiveDemo 等 | 示例/演示组件，已不在 base 中。 |

## 4. 迁移范围与顺序建议

### 4.1 本期必做（Dropdown 增强 + LanguageSwitcher 重构）

**Phase 1 — wsx-dropdown 增强**：
1. 给 `DropdownConfig` 增加 `renderTrigger` 和 `icon` 配置。
2. `Dropdown.wsx` 的 render 方法中，若有 `renderTrigger` 则用自定义渲染替代默认按钮内容；若有 `icon` 则在 `dropdown-text` 前渲染 icon span。
3. 确保增强不破坏现有 Dropdown 用法（无 renderTrigger/icon 时行为不变）。
4. 补充 Dropdown 增强的单元测试。

**Phase 2 — LanguageSwitcher 重构为 wsx-dropdown 薄封装**（详见 3.1.1）：
1. 重写 base 的 `LanguageSwitcher.wsx`，内部组合使用 `wsx-dropdown`，仅保留 i18n 逻辑（~50 行）。
2. 保留 site 版的关键行为：同步先更新 UI + `requestAnimationFrame` 后 `changeLanguage`（RFC-0042）。
3. 在 base 的 `index.ts` 中导出 LanguageSwitcher。
4. 在 `packages/base-components/package.json` 的 `dependencies` 中声明 `@wsxjs/wsx-i18next`。

**Phase 3 — Site 迁移**：
1. Site 改为从 `@wsxjs/wsx-base-components` 使用 `wsx-language-switcher`。
2. 删除 site 内 `components/LanguageSwitcher.wsx` / `LanguageSwitcher.css`。
3. 通过下方 **Full Test Plan** 中与 LanguageSwitcher 相关的全部项。

### 4.2 第二期：Design System CSS 层

消除最大面积的 CSS 重复，**无需新 base 组件**，纯 CSS 工作：

1. `design-system/layout.css`：`.ds-container`、`.ds-section-header`、`.ds-section-title`、`.ds-section-description`。
2. `design-system/buttons.css`：`.btn-primary`、`.btn-secondary`、`.btn-ghost` 统一样式。
3. 逐个组件 CSS 删除重复定义，改为引用 design system classes。
4. **预期消除**：~70 处 section CSS 重复 + ~130 处 button CSS 重复。

### 4.3 第三期：通用 UI 原语组件

从 UI 原语角度分批扩展 base-components，所有命名和设计**不绑定 site 业务**，任何项目都可复用。

**批次 A（高优先级）**：
- **Card**（`wsx-card`）：通用容器原语，header/default/footer 三个 slot，variant 控制样式。替换 site 中 32 张卡片（8 个组件）。
- **Badge**（`wsx-badge` 或 CSS-only `.ds-badge`）：内联标记原语。替换 site 中所有 `xxx-badge`。

**批次 B（中优先级）**：
- **Stat**（`wsx-stat`）：数值展示原语。替换 StatsSection、PerformanceMetrics 的 6 个指标项。
- **Steps**（`wsx-steps`）：步骤/流程原语。替换 QuickStartSection 的步骤列表。
- **List** 变体（CSS-only `.ds-icon-list`、`.ds-desc-list`）：带图标/标记的列表样式。替换 ComparisonSection、info-section 等。

**批次 C（低优先级，按需）**：
- **EmptyState**（`wsx-empty-state`）：空状态原语。当前仅 1 处使用，按需再议。

## 5. Full Test Plan（迁移前必须通过）

执行任何「site 组件迁入 base」或「删除 site 内重复实现」前，必须满足以下全部项。

### 5.1 仓库级

- [ ] **T.1** `pnpm install` 无报错。
- [ ] **T.2** 全仓库 `pnpm run typecheck` 通过。
- [ ] **T.3** 全仓库 `pnpm run lint` 通过。
- [ ] **T.4** 全仓库 `pnpm run test` 通过（含 site 与 base-components）。

### 5.2 base-components 包

- [ ] **T.5** `pnpm --filter @wsxjs/wsx-base-components test` 通过。
- [ ] **T.6** `pnpm --filter @wsxjs/wsx-base-components build` 成功，产物可被 site 正常 import。

### 5.3 Dropdown 增强

- [ ] **T.7** `wsx-dropdown` 在不传 `renderTrigger` / `icon` 时行为与增强前完全一致（回归测试）。
- [ ] **T.8** `wsx-dropdown` 设置 `icon`（attribute 或 config）时，触发按钮显示 icon + displayText + arrow。
- [ ] **T.9** `wsx-dropdown` 设置 `renderTrigger`（config）时，触发按钮使用自定义渲染函数。
- [ ] **T.10** Dropdown 现有单元测试全部通过。

### 5.4 LanguageSwitcher 重构

- [ ] **T.11** 重构后的 LanguageSwitcher 内部使用 `wsx-dropdown`，不再手写下拉逻辑。
- [ ] **T.12** 手动或 E2E：导航栏切换语言后，整页文案与切换器显示语言**立即一致**（RFC-0042 行为），无闪烁或延迟。
- [ ] **T.13** Site 现有 LanguageSwitcher 相关测试在改用 base 版后**行为保持不变**。

### 5.5 Site 迁移

- [ ] **T.14** Site 在改 import、删除本地 LanguageSwitcher 后，`pnpm --filter @wsxjs/wsx-site build` 与 `pnpm --filter @wsxjs/wsx-site test` 通过。
- [ ] **T.15** 生产/预览构建下，语言切换器样式与交互与当前 site 一致。
- [ ] **T.16** base-components 的 `index.ts` 导出 LanguageSwitcher；site 仅通过 `@wsxjs/wsx-base-components` 使用 `wsx-language-switcher`。
- [ ] **T.17** 删除 site 内 `components/LanguageSwitcher.wsx`、`LanguageSwitcher.css` 及仅用于该组件的测试引用后，T.1–T.16 仍全部通过。

### 5.6 签收条件

- 所有 T.1–T.17 在目标分支上通过（或由 CI 保证），方可视为「Dropdown 增强 + LanguageSwitcher 迁移完成」。
- 若 T.12/T.13 失败：先对齐 base 的 LanguageSwitcher 与 site 当前行为（含立即 UI 更新与 i18n 事件），再重新跑 Full Test Plan。

## 6. 实施步骤（Implementation Steps）

以下为按顺序执行的可落地步骤；每步完成后跑相关测试再进入下一步。

---

### 第一期：Dropdown 增强 + LanguageSwitcher 迁移（本期必做）

#### Step 1 — Dropdown 类型与配置

| # | 动作 | 文件/位置 | 验收 |
|---|------|-----------|------|
| 1.1 | 在 `Dropdown.types.ts` 中为 `DropdownConfig` 增加可选字段：`icon?: string`、`renderTrigger?: (selectedOption: DropdownOption \| undefined, isOpen: boolean) => HTMLElement` | `packages/base-components/src/Dropdown.types.ts` | 类型导出无报错 |
| 1.2 | 确保现有 Dropdown 调用处不传 `icon`/`renderTrigger` 时类型仍合法 | 若有调用方则确认 | typecheck 通过 |

#### Step 2 — Dropdown 渲染逻辑

| # | 动作 | 文件/位置 | 验收 |
|---|------|-----------|------|
| 2.1 | 在 `Dropdown.wsx` 的 render 中：若存在 `config.renderTrigger`，用其返回值作为触发区内容；否则使用默认按钮 | `packages/base-components/src/Dropdown.wsx` | T.7、T.9 通过 |
| 2.2 | 在默认按钮分支：若存在 `config.icon`，在 `dropdown-text` 前渲染一 span 显示 icon | 同上 | T.8 通过 |
| 2.3 | 不传 `icon`/`renderTrigger` 时，行为与改动前完全一致 | 同上 | T.7、T.10 通过 |
| 2.4 | 为 `icon` 与 `renderTrigger` 增加单元测试 | `packages/base-components/src/__tests__/` 或现有 Dropdown 测试文件 | T.10 通过 |

#### Step 3 — base 依赖与 LanguageSwitcher 重写

| # | 动作 | 文件/位置 | 验收 |
|---|------|-----------|------|
| 3.1 | 在 `packages/base-components/package.json` 的 `dependencies` 中增加 `"@wsxjs/wsx-i18next": "workspace:*"` | `packages/base-components/package.json` | `pnpm install` 无报错 |
| 3.2 | 重写 `LanguageSwitcher.wsx`：内部仅使用 `wsx-dropdown` + i18n 逻辑（currentLanguage、languageChanged 监听、change 时先更新 UI 再 `requestAnimationFrame` 调 `changeLanguage`） | `packages/base-components/src/LanguageSwitcher.wsx` | T.11、T.12、T.13 通过 |
| 3.3 | 将 Dropdown 的 `options` 构造为 `{ value: code, label: name, render?: () => HTMLElement }`，保证选中态与展示与 site 版一致 | 同上 | 视觉与 T.12 一致 |
| 3.4 | 在 `packages/base-components/src/index.ts` 中增加 `export { default as LanguageSwitcher } from "./LanguageSwitcher.wsx"` | `packages/base-components/src/index.ts` | T.16 满足 |

#### Step 4 — Site 迁移

| # | 动作 | 文件/位置 | 验收 |
|---|------|-----------|------|
| 4.1 | 在 site 的 `App.wsx`（或挂载 LanguageSwitcher 的入口）中：移除对 `./components/LanguageSwitcher.wsx` 的 import，改为依赖 `@wsxjs/wsx-base-components` 提供的 `wsx-language-switcher` | `site/src/App.wsx` | 页面仍渲染语言切换器 |
| 4.2 | 删除 `site/src/components/LanguageSwitcher.wsx`、`site/src/components/LanguageSwitcher.css` | site | 无引用残留 |
| 4.3 | 将 site 内仅针对 LanguageSwitcher 的单元测试迁移到 base-components，或改为对 `wsx-language-switcher` 的集成测试（仍可在 site 或 e2e 中运行） | `site/src/components/__tests__/`、可选 `packages/base-components/src/__tests__/` | T.13、T.14 通过 |
| 4.4 | 确认生产/预览构建下样式与交互与当前 site 一致（主题、位置、下拉方向、无障碍） | 手动或 E2E | T.15 通过 |

#### Step 5 — 全量回归

| # | 动作 | 验收 |
|---|------|------|
| 5.1 | 执行 T.1–T.4（仓库级 install、typecheck、lint、test） | 全部通过 |
| 5.2 | 执行 T.5–T.6（base-components test、build） | 全部通过 |
| 5.3 | 执行 T.14–T.17（site build/test、样式、导出与删除后的回归） | 全部通过 |
| 5.4 | 在目标分支或 CI 上跑满 T.1–T.17，签收「第一期完成」 | 见 §5.6 签收条件 |

---

### 第二期：Design System CSS 层（可选，建议在第一期之后）

| # | 动作 | 文件/位置 | 验收 |
|---|------|-----------|------|
| D1 | 新增 `site/src/design-system/layout.css`，定义 `.ds-container`、`.ds-section-header`、`.ds-section-title`、`.ds-section-description`，使用 `tokens.css` 中的 `--ds-*` | `site/src/design-system/layout.css` | 与现有 section 视觉一致 |
| D2 | 新增 `site/src/design-system/buttons.css`，定义 `.ds-btn-primary`、`.ds-btn-secondary`、`.ds-btn-ghost`（或与现有 `.btn-primary` 等兼容的 class名），统一引用 tokens | `site/src/design-system/buttons.css` | 与现有按钮视觉一致 |
| D3 | 在 site 入口或根布局中引入 `layout.css`、`buttons.css` | 如 `site/src/main.css` 或 `App.css` | 全局可用 |
| D4 | 逐个组件 CSS 删除与 `.container`、`.section-header`、`.section-title`、`.section-description` 及 `.btn-primary` 等重复定义，改为使用 design system class | 各 section/页面 CSS | 无重复、样式无回归 |
| D5 | 视觉与 E2E 回归：首页、文档页、404、Quick Start、Examples 等关键路径 | 手动或 E2E | 无样式错位或丢失 |

---

### 第三期：通用 UI 原语组件（按 RFC §4.3 批次推进）

**批次 A**

| # | 动作 | 验收 |
|---|------|------|
| A1 | 在 base-components 中实现 **Card**（`wsx-card`）：slots `header`、default、`footer`；attributes/properties：`variant`、`clickable`、`href`；CSS 变量映射 tokens | 单元测试 + site 中替换 1–2 处做试点 |
| A2 | 在 base-components 中实现 **Badge**（`wsx-badge` 或 `.ds-badge`）：attributes/properties：`variant`、`size`；或仅提供 CSS class | 单元测试或视觉回归 |
| A3 | Site 中 FeaturesSection、EcosystemSection、ExamplesSection 等逐步用 Card/Badge 替换现有卡片与 badge 结构 | 视觉与 E2E 回归 |

**批次 B**

| # | 动作 | 验收 |
|---|------|------|
| B1 | 实现 **Stat**（`wsx-stat`）：attributes/properties：`icon`、`value`、`label`、`description?` | 单元测试；替换 StatsSection、PerformanceMetrics |
| B2 | 实现 **Steps**（`wsx-steps`）：attributes/properties：`items`、`direction` | 单元测试；替换 QuickStartSection 步骤 |
| B3 | 提供 **List** 变体：CSS-only `.ds-icon-list`、`.ds-desc-list` 或轻量组件 | 替换 ComparisonSection、info-section 等 |

**批次 C（按需）**

| # | 动作 | 验收 |
|---|------|------|
| C1 | 实现 **EmptyState**（`wsx-empty-state`）：attributes/properties：`icon`、`title`、`description?`，slot `action` | 单元测试；替换 NotFoundSection |

---

## 7. 对新 base 组件的测试要求（后续实施时适用）

- **Card**（`wsx-card`）：单元测试覆盖 slot 渲染（header/default/footer）、variant 样式切换、clickable/href 交互、CSS custom properties 覆盖、可访问性；site 中替换后做视觉与 E2E 回归。
- **Badge**（`wsx-badge`）：单元测试覆盖 variant/size 渲染；若 CSS-only 则仅做视觉回归。
- **Stat**（`wsx-stat`）：单元测试覆盖 icon/value/label/description 展示；StatsSection / PerformanceMetrics 替换后做数据与样式回归。
- **Steps**（`wsx-steps`）：单元测试覆盖 items 渲染、horizontal/vertical 方向；QuickStartSection 替换后做视觉回归。
- **EmptyState**（`wsx-empty-state`）：单元测试覆盖 icon/title/description 展示、action slot；NotFoundSection 替换后做 404 页 E2E 与样式回归。

## 8. Base-components 包边界分析（当前组件必要性及迁移建议）

对 `packages/base-components` 内**当前所有组件与工具**做逐一分析，区分「应保留在 base」与「建议迁出到其他包」的边界，便于后续拆分或瘦身。

### 8.1 当前清单与依赖/消费者

| 组件/能力 | 标签/形态 | 依赖（除 core） | 当前消费者 |
|-----------|------------|-----------------|------------|
| Button | `wsx-button` | — | site（未用）、base 内 ColorPicker 用 |
| ButtonGroup | `wsx-button-group` | — | 无（仅测试） |
| Dropdown | `wsx-dropdown` | — | 无（LanguageSwitcher 将用） |
| Combobox | `wsx-combobox` | — | 无 |
| ResponsiveNav | `wsx-responsive-nav` | OverflowDetector（同包） | site（App 主导航） |
| SvgIcon | `wsx-svg-icon` | — | site（HomeSection、SvgDemo 等） |
| CodeBlock | `wsx-code-block` | prismjs + 多语言组件 | site（QuickStartCode、文档/示例） |
| ThemeSwitcher | `wsx-theme-switcher` | localStorage、DOM class | site（App 导航栏） |
| ColorPicker | `wsx-color-picker` | ColorPickerUtils、wsx-logger、内部用 wsx-button | site（仅 ExamplesSection/SvgDemo） |
| OverflowDetector | 工具类（无标签） | — | ResponsiveNav（同包） |
| ColorPickerUtils | 工具函数 | — | ColorPicker（同包） |
| LanguageSwitcher | `wsx-language-switcher`（未导出） | @wsxjs/wsx-i18next | site（本地副本） |

**结论**：除 site 外，无其他 workspace 包消费 base-components；site 实际用到的为 ResponsiveNav、ThemeSwitcher、SvgIcon、CodeBlock、ColorPicker（仅示例区）、LanguageSwitcher（本地版）。

### 8.2 必要性判定与迁移建议

**原则**：base 应只保留**与业务/领域无关的通用 UI 原语**，任何依赖特定领域（主题、i18n、文档/代码展示、编辑器）的组件优先迁出，以减轻 base 依赖、缩小体积、厘清边界。

| 组件/能力 | 必要性 | 建议 | 目标包/说明 |
|-----------|--------|------|-------------|
| **Button** | ✅ 必要 | 保留 | 通用按钮原语，任何应用都需要 |
| **ButtonGroup** | ✅ 必要 | 保留 | 通用布局，与 Button 配套 |
| **Dropdown** | ✅ 必要 | 保留 | 通用选择/下拉原语 |
| **Combobox** | ✅ 必要 | 保留 | 通用可搜索选择原语 |
| **SvgIcon** | ✅ 必要 | 保留 | 通用图标展示原语 |
| **OverflowDetector** | ✅ 必要 | 保留 | ResponsiveNav 依赖；可视为内部实现细节，不单独对外暴露亦可 |
| **ResponsiveNav** | ⚠️ 边界 | 保留 | 偏「应用壳」但通用；若未来有 `@wsxjs/wsx-nav` 可考虑迁出，当前保留 |
| **ThemeSwitcher** | ❌ 非必要 | **迁出** | 与「主题」强绑定；RFC 0064 规划 `@wsxjs/wsx-theme`，ThemeSwitcher 应随主题能力迁入 **theme 包**，base 不再提供 |
| **LanguageSwitcher** | ❌ 非必要 | **迁出** | 与 i18n 强绑定；建议迁入 **@wsxjs/wsx-i18next**，作为可选 UI 导出（如 `@wsxjs/wsx-i18next/components` 或包内子路径），base 不依赖 i18next、不导出 |
| **CodeBlock** | ⚠️ 边界 | 保留或迁出 | 依赖 prismjs、面向文档/示例；若希望 base 零「文档/代码」依赖，可迁至 **@wsxjs/wsx-press** 或新建 `@wsxjs/wsx-code-block`；当前保留则需接受 prism 体积 |
| **ColorPicker** | ❌ 非必要 | **迁出** | 含 EditorJS 内联/块工具相关设计（如 `api`、PluginType）；应迁入 **专用 EditorJS 增强包**（见下），base 不再导出 |
| **ColorPickerUtils** | — | 随 ColorPicker | 与 ColorPicker 同迁至 EditorJS 增强包 |

**EditorJS 专用包**：EditorJS 是创建 WSX 的主要动机之一（用 WSX 编写 EditorJS 块与内联工具），应建设 **专用包**（如 `@wsxjs/wsx-editorjs` 或 `packages/editorjs`）用于增强 EditorJS，而非放入 examples/addon。该包承载：

- **ColorPicker** + **ColorPickerUtils**（内联/块工具用颜色选择）
- 未来可迁入或聚合 site 现有 **WsxCodeComponent**、**WsxTableComponent**、**WsxHighlightButton** 等 EditorJS 块/内联工具

这样「WSX + EditorJS」能力集中在一处，与项目初衷一致；base 保持为与编辑器无关的通用 UI 原语。

### 8.3 建议的 base 最终形态（瘦身后）

- **保留并导出**：Button、ButtonGroup、Dropdown、Combobox、ResponsiveNav、SvgIcon、CodeBlock、OverflowDetector（及 ResponsiveNav 所需类型）。  
- **不再提供**：ThemeSwitcher → 迁至 theme 包；LanguageSwitcher → 迁至 i18n 包；**ColorPicker + ColorPickerUtils → 迁至专用 EditorJS 增强包**（如 `@wsxjs/wsx-editorjs`）。

实施顺序建议：

1. **本期（RFC 0063）**：完成 LanguageSwitcher 基于 wsx-dropdown 的重构与 site 迁移；**不改变** LanguageSwitcher 所在包（仍可暂留 base 并导出），待 i18n 包具备可选 UI 导出后再迁出。  
2. **RFC 0064 实施时**：将 ThemeSwitcher 迁入 `@wsxjs/wsx-theme`，base 移除 ThemeSwitcher 及对 theme 概念的依赖。  
3. **后续**：将 LanguageSwitcher 迁入 `@wsxjs/wsx-i18next` 的组件子路径，base 移除导出与依赖；**新建 `@wsxjs/wsx-editorjs`（或等价包），将 ColorPicker + ColorPickerUtils 迁入，并逐步将 site 内 EditorJS 相关组件（WsxCodeComponent、WsxTableComponent 等）迁入或复用该包**，base 移除 ColorPicker 导出。

---

## 9. 小结

- **Base 现状**：已导出 Button、Dropdown、ResponsiveNav、SvgIcon、CodeBlock、ThemeSwitcher 等；LanguageSwitcher 存在但未导出，且与 wsx-dropdown 有 90% 逻辑重复。
- **第一期（本期必做）** — Dropdown 增强 + LanguageSwitcher：
  1. wsx-dropdown 增加 `renderTrigger` / `icon` 配置。
  2. LanguageSwitcher 重构为 wsx-dropdown 薄封装（~50 行）。
  3. Site 迁移，删除本地实现。通过 Full Test Plan（T.1–T.17）。
- **第二期** — Design System CSS 层：
  - `layout.css`（container/section-header/title/description）+ `buttons.css`（btn-primary/secondary/ghost）。
  - 预期消除 ~200 处 CSS 重复，无需新组件。
- **第三期** — 通用 UI 原语组件（非 domain-specific）：
  - **批次 A（高）**：Card（容器原语，32 张卡片）、Badge（内联标记）。
  - **批次 B（中）**：Stat（数值展示）、Steps（步骤流程）、List 变体（CSS-only）。
  - **批次 C（低）**：EmptyState（空状态，按需）。
