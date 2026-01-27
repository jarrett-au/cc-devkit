/**
 * Type Selection Page
 */

const BasePage = require('./base');

class TypeSelectPage extends BasePage {
  constructor(screen) {
    super(screen);
    this.selectedIndex = 0;
    this.types = [
      { name: 'commands', label: '📁 commands', desc: 'Sync command definitions' },
      { name: 'skills', label: '📦 skills', desc: 'Sync skill directories' },
      { name: 'mcp', label: '🔌 mcp', desc: 'Sync MCP server configurations' }
    ];
  }

  renderContent() {
    // Title
    this.createBox({
      top: 1,
      left: 'center',
      width: 45,
      height: 1,
      content: 'Select sync types to configure:',
      style: {
        fg: this.colors.fg,
        bg: this.colors.bg
      }
    });

    // Render types
    const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
    this.selectedIndex = this.getState('typeSelect.selectedIndex') || 0;

    this.types.forEach((type, index) => {
      const isSelected = selectedTypes.includes(type.name);
      const isFocused = index === this.selectedIndex;

      const checkbox = isSelected ? '☑' : '⬜';
      const focusPrefix = isFocused ? '> ' : '  ';
      const color = isFocused ? this.colors.selected : this.colors.fg;

      this.createBox({
        top: 3 + index * 2,
        left: 'center',
        width: 55,
        height: 1,
        content: `${focusPrefix}${checkbox} ${type.label.padEnd(15)} ${type.desc}`,
        style: {
          fg: color,
          bg: this.colors.bg,
          bold: isFocused
        }
      });
    });
  }

  renderFooter() {
    const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
    const selectedCount = selectedTypes.length;

    this.createBox({
      top: this.layout.status.top,
      left: 'center',
      width: 55,
      height: 1,
      content: `Selected: ${selectedCount}/3    [Space: Toggle] [Enter: Confirm] [Esc: Exit]`,
      style: {
        fg: this.colors.fg,
        bg: this.colors.bg
      }
    });
  }

  setupKeys() {
    // 只在第一次渲染时绑定按键事件
    if (this._keysSetup) {
      return;
    }
    this._keysSetup = true;

    // Navigation
    this.screen.key(['up', 'k'], () => {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
        this.setState('typeSelect.selectedIndex', this.selectedIndex);
        this.render();
      }
    });

    this.screen.key(['down', 'j'], () => {
      if (this.selectedIndex < this.types.length - 1) {
        this.selectedIndex++;
        this.setState('typeSelect.selectedIndex', this.selectedIndex);
        this.render();
      }
    });

    // Toggle selection
    this.screen.key(['space'], () => {
      const type = this.types[this.selectedIndex];
      const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
      const index = selectedTypes.indexOf(type.name);

      if (index > -1) {
        selectedTypes.splice(index, 1);
      } else {
        selectedTypes.push(type.name);
      }

      this.setState('typeSelect.selectedTypes', selectedTypes);
      this.render();
    });

    // Confirm
    this.screen.key(['return'], () => {
      const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
      if (selectedTypes.length > 0) {
        this.setState('currentPage', 'content-select');
        this.setState('contentSelect.currentTab', selectedTypes[0]);
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
}

module.exports = TypeSelectPage;
