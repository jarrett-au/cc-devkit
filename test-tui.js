#!/usr/bin/env node

/**
 * Test script to verify blessed installation
 */

try {
  const blessed = require('blessed');
  console.log('✓ blessed is installed and loaded successfully!');
  console.log('  Version:', require('blessed/package.json').version);
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('✗ blessed is not installed');
    console.log('  Install with: npm install blessed');
  } else {
    console.log('✗ Error loading blessed:', e.message);
  }
  process.exit(1);
}
