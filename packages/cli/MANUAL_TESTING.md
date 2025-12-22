# CLI 手动测试指南

本文档说明如何手动测试 `@wsxjs/cli` 的所有功能。

## 前置要求

1. 确保 CLI 已构建：
   ```bash
   cd packages/cli
   npm run build
   ```

2. 创建一个测试项目目录（用于测试，不会影响实际项目）

## 测试场景

### 1. 基本初始化测试

#### 测试步骤

```bash
# 1. 创建测试目录
mkdir /tmp/wsx-test-basic
cd /tmp/wsx-test-basic

# 2. 初始化 npm 项目
npm init -y

# 3. 安装 WSXJS 依赖
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# 4. 运行 CLI（使用本地构建的版本）
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive
```

#### 预期结果

- ✅ 创建 `tsconfig.json` 文件
- ✅ 创建 `vite.config.ts` 文件
- ✅ 创建 `src/types/wsx.d.ts` 文件
- ✅ 创建或更新 `eslint.config.js` 文件
- ✅ Ink UI 显示所有步骤的进度
- ✅ 显示完成摘要

#### 验证点

```bash
# 检查文件是否存在
ls -la tsconfig.json
ls -la vite.config.ts
ls -la src/types/wsx.d.ts
ls -la eslint.config.js

# 检查 tsconfig.json 内容
cat tsconfig.json | grep -A 5 "compilerOptions"

# 检查 vite.config.ts 内容
cat vite.config.ts | grep "wsx-vite-plugin"

# 检查 wsx.d.ts 内容
cat src/types/wsx.d.ts
```

### 2. 交互式模式测试

#### 测试步骤

```bash
# 创建新的测试目录
mkdir /tmp/wsx-test-interactive
cd /tmp/wsx-test-interactive
npm init -y
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# 运行交互式 CLI（不传 --no-interactive）
node /path/to/wsxjs/packages/cli/dist/index.js init
```

#### 预期行为

- ✅ 显示交互式提示：
  - "是否使用装饰器（@state）？"
  - "是否使用 @wsxjs/wsx-tsconfig 包？"
  - "是否配置 TypeScript？"
  - "是否配置 Vite？"
  - "是否配置 ESLint？"
  - "是否生成 wsx.d.ts？"
- ✅ 根据用户选择执行相应步骤
- ✅ Ink UI 实时显示进度

### 3. 跳过选项测试

#### 测试步骤

```bash
mkdir /tmp/wsx-test-skip
cd /tmp/wsx-test-skip
npm init -y
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# 跳过某些配置
node /path/to/wsxjs/packages/cli/dist/index.js init \
  --skip-tsconfig \
  --skip-vite \
  --no-interactive
```

#### 预期结果

- ✅ 只生成 `wsx.d.ts` 和配置 ESLint
- ✅ 不创建 `tsconfig.json`
- ✅ 不创建 `vite.config.ts`
- ✅ Ink UI 显示跳过的步骤为 "已跳过"

### 4. 使用 @wsxjs/wsx-tsconfig 测试

#### 测试步骤

```bash
mkdir /tmp/wsx-test-tsconfig-package
cd /tmp/wsx-test-tsconfig-package
npm init -y
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin @wsxjs/wsx-tsconfig

# 使用 tsconfig 包
node /path/to/wsxjs/packages/cli/dist/index.js init \
  --use-tsconfig-package \
  --no-interactive
```

#### 预期结果

- ✅ `tsconfig.json` 使用 `extends: "@wsxjs/wsx-tsconfig/tsconfig.base.json"`
- ✅ 配置更简洁

### 5. 配置合并测试

#### 测试步骤

```bash
mkdir /tmp/wsx-test-merge
cd /tmp/wsx-test-merge
npm init -y
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# 1. 创建现有的 tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true
  },
  "include": ["src/**/*"]
}
EOF

# 2. 创建现有的 vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
});
EOF

# 3. 运行 CLI
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive
```

#### 预期结果

- ✅ 保留现有的 `target`, `module`, `strict` 设置
- ✅ 添加 `jsx`, `jsxImportSource` 等 WSX 必需选项
- ✅ Vite 配置中添加 `wsx()` 插件，保留其他插件
- ✅ 不覆盖用户的自定义配置

#### 验证点

```bash
# 检查合并后的配置
cat tsconfig.json
cat vite.config.ts
```

### 6. ESLint 配置测试

#### 测试 Flat Config

```bash
mkdir /tmp/wsx-test-eslint-flat
cd /tmp/wsx-test-eslint-flat
npm init -y
npm install @wsxjs/wsx-core @wsxjs/eslint-plugin-wsx

# 创建 Flat Config
cat > eslint.config.js << 'EOF'
import js from '@eslint/js';

export default [js.configs.recommended];
EOF

# 运行 CLI
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive
```

