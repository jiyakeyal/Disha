import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: **bold**, *italic*, `code`, and [link](url)
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex pattern matching:
  // 1. [link text](url)
  // 2. **bold**
  // 3. *italic* or _italic_
  // 4. `code`
  const regex = /(\[.+?\]\(.+?\))|(\*\*.+?\*\*)|(\*[^*]+?\*)|(_[^_]+?_)|(`[^`]+?`)/g;
  const parts = text.split(regex).filter(Boolean);

  return parts.map((part, index) => {
    // 1. Link [text](url)
    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-800 hover:text-amber-950 font-medium underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // 2. Bold **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-stone-900">
          {renderInline(part.slice(2, -2))}
        </strong>
      );
    }

    // 3. Italic *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-stone-700">
          {renderInline(part.slice(1, -1))}
        </em>
      );
    }

    // 4. Inline code `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="bg-stone-100 text-stone-800 px-1 py-0.5 rounded text-xs font-mono border border-stone-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Plain text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Clean, safe Markdown renderer for chat responses without heavy external dependencies
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={key} className="space-y-1.5 my-2 pl-1">
          {currentList.items.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2 text-stone-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 mt-2 flex-shrink-0" />
              <div className="flex-1 leading-relaxed">{renderInline(item)}</div>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key} className="space-y-1.5 my-2 pl-1 list-none">
          {currentList.items.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2 text-stone-800">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {itemIdx + 1}
              </span>
              <div className="flex-1 leading-relaxed">{renderInline(item)}</div>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      flushList(`list-before-${i}`);
      continue;
    }

    // Horizontal Rule (--- or ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(`list-before-${i}`);
      elements.push(<hr key={`hr-${i}`} className="my-3 border-stone-200" />);
      continue;
    }

    // Heading 1: # Title
    if (trimmed.startsWith('# ')) {
      flushList(`list-before-${i}`);
      elements.push(
        <h2 key={`h1-${i}`} className="font-serif-editorial font-bold text-lg text-stone-900 mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Heading 2: ## Title
    if (trimmed.startsWith('## ')) {
      flushList(`list-before-${i}`);
      elements.push(
        <h3 key={`h2-${i}`} className="font-serif-editorial font-bold text-base text-stone-900 mt-3.5 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    // Heading 3: ### Title
    if (trimmed.startsWith('### ')) {
      flushList(`list-before-${i}`);
      elements.push(
        <h4 key={`h3-${i}`} className="font-bold text-sm text-stone-900 mt-3 mb-1 flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }

    // Heading 4: #### Title
    if (trimmed.startsWith('#### ')) {
      flushList(`list-before-${i}`);
      elements.push(
        <h5 key={`h4-${i}`} className="font-semibold text-xs text-stone-800 uppercase tracking-wider mt-2.5 mb-1">
          {renderInline(trimmed.slice(5))}
        </h5>
      );
      continue;
    }

    // Unordered list item (* or -)
    // Matches "* item", "- item", or "* *Sub-bullet:*"
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(`list-before-${i}`);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered list item (e.g. "1. item", "2. item")
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(`list-before-${i}`);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberedMatch[1]);
      continue;
    }

    // Standard paragraph
    flushList(`list-before-${i}`);
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList('list-end');

  return <div className={`markdown-body space-y-1 ${className}`}>{elements}</div>;
};
