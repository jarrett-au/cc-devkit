# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`cc-devkit` is a zero-dependency Node.js CLI tool for synchronizing Claude Code configurations from Git repositories. Users can sync `commands/`, `skills/`, and `mcp.json` from remote repositories or local directories to their Claude Code environment.

## Architecture

### Single Binary Structure
- **Entry point:** `bin/cc-devkit.js` - The entire application is a single ~375-line executable file
- **Zero external dependencies** - Uses only Node.js built-in modules (`fs`, `path`, `os`, `child_process`)
- **CommonJS module system** - No build step, directly executable via `npx`

### Core Execution Flow

The `main()` function in `bin/cc-devkit.js:41-214` orchestrates the entire sync process:

1. **Argument parsing** - Parse CLI args and environment variables
2. **Remote source handling** - Optionally clone remote repository to temp directory
3. **Source validation** - Verify required `commands/`, `skills/`, `mcp.json`, `README.md` exist
4. **Backup** - Create timestamped backup of existing config in `~/.cc-devkit/backups/`
5. **File sync** - Recursively copy `commands/` and `skills/` directories
6. **MCP merge** - Shallow merge `mcp.json` into target's `mcpServers` key
7. **Cleanup** - Remove temporary clone directory

### Platform Support

Currently only supports `claude` platform. The design anticipates future platforms (`codex`, `opencode`) via the `supportedPlatforms` config array.

### Scope System

Two configuration scopes:
- **user scope** - Syncs to `~/.claude/` and `~/.claude.json` (default)
- **project scope** - Syncs to `./.claude/` and `./.claude.json`

### Key Implementation Details

**Windows `npx` Adaptation** (`bin/cc-devkit.js:314-322`):
On Windows, any MCP server with `command: "npx"` is automatically converted to `command: "cmd"` with `args: ["/c", "npx", ...original_args]`

**Shallow Merge Strategy** (`bin/cc-devkit.js:336-350`):
- Source `mcp.json` servers are merged into destination config's `mcpServers` object
- Existing server names are completely replaced (not deep merged)
- Creates `mcpServers` object if it doesn't exist

**Backup System** (`bin/cc-devkit.js:244-279`):
- Backups stored in `~/.cc-devkit/backups/`
- Filename pattern: `.<filename>.<timestamp>.backup`
- Only keeps the latest backup per file type (auto-cleanup)

**Repository URL Normalization** (`bin/cc-devkit.js:218-228`):
- Accepts `owner/repo` format → converts to `https://github.com/owner/repo.git`
- Accepts full URLs (http/https/git@) as-is
- Uses `git clone --depth 1` for minimal fetch

## Development Commands

No build step required. The tool is run directly via Node.js:

```bash
# Run from local source
node bin/cc-devkit.js --init claude

# Test with dry-run (no file modifications)
node bin/cc-devkit.js --init claude --dry-run

# Sync from remote repository
node bin/cc-devkit.js --init claude --from owner/repo

# Project scope sync
node bin/cc-devkit.js --init claude --scope project
```

## Testing Locally

To test the tool without publishing:

```bash
# Create a test config repo structure
mkdir test-config && cd test-config
mkdir commands skills
echo '{"test-server": {"command": "echo", "args": ["test"]}}' > mcp.json
echo "# Test Config" > README.md

# Run cc-devkit from parent directory
cd ..
npx cc-devkit --init claude --scope project
```

## Required Source Structure

A valid config repository must have in its root:
- `commands/` directory (with markdown files)
- `skills/` directory (with skill subdirectories)
- `mcp.json` (MCP server configurations)
- `README.md` (documentation)

## Configuration Priority

Environment variables > CLI flags > defaults:
```bash
export CC_DEVKIT_SCOPE=project  # Overrides --scope flag
```
