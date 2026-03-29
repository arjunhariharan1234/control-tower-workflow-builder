import { NextRequest, NextResponse } from 'next/server';
import { listRecipients, createRecipient } from '@/lib/recipients-store';

export async function GET(request: NextRequest) {
  try {
    const groupType = request.nextUrl.searchParams.get('group_type') || undefined;
    const data = listRecipients(groupType);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_type, name, email_cc, email_to, sms, whatsapp, voice } = body;

    if (!group_type || !name) {
      return NextResponse.json({ error: 'group_type and name are required' }, { status: 400 });
    }

    const data = createRecipient({ group_type, name, email_cc, email_to, sms, whatsapp, voice });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
