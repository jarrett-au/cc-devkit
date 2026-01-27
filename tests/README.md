# TUI 测试快速参考

## 快速开始

```bash
# 1. 安装 Jest
npm install --save-dev jest

# 2. 运行所有测试
npm test

# 3. 运行单元测试
npm run test:unit

# 4. 运行集成测试
npm run test:integration

# 5. 生成覆盖率报告
npm run test:coverage
```

## 测试文件结构

```
tests/
├── utils.test.js           # 工具函数测试
├── state.test.js           # 状态管理测试
├── integration.test.js     # 基础集成测试
├── integration-advanced.test.js  # 高级集成测试
├── test-helper.js          # 测试辅助工具
└── setup.js                # Jest 设置
```

## 核心测试场景

### 1. 单元测试（纯函数）
```javascript
// ✅ 好的测试
test('extractDescription parses YAML', () => {
  const result = extractDescription('test.md');
  expect(result).toBe('description');
});
```

### 2. 状态管理测试
```javascript
test('toggleSelection adds/removes items', () => {
  stateManager.toggleSelection('commands', 'test');
  expect(stateManager.isSelected('commands', 'test')).toBe(true);
});
```

### 3. UI 交互测试
```javascript
test('space key toggles selection', () => {
  const helper = createTestHelper();
  helper.createScreen();

  const page = new TypeSelectPage(helper.screen);
  page.render();

  helper.simulateKey('space');

  expect(stateManager.isSelected('commands', 'git-commit')).toBe(true);
  helper.cleanup();
});
```

## Test Helper API

```javascript
const { createTestHelper } = require('./tests/test-helper');

const helper = createTestHelper({ width: 80, height: 24 });
helper.createScreen();

// 模拟输入
helper.simulateKey('space');
helper.simulateKeys(['j', 'k', 'enter']);

// 获取内容
const content = helper.getScreenContent();
const element = helper.findElement(predicate);

// 等待
await helper.waitFor(() => condition);
await helper.waitForPageChange('content-select');

// 清理
helper.cleanup();
```

## 测试覆盖率

查看覆盖率目标：
- 语句: ≥ 60%
- 分支: ≥ 60%
- 函数: ≥ 60%
- 行: ≥ 60%

生成报告：
```bash
npm run test:coverage
```

## 调试技巧

```bash
# 运行单个测试文件
npx jest tests/utils.test.js

# 运行匹配的测试
npx jest -t "extractDescription"

# 监听模式（自动重运行）
npm run test:watch

# 详细输出
npx jest --verbose
```

## 最佳实践

✅ **测试纯逻辑，不测试 UI 框架**
✅ **使用 Test Helper 模拟交互**
✅ **测试状态变化和副作用**
✅ **保持测试简单和独立**

❌ **不要测试 Blessed 内部**
❌ **不要测试样式细节**
❌ **不要测试第三方库**

---

**详细文档:** docs/TESTING-GUIDE.md
