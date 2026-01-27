/**
 * Summary Page
 */

const BasePage = require('./base');

class SummaryPage extends BasePage {
  renderContent() {
    // Title
    this.createBox({
      top: 1,
      left: 'center',
      width: 40,
      height: 1,
      content: 'Summary of selected items:',
      style: {
        fg: this.colors.fg,
        bg: this.colors.bg,
        bold: true
      }
    });

    // Show selections for each type
    let y = 3;
    const selectedTypes = this.getState('typeSelect.selectedTypes') || [];

    selectedTypes.forEach(type => {
      const selections = this.getState(`contentSelect.selections.${type}`) || [];
      const count = selections.length;

      if (count > 0) {
        const typeColor = this.getColorForType(type);

        // Type header
        this.createBox({
          top: y,
          left: 4,
          width: 40,
          height: 1,
          content: `${type} (${count}):`,
          style: {
            fg: typeColor,
            bg: this.colors.bg,
            bold: true
          }
        });

        y++;

        // Show first few items
        const displayCount = Math.min(3, selections.length);
        selections.slice(0, displayCount).forEach(item => {
          this.createBox({
            top: y,
            left: 6,
            width: 40,
            height: 1,
            content: `☑ ${item}`,
            style: {
              fg: this.colors.fg,
              bg: this.colors.bg
            }
          });
          y++;
        });

        // Show "and X more" if needed
        if (selections.length > 3) {
          this.createBox({
            top: y,
            left: 6,
            width: 40,
            height: 1,
            content: `... and ${selections.length - 3} more`,
            style: {
              fg: this.colors.fg,
              bg: this.colors.bg
            }
          });
          y++;
        }

        y++;
      }
    });

    // If no selections
    if (y === 3) {
      this.createBox({
        top: y,
        left: 'center',
        width: 30,
        height: 1,
        content: 'No items selected',
        style: {
          fg: this.colors.fg,
          bg: this.colors.bg
        }
      });
    }
  }

  renderFooter() {
    const selectedTypes = this.getState('typeSelect.selectedTypes') || [];
    const totalCount = selectedTypes.reduce(
      (sum, type) => sum + (this.getState(`contentSelect.selections.${type}`) || []).length,
      0
    );

    this.createBox({
      top: this.layout.status.top,
      left: 'center',
      width: 50,
      height: 1,
      content: `Total: ${totalCount} items    [Enter: Start Sync] [Esc: Back]`,
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

    // Go back
    this.screen.key(['escape'], () => {
      this.setState('currentPage', 'content-select');
      this.render();
    });

    // Confirm and start sync
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
        // TODO: Implement actual sync
        // For now, just exit
        console.log('\nSelected items:');
        selectedTypes.forEach(type => {
          const selections = this.getState(`contentSelect.selections.${type}`) || [];
          console.log(`  ${type}:`, selections);
        });
        process.exit(0);
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

module.exports = SummaryPage;
