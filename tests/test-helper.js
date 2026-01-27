/**
 * TUI Test Helper - 用于模拟终端交互和测试
 */

const blessed = require('blessed');

class TUITestHelper {
  constructor(options = {}) {
    this.width = options.width || 80;
    this.height = options.height || 24;
    this.terminal = options.terminal || 'xterm-256color';
    this.screen = null;
    this.capturedOutput = [];
  }

  /**
   * 创建测试屏幕
   */
  createScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      terminal: this.terminal,
      width: this.width,
      height: this.height
    });

    return this.screen;
  }

  /**
   * 模拟按键
   */
  simulateKey(key, options = {}) {
    if (!this.screen) {
      throw new Error('Screen not initialized. Call createScreen() first.');
    }

    const ch = options.ch || key;
    const keyData = {
      name: key.toLowerCase(),
      ctrl: options.ctrl || false,
      meta: options.meta || false,
      shift: options.shift || false,
      seq: key
    };

    // 触发按键事件
    this.screen.emit('key', ch, keyData);
    this.screen.render();
  }

  /**
   * 模拟按键序列
   */
  simulateKeys(keys) {
    keys.forEach(key => {
      if (typeof key === 'string') {
        this.simulateKey(key);
      } else if (typeof key === 'object') {
        this.simulateKey(key.key, key);
      }
    });
  }

  /**
   * 获取屏幕内容
   */
  getScreenContent() {
    if (!this.screen) {
      throw new Error('Screen not initialized. Call createScreen() first.');
    }

    const content = {
      width: this.screen.width,
      height: this.screen.height,
      children: this.screen.children.length,
      output: this.capturedOutput.join('\n')
    };

    return content;
  }

  /**
   * 获取特定元素的内容
   */
  getElementContent(element) {
    if (!element) {
      return null;
    }

    return {
      content: element.content || '',
      text: element.text || '',
      items: element.items || [],
      selected: element.selected || null,
      value: element.value || ''
    };
  }

  /**
   * 查找元素
   */
  findElement(predicate) {
    if (!this.screen) {
      return null;
    }

    const findInChildren = (parent) => {
      if (!parent.children) {
        return null;
      }

      for (const child of parent.children) {
        if (predicate(child)) {
          return child;
        }

        const found = findInChildren(child);
        if (found) {
          return found;
        }
      }

      return null;
    };

    return findInChildren(this.screen);
  }

  /**
   * 通过标签查找元素
   */
  findElementByLabel(label) {
    return this.findElement((el) => el.label === label);
  }

  /**
   * 通过类型查找元素
   */
  findElementByType(type) {
    return this.findElement((el) => el.type === type);
  }

  /**
   * 获取所有 list 元素
   */
  getListElements() {
    const lists = [];
    this.findElement((el) => {
      if (el.type === 'list') {
        lists.push(el);
      }
      return false;
    });
    return lists;
  }

  /**
   * 获取所有 form 元素
   */
  getFormElements() {
    const forms = [];
    this.findElement((el) => {
      if (el.type === 'form') {
        forms.push(el);
      }
      return false;
    });
    return forms;
  }

  /**
   * 等待条件满足
   */
  async waitFor(condition, timeout = 1000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setImmediate(resolve));
    }

    throw new Error(`Timeout waiting for condition: ${condition}`);
  }

  /**
   * 等待元素出现
   */
  async waitForElement(predicate, timeout = 1000) {
    return this.waitFor(() => this.findElement(predicate), timeout);
  }

  /**
   * 等待页面改变
   */
  async waitForPageChange(expectedPage, timeout = 1000) {
    const stateManager = require('../lib/tui/state');

    return this.waitFor(() => {
      const currentPage = stateManager.get('currentPage');
      return currentPage === expectedPage;
    }, timeout);
  }

  /**
   * 截屏（用于调试）
   */
  screenshot() {
    if (!this.screen) {
      return null;
    }

    // 简化的截屏，返回文本表示
    const lines = [];
    for (let y = 0; y < this.screen.height; y++) {
      const line = [];
      for (let x = 0; x < this.screen.width; x++) {
        // 这里可以获取实际字符
        line.push(' ');
      }
      lines.push(line.join(''));
    }

    return lines.join('\n');
  }

  /**
   * 清理
   */
  cleanup() {
    if (this.screen) {
      this.screen.destroy();
      this.screen = null;
    }
    this.capturedOutput = [];
  }
}

/**
 * 创建测试辅助器工厂函数
 */
function createTestHelper(options) {
  return new TUITestHelper(options);
}

/**
 * 测试辅助工具
 */
const TestUtils = {
  /**
   * 创建模拟的配置数据
   */
  createMockConfig() {
    return {
      commands: [
        { name: 'git-commit', description: 'Commit changes' },
        { name: 'git-push', description: 'Push to remote' },
        { name: 'npm-install', description: 'Install dependencies' }
      ],
      skills: [
        { name: 'test-skill', description: 'A test skill' }
      ],
      mcp: [
        { name: 'test-server', config: { command: 'echo', args: ['test'] } }
      ]
    };
  },

  /**
   * 等待指定时间
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 创建测试用的临时目录结构
   */
  createMockTestDir(baseDir) {
    const fs = require('fs');
    const path = require('path');

    const commandsDir = path.join(baseDir, 'commands');
    const skillsDir = path.join(baseDir, 'skills');

    fs.mkdirSync(commandsDir, { recursive: true });
    fs.mkdirSync(skillsDir, { recursive: true });

    // Create test files
    fs.writeFileSync(
      path.join(commandsDir, 'test.md'),
      '---\ndescription: Test command\n---\n# Test'
    );

    fs.writeFileSync(
      path.join(baseDir, 'mcp.json'),
      JSON.stringify({ mcpServers: {} })
    );

    fs.writeFileSync(
      path.join(baseDir, 'README.md'),
      '# Test Config'
    );

    return baseDir;
  },

  /**
   * 清理测试目录
   */
  cleanupMockTestDir(baseDir) {
    const fs = require('fs');
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
  }
};

module.exports = {
  TUITestHelper,
  createTestHelper,
  TestUtils
};
