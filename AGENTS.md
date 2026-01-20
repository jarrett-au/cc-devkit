# AGENTS.md

This file provides guidance to AI coding agents working on the cc-devkit repository.

## Project Overview

cc-devkit is a zero-dependency Node.js CLI tool for synchronizing Claude Code configurations from Git repositories. The entire application is a single executable file (~375 lines) with no build step.

## Development Commands

```bash
# Run the tool locally
node bin/cc-devkit.js --init claude

# Run with dry-run mode (no file modifications)
node bin/cc-devkit.js --init claude --dry-run

# Sync from remote repository
node bin/cc-devkit.js --init claude --from owner/repo

# Project scope sync
node bin/cc-devkit.js --init claude --scope project

# Note: No test framework is configured. To add tests:
# 1. Choose a test framework (jest, vitest, mocha, etc.)
# 2. Add test scripts to package.json
# 3. Create test files in tests/ or __tests__/

# Note: No linting/formatting tools are configured. To add them:
# 1. ESLint for linting: npm install --save-dev eslint
# 2. Prettier for formatting: npm install --save-dev prettier
# 3. Add npm scripts: "lint", "format", "typecheck" (if using TypeScript)
```

## Code Style Guidelines

### Module System
- **Use CommonJS**: `require()` and `module.exports` only
- **No build step**: Code runs directly via Node.js, no transpilation
- **Zero dependencies**: Use only Node.js built-in modules (`fs`, `path`, `os`, `child_process`, etc.)

### File Structure
- Single executable: `bin/cc-devkit.js`
- Shebang required: `#!/usr/bin/env node` at the top
- No TypeScript type annotations (plain JavaScript)

### Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `CONFIG`, `COLORS`)
- **Variables/Functions**: `camelCase` (e.g., `normalizeRepoUrl`, `sourceCwd`)
- **Private helpers**: Prefix with underscore (optional, e.g., `_validatePath`)

### Code Patterns
- **Async operations**: Use `async/await` for asynchronous code
- **Error handling**: Always wrap critical operations in `try/catch`
- **File operations**: Use sync methods for simplicity (`fs.readFileSync`, `fs.writeFileSync`, `fs.copyFileSync`)
- **CLI arguments**: Parse manually from `process.argv.slice(2)`

### Object & Array Patterns
- Use spread operator: `{ ...destConfig.mcpServers, ...srcConfig }`
- Use `for...of` loops for iteration: `for (const dir of CONFIG.requiredSourceDirs)`
- Use array methods: `filter()`, `map()`, `join()`

### String Formatting
- Use template literals: `console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`)`
- ANSI color codes for terminal output (defined in `COLORS` constant)

### Comments & Documentation
- Use JSDoc-style comments for functions
- Keep comments concise and focused on "why", not "what"
- No inline comments for obvious code

### Error Messages
- Provide clear, actionable error messages
- Include usage examples when appropriate
- Prefix with "Error:" for consistency

### File Paths
- Use `path.join()` for cross-platform compatibility
- Use `path.join(os.homedir(), '.claude')` for user directory paths
- Use `path.join(process.cwd(), '.claude')` for project directory paths

### JSON Handling
- Use `JSON.stringify(obj, null, 2)` for pretty-printing (2-space indentation)
- Always wrap `JSON.parse()` in try/catch

### Console Output
- Use custom `log` object methods: `log.info()`, `log.success()`, `log.warn()`, `log.error()`, `log.dryRun()`
- Include visual indicators: `✓` (success), `⚠` (warning), `✗` (error)

### Platform-Specific Code
- Detect platform with `os.platform()` (returns 'win32', 'darwin', 'linux')
- Use conditional logic for platform-specific behavior (e.g., Windows `npx` → `cmd` adaptation)

### Backup System
- Store backups in `~/.cc-devkit/backups/`
- Filename pattern: `.<filename>.<timestamp>.backup`
- Auto-cleanup: Keep only latest backup per file type
- Timestamp format: ISO string with `:` and `.` replaced by `-`

### Execution Flow
1. Parse CLI arguments and environment variables
2. Clone remote repository (if `--from` is provided)
3. Validate required files/directories exist
4. Create backup of existing config
5. Copy `commands/` and `skills/` directories (recursive, overwrite existing)
6. Merge `mcp.json` into target config's `mcpServers` key (shallow merge)
7. Cleanup temporary clone directory

## Important Constraints

- **No external dependencies**: Everything must use Node.js built-in modules
- **No build step**: Code must run directly via `node` or `npx`
- **CommonJS only**: No ES modules (`import/export`)
- **Single file architecture**: Keep the tool in one executable file
- **Zero installation**: Tool must work via `npx cc-devkit` without pre-installation
