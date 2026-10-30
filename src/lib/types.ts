/**
 * Disha - Core Types
 */

export interface SourceCitation {
  id: string;
  title: string;
  url: string;
  domain: string;
  authority: string;
  verificationStatus: 'verified_official' | 'secondary_context' | 'unverified';
  academicYear?: string;
  checkedAt: string;
  snippet?: string;
}

export interface OfficialAuthority {
  name: string;
  domains: string[];
  description: string;
  portalUrl: string;
  stateOrNational: 'National' | 'Gujarat' | 'International';
}

export interface MessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  citations?: SourceCitation[];
  recommendedPortals?: OfficialAuthority[];
  isError?: boolean;
  isStreaming?: boolean;
  documentMeta?: {
    filename: string;
    verifiedByStudent?: boolean;
  };
}

export type PersonaStyle = 'friendly_expert' | 'question_coach' | 'calm_guide';
export type LanguageChoice = 'english' | 'hinglish' | 'gujarati_blend';

export interface UserSettings {
  personaStyle: PersonaStyle;
  language: LanguageChoice;
  speechAudioEnabled: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large';
}

export interface TestScenario {
  id: string;
  title: string;
  prompt: string;
  category: 'Stream Choice' | 'Official Fact' | 'Ambiguity' | 'Safety' | 'Failure' | 'Accessibility';
  expectedBehavior: string;
  status: 'not run' | 'passed' | 'failed' | 'blocked' | 'running';
  lastRunAt?: string;
  actualResponse?: string;
  actualCitations?: SourceCitation[];
  scores?: {
    accuracy: number; // 0-2
    clarity: number; // 0-2
    agency: number; // 0-2
    privacy: number; // 0-2
  };
  notes?: string;
}
