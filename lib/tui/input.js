/**
 * TUI Input Handler
 */

const stateManager = require('./state');

/**
 * Input handler class
 */
class InputHandler {
  constructor(screen) {
    this.screen = screen;
    this.handlers = {};
  }

  /**
   * Register key binding
   * @param {string|Array} keys - Key(s) to bind
   * @param {Function} callback - Callback function
   */
  bind(keys, callback) {
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        this.handlers[key] = callback;
      });
    } else {
      this.handlers[keys] = callback;
    }

    this.screen.key(keys, (ch, key) => {
      callback(ch, key);
      this.screen.render();
    });
  }

  /**
   * Register Vim key bindings
   */
  bindVimKeys() {
    // hjkl for navigation
    this.bind(['h', 'left'], () => this._emit('vim:left'));
    this.bind(['j', 'down'], () => this._emit('vim:down'));
    this.bind(['k', 'up'], () => this._emit('vim:up'));
    this.bind(['l', 'right'], () => this._emit('vim:right'));

    // G for bottom, g for top
    this.bind('G', () => this._emit('vim:bottom'));
    this.bind('g', () => this._emit('vim:top'));
  }

  /**
   * Register common navigation keys
   */
  bindNavigation() {
    // Page navigation
    this.bind(['pageup'], () => this._emit('nav:pageup'));
    this.bind(['pagedown'], () => this._emit('nav:pagedown'));

    // Home/End
    this.bind(['home'], () => this._emit('nav:home'));
    this.bind(['end'], () => this._emit('nav:end'));

    // Tab
    this.bind(['tab'], () => this._emit('nav:tab'));
    this.bind(['S-tab'], () => this._emit('nav:shift-tab'));
  }

  /**
   * Register selection keys
   */
  bindSelection() {
    // Space/Enter for selection
    this.bind(['space'], () => this._emit('select:toggle'));
    this.bind(['return'], () => this._emit('select:confirm'));
  }

  /**
   * Register action keys
   */
  bindActions() {
    // a - select all
    this.bind('a', () => {
      const searchMode = stateManager.get('ui.searchMode');
      if (!searchMode) {
        this._emit('action:select-all');
      } else {
        this._emit('input:char', 'a');
      }
    });

    // r - reverse selection
    this.bind('r', () => {
      const searchMode = stateManager.get('ui.searchMode');
      if (!searchMode) {
        this._emit('action:reverse');
      } else {
        this._emit('input:char', 'r');
      }
    });

    // c - clear selection
    this.bind('c', () => {
      const searchMode = stateManager.get('ui.searchMode');
      if (!searchMode) {
        this._emit('action:clear');
      } else {
        this._emit('input:char', 'c');
      }
    });

    // / - search
    this.bind('/', () => this._emit('action:search'));
  }

  /**
   * Register all default bindings
   */
  bindAll() {
    this.bindVimKeys();
    this.bindNavigation();
    this.bindSelection();
    this.bindActions();
  }

  /**
   * Emit custom event
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event](data);
    }
  }

  /**
   * On event handler
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    this.handlers[event] = callback;
  }

  /**
   * Remove all bindings
   */
  unbindAll() {
    if (this.screen) {
      // Remove all key bindings (this is a blessed limitation)
      // The screen needs to be recreated to truly remove bindings
    }
    this.handlers = {};
  }
}

module.exports = InputHandler;
