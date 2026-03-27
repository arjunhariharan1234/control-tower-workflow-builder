'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from 'reactflow';
import { parseNaturalLanguage, generateThinkingSteps, ParseResult, ThinkingStep } from '@/lib/nl-to-workflow';
import { parseDSLToGraph } from '@/lib/dsl-parser';
import { WorkflowDSL, StepExecution, ExecutionStatus } from '@/types/workflow';
import { Node, Edge } from 'reactflow';
import { saveWorkflow } from '@/lib/saved-workflows';
import { v4 as uuid } from 'uuid';
import { parseFileToText } from '@/lib/file-parser';

const MiniWorkflowCanvas = dynamic(() => import('@/components/canvas/MiniWorkflowCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#0f1117' }}>
      <div className="flex items-center gap-2 text-sm" style={{ color: '#6b7280' }}>
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading preview...
      </div>
    </div>
  ),
});

const GOLD = '#FFBE07';

// ── Suggested prompts ────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    title: 'Long Stoppage SOP',
    prompt: 'Long stoppage SOP - step 1 - analyse location, do checks for petrol pump, toll, plaza etc. Call the driver. If the driver does not pick up the call, retry 3 times within 60 mins. Then escalate it to Arjun and monitor after 2 hours. If it still remains same - then escalate it to manager.',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: 'Transit Delay Handling',
    prompt: 'When a transit delay is detected, assess the delay impact. If delay is less than 30 minutes, alert the driver. If more than 30 minutes, escalate to ops desk. After that, revise the ETA and notify all stakeholders.',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Route Deviation Alert',
    prompt: 'Route deviation detected - flag the deviation and assess risk. If deviation is minor, call the driver to confirm reason. If deviation is major, escalate to manager for review. Log a compliance record at the end.',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9" />
        <path d="M9 21V9" />
        <path d="M15 21V9" />
      </svg>
    ),
  },
];

// ── Message types ────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinkingSteps?: ThinkingStep[];
  parseResult?: ParseResult;
  isThinking?: boolean;
  attachment?: { name: string; sizeBytes: number };
}

// ── Simulation types ─────────────────────────────────────────────────

