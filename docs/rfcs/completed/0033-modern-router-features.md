# RFC-0033: Modern Router Features - View Transitions, Scroll Restoration & Navigation Events

- **RFC编号**: 0033
- **开始日期**: 2025-12-23
- **完成日期**: 2025-12-23
- **状态**: Implemented
- **作者**: WSX Team

## 摘要

为 `wsx-router` 添加 3 个核心现代化功能，使其符合 2025 年的 SPA 路由标准：

1. **View Transitions API 支持** - 原生平滑页面过渡
2. **Scroll Restoration** - 智能滚动位置管理
3. **Navigation Events** - 可扩展的事件系统

**设计原则**：
- 信任浏览器，使用原生 API
- 零复杂度增加（~20 行代码）
- 向后兼容，渐进增强
- 保持 wsxjs-router 的简洁性

## 动机

### 问题描述

当前 `wsx-router` 缺少现代 SPA 路由库的 3 个基础功能：

1. **页面过渡生硬**：
   - 路由切换时视图直接切换，无过渡动画
   - 用户体验不符合 2025 年标准
   - 现代浏览器已原生支持 View Transitions API

2. **滚动位置管理缺失**：
   - 路由切换后不会滚动到页面顶部
   - 返回上一页时无法恢复原滚动位置
   - 用户体验混乱

3. **缺少扩展点**：
   - 用户无法在路由导航前后执行自定义逻辑
   - 无法实现权限检查、分析统计等功能
   - 不符合现代路由库的可扩展性要求

### 为什么不在 RFC 0032 中实现？

RFC 0032 专注于**稳定性修复和性能优化**，而这 3 个功能是**新增的现代化特性**。分离到独立 RFC 的好处：

- 清晰的职责划分
- 独立的实施和测试周期
- 更好的文档组织
- 可独立发布版本

### 现代路由库对比

| 功能 | React Router | Vue Router | wsxjs-router (当前) | 本 RFC (目标) |
|------|--------------|-----------|-------------------|--------------|
| View Transitions | ✅ (v6.26+) | ❌ | ❌ | ✅ |
| Scroll Restoration | ✅ | ✅ | ❌ | ✅ |
| Navigation Events | ✅ | ✅ | ❌ | ✅ |
| 代码行数 | ~5000+ | ~3000+ | ~220 | ~240 (+20) |

## 详细设计

### 核心概念

#### 1. View Transitions API

**浏览器原生 API**，无需 JavaScript 动画库：

```typescript
if (document.startViewTransition) {
    document.startViewTransition(() => {
        // 更新 DOM
    });
}
```

**浏览器支持**（2025）：
- Chrome/Edge 111+ ✅
- Safari 18+ ✅ (iOS 18, 2024年9月发布)
- Firefox: 实验性支持
- 全球覆盖率：~75%

#### 2. Scroll Restoration

**浏览器原生 API**，智能滚动管理：

```typescript
// 设置滚动恢复模式
history.scrollRestoration = 'manual'; // 或 'auto'

// 前进导航时滚动到顶部
window.scrollTo(0, 0);

// 后退导航时浏览器自动恢复
```

**浏览器支持**：100% (所有现代浏览器)

#### 3. Navigation Events

**自定义事件系统**，提供扩展点：

```typescript
// before-navigate: 可取消的导航前事件
router.addEventListener('before-navigate', (e) => {
    if (needsAuth(e.detail.to) && !isAuth()) {
        e.preventDefault(); // 取消导航
        RouterUtils.navigate('/login');
    }
});

// after-navigate: 导航后事件
router.addEventListener('after-navigate', (e) => {
    analytics.track('pageview', e.detail.to);
});
```

### API 设计

#### 1. WsxRouter 扩展

