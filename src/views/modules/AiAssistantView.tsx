import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Download, 
  Layers, 
  Radio, 
  Activity, 
  Gauge, 
  Bell, 
  CheckSquare, 
  Sliders, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { UserProfile, WellAsset } from '../../types';
import { StorageService } from '../../services/storageService';
import { AiAssistantService, AssistantMessage, AssistantAction, AssistantStatus } from '../../services/aiAssistantService';

interface AiAssistantViewProps {
  currentUser: UserProfile;
  selectedAssetId: string | null;
  onSelectAssetId: (id: string | null) => void;
  onNavigateToRoute: (routeId: string) => void;
}

const SUGGESTED_PROMPTS = [
  { label: 'Down & Tripped Wells', query: 'Which wells are currently down or tripped?' },
  { label: 'Active Alarms', query: 'Which assets have active unacknowledged alarms?' },
  { label: 'Status of ALS-DEL-ESP-104', query: 'Show the telemetry status and operating conditions for ALS-DEL-ESP-104' },
  { label: 'Elevated Motor Temps', query: 'Which wells have elevated motor winding temperatures?' },
  { label: 'Cable Shop QA Status', query: 'Which cable shop repair reels are pending inspection or spooling?' },
  { label: 'Fleet Logistics', query: 'Summarize fleet utilization, active dispatches, and fuel levels' },
  { label: 'Draft PM Job (ESP-082)', query: 'Create a draft maintenance job for ALS-DEL-ESP-082 high motor temperature' },
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  currentUser,
  selectedAssetId,
  onSelectAssetId,
  onNavigateToRoute,
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    // Initial welcome message
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `### Welcome to ALS Operations AI Assistant

I am connected to the real-time telemetry, equipment registries, alarm centers, cable shop pipelines, and maintenance workflows across all **20 monitored field assets**.

You can ask me to:
- **Inspect Asset Telemetry**: Check pressures, motor temperatures, VFD frequencies, and flow rates for any well.
- **Triage Alarms & Trips**: Identify active threshold breaches and root causes.
- **Navigate Dashboards**: Prompt me to open specific SCADA gauges, ESP pressure gradient curves, or dynamometer cards.
- **Assist with Workflows**: Draft controlled maintenance jobs and cable work orders for operator confirmation.

*Telemetry notice: All measurements are synthesized for demonstration and testing.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'gemini',
        disclaimer: 'DEMO SIMULATED DATA — Telemetry is synthesized for demonstration purposes.',
        actions: [
          {
            type: 'navigate',
            route: 'operations',
            label: 'Open Field Operations Overview',
            description: 'View 24h production and field-wide asset health',
          },
          {
            type: 'navigate',
            route: 'alarms-user',
            label: 'Review Active Priority Alarms',
            description: 'Inspect urgent and high-severity equipment alerts',
          }
        ]
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [confirmedJobs, setConfirmedJobs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const wells = StorageService.getWells();
  const selectedWell = selectedAssetId 
    ? wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId) || null
    : null;

  // Check backend Gemini status on load
  useEffect(() => {
    AiAssistantService.checkStatus().then(res => {
      setStatus(res);
    });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const userMsg: AssistantMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Map to server-compatible format
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await AiAssistantService.sendMessage(
        payloadMessages,
        selectedAssetId,
        currentUser
      );

      const assistantMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions,
        provider: response.provider,
        disclaimer: response.disclaimer,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      setErrorMessage(err?.message || 'Failed to generate operational response. Please retry.');
      
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Operational Connection Error**: Unable to process your query (${err?.message || 'Network/Server Error'}). Please check your connection and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat session reset. Ready to analyze field operations, equipment telemetry, and maintenance workflows.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: status?.provider || 'gemini',
        disclaimer: 'DEMO SIMULATED DATA — Telemetry is synthesized for demonstration purposes.',
      }
    ]);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = () => {
    const transcript = messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ALS_Assistant_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteAction = (action: AssistantAction) => {
    if (action.type === 'navigate') {
      if (action.assetId) {
        onSelectAssetId(action.assetId);
      }
      if (action.route) {
        onNavigateToRoute(action.route);
      }
    }
  };

  const handleConfirmDraftJob = (action: AssistantAction, msgId: string) => {
    if (!action.jobData) return;

    try {
      const created = AiAssistantService.confirmAndCreateDraftJob(action.jobData, currentUser);
      setConfirmedJobs(prev => ({ ...prev, [msgId]: true }));
      
      // Add confirmation reply
      const confirmReply: AssistantMessage = {
        id: `conf-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Maintenance Job Authorized & Created**\n- **Job ID**: \`${created.id}\`\n- **Target Well**: ${created.wellName} (\`${created.wellId}\`)\n- **Stage**: \`${created.stage}\`\n- **Assigned Crew**: ${created.assignedCrew}\n- **Authorized By**: ${currentUser.name} (${currentUser.roleTitle})\n\nAn audit entry has been logged to the operational event stream.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: status?.provider || 'gemini',
        actions: [
          {
            type: 'navigate',
            route: 'workflows-user',
            assetId: created.wellId,
            label: `Open Work Order in Job Workflows`,
            description: `Inspect checklist and crew schedule for ${created.id}`,
          }
        ]
      };
      setMessages(prev => [...prev, confirmReply]);
    } catch (err: any) {
      console.error('Failed to create job:', err);
      alert(`Could not create job: ${err.message}`);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      {/* ======================================================== */}
      {/* 1. Header Toolbar & Context Ribbon                        */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shrink-0 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <Bot className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-bold text-white tracking-tight font-mono">
                ALS Operations AI Assistant
              </h1>
              {/* Provider / Engine Status Badge */}
              {status?.configured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-mono font-medium text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gemini 3.8 Flash (Live)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[11px] font-mono font-medium text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Local Demo Engine (Synthetic Data)</span>
                </span>
              )}
              {/* Simulation Notice */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
                <span>SIMULATED TELEMETRY</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Grounded operational intelligence for artificial lift surveillance, SCADA analytics, and field workflows.
            </p>
          </div>
        </div>

        {/* Action Controls & Well Focus Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedWell ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-xs">
              <span className="text-slate-400">Focused:</span>
              <strong className="text-cyan-300 font-mono">{selectedWell.wellCode || selectedWell.id}</strong>
              <button
                onClick={() => onSelectAssetId(null)}
                className="text-[11px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                title="Clear well focus"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 font-mono">
              Field Focus: All 20 Wells
            </div>
          )}

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
            title="Start a new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          <button
            onClick={handleExportTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
            title="Download transcript"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Suggested Prompts Horizontal Ribbon                   */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 py-0.5">
        <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick Inquiries:</span>
        </span>
        {SUGGESTED_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.query)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs transition-all cursor-pointer font-sans disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 3. Messages Conversational Stream                        */}
      {/* ======================================================== */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4 text-cyan-300" />
                </div>
              )}

              {/* Message Content Bubble */}
              <div
                className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-100 shadow-md ml-12'
                    : msg.isError
                    ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200 mr-12'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md mr-12'
                }`}
              >
                {/* Header row in message bubble */}
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white font-mono">
                      {isUser ? currentUser.name : 'ALS Operations AI'}
                    </span>
                    {!isUser && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                        msg.provider === 'gemini' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {msg.provider === 'gemini' ? 'Gemini 3.8 Flash' : 'Local Demo'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-slate-300 transition-colors p-0.5"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Body Text with Markdown Formatting Simulation */}
                <div className="space-y-2 whitespace-pre-wrap font-sans leading-normal selection:bg-cyan-500/30">
                  {formatMarkdownContent(msg.content)}
                </div>

                {/* Simulated Data Badge */}
                {msg.disclaimer && (
                  <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                    <Info className="w-3 h-3 shrink-0 text-slate-400" />
                    <span>{msg.disclaimer}</span>
                  </div>
                )}

                {/* Interactive Navigation & Action Cards */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <span>Suggested Operational Actions:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.actions.map((act, actIdx) => {
                        if (act.type === 'navigate') {
                          return (
                            <button
                              key={actIdx}
                              onClick={() => handleExecuteAction(act)}
                              className="text-left p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 transition-all flex items-start justify-between gap-2 group cursor-pointer"
                            >
                              <div>
                                <div className="font-semibold text-xs text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                                  <span>{act.label}</span>
                                </div>
                                {act.description && (
                                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {act.description}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          );
                        }

                        if (act.type === 'draft_job' && act.jobData) {
                          const isConfirmed = confirmedJobs[msg.id];
                          return (
                            <div
                              key={actIdx}
                              className="col-span-full p-3 rounded-lg bg-amber-950/30 border border-amber-600/40 text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                  <span className="font-bold text-amber-200">Controlled Action Proposal: Maintenance Job</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-900/60 text-amber-300 border border-amber-700">
                                  Requires Operator Approval
                                </span>
                              </div>

                              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 text-[11px] space-y-1 font-mono">
                                <div><span className="text-slate-400">Title:</span> <strong className="text-white">{act.jobData.title}</strong></div>
                                <div><span className="text-slate-400">Target Well:</span> <strong className="text-cyan-400">{act.jobData.wellId}</strong></div>
                                <div><span className="text-slate-400">Priority:</span> <span className="text-amber-400 font-bold">{act.jobData.priority}</span> | Type: {act.jobData.type}</div>
                                <div><span className="text-slate-400">Crew:</span> {act.jobData.assignedCrew || 'Midland Crew Alpha'}</div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <p className="text-[10px] text-slate-400 italic">
                                  No equipment setpoints will be altered automatically.
                                </p>
                                {isConfirmed ? (
                                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-medium text-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Confirmed & Created</span>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmDraftJob(act, msg.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Authorize & Create Job</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-cyan-300 text-xs font-bold font-mono shadow-sm mt-0.5">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-cyan-300 flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
              </div>
              <span className="font-mono text-[11px] text-slate-300">
                Querying ALS field telemetry & formulating operational recommendations...
              </span>
            </div>
          </div>
        )}

        {/* Bottom anchor for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* ======================================================== */}
      {/* 4. Input Area & Send Controls                            */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shrink-0 shadow-xl space-y-2">
        {errorMessage && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
            <span>{errorMessage}</span>
            <button
              onClick={() => handleSend()}
              className="text-xs font-bold underline hover:text-white ml-2"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about down assets, active alarms, pressure trends (e.g. ALS-DEL-ESP-104), or draft a maintenance job... (Enter to send, Shift+Enter for newline)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 resize-none font-sans"
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isLoading}
            className="h-12 px-5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
          <div className="flex items-center gap-2">
            <span>Model: {status?.model || 'gemini-3.8-flash'}</span>
            <span>·</span>
            <span>Grounding: 20 Monitored Wells & Live SCADA</span>
          </div>
          <div className="hidden sm:block">
            Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Format markdown helper to render bold, headings, tables, code blocks and lists nicely
 */
function formatMarkdownContent(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  lines.forEach((line, index) => {
    // Table line
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      // Skip markdown divider line | :--- | :--- |
      if (line.includes('---')) return;
      const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      tableRows.push(cells);
      return;
    } else if (inTable) {
      // Flush table
      elements.push(renderTable(tableRows, `table-${index}`));
      tableRows = [];
      inTable = false;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="text-sm font-bold text-white font-mono mt-2 mb-1">
          {line.replace('### ', '')}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="text-sm font-bold text-cyan-300 font-mono mt-2 mb-1">
          {line.replace('## ', '')}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="text-base font-bold text-cyan-200 font-mono mt-2 mb-1">
          {line.replace('# ', '')}
        </h2>
      );
    } else if (line.startsWith('> ')) {
      // Quote / callout
      elements.push(
        <div key={index} className="border-l-2 border-cyan-500/60 pl-3 py-1 bg-slate-950/40 rounded-r text-[11px] text-slate-300 italic">
          {renderInlineFormatting(line.replace('> ', ''))}
        </div>
      );
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      // Bullet list
      elements.push(
        <li key={index} className="ml-4 list-disc text-slate-200">
          {renderInlineFormatting(line.trim().replace(/^[-*]\s+/, ''))}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={index} className="h-1" />);
    } else {
      elements.push(
        <p key={index} className="text-slate-200">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  });

  if (tableRows.length > 0) {
    elements.push(renderTable(tableRows, 'table-end'));
  }

  return elements;
}

function renderTable(rows: string[][], key: string) {
  if (rows.length === 0) return null;
  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div key={key} className="overflow-x-auto my-2 border border-slate-800 rounded-lg">
      <table className="w-full text-[11px] text-left divide-y divide-slate-800">
        <thead className="bg-slate-950 font-mono text-cyan-300">
          <tr>
            {header.map((col, idx) => (
              <th key={idx} className="px-3 py-1.5 font-semibold">
                {renderInlineFormatting(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
          {body.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-800/40">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-1.5 text-slate-300">
                  {renderInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInlineFormatting(text: string) {
  // Simple regex parser for `code` and **bold**
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700/80 text-cyan-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
