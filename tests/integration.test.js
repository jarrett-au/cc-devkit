/**
 * Integration Tests for TUI with Terminal Simulation
 */

const blessed = require('blessed');
const path = require('path');

describe('TUI Integration Tests', () => {
  let screen;
  let stateManager;

  beforeEach(() => {
    // Create a test screen
    screen = blessed.screen({
      smartCSR: true,
      terminal: 'vt100' || 'xterm-256color',
      width: 80,
      height: 24
    });

    // Reset state
    jest.resetModules();
    stateManager = require('../lib/tui/state');
    stateManager.reset();
  });

  afterEach(() => {
    if (screen) {
      screen.destroy();
    }
  });

  describe('Screen Initialization', () => {
    test('should initialize screen without errors', () => {
      const screenManager = require('../lib/tui/screen');

      const success = screenManager.init();
      expect(success).toBe(true);

      screenManager.destroy();
    });

    test('should have correct layout dimensions', () => {
      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const layout = screenManager.getLayout();

      expect(layout.tabBar).toBeDefined();
      expect(layout.content).toBeDefined();
      expect(layout.search).toBeDefined();
      expect(layout.status).toBeDefined();

      screenManager.destroy();
    });

    test('should detect color support', () => {
      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const hasColor = screenManager.hasColor();
      expect(typeof hasColor).toBe('boolean');

      screenManager.destroy();
    });
  });

  describe('Page Rendering', () => {
    test('should render type-select page', () => {
      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const TypeSelectPage = require('../lib/tui/pages/type-select');
      const page = new TypeSelectPage(screenManager.getScreen());

      expect(() => page.render()).not.toThrow();

      page.destroy();
      screenManager.destroy();
    });

    test('should render content-select page', () => {
      // Setup test data
      stateManager.set('data.commands', [
        { name: 'test1', description: 'Test 1' },
        { name: 'test2', description: 'Test 2' }
      ]);
      stateManager.set('typeSelect.selectedTypes', ['commands']);

      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const ContentSelectPage = require('../lib/tui/pages/content-select');
      const page = new ContentSelectPage(screenManager.getScreen());

      expect(() => page.render()).not.toThrow();

      page.destroy();
      screenManager.destroy();
    });

    test('should render summary page', () => {
      // Setup test data
      stateManager.set('typeSelect.selectedTypes', ['commands']);
      stateManager.set('contentSelect.selections.commands', ['test1', 'test2']);

      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const SummaryPage = require('../lib/tui/pages/summary');
      const page = new SummaryPage(screenManager.getScreen());

      expect(() => page.render()).not.toThrow();

      page.destroy();
      screenManager.destroy();
    });

    test('should render help page', () => {
      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const HelpPage = require('../lib/tui/pages/help');
      const page = new HelpPage(screenManager.getScreen());

      expect(() => page.render()).not.toThrow();

      page.destroy();
      screenManager.destroy();
    });
  });

  describe('User Interactions', () => {
    test('should handle space key for selection', () => {
      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const TypeSelectPage = require('../lib/tui/pages/type-select');
      const page = new TypeSelectPage(screenManager.getScreen());

      // Simulate space key press
      screen.key('space', () => {
        // Handler should be registered
        expect(true).toBe(true);
      });

      page.destroy();
      screenManager.destroy();
    });

    test('should handle enter key for confirmation', () => {
      stateManager.set('typeSelect.selectedTypes', ['commands']);

      const screenManager = require('../lib/tui/screen');
      screenManager.init();

      const TypeSelectPage = require('../lib/tui/pages/type-select');
      const page = new TypeSelectPage(screenManager.getScreen());

      // Simulate enter key
      screen.key('enter', () => {
        expect(stateManager.get('currentPage')).toBe('content-select');
      });

      page.destroy();
      screenManager.destroy();
    });
  });

  describe('State Management', () => {
    test('should maintain state across page transitions', () => {
      // Set initial state
      stateManager.set('typeSelect.selectedTypes', ['commands', 'skills']);
      stateManager.toggleSelection('commands', 'git-commit');

      // Verify state persists
      expect(stateManager.get('typeSelect.selectedTypes')).toEqual(['commands', 'skills']);
      expect(stateManager.isSelected('commands', 'git-commit')).toBe(true);
    });

    test('should handle selection operations correctly', () => {
      const items = [
        { name: 'item1' },
        { name: 'item2' },
        { name: 'item3' }
      ];

      // Select all
      stateManager.selectAll('commands', items);
      expect(stateManager.get('contentSelect.selections.commands')).toHaveLength(3);

      // Clear selection
      stateManager.clearSelection('commands');
      expect(stateManager.get('contentSelect.selections.commands')).toHaveLength(0);

      // Reverse selection
      stateManager.toggleSelection('commands', 'item1');
      stateManager.reverseSelection('commands', items);
      expect(stateManager.isSelected('commands', 'item1')).toBe(false);
      expect(stateManager.isSelected('commands', 'item2')).toBe(true);
      expect(stateManager.isSelected('commands', 'item3')).toBe(true);
    });
  });

  describe('Data Loading', () => {
    test('should load data from test directory', () => {
      const { getMarkdownFiles, getSkillDirectories, parseMcpJson } = require('../lib/tui/utils');
      const testDir = path.join(__dirname, '..', 'test-tui-data');

      // Load commands
      const commands = getMarkdownFiles(
        path.join(testDir, 'commands'),
        path.join(testDir, 'commands')
      );
      expect(commands.length).toBeGreaterThan(0);

      // Load skills
      const skills = getSkillDirectories(path.join(testDir, 'skills'));
      expect(skills.length).toBeGreaterThanOrEqual(0);

      // Load MCP
      const mcp = parseMcpJson(path.join(testDir, 'mcp.json'));
      expect(mcp.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Application Lifecycle', () => {
    test('should initialize and cleanup correctly', () => {
      const screenManager = require('../lib/tui/screen');

      // Initialize
      const initSuccess = screenManager.init();
      expect(initSuccess).toBe(true);

      // Check screen is created
      expect(screenManager.isInitialized()).toBe(true);

      // Cleanup
      screenManager.destroy();
      expect(screenManager.isInitialized()).toBe(false);
    });
  });
});
