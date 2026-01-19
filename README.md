# cc-devkit

**Configuration synchronization tool for Vibe IDEs (Claude Code).**

`cc-devkit` helps you sync `commands`, `skills`, and MCP configurations from a Git repository (or local folder) directly to your Claude Code environment.

## 🚀 Quick Start

### Sync from a Remote Repository (Recommended)

You don't need to install anything. Just run:

```bash
npx cc-devkit --init claude --from jarrett-au/cc-awesome-config
```

*Replace `jarrett-au/cc-awesome-config` with any valid GitHub repository.*

### Sync from Local Directory

If you are developing your own configuration:

```bash
cd my-claude-config
npx cc-devkit --init claude
```

## ✨ Features

*   **Remote Sync**: Pull configurations directly from GitHub without cloning manually.
*   **Smart Merge**:
    *   **Files**: Recursively copies `commands/` and `skills/`.
    *   **MCP Config**: Merges `mcp.json` servers into your local configuration (`mcpServers` key), preserving existing servers.
*   **Safety First**:
    *   **Backup**: Automatically backs up your existing config before changes.
    *   **Dry Run**: Preview changes with `--dry-run` before applying them.
*   **Cross-Platform**: Works on Windows, macOS, and Linux. (Auto-adapts `npx` commands for Windows).

## 🛠 Usage

```bash
npx cc-devkit --init claude [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from <repo>` | Sync from a remote git repository (e.g. `user/repo` or full URL) | `null` |
| `--scope <type>`| Target scope: `user` (`~/.claude/`) or `project` (`./.claude/`) | `user` |
| `--dry-run` | Preview changes without modifying files | `false` |
| `--help` | Show help message | `false` |

## 📂 Creating Your Own Config Repository

To create a shareable configuration repository, create a Git repo with this structure:

```
my-config-repo/
├── commands/         # Markdown files for custom commands
│   └── my-cmd.md
├── skills/           # Custom skills
│   └── my-skill/
│       └── SKILL.md
├── mcp.json          # MCP servers to add
└── README.md         # Required
```

### `mcp.json` Format

Define the servers you want to add. They will be merged into the user's config.

```json
{
  "my-server": {
    "command": "npx",
    "args": ["-y", "my-server-package"]
  }
}
```

## 📦 Examples

Check out the [examples/](examples/) directory in this repository for a sample structure.

## License

ISC
