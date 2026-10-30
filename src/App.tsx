/**
 * Disha — Career Choices, Clearly
 * Conversational career-exploration companion for Indian students aged 14–19 & parents.
 */

import React, { useState, useRef, useEffect } from 'react';
import { PixelArtHeader } from './components/PixelArtHeader';
import { WelcomeBanner } from './components/WelcomeBanner';
import { MessageItem } from './components/MessageItem';
import { PromptComposer } from './components/PromptComposer';
import { ParentSummaryModal } from './components/ParentSummaryModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { EvaluationPanel } from './components/EvaluationPanel';
import { MessageItem as MessageItemType, UserSettings } from './lib/types';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<MessageItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Modals state
  const [isParentSummaryOpen, setIsParentSummaryOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);

  // Summary state
  const [summaryMarkdown, setSummaryMarkdown] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // User Settings
  const [settings, setSettings] = useState<UserSettings>({
    personaStyle: 'friendly_expert',
    language: 'english',
    speechAudioEnabled: true,
    highContrast: false,
    fontSize: 'normal',
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Primary API message handler
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: MessageItemType = {
      id: `usr-${Date.now().toString(36)}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          personaStyle: settings.personaStyle,
          language: settings.language,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      const modelMessage: MessageItemType = {
        id: `disha-${Date.now().toString(36)}`,
        role: 'model',
        content: data.text || 'I have reflected on your question.',
        timestamp: data.checkedAt || new Date().toISOString(),
        citations: data.citations || [],
        recommendedPortals: data.recommendedPortals || [],
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User cancelled request.');
      } else {
        console.error('Error fetching Disha response:', err);
        const errorMessage: MessageItemType = {
          id: `err-${Date.now().toString(36)}`,
          role: 'model',
          content: `Disha could not complete this request: ${err.message}. Please check your connection or try asking again.`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleResetSession = () => {
    if (abortController) {
      abortController.abort();
    }
    setMessages([]);
    setSummaryMarkdown('');
    setIsLoading(false);
  };

  // Transient Document Analysis
  const handleAnalyzeDocument = async (base64Data: string, mimeType: string, filename: string) => {
    const userDocMessage: MessageItemType = {
      id: `usr-doc-${Date.now().toString(36)}`,
      role: 'user',
      content: `I've shared a redacted document (${filename}) for marks/subject checking.`,
      timestamp: new Date().toISOString(),
      documentMeta: {
        filename,
      },
    };
    setMessages((prev) => [...prev, userDocMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType, filename }),
      });

      if (!response.ok) {
        throw new Error('Document analysis failed.');
      }

      const data = await response.json();
      const modelDocMessage: MessageItemType = {
        id: `disha-doc-${Date.now().toString(36)}`,
        role: 'model',
        content: data.analysis,
        timestamp: data.checkedAt || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, modelDocMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-doc-${Date.now().toString(36)}`,
          role: 'model',
          content: 'I could not analyze this document. Please ensure the image is clear and text is legible, or write your subjects and marks directly in the chat.',
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Parent Summary Generator
  const handleGenerateParentSummary = async () => {
    if (messages.length === 0) return;
    setIsParentSummaryOpen(true);
    setIsGeneratingSummary(true);

    try {
      const response = await fetch('/api/parent-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary.');
      }

      const data = await response.json();
      setSummaryMarkdown(data.summaryMarkdown || '');
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setSummaryMarkdown(
        '# Disha — Family Conversation Summary\n\nCould not automatically generate summary. Please ensure there is active conversation content.'
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Run test prompt for evaluation panel
  const handleRunTestPromptForEval = async (prompt: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        history: [],
        personaStyle: settings.personaStyle,
        language: settings.language,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-[#eceae6] text-stone-900 selection:bg-orange-200 py-0 sm:py-6 px-0 sm:px-4 flex justify-center items-start">
      {/* Centered Presentation Card (Matching Reference Photo Frame) */}
      <div className="w-full max-w-4xl bg-white rounded-none sm:rounded-[36px] shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col min-h-screen sm:min-h-[92vh]">
        {/* Pixel Art Mosaic Header with Frosted Glass Buttons */}
        <PixelArtHeader
          onOpenParentSummary={handleGenerateParentSummary}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenEvaluation={() => setIsEvaluationOpen(true)}
          onResetSession={handleResetSession}
          hasMessages={messages.length > 0}
        />

        {/* Main Pure White Content Area */}
        <main className="flex-1 w-full px-4 sm:px-8 py-5 sm:py-6 flex flex-col justify-between bg-white">
          {messages.length === 0 ? (
            <WelcomeBanner onSelectPrompt={(text) => handleSendMessage(text)} />
          ) : (
            <div className="flex-1 space-y-4 max-w-3xl mx-auto w-full">
              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onRetry={(text) => handleSendMessage(text)}
                  speechAudioEnabled={settings.speechAudioEnabled}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="rounded-3xl rounded-tl-xs bg-white border border-orange-200/90 px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        Disha is reviewing official sources & structuring trade-offs...
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Checking official portals and ensuring neutral, choice-preserving comparisons
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}
        </main>

        {/* Message Composer anchored cleanly at bottom of the white card */}
        <PromptComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          onOpenUploadModal={() => setIsDocumentUploadOpen(true)}
          hasMessages={messages.length > 0}
        />
      </div>

      {/* Modals & Drawers */}
      <ParentSummaryModal
        isOpen={isParentSummaryOpen}
        onClose={() => setIsParentSummaryOpen(false)}
        summaryMarkdown={summaryMarkdown}
        isLoading={isGeneratingSummary}
        onRegenerate={handleGenerateParentSummary}
      />

      <DocumentUploadModal
        isOpen={isDocumentUploadOpen}
        onClose={() => setIsDocumentUploadOpen(false)}
        onAnalyzeDocument={handleAnalyzeDocument}
        isLoading={isLoading}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        onResetSession={handleResetSession}
      />

      <EvaluationPanel
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        onRunTestPrompt={handleRunTestPromptForEval}
      />
    </div>
  );
}