```typescript
@autoRegister({ tagName: "wsx-router" })
export default class WsxRouter extends LightComponent {
    private views: Map<string, HTMLElement> = new Map();
    private currentView: HTMLElement | null = null;
    private currentPath: string = "";

    // 新增：View Transitions 配置
    private enableViewTransitions: boolean = true;

    // 新增：Scroll Restoration 配置
    private scrollRestoration: 'auto' | 'manual' = 'manual';

    /**
     * 路由变化处理（增强版）
     */
    private handleRouteChange = () => {
        const nextPath = window.location.pathname;

        // 1. 触发 before-navigate 事件（可取消）
        const beforeEvent = new CustomEvent('before-navigate', {
            detail: {
                to: nextPath,
                from: this.currentPath
            },
            bubbles: true,
            cancelable: true
        });

        if (!this.dispatchEvent(beforeEvent)) {
            // 事件被取消，阻止导航
            return;
        }

        // 2. 执行导航（可能带 View Transition）
        this.performNavigation(nextPath);
    };

    /**
     * 执行导航（带 View Transitions 支持）
     */
    private performNavigation(nextPath: string) {
        const performTransition = () => {
            // 隐藏当前视图
            if (this.currentView) {
                this.currentView.style.display = "none";
            }

            // 显示新视图
            const view = this.matchRoute(nextPath);
            if (view) {
                view.style.display = "block";
                this.currentView = view;

                // 传递路由参数
                const params = this.extractParams(
                    view.getAttribute("route") || "/",
                    nextPath
                );
                if (params) {
                    requestAnimationFrame(() => {
                        view.setAttribute("params", JSON.stringify(params));
                    });
                }
            }

            // 滚动管理
            this.handleScrollRestoration(nextPath);

            // 触发 after-navigate 事件
            this.dispatchEvent(new CustomEvent('after-navigate', {
                detail: {
                    to: nextPath,
                    from: this.currentPath
                },
                bubbles: true
            }));

            // 更新当前路径
            this.currentPath = nextPath;
        };

        // View Transitions API（渐进增强）
        if (this.enableViewTransitions && document.startViewTransition) {
            document.startViewTransition(performTransition);
        } else {
            performTransition();
        }
    }

    /**
     * 滚动恢复处理
     */
    private handleScrollRestoration(nextPath: string) {
        if (this.scrollRestoration === 'manual') {
            // 判断是否是后退导航
            const isBackNavigation = this.isBackNavigation();

            if (!isBackNavigation) {
                // 前进导航：滚动到顶部
                window.scrollTo(0, 0);
            }
            // 后退导航：浏览器自动恢复滚动位置
        }
        // scrollRestoration === 'auto' 时，完全交给浏览器处理
    }

    /**
     * 检测是否是后退导航
     */
    private isBackNavigation(): boolean {
        // 通过 performance.navigation API 检测
        if (performance.navigation) {
            return performance.navigation.type === 2; // TYPE_BACK_FORWARD
        }

        // 降级方案：检查 history.state
        return window.history.state?.navigationType === 'back';
    }

    /**
     * 配置 View Transitions
     */
    public setViewTransitions(enabled: boolean): void {
        this.enableViewTransitions = enabled;
    }

    /**
     * 配置 Scroll Restoration
     */
    public setScrollRestoration(mode: 'auto' | 'manual'): void {
        this.scrollRestoration = mode;
        if ('scrollRestoration' in history) {
            history.scrollRestoration = mode;
        }
    }
}
```

#### 2. 新增事件类型

```typescript
/**
 * before-navigate 事件
 */
interface BeforeNavigateEvent extends CustomEvent {
    detail: {
        to: string;      // 目标路径
        from: string;    // 来源路径
    };
    // 可调用 preventDefault() 取消导航
}

/**
 * after-navigate 事件
 */
interface AfterNavigateEvent extends CustomEvent {
    detail: {
        to: string;      // 目标路径
        from: string;    // 来源路径
    };
}

/**
 * navigation-error 事件（未来扩展）
 */
interface NavigationErrorEvent extends CustomEvent {
    detail: {
        to: string;
        from: string;
        error: Error;
    };
}
```

#### 3. HTML 属性配置

```html
<!-- 启用/禁用 View Transitions -->
<wsx-router view-transitions="true">
    <wsx-view route="/" component="home-page"></wsx-view>
</wsx-router>

<!-- 配置 Scroll Restoration -->
<wsx-router scroll-restoration="manual">
    <wsx-view route="/" component="home-page"></wsx-view>
</wsx-router>
```

### 实现细节

#### 1. View Transitions 实现

**关键代码**（~8 行）：

```typescript
// 在 performNavigation() 中
if (this.enableViewTransitions && document.startViewTransition) {
    document.startViewTransition(() => {
        // DOM 更新逻辑
        this.updateViews(nextPath);
    });
} else {
    this.updateViews(nextPath);
}
```

**CSS 过渡配置**（用户可选）：

