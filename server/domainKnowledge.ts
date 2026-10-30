/**
 * Disha - Domain Knowledge, Official Source Hierarchy & Grounding Parser
 * Source of truth: 03_DOMAIN_KNOWLEDGE_AND_SOURCES.md
 */

export interface SourceCitation {
  id: string;
  title: string;
  url: string;
  domain: string;
  authority: string;
  verificationStatus: 'verified_official' | 'secondary_context' | 'unverified';
  academicYear?: string;
  checkedAt: string; // ISO timestamp of server check
  snippet?: string;
}

export interface OfficialAuthority {
  name: string;
  domains: string[];
  description: string;
  portalUrl: string;
  stateOrNational: 'National' | 'Gujarat' | 'International';
}

export const OFFICIAL_AUTHORITIES: OfficialAuthority[] = [
  {
    name: 'National Testing Agency (NTA)',
    domains: ['nta.ac.in'],
    description: 'Autonomous testing agency conducting JEE Main, NEET UG, CUET, and other national exams.',
    portalUrl: 'https://nta.ac.in/',
    stateOrNational: 'National',
  },
  {
    name: 'JEE (Main) Official Portal',
    domains: ['jeemain.nta.nic.in', 'jeemain.nta.ac.in'],
    description: 'National Engineering Entrance Exam portal for NITs, IIITs, CFTIs and JEE Advanced qualifying.',
    portalUrl: 'https://jeemain.nta.nic.in/',
    stateOrNational: 'National',
  },
  {
    name: 'NEET (UG) Official Portal',
    domains: ['neet.nta.nic.in', 'neet.nta.ac.in'],
    description: 'National Eligibility cum Entrance Test for undergraduate medical & dental courses across India.',
    portalUrl: 'https://neet.nta.nic.in/',
    stateOrNational: 'National',
  },
  {
    name: 'CUET (UG) Official Portal',
    domains: ['cuet.nta.nic.in', 'cuetug.ntaonline.in', 'exams.nta.ac.in/CUET-UG'],
    description: 'Common University Entrance Test for Central and participating State / Private Universities.',
    portalUrl: 'https://cuet.nta.nic.in/',
    stateOrNational: 'National',
  },
  {
    name: 'Admission Committee for Professional Courses (ACPC) Gujarat',
    domains: ['gujacpc.admissions.nic.in', 'jacpcldce.ac.in'],
    description: 'Official centralized admission portal for Engineering, Pharmacy, Architecture, and Diploma in Gujarat.',
    portalUrl: 'https://gujacpc.admissions.nic.in/',
    stateOrNational: 'Gujarat',
  },
  {
    name: 'Education Department, Government of Gujarat',
    domains: ['education.gujarat.gov.in', 'gseb.org'],
    description: 'Official Gujarat state education ministry and GSEB board examination portal.',
    portalUrl: 'https://education.gujarat.gov.in/',
    stateOrNational: 'Gujarat',
  },
  {
    name: 'University Grants Commission (UGC)',
    domains: ['ugc.gov.in', 'deb.ugc.ac.in'],
    description: 'Statutory body for standards, coordination and recognition of higher education institutions in India.',
    portalUrl: 'https://www.ugc.gov.in/',
    stateOrNational: 'National',
  },
  {
    name: 'National Career Service (NCS) - MoLE',
    domains: ['ncs.gov.in'],
    description: 'Official national employment and career counseling platform by Ministry of Labour and Employment.',
    portalUrl: 'https://www.ncs.gov.in/',
    stateOrNational: 'National',
  },
  {
    name: 'NCERT (National Council of Educational Research & Training)',
    domains: ['ncert.nic.in'],
    description: 'Apex national organization for school curriculum, vocational guidelines and career guidance materials.',
    portalUrl: 'https://ncert.nic.in/',
    stateOrNational: 'National',
  },
];

/**
 * Classifies a URL based on the strict hierarchy in 03_DOMAIN_KNOWLEDGE_AND_SOURCES.md
 */
