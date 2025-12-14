# RFC-0015: i18next 国际化集成

- **RFC编号**: 0015
- **开始日期**: 2025-01-27
- **状态**: Draft
- **作者**: WSX Team

## 摘要

本 RFC 提议为 WSX 框架集成 i18next 国际化解决方案，参考 `wsx-router` 的实现方式，创建一个独立的 `@wsxjs/wsx-i18n` 包，提供声明式的国际化组件和工具函数，让 WSX 组件能够轻松支持多语言。

## 动机

### 为什么需要这个功能？

现代 Web 应用需要支持多语言，但现有的国际化解决方案存在以下问题：

1. **框架绑定**：React 的 `react-i18next`、Vue 的 `vue-i18n` 等都与特定框架绑定
2. **Web Components 不友好**：现有方案难以在 Web Components 中优雅使用
3. **依赖复杂**：需要额外的配置和上下文提供者
4. **缺乏声明式语法**：无法像 `wsx-router` 那样使用声明式 HTML 语法

### 当前状况

目前 WSX 框架没有内置的国际化支持，开发者需要：
- 手动集成 i18next 或类似库
- 在每个组件中重复初始化 i18n 实例
- 使用命令式 API 进行翻译
- 缺乏统一的配置和管理方式

### 目标用户

- 需要构建多语言应用的 WSX 开发者
- 希望使用声明式语法进行国际化的开发者
- 需要与现有 i18next 生态系统集成的团队

## 详细设计

### 核心概念

参考 `wsx-router` 的设计理念：
- **零依赖封装**：基于 i18next 核心库，提供 WSX 友好的封装
- **声明式语法**：使用 HTML 属性配置国际化
- **组件化设计**：提供 `<wsx-i18n>` 提供者组件和 `<wsx-t>` 翻译组件
- **工具函数**：提供编程式 API 用于复杂场景

### API 设计

#### 1. `<wsx-i18n>` - 国际化提供者组件

```html
<wsx-i18n 
  resources='{"en":{"translation":{"hello":"Hello"}},"zh":{"translation":{"hello":"你好"}}}'
  default-lng="en"
  fallback-lng="en">
  <!-- 子组件可以使用翻译功能 -->
  <my-component></my-component>
</wsx-i18n>
```

**属性：**
- `resources`: JSON 格式的翻译资源（字符串）
- `default-lng`: 默认语言代码（如 "en", "zh"）
- `fallback-lng`: 回退语言代码
- `ns`: 默认命名空间（可选，默认为 "translation"）
- `debug`: 是否启用调试模式（可选）

**职责：**
- 初始化 i18next 实例
- 管理语言切换
- 通过事件系统向子组件提供 i18n 上下文
- 监听语言变化并通知子组件

#### 2. `<wsx-t>` - 翻译组件

```html
<wsx-t key="hello">Hello</wsx-t>
<wsx-t key="welcome" name="John">Welcome</wsx-t>
<wsx-t key="items" count="5">Items</wsx-t>
```

**属性：**
- `key`: 翻译键名（必需）
- `ns`: 命名空间（可选，继承自父级）
- `count`: 复数形式计数（可选）
- `name`, `value` 等: 插值变量（可选）

**特性：**
- 自动响应语言变化
- 支持插值和复数
- 支持命名空间
- 支持默认内容（slot）

#### 3. 编程式 API - I18nUtils

```typescript
import { I18nUtils } from '@wsxjs/wsx-i18n';

// 获取翻译函数
const t = I18nUtils.getT();
t('hello'); // "Hello" 或 "你好"

// 切换语言
I18nUtils.changeLanguage('zh');

// 获取当前语言
const currentLang = I18nUtils.getLanguage();

// 获取 i18n 实例
const i18n = I18nUtils.getInstance();

// 监听语言变化
const unsubscribe = I18nUtils.onLanguageChanged((lng) => {
  console.log('Language changed to:', lng);
});
```

### 实现细节

#### 1. 组件架构

