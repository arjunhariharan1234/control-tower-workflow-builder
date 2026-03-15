import { WorkflowTemplate } from '@/types/workflow';

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'long-stoppage',
    name: 'Long Stoppage',
    description: 'Escalation workflow for long stoppage cases with driver contact subprocess, timer-based escalation, and manager intervention.',
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
          levels: [
            { level: 1, condition: { variable: 'duration_minutes', operator: '<', value: 60 }, priority: 'MEDIUM', description: 'Level 1 - Escalation' },
            { level: 2, condition: { variable: 'duration_minutes', operator: '>=', value: 60, logic: 'AND', conditions: [{ variable: 'duration_minutes', operator: '<', value: 120 }] }, priority: 'HIGH', description: 'Level 2 - Escalation' },
            { level: 3, condition: { variable: 'duration_minutes', operator: '>=', value: 240 }, priority: 'CRITICAL', description: 'Level 3 - Escalation' },
          ],
        },
      },
      steps: [
        { step_key: 'START', display_name: 'Start Workflow', step_type: 'START_EVENT' },
        { step_key: 'INITIAL_ANALYSIS', display_name: 'Perform Initial Stoppage Analysis', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'ROUTING_DECISION', display_name: 'Routing Decision', step_type: 'EXCLUSIVE_GATEWAY' },
        {
          step_key: 'CALL_DRIVER', display_name: 'Contact Driver', step_type: 'SUB_PROCESS',
          steps: [
            { step_key: 'INITIATE_DRIVER_CALL', display_name: 'Initiate Driver Call', step_type: 'SERVICE_TASK', task_type: 'DRIVER_CALL', mandatory_input: { callee_number: { type: 'string', required: true, description: 'driver_mobile' }, callee_name: { type: 'string', required: true, description: 'driver_name' } }, boundary_events: [{ event_type: 'TIMER', event_key: 'CALL_TIMEOUT', timer_value: 'PT20M', interrupting: true, on_timeout_transition_to: 'MANAGER_INTERVENTION' }] },
            { step_key: 'DRIVER_CALL_RESPONSE', display_name: 'Process Driver Response', step_type: 'SERVICE_TASK', task_type: 'AGENTIC_CALL_RESPONSE' },
            { step_key: 'ANALYSE_CALL_RESPONSE', display_name: 'Analyse Driver Response', step_type: 'SERVICE_TASK', task_type: 'ANALYSE' },
            { step_key: 'CALL_RESPONSE_ANALYSIS', display_name: 'Driver Response Analysis', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
          ],
          transitions: [
            { from: 'INITIATE_DRIVER_CALL', to: 'DRIVER_CALL_RESPONSE' },
            { from: 'DRIVER_CALL_RESPONSE', to: 'ANALYSE_CALL_RESPONSE' },
            { from: 'ANALYSE_CALL_RESPONSE', to: 'CALL_RESPONSE_ANALYSIS' },
          ],
        },
        { step_key: 'CHECK_RESOLUTION', display_name: 'Check Resolution Status', step_type: 'EXCLUSIVE_GATEWAY' },
        { step_key: 'MANAGER_INTERVENTION', display_name: 'Manager Escalation Intervention', step_type: 'USER_TASK' },
        { step_key: 'CLOSE', display_name: 'Normal Close', step_type: 'END_EVENT' },
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
  {
    id: 'transit-delay',
    name: 'Transit Delay',
    description: 'Handles transit delay alerts with automated monitoring, driver notification, and customer communication escalation.',
    category: 'Operations',
    dsl: {
      name: 'Transit Delay',
      code: 'transit_delay',
      description: 'Workflow for handling transit delay incidents',
      metadata: { category: 'operations', trigger_type: 'TRANSIT_DELAY', priority: 'MEDIUM', tags: ['transit', 'delay', 'operations'] },
      steps: [
        { step_key: 'START', display_name: 'Start', step_type: 'START_EVENT' },
        { step_key: 'ANALYSE_DELAY', display_name: 'Analyse Delay', step_type: 'SERVICE_TASK', task_type: 'ANALYSIS' },
        { step_key: 'DELAY_SEVERITY_CHECK', display_name: 'Delay Severity Check', step_type: 'EXCLUSIVE_GATEWAY' },
        { step_key: 'NOTIFY_DRIVER', display_name: 'Notify Driver', step_type: 'SERVICE_TASK', task_type: 'NOTIFICATION' },
        { step_key: 'ESCALATE_TO_OPS', display_name: 'Escalate to Operations', step_type: 'USER_TASK' },
        { step_key: 'UPDATE_ETA', display_name: 'Update ETA', step_type: 'SERVICE_TASK', task_type: 'ETA_UPDATE' },
        { step_key: 'END', display_name: 'End', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'ANALYSE_DELAY' },
        { from: 'ANALYSE_DELAY', to: 'DELAY_SEVERITY_CHECK' },
        { from: 'DELAY_SEVERITY_CHECK', to: 'NOTIFY_DRIVER', condition: { variable: 'delay_minutes', operator: '<', value: 30 } },
        { from: 'DELAY_SEVERITY_CHECK', to: 'ESCALATE_TO_OPS', default: true },
        { from: 'NOTIFY_DRIVER', to: 'UPDATE_ETA' },
        { from: 'ESCALATE_TO_OPS', to: 'UPDATE_ETA' },
        { from: 'UPDATE_ETA', to: 'END' },
      ],
    },
  },
  {
    id: 'route-deviation',
    name: 'Route Deviation',
    description: 'Detects and handles route deviation events with geofence analysis, driver verification, and compliance logging.',
    category: 'Compliance',
    dsl: {
      name: 'Route Deviation',
      code: 'route_deviation',
      description: 'Workflow for handling route deviation incidents',
      metadata: { category: 'compliance', trigger_type: 'ROUTE_DEVIATION', priority: 'HIGH', tags: ['route', 'deviation', 'compliance', 'geofence'] },
      steps: [
        { step_key: 'START', display_name: 'Start', step_type: 'START_EVENT' },
        { step_key: 'DETECT_DEVIATION', display_name: 'Detect Deviation', step_type: 'SERVICE_TASK', task_type: 'GEOFENCE_CHECK' },
        { step_key: 'SEVERITY_GATEWAY', display_name: 'Severity Check', step_type: 'EXCLUSIVE_GATEWAY' },
        { step_key: 'VERIFY_WITH_DRIVER', display_name: 'Verify with Driver', step_type: 'SERVICE_TASK', task_type: 'DRIVER_CALL' },
        { step_key: 'LOG_COMPLIANCE', display_name: 'Log Compliance Event', step_type: 'SERVICE_TASK', task_type: 'COMPLIANCE_LOG' },
        { step_key: 'MANAGER_REVIEW', display_name: 'Manager Review', step_type: 'USER_TASK' },
        { step_key: 'END', display_name: 'End', step_type: 'END_EVENT' },
      ],
      transitions: [
        { from: 'START', to: 'DETECT_DEVIATION' },
        { from: 'DETECT_DEVIATION', to: 'SEVERITY_GATEWAY' },
        { from: 'SEVERITY_GATEWAY', to: 'VERIFY_WITH_DRIVER', condition: { variable: 'deviation_km', operator: '<', value: 5 } },
        { from: 'SEVERITY_GATEWAY', to: 'MANAGER_REVIEW', default: true },
        { from: 'VERIFY_WITH_DRIVER', to: 'LOG_COMPLIANCE' },
        { from: 'MANAGER_REVIEW', to: 'LOG_COMPLIANCE' },
        { from: 'LOG_COMPLIANCE', to: 'END' },
      ],
    },
  },
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}
