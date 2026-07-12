---
title: "wsx-vscode: VS Code Extension Publishing to Marketplace"
status: Proposed
author: WSXJS Team
created: 2026-03-07
parent: RFC-0062
---

# RFC 0066: wsx-vscode — VS Code 扩展发布流程

## 1. 概述

定义 `packages/wsx-vscode` 扩展包的完整发布流程，包括：Publisher 注册、PAT 配置、`vsce` 打包与发布、版本管理策略、CI 自动发布。

这是 RFC-0062 Phase 2 的操作手册。

## 2. 前置条件

- `packages/wsx-vscode` 已实现（RFC-0062 Phase 2）
- `@wsxjs/ts-plugin` 已发布到 npm（RFC-0065）
- 拥有 Microsoft 账号

## 3. Publisher 注册

### 3.1 创建 Azure DevOps 组织

1. 访问 [dev.azure.com](https://dev.azure.com)，用 Microsoft 账号登录
2. 创建组织（Organization），名称任意，仅用于生成 PAT

### 3.2 创建 Personal Access Token（PAT）

1. 在 Azure DevOps 右上角 → **User settings** → **Personal access tokens**
2. **New Token**，配置如下：

| 字段 | 值 |
|------|-----|
| Name | `vscode-marketplace-publish` |
| Organization | All accessible organizations |
| Expiration | 1 year（建议，到期需续期） |
| Scopes | **Marketplace → Manage**（仅此一项） |

3. 复制生成的 Token（只显示一次），存入密码管理器

### 3.3 创建 Marketplace Publisher

1. 访问 [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
2. **Create publisher**：

| 字段 | 值 |
|------|-----|
| Publisher ID | `wsxjs`（唯一标识，不可修改） |
| Display name | `WSXJS Team` |
| Description | WSX Framework for Web Components |

3. 记录 Publisher ID，后续 `package.json` 中使用

## 4. 扩展包配置

### 4.1 `packages/wsx-vscode/package.json`

```json
{
  "name": "wsx-vscode",
  "displayName": "WSX - Web Components Framework",
  "description": "TypeScript support, syntax highlighting, and snippets for .wsx files",
  "version": "0.1.0",
  "publisher": "wsxjs",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Programming Languages", "Snippets"],
  "keywords": ["wsx", "web components", "typescript", "jsx"],
  "repository": {
    "type": "git",
    "url": "https://github.com/wsxjs/wsxjs"
  },
  "activationEvents": ["onLanguage:wsx"],
  "contributes": {
    "languages": [{
      "id": "wsx",
      "aliases": ["WSX", "wsx"],
      "extensions": [".wsx"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "wsx",
      "scopeName": "source.wsx",
      "path": "./syntaxes/wsx.tmLanguage.json"
    }],
    "snippets": [{
      "language": "wsx",
      "path": "./snippets/wsx.json"
    }],
    "typescriptServerPlugins": [{
      "name": "@wsxjs/ts-plugin",
      "enableForWorkspaceTypeScriptVersions": true
    }]
  },
  "scripts": {
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "devDependencies": {
    "@vscode/vsce": "^3.0.0"
  }
}
```

### 4.2 `.vscodeignore`

```
.vscode/**
src/**
node_modules/**
*.ts
tsconfig.json
```

## 5. 本地打包验证

每次发布前必须先本地打包验证：

```bash
cd packages/wsx-vscode

# 安装 vsce
pnpm add -D @vscode/vsce

# 打包成 .vsix
pnpm vsce package

# 本地安装验证（在 VS Code 中手动测试）
code --install-extension wsx-vscode-0.1.0.vsix
```

验证清单：
- [ ] `.wsx` 文件有语法高亮
- [ ] 无 TS2874（无需 pragma）
- [ ] Snippets 可用（`wsx-web`、`wsx-light`、`wsx-state`）
- [ ] 类型错误在 IDE 中正确显示

## 6. 发布到 Marketplace

### 6.1 首次发布（手动）

```bash
# 登录（使用 PAT）
pnpm vsce login wsxjs
# 输入 PAT Token

# 发布
pnpm vsce publish
```

### 6.2 指定版本号发布

```bash
# patch: 0.1.0 → 0.1.1
pnpm vsce publish patch

# minor: 0.1.0 → 0.2.0
pnpm vsce publish minor

# major: 0.1.0 → 1.0.0
pnpm vsce publish major

# 指定版本
pnpm vsce publish 0.2.0
```

## 7. 版本管理策略

### 7.1 与 monorepo 的关系

`wsx-vscode` 的版本**独立于** monorepo 其他包，原因：

- VS Code 扩展有自己的发布节奏（不依赖 npm 生态）
- 语法高亮、Snippets 的更新频率低于框架核心
- Marketplace 发布需要人工审核触发，不适合自动跟随 changeset

### 7.2 版本规则

| 变更类型 | 版本升级 |
|---------|---------|
| 新增 Snippet、语法高亮规则 | patch |
| 新增扩展功能（新语言特性支持） | minor |
| 重大重构、breaking change | major |
| `@wsxjs/ts-plugin` 升级 | patch（更新依赖即可） |

## 8. CI 自动发布

### 8.1 GitHub Actions 配置

在 `.github/workflows/publish-vscode.yml` 中：

```yaml
name: Publish VS Code Extension

on:
  push:
    tags:
      - 'vscode-v*'   # 触发：git tag vscode-v0.2.0

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install

      - name: Build extension
        working-directory: packages/wsx-vscode
        run: pnpm build

      - name: Publish to Marketplace
        working-directory: packages/wsx-vscode
        run: pnpm vsce publish
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

### 8.2 配置 GitHub Secret

在仓库 **Settings → Secrets and variables → Actions** 中：
- Name：`VSCE_PAT`
- Value：Azure DevOps PAT（第 3.2 节生成的 Token）

### 8.3 触发发布

```bash
# 打 tag 触发 CI 自动发布
git tag vscode-v0.2.0
git push origin vscode-v0.2.0
```

## 9. PAT 续期

PAT 有效期 1 年，到期前需续期：

1. 在 Azure DevOps 生成新 PAT（步骤同第 3.2 节）
2. 更新 GitHub Secret `VSCE_PAT`
3. 本地重新登录：`pnpm vsce login wsxjs`（输入新 PAT）

建议在日历中设置提醒，提前 2 周续期。

## 10. 实施检查清单

1. [ ] 注册 Azure DevOps 组织
2. [ ] 生成 PAT（Marketplace → Manage 权限）
3. [ ] 在 Marketplace 创建 Publisher（ID: `wsxjs`）
4. [ ] 配置 `packages/wsx-vscode/package.json`（publisher、contributes 等）
5. [ ] 编写 `.vscodeignore`
6. [ ] 本地 `vsce package` 打包验证
7. [ ] 本地安装 `.vsix` 手动测试
8. [ ] 首次 `vsce publish` 手动发布
9. [ ] 配置 GitHub Secret `VSCE_PAT`
10. [ ] 创建 `.github/workflows/publish-vscode.yml`
11. [ ] 验证 tag 触发自动发布

## 11. 参考

- [Publishing Extensions (VS Code 官方文档)](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI 文档](https://github.com/microsoft/vscode-vsce)
- [Marketplace Publisher 管理](https://marketplace.visualstudio.com/manage)
- 父 RFC：[RFC-0062 DX & IDE 工具链](./0062-dx-and-vscode-support.md)
- 依赖：[RFC-0065 wsx-ts-plugin](./0065-wsx-tsc-volar-integration.md)
