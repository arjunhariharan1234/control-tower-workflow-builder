import { WorkflowTemplate } from '@/types/workflow';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ─── 1. Consent ─────────────────────────────────────────────────────
  {
    id: 'consent',
    name: 'Consent',
    description: 'Handles non-consented / untracked trips — attempt remote consent, call driver, escalate to Security/MHDs, then to Nitin with email notification to L3 stakeholders.',
    category: 'Compliance',
    dsl: {
      name: 'Consent',
      code: 'consent',
      description: 'Escalation workflow for obtaining driver consent on untracked trips',
      metadata: {
        category: 'compliance',
        trigger_type: 'UNTRACKED',
        priority: 'CRITICAL',
        tags: ['consent', 'untracked', 'compliance', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            {
              level: 1,
              level_key: 'L1',
              condition: { variable: 'duration_minutes', operator: '<', value: 60 },
              priority: 'MEDIUM',
              description: 'L1 — Attempt remote consent on non-consented/untracked trips. Call driver 3 times in 1 hour. Escalate on WhatsApp if vehicle still in plant.',
            },
            {
              level: 2,
              level_key: 'L2',
              condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] },
              priority: 'HIGH',
              description: 'L2 — If driver not reachable OR no consent after 1 hour → Call Security/MHDs 2 times in next 1 hour.',
            },
            {
              level: 3,
              level_key: 'L3',
              condition: { variable: 'duration_minutes', operator: '>=', value: 120 },
              priority: 'CRITICAL',
              description: 'L3 — If MHD not reachable OR no consent after 1 hour → Call Nitin with trip details, email L3 stakeholders.',
            },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Consent Status', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER',
          display_name: 'Reach Out to Driver for Consent',
          step_type: 'SUB_PROCESS',
          execution_mode: 'SEQUENTIAL',
          steps: [
            {
              step_key: 'INITIATE_DRIVER_CALL',
              display_name: 'Place Call to Driver',
              step_type: 'SERVICE_TASK',
              task_type: 'DRIVER_CALL',
              mandatory_input: {
                callee_number: { type: 'string', required: true, description: 'driver_mobile' },
                callee_name: { type: 'string', required: true, description: 'driver_name' },
              },
              boundary_events: [
                {
                  event_type: 'TIMER',
                  event_key: 'CALL_TIMEOUT',
                  timer_value: 'PT20M',
                  interrupting: true,
                  on_timeout_transition_to: 'MANAGER_INTERVENTION',
                },
              ],
            },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Capture Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review Driver Response', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is Consent Obtained?', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'MANAGER_INTERVENTION',
          display_name: 'Escalate — Call Security/MHDs & Notify Nitin',
          step_type: 'USER_TASK',
          form: { form_version: 'FRV-consent-escalation', render_engine: 'RJSF' },
        },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'ROUTING_DECISION' },
        {
          from: 'ROUTING_DECISION',
          to: 'CALL_DRIVER',
          condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] },
        },
        { from: 'ROUTING_DECISION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_DRIVER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'CLOSE' },
      ],
    },
  },

  // ─── 2. Manual Tracking ─────────────────────────────────────────────
  {
    id: 'manual-tracking',
    name: 'Manual Tracking',
    description: 'Handles tracking-interrupted trips — plot pings for untracked vehicles, call Transporters if driver unreachable, and escalate to MHD for persistent gaps.',
    category: 'Operations',
    dsl: {
      name: 'Manual Tracking',
      code: 'manual_tracking',
      description: 'Escalation workflow for manually tracking interrupted trips',
      metadata: {
        category: 'operations',
        trigger_type: 'TRACKING_INTERRUPTED',
        priority: 'HIGH',
        tags: ['manual_tracking', 'tracking_interrupted', 'operations', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            {
              level: 1,
              level_key: 'L1',
              condition: { variable: 'duration_minutes', operator: '<', value: 60 },
              priority: 'MEDIUM',
              description: 'L1 — Plot pings for non-consented/untracked/unsupported trips. Ensure 100% trips tracking. 4 pings/day.',
            },
            {
              level: 2,
              level_key: 'L2',
              condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] },
              priority: 'HIGH',
              description: 'L2 — If driver reachable OR no info → Call Transporters 2 times in next 1 hour.',
            },
            {
              level: 3,
              level_key: 'L3',
              condition: { variable: 'duration_minutes', operator: '>=', value: 120 },
              priority: 'CRITICAL',
              description: 'L3 — If Transporter not reachable OR no info → Call MHD 2 times in next 1 hour.',
            },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Tracking Interruption', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_TRANSPORTER',
          display_name: 'Reach Out to Transporter',
          step_type: 'SUB_PROCESS',
          execution_mode: 'SEQUENTIAL',
          steps: [
            {
              step_key: 'INITIATE_TRANSPORTER_CALL',
              display_name: 'Place Call to Transporter',
              step_type: 'SERVICE_TASK',
              task_type: 'DRIVER_CALL',
              mandatory_input: {
                callee_number: { type: 'string', required: true, description: 'transporter_mobile' },
                callee_name: { type: 'string', required: true, description: 'transporter_name' },
              },
              boundary_events: [
                {
                  event_type: 'TIMER',
                  event_key: 'CALL_TIMEOUT',
                  timer_value: 'PT30M',
                  interrupting: true,
                  on_timeout_transition_to: 'MANAGER_INTERVENTION',
                },
              ],
            },
            { step_key: 'TRANSPORTER_CALL_RESPONSE', display_name: 'Capture Transporter Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review Transporter Response', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_TRANSPORTER_CALL', to: 'TRANSPORTER_CALL_RESPONSE' },
            { from: 'TRANSPORTER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is Tracking Restored?', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'MANAGER_INTERVENTION',
          display_name: 'Escalate — Call MHD for Tracking Resolution',
          step_type: 'USER_TASK',
          form: { form_version: 'FRV-manual-tracking-escalation', render_engine: 'RJSF' },
        },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'ROUTING_DECISION' },
        {
          from: 'ROUTING_DECISION',
          to: 'CALL_TRANSPORTER',
          condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] },
        },
        { from: 'ROUTING_DECISION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_TRANSPORTER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'CLOSE' },
      ],
    },
  },

  // ─── 3. Manual Closure ──────────────────────────────────────────────
  {
    id: 'manual-closure',
    name: 'Manual Closure',
    description: 'Handles trips not auto-closed after STA breach — confirm unloading with Driver/Transporter/MHD, close the trip, and send delivery confirmation emails to consignees.',
    category: 'Operations',
    dsl: {
      name: 'Manual Closure',
      code: 'manual_closure',
      description: 'Escalation workflow for manually closing trips after STA breach',
      metadata: {
        category: 'operations',
        trigger_type: 'STA_BREACH',
        priority: 'HIGH',
        tags: ['manual_closure', 'sta_breach', 'operations', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            {
              level: 1,
              level_key: 'L1',
              condition: { variable: 'duration_minutes', operator: '<', value: 60 },
              priority: 'MEDIUM',
              description: 'L1 — Manually close trips not auto-closed. Record reasons (incorrect lat-longs, diversions, driver change, wrong destination, cancelled, transhipment, tracking interrupted). Call driver 3 times in 1 hour. Only close if unloading confirmed with Driver/Transporter/MHD.',
            },
            {
              level: 2,
              level_key: 'L2',
              condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] },
              priority: 'HIGH',
              description: 'L2 — If driver reachable OR no info → Call MHDs 2 times in next 1 hour.',
            },
            {
              level: 3,
              level_key: 'L3',
              condition: { variable: 'duration_minutes', operator: '>=', value: 120 },
              priority: 'CRITICAL',
              description: 'L3 — If MHD not reachable OR no info → Email MHD and Nitin with trip details.',
            },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Trip Closure Status', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER',
          display_name: 'Confirm Unloading with Driver',
          step_type: 'SUB_PROCESS',
          execution_mode: 'SEQUENTIAL',
          steps: [
            {
              step_key: 'INITIATE_DRIVER_CALL',
              display_name: 'Place Call to Driver',
              step_type: 'SERVICE_TASK',
              task_type: 'DRIVER_CALL',
              mandatory_input: {
                callee_number: { type: 'string', required: true, description: 'driver_mobile' },
                callee_name: { type: 'string', required: true, description: 'driver_name' },
              },
              boundary_events: [
                {
                  event_type: 'TIMER',
                  event_key: 'CALL_TIMEOUT',
                  timer_value: 'PT20M',
                  interrupting: true,
                  on_timeout_transition_to: 'MANAGER_INTERVENTION',
                },
              ],
            },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Capture Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review Driver Response', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is Unloading Confirmed?', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'MANAGER_INTERVENTION',
          display_name: 'Escalate — Call MHD / Email MHD & Nitin',
          step_type: 'USER_TASK',
          form: { form_version: 'FRV-manual-closure-escalation', render_engine: 'RJSF' },
        },
        {
          step_key: 'SEND_DELIVERY_CONFIRMATION',
          display_name: 'Send Delivery Confirmation to Consignees',
          step_type: 'SERVICE_TASK',
          task_type: 'NOTIFICATION',
        },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'ROUTING_DECISION' },
        {
          from: 'ROUTING_DECISION',
          to: 'CALL_DRIVER',
          condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] },
        },
        { from: 'ROUTING_DECISION', to: 'SEND_DELIVERY_CONFIRMATION', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_DRIVER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'SEND_DELIVERY_CONFIRMATION', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'SEND_DELIVERY_CONFIRMATION' },
        { from: 'SEND_DELIVERY_CONFIRMATION', to: 'CLOSE' },
      ],
    },
  },

  // ─── 4. Long Stoppage ───────────────────────────────────────────────
  {
    id: 'long-stoppage',
    name: 'Long Stoppage',
    description: 'Handles prolonged vehicle stoppage alerts — assess the situation, reach the driver, and escalate to a manager if unresolved.',
    category: 'Operations',
    dsl: {
      name: 'Long Stoppage',
      code: 'long_stoppage',
      description: 'Escalation workflow for long stoppage cases',
      metadata: {
        category: 'operations',
        trigger_type: 'LONG_STOPPAGE',
        priority: 'HIGH',
        tags: ['long_stoppage', 'alert', 'operations', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            { level: 1, level_key: 'L1', condition: { variable: 'duration_minutes', operator: '<', value: 60 }, priority: 'MEDIUM', description: 'Level 1 - Escalation' },
            { level: 2, level_key: 'L2', condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] }, priority: 'HIGH', description: 'Level 2 - Escalation' },
            { level: 3, level_key: 'L3', condition: { variable: 'duration_minutes', operator: '>=', value: 240 }, priority: 'CRITICAL', description: 'Level 3 - Escalation' },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Stoppage Situation', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER', display_name: 'Reach Out to Driver', step_type: 'SUB_PROCESS', execution_mode: 'SEQUENTIAL',
          steps: [
            { step_key: 'INITIATE_DRIVER_CALL', display_name: 'Place Call to Driver', step_type: 'SERVICE_TASK', task_type: 'DRIVER_CALL', mandatory_input: { callee_number: { type: 'string', required: true, description: 'driver_mobile' }, callee_name: { type: 'string', required: true, description: 'driver_name' } }, boundary_events: [{ event_type: 'TIMER', event_key: 'CALL_TIMEOUT', timer_value: 'PT20M', interrupting: true, on_timeout_transition_to: 'MANAGER_INTERVENTION' }] },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Capture Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review What Driver Said', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is the Issue Resolved?', step_type: 'EXCLUSIVE_GATEWAY' },
        { step_key: 'MANAGER_INTERVENTION', display_name: 'Escalate to Manager for Action', step_type: 'USER_TASK', form: { form_version: 'FRV-d2ae5eef-8fa8-4cf3-b754-f482466c4535', render_engine: 'RJSF' } },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'ROUTING_DECISION' },
        { from: 'ROUTING_DECISION', to: 'CALL_DRIVER', condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] } },
        { from: 'ROUTING_DECISION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_DRIVER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'CLOSE' },
      ],
    },
  },

  // ─── 5. Transit Delay ───────────────────────────────────────────────
  {
    id: 'transit-delay',
    name: 'Transit Delay',
    description: 'Monitors delayed shipments in transit — collect reason of delay, urge driver to comply with SLAs, call Transporter if unresolved, and email Transporter & Nitin at L3.',
    category: 'Operations',
    dsl: {
      name: 'Transit Delay',
      code: 'transit_delay',
      description: 'Escalation workflow for handling transit delay incidents',
      metadata: {
        category: 'operations',
        trigger_type: 'TRANSIT_DELAY',
        priority: 'MEDIUM',
        tags: ['transit_delay', 'delay', 'operations', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            {
              level: 1,
              level_key: 'L1',
              condition: { variable: 'duration_minutes', operator: '<', value: 60 },
              priority: 'MEDIUM',
              description: 'L1 — Collect reason of delay. Urge driver to comply with SLAs. Call driver 3 times in 1 hour.',
            },
            {
              level: 2,
              level_key: 'L2',
              condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] },
              priority: 'HIGH',
              description: 'L2 — If driver reachable OR no info → Call Transporter 2 times in next 1 hour.',
            },
            {
              level: 3,
              level_key: 'L3',
              condition: { variable: 'duration_minutes', operator: '>=', value: 120 },
              priority: 'CRITICAL',
              description: 'L3 — If Transporter not reachable OR no info → Email Transporter and Nitin with trip details.',
            },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Delay Situation', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER',
          display_name: 'Reach Out to Driver About Delay',
          step_type: 'SUB_PROCESS',
          execution_mode: 'SEQUENTIAL',
          steps: [
            {
              step_key: 'INITIATE_DRIVER_CALL',
              display_name: 'Place Call to Driver',
              step_type: 'SERVICE_TASK',
              task_type: 'DRIVER_CALL',
              mandatory_input: {
                callee_number: { type: 'string', required: true, description: 'driver_mobile' },
                callee_name: { type: 'string', required: true, description: 'driver_name' },
              },
              boundary_events: [
                {
                  event_type: 'TIMER',
                  event_key: 'CALL_TIMEOUT',
                  timer_value: 'PT20M',
                  interrupting: true,
                  on_timeout_transition_to: 'MANAGER_INTERVENTION',
                },
              ],
            },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Capture Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review Delay Reason from Driver', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is Delay Resolved?', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'MANAGER_INTERVENTION',
          display_name: 'Escalate — Call Transporter / Email Transporter & Nitin',
          step_type: 'USER_TASK',
          form: { form_version: 'FRV-transit-delay-escalation', render_engine: 'RJSF' },
        },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'ROUTING_DECISION' },
        {
          from: 'ROUTING_DECISION',
          to: 'CALL_DRIVER',
          condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] },
        },
        { from: 'ROUTING_DECISION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_DRIVER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'CLOSE' },
      ],
    },
  },

  // ─── 6. Route Deviation ─────────────────────────────────────────────
  {
    id: 'route-deviation',
    name: 'Route Deviation',
    description: 'Detects off-route vehicles — collect reason of deviation from driver, call Transporter if unresolved, and email Transporter & Nitin with trip details at L3.',
    category: 'Compliance',
    dsl: {
      name: 'Route Deviation',
      code: 'route_deviation',
      description: 'Escalation workflow for handling route deviation incidents',
      metadata: {
        category: 'compliance',
        trigger_type: 'ROUTE_DEVIATION',
        priority: 'HIGH',
        tags: ['route_deviation', 'deviation', 'compliance', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            {
              level: 1,
              level_key: 'L1',
              condition: { variable: 'duration_minutes', operator: '<', value: 60 },
              priority: 'MEDIUM',
              description: 'L1 — Collect reason of route deviation. Call driver 3 times in 1 hour.',
            },
            {
              level: 2,
              level_key: 'L2',
              condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] },
              priority: 'HIGH',
              description: 'L2 — If driver reachable OR no info → Call Transporter 2 times in next 1 hour.',
            },
            {
              level: 3,
              level_key: 'L3',
              condition: { variable: 'duration_minutes', operator: '>=', value: 120 },
              priority: 'CRITICAL',
              description: 'L3 — If Transporter not reachable OR no info → Email Transporter and Nitin with trip details.',
            },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Route Deviation', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER',
          display_name: 'Confirm Deviation Reason with Driver',
          step_type: 'SUB_PROCESS',
          execution_mode: 'SEQUENTIAL',
          steps: [
            {
              step_key: 'INITIATE_DRIVER_CALL',
              display_name: 'Place Call to Driver',
              step_type: 'SERVICE_TASK',
              task_type: 'DRIVER_CALL',
              mandatory_input: {
                callee_number: { type: 'string', required: true, description: 'driver_mobile' },
                callee_name: { type: 'string', required: true, description: 'driver_name' },
              },
              boundary_events: [
                {
                  event_type: 'TIMER',
                  event_key: 'CALL_TIMEOUT',
                  timer_value: 'PT20M',
                  interrupting: true,
                  on_timeout_transition_to: 'MANAGER_INTERVENTION',
                },
              ],
            },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Capture Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review Deviation Reason', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is Deviation Resolved?', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'MANAGER_INTERVENTION',
          display_name: 'Escalate — Call Transporter / Email Transporter & Nitin',
          step_type: 'USER_TASK',
          form: { form_version: 'FRV-route-deviation-escalation', render_engine: 'RJSF' },
        },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'ROUTING_DECISION' },
        {
          from: 'ROUTING_DECISION',
          to: 'CALL_DRIVER',
          condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] },
        },
        { from: 'ROUTING_DECISION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_DRIVER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'CLOSE' },
      ],
    },
  },

  // ─── 7. Driver Change ───────────────────────────────────────────────
  {
    id: 'driver-change',
    name: 'Driver Change',
    description: 'Handles in-transit driver changes — capture new driver number and location details, update the trip and obtain consent, escalate to Transporter or MHD if driver unreachable.',
    category: 'Operations',
    dsl: {
      name: 'Driver Change',
      code: 'driver_change',
      description: 'Escalation workflow for in-transit driver change incidents',
      metadata: {
        category: 'operations',
        trigger_type: 'ALL',
        priority: 'HIGH',
        tags: ['driver_change', 'transit', 'operations', 'escalation'],
        force_close_supported: true,
        escalation_policy: {
          type: 'TIME_BASED',
          levels: [
            {
              level: 1,
              level_key: 'L1',
              condition: { variable: 'duration_minutes', operator: '<', value: 60 },
              priority: 'MEDIUM',
              description: 'L1 — For driver changes identified in transit: get new number from driver, update trip immediately, attempt consent on new driver number. Capture Area, Place, City, State, DateTime of driver change.',
            },
            {
              level: 2,
              level_key: 'L2',
              condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] },
              priority: 'HIGH',
              description: 'L2 — If driver reachable OR no info → Call Transporters 2 times in next 1 hour.',
            },
            {
              level: 3,
              level_key: 'L3',
              condition: { variable: 'duration_minutes', operator: '>=', value: 120 },
              priority: 'CRITICAL',
              description: 'L3 — If Transporter not reachable OR no info → Call MHD 2 times in next 1 hour, drop email.',
            },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Assess Driver Change Situation', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        {
          step_key: 'CAPTURE_DRIVER_CHANGE_DETAILS',
          display_name: 'Capture Driver Change Details',
          step_type: 'USER_TASK',
          form: {
            form_version: 'FRV-driver-change-details',
            render_engine: 'RJSF',
          },
          config: {
            fields: ['area', 'place', 'city', 'state', 'datetime_of_change', 'new_driver_number', 'new_driver_name'],
          },
        },
        { step_key: 'ROUTING_DECISION', display_name: 'Determine Next Action', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER',
          display_name: 'Reach Out to New Driver for Consent',
          step_type: 'SUB_PROCESS',
          execution_mode: 'SEQUENTIAL',
          steps: [
            {
              step_key: 'INITIATE_DRIVER_CALL',
              display_name: 'Place Call to New Driver',
              step_type: 'SERVICE_TASK',
              task_type: 'DRIVER_CALL',
              mandatory_input: {
                callee_number: { type: 'string', required: true, description: 'new_driver_mobile' },
                callee_name: { type: 'string', required: true, description: 'new_driver_name' },
              },
              boundary_events: [
                {
                  event_type: 'TIMER',
                  event_key: 'CALL_TIMEOUT',
                  timer_value: 'PT30M',
                  interrupting: true,
                  on_timeout_transition_to: 'MANAGER_INTERVENTION',
                },
              ],
            },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Capture New Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Review New Driver Response', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Determine Resolution Path', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Is Driver Change Handled?', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'MANAGER_INTERVENTION',
          display_name: 'Escalate — Call Transporter / Call MHD & Drop Email',
          step_type: 'USER_TASK',
          form: { form_version: 'FRV-driver-change-escalation', render_engine: 'RJSF' },
        },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'INITIAL_ANALYSIS' },
        { from: 'INITIAL_ANALYSIS', to: 'CAPTURE_DRIVER_CHANGE_DETAILS' },
        { from: 'CAPTURE_DRIVER_CHANGE_DETAILS', to: 'ROUTING_DECISION' },
        {
          from: 'ROUTING_DECISION',
          to: 'CALL_DRIVER',
          condition: { variable: 'duration_minutes', operator: '<', value: 60, logic: 'AND', conditions: [{ variable: 'auto_resolved', operator: '==', value: false }] },
        },
        { from: 'ROUTING_DECISION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'ROUTING_DECISION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'CALL_DRIVER', to: 'CHECK_RESOLUTION' },
        { from: 'CHECK_RESOLUTION', to: 'CLOSE', condition: { variable: 'auto_resolved', operator: '==', value: true } },
        { from: 'CHECK_RESOLUTION', to: 'MANAGER_INTERVENTION', default: true },
        { from: 'MANAGER_INTERVENTION', to: 'CLOSE' },
      ],
    },
  },
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}
