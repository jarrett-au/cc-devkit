# TUI 测试指南

## 概述

cc-devkit TUI 采用**多层次测试策略**，从单元测试到集成测试，确保代码质量和功能正确性。

## 测试类型

### 1. 单元测试
测试不依赖 UI 的纯函数和逻辑：

```bash
# 运行所有单元测试
npm run test:unit

# 示例：测试 utils.js
- extractDescription() - YAML frontmatter 解析
- supportsColor() - 颜色支持检测
- formatListItem() - 列表项格式化
- isValidFile() - 文件验证
- parseMcpJson() - MCP JSON 解析
```

### 2. 状态管理测试
测试状态管理系统的逻辑：

```bash
# 测试 state.js
- getState() / set() - 状态读写
- update() - 批量更新
- toggleSelection() - 选择切换
- selectAll() / reverseSelection() / clearSelection() - 批量操作
- subscribe() - 订阅机制
```

### 3. 集成测试
测试组件交互和页面渲染：

```bash
# 运行集成测试
npm run test:integration

# 测试内容：
- 屏幕初始化
- 页面渲染
- 用户交互模拟
- 页面导航
- 状态持久化
```

## 测试工具

### Test Helper
`tests/test-helper.js` 提供了测试辅助类：

```javascript
const { createTestHelper, TestUtils } = require('./tests/test-helper');

// 创建测试辅助器
const helper = createTestHelper({
  width: 80,
  height: 24
});

// 创建测试屏幕
helper.createScreen();

// 模拟按键
helper.simulateKey('space');
helper.simulateKey('enter');

// 模拟按键序列
helper.simulateKeys([
  { key: 'j' },
  { key: 'space' },
  'enter'
]);

// 获取屏幕内容
const content = helper.getScreenContent();

// 查找元素
const element = helper.findElementByLabel('Help');

// 清理
helper.cleanup();
```

## 安装和运行

### 1. 安装 Jest

```bash
npm install --save-dev jest
```

### 2. 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:unit
npm run test:integration

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 测试示例

### 示例 1: 测试纯函数

```javascript
const utils = require('../lib/tui/utils');

test('should extract description from YAML', () => {
  const result = utils.extractDescription('test.md');
  expect(result).toBe('Expected description');
});
```

### 示例 2: 测试状态管理

```javascript
test('should toggle selection', () => {
  stateManager.toggleSelection('commands', 'git-commit');
  expect(stateManager.isSelected('commands', 'git-commit')).toBe(true);
});
```

### 示例 3: 测试用户交互

```javascript
test('should handle space key for selection', () => {
  const helper = createTestHelper();
  helper.createScreen();

  const page = new TypeSelectPage(helper.screen);
  page.render();

  // 模拟按键
  helper.simulateKey('space');

  // 验证结果
  expect(stateManager.isSelected('commands', 'git-commit')).toBe(true);

  helper.cleanup();
});
```

## 测试最佳实践

### ✅ 应该测试的

1. **纯函数逻辑**
   - 数据转换
   - 字符串处理
   - 格式化逻辑

2. **状态管理**
   - 状态读写
   - 状态更新
   - 订阅通知

3. **数据处理**
   - 文件解析
   - 数据加载
   - 数据排序

4. **用户交互流程**
   - 按键响应
   - 页面导航
   - 状态变化

### ❌ 不应测试的

1. **Blessed 内部实现**
   - 不需要测试 blessed 库本身
   - 只测试我们的使用方式

2. **UI 样式细节**
   - 颜色值
   - 精确的像素位置

3. **第三方库**
   - 信任库的作者

## 测试覆盖率目标

- **语句覆盖率**: ≥ 60%
- **分支覆盖率**: ≥ 60%
- **函数覆盖率**: ≥ 60%
- **行覆盖率**: ≥ 60%

## 持续集成

在 CI/CD 管道中运行测试：

```yaml
# GitHub Actions 示例
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v2
```

## 调试测试

### 1. 运行单个测试文件

```bash
npx jest tests/utils.test.js
```

### 2. 运行特定测试

```bash
npx jest -t "should extract description"
```

### 3. 调试输出

```javascript
test('example', () => {
  console.log('Debug info:', someVariable);
  expect(true).toBe(true);
});
```

## 常见问题

### Q: 测试时报错 "blessed is not defined"
**A:** 确保在测试中正确 require blessed：
```javascript
const blessed = require('blessed');
```

### Q: 测试中屏幕输出混乱
**A:** 使用 Test Helper 的屏幕捕获功能，或在 jest.config.js 中设置合适的环境。

### Q: 异步测试超时
**A:** 增加超时时间：
```javascript
jest.setTimeout(30000); // 30秒
```

## 参考资源

- [Jest 官方文档](https://jestjs.io/)
- [Blessed 文档](https://github.com/chjj/blessed)
- [Node.js 测试最佳实践](https://jestjs.io/docs/tutorial-node)

---

**更新日期:** 2025-01-27
**版本:** 1.0.0
