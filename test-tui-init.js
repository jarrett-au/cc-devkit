#!/usr/bin/env node

/**
 * Test TUI initialization without running the interactive UI
 */

const path = require('path');

console.log('Testing TUI initialization...\n');

try {
  // Test 1: Load modules
  console.log('✓ Loading modules...');
  const { TUIApplication } = require('./lib/tui');
  const testDir = path.join(__dirname, 'test-tui-data');

  // Test 2: Create app instance
  console.log('✓ Creating TUI application instance...');
  const app = new TUIApplication(testDir);

  // Test 3: Load data
  console.log('✓ Loading data from test directory...');
  app._loadData();

  const stateManager = require('./lib/tui/state');
  const commands = stateManager.get('data.commands');
  const skills = stateManager.get('data.skills');
  const mcp = stateManager.get('data.mcp');

  console.log(`  - Commands: ${commands.length}`);
  console.log(`  - Skills: ${skills.length}`);
  console.log(`  - MCP servers: ${mcp.length}`);

  // Test 4: Screen initialization (will fail if blessed not available)
  console.log('\n✓ Testing screen initialization...');
  const screenManager = require('./lib/tui/screen');
  const success = screenManager.init();

  if (success) {
    console.log('✓ Blessed screen initialized successfully!');
    console.log('✓ Screen destroyed (cleanup test)');
    screenManager.destroy();
  } else {
    console.log('✗ Failed to initialize blessed screen');
    process.exit(1);
  }

  console.log('\n=== All TUI initialization tests passed! ===\n');
  console.log('You can now run the full TUI with:');
  console.log('  node bin/cc-devkit.js --init claude --tui');
  console.log('  or');
  console.log('  node test-tui-run.js');

} catch (e) {
  console.error('\n✗ Error during TUI initialization test:');
  console.error(e.message);
  console.error(e.stack);
  process.exit(1);
}
