/**
 * Disha - Pure Logic for Domain Classification & Fact Verification
 * Used by client & server, rigorously tested with unit tests
 */

import { SourceCitation } from './types';

export const KNOWN_OFFICIAL_DOMAINS = [
  'nta.ac.in',
  'jeemain.nta.nic.in',
  'neet.nta.nic.in',
  'cuet.nta.nic.in',
  'gujacpc.admissions.nic.in',
  'education.gujarat.gov.in',
  'gseb.org',
  'ugc.gov.in',
  'ncs.gov.in',
  'ncert.nic.in',
  'aicte-india.org',
  'nmc.org.in',
  'pci.nic.in',
];

/**
 * Extracts normalized hostname from URL
 */
export function extractHostname(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return url.hostname.toLowerCase();
  } catch {
    return rawUrl.toLowerCase().trim();
  }
}

/**
 * Checks whether a given hostname is an official authority domain
 */
export function isOfficialDomain(hostnameOrUrl: string): boolean {
  const host = extractHostname(hostnameOrUrl);

  // Exact match or subdomain of known official portals
  for (const domain of KNOWN_OFFICIAL_DOMAINS) {
    if (host === domain || host.endsWith('.' + domain)) {
      return true;
    }
  }

  // General Indian official government and academic TLDs
  if (
    host.endsWith('.gov.in') ||
    host.endsWith('.nic.in') ||
    host.endsWith('.res.in') ||
    host.endsWith('.ac.in') ||
    host.endsWith('.edu.in')
  ) {
    return true;
  }

  // Global recognized government & university domains
  if (host.endsWith('.gov') || host.endsWith('.edu')) {
    return true;
  }

  return false;
}

/**
 * Classifies domain verification status
 */
export function classifyVerification(url: string): 'verified_official' | 'secondary_context' | 'unverified' {
  if (isOfficialDomain(url)) {
    return 'verified_official';
  }

  const host = extractHostname(url);
  const mediaAndResearch = [
    'thehindu.com',
    'indianexpress.com',
    'timesofindia.indiatimes.com',
    'hindustantimes.com',
    'ndtv.com',
    'livemint.com',
    'bbc.com',
  ];

  if (mediaAndResearch.some(m => host === m || host.endsWith('.' + m))) {
    return 'secondary_context';
  }

  return 'unverified';
}

/**
 * Checks whether a student guidance response preserves student agency
 * (i.e. does not command or dictate the student's decision).
 */
export function validateStudentAgency(text: string): {
  preservesAgency: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const lower = text.toLowerCase();

  // Flag directive language that removes choice
  const directivePhrases = [
    'you must choose',
    'you should definitely pick',
    'science is the only option',
    'i have decided that',
    'your only path is',
    'you have to select',
  ];

  for (const phrase of directivePhrases) {
    if (lower.includes(phrase)) {
      warnings.push(`Response contains directive phrase: "${phrase}". Should offer neutral trade-offs instead.`);
    }
  }

  return {
    preservesAgency: warnings.length === 0,
    warnings,
  };
}

/**
 * Separates verified citations from secondary and unverified citations
 */
export function partitionCitations(citations: SourceCitation[]): {
  official: SourceCitation[];
  secondary: SourceCitation[];
  unverified: SourceCitation[];
} {
  const official: SourceCitation[] = [];
  const secondary: SourceCitation[] = [];
  const unverified: SourceCitation[] = [];

  for (const c of citations) {
    if (c.verificationStatus === 'verified_official') {
      official.push(c);
    } else if (c.verificationStatus === 'secondary_context') {
      secondary.push(c);
    } else {
      unverified.push(c);
    }
  }

  return { official, secondary, unverified };
}
