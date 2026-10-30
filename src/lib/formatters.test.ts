import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResponseSections, formatPrintableParentSummary } from './formatters';

test('parseResponseSections accurately detects structured guidance headings', () => {
  const sampleMarkdown = `
### What I heard
You are in Class 10 with a passion for biological sciences, but want to understand all stream options.

### Options to compare
1. PCB (Physics, Chemistry, Biology)
2. PCM (Physics, Chemistry, Mathematics)
3. PCMB (Four sciences)

### Trade-offs & Prerequisites to verify
- PCB opens medical and biotech but closes traditional engineering.
- Mathematics prerequisites differ by university.

### One practical next step
Check the syllabus for 11th Biology and Mathematics to see which topics excite you.
`;

  const sections = parseResponseSections(sampleMarkdown);
  assert.equal(sections.length, 4);
  assert.equal(sections[0].type, 'heard');
  assert.equal(sections[1].type, 'options');
  assert.equal(sections[2].type, 'tradeoffs');
  assert.equal(sections[3].type, 'next_step');
});

test('formatPrintableParentSummary removes cite tags cleanly', () => {
  const rawSummary = `# Summary\nVerified date from NTA [cite-1-abc] regarding exam timeline.`;
  const cleaned = formatPrintableParentSummary(rawSummary);
  assert.equal(cleaned.includes('[cite-1-abc]'), false);
  assert.equal(cleaned.includes('Verified date from NTA'), true);
});
