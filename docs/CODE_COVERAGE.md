# Code Coverage Guide

本文档说明如何运行和查看代码覆盖率报告。

## 运行覆盖率测试

### 基本命令

```bash
# 运行测试并生成覆盖率报告
pnpm test:coverage

# 或者使用 Jest 直接运行
pnpm jest --coverage
```

### 覆盖率报告格式

覆盖率报告会生成在 `coverage/` 目录下，包含以下格式：

- **HTML 报告**: `coverage/index.html` - 交互式 HTML 报告，可以在浏览器中查看
- **LCOV 报告**: `coverage/lcov.info` - 用于 CI/CD 集成
- **JSON 报告**: `coverage/coverage-final.json` - 机器可读格式
- **文本摘要**: 在终端输出中显示

### 查看 HTML 报告

```bash
# 在浏览器中打开 HTML 报告
open coverage/index.html  # macOS
# 或
xdg-open coverage/index.html  # Linux
# 或直接在浏览器中打开文件
```

## 覆盖率阈值

项目设置了以下覆盖率阈值：

### 全局阈值
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### 包特定阈值

#### `@wsxjs/wsx-core`
- **Branches**: 75%
- **Functions**: 75%
- **Lines**: 75%
- **Statements**: 75%

#### `@wsxjs/wsx-vite-plugin`
- **Branches**: 65%
- **Functions**: 65%
- **Lines**: 65%
- **Statements**: 65%

#### `@wsxjs/eslint-plugin-wsx`
- **Branches**: 65%
- **Functions**: 65%
- **Lines**: 65%
- **Statements**: 65%

如果覆盖率低于阈值，测试将失败。

## 覆盖率收集范围

覆盖率收集包括以下包：

- `packages/core/src/**/*.{ts,tsx}`
- `packages/eslint-plugin/src/**/*.{ts,tsx}`
- `packages/vite-plugin/src/**/*.{ts,tsx}`

### 排除的文件

以下文件被排除在覆盖率收集之外：

- `*.d.ts` - TypeScript 声明文件
- `*.test.{ts,tsx}` - 测试文件
- `__tests__/**` - 测试目录
- `index.ts` - Barrel exports
- `types.ts` - 类型定义文件

## CI/CD 集成

### GitHub Actions

如果使用 GitHub Actions，可以添加覆盖率检查：

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
```

### 其他 CI 平台

大多数 CI 平台都支持 LCOV 格式的覆盖率报告。只需上传 `coverage/lcov.info` 文件即可。

## 提高覆盖率

### 识别未覆盖的代码

1. 查看 HTML 报告，红色标记表示未覆盖的代码
2. 检查终端输出中的覆盖率摘要
3. 查看 `coverage/lcov.info` 文件

### 添加测试

对于未覆盖的代码：

1. **添加单元测试**: 为函数和类添加测试用例
2. **添加集成测试**: 测试组件之间的交互
3. **添加边界测试**: 测试边界条件和错误情况
4. **添加回归测试**: 为已修复的 bug 添加测试

### 排除不需要测试的代码

如果某些代码确实不需要测试（例如类型定义、配置等），可以使用注释排除：

```typescript
/* istanbul ignore next */
export function someFunction() {
    // This function is excluded from coverage
}
```

或者使用 Jest 配置中的 `collectCoverageFrom` 排除整个文件。

## 覆盖率指标说明

### Branches (分支覆盖率)
测试中执行的分支（if/else、switch 等）的百分比。

### Functions (函数覆盖率)
测试中调用的函数的百分比。

### Lines (行覆盖率)
测试中执行的可执行代码行的百分比。

### Statements (语句覆盖率)
测试中执行的语句的百分比。

## 最佳实践

1. **保持高覆盖率**: 目标是保持 70% 以上的覆盖率
2. **关注关键路径**: 优先测试核心功能和关键业务逻辑
3. **定期检查**: 在每次 PR 中检查覆盖率变化
4. **不要为了覆盖率而测试**: 确保测试有实际价值
5. **使用覆盖率报告**: 定期查看 HTML 报告，识别未覆盖的代码

## 故障排除

### 覆盖率报告未生成

检查：
1. Jest 配置是否正确
2. `coverageDirectory` 是否设置
3. 是否有文件匹配 `collectCoverageFrom` 模式

### 覆盖率阈值失败

如果测试因覆盖率阈值失败：
1. 查看具体哪些文件/函数未达到阈值
2. 添加相应的测试用例
3. 或者调整阈值（如果合理）

### 覆盖率数据不准确

可能的原因：
1. 代码在测试环境中未执行
2. 某些代码路径被意外排除
3. 测试环境配置问题

检查 Jest 配置和测试文件，确保所有代码路径都被正确测试。

