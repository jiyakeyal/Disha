/**
 * Disha - Response Formatting & Parent Summary Logic
 */

export interface ParsedResponseSection {
  title: string;
  type: 'heard' | 'options' | 'tradeoffs' | 'sources' | 'next_step' | 'general';
  content: string;
}

/**
 * Extracts structured sections from Disha markdown output
 */
export function parseResponseSections(markdown: string): ParsedResponseSection[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const sections: ParsedResponseSection[] = [];
  let currentTitle = 'Overview';
  let currentType: ParsedResponseSection['type'] = 'general';
  let currentBuffer: string[] = [];

  const flush = () => {
    if (currentBuffer.length > 0) {
      const text = currentBuffer.join('\n').trim();
      if (text) {
        sections.push({
          title: currentTitle,
          type: currentType,
          content: text,
        });
      }
      currentBuffer = [];
    }
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s*(.+)$/);
    const boldHeadingMatch = line.match(/^\*\*(.+?)\*\*$/);

    const titleCandidate = headingMatch ? headingMatch[1].replace(/\*+/g, '').trim() : (boldHeadingMatch ? boldHeadingMatch[1].trim() : null);

    if (titleCandidate) {
      const lower = titleCandidate.toLowerCase();
      let detectedType: ParsedResponseSection['type'] = 'general';

      if (lower.includes('heard') || lower.includes('consideration') || lower.includes('priorities')) {
        detectedType = 'heard';
      } else if (lower.includes('option') || lower.includes('compare') || lower.includes('pathway')) {
        detectedType = 'options';
      } else if (lower.includes('trade-off') || lower.includes('prerequisite') || lower.includes('verify')) {
        detectedType = 'tradeoffs';
      } else if (lower.includes('source') || lower.includes('official') || lower.includes('verification')) {
        detectedType = 'sources';
      } else if (lower.includes('next step') || lower.includes('action')) {
        detectedType = 'next_step';
      }

      if (detectedType !== 'general') {
        flush();
        currentTitle = titleCandidate;
        currentType = detectedType;
        continue;
      }
    }

    currentBuffer.push(line);
  }

  flush();

  // If no sections were parsed, return whole content as general
  if (sections.length === 0) {
    return [{
      title: 'Guidance',
      type: 'general',
      content: markdown.trim(),
    }];
  }

  return sections;
}

/**
 * Formats a clean printable HTML or Text for Parent Summary
 */
export function formatPrintableParentSummary(markdown: string): string {
  // Cleans internal artifacts if any
  return markdown.replace(/\[cite-[^\]]+\]/g, '').trim();
}
