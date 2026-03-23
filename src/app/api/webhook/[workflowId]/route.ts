import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  const workflowId = params.workflowId;

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    // No JSON body is fine for webhooks
  }

  // In a production system, this would:
  // 1. Look up the workflow by ID
  // 2. Validate the webhook secret
  // 3. Queue the workflow execution
  // 4. Return a run ID for tracking

  const runId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    success: true,
    run_id: runId,
    workflow_id: workflowId,
    triggered_at: timestamp,
    trigger_type: 'webhook',
    payload_received: Object.keys(payload).length > 0,
    message: `Workflow ${workflowId} triggered via webhook`,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  // GET webhooks — useful for health checks or simple triggers
  const workflowId = params.workflowId;
  const searchParams = request.nextUrl.searchParams;
  const payload = Object.fromEntries(searchParams.entries());

  const runId = crypto.randomUUID();

  return NextResponse.json({
    success: true,
    run_id: runId,
    workflow_id: workflowId,
    triggered_at: new Date().toISOString(),
    trigger_type: 'webhook',
    method: 'GET',
    params_received: Object.keys(payload).length,
    message: `Workflow ${workflowId} triggered via GET webhook`,
  });
}
