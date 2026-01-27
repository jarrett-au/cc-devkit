# cc-devkit TUI 交互设计技术规格

## 1. 概述

本文档定义了 cc-devkit 的终端用户界面（TUI）交互设计规格，旨在提供类似 Claude Code `AskUserQuestionTool` 的交互体验，支持通过键盘（特别是 Vim 键位）进行流畅的配置选择和同步操作。

## 2. 核心交互流程

### 2.1 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 类型选择页面                                         │
├─────────────────────────────────────────────────────────────┤
│  Select sync types to configure:                            │
│                                                              │
│  ⬜ commands    📁 Sync command definitions                  │
│  ⬜ skills      📦 Sync skill directories                    │
│  ⬜ mcp         🔌 Sync MCP server configurations            │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Selected: 0/3    [Tab: Next] [Enter: Confirm] [Esc: Exit]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: 内容选择 Tab 页面（假设选择了 commands 和 skills）   │
├─────────────────────────────────────────────────────────────┤
│ [commands] [skills]                                         │
│  ────────────────────────────────────────────────────────  │
│                                                              │
│  ⬜ git-commit      Commit staged changes                   │
│  ⬜ git-push        Push commits to remote                  │
│  ☑  npm-install     Install npm dependencies                │
│  ⬜ docker-build    Build Docker image                      │
│  ⬜ test-run        Run test suite                          │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Selected: 1/5    [/: Search] [a: All] [Enter: Confirm]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 3: 确认摘要页面                                         │
├─────────────────────────────────────────────────────────────┤
│  Summary of selected items:                                 │
│                                                              │
│  Commands (3):                                              │
│    ☑ git-commit                                            │
│    ☑ npm-install                                           │
│    ☑ test-run                                              │
│                                                              │
│  Skills (2):                                                │
│    ☑ ui-ux-pro-max                                         │
│    ☑ planning-with-files                                   │
│                                                              │
│  MCP (1):                                                   │
│    ☑ context7                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Total: 6 items    [Enter: Start Sync] [Esc: Back]         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 交互流程图

```
开始
  │
  ├─> 类型选择页面
  │     ├─> Tab/方向键 切换选项
  │     ├─> Space/Enter 切换选中状态
  │     └─> Enter (确认) ──> 内容选择 Tab 页面
  │
  ├─> 内容选择 Tab 页面
  │     ├─> Tab 切换 Tab 页
  │     ├─> hjkl/方向键 移动焦点
  │     ├─> Space/Enter 切换选中状态
  │     ├─> / 进入搜索模式
  │     ├─> a 全选 / r 反选 / c 取消全选
  │     ├─> ? 显示帮助
  │     └─> Enter (确认) ──> 确认摘要页面
  │
  ├─> 确认摘要页面
  │     ├─> 显示所有选中项
  │     ├─> Enter (确认) ──> 执行同步
  │     └─> Esc (返回) ──> 返回内容选择页面
  │
  └─> 执行同步
        ├─> 显示进度条 + 百分比
        ├─> 遇到错误立即中断，显示详细错误信息
        └─> 完成 ──> 退出 TUI
```

## 3. 键盘控制方案

### 3.1 基础导航

| 按键 | 功能 | 说明 |
|------|------|------|
| `hjkl` | 移动焦点 | Vim 风格，h左 j下 k上 l右 |
| `方向键` | 移动焦点 | 辅助键位，兼容非 Vim 用户 |
| `Home` | 跳到首项 | 快速跳转 |
| `End` | 跳到末项 | 快速跳转 |
| `PageUp` | 上一页 | 翻页 |
| `PageDown` | 下一页 | 翻页 |
| `Tab` | 切换 Tab 页 | 在不同类型间切换 |
| `Shift+Tab` | 反向切换 Tab | 反向切换 |

### 3.2 选择操作

| 按键 | 功能 | 说明 |
|------|------|------|
| `Space` | 切换选中状态 | 切换当前项的选中状态 |
| `Enter` | 确认 | 进入下一步或完成选择 |
| `a` | 全选 | 选中当前列表所有项 |
| `r` | 反选 | 反转所有项的选中状态 |
| `c` | 取消全选 | 取消所有选中 |

### 3.3 搜索功能

| 按键 | 功能 | 说明 |
|------|------|------|
| `/` | 进入搜索模式 | 激活搜索框 |
| `Esc` | 退出搜索模式 | 退出搜索，恢复列表 |
| `Enter` | 跳转到第一个匹配项 | 搜索后跳转 |

