// ── Natural Language to Workflow DSL Converter ───────────────────────
// Parses plain English workflow descriptions into the WorkflowDSL format.
// Uses pattern matching and keyword extraction — no external AI API needed.

import { WorkflowDSL, WorkflowStep, WorkflowTransition } from '@/types/workflow';

// ── Keyword patterns ─────────────────────────────────────────────────

// ── Trigger type detection ───────────────────────────────────────────

const TRIGGER_PATTERNS: { pattern: RegExp; type: string; category: string }[] = [
  { pattern: /\b(long\s+stoppage|stoppage|stopped|halted|stationary)\b/i, type: 'LONG_STOPPAGE', category: 'operations' },
  { pattern: /\b(transit\s+delay|delayed|late|delay)\b/i, type: 'TRANSIT_DELAY', category: 'operations' },
  { pattern: /\b(route\s+deviation|off[- ]?route|deviat)/i, type: 'ROUTE_DEVIATION', category: 'compliance' },
  { pattern: /\b(overspeed|speeding|over\s*speed)/i, type: 'OVERSPEEDING', category: 'safety' },
  { pattern: /\b(night\s+driv|driving\s+at\s+night)/i, type: 'NIGHT_DRIVING', category: 'safety' },
  { pattern: /\b(eway|e-?way\s*bill|eway\s*bill\s*expir)/i, type: 'EWAY_BILL_EXPIRY', category: 'compliance' },
  { pattern: /\b(sta\s+breach|arrival\s+breach)/i, type: 'STA_BREACH', category: 'operations' },
  { pattern: /\b(detention|origin\s+detention|dest\w*\s+detention)/i, type: 'DETENTION', category: 'operations' },
  { pattern: /\b(tracking\s+(?:lost|interrupted)|gps\s+(?:lost|issue))/i, type: 'TRACKING_INTERRUPTED', category: 'operations' },
  { pattern: /\b(diversion)/i, type: 'DIVERSION', category: 'compliance' },
];

// ── Name extraction ──────────────────────────────────────────────────

function extractPersonName(text: string): string[] {
  const names: string[] = [];
  // Look for capitalized names after "to", "escalate to", etc.
  const namePatterns = [
    /(?:escalat\w+\s+(?:it\s+)?to|assign\s+to|notify|alert|inform|hand\s*(?:off|over)\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /(?:escalat\w+\s+(?:it\s+)?to|assign\s+to)\s+(?:the\s+)?(\w+)/gi,
  ];
  for (const pat of namePatterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const name = m[1].trim();
      if (!['the', 'a', 'an', 'it', 'manager', 'supervisor', 'team', 'ops', 'operations'].includes(name.toLowerCase())) {
        names.push(name);
      }
    }
  }
  return Array.from(new Set(names));
}

// ── Time parsing ─────────────────────────────────────────────────────

function parseTimeToISO(amount: number, unit: string): string {
  const u = unit.toLowerCase();
  if (u.startsWith('h')) return `PT${amount}H`;
  if (u.startsWith('m')) return `PT${amount}M`;
  if (u.startsWith('s')) return `PT${amount}S`;
  return `PT${amount}M`;
}

function parseTimeMinutes(amount: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith('h')) return amount * 60;
  return amount;
}

// ── Retry extraction ─────────────────────────────────────────────────

interface RetryInfo {
  count: number;
  windowMinutes: number;
  timerISO: string;
}

