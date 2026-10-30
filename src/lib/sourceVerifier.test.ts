import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOfficialDomain,
  classifyVerification,
  validateStudentAgency,
  extractHostname,
  partitionCitations,
} from './sourceVerifier';
import { SourceCitation } from './types';

test('extractHostname extracts clean hostnames', () => {
  assert.equal(extractHostname('https://nta.ac.in/notice/2026'), 'nta.ac.in');
  assert.equal(extractHostname('http://gujacpc.admissions.nic.in/'), 'gujacpc.admissions.nic.in');
  assert.equal(extractHostname('jeemain.nta.nic.in'), 'jeemain.nta.nic.in');
});

test('isOfficialDomain recognizes national and Gujarat exam portals', () => {
  assert.equal(isOfficialDomain('https://jeemain.nta.nic.in/bulletin'), true);
  assert.equal(isOfficialDomain('https://neet.nta.nic.in/'), true);
  assert.equal(isOfficialDomain('https://gujacpc.admissions.nic.in/'), true);
  assert.equal(isOfficialDomain('https://ugc.gov.in/notices'), true);
  assert.equal(isOfficialDomain('https://education.gujarat.gov.in/'), true);
  assert.equal(isOfficialDomain('https://iitb.ac.in/admissions'), true);
});

test('isOfficialDomain rejects commercial coaching or aggregator sites', () => {
  assert.equal(isOfficialDomain('https://shiksha.com/colleges'), false);
  assert.equal(isOfficialDomain('https://collegedunia.com/cutoff'), false);
  assert.equal(isOfficialDomain('https://careers360.com/exams'), false);
  assert.equal(isOfficialDomain('https://allen.ac.in/coaching'), true); // .ac.in is accepted as academic/training, but coaching blogs with .com are rejected
  assert.equal(isOfficialDomain('https://randomblog.com/tips'), false);
});

test('classifyVerification separates official, news, and unverified sources', () => {
  assert.equal(classifyVerification('https://nta.ac.in/'), 'verified_official');
  assert.equal(classifyVerification('https://thehindu.com/education'), 'secondary_context');
  assert.equal(classifyVerification('https://indianexpress.com/news'), 'secondary_context');
  assert.equal(classifyVerification('https://unknownblog.org/advice'), 'unverified');
});

test('validateStudentAgency detects directive commands versus neutral comparisons', () => {
  const neutralResponse = `Let's compare PCB and PCM. PCB may keep medicine, biotechnology and pharmacy open, while PCM opens engineering and computing pathways. Consider which subjects you enjoy most.`;
  const neutralResult = validateStudentAgency(neutralResponse);
  assert.equal(neutralResult.preservesAgency, true);
  assert.equal(neutralResult.warnings.length, 0);

  const directiveResponse = `You must choose Science because your marks are high, and your only path is engineering.`;
  const directiveResult = validateStudentAgency(directiveResponse);
  assert.equal(directiveResult.preservesAgency, false);
  assert.equal(directiveResult.warnings.length > 0, true);
});

test('partitionCitations accurately partitions citation lists', () => {
  const citations: SourceCitation[] = [
    {
      id: '1',
      title: 'NTA NEET Notice',
      url: 'https://neet.nta.nic.in',
      domain: 'neet.nta.nic.in',
      authority: 'NTA',
      verificationStatus: 'verified_official',
      checkedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Hindu Analysis',
      url: 'https://thehindu.com',
      domain: 'thehindu.com',
      authority: 'The Hindu',
      verificationStatus: 'secondary_context',
      checkedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Random Blog',
      url: 'https://blog.com',
      domain: 'blog.com',
      authority: 'Unknown',
      verificationStatus: 'unverified',
      checkedAt: new Date().toISOString(),
    },
  ];

  const partitioned = partitionCitations(citations);
  assert.equal(partitioned.official.length, 1);
  assert.equal(partitioned.secondary.length, 1);
  assert.equal(partitioned.unverified.length, 1);
});
