/**
 * Content Selection Page
 */

const BasePage = require('./base');
const { formatListItem } = require('../utils');

class ContentSelectPage extends BasePage {
  constructor(screen) {
    super(screen);
    this.list = null;
    this.listTopIndex = 0;
    this.itemsPerPage = 15;
  }

  renderContent() {
    const currentTab = this.getState('contentSelect.currentTab') || 'commands';
    const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
    const data = this.getState(`data.${currentTab}`) || [];
    const selections = this.getState(`contentSelect.selections.${currentTab}`) || [];
    const searchQuery = this.getState('contentSelect.searchQuery') || '';

    // Render tab bar
    let leftOffset = 2;
    selectedTypes.forEach((type, index) => {
      const isActive = type === currentTab;
      const tabColors = this.getColorForType(type);

      this.createBox({
        top: this.layout.tabBar.top,
        left: leftOffset,
        width: 12,
        height: this.layout.tabBar.height,
        content: type,
        style: {
          fg: isActive ? this.colors.bg : this.colors.fg,
          bg: isActive ? tabColors : this.colors.commands,
          bold: isActive
        }
      });

      leftOffset += 13;
    });

    // Filter data based on search query
    let filteredData = data;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = data.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // Render list
    this.renderList(filteredData, selections, currentTab);
  }

  renderList(data, selections, type) {
    // Calculate visible items
    const start = this.listTopIndex;
    const end = Math.min(start + this.itemsPerPage, data.length);
    const visibleData = data.slice(start, end);

    // Render each item
    visibleData.forEach((item, index) => {
      const isSelected = selections.includes(item.name);
      const absoluteIndex = start + index;
      const globalIndex = this.getState('contentSelect.selectedIndex') || 0;
      const isFocused = absoluteIndex === globalIndex;

      const typeColor = this.getColorForType(type);
      const checkbox = isSelected ? '☑' : '⬜';
      const focusPrefix = isFocused ? '> ' : '  ';
      const color = isFocused ? this.colors.selected : this.colors.fg;

      let displayText = `${focusPrefix}${checkbox} ${item.name}`;
      if (item.description) {
        const maxWidth = 60;
        const availableWidth = maxWidth - item.name.length - 6;
        if (availableWidth > 3) {
          const desc = item.description.length > availableWidth
            ? item.description.substring(0, availableWidth - 3) + '...'
            : item.description;
          displayText += `    ${desc}`;
        }
      }

      this.createBox({
        top: this.layout.content.top + index,
        left: this.layout.content.left,
        width: this.layout.content.width,
        height: 1,
        content: displayText,
        style: {
          fg: color,
          bg: this.colors.bg,
          bold: isFocused
        }
      });
    });

    // Store data for key handlers
    this.currentData = data;
    this.currentSelections = selections;
    this.currentType = type;
  }

  renderFooter() {
    const currentTab = this.getState('contentSelect.currentTab') || 'commands';
    const selections = this.getState(`contentSelect.selections.${currentTab}`) || [];
    const data = this.getState(`data.${currentTab}`) || [];
    const searchQuery = this.getState('contentSelect.searchQuery') || '';

    const selectedCount = selections.length;
    const totalCount = data.length;

    let helpText = `[a: All] [r: Reverse] [c: Clear] [Enter: Confirm]`;
    if (searchQuery) {
      helpText = `[Esc: Clear search] ${helpText}`;
    } else {
      helpText = `[/: Search] [Tab: Switch] ${helpText}`;
    }

    this.createBox({
      top: this.layout.status.top,
      left: 'center',
      width: 70,
      height: 2,
      content: `Selected: ${selectedCount}/${totalCount}\n${helpText}`,
      style: {
        fg: this.colors.fg,
        bg: this.colors.bg
      }
    });

    // Search box
    if (searchQuery) {
      this.createBox({
        top: this.layout.search.top,
        left: this.layout.search.left,
        width: this.layout.search.width,
        height: this.layout.search.height,
        content: `Search: ${searchQuery}`,
        style: {
          fg: this.colors.bg,
          bg: this.colors.fg,
          bold: true
        }
      });
    }
  }

