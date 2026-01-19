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
            from: null, // New option for remote source
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
            } else if (arg === '--from') {
                options.from = args[++i];
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

        // --- Step 0: Handle Remote Source ---
        let sourceCwd = process.cwd();
        let tempDir = null;

        if (options.from) {
            log.info(`Fetching configuration from ${options.from}...`);
            tempDir = path.join(os.tmpdir(), `cc-devkit-${Date.now()}`);
            const repoUrl = normalizeRepoUrl(options.from);
            
            try {
                // Using git clone for simplicity and robustness
                // Check if git exists
                try {
                    child_process.execSync('git --version', { stdio: 'ignore' });
                } catch (e) {
                    throw new Error('Git is required for --from functionality. Please install Git.');
                }

                // Clone to temp dir
                if (options.dryRun) {
                    log.dryRun(`Would clone ${repoUrl} to ${tempDir}`);
                    // For dry run, we can't proceed with validation of remote files unless we actually clone.
                    // But cloning is a read-only op for the USER system (temp dir), so maybe we should actually clone?
                    // Let's actually clone even in dry-run to validate the SOURCE structure, 
                    // unless it's too heavy. But validation is key.
                    // Let's clone. It's a temp dir read op.
                    log.info(`(Dry Run) Cloning repository to inspect structure...`);
                }
                
                child_process.execSync(`git clone ${repoUrl} "${tempDir}" --depth 1`, { stdio: 'inherit' });
                sourceCwd = tempDir;
                log.success(`Repository cloned.`);

            } catch (e) {
                throw new Error(`Failed to fetch remote configuration: ${e.message}`);
            }
        }

        // 2. Validate Environment (Source files)
        log.info(`Initializing sync for ${options.platforms.join(', ')} (${options.scope} scope)...`);
        
        // Use sourceCwd instead of process.cwd()
        const missingDirs = CONFIG.requiredSourceDirs.filter(d => !fs.existsSync(path.join(sourceCwd, d)));
        const missingFiles = CONFIG.requiredSourceFiles.filter(f => !fs.existsSync(path.join(sourceCwd, f)));

        if (missingDirs.length > 0 || missingFiles.length > 0) {
            // Friendly error for empty run
            if (!options.from && sourceCwd === process.cwd()) {
                 throw new Error(
                    `Current directory is not a valid cc-devkit configuration repository.\n` +
                    `\n` +
                    `Usage:\n` +
                    `  1. Sync from a remote repo: npx cc-devkit --init claude --from <user/repo>\n` +
                    `  2. Sync from current dir:   Run this command inside a valid config repo.\n` +
                    `\n` +
                    `Missing required files:\n` +
                    [...missingDirs.map(d => `  - ${d}/`), ...missingFiles.map(f => `  - ${f}`)].join('\n')
                );
            }
            
            throw new Error(`Missing required source files/directories in ${options.from ? 'remote repo' : 'current directory'}:\n` +
                [...missingDirs.map(d => `  - ${d}/`), ...missingFiles.map(f => `  - ${f}`)].join('\n'));
        }

        if (!fs.existsSync(path.join(sourceCwd, 'README.md'))) {
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
            const srcDir = path.join(sourceCwd, dir);
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
        const srcConfigPath = path.join(sourceCwd, 'mcp.json');
        const count = mergeMcpConfig(srcConfigPath, targetPaths.config, options.dryRun);
        
        if (options.dryRun) {
            log.dryRun(`Would merge ${count} MCP servers`);
        } else {
            log.success(`Merged ${count} MCP servers`);
        }

        console.log("");
        log.success(`Successfully synced to ${options.scope} scope`);
        
        // Cleanup temp dir
        if (tempDir) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } catch (e) {
                // Ignore cleanup errors
            }
        }

    } catch (err) {
        log.error(err.message);
        process.exit(1);
    }
}

// --- Helpers ---

function normalizeRepoUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('git@')) {
        return url;
    }
    // Assume owner/repo format
    const parts = url.split('/');
    if (parts.length === 2) {
        return `https://github.com/${url}.git`;
    }
    throw new Error(`Invalid repository format: ${url}. Use 'owner/repo' or full URL.`);
}

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
    // Logic: Merge keys from mcp.json into the "mcpServers" key of the target config.
    // If "mcpServers" doesn't exist in target, create it.
    
    const count = Object.keys(srcConfig).length;
    
    // Ensure mcpServers object exists in dest
    if (!destConfig.mcpServers) {
        destConfig.mcpServers = {};
    }

    // Merge srcConfig (which is a map of servers) into destConfig.mcpServers
    destConfig.mcpServers = {
        ...destConfig.mcpServers,
        ...srcConfig
    };

    if (!dryRun) {
        fs.writeFileSync(destPath, JSON.stringify(destConfig, null, 2));
    }

    return count;
}

function showHelp() {
    console.log(`
Usage: cc-devkit --init <platform> [options]

Options:
  --scope <user|project>   Configuration scope (default: user)
  --from <url|repo>        Sync from a remote git repository (e.g. user/repo)
  --dry-run                Preview changes without modifying files
  --help                   Show this help message
    `);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
