#!/usr/bin/env node

/**
 * Test YAML frontmatter extraction
 */

const { extractDescription } = require('./lib/tui/utils');
const path = require('path');

const testFile = path.join(__dirname, 'test-tui-data/commands/git-commit.md');
const description = extractDescription(testFile);

console.log('Description extracted:', description);
console.log('Expected: "Commit staged changes to git repository"');
