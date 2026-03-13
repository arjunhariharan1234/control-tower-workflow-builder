import { NextRequest, NextResponse } from 'next/server';

const DEPLOY_URL = 'http://localhost:8086/ft-workflow-agents/api/process-definitions/from-dsl';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function deployWithRetry(payload: unknown, retries: number = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(DEPLOY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const response = await deployWithRetry(payload);
    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.message || 'Deployment failed', details: data },
        { status: response.status }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to connect to deployment server: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
