#!/usr/bin/env node

/**
 * Verification script to test data loading and basic functionality
 */

const path = require('path');
const { getMarkdownFiles, getSkillDirectories, parseMcpJson } = require('./lib/tui/utils');

const testDir = path.join(__dirname, 'test-tui-data');

console.log('=== cc-devkit TUI Data Loading Test ===\n');

// Test commands
console.log('Loading commands...');
const commandsDir = path.join(testDir, 'commands');
const commands = getMarkdownFiles(commandsDir, commandsDir);
console.log(`✓ Found ${commands.length} commands:`);
commands.forEach(cmd => {
  console.log(`  - ${cmd.name}: ${cmd.description || '(no description)'}`);
});

// Test skills
console.log('\nLoading skills...');
const skillsDir = path.join(testDir, 'skills');
const skills = getSkillDirectories(skillsDir);
console.log(`✓ Found ${skills.length} skills:`);
skills.forEach(skill => {
  console.log(`  - ${skill.name}: ${skill.description || '(no description)'}`);
});

// Test MCP
console.log('\nLoading MCP servers...');
const mcpJsonPath = path.join(testDir, 'mcp.json');
const mcp = parseMcpJson(mcpJsonPath);
console.log(`✓ Found ${mcp.length} MCP servers:`);
mcp.forEach(server => {
  console.log(`  - ${server.name}: ${server.config.command}`);
});

console.log('\n=== All tests passed! ===');
console.log('\nYou can now run the TUI with: node test-tui-run.js');
