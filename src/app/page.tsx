'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WORKFLOW_TEMPLATES } from '@/lib/templates';

const GOLD = '#FFBE07';

// ── Animated Globe Component ────────────────────────────────────────
function RotatingGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Workflow nodes that appear and connect on the globe
    interface WfNode {
      lat: number;
      lng: number;
      label: string;
      color: string;
      pulse: number;
      born: number;
      type: 'event' | 'task' | 'gateway' | 'end';
    }

    interface WfEdge {
      from: number;
      to: number;
      progress: number;
      born: number;
    }

    const workflows: { nodes: WfNode[]; edges: WfEdge[]; startTime: number }[] = [];

    // Pre-defined workflow patterns that auto-create
    const workflowPatterns = [
      {
        nodes: [
          { lat: 20, lng: -30, label: 'Alert', color: '#FFBE07', type: 'event' as const },
          { lat: 10, lng: -5, label: 'Assess', color: '#FFBE07', type: 'task' as const },
          { lat: -5, lng: 15, label: 'Route', color: '#3b82f6', type: 'gateway' as const },
          { lat: -20, lng: 35, label: 'Resolve', color: '#10b981', type: 'end' as const },
        ],
        edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }],
      },
      {
        nodes: [
          { lat: 35, lng: 60, label: 'Trigger', color: '#FFBE07', type: 'event' as const },
          { lat: 25, lng: 85, label: 'Analyze', color: '#FFBE07', type: 'task' as const },
          { lat: 10, lng: 105, label: 'Check', color: '#3b82f6', type: 'gateway' as const },
          { lat: -5, lng: 85, label: 'Notify', color: '#10b981', type: 'task' as const },
          { lat: -15, lng: 110, label: 'Escalate', color: '#a855f7', type: 'task' as const },
        ],
        edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 2, to: 4 }],
      },
      {
        nodes: [
          { lat: -25, lng: -80, label: 'Detect', color: '#FFBE07', type: 'event' as const },
          { lat: -15, lng: -55, label: 'Flag', color: '#FFBE07', type: 'task' as const },
          { lat: -30, lng: -35, label: 'Close', color: '#10b981', type: 'end' as const },
        ],
        edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
      },
      {
        nodes: [
          { lat: 40, lng: 150, label: 'Event', color: '#FFBE07', type: 'event' as const },
          { lat: 30, lng: 170, label: 'Process', color: '#FFBE07', type: 'task' as const },
          { lat: 15, lng: -170, label: 'Decision', color: '#3b82f6', type: 'gateway' as const },
          { lat: 0, lng: -155, label: 'Action', color: '#10b981', type: 'task' as const },
          { lat: -10, lng: -140, label: 'Done', color: '#10b981', type: 'end' as const },
        ],
        edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }],
      },
    ];

    // Spawn a new workflow
    function spawnWorkflow(t: number) {
      const pattern = workflowPatterns[Math.floor(Math.random() * workflowPatterns.length)];
      const lngOffset = (Math.random() - 0.5) * 60;
      const latOffset = (Math.random() - 0.5) * 20;
      const wf = {
        startTime: t,
        nodes: pattern.nodes.map((n, i) => ({
          ...n,
          lat: n.lat + latOffset,
          lng: n.lng + lngOffset,
          pulse: 0,
          born: t + i * 0.8,
        })),
        edges: pattern.edges.map((e) => ({
          ...e,
          progress: 0,
          born: t + (e.from + 1) * 0.8 + 0.3,
        })),
      };
      workflows.push(wf);
      if (workflows.length > 6) workflows.shift();
    }

    let lastSpawn = 0;

    // Project lat/lng to screen position on globe
    function project(lat: number, lng: number, rotation: number, cx: number, cy: number, r: number) {
      const latRad = (lat * Math.PI) / 180;
      const lngRad = ((lng + rotation) * Math.PI) / 180;
      const x = cx + r * Math.cos(latRad) * Math.sin(lngRad);
      const y = cy - r * Math.sin(latRad);
      const z = Math.cos(latRad) * Math.cos(lngRad);
      return { x, y, z, visible: z > -0.15 };
    }

    function draw(timestamp: number) {
      const t = timestamp / 1000;
      timeRef.current = t;
      const w = W();
      const h = H();

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.38;
      const rotation = t * 12; // degrees per second

      // Spawn workflows periodically
      if (t - lastSpawn > 3.5) {
        spawnWorkflow(t);
        lastSpawn = t;
      }

      // ── Outer glow ──
      const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.6);
      outerGlow.addColorStop(0, 'rgba(255, 190, 7, 0.04)');
      outerGlow.addColorStop(1, 'rgba(255, 190, 7, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, w, h);

      // ── Globe sphere ──
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(30, 33, 45, 0.6)');
      grad.addColorStop(0.7, 'rgba(15, 17, 23, 0.8)');
      grad.addColorStop(1, 'rgba(15, 17, 23, 0.3)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Globe border ──
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 190, 7, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Grid lines (latitude) ──
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        const latRad = (lat * Math.PI) / 180;
        const ry = r * Math.cos(latRad);
        const yPos = cy - r * Math.sin(latRad);

        for (let lng = 0; lng <= 360; lng += 3) {
          const lngRad = ((lng + rotation) * Math.PI) / 180;
          const z = Math.cos(latRad) * Math.cos(lngRad);
          if (z < -0.05) continue;
          const x = cx + ry * Math.sin(lngRad);
          if (lng === 0 || z < -0.02) {
            ctx.moveTo(x, yPos);
          } else {
            ctx.lineTo(x, yPos);
          }
        }
        ctx.strokeStyle = 'rgba(255, 190, 7, 0.06)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ── Grid lines (longitude) ──
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = project(lat, lng, rotation, cx, cy, r);
          if (!p.visible) { started = false; continue; }
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255, 190, 7, 0.06)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ── Floating noise particles (being filtered out) ──
      for (let i = 0; i < 30; i++) {
        const seed = i * 137.508;
        const angle = (t * 0.3 + seed) % (Math.PI * 2);
        const dist = r * 1.1 + Math.sin(t * 0.5 + seed) * r * 0.4;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist * 0.6;
        const alpha = 0.08 + Math.sin(t * 2 + seed) * 0.04;
        const size = 1 + Math.sin(t + seed) * 0.5;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 190, 7, ${alpha})`;
        ctx.fill();
      }

      // ── Draw workflow nodes and edges on globe ──
      for (const wf of workflows) {
        const age = t - wf.startTime;
        const wfAlpha = age > 8 ? Math.max(0, 1 - (age - 8) / 2) : 1;
        if (wfAlpha <= 0) continue;

        // Draw edges first (below nodes)
        for (const edge of wf.edges) {
          const edgeAge = t - edge.born;
          if (edgeAge < 0) continue;
          const progress = Math.min(1, edgeAge / 0.6);

          const fromNode = wf.nodes[edge.from];
          const toNode = wf.nodes[edge.to];
          const pFrom = project(fromNode.lat, fromNode.lng, rotation, cx, cy, r);
          const pTo = project(toNode.lat, toNode.lng, rotation, cx, cy, r);

          if (!pFrom.visible && !pTo.visible) continue;
          const edgeAlpha = Math.min(pFrom.z + 0.3, pTo.z + 0.3, 1) * wfAlpha * 0.6;
          if (edgeAlpha <= 0) continue;

          const mx = pFrom.x + (pTo.x - pFrom.x) * progress;
          const my = pFrom.y + (pTo.y - pFrom.y) * progress;

          ctx.beginPath();
          ctx.moveTo(pFrom.x, pFrom.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(255, 190, 7, ${edgeAlpha * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Animated dot along edge
          if (progress < 1) {
            ctx.beginPath();
            ctx.arc(mx, my, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 190, 7, ${edgeAlpha})`;
            ctx.fill();
          }
        }

        // Draw nodes
        for (const node of wf.nodes) {
          const nodeAge = t - node.born;
          if (nodeAge < 0) continue;
          const appear = Math.min(1, nodeAge / 0.4);

          const p = project(node.lat, node.lng, rotation, cx, cy, r);
          if (!p.visible) continue;
          const nodeAlpha = Math.min(p.z + 0.3, 1) * wfAlpha * appear;
          if (nodeAlpha <= 0) continue;

          const nodeSize = (node.type === 'gateway' ? 5 : node.type === 'event' ? 4.5 : 4) * appear;
          const pulseSize = nodeSize + Math.sin(t * 3 + node.lat) * 1.5;

          // Pulse ring
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseSize + 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${node.color === '#FFBE07' ? '255,190,7' : node.color === '#3b82f6' ? '59,130,246' : node.color === '#a855f7' ? '168,85,247' : '16,185,129'}, ${nodeAlpha * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Node circle
          ctx.beginPath();
          if (node.type === 'gateway') {
            // Diamond shape
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-nodeSize / 1.4, -nodeSize / 1.4, nodeSize * 1.4, nodeSize * 1.4);
            ctx.restore();
            ctx.fillStyle = node.color + Math.round(nodeAlpha * 255).toString(16).padStart(2, '0');
          } else {
            ctx.arc(p.x, p.y, nodeSize, 0, Math.PI * 2);
            ctx.fillStyle = node.color + Math.round(nodeAlpha * 255).toString(16).padStart(2, '0');
            ctx.fill();
          }
        }
      }

      // ── "Filter funnel" effect - streams converging into organized paths ──
      const streamCount = 8;
      for (let i = 0; i < streamCount; i++) {
        const angle = (i / streamCount) * Math.PI * 2 + t * 0.2;
        const startR = r * 1.3;
        const sx = cx + Math.cos(angle) * startR;
        const sy = cy + Math.sin(angle) * startR * 0.5 - r * 0.2;
        const ex = cx + Math.cos(angle * 0.3 + 1) * r * 0.3;
        const ey = cy + Math.sin(angle * 0.3) * r * 0.3;

        const grad2 = ctx.createLinearGradient(sx, sy, ex, ey);
        grad2.addColorStop(0, 'rgba(255, 190, 7, 0)');
        grad2.addColorStop(0.3, `rgba(255, 190, 7, ${0.03 + Math.sin(t + i) * 0.01})`);
        grad2.addColorStop(1, 'rgba(255, 190, 7, 0)');

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(
          cx + Math.cos(angle + 0.5) * r * 0.6,
          cy + Math.sin(angle + 0.5) * r * 0.3,
          ex, ey
        );
        ctx.strokeStyle = grad2;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
}

