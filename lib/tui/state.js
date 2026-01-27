/**
 * TUI State Management
 */

/**
 * Initial state structure
 */
const initialState = {
  // Current page
  currentPage: 'type-select', // type-select, content-select, summary, help
  previousPage: null,

  // Step 1: Type selection state
  typeSelect: {
    selectedIndex: 0,
    selectedTypes: [] // ['commands', 'skills', 'mcp']
  },

  // Step 2: Content selection state
  contentSelect: {
    currentTab: 'commands', // commands, skills, mcp
    searchQuery: '',
    scrollTop: 0,
    selections: {
      commands: [],
      skills: [],
      mcp: []
    }
  },

  // Data cache
  data: {
    commands: [],
    skills: [],
    mcp: [],
    loaded: false
  },

  // Sync state
  sync: {
    inProgress: false,
    progress: 0,
    total: 0,
    currentFile: '',
    errors: []
  },

  // UI state
  ui: {
    helpVisible: false,
    exitConfirm: 0,
    searchMode: false
  }
};

/**
 * State manager class
 */
class StateManager {
  constructor() {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.listeners = [];
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get state value by path
   * @param {string} path - Dot notation path (e.g., 'contentSelect.currentTab')
   * @returns {*} State value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set state value by path
   * @param {string} path - Dot notation path
   * @param {*} value - New value
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj) || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
    this.notify();
  }

  /**
   * Update state with partial object
   * @param {Object} updates - Partial state updates
   */
  update(updates) {
    this.state = this._deepMerge(this.state, updates);
    this.notify();
  }

  /**
   * Toggle selection in content select
   * @param {string} tab - Tab name (commands, skills, mcp)
   * @param {string} item - Item name to toggle
   */
  toggleSelection(tab, item) {
    const selections = this.state.contentSelect.selections[tab];
    const index = selections.indexOf(item);

    if (index > -1) {
      selections.splice(index, 1);
    } else {
      selections.push(item);
    }

    this.notify();
  }

  /**
   * Select all items in a tab
   * @param {string} tab - Tab name
   * @param {Array} items - All items to select
   */
  selectAll(tab, items) {
    this.state.contentSelect.selections[tab] = items.map(item => item.name);
    this.notify();
  }

  /**
   * Reverse selections in a tab
   * @param {string} tab - Tab name
   * @param {Array} items - All items
   */
  reverseSelection(tab, items) {
    const currentSelections = new Set(this.state.contentSelect.selections[tab]);
    this.state.contentSelect.selections[tab] = items
      .filter(item => !currentSelections.has(item.name))
      .map(item => item.name);
    this.notify();
  }

  /**
   * Clear all selections in a tab
   * @param {string} tab - Tab name
   */
  clearSelection(tab) {
    this.state.contentSelect.selections[tab] = [];
    this.notify();
  }

  /**
   * Check if item is selected
   * @param {string} tab - Tab name
   * @param {string} item - Item name
   * @returns {boolean} True if selected
   */
  isSelected(tab, item) {
    return this.state.contentSelect.selections[tab].includes(item);
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.notify();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  /**
   * Deep merge objects
   * @private
   */
  _deepMerge(target, source) {
    const output = Object.assign({}, target);

    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  /**
   * Check if value is object
   * @private
   */
  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

// Create singleton instance
const stateManager = new StateManager();

module.exports = stateManager;
