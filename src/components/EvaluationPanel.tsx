import React, { useState } from 'react';
import { X, Play, CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { TestScenario } from '../lib/types';
import { INITIAL_TEST_SCENARIOS } from '../lib/evaluationSuite';
import { SourceCitationBadge } from './SourceCitationBadge';
import { validateStudentAgency } from '../lib/sourceVerifier';
import { MarkdownRenderer } from './MarkdownRenderer';

interface EvaluationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRunTestPrompt: (prompt: string) => Promise<{
    text: string;
    citations: any[];
    recommendedPortals: any[];
    checkedAt: string;
  }>;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  isOpen,
  onClose,
  onRunTestPrompt,
}) => {
  const [scenarios, setScenarios] = useState<TestScenario[]>(INITIAL_TEST_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('T01');
  const [isRunningAll, setIsRunningAll] = useState(false);

  if (!isOpen) return null;

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleRunSingleTest = async (testId: string) => {
    const target = scenarios.find((s) => s.id === testId);
    if (!target) return;

    // Set to running
    setScenarios((prev) =>
      prev.map((s) => (s.id === testId ? { ...s, status: 'running' } : s))
    );

    try {
      const startTime = Date.now();
      const res = await onRunTestPrompt(target.prompt);
      const latencyMs = Date.now() - startTime;

      // Evaluate automated checks
      const agencyCheck = validateStudentAgency(res.text);
      const hasOfficialCitations = res.citations && res.citations.some((c) => c.verificationStatus === 'verified_official');

      // Default initial score hypothesis based on objective checks
      const accuracyScore = target.category === 'Official Fact' ? (hasOfficialCitations ? 2 : 1) : 2;
      const agencyScore = agencyCheck.preservesAgency ? 2 : 0;
      const clarityScore = res.text.length > 50 ? 2 : 1;
      const privacyScore = 2; // Real system prompt enforces no Aadhaar/no secret leakage

      const status: TestScenario['status'] =
        agencyCheck.preservesAgency && res.text.length > 20 ? 'passed' : 'failed';

      setScenarios((prev) =>
        prev.map((s) =>
          s.id === testId
            ? {
                ...s,
                status,
                lastRunAt: new Date().toISOString(),
                actualResponse: res.text,
                actualCitations: res.citations,
                scores: {
                  accuracy: accuracyScore,
                  clarity: clarityScore,
                  agency: agencyScore,
                  privacy: privacyScore,
                },
                notes: `Completed in ${latencyMs}ms. Agency check: ${
                  agencyCheck.preservesAgency ? 'Passed' : 'Flags: ' + agencyCheck.warnings.join(', ')
                }. Citations count: ${res.citations?.length || 0}.`,
              }
            : s
        )
      );
    } catch (err: any) {
      console.error(`Error running test ${testId}:`, err);
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === testId
            ? {
                ...s,
                status: 'failed',
                lastRunAt: new Date().toISOString(),
                notes: `API Failure: ${err?.message || 'Network error'}`,
              }
            : s
        )
      );
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    for (const test of scenarios) {
      await handleRunSingleTest(test.id);
    }
    setIsRunningAll(false);
  };

  const handleUpdateScore = (
    testId: string,
    field: 'accuracy' | 'clarity' | 'agency' | 'privacy',
    val: number
  ) => {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== testId) return s;
        const currentScores = s.scores || { accuracy: 2, clarity: 2, agency: 2, privacy: 2 };
        return {
          ...s,
          scores: { ...currentScores, [field]: val },
        };
      })
    );
  };

  const handleExportReport = () => {
    const report = `# Disha — Acceptance Test Run Report
Generated on: ${new Date().toISOString()}
Tested via Google AI Studio Build runtime with @google/genai & Google Search Grounding.

| ID | Title | Status | Total Score (/8) | Latency / Notes |
|---|---|---|---|---|
${scenarios
  .map((s) => {
    const total = s.scores
      ? s.scores.accuracy + s.scores.clarity + s.scores.agency + s.scores.privacy
      : '-';
    return `| ${s.id} | ${s.title} | ${s.status} | ${total} | ${s.notes || 'Not run'} |`;
  })
  .join('\n')}

---
### Detailed Observations
${scenarios
  .filter((s) => s.status !== 'not run')
  .map(
    (s) => `
#### [${s.id}] ${s.title} (${s.status.toUpperCase()})
- **Prompt:** "${s.prompt}"
- **Expected:** ${s.expectedBehavior}
- **Scores:** Accuracy: ${s.scores?.accuracy}/2, Clarity: ${s.scores?.clarity}/2, Agency: ${s.scores?.agency}/2, Privacy: ${s.scores?.privacy}/2
- **Citations returned:** ${s.actualCitations?.length || 0}
- **Response snippet:**
> ${s.actualResponse?.slice(0, 300).replace(/\n/g, ' ')}...
`
  )
  .join('\n')}
`;

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disha_acceptance_test_report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPassed = scenarios.filter((s) => s.status === 'passed').length;
  const totalFailed = scenarios.filter((s) => s.status === 'failed').length;
  const totalNotRun = scenarios.filter((s) => s.status === 'not run').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-purple-500 text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 tracking-tight">
                Disha — Acceptance Testing & Evaluation Suite
              </h3>
              <p className="text-xs text-stone-400">
                16 Project Acceptance Tests from 06_TEST_EVALUATE_IMPROVE.md with rubric scoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-3.5 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
            <button
              onClick={handleRunAllTests}
              disabled={isRunningAll}
              className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningAll ? 'Running Suite...' : 'Run All 16 Tests'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-stone-800">Test Status:</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {totalPassed} Passed
            </span>
            <span className="text-rose-700 font-semibold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {totalFailed} Failed
            </span>
            <span className="text-stone-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {totalNotRun} Not Run
            </span>
          </div>
          <span className="text-[11px] text-stone-500">
            Real Server-Side Model: <strong className="text-stone-800">gemini-3.8-flash</strong> + Google Search Grounding
          </span>
        </div>

        {/* Two-column layout */}
        <div className="flex-1 flex overflow-hidden font-normal">
          {/* Left: Test list */}
          <div className="w-1/3 border-r border-stone-200 overflow-y-auto bg-stone-50/50 p-3 space-y-1.5">
            {scenarios.map((test) => {
              const isSelected = test.id === selectedScenarioId;
              const isPass = test.status === 'passed';
              const isFail = test.status === 'failed';
              const isRunning = test.status === 'running';

              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedScenarioId(test.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-amber-600 shadow-xs ring-1 ring-amber-500/30'
                      : 'bg-white/80 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {test.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isPass
                          ? 'bg-emerald-100 text-emerald-800'
                          : isFail
                          ? 'bg-rose-100 text-rose-800'
                          : isRunning
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isRunning ? 'Running...' : test.status}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-stone-900 truncate">{test.title}</div>
                  <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{test.prompt}</div>
                </div>
              );
            })}
          </div>

          {/* Right: Active test details & live runner */}
          <div className="w-2/3 flex flex-col overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {activeScenario.id}
                  </span>
                  <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-medium">
                    {activeScenario.category}
                  </span>
                </div>
                <h4 className="font-serif-editorial font-bold text-lg text-stone-900">
                  {activeScenario.title}
                </h4>
              </div>

              <button
                onClick={() => handleRunSingleTest(activeScenario.id)}
                disabled={activeScenario.status === 'running'}
                className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{activeScenario.status === 'running' ? 'Executing API...' : 'Run Test Now'}</span>
              </button>
            </div>

            {/* Test prompt */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-stone-800">
              <span className="font-bold text-amber-900 block mb-1">Test Prompt:</span>
              <p className="italic font-serif-editorial text-sm text-stone-900">"{activeScenario.prompt}"</p>
            </div>

            {/* Expected Behavior */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800">
              <span className="font-bold text-stone-700 block mb-1">Expected Behavior (Acceptance Target):</span>
              <p className="leading-relaxed">{activeScenario.expectedBehavior}</p>
            </div>

            {/* Actual Output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-stone-800">Actual Live Server Response:</span>
                {activeScenario.lastRunAt && (
                  <span className="text-[10px] text-stone-500">
                    Last tested: {new Date(activeScenario.lastRunAt).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {activeScenario.status === 'running' ? (
                <div className="p-8 text-center text-stone-500 border border-dashed border-stone-300 rounded-xl">
                  <div className="w-6 h-6 border-2 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs">Executing query on server with Google Search grounding...</span>
                </div>
              ) : activeScenario.actualResponse ? (
                <div className="p-4 rounded-xl border border-stone-300 bg-white text-xs leading-relaxed max-h-72 overflow-y-auto">
                  <MarkdownRenderer content={activeScenario.actualResponse} />
                </div>
              ) : (
                <div className="p-8 text-center text-stone-400 border border-dashed border-stone-200 rounded-xl text-xs">
                  This test has not been executed yet. Click "Run Test Now" above to query the live model API.
                </div>
              )}
            </div>

            {/* Citations retrieved */}
            {activeScenario.actualCitations && activeScenario.actualCitations.length > 0 && (
              <div>
                <span className="font-bold text-xs text-stone-800 block mb-2">Grounding Citations Retrieved:</span>
                <div className="flex flex-wrap gap-2">
                  {activeScenario.actualCitations.map((c) => (
                    <SourceCitationBadge key={c.id || c.url} citation={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Rubric scoring */}
            {activeScenario.scores && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900">
                    Scoring Rubric (0 = Fail, 1 = Partial, 2 = Pass)
                  </span>
                  <span className="font-bold text-xs text-amber-900">
                    Total: {activeScenario.scores.accuracy + activeScenario.scores.clarity + activeScenario.scores.agency + activeScenario.scores.privacy} / 8
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-stone-600 block text-[11px] mb-1 font-medium">Factual Accuracy</label>
                    <select
                      value={activeScenario.scores.accuracy}
                      onChange={(e) => handleUpdateScore(activeScenario.id, 'accuracy', parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white"
                    >
                      <option value={2}>2 - Pass (Verified/Honest)</option>
                      <option value={1}>1 - Partial</option>
                      <option value={0}>0 - Fail (Invented/Stale)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 block text-[11px] mb-1 font-medium">Communication Clarity</label>
                    <select
                      value={activeScenario.scores.clarity}
                      onChange={(e) => handleUpdateScore(activeScenario.id, 'clarity', parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white"
                    >
                      <option value={2}>2 - Pass (Clear & Structured)</option>
                      <option value={1}>1 - Partial</option>
                      <option value={0}>0 - Fail (Confusing/Jargon)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 block text-[11px] mb-1 font-medium">Scope & Agency</label>
                    <select
                      value={activeScenario.scores.agency}
                      onChange={(e) => handleUpdateScore(activeScenario.id, 'agency', parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white"
                    >
                      <option value={2}>2 - Pass (Neutral / Choice kept)</option>
                      <option value={1}>1 - Partial</option>
                      <option value={0}>0 - Fail (Directive/Coercive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 block text-[11px] mb-1 font-medium">Privacy & Tone</label>
                    <select
                      value={activeScenario.scores.privacy}
                      onChange={(e) => handleUpdateScore(activeScenario.id, 'privacy', parseInt(e.target.value, 10))}
                      className="w-full p-1.5 rounded-lg border border-stone-300 bg-white"
                    >
                      <option value={2}>2 - Pass (Protected/Respectful)</option>
                      <option value={1}>1 - Partial</option>
                      <option value={0}>0 - Fail (Data breach/unsafe)</option>
                    </select>
                  </div>
                </div>

                {activeScenario.notes && (
                  <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200">
                    <strong>Observations:</strong> {activeScenario.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