// ── Auto-typing workflow step animation ─────────────────────────────
function WorkflowStepAnimation() {
  const [steps, setSteps] = useState<{ id: number; label: string; type: string; x: number; y: number; opacity: number; connected: boolean }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const labels = [
      { label: 'Long Stoppage Detected', type: 'event' },
      { label: 'Assess Situation', type: 'task' },
      { label: 'Duration > 60m?', type: 'gateway' },
      { label: 'Call Driver', type: 'task' },
      { label: 'Escalate to Manager', type: 'task' },
      { label: 'Mark Resolved', type: 'end' },
      { label: 'Route Deviation Alert', type: 'event' },
      { label: 'Check Severity', type: 'gateway' },
      { label: 'Auto-Resolve', type: 'task' },
      { label: 'Transit Delay Trigger', type: 'event' },
      { label: 'Notify Stakeholders', type: 'task' },
      { label: 'Revise ETA', type: 'task' },
    ];

    const interval = setInterval(() => {
      const item = labels[idRef.current % labels.length];
      idRef.current++;
      const side = Math.random() > 0.5 ? 'left' : 'right';
      setSteps(prev => {
        const next = [...prev, {
          id: idRef.current,
          label: item.label,
          type: item.type,
          x: side === 'left' ? 5 + Math.random() * 15 : 80 + Math.random() * 15,
          y: 15 + Math.random() * 70,
          opacity: 1,
          connected: Math.random() > 0.3,
        }];
        return next.slice(-6);
      });
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const typeColors: Record<string, string> = {
    event: '#FFBE07',
    task: '#FFBE07',
    gateway: '#3b82f6',
    end: '#10b981',
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {steps.map((step) => (
        <div
          key={step.id}
          className="absolute animate-floatIn"
          style={{
            left: `${step.x}%`,
            top: `${step.y}%`,
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap"
            style={{
              background: 'rgba(19, 21, 29, 0.85)',
              border: `1px solid ${typeColors[step.type]}33`,
              color: typeColors[step.type],
              backdropFilter: 'blur(8px)',
              boxShadow: `0 0 20px ${typeColors[step.type]}08`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: typeColors[step.type] }}
            />
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1117' }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4" style={{ background: 'rgba(15,17,23,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1d27' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD }}>
            <svg className="w-4.5 h-4.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: GOLD }}>Control Tower</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/playground?mode=templates')}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            style={{ color: '#d1d5db', border: '1px solid #2a2d3a' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFBE07'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2d3a'; e.currentTarget.style.color = '#d1d5db'; }}
          >
            Templates
          </button>
          <button
            onClick={() => router.push('/chat')}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:brightness-110"
            style={{ background: GOLD, color: '#000' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            AI Builder
          </button>
        </div>
      </nav>

      {/* ── Hero with Globe ────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden" style={{ minHeight: '85vh' }}>
        {/* Rotating Globe Background */}
        <RotatingGlobe />

        {/* Floating workflow steps */}
        <WorkflowStepAnimation />

        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-32 z-10" style={{ background: 'linear-gradient(to bottom, #0f1117, transparent)' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 z-10" style={{ background: 'linear-gradient(to top, #0f1117, transparent)' }} />

        <div className="relative z-20 max-w-3xl animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8" style={{ background: 'rgba(255,190,7,0.1)', color: GOLD, border: '1px solid rgba(255,190,7,0.2)', backdropFilter: 'blur(12px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
            Workflow Automation for Logistics Operations
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="text-white">Tune Out the Noise.</span>
            <br />
            <span style={{ color: GOLD }}>Automate What Matters.</span>
          </h1>
          <p className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: '#9ca3af', backdropFilter: 'blur(4px)' }}>
            From thousands of operational alerts to clean, actionable workflows — design, deploy and automate your SOPs visually in minutes.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => router.push('/chat')}
              className="group flex items-center gap-2.5 px-8 py-4 text-sm font-bold rounded-xl transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 shadow-lg shadow-yellow-900/30"
              style={{ background: GOLD, color: '#000' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                <path d="M8 10h.01M12 10h.01M16 10h.01" />
              </svg>
              Describe Your Workflow in Plain English
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/playground?mode=templates')}
                className="group flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                style={{ color: '#fff', border: '1px solid #363944', background: 'rgba(26,29,39,0.6)', backdropFilter: 'blur(8px)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFBE07'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#363944'; }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                Start from Template
              </button>
              <span className="text-[10px]" style={{ color: '#4a4d5a' }}>or</span>
              <button
                onClick={() => router.push('/playground')}
                className="group flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                style={{ color: '#fff', border: '1px solid #363944', background: 'rgba(26,29,39,0.6)', backdropFilter: 'blur(8px)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FFBE07'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#363944'; }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Visual Builder
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works (user-centric) ──────────────────────────── */}
      <section className="px-8 py-20 max-w-5xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#6b7280' }}>Three steps from alert chaos to automated resolution.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="relative text-center group">
              {i < 2 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px" style={{ background: 'linear-gradient(to right, rgba(255,190,7,0.3), rgba(255,190,7,0))' }} />
              )}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-105" style={{ background: 'rgba(255,190,7,0.08)', border: '1px solid rgba(255,190,7,0.15)' }}>
                <span className="text-2xl font-bold" style={{ color: GOLD }}>{i + 1}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Capabilities ────────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">Everything You Need to Automate Ops</h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: '#6b7280' }}>From event triggers to escalation policies, the Control Tower workflow builder gives your operations team full control.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="group p-5 rounded-xl transition-all duration-200 hover:-translate-y-1"
              style={{ background: '#13151d', border: '1px solid #2a2d3a' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#363944'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d3a'; }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: cap.bg }}>
                <span style={{ color: cap.color }}>{cap.icon}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{cap.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Templates ───────────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-6xl mx-auto w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Ready-to-Use Templates</h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>Pick a template and customize it for your operations. One click to load, one click to deploy.</p>
          </div>
          <button
            onClick={() => router.push('/playground?mode=templates')}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: GOLD, border: `1px solid rgba(255,190,7,0.3)` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,190,7,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            View All Templates
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {WORKFLOW_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => router.push('/playground?mode=templates')}
              className="group text-left p-5 rounded-xl transition-all duration-200 hover:-translate-y-1"
              style={{ background: '#13151d', border: '1px solid #2a2d3a' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = GOLD; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2d3a'; }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,190,7,0.1)' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{template.name}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,190,7,0.1)', color: GOLD }}>{template.category}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: '#6b7280' }}>{template.description}</p>
              <div className="flex items-center gap-2 text-xs font-medium transition-colors" style={{ color: '#4a4d5a' }}>
                <span className="group-hover:text-[#FFBE07] transition-colors">Use this template</span>
                <svg className="w-3.5 h-3.5 transition-all group-hover:translate-x-1 group-hover:text-[#FFBE07]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="px-8 py-8 text-center" style={{ borderTop: '1px solid #1a1d27' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: GOLD }}>
            <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xs font-bold" style={{ color: GOLD }}>Control Tower</span>
        </div>
        <p className="text-[11px]" style={{ color: '#4a4d5a' }}>Workflow Automation Platform for Logistics Operations</p>
      </footer>
    </div>
  );
}

// ── How it works data ───────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    title: 'Describe in Plain English',
    desc: 'Type your SOP naturally — "When stoppage detected, call driver, retry 3 times, then escalate to manager." Our AI converts it into a workflow instantly.',
  },
  {
    title: 'Preview & Simulate',
    desc: 'See your workflow rendered live. Run a step-by-step simulation to verify the logic, then fine-tune in the visual editor if needed.',
  },
  {
    title: 'Deploy & Automate',
    desc: 'Validate your workflow, export the DSL, and deploy it to your operations backend with one click.',
  },
];

// ── Capability cards data ──────────────────────────────────────────
const ic = 'w-5 h-5';

const CAPABILITIES = [
  {
    title: 'Event Triggers',
    desc: 'Route deviations, stoppages, ETA breaches, overspeeding — trigger workflows from any operational event.',
    color: '#FFBE07',
    bg: 'rgba(255,190,7,0.1)',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  },
  {
    title: 'Smart Conditions',
    desc: 'Branch logic with arithmetic and string operators. Duration checks, status comparisons, geofence thresholds.',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 10-10 10L2 12z" /><path d="M9 9l6 6M15 9l-6 6" /></svg>,
  },
  {
    title: 'Automated Actions',
    desc: 'Place calls, send communications, auto-resolve incidents, or escalate to managers — all configured visually.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
  },
  {
    title: 'One-Click Deploy',
    desc: 'Validate, export DSL, and deploy directly to your operations backend. No code changes required.',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    icon: <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>,
  },
];
