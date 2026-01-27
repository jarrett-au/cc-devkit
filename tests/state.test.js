/**
 * Unit Tests for TUI State Manager
 */

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    // Reset state manager for each test
    jest.resetModules();
    stateManager = require('../lib/tui/state');
    stateManager.reset();
  });

  describe('getState and set', () => {
    test('should get and set simple values', () => {
      stateManager.set('testKey', 'testValue');
      expect(stateManager.get('testKey')).toBe('testValue');
    });

    test('should get nested values', () => {
      stateManager.set('data.commands', [{ name: 'test' }]);
      expect(stateManager.get('data.commands')).toEqual([{ name: 'test' }]);
      expect(stateManager.get('data.commands.0.name')).toBe('test');
    });

    test('should return undefined for non-existent paths', () => {
      expect(stateManager.get('nonexistent.path')).toBeUndefined();
    });
  });

  describe('update', () => {
    test('should update state with partial object', () => {
      stateManager.update({
        data: {
          commands: [{ name: 'test1' }, { name: 'test2' }]
        }
      });

      expect(stateManager.get('data.commands')).toHaveLength(2);
      expect(stateManager.get('data.commands.0.name')).toBe('test1');
    });

    test('should merge nested objects', () => {
      stateManager.set('data', { commands: [] });
      stateManager.update({
        data: {
          skills: [{ name: 'skill1' }]
        }
      });

      expect(stateManager.get('data.commands')).toEqual([]);
      expect(stateManager.get('data.skills')).toEqual([{ name: 'skill1' }]);
    });
  });

  describe('toggleSelection', () => {
    test('should add item when not selected', () => {
      stateManager.toggleSelection('commands', 'git-commit');
      expect(stateManager.isSelected('commands', 'git-commit')).toBe(true);
    });

    test('should remove item when already selected', () => {
      stateManager.toggleSelection('commands', 'git-commit');
      stateManager.toggleSelection('commands', 'git-commit');
      expect(stateManager.isSelected('commands', 'git-commit')).toBe(false);
    });
  });

  describe('selectAll', () => {
    test('should select all items', () => {
      const items = [
        { name: 'item1' },
        { name: 'item2' },
        { name: 'item3' }
      ];

      stateManager.selectAll('commands', items);

      expect(stateManager.isSelected('commands', 'item1')).toBe(true);
      expect(stateManager.isSelected('commands', 'item2')).toBe(true);
      expect(stateManager.isSelected('commands', 'item3')).toBe(true);
    });
  });

  describe('reverseSelection', () => {
    test('should reverse selections', () => {
      const items = [
        { name: 'item1' },
        { name: 'item2' },
        { name: 'item3' }
      ];

      // Pre-select item1
      stateManager.toggleSelection('commands', 'item1');

      // Reverse
      stateManager.reverseSelection('commands', items);

      expect(stateManager.isSelected('commands', 'item1')).toBe(false);
      expect(stateManager.isSelected('commands', 'item2')).toBe(true);
      expect(stateManager.isSelected('commands', 'item3')).toBe(true);
    });
  });

  describe('clearSelection', () => {
    test('should clear all selections', () => {
      const items = [{ name: 'item1' }, { name: 'item2' }];
      stateManager.selectAll('commands', items);

      stateManager.clearSelection('commands');

      expect(stateManager.isSelected('commands', 'item1')).toBe(false);
      expect(stateManager.isSelected('commands', 'item2')).toBe(false);
    });
  });

  describe('subscribe', () => {
    test('should notify listeners on state change', () => {
      const listener = jest.fn();
      stateManager.subscribe(listener);

      stateManager.set('test', 'value');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          test: 'value'
        })
      );
    });

    test('should unsubscribe correctly', () => {
      const listener = jest.fn();
      const unsubscribe = stateManager.subscribe(listener);

      unsubscribe();
      stateManager.set('test', 'value');

      expect(listener).not.toHaveBeenCalled();
    });

    test('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      stateManager.subscribe(listener1);
      stateManager.subscribe(listener2);

      stateManager.set('test', 'value');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    test('should reset to initial state', () => {
      stateManager.set('currentPage', 'test-page');
      stateManager.toggleSelection('commands', 'test');

      stateManager.reset();

      expect(stateManager.get('currentPage')).toBe('type-select');
      expect(stateManager.isSelected('commands', 'test')).toBe(false);
    });
  });
});