```typescript
// WsxI18n.wsx - 提供者组件
@autoRegister({ tagName: "wsx-i18n" })
export default class WsxI18n extends LightComponent {
  private i18nInstance: i18n | null = null;
  
  protected onConnected() {
    // 初始化 i18next
    this.initI18n();
    // 监听语言变化
    this.setupLanguageListener();
  }
  
  private initI18n() {
    const resources = this.parseResources();
    const defaultLng = this.getAttribute('default-lng') || 'en';
    
    this.i18nInstance = i18n.createInstance({
      resources,
      lng: defaultLng,
      fallbackLng: this.getAttribute('fallback-lng') || 'en',
      ns: this.getAttribute('ns') || 'translation',
      debug: this.hasAttribute('debug'),
    });
    
    // 存储到全局或通过事件系统提供
    I18nUtils.setInstance(this.i18nInstance);
  }
}
```

```typescript
// WsxT.wsx - 翻译组件
@autoRegister({ tagName: "wsx-t" })
export default class WsxT extends LightComponent {
  @state private translation: string = '';
  
  protected onConnected() {
    this.updateTranslation();
    // 监听语言变化事件
    document.addEventListener('i18n-language-changed', this.handleLanguageChange);
  }
  
  private updateTranslation() {
    const key = this.getAttribute('key');
    if (!key) return;
    
    const t = I18nUtils.getT();
    const options = this.getTranslationOptions();
    this.translation = t(key, options);
  }
  
  private getTranslationOptions() {
    const options: any = {};
    
    // 命名空间
    const ns = this.getAttribute('ns');
    if (ns) options.ns = ns;
    
    // 复数
    const count = this.getAttribute('count');
    if (count) options.count = parseInt(count);
    
    // 插值变量
    Array.from(this.attributes).forEach(attr => {
      if (!['key', 'ns', 'count'].includes(attr.name)) {
        options[attr.name] = attr.value;
      }
    });
    
    return options;
  }
  
  render() {
    return <span>{this.translation || <slot></slot>}</span>;
  }
}
```

#### 2. 工具类实现

```typescript
// I18nUtils.ts
export class I18nUtils {
  private static instance: i18n | null = null;
  private static languageChangeListeners: Set<(lng: string) => void> = new Set();
  
  static setInstance(instance: i18n) {
    this.instance = instance;
    
    // 监听 i18next 的语言变化
    instance.on('languageChanged', (lng) => {
      this.notifyLanguageChange(lng);
    });
  }
  
  static getInstance(): i18n {
    if (!this.instance) {
      throw new Error('i18n instance not initialized. Please use <wsx-i18n> component first.');
    }
    return this.instance;
  }
  
  static getT(): TFunction {
    return this.getInstance().t.bind(this.getInstance());
  }
  
  static changeLanguage(lng: string): Promise<TFunction> {
    return this.getInstance().changeLanguage(lng);
  }
  
  static getLanguage(): string {
    return this.getInstance().language;
  }
  
  static onLanguageChanged(callback: (lng: string) => void): () => void {
    this.languageChangeListeners.add(callback);
    return () => {
      this.languageChangeListeners.delete(callback);
    };
  }
  
  private static notifyLanguageChange(lng: string) {
    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('i18n-language-changed', {
      detail: { language: lng },
      bubbles: true,
      composed: true,
    }));
    
    // 通知监听器
    this.languageChangeListeners.forEach(cb => cb(lng));
  }
}
```

#### 3. 事件系统

使用自定义事件在组件间通信：
- `i18n-language-changed`: 语言变化时触发
- `i18n-initialized`: i18n 实例初始化完成时触发

### 示例用法

#### 基础用法

```html
<wsx-i18n 
  resources='{
    "en": {
      "translation": {
        "hello": "Hello",
        "welcome": "Welcome, {{name}}!",
        "items": "{{count}} items",
        "items_plural": "{{count}} items"
      }
    },
    "zh": {
      "translation": {
        "hello": "你好",
        "welcome": "欢迎, {{name}}!",
        "items": "{{count}} 个项目",
        "items_plural": "{{count}} 个项目"
      }
    }
  }'
  default-lng="en">
  
  <div>
    <wsx-t key="hello"></wsx-t>
    <wsx-t key="welcome" name="John"></wsx-t>
    <wsx-t key="items" count="5"></wsx-t>
  </div>
</wsx-i18n>
```

