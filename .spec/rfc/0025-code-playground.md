# RFC-0025: 代码 Playground（M3）

- **RFC编号**: 0025
- **父 RFC**: [RFC-0021](./0021-framework-website-enhancement.md)
- **里程碑**: M3
- **开始日期**: 2025-01-XX
- **状态**: Proposed
- **作者**: WSX Team

## 摘要

实现交互式代码 Playground，允许用户在线编辑和运行 WSXJS 代码，提供 Monaco Editor 集成、代码执行沙箱和示例模板。

## 动机

### 为什么需要这个功能？

代码 Playground 是框架网站的重要功能：
- 允许用户快速体验 WSXJS
- 无需本地环境即可尝试代码
- 提供交互式学习体验
- 参考 Vue.js 和 React 的 Playground

### 目标用户

- 首次接触 WSXJS 的开发者
- 想要快速尝试代码的开发者
- 学习 WSXJS 的开发者

## 详细设计

### 核心概念

Playground 包含：
1. **代码编辑器** - Monaco Editor（VS Code 编辑器）
2. **代码执行** - iframe 沙箱
3. **示例模板** - Quick Start, Component, Router 等
4. **代码分享** - 生成可分享的链接

### 组件设计

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
// src/components/Playground.wsx
import { LightComponent, autoRegister, state } from '@wsxjs/wsx-core';
import * as monaco from 'monaco-editor';

@autoRegister({ tagName: 'code-playground' })
export class Playground extends LightComponent {
    private editor: monaco.editor.IStandaloneCodeEditor | null = null;
    @state private output: string = '';
    @state private error: string | null = null;
    
    protected onConnected(): void {
        requestAnimationFrame(() => {
            const container = this.querySelector('#editor');
            if (container) {
                this.editor = monaco.editor.create(container, {
                    value: this.getDefaultCode(),
                    language: 'typescript',
                    theme: 'vs-dark'
                });
            }
        });
    }
    
    render() {
        return (
            <div class="playground-container">
                <div class="playground-editor">
                    <div id="editor"></div>
                    <div class="playground-actions">
                        <button onClick={this.runCode}>Run</button>
                        <button onClick={this.shareCode}>Share</button>
                    </div>
                </div>
                <div class="playground-output">
                    {this.error ? (
                        <div class="error">{this.error}</div>
                    ) : (
                        <iframe id="output-frame" sandbox="allow-scripts"></iframe>
                    )}
                </div>
            </div>
        );
    }
    
    private runCode = async (): Promise<void> => {
        if (!this.editor) return;
        const code = this.editor.getValue();
        await this.executeInSandbox(code);
    };
    
    private async executeInSandbox(code: string): Promise<void> {
        // 实现代码执行逻辑
    }
}
```

## 实施计划

### 步骤 3.1: 集成 Monaco Editor（3 天）
- [ ] 安装和配置
- [ ] 创建 Playground 组件

### 步骤 3.2: 实现代码执行沙箱（3 天）
- [ ] 创建代码运行器
- [ ] 集成到 Playground

### 步骤 3.3: 添加示例模板（2 天）
- [ ] 创建模板数据
- [ ] 实现模板选择器

### 步骤 3.4: 添加高级功能（2 天）
- [ ] 代码分享
- [ ] 代码导出

## 验收标准

- [ ] Monaco Editor 正常工作
- [ ] 代码可以执行
- [ ] 沙箱安全隔离
- [ ] 示例模板可用
- [ ] 代码分享功能正常

## 交付物

- ✅ 完整的代码 Playground
- ✅ Monaco Editor 集成
- ✅ 代码执行沙箱
- ✅ 示例模板
- ✅ 代码分享功能

## 相关文档

- [RFC-0021: 框架网站增强计划](./0021-framework-website-enhancement.md)
- [执行计划](../../packages/examples/EXECUTION_PLAN.md)

