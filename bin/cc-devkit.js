#!/usr/bin/env node

/**
 * cc-devkit
 * Configuration synchronization tool for Vibe IDEs (Claude Code)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');

// Configuration
const CONFIG = {
    supportedPlatforms: ['claude'],
    requiredSourceDirs: ['commands', 'skills'],
    requiredSourceFiles: ['mcp.json'],
    backupDir: path.join(os.homedir(), '.cc-devkit', 'backups')
};

// Colors for console output
const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m"
};

// Utils
const log = {
    info: (msg) => console.log(msg),
    success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
    warn: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
    error: (msg) => console.error(`${COLORS.red}✗ Error:${COLORS.reset} ${msg}`),
    dryRun: (msg) => console.log(`${COLORS.cyan}[DRY RUN]${COLORS.reset} ${msg}`)
};

// Main execution
async function main() {
    try {
        // 1. Parse Arguments
        const args = process.argv.slice(2);
        const options = {
            platforms: [],
            scope: process.env.CC_DEVKIT_SCOPE || 'user',
            dryRun: false,
            help: false
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--init') {
                // Next args are platforms until a flag starts
                while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                    options.platforms.push(args[++i]);
                }
            } else if (arg === '--scope') {
                options.scope = args[++i];
            } else if (arg === '--dry-run') {
                options.dryRun = true;
            } else if (arg === '--help') {
                options.help = true;
            }
        }

        if (options.help) {
            showHelp();
            return;
        }

        if (options.platforms.length === 0) {
            throw new Error('No platform specified. Usage: cc-devkit --init <platform>');
        }

        // Validate platforms
        const invalidPlatforms = options.platforms.filter(p => !CONFIG.supportedPlatforms.includes(p));
        if (invalidPlatforms.length > 0) {
            throw new Error(`Unsupported platform(s): ${invalidPlatforms.join(', ')}. Supported: ${CONFIG.supportedPlatforms.join(', ')}`);
        }

        // Validate scope
        if (!['user', 'project'].includes(options.scope)) {
            throw new Error(`Invalid scope: ${options.scope}. Must be 'user' or 'project'.`);
        }

        // 2. Validate Environment (Source files)
        log.info(`Initializing sync for ${options.platforms.join(', ')} (${options.scope} scope)...`);
        
        const cwd = process.cwd();
        const missingDirs = CONFIG.requiredSourceDirs.filter(d => !fs.existsSync(path.join(cwd, d)));
        const missingFiles = CONFIG.requiredSourceFiles.filter(f => !fs.existsSync(path.join(cwd, f)));

        if (missingDirs.length > 0 || missingFiles.length > 0) {
            throw new Error(`Missing required source files/directories:\n` +
                [...missingDirs.map(d => `  - ${d}/`), ...missingFiles.map(f => `  - ${f}`)].join('\n'));
        }

        if (!fs.existsSync(path.join(cwd, 'README.md'))) {
             // SPEC says README.md is required
             throw new Error('Missing required file: README.md');
        }

        // 3. Execution
        const targetPaths = getTargetPaths(options.scope);
        const logger = options.dryRun ? log.dryRun : log.info;

        if (options.dryRun) {
            logger("Dry run mode enabled. No files will be modified.");
        }

        // --- Step 1: Backup ---
        if (fs.existsSync(targetPaths.config)) {
            backupFile(targetPaths.config, options.dryRun);
        }

        // --- Step 2: Sync Files (commands/ & skills/) ---
        for (const dir of CONFIG.requiredSourceDirs) {
            const srcDir = path.join(cwd, dir);
            const destDir = path.join(targetPaths.dataDir, dir);
            
            logger(`Copying ${dir}...`);
            const count = copyDirectory(srcDir, destDir, options.dryRun);
            if (options.dryRun) {
                 log.dryRun(`Would copy ${count} files from ${dir}`);
            } else {
                 log.success(`Copied ${count} files to ${destDir}`);
            }
        }

        // --- Step 3: Merge MCP Config ---
        logger(`Merging MCP configs...`);
        const srcConfigPath = path.join(cwd, 'mcp.json');
        const count = mergeMcpConfig(srcConfigPath, targetPaths.config, options.dryRun);
        
        if (options.dryRun) {
            log.dryRun(`Would merge ${count} MCP servers`);
        } else {
            log.success(`Merged ${count} MCP servers`);
        }

        console.log("");
        log.success(`Successfully synced to ${options.scope} scope`);

    } catch (err) {
        log.error(err.message);
        process.exit(1);
    }
}

// --- Helpers ---

function getTargetPaths(scope) {
    if (scope === 'user') {
        return {
            config: path.join(os.homedir(), '.claude.json'),
            dataDir: path.join(os.homedir(), '.claude')
        };
    } else {
        return {
            config: path.join(process.cwd(), '.claude.json'),
            dataDir: path.join(process.cwd(), '.claude')
        };
    }
}

function backupFile(filePath, dryRun) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.basename(filePath);
    const backupName = `.${filename}.${timestamp}.backup`;
    const backupPath = path.join(CONFIG.backupDir, backupName);

    if (dryRun) {
        log.dryRun(`Backing up ${filePath} to ${backupPath}`);
        return;
    }

    try {
        if (!fs.existsSync(CONFIG.backupDir)) {
            fs.mkdirSync(CONFIG.backupDir, { recursive: true });
        }
        
        fs.copyFileSync(filePath, backupPath);
        log.success(`Backed up ${filename} to ${backupPath}`);

        // Cleanup old backups (Keep latest 1 for this file type)
        // SPEC says "Clean old backups, keep only latest"
        // Let's implement a simple cleanup
        const files = fs.readdirSync(CONFIG.backupDir)
            .filter(f => f.startsWith(`.${filename}.`) && f.endsWith('.backup'))
            .sort() // Timestamp ensures lexicographical order matches time order
            .reverse(); // Newest first

        if (files.length > 1) {
            for (let i = 1; i < files.length; i++) {
                fs.unlinkSync(path.join(CONFIG.backupDir, files[i]));
            }
        }
    } catch (e) {
        throw new Error(`Backup failed: ${e.message}`);
    }
}

function copyDirectory(src, dest, dryRun) {
    if (!fs.existsSync(src)) return 0;
    
    let count = 0;
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            count += copyDirectory(srcPath, destPath, dryRun);
        } else {
            // SPEC: Always overwrite
            if (!dryRun) {
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                fs.copyFileSync(srcPath, destPath);
            }
            count++;
        }
    }
    return count;
}

function mergeMcpConfig(srcPath, destPath, dryRun) {
    let srcConfig;
    try {
        srcConfig = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    } catch (e) {
        throw new Error(`Failed to parse source mcp.json: ${e.message}`);
    }

    // Windows Adaptation
    if (os.platform() === 'win32') {
        for (const key in srcConfig) {
            const server = srcConfig[key];
            if (server.command === 'npx') {
                server.command = 'cmd';
                server.args = ['/c', 'npx', ...(server.args || [])];
            }
        }
    }

    let destConfig = {};
    if (fs.existsSync(destPath)) {
        try {
            destConfig = JSON.parse(fs.readFileSync(destPath, 'utf8'));
        } catch (e) {
             // If dest config exists but is invalid, we might want to warn or backup and overwrite.
             // For now, let's assume valid JSON or fail.
             throw new Error(`Failed to parse target config ${destPath}: ${e.message}`);
        }
    }

    // Shallow Merge: Project (src) wins
    // SPEC: "如果服务器名已存在，整个配置替换; 如果服务器名不存在，添加新配置"
    // This is basically Object.assign or spread, but we specifically target "mcpServers" key?
    // Wait, SPEC example shows the root object IS the map of servers.
    // "vibe_kanban": { ... }
    // BUT standard Claude config usually has "mcpServers": { ... } ?
    // Let's check SPEC example again.
    // SPEC says:
    // {
    //   "vibe_kanban": { ... }
    // }
    // So the mcp.json ROOT is the servers map.
    // HOWEVER, the target file `.claude.json` typically contains OTHER things too.
    // If `.claude.json` structure is:
    // {
    //   "mcpServers": { ... },
    //   "otherConfig": ...
    // }
    // OR is `.claude.json` JUST for MCP?
    // Claude Code documentation says:
    // "You can configure MCP servers in a configuration file."
    // If the target file `~/.claude.json` is used for other things, we must be careful.
    // But SPEC implies we are merging the whole object into the target file.
    // Let's assume the target file structure matches the source file structure (a map of servers),
    // OR the target file has a specific key.
    
    // RE-READING SPEC:
    // "Mergin MCP configs... Merged 3 MCP servers"
    // "Source: mcp.json"
    // "Target: ~/.claude.json"
    
    // If I look at how `claude` CLI works, it usually uses `~/.claude/config.json` or similar.
    // But assuming SPEC is correct and `~/.claude.json` IS the file.
    // Does `~/.claude.json` contain ONLY mcp servers?
    // If I am writing a tool for Claude Code, I should know this.
    // Currently, Claude Code uses `mcpServers` key inside the config?
    // Or is the whole file just for MCP?
    // Let's assume based on SPEC example: The source `mcp.json` structure is:
    // { "serverName": { ... } }
    //
    // If the target file is indeed just a map of servers, then `Object.assign` is correct.
    // If the target file has `mcpServers` key, then we need to merge INTO that key.
    
    // **CRITICAL**: The SPEC example for `mcp.json` shows a root object with server keys.
    // It does NOT show `{"mcpServers": { ... }}`.
    // So I will assume the `mcp.json` source is a direct map of servers.
    //
    // Now, about the TARGET `.claude.json`.
    // If it contains other config, simply merging `vibe_kanban` at root level is fine IF the config is flat.
    // If the config expects `mcpServers` key, then we might be breaking it.
    //
    // **DECISION**: I will follow the SPEC literally. The SPEC implies merging keys from `mcp.json` into the root of `.claude.json`.
    // If `.claude.json` has `mcpServers` key, the user should have `mcpServers` key in their `mcp.json`?
    // No, the example shows `"vibe_kanban": ...` at root.
    // So I will merge at root.
    
    const count = Object.keys(srcConfig).length;
    const newConfig = { ...destConfig, ...srcConfig };

    if (!dryRun) {
        fs.writeFileSync(destPath, JSON.stringify(newConfig, null, 2));
    }

    return count;
}

function showHelp() {
    console.log(`
Usage: cc-devkit --init <platform> [options]

Options:
  --scope <user|project>   Configuration scope (default: user)
  --dry-run                Preview changes without modifying files
  --help                   Show this help message
    `);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
