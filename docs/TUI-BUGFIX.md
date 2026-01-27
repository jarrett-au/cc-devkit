# TUI Bug Fix - "blessed is not defined"

## 问题
运行 TUI 时出现错误：`blessed is not defined`

## 原因
在多个文件中使用了 `blessed` 对象，但没有正确地 require 它。

## 修复内容

### 1. lib/tui/index.js
- ✅ 添加 `const blessed = require('blessed');` 在文件顶部
- ✅ 删除 _renderExitConfirm 方法中的重复 require

### 2. lib/tui/pages/base.js
- ✅ 添加 `const blessed = require('blessed');`
- ✅ 在构造函数中添加 `this.blessed = blessed;`
- ✅ 更新 createBox, createText, createList 方法使用 `this.blessed`

### 3. lib/tui/pages/*.js (所有页面文件)
- ✅ 删除重复的 `const blessed = require('blessed');`
- ✅ 通过继承 BasePage，使用 this.blessed 访问

## 测试验证

### 1. 语法检查
```bash
node -c lib/tui/*.js lib/tui/pages/*.js
✓ All files have valid syntax
```

### 2. 初始化测试
```bash
node test-tui-init.js
✓ Loading modules...
✓ Creating TUI application instance...
✓ Loading data from test directory...
  - Commands: 3
  - Skills: 1
  - MCP servers: 2
✓ Testing screen initialization...
✓ Blessed screen initialized successfully!
✓ Screen destroyed (cleanup test)
=== All TUI initialization tests passed! ===
```

## 运行 TUI

现在可以正常运行 TUI：

```bash
# 使用 CLI 模式
node bin/cc-devkit.js --init claude --tui

# 或使用测试脚本
node test-tui-run.js
```

## 快捷键

- `hjkl` / 方向键 - 导航
- `Space` - 选择/取消
- `a` - 全选，`r` - 反选，`c` - 清空
- `Tab` - 切换 tab
- `?` - 帮助
- `Esc` - 退出（需确认两次）
- `Enter` - 确认

---

**修复日期:** 2025-01-27
**状态:** ✅ 已修复并验证