```css
/* 默认淡入淡出 */
::view-transition-old(root),
::view-transition-new(root) {
    animation-duration: 0.3s;
}

/* 自定义过渡 */
@keyframes slide-from-right {
    from {
        transform: translateX(100%);
    }
}

::view-transition-new(root) {
    animation: slide-from-right 0.3s ease-out;
}
```

**降级方案**：
- 不支持的浏览器自动降级，无过渡动画
- 零破坏性，零额外开销

#### 2. Scroll Restoration 实现

**关键代码**（~6 行）：

```typescript
private handleScrollRestoration(nextPath: string) {
    if (this.scrollRestoration === 'manual') {
        if (!this.isBackNavigation()) {
            window.scrollTo(0, 0); // 前进导航滚动到顶部
        }
        // 后退导航浏览器自动恢复
    }
}
```

**后退导航检测**（~5 行）：

```typescript
private isBackNavigation(): boolean {
    return performance.navigation?.type === 2 ||
           window.history.state?.navigationType === 'back';
}
```

#### 3. Navigation Events 实现

**关键代码**（~6 行）：

```typescript
// before-navigate
const event = new CustomEvent('before-navigate', {
    detail: { to: nextPath, from: this.currentPath },
    bubbles: true,
    cancelable: true
});

if (!this.dispatchEvent(event)) {
    return; // 导航被取消
}

// after-navigate
this.dispatchEvent(new CustomEvent('after-navigate', {
    detail: { to: nextPath, from: this.currentPath }
}));
```

### 示例用法

#### 1. 基础使用（开箱即用）

```tsx
<wsx-router>
    <wsx-view route="/" component="home-page"></wsx-view>
    <wsx-view route="/about" component="about-page"></wsx-view>
</wsx-router>
```

**效果**：
- ✅ 自动启用 View Transitions（支持的浏览器）
- ✅ 自动滚动到页面顶部
- ✅ 后退时恢复滚动位置

#### 2. 禁用 View Transitions

```tsx
<wsx-router view-transitions="false">
    <wsx-view route="/" component="home-page"></wsx-view>
</wsx-router>
```

#### 3. 使用 Navigation Events - 权限检查

```typescript
// 应用层代码
const router = document.querySelector('wsx-router');

router.addEventListener('before-navigate', (e: BeforeNavigateEvent) => {
    const { to } = e.detail;

    // 检查权限
    if (to.startsWith('/admin') && !isAuthenticated()) {
        e.preventDefault(); // 取消导航
        RouterUtils.navigate('/login');
        showToast('请先登录');
    }
});
```

#### 4. 使用 Navigation Events - 分析统计

```typescript
router.addEventListener('after-navigate', (e: AfterNavigateEvent) => {
    const { to, from } = e.detail;

    // 发送分析事件
    analytics.track('pageview', {
        page: to,
        referrer: from,
        timestamp: Date.now()
    });

    // 更新页面标题
    updatePageTitle(to);
});
```

#### 5. 自定义 View Transition 动画

```css
/* 页面级过渡 */
::view-transition-old(root) {
    animation: fade-out 0.2s ease-out;
}

::view-transition-new(root) {
    animation: slide-in-from-right 0.3s ease-out;
}

@keyframes slide-in-from-right {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* 特定元素过渡（高级） */
.page-header {
    view-transition-name: header;
}

::view-transition-old(header),
::view-transition-new(header) {
    animation-duration: 0.5s;
}
```

## 与 WSX 理念的契合度

### 符合核心原则

- [x] **信任浏览器**：100% 使用原生 API（View Transitions, History, Events）
- [x] **零运行时**：不引入任何第三方库，纯原生实现
- [x] **Web 标准**：基于 Web Components 和标准 DOM 事件
- [x] **渐进增强**：不支持的浏览器自动降级，零破坏性

### 理念契合说明

1. **简洁性**：
   - 总增量：~20 行核心代码
   - 零新依赖
   - 零复杂数据结构

2. **可扩展性**：
   - 通过事件系统提供扩展点
   - 不在库中实现业务逻辑（如权限检查）
   - 用户完全控制

3. **性能优先**：
   - 原生 API 性能最优
   - 零额外运行时开销
   - 可选功能，按需启用

## 权衡取舍

### 优势

1. **现代化体验**：
   - 平滑的页面过渡（View Transitions）
   - 智能的滚动管理（Scroll Restoration）
   - 符合 2025 年 UX 标准