搜索特性：
- 实时过滤：输入时列表自动更新
- 仅在当前 tab 内搜索
- 过滤所有项（包括已选中的）
- 匹配文件名和描述

### 3.4 其他功能

| 按键 | 功能 | 说明 |
|------|------|------|
| `?` | 显示帮助 | 显示所有快捷键和操作说明 |
| `Esc` | 退出/返回 | 多次确认后退出 |
| `q` | 退出 | 快捷退出键 |

## 4. 数据显示规范

### 4.1 Commands 列表

**数据格式：**
```
commands/
├── git/
│   ├── commit.md
│   └── push.md
└── npm/
    └── install.md
```

**显示格式：**
- 文件名：去除 `.md` 扩展名和路径前缀
  - `git/commit.md` → `git-commit`
- 描述：从 YAML frontmatter 的 `description` 字段提取
  - 如果 `description` 字段不存在，显示为空

**frontmatter 示例：**
```markdown
---
description: Commit staged changes to git repository
---

# Git Commit

Usage: git commit ...
```

**列表显示：**
```
⬜ git-commit      Commit staged changes
⬜ git-push        Push commits to remote
☑  npm-install     Install npm dependencies
```

### 4.2 Skills 列表

**数据格式：**
```
skills/
├── ui-ux-pro-max/
│   ├── skill.md
│   └── api.md
└── planning-with-files/
    ├── skill.md
    └── config.json
```

**显示格式：**
- 目录名：直接显示 skill 目录名
- 描述：从 `skill.md` 的 YAML frontmatter 的 `description` 字段提取
  - 如果 `description` 字段不存在，显示为空

**列表显示：**
```
⬜ ui-ux-pro-max         UI/UX design intelligence
☑  planning-with-files   File-based planning system
```

### 4.3 MCP 列表

**数据格式：**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-context7"]
    },
    "test-server": {
      "command": "echo",
      "args": ["test"]
    }
  }
}
```

**显示格式：**
- 仅显示 MCP 服务器名称（key）

**列表显示：**
```
⬜ context7
☑  test-server
```

### 4.4 排序规则

- 默认按名称字母顺序（A-Z）排序
- 不支持自定义排序，保持简单

## 5. 视觉设计

### 5.1 图标和符号

| 类型 | 图标 | 说明 |
|------|------|------|
| 未选中 | `⬜` | 空白复选框 |
| 已选中 | `☑` | 勾选复选框 |
| Commands | `📁` | 文件夹图标 |
| Skills | `📦` | 包图标 |
| MCP | `🔌` | 插头图标 |
| 警告 | `⚠️` | 验证失败或冲突 |
| 错误 | `❌` | 错误标识 |

### 5.2 布局自适应

**宽屏（> 80 列）：**
```
⬜ git-commit      Commit staged changes to git repository
```

**窄屏（≤ 80 列）：**
```
⬜ git-commit      Commit staged changes
```

**超窄屏（≤ 60 列）：**
```
⬜ git-commit
```

- 根据终端宽度自动调整显示内容
- 优先显示文件名，其次描述
- 描述过长时自动截断，末尾显示 `...`

### 5.3 颜色支持

- 自动检测终端颜色支持
- 支持彩色模式：使用不同颜色区分不同类型
- 回退到黑白模式：仅使用符号和图标区分

**彩色方案示例：**
- Commands: 蓝色
- Skills: 绿色
- MCP: 黄色
- 选中项: 高亮或加粗
- 警告: 红色

## 6. 搜索功能

### 6.1 搜索交互

```
┌─────────────────────────────────────────────────────────────┐
│ [commands] [skills]                                         │
│  ────────────────────────────────────────────────────────  │
│  Search: git                                               │
│  ────────────────────────────────────────────────────────  │
│                                                              │
│  ⬜ git-commit      Commit staged changes                   │
│  ⬜ git-push        Push commits to remote                  │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  Found: 2/5    [Esc: Clear search]                          │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 搜索规则

- 激活方式：按 `/` 键
- 实时过滤：输入时立即更新列表
- 搜索范围：当前 tab 的文件名和描述
- 匹配规则：子字符串匹配（不区分大小写）
- 退出方式：按 `Esc` 清除搜索，返回完整列表

## 7. 批量操作

### 7.1 批量选择快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `a` | 全选 | 选中当前列表所有项 |
| `r` | 反选 | 反转所有项的选中状态 |
| `c` | 取消全选 | 取消所有选中 |

### 7.2 批量操作反馈

- 底部显示操作结果：`Selected all: 5 items`
- 状态栏实时更新已选数量

## 8. 验证和错误处理

### 8.1 实时验证