export function classifySource(url: string, title?: string): {
  verificationStatus: 'verified_official' | 'secondary_context' | 'unverified';
  authority: string;
  domain: string;
} {
  let hostname = '';
  try {
    const parsed = new URL(url);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return {
      verificationStatus: 'unverified',
      authority: 'External Link',
      domain: url,
    };
  }

  // 1. Check known official authorities
  for (const auth of OFFICIAL_AUTHORITIES) {
    if (auth.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
      return {
        verificationStatus: 'verified_official',
        authority: auth.name,
        domain: hostname,
      };
    }
  }

  // 2. Check general government and public institutional domains in India
  if (
    hostname.endsWith('.gov.in') ||
    hostname.endsWith('.nic.in') ||
    hostname.endsWith('.res.in') ||
    hostname.endsWith('.ac.in') ||
    hostname.endsWith('.edu.in')
  ) {
    let guessedAuthority = 'Government / Academic Portal';
    if (hostname.includes('gujarat') || hostname.includes('guj')) {
      guessedAuthority = 'Govt. of Gujarat Portal';
    } else if (hostname.includes('nta')) {
      guessedAuthority = 'National Testing Agency Portal';
    } else if (hostname.includes('ugc')) {
      guessedAuthority = 'UGC Higher Education Portal';
    }
    return {
      verificationStatus: 'verified_official',
      authority: guessedAuthority,
      domain: hostname,
    };
  }

  // 3. Check international accredited universities / visa authorities
  if (hostname.endsWith('.gov') || hostname.endsWith('.edu')) {
    return {
      verificationStatus: 'verified_official',
      authority: 'Accredited Institution / Official Govt',
      domain: hostname,
    };
  }

  // 4. Secondary context: reputable news and recognized research bodies
  const reputableMedia = [
    'thehindu.com',
    'indianexpress.com',
    'timesofindia.indiatimes.com',
    'hindustantimes.com',
    'ndtv.com',
    'livemint.com',
    'bbc.com',
    'reuters.com',
  ];
  if (reputableMedia.some(media => hostname === media || hostname.endsWith('.' + media))) {
    return {
      verificationStatus: 'secondary_context',
      authority: 'National Media / Educational Reporting',
      domain: hostname,
    };
  }

  // 5. Unverified / Coaching / Third-party commercial portals
  return {
    verificationStatus: 'unverified',
    authority: 'Third-Party Source (Unverified Authority)',
    domain: hostname,
  };
}

/**
 * Parses Gemini GroundingMetadata safely into clean citations.
 */
export function parseGroundingMetadata(metadata: any): SourceCitation[] {
  if (!metadata) return [];

  const citations: SourceCitation[] = [];
  const checkedAt = new Date().toISOString();

  // If search grounding chunks are present
  const chunks = metadata.groundingChunks || [];
  let chunkIdx = 0;
  for (const chunk of chunks) {
    if (chunk.web && chunk.web.uri) {
      const uri = chunk.web.uri;
      const title = chunk.web.title || 'Official Source Reference';
      const classification = classifySource(uri, title);

      // Try to determine academic year if mentioned in title or URI
      let academicYear: string | undefined;
      const yearMatch = (title + ' ' + uri).match(/\b(202[4-7](-[0-9]{2,4})?)\b/);
      if (yearMatch) {
        academicYear = yearMatch[1];
      }

      citations.push({
        id: `cite-${chunkIdx++}-${Date.now().toString(36)}`,
        title,
        url: uri,
        domain: classification.domain,
        authority: classification.authority,
        verificationStatus: classification.verificationStatus,
        academicYear,
        checkedAt,
      });
    }
  }

  // Deduplicate by URL
  const unique = new Map<string, SourceCitation>();
  for (const c of citations) {
    if (!unique.has(c.url)) {
      unique.set(c.url, c);
    }
  }

  return Array.from(unique.values());
}

/**
 * Starter fallback portals when no grounding citations are returned
 */
export function getRecommendedPortalsForQuery(query: string): OfficialAuthority[] {
  const lower = query.toLowerCase();
  const matched: OfficialAuthority[] = [];

  if (lower.includes('gujarat') || lower.includes('acpc') || lower.includes('ahmedabad') || lower.includes('gseb')) {
    matched.push(OFFICIAL_AUTHORITIES.find(a => a.name.includes('ACPC'))!);
    matched.push(OFFICIAL_AUTHORITIES.find(a => a.name.includes('Gujarat'))!);
  }
  if (lower.includes('neet') || lower.includes('doctor') || lower.includes('mbbs') || lower.includes('medical') || lower.includes('bds')) {
    matched.push(OFFICIAL_AUTHORITIES.find(a => a.name.includes('NEET'))!);
  }
  if (lower.includes('jee') || lower.includes('engineering') || lower.includes('btech') || lower.includes('nit') || lower.includes('iit')) {
    matched.push(OFFICIAL_AUTHORITIES.find(a => a.name.includes('JEE'))!);
  }
  if (lower.includes('cuet') || lower.includes('college') || lower.includes('ba ') || lower.includes('bsc ') || lower.includes('bcom')) {
    matched.push(OFFICIAL_AUTHORITIES.find(a => a.name.includes('CUET'))!);
  }

  // Deduplicate by authority name
  const uniquePortals = new Map<string, OfficialAuthority>();
  for (const portal of matched.filter(Boolean)) {
    if (!uniquePortals.has(portal.name)) {
      uniquePortals.set(portal.name, portal);
    }
  }

  return Array.from(uniquePortals.values());
}
