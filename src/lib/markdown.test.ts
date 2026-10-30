import test from 'node:test';
import assert from 'node:assert/strict';

// Test inline regex logic
test('inline markdown parsing handles bold, italic, and links', () => {
  const regex = /(\[.+?\]\(.+?\))|(\*\*.+?\*\*)|(\*[^*]+?\*)|(_[^_]+?_)|(`[^`]+?`)/g;
  const input = 'Here is **1. Science Stream** with *physics* and [Portal](https://nta.ac.in)';
  const parts = input.split(regex).filter(Boolean);

  assert.equal(parts.includes('**1. Science Stream**'), true);
  assert.equal(parts.includes('*physics*'), true);
  assert.equal(parts.includes('[Portal](https://nta.ac.in)'), true);
});

test('bullet pattern matches bullet points and numbered points', () => {
  const bulletMatch1 = '* **What it involves:** Physics and Chemistry'.match(/^[-*]\s+(.+)$/);
  assert.notEqual(bulletMatch1, null);
  assert.equal(bulletMatch1![1], '**What it involves:** Physics and Chemistry');

  const numberedMatch = '1. Science Stream (PCM/PCB)'.match(/^\d+\.\s+(.+)$/);
  assert.notEqual(numberedMatch, null);
  assert.equal(numberedMatch![1], 'Science Stream (PCM/PCB)');
});
