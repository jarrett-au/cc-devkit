# cc-devkit Specification

## 痛点

Claude Code、Codex 等 Vibe IDE 工具不支持跨平台、跨应用同步配置，导致在不同平台、不同应用之间切换时，需要重复配置，增加了开发成本。

## 功能概述

cc-devkit 是一个轻量级命令行工具，用于将 `commands/`、`skills/`、`mcp.json` 配置同步到 Vibe IDE 应用（目前仅支持 Claude Code）的配置目录。

**使用场景：** 用户克隆包含配置的 GitHub 仓库到本地后，通过 `cc-devkit --init claude` 一键同步配置。

## 核心功能

### 1. 多平台支持

- **当前支持：** Claude Code (`claude`)
- **未来支持：** Codex (`codex`)、OpenCode (`opencode`)
- **多平台同步：** 可空格分隔一次性同步多个平台
  ```bash
  cc-devkit --init claude opencode
  ```

### 2. 双域同步（Scope）

支持两种配置作用域：

| Scope | 目标路径 | 说明 |
|-------|---------|------|
| `user` | `~/.claude/` | 用户级配置（默认） |
| `project` | `./.claude/` | 项目级配置 |

同时同步两个域：保持 `user` 和 `project` scope 配置一致。

### 3. 配置合并策略

#### 文件复制（commands/、skills/）
- **保留目录结构：** 嵌套目录完整复制
  - `commands/category/command_1.md` → `~/.claude/commands/category/command_1.md`
  - `skills/category/skill_1/` → `~/.claude/skills/category/skill_1/`
- **覆盖策略：** 总是覆盖现有文件
- **其他行为：**
  - 包含隐藏文件（`.` 开头）
  - 跳过空目录
  - 自动创建父目录
  - 遇到符号链接失败
  - 保留文件权限
  - 无文件大小限制
  - 复制所有文件类型（包括二进制）

#### MCP 配置合并
- **源文件：** 仓库根目录的 `mcp.json`
- **目标文件：**
  - User scope: `~/.claude.json`
  - Project scope: `./.claude.json`
- **合并策略：** 浅合并（Shallow Merge）
  - 如果服务器名已存在，整个配置替换
  - 如果服务器名不存在，添加新配置
- **冲突策略：** Project scope 优先于 User scope
- **验证：** 仅 JSON 语法验证
- **Windows 适配：** 自动检测平台并包装 `npx` 命令
  - 检测到 `command: "npx"` 时，自动转换为 `command: "cmd", args: ["/c", "npx", ...]`

## 命令行接口

### 基本语法

```bash
cc-devkit --init <platform> [platform...] [options]
```

### 参数

- `<platform>`: 要同步的平台（当前仅支持 `claude`）

### 选项