function extractRetry(text: string): RetryInfo | null {
  // "retry 3 times within 60 mins"
  const m1 = text.match(/retry\s+(\d+)\s*times?\s*(?:within|in|over|every)?\s*(\d+)\s*(min|hour|hr|h|m)/i);
  if (m1) {
    const count = parseInt(m1[1]);
    const amount = parseInt(m1[2]);
    const unit = m1[3];
    const windowMin = parseTimeMinutes(amount, unit);
    const intervalMin = Math.round(windowMin / count);
    return { count, windowMinutes: windowMin, timerISO: parseTimeToISO(intervalMin, 'm') };
  }
  // "if the driver does not pick up the call, retry 3 times within 60 mins"
  const m2 = text.match(/(?:does\s*n[o']t|doesn't|not)\s+pick\s*(?:up)?.*?retry\s+(\d+)\s*times?\s*(?:within|in|over)?\s*(\d+)\s*(min|hour|hr|h|m)/i);
  if (m2) {
    const count = parseInt(m2[1]);
    const amount = parseInt(m2[2]);
    const unit = m2[3];
    const windowMin = parseTimeMinutes(amount, unit);
    const intervalMin = Math.round(windowMin / count);
    return { count, windowMinutes: windowMin, timerISO: parseTimeToISO(intervalMin, 'm') };
  }
  return null;
}

// ── Monitor/wait time extraction ─────────────────────────────────────

function extractWaitTime(text: string): { minutes: number; iso: string } | null {
  const m = text.match(/(?:monitor|watch|wait|check)\s+(?:after|for|within)?\s*(\d+)\s*(min|hour|hr|h|m)/i);
  if (m) {
    const amount = parseInt(m[1]);
    const unit = m[2];
    return { minutes: parseTimeMinutes(amount, unit), iso: parseTimeToISO(amount, unit) };
  }
  const m2 = text.match(/after\s+(\d+)\s*(min|hour|hr|h|m)/i);
  if (m2) {
    const amount = parseInt(m2[1]);
    const unit = m2[2];
    return { minutes: parseTimeMinutes(amount, unit), iso: parseTimeToISO(amount, unit) };
  }
  return null;
}

// ── Location check extraction ────────────────────────────────────────

function extractLocationChecks(text: string): string[] {
  const checks: string[] = [];
  const locationTerms = ['petrol pump', 'gas station', 'fuel station', 'toll', 'toll plaza', 'plaza', 'rest area', 'dhaba', 'hotel', 'warehouse', 'depot', 'parking', 'service area', 'truck stop'];
  for (const term of locationTerms) {
    if (text.toLowerCase().includes(term)) {
      checks.push(term.replace(/\b\w/g, c => c.toUpperCase()));
    }
  }
  return checks;
}

// ── Main sentence splitter ───────────────────────────────────────────

function splitIntoSegments(text: string): string[] {
  // Split by sentence boundaries, commas with conjunctions, "then", "after that", dashes
  return text
    .split(/(?:\.\s+|\s*[-–—]\s*|\s*,\s*(?:then|and\s+then|after\s+that|next|also|finally)\s+|\s+then\s+|\s+after\s+that\s+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

// ── Build step key from label ────────────────────────────────────────

// ── Main parse function ──────────────────────────────────────────────

export interface ParseResult {
  dsl: WorkflowDSL;
  summary: string;
  steps: string[];
  confidence: number;
}

export function parseNaturalLanguage(input: string): ParseResult {
  const text = input.trim();
  const segments = splitIntoSegments(text);
  const summaryParts: string[] = [];

  // 1. Detect trigger type
  let triggerType = 'CUSTOM_EVENT';
  let category = 'operations';
  let workflowName = 'Custom Workflow';
  let priority = 'MEDIUM';

  for (const tp of TRIGGER_PATTERNS) {
    const m = text.match(tp.pattern);
    if (m) {
      triggerType = tp.type;
      category = tp.category;
      workflowName = tp.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      break;
    }
  }

  // Try to extract a name from the beginning
  const nameMatch = text.match(/^([^-–—.]+?)(?:\s*[-–—]\s*|\s*:\s*)/);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    if (candidate.length > 3 && candidate.length < 60) {
      workflowName = candidate.replace(/\bsop\b/i, 'SOP').replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // Detect escalation mentions for priority
  if (/escalat/i.test(text) || /manager/i.test(text) || /critical/i.test(text)) {
    priority = 'HIGH';
  }

  // Extract person names for escalation
  const personNames = extractPersonName(text);
  const locationChecks = extractLocationChecks(text);
  const retryInfo = extractRetry(text);
  const waitTime = extractWaitTime(text);

  // 2. Build steps from parsed segments
  const steps: WorkflowStep[] = [];
  const transitions: WorkflowTransition[] = [];
  const stepKeys: string[] = [];

  // Always start with START event
  steps.push({ step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' });
  stepKeys.push('START');
  summaryParts.push('Workflow starts when an alert is triggered');

  // Track last step for transitions
  let lastStepKey = 'START';
  let stepCounter = 0;
  let hasGateway = false;
  let gatewayKey = '';
  const afterGatewaySteps: { key: string; condition?: string; isDefault?: boolean }[] = [];

  for (const segment of segments) {
    // Check for location analysis
    if (locationChecks.length > 0 && /analy[sz]e|check|assess|location|inspect/i.test(segment)) {
      stepCounter++;
      const key = 'ANALYSE_LOCATION';
      steps.push({
        step_key: key,
        display_name: 'Analyse Location',
        step_type: 'SERVICE_TASK',
        task_type: 'ANALYSIS',
        config: { checks: locationChecks },
      });
      transitions.push({ from: lastStepKey, to: key });
      lastStepKey = key;
      stepKeys.push(key);
      summaryParts.push(`Analyse location for: ${locationChecks.join(', ')}`);
      continue;
    }

    // Check for location-specific checks (petrol pump, toll, etc.)
    if (/\b(petrol\s*pump|toll|plaza|gas\s*station|fuel|dhaba|rest\s*area)\b/i.test(segment) && !/analy/i.test(segment)) {
      stepCounter++;
      const key = 'LOCATION_CHECKS';
      if (!stepKeys.includes(key)) {
        steps.push({
          step_key: key,
          display_name: 'Verify Location Type',
          step_type: 'SERVICE_TASK',
          task_type: 'VERIFICATION',
          config: { check_types: locationChecks },
        });
        transitions.push({ from: lastStepKey, to: key });
        lastStepKey = key;
        stepKeys.push(key);
        summaryParts.push(`Verify if location is: ${locationChecks.join(', ')}`);
      }
      continue;
    }

    // Check for call + retry pattern
    if (/call.*driver/i.test(segment) || (retryInfo && /call/i.test(segment))) {
      stepCounter++;

      if (retryInfo) {
        // Build subprocess with retry
        const subKey = 'CALL_DRIVER';
        const callKey = 'INITIATE_DRIVER_CALL';
        const responseKey = 'CAPTURE_RESPONSE';
        const analyseKey = 'ANALYSE_RESPONSE';

        const subSteps: WorkflowStep[] = [
          {
            step_key: callKey,
            display_name: 'Place Call to Driver',
            step_type: 'SERVICE_TASK',
            task_type: 'DRIVER_CALL',
            mandatory_input: {
              callee_number: { type: 'string', required: true, description: 'driver_mobile' },
              callee_name: { type: 'string', required: true, description: 'driver_name' },
            },
            config: { retry_count: retryInfo.count, retry_window_minutes: retryInfo.windowMinutes },
            boundary_events: [{
              event_type: 'TIMER',
              event_key: 'CALL_TIMEOUT',
              timer_value: retryInfo.timerISO,
              interrupting: true,
              on_timeout_transition_to: personNames.length > 0 ? `ESCALATE_TO_${personNames[0].toUpperCase()}` : 'ESCALATE_L1',
            }],
          },
          { step_key: responseKey, display_name: 'Capture Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
          { step_key: analyseKey, display_name: 'Analyse Call Response', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        ];

        const subTransitions: WorkflowTransition[] = [
          { from: callKey, to: responseKey },
          { from: responseKey, to: analyseKey },
        ];

        steps.push({
          step_key: subKey,
          display_name: 'Reach Out to Driver',
          step_type: 'SUB_PROCESS',
          steps: subSteps,
          transitions: subTransitions,
          config: { retry_count: retryInfo.count, retry_window_minutes: retryInfo.windowMinutes },
        });

        transitions.push({ from: lastStepKey, to: subKey });
        lastStepKey = subKey;
        stepKeys.push(subKey);
        summaryParts.push(`Call driver (retry ${retryInfo.count} times within ${retryInfo.windowMinutes} min if no answer)`);
      } else {
        const key = 'CALL_DRIVER';
        steps.push({
          step_key: key,
          display_name: 'Call Driver',
          step_type: 'SERVICE_TASK',
          task_type: 'DRIVER_CALL',
          mandatory_input: {
            callee_number: { type: 'string', required: true, description: 'driver_mobile' },
            callee_name: { type: 'string', required: true, description: 'driver_name' },
          },
        });
        transitions.push({ from: lastStepKey, to: key });
        lastStepKey = key;
        stepKeys.push(key);
        summaryParts.push('Call the driver');
      }
      continue;
    }

    // Check for escalation
    if (/escalat/i.test(segment)) {
      stepCounter++;
      let target = 'Manager';
      let targetKey = 'MANAGER';

      // Check for specific person
      const escMatch = segment.match(/escalat\w+\s+(?:it\s+)?to\s+(?:the\s+)?(\w+)/i);
      if (escMatch) {
        target = escMatch[1];
        targetKey = target.toUpperCase();
        if (['manager', 'supervisor', 'lead', 'head'].includes(target.toLowerCase())) {
          targetKey = target.toUpperCase();
        }
      }

      const key = `ESCALATE_TO_${targetKey}`;
      if (!stepKeys.includes(key)) {
        steps.push({
          step_key: key,
          display_name: `Escalate to ${target.charAt(0).toUpperCase() + target.slice(1)}`,
          step_type: 'USER_TASK',
          task_type: 'ESCALATION',
          config: { escalation_target: target },
        });

        // If we're in a gateway context, add to gateway branches
        if (hasGateway && afterGatewaySteps.length > 0) {
          // This is likely a condition branch
          const condLabel = /still|remain|same|not\s+resolved/i.test(segment) ? 'Still unresolved' : undefined;
          transitions.push({
            from: lastStepKey,
            to: key,
            ...(condLabel ? { label: condLabel, condition: { variable: 'status', operator: '==', value: 'UNRESOLVED' } } : { default: true }),
          });
        } else {
          transitions.push({ from: lastStepKey, to: key });
        }
        lastStepKey = key;
        stepKeys.push(key);
        summaryParts.push(`Escalate to ${target}`);
      }
      continue;
    }

    // Check for monitoring with wait time
    if (/monitor|watch|keep.*eye|observe/i.test(segment)) {
      stepCounter++;
      const wt = waitTime || extractWaitTime(segment);
      const key = 'MONITOR_STATUS';
      steps.push({
        step_key: key,
        display_name: 'Monitor Situation',
        step_type: 'SERVICE_TASK',
        task_type: 'MONITORING',
        ...(wt ? {
          boundary_events: [{
            event_type: 'TIMER',
            event_key: 'MONITOR_TIMEOUT',
            timer_value: wt.iso,
            interrupting: false,
          }],
          config: { monitor_duration_minutes: wt.minutes },
        } : {}),
      });
      transitions.push({ from: lastStepKey, to: key });
      lastStepKey = key;
      stepKeys.push(key);
      summaryParts.push(wt ? `Monitor for ${wt.minutes} minutes` : 'Monitor situation');
      continue;
    }

    // Check for "after X hours/minutes" pattern which implies a wait + check
    const afterMatch = segment.match(/after\s+(\d+)\s*(hour|hr|h|min|m)/i);
    if (afterMatch && !stepKeys.includes('MONITOR_STATUS')) {
      stepCounter++;
      const amount = parseInt(afterMatch[1]);
      const unit = afterMatch[2];
      const minutes = parseTimeMinutes(amount, unit);
      const iso = parseTimeToISO(amount, unit);

      const key = 'WAIT_AND_CHECK';
      steps.push({
        step_key: key,
        display_name: `Wait ${amount} ${unit.startsWith('h') ? 'Hours' : 'Minutes'} & Re-check`,
        step_type: 'SERVICE_TASK',
        task_type: 'TIMER',
        config: { wait_duration_minutes: minutes, timer_value: iso },
      });
      transitions.push({ from: lastStepKey, to: key });
      lastStepKey = key;
      stepKeys.push(key);
      summaryParts.push(`Wait ${amount} ${unit.startsWith('h') ? 'hours' : 'minutes'} and re-check`);

      // After waiting, add a gateway to check status
      const gwKey = 'CHECK_STATUS_AFTER_WAIT';
      steps.push({
        step_key: gwKey,
        display_name: 'Is Issue Still Unresolved?',
        step_type: 'EXCLUSIVE_GATEWAY',
      });
      transitions.push({ from: key, to: gwKey });
      lastStepKey = gwKey;
      stepKeys.push(gwKey);
      hasGateway = true;
      gatewayKey = gwKey;
      continue;
    }

    // Check for notifications
    if (/notify|send\s+(?:a\s+)?(?:notification|alert|message|sms|email)|inform|communication/i.test(segment)) {
      stepCounter++;
      const key = 'SEND_NOTIFICATION';
      if (!stepKeys.includes(key)) {
        steps.push({
          step_key: key,
          display_name: 'Send Notification',
          step_type: 'SERVICE_TASK',
          task_type: 'NOTIFICATION',
        });
        transitions.push({ from: lastStepKey, to: key });
        lastStepKey = key;
        stepKeys.push(key);
        summaryParts.push('Send notification');
      }
      continue;
    }

    // Check for auto-resolve
    if (/auto[- ]?resolv|mark.*resolv|close|mark.*closed/i.test(segment)) {
      // Will be added as END event
      continue;
    }

    // Generic analysis step
    if (/analy[sz]e|assess|evaluat|investigat|look\s+into/i.test(segment) && !stepKeys.includes('ANALYSE_LOCATION')) {
      stepCounter++;
      const key = `INITIAL_ANALYSIS`;
      if (!stepKeys.includes(key)) {
        steps.push({
          step_key: key,
          display_name: 'Assess Situation',
          step_type: 'SERVICE_TASK',
          task_type: 'ANALYSIS',
        });
        transitions.push({ from: lastStepKey, to: key });
        lastStepKey = key;
        stepKeys.push(key);
        summaryParts.push('Assess the situation');
      }
      continue;
    }

    // Generic "if" condition creates a gateway
    if (/^if\s+/i.test(segment) && !hasGateway) {
      stepCounter++;
      const gwKey = `DECISION_${stepCounter}`;
      // Extract condition text
      const condText = segment.replace(/^if\s+/i, '').split(/\s*,\s*/)[0];
      steps.push({
        step_key: gwKey,
        display_name: condText.length < 40 ? condText.charAt(0).toUpperCase() + condText.slice(1) + '?' : 'Check Condition',
        step_type: 'EXCLUSIVE_GATEWAY',
      });
      transitions.push({ from: lastStepKey, to: gwKey });
      lastStepKey = gwKey;
      stepKeys.push(gwKey);
      hasGateway = true;
      gatewayKey = gwKey;
      summaryParts.push(`Check: ${condText}`);
      continue;
    }
  }

  // 3. Add a resolution gateway if we have escalation but no gateway yet
  if (!hasGateway && steps.some(s => s.task_type === 'ESCALATION') && steps.some(s => s.step_type === 'SUB_PROCESS' || s.task_type === 'DRIVER_CALL')) {
    const gwKey = 'CHECK_RESOLUTION';
    const callStep = steps.find(s => s.step_type === 'SUB_PROCESS' || s.task_type === 'DRIVER_CALL');
    const escStep = steps.find(s => s.task_type === 'ESCALATION');

    if (callStep && escStep) {
      // Insert gateway after call step
      steps.splice(steps.indexOf(escStep), 0, {
        step_key: gwKey,
        display_name: 'Is the Issue Resolved?',
        step_type: 'EXCLUSIVE_GATEWAY',
      });

      // Fix transitions
      const escTransIdx = transitions.findIndex(t => t.to === escStep.step_key);
      if (escTransIdx >= 0) {
        const escFrom = transitions[escTransIdx].from;
        transitions[escTransIdx] = { from: gwKey, to: escStep.step_key, default: true, label: 'Not resolved' };
        transitions.push({ from: escFrom, to: gwKey });
      }

      stepKeys.push(gwKey);
      hasGateway = true;
      gatewayKey = gwKey;
    }
  }

  // 4. Add END event
  const endKey = 'CLOSE';
  steps.push({ step_key: endKey, display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' });

  // Connect last step to end
  transitions.push({ from: lastStepKey, to: endKey });

  // If there's a gateway, add a "resolved" branch to END
  if (hasGateway && gatewayKey) {
    const hasResolvedBranch = transitions.some(t => t.from === gatewayKey && t.to === endKey);
    if (!hasResolvedBranch) {
      transitions.push({
        from: gatewayKey,
        to: endKey,
        condition: { variable: 'resolved', operator: '==', value: true },
        label: 'Resolved',
      });
    }
  }

  // Make sure all escalation steps eventually lead to END
  const escSteps = steps.filter(s => s.task_type === 'ESCALATION');
  for (const es of escSteps) {
    const hasOutgoing = transitions.some(t => t.from === es.step_key);
    if (!hasOutgoing) {
      transitions.push({ from: es.step_key, to: endKey });
    }
  }

  // 5. Build escalation policy from detected escalation levels
  const escalationLevels = [];
  let level = 1;
  for (const es of escSteps) {
    escalationLevels.push({
      level,
      level_key: `L${level}`,
      condition: { variable: 'duration_minutes', operator: '>=' as string, value: level * 60 },
      priority: level === 1 ? 'MEDIUM' : level === 2 ? 'HIGH' : 'CRITICAL',
      description: `Level ${level} - Escalation to ${es.config?.escalation_target || 'Manager'}`,
    });
    level++;
  }

  // 6. Assemble DSL
  const code = workflowName.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '_');

  const dsl: WorkflowDSL = {
    name: workflowName,
    code,
    description: `Auto-generated workflow: ${summaryParts.join(' → ')}`,
    metadata: {
      category,
      trigger_type: triggerType,
      priority,
      tags: [code.toLowerCase(), category, 'auto-generated'],
      force_close_supported: true,
      ...(escalationLevels.length > 0 ? {
        escalation_policy: {
          type: 'TIME_BASED',
          levels: escalationLevels,
        },
      } : {}),
    },
    steps,
    transitions,
  };

  // Calculate confidence based on how much we understood
  const totalSegments = segments.length;
  const parsedSteps = steps.length - 2; // Minus START and END
  const confidence = Math.min(0.95, Math.max(0.3, (parsedSteps / Math.max(totalSegments, 1)) * 0.8 + 0.2));

  return {
    dsl,
    summary: summaryParts.join(' → '),
    steps: summaryParts,
    confidence,
  };
}

// ── Streaming simulation ─────────────────────────────────────────────
// Simulates step-by-step "thinking" for the chat interface

export interface ThinkingStep {
  type: 'understanding' | 'extracting' | 'building' | 'complete';
  message: string;
  detail?: string;
  delay: number; // ms before showing this step
}

export function generateThinkingSteps(input: string): ThinkingStep[] {
  const steps: ThinkingStep[] = [];
  let delay = 0;

  // 1. Understanding
  steps.push({ type: 'understanding', message: 'Understanding your workflow description...', delay });
  delay += 800;

  // 2. Detect trigger
  for (const tp of TRIGGER_PATTERNS) {
    if (tp.pattern.test(input)) {
      steps.push({ type: 'extracting', message: `Detected trigger type: ${tp.type.replace(/_/g, ' ')}`, detail: tp.category, delay });
      delay += 600;
      break;
    }
  }

  // 3. Extract actions
  const actions: string[] = [];
  if (/analy[sz]e|assess|check.*location/i.test(input)) {
    actions.push('Location analysis step');
  }
  if (/petrol|toll|plaza|fuel/i.test(input)) {
    actions.push('Location type verification');
  }
  if (/call.*driver/i.test(input)) {
    actions.push('Driver call action');
  }
  const retry = extractRetry(input);
  if (retry) {
    actions.push(`Retry logic: ${retry.count} attempts in ${retry.windowMinutes} min`);
  }
  if (/escalat/i.test(input)) {
    const names = extractPersonName(input);
    actions.push(`Escalation${names.length > 0 ? ` to ${names.join(', ')}` : ''}`);
  }
  if (/monitor|after\s+\d/i.test(input)) {
    actions.push('Monitoring/wait timer');
  }

  for (const action of actions) {
    steps.push({ type: 'extracting', message: `Found: ${action}`, delay });
    delay += 500;
  }

  // 4. Building
  steps.push({ type: 'building', message: 'Assembling workflow structure...', delay });
  delay += 700;
  steps.push({ type: 'building', message: 'Adding transitions and conditions...', delay });
  delay += 500;
  steps.push({ type: 'building', message: 'Setting up escalation policy...', delay });
  delay += 400;

  // 5. Complete
  steps.push({ type: 'complete', message: 'Workflow ready!', delay });

  return steps;
}
