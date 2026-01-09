import { NextRequest, NextResponse } from 'next/server';

const DIDIT_WORKFLOW_ID = process.env.NEXT_PUBLIC_DIDIT_WORKFLOW_ID!;

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json(); // token is actually the API key

    console.log('Creating DIDit session with workflow:', DIDIT_WORKFLOW_ID);

    // DIDit V2 uses x-api-key header and verification.didit.me endpoint
    const response = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'x-api-key': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        vendor_data: 'c-ikyc-app',
      }),
    });

    const responseText = await response.text();
    console.log('DIDit session response status:', response.status);
    console.log('DIDit session response body:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create session', details: responseText },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    return NextResponse.json({
      url: data.url,
      sessionId: data.session_id,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
