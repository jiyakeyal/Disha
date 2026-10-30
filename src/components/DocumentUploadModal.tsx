import React, { useState, useRef } from 'react';
import { X, Upload, ShieldCheck, FileCheck, AlertTriangle, FileText, Sparkles } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeDocument: (base64Data: string, mimeType: string, filename: string) => Promise<void>;
  isLoading: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeDocument,
  isLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    base64Data: string;
    mimeType: string;
    filename: string;
    previewUrl?: string;
  } | null>(null);
  const [redactionConfirmed, setRedactionConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedFile({
        base64Data: base64,
        mimeType: file.type || 'image/png',
        filename: file.name,
        previewUrl: file.type.startsWith('image/') ? base64 : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  // Synthetic sample documents for safe testing without exposing real documents
  const loadSyntheticSample = (type: 'gseb10' | 'cbse12') => {
    setErrorMsg(null);
    setRedactionConfirmed(true);

    // Create a clean synthetic canvas rendering for instant demo
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 400);

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 18px serif';
      ctx.fillText(
        type === 'gseb10'
          ? 'Gujarat Secondary & Higher Secondary Education Board (GSEB)'
          : 'Central Board of Secondary Education (CBSE)',
        30,
        40
      );

      ctx.fillStyle = '#475569';
      ctx.font = '14px sans-serif';
      ctx.fillText('SAMPLE STUDENT STATEMENT OF MARKS (REDACTED)', 30, 65);
      ctx.fillText('[Candidate Name: REDACTED]   [Seat No: REDACTED]', 30, 85);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, 105, 540, 240);

      // Table headers
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(30, 105, 540, 30);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Subject Name', 45, 125);
      ctx.fillText('Max Marks', 280, 125);
      ctx.fillText('Marks Obtained', 420, 125);

      // Subjects
      ctx.font = '13px sans-serif';
      const subjects =
        type === 'gseb10'
          ? [
              ['Mathematics (Standard)', '100', '84'],
              ['Science & Technology', '100', '91'],
              ['Social Science', '100', '79'],
              ['English First Language', '100', '88'],
              ['Gujarati Second Language', '100', '82'],
            ]
          : [
              ['Physics', '100', '86'],
              ['Chemistry', '100', '89'],
              ['Biology', '100', '93'],
              ['English Core', '100', '90'],
              ['Physical Education', '100', '95'],
            ];

      subjects.forEach((sub, idx) => {
        const y = 160 + idx * 35;
        ctx.fillStyle = '#334155';
        ctx.fillText(sub[0], 45, y);
        ctx.fillText(sub[1], 290, y);
        ctx.fillText(sub[2], 430, y);
      });

      const syntheticDataUrl = canvas.toDataURL('image/png');
      setSelectedFile({
        base64Data: syntheticDataUrl,
        mimeType: 'image/png',
        filename: type === 'gseb10' ? 'sample_gseb_class10_redacted.png' : 'sample_cbse_class12_pcb_redacted.png',
        previewUrl: syntheticDataUrl,
      });
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !redactionConfirmed) return;
    await onAnalyzeDocument(selectedFile.base64Data, selectedFile.mimeType, selectedFile.filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-editorial font-bold text-base text-stone-900">
                Transient Document Review
              </h3>
              <p className="text-xs text-stone-500">
                Redact identifiers first. No raw files are saved to database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-stone-700 space-y-4">
          {/* Strict Redaction Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-amber-900 mb-0.5">Please Redact Personal Identifiers:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-900/90">
                <li>Never upload Aadhaar card or government identity documents.</li>
                <li>Black out or crop candidate name, roll number, address, and photograph.</li>
                <li>Disha only uses subject names and scores to suggest eligible pathways.</li>
              </ul>
            </div>
          </div>

          {/* Quick Demo Samples */}
          <div>
            <div className="font-medium text-stone-600 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Or test with a safe, synthetic redacted sample:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadSyntheticSample('gseb10')}
                className="flex-1 p-2 rounded-lg border border-stone-300 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 text-stone-800 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-xs">GSEB Class 10 (Gujarat)</div>
                <div className="text-[10px] text-stone-500">Redacted synthetic marksheet</div>
              </button>
              <button
                type="button"
                onClick={() => loadSyntheticSample('cbse12')}
                className="flex-1 p-2 rounded-lg border border-stone-300 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 text-stone-800 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-xs">CBSE Class 12 (PCB)</div>
                <div className="text-[10px] text-stone-500">Redacted synthetic marksheet</div>
              </button>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Upload className="w-6 h-6 text-stone-400 mx-auto mb-2" />
            <div className="font-semibold text-stone-800">
              {selectedFile ? selectedFile.filename : 'Choose a redacted document or image'}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">PNG, JPEG, WebP or PDF (Max 5MB)</div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Preview if available */}
          {selectedFile?.previewUrl && (
            <div className="border border-stone-200 rounded-xl p-2 bg-stone-100 flex items-center justify-center max-h-48 overflow-hidden">
              <img
                src={selectedFile.previewUrl}
                alt="Document preview"
                className="max-h-44 object-contain rounded"
              />
            </div>
          )}

          {/* Redaction Confirmation Checkbox */}
          {selectedFile && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={redactionConfirmed}
                onChange={(e) => setRedactionConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-amber-800 focus:ring-amber-500"
              />
              <span className="text-stone-800 leading-tight">
                <strong>I confirm</strong> that personal identifiers (name, Aadhaar, roll number, photo, address) are
                redacted. I understand Disha analyzes this transiently for subjects and marks only.
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmUpload}
            disabled={!selectedFile || !redactionConfirmed || isLoading}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer ${
              selectedFile && redactionConfirmed && !isLoading
                ? 'bg-amber-800 hover:bg-amber-900 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing transiently...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 h-3.5" />
                <span>Review Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