  setupKeys() {
    const data = this.getState(`data.${this.getState('contentSelect.currentTab')}`) || [];
    const searchQuery = this.getState('contentSelect.searchQuery') || '';

    // Navigation (only if not in search mode)
    if (!searchQuery) {
      this.screen.key(['up', 'k'], () => {
        const currentIndex = this.getState('contentSelect.selectedIndex') || 0;
        if (currentIndex > 0) {
          this.setState('contentSelect.selectedIndex', currentIndex - 1);
          if (currentIndex - 1 < this.listTopIndex) {
            this.listTopIndex = currentIndex - 1;
          }
          this.render();
        }
      });

      this.screen.key(['down', 'j'], () => {
        const currentIndex = this.getState('contentSelect.selectedIndex') || 0;
        if (currentIndex < data.length - 1) {
          this.setState('contentSelect.selectedIndex', currentIndex + 1);
          if (currentIndex + 1 >= this.listTopIndex + this.itemsPerPage) {
            this.listTopIndex = currentIndex + 1 - this.itemsPerPage + 1;
          }
          this.render();
        }
      });

      // Page navigation
      this.screen.key(['pageup'], () => {
        const currentIndex = this.getState('contentSelect.selectedIndex') || 0;
        const newIndex = Math.max(0, currentIndex - this.itemsPerPage);
        this.setState('contentSelect.selectedIndex', newIndex);
        this.listTopIndex = Math.max(0, this.listTopIndex - this.itemsPerPage);
        this.render();
      });

      this.screen.key(['pagedown'], () => {
        const currentIndex = this.getState('contentSelect.selectedIndex') || 0;
        const newIndex = Math.min(data.length - 1, currentIndex + this.itemsPerPage);
        this.setState('contentSelect.selectedIndex', newIndex);
        if (newIndex >= this.listTopIndex + this.itemsPerPage) {
          this.listTopIndex = newIndex - this.itemsPerPage + 1;
        }
        this.render();
      });
    }

    // Toggle selection
    this.screen.key(['space'], () => {
      const currentIndex = this.getState('contentSelect.selectedIndex') || 0;
      const currentTab = this.getState('contentSelect.currentTab');
      const data = this.getState(`data.${currentTab}`) || [];

      if (data[currentIndex]) {
        const itemName = data[currentIndex].name;
        stateManager.toggleSelection(currentTab, itemName);
        this.render();
      }
    });

    // Batch operations (only if not in search mode)
    if (!searchQuery) {
      this.screen.key(['a'], () => {
        const currentTab = this.getState('contentSelect.currentTab');
        const data = this.getState(`data.${currentTab}`) || [];
        stateManager.selectAll(currentTab, data);
        this.render();
      });

      this.screen.key(['r'], () => {
        const currentTab = this.getState('contentSelect.currentTab');
        const data = this.getState(`data.${currentTab}`) || [];
        stateManager.reverseSelection(currentTab, data);
        this.render();
      });

      this.screen.key(['c'], () => {
        const currentTab = this.getState('contentSelect.currentTab');
        stateManager.clearSelection(currentTab);
        this.render();
      });
    }

    // Tab switching
    this.screen.key(['tab'], () => {
      const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
      const currentTab = this.getState('contentSelect.currentTab');
      const currentIndex = selectedTypes.indexOf(currentTab);
      const nextIndex = (currentIndex + 1) % selectedTypes.length;

      this.setState('contentSelect.currentTab', selectedTypes[nextIndex]);
      this.setState('contentSelect.selectedIndex', 0);
      this.setState('contentSelect.searchQuery', '');
      this.listTopIndex = 0;
      this.render();
    });

    // Search
    this.screen.key(['/'], () => {
      if (!searchQuery) {
        this.setState('ui.searchMode', true);
        this.render();
        // TODO: Implement search input
      }
    });

    // Clear search
    this.screen.key(['escape'], () => {
      if (searchQuery) {
        this.setState('contentSelect.searchQuery', '');
        this.setState('ui.searchMode', false);
        this.render();
      } else {
        // Go back to type select
        this.setState('currentPage', 'type-select');
        this.render();
      }
    });

    // Confirm
    this.screen.key(['return'], () => {
      const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
      let hasSelections = false;

      selectedTypes.forEach(type => {
        const selections = this.getState(`contentSelect.selections.${type}`) || [];
        if (selections.length > 0) {
          hasSelections = true;
        }
      });

      if (hasSelections) {
        this.setState('currentPage', 'summary');
        this.render();
      }
    });

    // Help
    this.screen.key('?', () => {
      const helpVisible = this.getState('ui.helpVisible');
      this.setState('ui.helpVisible', !helpVisible);
      this.render();
    });
  }

  getColorForType(type) {
    const colors = {
      commands: 'cyan',
      skills: 'green',
      mcp: 'yellow'
    };
    return colors[type] || 'white';
  }
}

module.exports = ContentSelectPage;
