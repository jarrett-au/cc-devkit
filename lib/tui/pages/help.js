/**
 * Help Page
 */

const BasePage = require('./base');

class HelpPage extends BasePage {
  renderContent() {
    const helpText = [
      { text: 'Help - Keyboard Shortcuts', bold: true },
      { text: '' },
      { text: 'Navigation:', bold: true },
      { text: '  hjkl / Arrows   Move cursor' },
      { text: '  Home/End        Jump to first/last item' },
      { text: '  PageUp/Down     Scroll page' },
      { text: '  Tab             Switch tabs' },
      { text: '' },
      { text: 'Selection:', bold: true },
      { text: '  Space/Enter    Toggle selection' },
      { text: '  a              Select all' },
      { text: '  r              Reverse selection' },
      { text: '  c              Clear all selections' },
      { text: '' },
      { text: 'Search:', bold: true },
      { text: '  /              Enter search mode' },
      { text: '  Esc            Exit search mode' },
      { text: '' },
      { text: 'Other:', bold: true },
      { text: '  ?              Show this help' },
      { text: '  Esc            Exit/Back' }
    ];

    // Help box
    const helpBox = this.createBox({
      top: 'center',
      left: 'center',
      width: 50,
      height: 22,
      label: ' Help ',
      tags: true,
      style: {
        fg: this.colors.fg,
        bg: this.colors.bg,
        border: {
          fg: this.colors.border
        }
      }
    });

    // Format help text with bold tags
    const content = helpText.map(line => {
      if (line.bold) {
        return `{bold}${line.text}{/bold}`;
      }
      return line.text;
    }).join('\n');

    helpBox.content = content;
  }

  renderFooter() {
    this.createBox({
      top: this.layout.status.top,
      left: 'center',
      width: 30,
      height: 1,
      content: 'Press Esc or q to close',
      style: {
        fg: this.colors.fg,
        bg: this.colors.bg
      }
    });
  }

  setupKeys() {
    // Close help
    this.screen.key(['escape', 'q'], () => {
      const currentPage = this.getState('currentPage');
      if (currentPage === 'help') {
        // Restore previous page
        const previousPage = this.getState('previousPage') || 'type-select';
        this.setState('currentPage', previousPage);
        this.setState('ui.helpVisible', false);
        this.render();
      } else {
        // Just hide help overlay
        this.setState('ui.helpVisible', false);
        this.render();
      }
    });
  }
}

module.exports = HelpPage;