#### 在 WSX 组件中使用

```typescript
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister, state } from "@wsxjs/wsx-core";
import { I18nUtils } from "@wsxjs/wsx-i18n";

@autoRegister({ tagName: "my-component" })
export default class MyComponent extends WebComponent {
  @state private userName: string = "John";
  
  render() {
    const t = I18nUtils.getT();
    
    return (
      <div>
        <h1>{t('welcome', { name: this.userName })}</h1>
        <wsx-t key="hello"></wsx-t>
      </div>
    );
  }
  
  protected onConnected() {
    // 监听语言变化，触发重新渲染
    const unsubscribe = I18nUtils.onLanguageChanged(() => {
      this.requestUpdate(); // 假设有这个方法
    });
    
    this.onDisconnected = () => {
      unsubscribe();
    };
  }
}
```

#### 语言切换组件

```typescript
/** @jsxImportSource @wsxjs/wsx-core */
import { LightComponent, autoRegister } from "@wsxjs/wsx-core";
import { I18nUtils } from "@wsxjs/wsx-i18n";

@autoRegister({ tagName: "language-switcher" })
export default class LanguageSwitcher extends LightComponent {
  render() {
    const currentLang = I18nUtils.getLanguage();
    
    return (
      <div>
        <button 
          onClick={() => I18nUtils.changeLanguage('en')}
          class={currentLang === 'en' ? 'active' : ''}>
          English
        </button>
        <button 
          onClick={() => I18nUtils.changeLanguage('zh')}
          class={currentLang === 'zh' ? 'active' : ''}>
          中文
        </button>
      </div>
    );
  }
}
```

#### 外部资源加载

```html
<wsx-i18n 
  default-lng="en"
  fallback-lng="en"
  resources-url="/locales/{{lng}}/{{ns}}.json">
  <!-- 组件会自动加载翻译资源 -->
</wsx-i18n>
```

## 与 WSX 理念的契合度

### 符合核心原则

- ✅ **JSX 语法糖**：提供声明式的 `<wsx-t>` 组件，增强 JSX 开发体验
- ✅ **信任浏览器**：基于 Web 标准的事件系统进行组件通信
- ⚠️ **零运行时**：需要 i18next 运行时，但提供最小化封装
- ✅ **Web 标准**：使用自定义元素和标准 DOM API

### 理念契合说明

1. **类似 wsx-router 的设计**：采用相同的架构模式，提供组件和工具函数
2. **声明式优先**：支持 HTML 属性配置，同时提供编程式 API
3. **组件化**：通过 Web Components 封装，无需框架绑定
4. **事件驱动**：使用浏览器原生事件系统进行通信

## 权衡取舍

### 优势

1. **统一体验**：与 `wsx-router` 一致的设计模式
2. **易于使用**：声明式语法，降低学习曲线
3. **灵活性**：支持编程式 API，满足复杂场景
4. **生态系统**：基于 i18next，可复用现有插件和工具
5. **类型安全**：完整的 TypeScript 支持

### 劣势

1. **运行时依赖**：需要 i18next 库，增加包体积
2. **配置复杂度**：需要理解 i18next 的配置选项
3. **资源管理**：大型应用的翻译资源管理需要额外考虑

### 替代方案

1. **直接使用 i18next**：
   - 优点：无需额外封装
   - 缺点：缺乏声明式语法，需要手动管理实例

2. **使用其他国际化库**：
   - 优点：可能有更小的体积
   - 缺点：生态系统不如 i18next 成熟

3. **自定义简单实现**：
   - 优点：零依赖
   - 缺点：需要重新实现复数、插值等功能

## 未解决问题

1. **资源加载策略**：是否支持懒加载翻译资源？
2. **命名空间嵌套**：如何处理复杂的命名空间结构？
3. **格式化功能**：日期、数字等格式化是否内置？
4. **服务端渲染**：是否支持 SSR 场景？
5. **性能优化**：大量翻译组件的性能优化策略？

## 实现计划

### 阶段规划

1. **阶段1：核心实现（Week 1-2）**
   - 创建 `@wsxjs/wsx-i18n` 包结构
   - 实现 `<wsx-i18n>` 提供者组件
   - 实现 `<wsx-t>` 翻译组件
   - 实现基础工具函数

