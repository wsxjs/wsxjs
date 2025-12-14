# WSX 示例组件开发计划

## 目标
通过丰富的示例组件充分展示 WSX Framework 的能力，为开发者提供最佳实践参考。

## 开发原则
1. **教学优先** - 每个示例都要清晰展示特定功能
2. **代码简洁** - 避免过度复杂，聚焦核心概念
3. **实用性强** - 提供可复用的模式和解决方案
4. **文档完善** - 每个示例都要有详细注释

## 第一阶段：核心功能示例（1-2周）

### 1. 生命周期示例 `<wsx-lifecycle-demo>`
**优先级：高**
- 展示所有生命周期钩子
- 演示钩子调用顺序
- 实际应用场景（资源管理、事件监听）
```typescript
// 功能点：
- constructor
- connectedCallback / onConnected
- disconnectedCallback / onDisconnected
- attributeChangedCallback / onAttributeChanged
- adoptedCallback / onAdopted
```

### 2. 属性观察示例 `<wsx-attribute-demo>`
**优先级：高**
- observedAttributes 声明
- 属性变化响应
- 属性类型转换
- 默认值处理
```typescript
// 功能点：
- static observedAttributes
- 布尔、数字、字符串属性
- 属性验证
- 属性到内部状态的映射
```

### 3. 事件系统示例 `<wsx-event-demo>`
**优先级：高**
- 自定义事件派发
- 事件冒泡控制
- 跨组件通信
- 事件委托模式
```typescript
// 功能点：
- CustomEvent 创建和派发
- 事件监听和移除
- 事件数据传递
- Shadow DOM 事件边界
```

## 第二阶段：交互模式示例（2-3周）

### 4. 表单集成示例 `<wsx-form-demo>`
**优先级：高**
- 表单控件集成
- 验证逻辑
- FormData API 使用
- 受控/非受控模式
```typescript
// 功能点：
- 自定义表单控件
- Constraint Validation API
- 表单状态管理
- 错误提示UI
```

### 5. 组件通信示例 `<wsx-communication-demo>`
**优先级：中**
- 父子组件通信
- 兄弟组件通信
- 事件总线模式
- Context 模式
```typescript
// 功能点：
- Props 传递
- 事件向上传播
- 共享状态管理
- Pub/Sub 模式
```

### 6. 动态内容示例 `<wsx-dynamic-demo>`
**优先级：中**
- 列表渲染
- 条件渲染
- 动态组件
- Key 的使用
```typescript
// 功能点：
- map 渲染列表
- if/else 条件分支
- switch 多分支
- 动态标签名
```

## 第三阶段：高级特性示例（3-4周）

### 7. 异步数据示例 `<wsx-async-demo>`
**优先级：中**
- 数据加载状态
- 错误处理
- 加载指示器
- 数据缓存
```typescript
// 功能点：
- fetch API 使用
- Promise 处理
- Loading/Error/Success 状态
- 重试机制
```

### 8. 性能优化示例 `<wsx-performance-demo>`
**优先级：低**
- 虚拟滚动
- 懒加载
- 防抖/节流
- 批量更新
```typescript
// 功能点：
- IntersectionObserver
- requestAnimationFrame
- DocumentFragment
- 事件委托优化
```

### 9. 原生 API 集成示例 `<wsx-native-api-demo>`
**优先级：低**
- ResizeObserver
- MutationObserver
- Drag & Drop API
- Web Animations API
```typescript
// 功能点：
- 响应式布局
- DOM 变化监听
- 拖拽排序
- 动画序列
```

### 10. 组合模式示例 `<wsx-composition-demo>`
**优先级：低**
- HOC 模式
- Mixin 模式
- 插槽组合
- 渲染属性模式
```typescript
// 功能点：
- 功能增强
- 行为复用
- 灵活布局
- 逻辑共享
```

## 实施计划

### 第一周
- [ ] 完成生命周期示例
- [ ] 完成属性观察示例
- [ ] 更新文档

### 第二周
- [ ] 完成事件系统示例
- [ ] 完成表单集成示例
- [ ] 创建示例索引页面

### 第三周
- [ ] 完成组件通信示例
- [ ] 完成动态内容示例
- [ ] 添加交互式演示

### 第四周
- [ ] 完成异步数据示例
- [ ] 优化现有示例
- [ ] 完善文档和注释

### 后续计划
- [ ] 根据社区反馈添加新示例
- [ ] 创建在线 Playground
- [ ] 制作视频教程
- [ ] 整理最佳实践指南

## 成功标准

1. **覆盖度** - 涵盖 WSX 所有核心功能
2. **清晰度** - 代码易懂，注释充分
3. **实用性** - 可直接复用到实际项目
4. **可维护性** - 示例代码质量高，易于更新

## 示例组件模板

```typescript
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister, createLogger } from '@wsxjs/wsx-core';
import styles from './ComponentName.css?inline';

const logger = createLogger('ComponentName');

/**
 * 示例组件：展示 XXX 功能
 * 
 * 主要功能：
 * - 功能点1
 * - 功能点2
 * - 功能点3
 * 
 * 使用方法：
 * ```html
 * <component-name attribute="value"></component-name>
 * ```
 */
@autoRegister()
export class ComponentName extends WebComponent {
  static observedAttributes = ['attribute'];

  constructor() {
    super({ styles });
    logger.info('Component initialized');
  }

  render() {
    return (
      <div class="demo-container">
        <h3>功能演示</h3>
        {/* 示例代码 */}
      </div>
    );
  }

  protected onConnected() {
    logger.debug('Component connected');
  }

  protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
    logger.debug(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
  }
}
```

## 文档要求

每个示例组件都需要包含：
1. **功能说明** - 清晰描述展示的功能
2. **代码注释** - 关键代码行内注释
3. **使用示例** - HTML 使用代码
4. **最佳实践** - 推荐的使用方式
5. **常见问题** - 可能遇到的问题和解决方案

---

最后更新：2025年1月