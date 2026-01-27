/**
 * Jest Configuration for cc-devkit TUI
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // 覆盖率收集
  collectCoverageFrom: [
    'lib/tui/**/*.js',
    '!lib/tui/**/*.test.js',
    '!**/node_modules/**'
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html'],

  // 模块路径别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/lib/tui/$1'
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 超时时间
  testTimeout: 10000,

  // 详细输出
  verbose: true,

  // 强制退出（处理 blessed screen 清理问题）
  forceExit: true,

  // 检测开放句柄（调试用）
  // detectOpenHandles: true,

  // 最大工作进程数
  maxWorkers: 1
};
