---
name: qingniao-release
description: "Release and publish WSXJS monorepo packages using qingniao (@systembug/qingniao). Use when: user asks to release, publish to npm, run release, use qingniao, or run the full release workflow (changesets + version + publish)."
---

# Qingniao Release Skill

本技能用于在此 monorepo 中通过 **qingniao** 执行发布流程：版本管理（changesets）与 NPM 发布。

## 入口命令

```bash
pnpm release
```

等价于执行 `qingniao`（或别名 `qn`）。依赖 `@changesets/cli`，交互式完成两阶段流程。

## 根目录 package.json 必须有的 scripts（qingniao 自动检测）

qingniao 会按顺序检测并执行以下脚本；**缺一不可**，否则 Phase 2 构建步骤不完整或报错。

| script | 用途 |
|--------|------|
| `clean` | 清理构建产物（可配置 skipOnError） |
| `lint` | 代码检查 |
| `typecheck` | 类型检查 |
| `test` | 测试 |
| `build` | 构建 |

Changeset 相关（使用 changeset 策略时）：

| script | 用途 |
|--------|------|
| `changeset` | 创建 changeset（`changeset` CLI） |
| `changeset:version` | 应用版本（`changeset version`） |
| `changeset:publish` | 发布到 NPM（`changeset publish`） |
| `changeset:status` | 查看状态（`changeset status`） |

发布入口（建议保留）：

| script | 用途 |
|--------|------|
| `release` | `qingniao`，完整发布流程 |
| `release:dry-run` | 试跑发布（build + changeset publish --dry-run） |
| `version` | 快捷：`pnpm changeset:version` |

**检查**：根目录 `package.json` 的 `scripts` 中应包含以上全部；若缺失，补充后再跑 `pnpm release`。

## 前置条件

1. **NPM 登录**：`npm login`，且对 `@wsxjs` scope 有 publish 权限。
2. **分支与提交**：建议在 `main`，无未提交/未推送变更；发布前可拉取远端。
3. **Changesets**：有变更时需先有 changeset（qingniao 会在无 changeset 时提示创建）。

## 流程概览

**Phase 1 — 版本管理（可选）**

- 检查 NPM 登录、Git 状态、远端更新
- 询问是否更新版本 → 若无 changeset 可自动创建
- 执行 `pnpm changeset:version`（或配置的 versionCommand），更新各包版本与 CHANGELOG
- 重新构建、提交、打 tag、推送

**Phase 2 — 发布到 NPM**

- 执行 `clean` → `pnpm install --frozen-lockfile` → `lint` → `typecheck` → `test` → `build`
- 展示待发布列表、检查已有版本、可选 dry-run
- 执行 `pnpm changeset:publish`（支持 2FA OTP 交互）

## 常用命令

| 意图 | 命令 |
|------|------|
| 完整发布（推荐） | `pnpm release` 或 `qn` |
| 仅试跑发布（不真正 publish） | `pnpm release:dry-run` 或 `qn --dry-run` |
| 创建 changeset | `pnpm changeset` |
| 仅应用版本更新 | `pnpm changeset:version` 或 `pnpm version` |
| 查看 changeset 状态 | `pnpm changeset:status` |

## Qingniao CLI 选项与子命令

**全局选项**（默认动作为发布）：

- `--dry-run`：仅试跑，不写版本、不推送、不 publish
- `--skip-version`：跳过版本更新（Phase 1）
- `--skip-build`：跳过 Phase 2 的 clean/lint/typecheck/test/build
- `--skip-publish`：只做版本与构建，不执行 changeset publish
- `-y, --yes`：跳过所有确认提示
- `-c, --config <path>`：指定配置文件（默认零配置）
- `-v, --verbose`：详细输出；`-s, --silent`：静默

**子命令**：

- `qingniao init`（或 `qn init`）：生成可选配置文件模板（`qingniao.config.ts|js|json`），`--format ts|js|json`，`--force` 覆盖已有
- `qingniao changeset-init`（或 `qn ci`）：初始化 `.changeset` 目录（若未安装 @changesets/cli 会提示安装）

## 手动发布顺序（不用 qingniao 时）

1. `pnpm changeset` — 创建或确认 changeset
2. `pnpm changeset:version` — 应用版本并更新 CHANGELOG
3. `pnpm build && pnpm test` — 构建与测试
4. `pnpm changeset:publish` — 发布到 NPM（可加 `--dry-run` 试跑）

## 参考

- 项目内完整检查清单与最佳实践：`site/public/docs/guide/advanced/publishing.md`（或仓库根下等价路径）。
- Changesets：<https://github.com/changesets/changesets>。
- 根目录 `package.json`：`"release": "qingniao"`，依赖 `@systembug/qingniao`、`@changesets/cli`。
