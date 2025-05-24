# 测试说明

## 安装依赖

在运行测试之前，需要安装以下依赖：

```bash
# 安装 vitest 和相关依赖
npm install --save-dev vitest @vitest/coverage-v8
```

## 运行测试

```bash
# 运行测试 (watch 模式)
npm test

# 运行测试一次
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 测试结构

- `tests/utils/` - 工具函数测试
- `tests/components/` - React 组件测试
- `tests/mocks/` - Mock 测试示例

## 测试示例

### 1. 工具函数测试 (`tests/utils/format-message.test.ts`)
测试 `convertToOpenAIMessage` 函数的各种场景，包括不同角色的消息转换。

### 2. React 组件测试 (`tests/components/role-badge.test.tsx`)
使用 `ink-testing-library` 测试 `RoleBadge` 组件的渲染结果。

### 3. Mock 测试示例 (`tests/mocks/api.test.ts`)
演示如何使用 vitest 的 mock 功能模拟 API 调用，包括：
- 模拟 OpenAI API 响应
- 错误处理测试
- 函数调用监听 (spy)

## 配置文件

- `vitest.config.ts` - Vitest 主配置
- `tests/setup.ts` - 测试环境设置
