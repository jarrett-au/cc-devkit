/**
 * TUI Screen Management
 */

const stateManager = require('./state');
const { supportsColor, calculateLayout } = require('./utils');

let blessed;

/**
 * Screen manager class
 */
class ScreenManager {
  constructor() {
    this.screen = null;
    this.initialized = false;
  }

  /**
   * Initialize blessed screen
   * @returns {boolean} True if initialization successful
   */
  init() {
    try {
      // Try to require blessed
      blessed = require('blessed');
    } catch (error) {
      return false;
    }

    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'cc-devkit TUI',
      fullUnicode: true, // Support emoji
      autoPadding: true,
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: null // Inherit
      }
    });

    // Setup global key bindings
    this._setupKeyBindings();

    // Handle terminal resize
    this.screen.on('resize', () => {
      this.render();
    });

    this.initialized = true;
    return true;
  }

  /**
   * Setup global key bindings
   * @private
   */
  _setupKeyBindings() {
    // Exit keys
    this.screen.key(['escape', 'q', 'C-c'], () => {
      const exitConfirm = stateManager.get('ui.exitConfirm');

      if (exitConfirm >= 1) {
        // Second confirmation - exit
        return process.exit(0);
      } else {
        // First confirmation - increment counter
        stateManager.set('ui.exitConfirm', exitConfirm + 1);
        this.render();
      }
    });

    // Help key
    this.screen.key('?', () => {
      const helpVisible = stateManager.get('ui.helpVisible');
      stateManager.set('ui.helpVisible', !helpVisible);
      this.render();
    });

    // Reset exit confirm on any other key
    this.screen.key(['up', 'down', 'left', 'right', 'h', 'j', 'k', 'l'], () => {
      stateManager.set('ui.exitConfirm', 0);
    });
  }

  /**
   * Get screen object
   * @returns {Object} Blessed screen object
   */
  getScreen() {
    return this.screen;
  }

  /**
   * Get layout dimensions
   * @returns {Object} Layout dimensions
   */
  getLayout() {
    return calculateLayout(this.screen);
  }

  /**
   * Check if color is supported
   * @returns {boolean} True if color is supported
   */
  hasColor() {
    return supportsColor();
  }

  /**
   * Get color scheme
   * @returns {Object} Color scheme
   */
  getColorScheme() {
    if (!this.hasColor()) {
      return {
        commands: 'white',
        skills: 'white',
        mcp: 'white',
        selected: 'black',
        bg: 'white',
        fg: 'black',
        border: 'white',
        warning: 'white'
      };
    }

    return {
      commands: 'cyan',
      skills: 'green',
      mcp: 'yellow',
      selected: 'white',
      bg: 'black',
      fg: 'white',
      border: 'white',
      warning: 'red'
    };
  }

  /**
   * Render screen
   */
  render() {
    if (this.screen) {
      this.screen.render();
    }
  }

  /**
   * Destroy screen
   */
  destroy() {
    if (this.screen) {
      this.screen.destroy();
      this.screen = null;
      this.initialized = false;
    }
  }

  /**
   * Check if initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Create singleton instance
const screenManager = new ScreenManager();

module.exports = screenManager;
