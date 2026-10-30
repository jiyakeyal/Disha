/**
 * Disha — Career Choices, Clearly
 * Conversational career-exploration companion for Indian students aged 14–19 & parents.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeBanner } from './components/WelcomeBanner';
import { MessageItem } from './components/MessageItem';
import { PromptComposer } from './components/PromptComposer';
import { ParentSummaryModal } from './components/ParentSummaryModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { EvaluationPanel } from './components/EvaluationPanel';
import { MessageItem as MessageItemType, UserSettings } from './lib/types';
import { Compass, AlertCircle } from 'lucide-react';
import { classifyVerification, extractHostname } from './lib/sourceVerifier';
import { ResponseWaiting } from './components/ResponseWaiting';

export default function App() {
  const [messages, setMessages] = useState<MessageItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForChat, setIsWaitingForChat] = useState(false);
  const [isChatRequest, setIsChatRequest] = useState(false);
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
    setIsWaitingForChat(true);
    setIsChatRequest(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/chat/stream', {
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

      if (!response.body) throw new Error('Streaming is unavailable.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const modelId = `disha-${Date.now().toString(36)}`;
      let buffer = '', content = '', completed = false;
      const processLine = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === 'text') {
          content += event.text;
          setIsWaitingForChat(false);
          setMessages(prev => {
            const existing = prev.some(m => m.id === modelId);
            return existing
              ? prev.map(m => m.id === modelId ? { ...m, content } : m)
              : [...prev, { id: modelId, role: 'model', content, timestamp: new Date().toISOString(), isStreaming: true }];
          });
        } else if (event.type === 'done') {
          completed = true;
          setMessages(prev => prev.map(m => m.id === modelId ? { ...m, isStreaming: false, citations: (event.citations || []).map((c: { title: string; url: string }) => ({ ...c, id: c.url, domain: extractHostname(c.url), authority: extractHostname(c.url), verificationStatus: classifyVerification(c.url), checkedAt: event.checkedAt })), recommendedPortals: event.recommendedPortals || [], timestamp: event.checkedAt } : m));
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      };
      while (true) {
        const part = await reader.read();
        buffer += decoder.decode(part.value, { stream: !part.done });
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        lines.forEach(processLine);
        if (part.done) break;
      }
      if (buffer.trim()) processLine(buffer);
      if (!completed) throw new Error('The response ended unexpectedly.');
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
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
      setIsWaitingForChat(false);
      setIsChatRequest(false);
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsWaitingForChat(false);
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
    <div className="min-h-screen disha-mosaic-bg text-stone-900 selection:bg-orange-200 flex flex-col justify-between">
      {/* Top Floating Glass Header Capsule (Matching 'TRIBE CAPITAL' in image) */}
      <Header
        onOpenParentSummary={handleGenerateParentSummary}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenEvaluation={() => setIsEvaluationOpen(true)}
        onResetSession={handleResetSession}
        hasMessages={messages.length > 0}
      />

      {/* Main Content Area over the Pixel Mosaic Background */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col justify-between">
        {messages.length === 0 ? (
          <WelcomeBanner onSelectPrompt={(text) => handleSendMessage(text)} />
        ) : (
          <div className="flex-1 space-y-4 max-w-3xl mx-auto w-full pb-6">
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onRetry={(text) => handleSendMessage(text)}
                speechAudioEnabled={settings.speechAudioEnabled}
              />
            ))}

            {isLoading && isWaitingForChat && <ResponseWaiting />}
            {isLoading && !isChatRequest && (
              <div className="glass-card rounded-2xl px-5 py-4 text-sm text-stone-800">Working on your request...</div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </main>

      {/* Floating Prompt Composer with Frosted Glass Pill & Crisp White Buttons */}
      <div className="composer-background sticky bottom-0 z-30">
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
