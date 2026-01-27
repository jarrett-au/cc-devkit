/**
 * cc-devkit TUI Main Entry Point
 */

const screenManager = require('./screen');
const stateManager = require('./state');
const { getMarkdownFiles, getSkillDirectories, parseMcpJson } = require('./utils');
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

    // Setup input handlers
    this._setupInputHandlers();

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
    // Lazy load pages to avoid circular dependencies
    // Pages will be created when needed
  }

  /**
   * Setup input handlers
   * @private
   */
  _setupInputHandlers() {
    // Input handlers are managed by individual pages
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

    // Clear screen
    this.screen.append(new blessed.Box({
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      style: {
        bg: screenManager.getColorScheme().bg
      }
    }));

    // Render current page
    switch (currentPage) {
      case 'type-select':
        this._renderTypeSelect();
        break;
      case 'content-select':
        this._renderContentSelect();
        break;
      case 'summary':
        this._renderSummary();
        break;
      case 'help':
        this._renderHelp();
        break;
    }

    // Render exit confirmation if needed
    this._renderExitConfirm();

    this.screen.render();
  }

  /**
   * Render type selection page
   * @private
   */
  _renderTypeSelect() {
    const layout = screenManager.getLayout();
    const colors = screenManager.getColorScheme();

    // Title
    this.screen.append(new blessed.Box({
      top: 1,
      left: 'center',
      width: 40,
      height: 1,
      content: 'Select sync types to configure:',
      style: {
        fg: colors.fg,
        bg: colors.bg
      }
    }));

    // Types list
    const types = [
      { name: 'commands', label: '📁 commands', desc: 'Sync command definitions' },
      { name: 'skills', label: '📦 skills', desc: 'Sync skill directories' },
      { name: 'mcp', label: '🔌 mcp', desc: 'Sync MCP server configurations' }
    ];

    const selectedIndex = stateManager.get('typeSelect.selectedIndex');
    const selectedTypes = stateManager.get('typeSelect.selectedTypes');

    types.forEach((type, index) => {
      const isSelected = selectedTypes.includes(type.name);
      const isFocused = index === selectedIndex;

      const checkbox = isSelected ? '☑' : '⬜';
      const focusPrefix = isFocused ? '> ' : '  ';
      const color = isFocused ? colors.selected : colors.fg;

      this.screen.append(new blessed.Box({
        top: 3 + index * 2,
        left: 'center',
        width: 50,
        height: 1,
        content: `${focusPrefix}${checkbox} ${type.label.padEnd(15)} ${type.desc}`,
        style: {
          fg: color,
          bg: colors.bg,
          bold: isFocused
        }
      }));
    });

    // Footer
    const selectedCount = selectedTypes.length;
    this.screen.append(new blessed.Box({
      top: layout.status.top,
      left: 'center',
      width: 50,
      height: 1,
      content: `Selected: ${selectedCount}/3    [Space: Toggle] [Enter: Confirm] [Esc: Exit]`,
      style: {
        fg: colors.fg,
        bg: colors.bg
      }
    }));
  }

  /**
   * Render content selection page
   * @private
   */
  _renderContentSelect() {
    const layout = screenManager.getLayout();
    const colors = screenManager.getColorScheme();

    // Tab bar
    const currentTab = stateManager.get('contentSelect.currentTab');
    const selectedTypes = stateManager.get('typeSelect.selectedTypes');

    let leftOffset = 2;
    selectedTypes.forEach((type, index) => {
      const isActive = type === currentTab;
      const colors2 = screenManager.getColorScheme();

      this.screen.append(new blessed.Box({
        top: layout.tabBar.top,
        left: leftOffset,
        width: 12,
        height: layout.tabBar.height,
        content: type,
        style: {
          fg: isActive ? colors2.bg : colors2.fg,
          bg: isActive ? colors2.selected : colors2.commands,
          bold: isActive
        }
      }));

      leftOffset += 13;
    });

    // Content area
    const data = stateManager.get(`data.${currentTab}`);
    const selections = stateManager.get(`contentSelect.selections.${currentTab}`);

    if (data && data.length > 0) {
      data.slice(0, 15).forEach((item, index) => {
        const isSelected = selections.includes(item.name);
        const checkbox = isSelected ? '☑' : '⬜';

        let displayText = `${checkbox} ${item.name}`;
        if (item.description) {
          displayText += `    ${item.description}`;
        }

        this.screen.append(new blessed.Box({
          top: layout.content.top + index,
          left: layout.content.left,
          width: layout.content.width,
          height: 1,
          content: displayText,
          style: {
            fg: colors.fg,
            bg: colors.bg
          }
        }));
      });
    } else {
      this.screen.append(new blessed.Box({
        top: layout.content.top,
        left: 'center',
        width: 30,
        height: 1,
        content: 'No items available',
        style: {
          fg: colors.fg,
          bg: colors.bg
        }
      }));
    }

    // Status bar
    const selectedCount = selections.length;
    const totalCount = data ? data.length : 0;

    this.screen.append(new blessed.Box({
      top: layout.status.top,
      left: 'center',
      width: 60,
      height: 1,
      content: `Selected: ${selectedCount}/${totalCount}    [a: All] [r: Reverse] [c: Clear] [Enter: Confirm]`,
      style: {
        fg: colors.fg,
        bg: colors.bg
      }
    }));
  }

  /**
   * Render summary page
   * @private
   */
  _renderSummary() {
    const layout = screenManager.getLayout();
    const colors = screenManager.getColorScheme();

    this.screen.append(new blessed.Box({
      top: 1,
      left: 'center',
      width: 40,
      height: 1,
      content: 'Summary of selected items:',
      style: {
        fg: colors.fg,
        bg: colors.bg,
        bold: true
      }
    }));

    let y = 3;
    const selectedTypes = stateManager.get('typeSelect.selectedTypes');

    selectedTypes.forEach(type => {
      const selections = stateManager.get(`contentSelect.selections.${type}`);
      const count = selections.length;

      if (count > 0) {
        this.screen.append(new blessed.Box({
          top: y,
          left: 4,
          width: 40,
          height: 1,
          content: `${type} (${count}):`,
          style: {
            fg: colors[type] || colors.fg,
            bg: colors.bg,
            bold: true
          }
        }));

        y++;

        selections.slice(0, 3).forEach(item => {
          this.screen.append(new blessed.Box({
            top: y,
            left: 6,
            width: 40,
            height: 1,
            content: `☑ ${item}`,
            style: {
              fg: colors.fg,
              bg: colors.bg
            }
          }));
          y++;
        });

        if (selections.length > 3) {
          this.screen.append(new blessed.Box({
            top: y,
            left: 6,
            width: 40,
            height: 1,
            content: `... and ${selections.length - 3} more`,
            style: {
              fg: colors.fg,
              bg: colors.bg
            }
          }));
          y++;
        }

        y++;
      }
    });

    // Total
    const totalCount = selectedTypes.reduce(
      (sum, type) => sum + stateManager.get(`contentSelect.selections.${type}`).length,
      0
    );

    this.screen.append(new blessed.Box({
      top: layout.status.top,
      left: 'center',
      width: 50,
      height: 1,
      content: `Total: ${totalCount} items    [Enter: Start Sync] [Esc: Back]`,
      style: {
        fg: colors.fg,
        bg: colors.bg
      }
    }));
  }

  /**
   * Render help page
   * @private
   */
  _renderHelp() {
    const layout = screenManager.getLayout();
    const colors = screenManager.getColorScheme();

    const helpText = [
      'Help - Keyboard Shortcuts',
      '',
      'Navigation:',
      '  hjkl / Arrows   Move cursor',
      '  Home/End        Jump to first/last item',
      '  PageUp/Down     Scroll page',
      '  Tab             Switch tabs',
      '',
      'Selection:',
      '  Space/Enter    Toggle selection',
      '  a              Select all',
      '  r              Reverse selection',
      '  c              Clear all selections',
      '',
      'Search:',
      '  /              Enter search mode',
      '  Esc            Exit search mode',
      '',
      'Other:',
      '  ?              Show this help',
      '  Esc            Exit/Back'
    ];

    // Help box
    const helpBox = blessed.box({
      top: 'center',
      left: 'center',
      width: 50,
      height: 20,
      label: ' Help ',
      tags: true,
      style: {
        fg: colors.fg,
        bg: colors.bg,
        border: {
          fg: colors.border
        }
      }
    });

    helpText.forEach((line, index) => {
      helpText[index] = `{bold}${line}{/bold}`;
    });

    helpBox.content = helpText.join('\n');
    this.screen.append(helpBox);

    this.screen.append(new blessed.Box({
      top: layout.status.top,
      left: 'center',
      width: 30,
      height: 1,
      content: 'Press Esc or q to close',
      style: {
        fg: colors.fg,
        bg: colors.bg
      }
    }));
  }

  /**
   * Render exit confirmation
   * @private
   */
  _renderExitConfirm() {
    const exitConfirm = stateManager.get('ui.exitConfirm');
    const colors = screenManager.getColorScheme();

    if (exitConfirm > 0) {
      this.screen.append(new blessed.Box({
        top: 'center',
        left: 'center',
        width: 40,
        height: 5,
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
      }));
    }
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
