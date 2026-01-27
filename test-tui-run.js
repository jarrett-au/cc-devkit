#!/usr/bin/env node

/**
 * Test script to run TUI with test data
 */

const path = require('path');

// Set test directory
const testDir = path.join(__dirname, 'test-tui-data');

console.log('Starting cc-devkit TUI with test data...');
console.log('Test directory:', testDir);
console.log('\nPress ? for help, Esc or q to exit\n');

// Import and run TUI
const { createTUI } = require('./lib/tui');

try {
  createTUI(testDir);
} catch (e) {
  console.error('Error starting TUI:', e.message);
  console.error(e.stack);
  process.exit(1);
}