2. **阶段2：功能完善（Week 3）**
   - 支持插值和复数
   - 支持命名空间
   - 实现语言切换功能
   - 添加事件系统

3. **阶段3：测试和文档（Week 4）**
   - 编写单元测试
   - 编写集成测试
   - 更新文档和示例
   - 性能优化

### 时间线

- **Week 1-2**: 核心实现
- **Week 3**: 功能完善
- **Week 4**: 测试和文档
- **Week 5**: 发布和推广

### 依赖项

- `i18next`: 核心国际化库
- `@wsxjs/wsx-core`: WSX 核心包（已有）

## 测试策略

### 单元测试

- `I18nUtils` 工具类的所有方法
- 组件属性解析和翻译逻辑
- 事件系统功能

### 集成测试

- `<wsx-i18n>` 和 `<wsx-t>` 组件协作
- 语言切换功能
- 插值和复数功能
- 命名空间支持

### 端到端测试

- 完整的多语言应用场景
- 语言切换后的 UI 更新
- 资源加载和错误处理

## 文档计划

### 需要的文档

- [ ] API 文档更新
- [ ] 使用指南（类似 wsx-router 的 README）
- [ ] 迁移指南（从直接使用 i18next 迁移）
- [ ] 示例代码
- [ ] 最佳实践

### 文档位置

- `packages/wsx-i18n/README.md`: 主要文档
- `docs/I18N_GUIDE.md`: 详细使用指南
- `packages/examples/src/components/I18nExamples.wsx`: 示例组件

## 向后兼容性

### 破坏性变更

无。这是一个新功能，不影响现有代码。

### 迁移策略

对于已经使用 i18next 的项目：
1. 可以继续使用现有的 i18next 配置
2. 逐步迁移到 `<wsx-i18n>` 组件
3. 混合使用两种方式（通过 `I18nUtils.setInstance()` 共享实例）

### 废弃计划

不适用（新功能）。

## 性能影响

### 构建时性能

- 增加一个包的构建时间
- 翻译资源可以单独打包，不影响主包

### 运行时性能

- i18next 库的运行时开销（约 10-20KB gzipped）
- 翻译查找的性能（i18next 已优化）
- 语言切换时的组件更新（通过事件系统，性能可控）

### 内存使用

- i18next 实例的内存占用
- 翻译资源的缓存（可配置）

## 安全考虑

1. **XSS 防护**：确保翻译内容经过适当的转义
2. **资源验证**：验证外部加载的翻译资源
3. **内容安全策略**：考虑 CSP 对动态内容的影响

## 开发者体验

### 学习曲线

- 如果熟悉 i18next，学习曲线很低
- 如果熟悉 `wsx-router`，API 设计一致，易于理解
- 声明式语法降低使用门槛

### 调试体验

- 支持 i18next 的调试模式
- 提供清晰的错误信息
- 支持开发工具集成

### 错误处理

- 翻译键缺失时的回退策略
- 资源加载失败的错误处理
- 类型错误提示（TypeScript）

## 社区影响

### 生态系统

- 可以复用 i18next 的插件生态
- 为 WSX 生态系统增加国际化能力
- 可能吸引需要多语言支持的开发者

### 第三方集成

- 与现有 i18next 工具兼容
- 支持 i18next 的编辑器插件
- 支持翻译管理平台

## 先例

### 业界实践

- **react-i18next**: React 的 i18next 集成
- **vue-i18n**: Vue 的国际化解决方案
- **Angular i18n**: Angular 的国际化支持

### 学习借鉴

1. **react-i18next 的 useTranslation hook**：参考其 API 设计
2. **vue-i18n 的组件化**：参考其组件使用方式
3. **wsx-router 的架构**：采用相同的设计模式

## 附录

### 参考资料

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [RFC-0001: WSX Router](./0001-wsx-router.md)
- [Web Components 事件系统](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)

### 讨论记录

- 2025-01-27: 初始 RFC 提案
- 待定: 社区讨论和反馈收集

---

**RFC-0015** - i18next 国际化集成 | Draft | 2025-01-27
