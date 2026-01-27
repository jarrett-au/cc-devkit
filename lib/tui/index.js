/**
 * cc-devkit TUI Main Entry Point
 */

const blessed = require('blessed');
const screenManager = require('./screen');
const stateManager = require('./state');
const { TypeSelectPage, ContentSelectPage, SummaryPage, HelpPage } = require('./pages');
const path = require('path');
const fs = require('fs');

/**
 * TUI Application class
 */
class TUIApplication {
  constructor(sourceDir) {
    this.sourceDir = sourceDir;
    this.screen = null;
    this.pages = {};
    this.initialized = false;
  }

  /**
   * Initialize TUI
   * @returns {boolean} True if successful
   */
  init() {
    // Initialize screen
    if (!screenManager.init()) {
      console.error('Failed to initialize blessed. Install with: npm install blessed');
      return false;
    }

    this.screen = screenManager.getScreen();

    // Load data
    this._loadData();

    // Subscribe to state changes
    stateManager.subscribe(() => this._onStateChange());

    // Initialize pages
    this._initPages();

    // Initial render
    this.render();

    this.initialized = true;
    return true;
  }

  /**
   * Load data from source directory
   * @private
   */
  _loadData() {
    const { getMarkdownFiles, getSkillDirectories, parseMcpJson } = require('./utils');
    const commandsDir = path.join(this.sourceDir, 'commands');
    const skillsDir = path.join(this.sourceDir, 'skills');
    const mcpJsonPath = path.join(this.sourceDir, 'mcp.json');

    // Load commands
    const commands = getMarkdownFiles(commandsDir, commandsDir);

    // Load skills
    const skills = getSkillDirectories(skillsDir);

    // Load MCP
    const mcp = parseMcpJson(mcpJsonPath);

    // Sort by name
    commands.sort((a, b) => a.name.localeCompare(b.name));
    skills.sort((a, b) => a.name.localeCompare(b.name));
    mcp.sort((a, b) => a.name.localeCompare(b.name));

    // Update state
    stateManager.set('data.commands', commands);
    stateManager.set('data.skills', skills);
    stateManager.set('data.mcp', mcp);
    stateManager.set('data.loaded', true);
  }

  /**
   * Initialize pages
   * @private
   */
  _initPages() {
    this.pages = {
      'type-select': new TypeSelectPage(this.screen),
      'content-select': new ContentSelectPage(this.screen),
      'summary': new SummaryPage(this.screen),
      'help': new HelpPage(this.screen)
    };
  }

  /**
   * Handle state changes
   * @private
   */
  _onStateChange() {
    if (this.initialized) {
      this.render();
    }
  }

  /**
   * Render current page
   */
  render() {
    if (!this.screen) return;

    const currentPage = stateManager.get('currentPage');
    const helpVisible = stateManager.get('ui.helpVisible');
    const exitConfirm = stateManager.get('ui.exitConfirm') || 0;

    // Clear screen with background
    const colors = screenManager.getColorScheme();
    this.screen.append(new blessed.Box({
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: colors.bg
      }
    }));

    // Render current page or help
    if (helpVisible) {
      this.pages.help.render();
    } else if (this.pages[currentPage]) {
      this.pages[currentPage].render();
    }

    // Render exit confirmation if needed
    if (exitConfirm > 0) {
      this._renderExitConfirm();
    }

    this.screen.render();
  }

  /**
   * Render exit confirmation
   * @private
   */
  _renderExitConfirm() {
    const colors = screenManager.getColorScheme();

    const confirmBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 45,
      height: 7,
      content: '\n  Exit confirmation\n  ──────────────────────────\n  Are you sure you want to exit?\n\n  Any unsaved changes will be lost.\n\n  Press Esc again to confirm',
      style: {
        fg: colors.fg,
        bg: colors.bg,
        border: {
          fg: colors.warning
        }
      },
      border: {
        type: 'line'
      }
    });

    this.screen.append(confirmBox);
  }

  /**
   * Start TUI
   */
  start() {
    if (!this.init()) {
      return false;
    }

    return true;
  }

  /**
   * Stop TUI
   */
  stop() {
    // Destroy all pages
    Object.values(this.pages).forEach(page => {
      if (page.destroy) {
        page.destroy();
      }
    });

    if (this.screen) {
      this.screen.destroy();
      this.screen = null;
    }
    screenManager.destroy();
    this.initialized = false;
  }
}

/**
 * Create and start TUI
 * @param {string} sourceDir - Source directory path
 * @returns {boolean} True if successful
 */
function createTUI(sourceDir) {
  const app = new TUIApplication(sourceDir);
  return app.start();
}

module.exports = {
  TUIApplication,
  createTUI
};
