import { WorkflowTemplate } from '@/types/workflow';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ─── Long Stoppage ──────────────────────────────────────────────────
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

  // ─── Transit Delay ──────────────────────────────────────────────────
  {
    id: 'transit-delay',
    name: 'Transit Delay',
    description: 'Monitors delayed shipments in transit — assess impact, alert the driver or escalate to the ops desk, and revise ETA for all stakeholders.',
    category: 'Operations',
    dsl: {
      name: 'Transit Delay',
      code: 'transit_delay',
      description: 'Workflow for handling transit delay incidents',
      metadata: {
        category: 'operations',
        trigger_type: 'TRANSIT_DELAY',
        priority: 'MEDIUM',
        tags: ['transit', 'delay', 'operations', 'eta'],
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'ASSESS_DELAY', display_name: 'Assess Delay Impact', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'SEVERITY_CHECK', display_name: 'How Severe is the Delay?', step_type: 'EXCLUSIVE_GATEWAY' },
        { step_key: 'ALERT_DRIVER', display_name: 'Alert Driver About Delay', step_type: 'SERVICE_TASK', task_type: 'NOTIFICATION' },
        { step_key: 'ESCALATE_TO_OPS', display_name: 'Escalate to Ops Desk', step_type: 'USER_TASK' },
        { step_key: 'REVISE_ETA', display_name: 'Revise ETA & Notify Stakeholders', step_type: 'SERVICE_TASK', task_type: 'ETA_UPDATE' },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'ASSESS_DELAY' },
        { from: 'ASSESS_DELAY', to: 'SEVERITY_CHECK' },
        { from: 'SEVERITY_CHECK', to: 'ALERT_DRIVER', condition: { variable: 'delay_minutes', operator: '<', value: 30 } },
        { from: 'SEVERITY_CHECK', to: 'ESCALATE_TO_OPS', default: true },
        { from: 'ALERT_DRIVER', to: 'REVISE_ETA' },
        { from: 'ESCALATE_TO_OPS', to: 'REVISE_ETA' },
        { from: 'REVISE_ETA', to: 'CLOSE' },
      ],
    },
  },

  // ─── Route Deviation ────────────────────────────────────────────────
  {
    id: 'route-deviation',
    name: 'Route Deviation',
    description: 'Detects off-route vehicles — flag the deviation, confirm with the driver or escalate for manager review, and log a compliance record.',
    category: 'Compliance',
    dsl: {
      name: 'Route Deviation',
      code: 'route_deviation',
      description: 'Workflow for handling route deviation incidents',
      metadata: {
        category: 'compliance',
        trigger_type: 'ROUTE_DEVIATION',
        priority: 'HIGH',
        tags: ['route', 'deviation', 'compliance', 'geofence'],
      },
      steps: [
        { step_key: 'START', display_name: 'Alert Triggered', step_type: 'START_EVENT' },
        { step_key: 'FLAG_DEVIATION', display_name: 'Flag Route Deviation', step_type: 'SERVICE_TASK', task_type: 'GEOFENCE_CHECK' },
        { step_key: 'RISK_CHECK', display_name: 'Assess Deviation Risk', step_type: 'EXCLUSIVE_GATEWAY' },
        { step_key: 'CONFIRM_WITH_DRIVER', display_name: 'Confirm Reason with Driver', step_type: 'SERVICE_TASK', task_type: 'DRIVER_CALL' },
        { step_key: 'ESCALATE_TO_MANAGER', display_name: 'Escalate for Manager Review', step_type: 'USER_TASK' },
        { step_key: 'LOG_COMPLIANCE', display_name: 'Log Compliance Record', step_type: 'SERVICE_TASK', task_type: 'COMPLIANCE_LOG' },
        { step_key: 'CLOSE', display_name: 'Mark Resolved & Close', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'FLAG_DEVIATION' },
        { from: 'FLAG_DEVIATION', to: 'RISK_CHECK' },
        { from: 'RISK_CHECK', to: 'CONFIRM_WITH_DRIVER', condition: { variable: 'deviation_km', operator: '<', value: 5 } },
        { from: 'RISK_CHECK', to: 'ESCALATE_TO_MANAGER', default: true },
        { from: 'CONFIRM_WITH_DRIVER', to: 'LOG_COMPLIANCE' },
        { from: 'ESCALATE_TO_MANAGER', to: 'LOG_COMPLIANCE' },
        { from: 'LOG_COMPLIANCE', to: 'CLOSE' },
      ],
    },
  },
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}
