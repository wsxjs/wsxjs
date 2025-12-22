# RFC-0023: SEO 优化和错误处理（M1）

- **RFC编号**: 0023
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M1
- **开始日期**: 2025-01-XX
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

实现 SEO 优化（动态 meta 标签、Open Graph、结构化数据）和错误处理（404 页面、错误边界），提升网站的搜索引擎可见性和用户体验。

## 动机

### 为什么需要这个功能？

当前网站缺少：
- 动态 meta 标签更新（路由切换时）
- Open Graph 和 Twitter Card 标签
- 结构化数据（Schema.org）
- 404 页面处理
- 全局错误处理

### 当前状况

- ❌ 所有页面使用相同的 meta 标签
- ❌ 缺少 Open Graph 标签
- ❌ 缺少结构化数据
- ❌ 访问不存在的路由时无友好提示
- ❌ 错误发生时无用户友好的提示

## 详细设计

### 1. SEO 优化

#### 1.1 MetaManager 工具类

```typescript
// src/utils/meta-manager.ts
export interface RouteMeta {
    title: string;
    description: string;
    image?: string;
    url?: string;
    keywords?: string[];
}

export class MetaManager {
    static update(meta: RouteMeta): void {
        // 更新 title
        document.title = meta.title;
        
        // 更新或创建 meta 标签
        this.setMeta('description', meta.description);
        this.setMeta('keywords', meta.keywords?.join(', ') || '');
        this.setMeta('og:title', meta.title);
        this.setMeta('og:description', meta.description);
        this.setMeta('og:url', meta.url || window.location.href);
        this.setMeta('og:image', meta.image || '/og-image.png');
        this.setMeta('og:type', 'website');
        this.setMeta('twitter:card', 'summary_large_image');
        this.setMeta('twitter:title', meta.title);
        this.setMeta('twitter:description', meta.description);
        this.setMeta('twitter:image', meta.image || '/og-image.png');
    }
    
    private static setMeta(name: string, content: string): void {
        if (!content) return;
        
        let element = document.querySelector(`meta[name="${name}"]`) ||
                     document.querySelector(`meta[property="${name}"]`);
        
        if (!element) {
            element = document.createElement('meta');
            if (name.startsWith('og:') || name.startsWith('twitter:')) {
                element.setAttribute('property', name);
            } else {
                element.setAttribute('name', name);
            }
            document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
    }
}
```

#### 1.2 路由 Meta 配置

```typescript
// src/config/route-meta.ts
import { RouteMeta } from '../utils/meta-manager';

export const routeMeta: Record<string, RouteMeta> = {
    '/': {
        title: 'WSXJS - JSX for Native Web Components',
        description: 'Modern JSX syntax for native Web Components. Zero dependencies, TypeScript-first, production-ready.',
        image: '/og-image.png',
        url: 'https://wsxjs.dev/',
        keywords: ['WSXJS', 'Web Components', 'JSX', 'TypeScript', 'Framework']
    },
    '/docs/getting-started': {
        title: 'Getting Started - WSXJS',
        description: 'Learn how to get started with WSXJS in minutes.',
        url: 'https://wsxjs.dev/docs/getting-started',
        keywords: ['WSXJS', 'Getting Started', 'Tutorial', 'Guide']
    },
    // ... 其他路由
};
```

#### 1.3 结构化数据

```typescript
// src/utils/structured-data.ts
export function addStructuredData(data: object): void {
    // 移除旧的 structured data
    const oldScript = document.querySelector('script[type="application/ld+json"]');
    if (oldScript) {
        oldScript.remove();
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

// 使用示例
addStructuredData({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'WSXJS',
    applicationCategory: 'Web Development Framework',
    operatingSystem: 'Web',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
    }
});
```

### 2. 错误处理

#### 2.1 404 页面

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/NotFoundSection.wsx
import { LightComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister({ tagName: 'not-found-section' })
export class NotFoundSection extends LightComponent {
    render() {
        return (
            <div class="not-found">
                <div class="not-found-content">
                    <h1>404</h1>
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    <div class="not-found-actions">
                        <wsx-link to="/" class="btn-primary">Go Home</wsx-link>
                        <wsx-link to="/docs" class="btn-secondary">Browse Docs</wsx-link>
                    </div>
                </div>
            </div>
        );
    }
}
```

#### 2.2 错误边界

```typescript
// src/utils/error-handler.ts
export class ErrorHandler {
    static init(): void {
        // 全局错误监听
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'JavaScript Error');
        });
        
        // Promise 错误监听
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });
    }
    
    private static handleError(error: Error | unknown, type: string): void {
        console.error(`[${type}]`, error);
        
        // 显示用户友好的错误提示
        this.showErrorToast('Something went wrong. Please refresh the page.');
        
        // 错误上报（可选）
        // this.reportError(error, type);
    }
    
    private static showErrorToast(message: string): void {
        // 实现错误提示 UI
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}
```

## 实施计划

### 步骤 1.1: SEO 优化（3 天）

#### 1.1.1 创建 MetaManager 工具类（1 天）
- [ ] 创建 `src/utils/meta-manager.ts`
- [ ] 实现 `update()` 方法
- [ ] 实现 `setMeta()` 私有方法
- [ ] 支持所有必要的 meta 标签
- [ ] 添加单元测试

#### 1.1.2 创建路由 Meta 配置（0.5 天）
- [ ] 创建 `src/config/route-meta.ts`
- [ ] 为每个路由定义 meta 信息
- [ ] 包含 title, description, image, url, keywords

#### 1.1.3 集成到路由系统（0.5 天）
- [ ] 在 `App.wsx` 中监听路由变化
- [ ] 路由变化时调用 `MetaManager.update()`
- [ ] 测试所有路由的 meta 标签更新

#### 1.1.4 添加结构化数据（1 天）
- [ ] 创建 `src/utils/structured-data.ts`
- [ ] 实现 `addStructuredData()` 函数
- [ ] 为首页添加 SoftwareApplication schema
- [ ] 为文档页面添加 Article schema
- [ ] 验证结构化数据

### 步骤 1.2: 错误处理（2 天）

#### 1.2.1 创建 404 页面（1 天）
- [ ] 创建 `src/components/NotFoundSection.wsx`
- [ ] 设计友好的 404 页面
- [ ] 添加"返回首页"和"浏览文档"链接
- [ ] 在 `App.wsx` 中添加通配符路由

#### 1.2.2 添加错误边界（1 天）
- [ ] 创建 `src/utils/error-handler.ts`
- [ ] 实现全局错误监听
- [ ] 实现用户友好的错误提示
- [ ] 在 `main.ts` 中初始化错误处理

### 步骤 1.3: 内容修复（1 天）
- [ ] 修复页脚链接（替换 `#` 占位符）
- [ ] 配置真实的社交媒体链接
- [ ] 添加真实的文档链接
- [ ] 测试所有链接的有效性

## 验收标准

- [ ] 每个路由都有唯一的 meta 标签
- [ ] Open Graph 标签正确设置
- [ ] 结构化数据验证通过（Google Rich Results Test）
- [ ] 404 页面友好且功能正常
- [ ] 全局错误处理正常工作
- [ ] 所有链接有效
- [ ] Lighthouse SEO 评分 > 90

## 交付物

- ✅ `MetaManager` 工具类
- ✅ 路由 Meta 配置
- ✅ 结构化数据工具
- ✅ 404 页面组件
- ✅ 错误处理系统
- ✅ 修复后的页脚链接

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