interface SimulationState {
  running: boolean;
  currentStepIndex: number;
  stepStatuses: StepExecution[];
  speed: number; // ms per step
  logs: string[];
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDSL, setCurrentDSL] = useState<WorkflowDSL | null>(null);
  const [previewNodes, setPreviewNodes] = useState<Node[]>([]);
  const [previewEdges, setPreviewEdges] = useState<Edge[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [visibleThinkingIndex, setVisibleThinkingIndex] = useState(-1);
  const [simulation, setSimulation] = useState<SimulationState>({
    running: false, currentStepIndex: -1, stepStatuses: [], speed: 1200, logs: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, visibleThinkingIndex]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  // ── Process natural language ───────────────────────────────────────

  const processInput = useCallback(async (text: string, attachment?: { name: string; sizeBytes: number }) => {
    if ((!text.trim() && !attachment) || isProcessing) return;

    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      attachment,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Generate thinking steps
    const steps = generateThinkingSteps(text);
    setThinkingSteps(steps);
    setVisibleThinkingIndex(0);

    // Animate thinking steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].delay > 0 ? steps[i].delay - (i > 0 ? steps[i - 1].delay : 0) : 300));
      setVisibleThinkingIndex(i);
    }

    // Parse the input
    const result = parseNaturalLanguage(text);

    // Update preview
    const { nodes, edges } = parseDSLToGraph(result.dsl);
    setPreviewNodes(nodes);
    setPreviewEdges(edges);
    setCurrentDSL(result.dsl);
    setShowPreview(true);

    // Build assistant response
    const confidence = Math.round(result.confidence * 100);
    const stepsCount = result.dsl.steps.length;
    const transCount = result.dsl.transitions.length;

    let responseContent = `I've built your **${result.dsl.name}** workflow!\n\n`;
    responseContent += `**${stepsCount} steps** and **${transCount} transitions** created with **${confidence}% confidence**.\n\n`;
    responseContent += `Here's what I understood:\n`;
    for (const step of result.steps) {
      responseContent += `\n  → ${step}`;
    }
    responseContent += `\n\nThe workflow is now visible in the preview panel. You can:\n`;
    responseContent += `- **Edit in Playground** to fine-tune the workflow visually\n`;
    responseContent += `- **Run Simulation** to see how it executes step by step\n`;
    responseContent += `- **Describe changes** and I'll update the workflow`;

    const assistantMsg: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      parseResult: result,
      thinkingSteps: steps,
    };

    // Small delay after thinking
    await new Promise(resolve => setTimeout(resolve, 400));

    setMessages(prev => [...prev, assistantMsg]);
    setThinkingSteps([]);
    setVisibleThinkingIndex(-1);
    setIsProcessing(false);
  }, [isProcessing]);

  const triggerSubmit = async () => {
    if (attachedFile) {
      try {
        const parsedText = await parseFileToText(attachedFile);
        const finalText = input.trim()
          ? `${input.trim()}\n\nFrom uploaded file:\n${parsedText}`
          : parsedText;
        const attachment = { name: attachedFile.name, sizeBytes: attachedFile.size };
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (inputRef.current) inputRef.current.style.height = 'auto';
        processInput(finalText, attachment);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: uuid(),
          role: 'system',
          content: (err as Error).message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      processInput(input);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  // ── Open in playground ─────────────────────────────────────────────

  const openInPlayground = () => {
    if (!currentDSL) return;
    // Save to localStorage so playground can pick it up
    const saved = saveWorkflow(currentDSL.name, currentDSL.code, currentDSL.description || '', currentDSL);
    router.push(`/playground?load=${saved.id}`);
  };

  // ── Simulation ─────────────────────────────────────────────────────

  const runSimulation = useCallback(async () => {
    if (!currentDSL || simulation.running) return;

    const allSteps = currentDSL.steps.flatMap(s => {
      if (s.step_type === 'SUB_PROCESS' && s.steps) {
        return [s, ...s.steps];
      }
      return [s];
    });

    setSimulation(prev => ({
      ...prev,
      running: true,
      currentStepIndex: 0,
      stepStatuses: allSteps.map(s => ({ step_key: s.step_key, status: 'PENDING' as ExecutionStatus })),
      logs: [`[${new Date().toLocaleTimeString()}] Simulation started for "${currentDSL.name}"`],
    }));

    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];

      // Mark current as RUNNING
      setSimulation(prev => ({
        ...prev,
        currentStepIndex: i,
        stepStatuses: prev.stepStatuses.map((s, idx) =>
          idx === i ? { ...s, status: 'RUNNING' as ExecutionStatus } : s
        ),
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] Running: ${step.display_name}`],
      }));

      // Update preview nodes with execution status
      setPreviewNodes(prev => prev.map(n =>
        n.id === step.step_key ? { ...n, data: { ...n.data, executionStatus: 'RUNNING' } } : n
      ));

      await new Promise(resolve => setTimeout(resolve, simulation.speed));

      // Mark as COMPLETED
      setSimulation(prev => ({
        ...prev,
        stepStatuses: prev.stepStatuses.map((s, idx) =>
          idx === i ? { ...s, status: 'COMPLETED' as ExecutionStatus } : s
        ),
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] Completed: ${step.display_name}`],
      }));

      setPreviewNodes(prev => prev.map(n =>
        n.id === step.step_key ? { ...n, data: { ...n.data, executionStatus: 'COMPLETED' } } : n
      ));
    }

    setSimulation(prev => ({
      ...prev,
      running: false,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] Simulation complete!`],
    }));
  }, [currentDSL, simulation.running, simulation.speed]);

  const resetSimulation = () => {
    setSimulation({ running: false, currentStepIndex: -1, stepStatuses: [], speed: 1200, logs: [] });
    if (currentDSL) {
      const { nodes, edges } = parseDSLToGraph(currentDSL);
      setPreviewNodes(nodes);
      setPreviewEdges(edges);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: '#0f1117' }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-3 z-50" style={{ background: 'rgba(15,17,23,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1d27' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
              <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight" style={{ color: GOLD }}>Control Tower</span>
          </button>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,190,7,0.1)', color: GOLD, border: '1px solid rgba(255,190,7,0.2)' }}>AI Builder</span>
        </div>
        <div className="flex items-center gap-2">
          {currentDSL && (
            <button
              onClick={openInPlayground}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 hover:brightness-110"
              style={{ background: GOLD, color: '#000' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
              Edit in Playground
            </button>
          )}
          <button
            onClick={() => router.push('/playground')}
            className="px-4 py-2 text-xs font-medium rounded-lg transition-colors"
            style={{ color: '#9ca3af', border: '1px solid #2a2d3a' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFBE07'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            Visual Builder
          </button>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Chat Panel ──────────────────────────────────────────── */}
        <div className="flex flex-col" style={{ width: showPreview ? '45%' : '100%', transition: 'width 0.4s ease', borderRight: showPreview ? '1px solid #1a1d27' : 'none' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {messages.length === 0 ? (
              /* ── Empty State ─────────────────────────────────────── */
              <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 animate-glow" style={{ background: 'rgba(255,190,7,0.08)', border: '1px solid rgba(255,190,7,0.15)' }}>
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    <path d="M8 10h.01M12 10h.01M16 10h.01" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Describe your workflow in plain English</h2>
                <p className="text-sm text-center mb-10 max-w-md" style={{ color: '#6b7280' }}>
                  Tell me what should happen step by step — I&apos;ll convert it into an automated workflow you can edit, simulate, and deploy.
                </p>
                <div className="w-full grid grid-cols-1 gap-3 max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => processInput(s.prompt)}
                      className="group text-left p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                      style={{ background: '#13151d', border: '1px solid #2a2d3a' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,190,7,0.4)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d3a'; }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,190,7,0.1)', color: GOLD }}>
                          {s.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{s.title}</span>
                            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: GOLD }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6b7280' }}>{s.prompt}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Message Thread ──────────────────────────────────── */
              <div className="max-w-2xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[85%] rounded-2xl px-5 py-3.5"
                      style={msg.role === 'user' ? {
                        background: 'rgba(255,190,7,0.1)',
                        border: '1px solid rgba(255,190,7,0.2)',
                      } : msg.role === 'system' ? {
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      } : {
                        background: '#13151d',
                        border: '1px solid #2a2d3a',
                      }}
                    >
                      {msg.role === 'system' && (
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-3.5 h-3.5" style={{ color: '#ef4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span className="text-[10px] font-semibold" style={{ color: '#ef4444' }}>Error</span>
                        </div>
                      )}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: GOLD }}>
                            <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path d="M2 17l10 5 10-5" />
                            </svg>
                          </div>
                          <span className="text-[10px] font-semibold" style={{ color: GOLD }}>Control Tower AI</span>
                        </div>
                      )}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: msg.role === 'user' ? '#f0f0f5' : '#d1d5db' }}>
                        {renderMarkdown(msg.content)}
                      </div>
                      {msg.attachment && (
                        <div className="flex items-center gap-1.5 mt-2" style={{ color: '#6b7280', fontSize: '10px' }}>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span>{msg.attachment.name}</span>
                          <span>·</span>
                          <span>{msg.attachment.sizeBytes < 1024 ? `${msg.attachment.sizeBytes}B` : `${(msg.attachment.sizeBytes / 1024).toFixed(0)}KB`}</span>
                        </div>
                      )}
                      {msg.parseResult && (
                        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #2a2d3a' }}>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
                            {msg.parseResult.dsl.steps.length} steps
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            {msg.parseResult.dsl.transitions.length} transitions
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: `rgba(255,190,7,0.1)`, color: GOLD }}>
                            {Math.round(msg.parseResult.confidence * 100)}% confidence
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking animation */}
                {isProcessing && thinkingSteps.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-5 py-3.5" style={{ background: '#13151d', border: '1px solid #2a2d3a' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: GOLD }}>
                          <svg className="w-3 h-3 text-black animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-semibold" style={{ color: GOLD }}>Building workflow...</span>
                      </div>
                      <div className="space-y-2">
                        {thinkingSteps.slice(0, visibleThinkingIndex + 1).map((step, i) => (
                          <div key={i} className="flex items-center gap-2 animate-fadeIn" style={{ animationDuration: '0.3s' }}>
                            <span className="flex-shrink-0">
                              {step.type === 'understanding' && <span className="text-blue-400 text-xs">🔍</span>}
                              {step.type === 'extracting' && <span className="text-yellow-400 text-xs">⚡</span>}
                              {step.type === 'building' && <span className="text-green-400 text-xs">🔧</span>}
                              {step.type === 'complete' && <span className="text-emerald-400 text-xs">✅</span>}
                            </span>
                            <span className="text-xs" style={{ color: i === visibleThinkingIndex ? '#f0f0f5' : '#6b7280' }}>
                              {step.message}
                            </span>
                          </div>
                        ))}
                        {visibleThinkingIndex < thinkingSteps.length - 1 && (
                          <div className="flex items-center gap-1 ml-5">
                            <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: GOLD }} />
                            <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: GOLD, animationDelay: '0.2s' }} />
                            <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: GOLD, animationDelay: '0.4s' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input Area ──────────────────────────────────────────── */}
          <div className="px-6 pb-5 pt-2">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
              <div className="rounded-2xl overflow-hidden" style={{ background: '#13151d', border: '1px solid #2a2d3a' }}>
                {/* File chip */}
                {attachedFile && (
                  <div className="flex items-center gap-2 px-4 pt-3">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        background: 'rgba(255,190,7,0.1)',
                        border: '1px solid rgba(255,190,7,0.2)',
                        color: GOLD,
                      }}
                    >
                      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                      <span style={{ color: '#6b7280' }}>
                        ({attachedFile.size < 1024 ? `${attachedFile.size}B` : `${(attachedFile.size / 1024).toFixed(0)}KB`})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="ml-1 hover:opacity-80"
                        style={{ color: '#6b7280' }}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your workflow in plain English..."
                  rows={1}
                  disabled={isProcessing}
                  className="w-full resize-none bg-transparent px-5 py-4 text-sm outline-none placeholder:text-gray-600"
                  style={{ color: '#f0f0f5', maxHeight: '160px' }}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAttachedFile(file);
                      }}
                    />
                    {/* Attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="transition-colors disabled:opacity-30"
                      style={{ color: '#6b7280' }}
                      onMouseEnter={(e) => { if (!isProcessing) (e.currentTarget as HTMLElement).style.color = GOLD; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                      title="Upload CSV or XLSX file"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                    <span className="text-[10px]" style={{ color: '#4a4d5a' }}>
                      Press Enter to send · Shift+Enter for new line
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={(!input.trim() && !attachedFile) || isProcessing}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ background: GOLD, color: '#000' }}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Building...
                      </>
                    ) : (
                      <>
                        Build
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ── Preview Panel ────────────────────────────────────────── */}
        {showPreview && (
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0c12' }}>
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1a1d27' }}>
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-white">Workflow Preview</h3>
                {currentDSL && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,190,7,0.1)', color: GOLD }}>
                    {currentDSL.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Simulation controls */}
                {!simulation.running ? (
                  <button
                    onClick={runSimulation}
                    disabled={!currentDSL}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 hover:brightness-110 disabled:opacity-30"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    Simulate
                  </button>
                ) : (
                  <button
                    onClick={resetSimulation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" /></svg>
                    Stop
                  </button>
                )}
                <button
                  onClick={openInPlayground}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 hover:brightness-110"
                  style={{ background: GOLD, color: '#000' }}
                >
                  Open in Editor
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
              <ReactFlowProvider>
                <MiniWorkflowCanvas nodes={previewNodes} edges={previewEdges} />
              </ReactFlowProvider>
            </div>

            {/* Simulation Logs */}
            {simulation.logs.length > 0 && (
              <div className="h-36 overflow-y-auto px-4 py-3 font-mono text-[10px]" style={{ borderTop: '1px solid #1a1d27', background: '#0f1117' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[10px]" style={{ color: GOLD }}>Simulation Log</span>
                  {!simulation.running && simulation.logs.length > 1 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Complete</span>
                  )}
                </div>
                {simulation.logs.map((log, i) => (
                  <div key={i} className="py-0.5" style={{ color: log.includes('Completed') ? '#10b981' : log.includes('Running') ? GOLD : '#6b7280' }}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Simple markdown renderer ─────────────────────────────────────────

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
