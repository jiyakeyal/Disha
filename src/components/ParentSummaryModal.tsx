import React, { useState } from 'react';
import { X, Printer, Copy, Check, Sparkles, AlertCircle, Edit3 } from 'lucide-react';
import { formatPrintableParentSummary } from '../lib/formatters';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ParentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryMarkdown: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

export const ParentSummaryModal: React.FC<ParentSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryMarkdown,
  isLoading,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  // Sync state when summaryMarkdown changes
  React.useEffect(() => {
    if (summaryMarkdown) {
      setEditableContent(formatPrintableParentSummary(summaryMarkdown));
    }
  }, [summaryMarkdown]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-editorial font-bold text-base text-stone-900">
                Disha — 1-Page Family Summary
              </h3>
              <p className="text-xs text-stone-500">
                A concise brief for discussion between student and parents. Preview before sharing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close parent summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Preview */}
        <div className="p-6 overflow-y-auto flex-1 font-normal">
          {isLoading ? (
            <div className="py-16 text-center text-stone-500">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-stone-700">Synthesizing active conversation into a 1-page summary...</p>
              <p className="text-xs text-stone-400 mt-1">Extracting student interests, explored trade-offs, and verified official portals.</p>
            </div>
          ) : (
            <div>
              {/* Privacy reminder */}
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  <strong>Student Review First:</strong> Disha never sends summaries automatically. Feel free to edit or remove any notes before printing or copying.
                </span>
              </div>

              {isEditing ? (
                <div>
                  <div className="flex items-center justify-between mb-2 text-xs text-stone-500 font-medium">
                    <span>Edit summary content:</span>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-amber-800 font-semibold hover:underline"
                    >
                      Done Editing
                    </button>
                  </div>
                  <textarea
                    rows={16}
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                  />
                </div>
              ) : (
                <div className="border border-stone-200 rounded-xl p-5 bg-stone-50/40 text-stone-900 text-xs leading-relaxed font-sans">
                  <MarkdownRenderer content={editableContent} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isLoading && (
          <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'View Preview' : 'Edit Text'}</span>
              </button>
              <button
                onClick={onRegenerate}
                className="px-3 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 text-xs font-medium transition-colors cursor-pointer"
              >
                Regenerate
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