**验证时机：**
- 加载列表时：验证文件完整性
- 用户选择时：验证选中项的有效性

**验证内容：**
- Commands/Skills：检查 `.md` 文件是否存在且可读
- MCP：检查 JSON 格式是否正确

**警告显示：**
- 验证失败的项旁边显示 `⚠️` 图标
- 底部状态栏显示警告信息
- 仍允许选中，但同步时会再次确认

### 8.2 错误处理

**冲突检测：**
- 扫描目标位置，检测同名文件
- 在确认摘要页面显示所有冲突项

**冲突解决：**
- 批量显示所有冲突
- 提供选项：
  - `O` - 覆盖所有冲突
  - `S` - 跳过所有冲突
  - `C` - 取消操作

**执行错误：**
- 遇到错误立即中断同步
- 显示详细错误信息（文件路径、错误原因）
- 提供选项：
  - `R` - 重试
  - `S` - 跳过该项继续
  - `Esc` - 退出

## 9. 进度显示

### 9.1 进度条样式

```
Syncing commands...
[████████░░░░░░░░░░] 40% (4/10 files)
  ✓ git-commit.md
  ✓ git-push.md
  ✓ npm-install.md
  → docker-build.md
```

### 9.2 进度信息

- 显示进度条和百分比
- 显示当前项和总数
- 完成的项显示 `✓`
- 正在处理的项显示 `→`
- 失败的项显示 `✗`

## 10. 帮助系统

### 10.1 帮助页面

**激活方式：** 按 `?` 键

```
┌─────────────────────────────────────────────────────────────┐
│ Help - Keyboard Shortcuts                                   │
├─────────────────────────────────────────────────────────────┤
│ Navigation:                                                 │
│   hjkl / Arrows   Move cursor                               │
│   Home/End        Jump to first/last item                   │
│   PageUp/Down     Scroll page                               │
│   Tab             Switch tabs                               │
│                                                              │
│ Selection:                                                  │
│   Space/Enter    Toggle selection                           │
│   a              Select all                                 │
│   r              Reverse selection                           │
│   c              Clear all selections                        │
│                                                              │
│ Search:                                                     │
│   /              Enter search mode                          │
│   Esc            Exit search mode                           │
│                                                              │
│ Other:                                                      │
│   ?              Show this help                             │
│   Esc            Exit/Back (requires confirmation)          │
│                                                              │
│ Press any key to close help                                 │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 首次使用提示

- 仅在初次使用时显示核心操作提示
- 可通过配置文件关闭
- 提示内容：

```
Welcome to cc-devkit TUI!

Basic controls:
  hjkl/Arrows  - Navigate
  Space        - Select/Unselect
  Enter        - Confirm
  /            - Search
  ?            - Show help

