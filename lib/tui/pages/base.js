/**
 * Base Page Class
 */

const blessed = require('blessed');
const stateManager = require('../state');
const screenManager = require('../screen');

/**
 * Base page class
 */
class BasePage {
  constructor(screen) {
    this.screen = screen;
    this.blessed = blessed;
    this.elements = [];
    this.layout = screenManager.getLayout();
    this.colors = screenManager.getColorScheme();
  }

  /**
   * Render the page
   */
  render() {
    this.clear();
    this.renderContent();
    this.renderFooter();
    this.setupKeys();
  }

  /**
   * Clear screen elements
   */
  clear() {
    // Remove all elements managed by this page
    this.elements.forEach(el => {
      try {
        if (el && el.destroy) {
          el.destroy();
        }
      } catch (e) {
        // Ignore destroy errors
      }
    });
    this.elements = [];
  }

  /**
   * Render content - to be implemented by subclasses
   */
  renderContent() {
    throw new Error('renderContent must be implemented by subclass');
  }

  /**
   * Render footer/status bar
   */
  renderFooter() {
    // To be implemented by subclasses
  }

  /**
   * Setup key bindings
   */
  setupKeys() {
    // Remove existing key bindings for this page
    if (this.keyHandler) {
      this.screen.removeKeyBinding(this.keyHandler);
    }
  }

  /**
   * Create a box element
   */
  createBox(options) {
    const box = this.blessed.box(options);
    this.screen.append(box);
    this.elements.push(box);
    return box;
  }

  /**
   * Create a text element
   */
  createText(options) {
    const text = this.blessed.text(options);
    this.screen.append(text);
    this.elements.push(text);
    return text;
  }

  /**
   * Create a list element
   */
  createList(options) {
    const list = this.blessed.list(options);
    this.screen.append(list);
    this.elements.push(list);
    return list;
  }

  /**
   * Get state value
   */
  getState(path) {
    return stateManager.get(path);
  }

  /**
   * Set state value
   */
  setState(path, value) {
    stateManager.set(path, value);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    return stateManager.subscribe(callback);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.clear();
    if (this.keyHandler) {
      this.screen.removeKeyBinding(this.keyHandler);
    }
  }
}

module.exports = BasePage;