#### 预期结果

- ✅ 检测到 Flat Config
- ✅ 添加 `@wsxjs/eslint-plugin-wsx` 导入
- ✅ 添加 WSX 规则配置

#### 测试 Legacy Config

```bash
mkdir /tmp/wsx-test-eslint-legacy
cd /tmp/wsx-test-eslint-legacy
npm init -y
npm install @wsxjs/wsx-core @wsxjs/eslint-plugin-wsx

# 创建 Legacy Config
cat > .eslintrc.json << 'EOF'
{
  "extends": ["eslint:recommended"]
}
EOF

# 运行 CLI
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive
```

#### 预期结果

- ✅ 检测到 Legacy Config
- ✅ 使用正确的插件名称格式 `@wsxjs/wsx`
- ✅ 添加 WSX 规则配置

### 7. 配置检查命令测试

#### 测试步骤

```bash
mkdir /tmp/wsx-test-check
cd /tmp/wsx-test-check
npm init -y

# 1. 测试未配置的情况
node /path/to/wsxjs/packages/cli/dist/index.js check

# 2. 运行 init
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive

# 3. 再次运行 check
node /path/to/wsxjs/packages/cli/dist/index.js check
```

#### 预期结果

**第一次 check（未配置）：**
- ❌ 显示缺少的文件
- 💡 显示建议

**第二次 check（已配置）：**
- ✅ 显示所有检查通过
- ✅ 显示绿色成功消息

### 8. 错误处理测试

#### 测试无效 JSON

```bash
mkdir /tmp/wsx-test-error
cd /tmp/wsx-test-error
npm init -y

# 创建无效的 tsconfig.json
echo "invalid json" > tsconfig.json

# 运行 CLI
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive
```

#### 预期结果

- ✅ 捕获错误
- ✅ 显示错误消息
- ✅ 不崩溃，继续执行其他步骤

### 9. Ink UI 测试

#### 测试步骤

```bash
mkdir /tmp/wsx-test-ui
cd /tmp/wsx-test-ui
npm init -y
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# 运行 CLI 观察 UI
node /path/to/wsxjs/packages/cli/dist/index.js init --no-interactive
```

#### 预期 UI 行为

- ✅ 显示 "🚀 正在初始化 WSXJS..."
- ✅ 每个步骤显示状态：
  - ⏳ 等待中... (pending)
  - ⏳ 配置中... (running, 带 spinner)
  - ✓ 完成 (completed, 绿色)
  - ⊘ 已跳过 (skipped, 黄色)
- ✅ 最后显示完成消息和下一步提示

### 10. 完整流程测试

#### 测试步骤

```bash
# 创建一个完整的测试项目
mkdir /tmp/wsx-test-full
cd /tmp/wsx-test-full

# 1. 初始化 npm 项目
npm init -y

# 2. 安装所有依赖
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin @wsxjs/eslint-plugin-wsx

# 3. 运行 CLI
node /path/to/wsxjs/packages/cli/dist/index.js init

# 4. 验证所有文件
ls -la
ls -la src/types/

# 5. 检查配置
node /path/to/wsxjs/packages/cli/dist/index.js check

# 6. 尝试构建（如果安装了 vite）
# npm install -D vite
# npm run build
```

## 清理测试环境

测试完成后，清理临时目录：

```bash
rm -rf /tmp/wsx-test-*
```

## 常见问题排查

### CLI 命令找不到

如果直接运行 `wsx` 命令找不到，使用完整路径：

```bash
node /path/to/wsxjs/packages/cli/dist/index.js init
```

或者链接到全局：

```bash
cd packages/cli
npm link
wsx init
```

### Ink UI 不显示

确保终端支持：
- ANSI 颜色代码
- Unicode 字符
- 实时输出（不是缓冲输出）

### 配置文件未创建

检查：
1. 当前目录权限
2. 文件系统是否可写
3. 是否有足够的磁盘空间

## 测试检查清单

- [ ] 基本初始化（所有配置）
- [ ] 交互式模式
- [ ] 跳过选项
- [ ] 使用 tsconfig 包
- [ ] 配置合并（TypeScript）
- [ ] 配置合并（Vite）
- [ ] ESLint Flat Config
- [ ] ESLint Legacy Config
- [ ] 配置检查命令
- [ ] 错误处理
- [ ] Ink UI 显示
- [ ] 完整流程

## 自动化测试

运行单元测试：

```bash
cd packages/cli
npm test
```

运行覆盖率测试：

```bash
npm run test:coverage
```

