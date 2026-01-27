/**
 * TUI Utility Functions
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract description from YAML frontmatter
 * @param {string} filePath - Path to markdown file
 * @returns {string} Description text
 */
function extractDescription(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Match YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return '';

    // Extract description field
    const yaml = match[1];
    const descMatch = yaml.match(/description:\s*(.+)$/m);
    return descMatch ? descMatch[1].trim() : '';
  } catch (error) {
    return '';
  }
}

/**
 * Check if terminal supports color
 * @returns {boolean} True if color is supported
 */
function supportsColor() {
  // Check environment variables
  if (process.env.NO_COLOR || process.env.CC_DEVKIT_NO_COLOR) {
    return false;
  }

  // Detect TERM
  const term = process.env.TERM || '';
  if (term.includes('dumb') || term === 'unknown') {
    return false;
  }

  // Windows special handling
  if (process.platform === 'win32') {
    return true; // Windows 10+ supports color
  }

  // Check if in TTY
  return process.stdout.isTTY;
}

/**
 * Format list item with checkbox and description
 * @param {string} name - Item name
 * @param {string} description - Item description
 * @param {boolean} selected - Selection state
 * @param {number} maxWidth - Maximum width for text
 * @returns {string} Formatted list item
 */
function formatListItem(name, description, selected, maxWidth = 80) {
  const checkbox = selected ? '☑' : '⬜';

  // Calculate available width for description
  const nameWidth = name.length;
  const checkboxWidth = 2;
  const spacing = 2;
  const availableWidth = maxWidth - checkboxWidth - spacing - nameWidth - spacing;

  let displayDesc = description || '';
  if (displayDesc.length > availableWidth && availableWidth > 3) {
    displayDesc = displayDesc.substring(0, availableWidth - 3) + '...';
  } else if (availableWidth <= 3) {
    displayDesc = '';
  }

  if (displayDesc) {
    return `${checkbox} ${name}${' '.repeat(spacing)}${displayDesc}`;
  } else {
    return `${checkbox} ${name}`;
  }
}

/**
 * Check if file exists and is valid
 * @param {string} filePath - Path to file
 * @returns {boolean} True if file is valid
 */
function isValidFile(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Check if directory exists and is valid
 * @param {string} dirPath - Path to directory
 * @returns {boolean} True if directory is valid
 */
function isValidDirectory(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Get all markdown files from a directory recursively
 * @param {string} dirPath - Directory path
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array} Array of file objects
 */
function getMarkdownFiles(dirPath, baseDir = dirPath) {
  const files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        files.push(...getMarkdownFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relativePath = path.relative(baseDir, fullPath);
        const name = relativePath.replace(/\.md$/, '').replace(/\\/g, '/');

        files.push({
          name: name,
          path: fullPath,
          relativePath: relativePath,
          description: extractDescription(fullPath),
          valid: isValidFile(fullPath)
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist or cannot be read
  }

  return files;
}

/**
 * Get all skill directories
 * @param {string} skillsDir - Skills directory path
 * @returns {Array} Array of skill objects
 */
function getSkillDirectories(skillsDir) {
  const skills = [];

  try {
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsDir, entry.name);
        const skillMdPath = path.join(skillPath, 'skill.md');

        skills.push({
          name: entry.name,
          path: skillPath,
          relativePath: entry.name,
          description: isValidFile(skillMdPath) ? extractDescription(skillMdPath) : '',
          valid: isValidDirectory(skillPath)
        });
      }
    }
  } catch (error) {
    // Directory doesn't exist or cannot be read
  }

  return skills;
}

/**
 * Read and parse MCP JSON
 * @param {string} mcpJsonPath - Path to mcp.json
 * @returns {Object} Parsed MCP configuration
 */
function parseMcpJson(mcpJsonPath) {
  try {
    const content = fs.readFileSync(mcpJsonPath, 'utf-8');
    const config = JSON.parse(content);

    // Extract mcpServers
    const servers = config.mcpServers || {};

    return Object.entries(servers).map(([name, serverConfig]) => ({
      name: name,
      config: serverConfig,
      valid: true
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Calculate layout dimensions based on screen size
 * @param {Object} screen - Blessed screen object
 * @returns {Object} Layout dimensions
 */
function calculateLayout(screen) {
  const width = screen.width;
  const height = screen.height;

  return {
    // Tab bar
    tabBar: {
      top: 0,
      left: 0,
      width: '100%',
      height: 1
    },
    // Main content area
    content: {
      top: 2,
      left: 1,
      width: width - 2,
      height: height - 8
    },
    // Search box
    search: {
      top: height - 5,
      left: 2,
      width: width - 4,
      height: 1
    },
    // Status bar
    status: {
      top: height - 3,
      left: 0,
      width: '100%',
      height: 3
    }
  };
}

module.exports = {
  extractDescription,
  supportsColor,
  formatListItem,
  isValidFile,
  isValidDirectory,
  getMarkdownFiles,
  getSkillDirectories,
  parseMcpJson,
  calculateLayout
};