| Flag | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--scope <user|project>` | string | `user` | 配置作用域 |
| `--dry-run` | boolean | `false` | 预览模式，不实际修改文件 |
| `--help` | boolean | `false` | 显示详细帮助信息 |

### 环境变量

支持通过环境变量配置，优先级：**Env > Flags > Default**

```bash
export CC_DEVKIT_SCOPE=project
cc-devkit --init claude  # 使用 project scope
```

## 目录结构

### 源仓库结构（严格）

```
repo-root/
├── commands/
│   └── category/
│       └── command_1.md
├── skills/
│   └── category/
│       └── skill_1/
│           └── SKILL.md
├── mcp.json
└── README.md  # 必需
```

**要求：**
- `commands/`、`skills/`、`mcp.json` 必须位于仓库根目录
- 如果任一源文件/目录不存在，同步失败并中止
- 必须包含 README.md 说明文档

### cc-devkit 输出结构

```
~/.cc-devkit/
├── backups/
│   └── .claude.json.20250120-143022.backup
└── logs/  # 未来扩展
```

## 执行流程

1. **验证环境**
   - 检测当前平台（Windows/macOS/Linux）
   - 检查源目录是否存在（commands/、skills/、mcp.json）
   - 如果 `--dry-run`，添加输出前缀 `[DRY RUN]`

2. **备份现有配置**
   - 创建目标配置的备份到 `~/.cc-devkit/backups/`
   - 文件名格式：`.<filename>.<timestamp>.backup`
   - 清理旧备份，仅保留最新备份
   - 显示备份路径

3. **同步配置**（顺序执行）
   - 复制 `commands/` → `<target>/commands/`
   - 复制 `skills/` → `<target>/skills/`
   - 合并 `mcp.json` → `<target>/../claude.json`

4. **输出结果**
   - 显示视觉进度指示（spinner 或 progress bar）
   - 详细输出每个操作
   - 成功后显示摘要统计（复制的文件数、合并的服务器数）
   - 自动检测终端颜色支持

## 错误处理

### 错误策略
- **快速失败 + 回滚：** 任何错误立即停止，回滚已做的修改
- **友好错误消息：** 清晰说明问题和建议的修复方法
- **退出码：**
  - `0`: 成功
  - `1`: 任何错误

### 错误场景

| 场景 | 行为 |
|------|------|
| 源目录不存在 | 错误并中止 |
| JSON 语法错误 | 错误并中止 |
| 权限拒绝 | 错误并回滚 |
| 符号链接 | 错误并中止 |
| 磁盘空间不足 | 错误并回滚 |

## MCP 配置示例

### 源文件（mcp.json）

```json
{
  "vibe_kanban": {
    "command": "npx",
    "args": [
      "-y",
      "vibe-kanban@latest",
      "--mcp"
    ]
  }
}
```

### Windows 自动转换后

```json
{
  "vibe_kanban": {
    "command": "cmd",
    "args": [
      "/c",
      "npx",
      "-y",
      "vibe-kanban@latest",
      "--mcp"
    ]
  }
}
```

## 技术实现

### 技术栈
- **语言：** JavaScript (CommonJS)
- **运行时：** Node.js 18+ (LTS)
- **依赖：** 零依赖（仅 Node.js 内置模块）
- **模块系统：** CommonJS (`require/module.exports`)

### 安装与执行
- **方式：** 仅通过 `npx` 执行（无需全局安装）
- **包名：** `cc-devkit`
- **命令：**
  ```bash
  npx cc-devkit --init claude
  ```

### 关键实现细节
- **文件编码：** 自动检测
- **文件操作：** 顺序执行（非并行）
- **日志输出：** 仅控制台
- **进度指示：** 视觉进度（需要手动实现，零依赖）
- **信号处理：** Node.js 默认处理

## 使用示例

### 基本用法

```bash
# 同步到用户级配置（默认）
npx cc-devkit --init claude

# 同步到项目级配置
npx cc-devkit --init claude --scope project

# 预览将要同步的配置
npx cc-devkit --init claude --dry-run
```

### 环境变量配置

```bash
export CC_DEVKIT_SCOPE=project
npx cc-devkit --init claude
```

### 多平台同步（未来）

```bash
# 同时同步到 Claude Code 和 OpenCode
npx cc-devkit --init claude opencode
```

## 输出示例

### 成功输出

```
✓ Backing up ~/.claude.json to ~/.cc-devkit/backups/.claude.json.20250120-143022.backup
⠋ Copying commands...
✓ Copied 12 commands
⠋ Copying skills...
✓ Copied 5 skills
⠋ Merging MCP configs...
✓ Merged 3 MCP servers

✓ Successfully synced to user scope
  Summary: 12 commands, 5 skills, 3 MCP servers
```

### Dry Run 输出

```
[DRY RUN] ✓ Backing up ~/.claude.json to ~/.cc-devkit/backups/.claude.json.20250120-143022.backup
[DRY RUN] ⠋ Copying commands...
[DRY RUN] ✓ Copied 12 commands
[DRY RUN] ⠋ Copying skills...
[DRY RUN] ✓ Copied 5 skills
[DRY RUN] ⠋ Merging MCP configs...
[DRY RUN] ✓ Merged 3 MCP servers

[DRY RUN] ✓ Successfully synced to user scope
  Summary: 12 commands, 5 skills, 3 MCP servers
```

## 未来扩展

以下功能已预留设计，但暂不实现：

- **多平台支持：** Codex、OpenCode 等平台配置同步
- **日志文件：** 将详细日志写入 `~/.cc-devkit/logs/`
- **远程配置：** 支持从远程 URL 获取配置
- **配置文件：** 支持 `cc-devkit.json` 持久化配置
- **清理命令：** `cc-devkit --clean` 移除已同步的配置
- **自动更新：** cc-devkit 自身的版本检查和更新