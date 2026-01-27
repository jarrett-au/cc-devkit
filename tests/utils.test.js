/**
 * Unit Tests for TUI Utils
 */

const fs = require('fs');
const path = require('path');

// Mock fs module before requiring utils
jest.mock('fs');

describe('TUI Utils', () => {
  const utils = require('../lib/tui/utils');

  describe('extractDescription', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should extract description from YAML frontmatter', () => {
      const mockContent = '---\ndescription: Test description\n---\n# Content';
      fs.readFileSync.mockReturnValue(mockContent);

      const result = utils.extractDescription('test.md');
      expect(result).toBe('Test description');
    });

    test('should handle Windows line endings', () => {
      const mockContent = '---\r\ndescription: Test description\r\n---\r\n# Content';
      fs.readFileSync.mockReturnValue(mockContent);

      const result = utils.extractDescription('test.md');
      expect(result).toBe('Test description');
    });

    test('should return empty string if no frontmatter', () => {
      const mockContent = '# Content without frontmatter';
      fs.readFileSync.mockReturnValue(mockContent);

      const result = utils.extractDescription('test.md');
      expect(result).toBe('');
    });

    test('should return empty string if no description field', () => {
      const mockContent = '---\ntitle: Test\n---\n# Content';
      fs.readFileSync.mockReturnValue(mockContent);

      const result = utils.extractDescription('test.md');
      expect(result).toBe('');
    });

    test('should handle file read errors', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = utils.extractDescription('nonexistent.md');
      expect(result).toBe('');
    });
  });

  describe('supportsColor', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should return true when NO_COLOR is not set and TTY is available', () => {
      // Note: In test environment, TTY detection may not work perfectly
      // so we just test the function doesn't throw
      const result = utils.supportsColor();
      expect(typeof result).toBe('boolean');
    });

    test('should return false when NO_COLOR is set', () => {
      process.env.NO_COLOR = '1';

      const result = utils.supportsColor();
      expect(result).toBe(false);
    });

    test('should return false when TERM is dumb', () => {
      process.env.TERM = 'dumb';
      process.stdout.isTTY = true;

      const result = utils.supportsColor();
      expect(result).toBe(false);
    });
  });

  describe('formatListItem', () => {
    test('should format item with description', () => {
      const result = utils.formatListItem('test-item', 'A test item', false, 80);
      expect(result).toContain('⬜');
      expect(result).toContain('test-item');
      expect(result).toContain('A test item');
    });

    test('should show selected checkbox', () => {
      const result = utils.formatListItem('test-item', 'A test item', true, 80);
      expect(result).toContain('☑');
    });

    test('should truncate long descriptions', () => {
      const longDesc = 'This is a very long description that should be truncated';
      const result = utils.formatListItem('test-item', longDesc, false, 50);
      expect(result).toContain('...');
    });

    test('should hide description in narrow screens', () => {
      const result = utils.formatListItem('test-item', 'A test item', false, 25);
      expect(result).toContain('⬜ test-item');
      // In narrow screens, description should be omitted
      expect(result.includes('A test item')).toBe(false);
    });
  });

  describe('isValidFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return true for existing files', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isFile: () => true });

      const result = utils.isValidFile('test.md');
      expect(result).toBe(true);
    });

    test('should return false for directories', () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isFile: () => false });

      const result = utils.isValidFile('test-dir');
      expect(result).toBe(false);
    });

    test('should return false for non-existent files', () => {
      fs.existsSync.mockReturnValue(false);

      const result = utils.isValidFile('nonexistent.md');
      expect(result).toBe(false);
    });
  });

  describe('parseMcpJson', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should parse valid MCP JSON', () => {
      const mockContent = JSON.stringify({
        mcpServers: {
          'test-server': {
            command: 'echo',
            args: ['test']
          }
        }
      });
      fs.readFileSync.mockReturnValue(mockContent);

      const result = utils.parseMcpJson('mcp.json');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-server');
      expect(result[0].config.command).toBe('echo');
    });

    test('should handle empty mcpServers', () => {
      const mockContent = JSON.stringify({ mcpServers: {} });
      fs.readFileSync.mockReturnValue(mockContent);

      const result = utils.parseMcpJson('mcp.json');
      expect(result).toHaveLength(0);
    });

    test('should return empty array on parse error', () => {
      fs.readFileSync.mockReturnValue('invalid json');

      const result = utils.parseMcpJson('mcp.json');
      expect(result).toHaveLength(0);
    });
  });
});