Press any key to continue...
```

## 11. 退出机制

### 11.1 退出流程

1. 用户按 `Esc` 或 `q`
2. 显示确认对话框：
   ```
   ┌─────────────────────────────────────┐
   │  Exit confirmation                  │
   │  ─────────────────────────────────  │
   │  Are you sure you want to exit?     │
   │                                     │
   │  Any unsaved changes will be lost.  │
   │                                     │
   │  [Enter] Confirm  [Esc] Cancel      │
   └─────────────────────────────────────┘
   ```
3. 再次确认后退出

### 11.2 退出确认级别

- 第一次按 `Esc`：显示确认对话框
- 第二次确认：退出 TUI
- 按 `Esc` 取消：返回当前页面

## 12. 技术实现要点

### 12.1 依赖选择

**推荐 TUI 库：**
- [blessed](https://github.com/chjj/blessed) - 功能丰富，支持复杂布局
- [ink](https://github.com/vadimdemedes/ink) - React 风格，适合组件化
- [terminal-kit](https://github.com/cronvel/terminal-kit) - 性能优秀，API 丰富

**考虑因素：**
- 零外部依赖原则 vs 功能需求
- 性能要求（50-100项流畅运行）
- 跨平台兼容性（Windows/Linux/macOS）
- 社区活跃度和文档完善度

### 12.2 数据加载策略

**一次性加载：**
- 启动时扫描所有 `commands/`、`skills/`、`mcp.json`
- 解析 YAML frontmatter 提取描述
- 构建内存数据结构
- 后续操作在内存中进行，无延迟

**数据结构示例：**
```javascript
{
  commands: [
    {
      name: 'git-commit',
      description: 'Commit staged changes',
      path: 'commands/git/commit.md',
      valid: true
    },
    ...
  ],
  skills: [
    {
      name: 'ui-ux-pro-max',
      description: 'UI/UX design intelligence',
      path: 'skills/ui-ux-pro-max',
      valid: true
    },
    ...
  ],
  mcp: [
    {
      name: 'context7',
      description: '',
      config: { /* MCP config */ },
      valid: true
    },
    ...
  ]
}
```

### 12.3 性能优化

**支持规模：**
- 50-100项左右，流畅运行
- 虚拟滚动（可选）：如果超过100项，使用虚拟滚动技术

**优化策略：**
- 增量渲染：仅渲染可见区域
- 防抖输入：搜索输入防抖处理
- 缓存描述：避免重复读取文件

### 12.4 YAML Frontmatter 解析

**解析逻辑：**
```javascript
function extractDescription(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 匹配 YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return '';

  // 解析 YAML（简单的键值对提取）
  const yaml = match[1];
  const descMatch = yaml.match(/description:\s*(.+)$/);
  return descMatch ? descMatch[1].trim() : '';
}
```

**错误处理：**
- YAML 解析失败：显示警告图标，描述留空
- 文件读取失败：显示错误图标，不允许选中

### 12.5 状态管理

**选择状态：**
- 每个页面维护独立的选择状态
- 切换 tab 时保存当前选择
- 最终确认时汇总所有 tab 的选择

**状态结构：**
```javascript
{
  step1: {
    selectedTypes: ['commands', 'skills']
  },
  step2: {
    commands: ['git-commit', 'npm-install'],
    skills: ['ui-ux-pro-max'],
    mcp: []
  }
}
```

## 13. 实现优先级

### Phase 1: MVP（最小可行产品）

- [x] 基础页面结构（类型选择 + 内容选择 + 确认）
- [x] Vim 键位导航（hjkl + 方向键）
- [x] 基本选择功能（Space/Enter）
- [x] 简单的列表显示（文件名 + 描述）
- [x] 进度条显示

### Phase 2: 核心功能

- [x] 搜索功能（实时过滤）
- [x] 批量操作（全选/反选/取消全选）
- [x] 实时验证（文件完整性检查）
- [x] 冲突检测和处理
- [x] 帮助页面

### Phase 3: 优化增强

- [ ] 布局自适应（响应式宽度）
- [ ] 颜色主题（自动检测终端能力）
- [ ] 首次使用引导
- [ ] 性能优化（虚拟滚动）
- [ ] 错误恢复机制

## 14. 配置选项

虽然设计上"保持简单"，但仍提供少量必要的配置选项：

### 14.1 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CC_DEVKIT_TUI_ENABLED` | 启用 TUI 模式 | `true` |
| `CC_DEVKIT_TUI_THEME` | 颜色主题 | `auto` |
| `CC_DEVKIT_FIRST_RUN` | 是否首次运行 | `true` |

### 14.2 CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--tui` | 强制启用 TUI | 自动检测 |
| `--no-tui` | 禁用 TUI，使用命令行模式 | - |
| `--dry-run` | 模拟运行，不实际修改文件 | - |

## 15. 测试用例

### 15.1 基础交互

- 测试 Vim 键位导航
- 测试批量操作（全选/反选/取消全选）
- 测试搜索功能
- 测试 Tab 切换

### 15.2 边界情况

- 空列表（无 commands/skills/MCP）
- 超长文件名和描述
- 特殊字符处理
- 终端尺寸变化

### 15.3 错误处理

- 文件读取失败
- YAML 解析错误
- 冲突解决流程
- 同步中断恢复

## 16. 文档和维护

### 16.1 用户文档

- README.md 中添加 TUI 使用说明
- 提供键盘快捷键速查表
- 录制演示视频（可选）

### 16.2 开发者文档

- TUI 模块架构说明
- 数据流转图
- 扩展开发指南（如添加新类型）

---

## 附录：关键决策记录

1. **为什么选择 Vim 键位为主？**
   - 用户明确倾向于 Vim 风格
   - 方向键为辅，降低学习曲线

2. **为什么需要二次确认？**
   - 避免误操作导致的数据丢失
   - 让用户在提交前检查选择

3. **为什么仅支持当前 tab 搜索？**
   - 简化交互逻辑
   - 减少用户困惑

4. **为什么默认全部不勾选？**
   - 更安全，避免意外同步不需要的内容
   - 虽然增加操作步骤，但提供批量操作快捷键

5. **为什么选择一次性加载而非懒加载？**
   - 数据规模可控（50-100项）
   - 简化实现，提升响应速度
   - 减少复杂度

---

**版本：** 1.0.0
**最后更新：** 2025-01-27
**状态：** 待评审
