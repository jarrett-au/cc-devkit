/**
 * Jest Setup File
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock process.stdout.isTTY for tests
Object.defineProperty(process.stdout, 'isTTY', {
  value: true,
  writable: false
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global cleanup after all tests
afterAll(() => {
  // Give blessed screens time to clean up
  return new Promise(resolve => setTimeout(resolve, 100));
});