2. **零复杂度增加**：
   - 总增量 ~20 行代码
   - 不引入新类或数据结构
   - 100% 向后兼容

3. **可扩展性**：
   - 通过事件系统替代路由守卫
   - 用户自定义业务逻辑
   - 保持库的简洁性

4. **浏览器原生**：
   - 信任浏览器，不重新发明轮子
   - 性能最优（原生 API）
   - 未来兼容性好

### 劣势

1. **浏览器兼容性**：
   - View Transitions API 覆盖率 ~75%（2025）
   - 需要优雅降级（已实现）

2. **功能限制**：
   - 不提供复杂的路由守卫系统
   - 不内置懒加载支持
   - 通过事件和用户自实现解决

### 替代方案

#### 方案 A：完整路由守卫系统（❌ 不推荐）

引入类似 Vue Router 的完整守卫系统：
- `beforeEnter`, `beforeLeave`, `afterEnter` 等钩子
- 异步守卫支持
- 路由元信息系统

**问题**：
- 复杂度暴增（+100+ 行代码）
- 从库变成框架
- 破坏简洁性

**结论**：通过事件系统提供扩展点，用户自实现

#### 方案 B：不实现任何新功能（❌ 不推荐）

保持当前状态，不添加现代化功能。

**问题**：
- 路由体验落后 2025 年标准
- 用户需要大量自定义代码
- 竞争力下降

**结论**：必须添加核心现代化功能

#### 方案 C：本 RFC 提案（✅ 推荐）

添加 3 个核心功能，通过原生 API 实现：
- View Transitions API
- Scroll Restoration
- Navigation Events

**优势**：
- 简洁、高效、现代化
- 零复杂度增加
- 100% 向后兼容

## 未解决问题

1. **嵌套路由支持**：是否需要？大多数应用可能不需要
2. **路由预加载**：是否需要？可通过用户自实现
3. **Hash 路由模式**：是否需要？现代应用通常使用 History 模式
4. **Query Parameters 工具**：是否需要封装？`URLSearchParams` 已足够

**结论**：等待实际需求再决定，避免过度设计

## 实现计划

### 阶段1：核心实现（1周）

1. **View Transitions API 支持**
   - 在 `handleRouteChange()` 中集成
   - 添加 `enableViewTransitions` 配置
   - 编写单元测试
   - 浏览器兼容性测试

2. **Scroll Restoration**
   - 实现 `handleScrollRestoration()` 方法
   - 实现 `isBackNavigation()` 检测
   - 添加 `scrollRestoration` 配置
   - 编写单元测试

3. **Navigation Events**
   - 实现 `before-navigate` 事件（可取消）
   - 实现 `after-navigate` 事件
   - 编写事件测试
   - 文档示例

### 阶段2：测试和文档（3天）

1. **单元测试**
   - View Transitions 降级测试
   - Scroll Restoration 场景测试
   - Navigation Events 取消导航测试
   - 浏览器兼容性测试

2. **文档更新**
   - API 文档
   - 使用示例
   - 迁移指南（如需要）
   - 浏览器兼容性说明

### 阶段3：发布（1天）

1. **版本发布**
   - 更新 CHANGELOG
   - 发布 npm 包
   - 更新文档网站

### 时间线

- **Week 1**: 核心实现 + 单元测试
- **Day 8-10**: 文档和示例
- **Day 11**: 发布

### 依赖项

- 无外部依赖
- 需要浏览器支持：
  - View Transitions API: Chrome 111+, Safari 18+
  - Scroll Restoration: 所有现代浏览器
  - Custom Events: 所有现代浏览器

## 测试策略

### 单元测试

1. **View Transitions**
   - 测试 API 可用时启用过渡
   - 测试 API 不可用时降级
   - 测试禁用 View Transitions

2. **Scroll Restoration**
   - 测试前进导航滚动到顶部
   - 测试后退导航保持滚动位置
   - 测试 auto/manual 模式切换

3. **Navigation Events**
   - 测试 `before-navigate` 触发
   - 测试 `preventDefault()` 取消导航
   - 测试 `after-navigate` 触发
   - 测试事件 detail 数据

### 集成测试

1. **完整导航流程**
   - View Transitions + Scroll + Events
   - 测试多次导航
   - 测试前进/后退

2. **浏览器兼容性**
   - Chrome/Edge 111+
   - Safari 18+
   - Firefox (降级测试)

### 手动测试

1. **视觉测试**
   - 页面过渡动画流畅度
   - 滚动行为正确性

2. **性能测试**
   - 导航性能影响
   - 内存使用情况

## 文档计划

### 需要的文档

1. **API 文档**
   - `setViewTransitions()` 方法
   - `setScrollRestoration()` 方法
   - Event 类型定义
   - HTML 属性说明

2. **使用指南**
   - 基础使用
   - View Transitions 自定义
   - Navigation Events 示例
   - 权限检查示例
   - 分析统计示例

3. **浏览器兼容性**
   - View Transitions 支持情况
   - 降级方案说明
   - Polyfill 建议（如需要）

4. **迁移指南**
   - 从 0.x 到 1.x（如有破坏性变更）
   - 无破坏性变更，无需迁移

### 文档位置

- API 文档：`packages/router/README.md`
- 使用指南：`docs/guides/router-modern-features.md`
- 示例代码：`site/src/examples/router/`

## 向后兼容性

### 破坏性变更

- **无破坏性变更**
- 所有新功能为可选功能
- 默认行为保持不变（除了自动启用 View Transitions）

### 迁移策略

- 无需迁移
- 用户可选择启用/禁用新功能
- 默认提供最佳体验

### 废弃计划

- 无废弃功能

## 性能影响

### 构建时性能

- 无影响（纯运行时功能）

### 运行时性能

- **View Transitions**：
  - 浏览器原生实现，性能最优
  - 不支持的浏览器零开销（降级）

- **Scroll Restoration**：
  - 浏览器原生实现，零开销
  - 一次滚动操作（`window.scrollTo(0, 0)`）

- **Navigation Events**：
  - 标准 DOM 事件，性能优秀
  - 用户控制事件处理逻辑

### 内存使用

- 增加 2 个字段：
  - `enableViewTransitions: boolean`
  - `scrollRestoration: 'auto' | 'manual'`
- 增量：~16 bytes
- 可忽略不计

## 安全考虑

- Navigation Events 允许取消导航，可用于权限控制
- 用户需要在应用层实现安全逻辑
- 库本身不涉及安全问题

## 开发者体验

### 学习曲线

- **基础使用**：零学习成本（开箱即用）
- **高级使用**：
  - Navigation Events: 熟悉 DOM 事件即可
  - View Transitions CSS: 需要学习 CSS 规范
  - 提供完整文档和示例

### 调试体验

- 浏览器 DevTools 原生支持
- View Transitions 可在 DevTools 中调试
- Navigation Events 在 Console 中可见
- 清晰的错误信息

### 错误处理

- View Transitions API 不可用时自动降级
- Navigation Events 异常不影响路由功能
- 提供详细的警告信息（如需要）

## 社区影响

### 生态系统

- 提升 wsxjs-router 的现代化程度
- 与主流路由库功能对齐
- 保持简洁性和高性能

### 第三方集成

- 可与分析库集成（通过 Navigation Events）
- 可与权限库集成（通过 Navigation Events）
- 可与动画库集成（通过 View Transitions CSS）

## 先例

### 业界实践

- **React Router v6.26+**：支持 View Transitions
- **Next.js 15+**：实验性 View Transitions 支持
- **Astro**：内置 View Transitions 支持
- **所有现代路由库**：都支持 Scroll Restoration 和 Navigation Events

### 学习借鉴

- React Router 的 View Transitions 集成方式
- Vue Router 的 Scroll Behavior API
- Angular Router 的 Navigation Events 设计

## 附录

### 参考资料

- [View Transition API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [View Transitions | React Router](https://reactrouter.com/how-to/view-transitions)
- [Smooth Navigation Transitions with View Transitions API](https://www.supremetech.vn/create-smooth-navigation-transitions-with-view-transitions-api-and-react-router/)
- [SPA Routing and Navigation Best Practices](https://docsallover.com/blog/ui-ux/spa-routing-and-navigation-best-practices/)
- [History API - Scroll Restoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration)

### 讨论记录

- 2025-12-23: 初始 RFC 创建
- 确定 3 个核心功能：View Transitions, Scroll Restoration, Navigation Events
- 拒绝路由守卫系统，采用事件扩展点
- 拒绝懒加载内置支持，用户自实现

---

*这个 RFC 旨在通过最少的代码（~20 行）为 wsxjs-router 添加现代化功能，保持简洁性的同时符合 2025 年的 SPA 路由标准。*
