import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const token = searchParams.get('token'); // This is the API key

    if (!sessionId || !token) {
      return NextResponse.json(
        { error: 'Missing sessionId or token' },
        { status: 400 }
      );
    }

    // DIDit generate-pdf endpoint (v1) https://docs.didit.me/reference/generate-pdf-verification-sessions
    const response = await fetch(`https://verification.didit.me/v1/session/${sessionId}/generate-pdf`, {
      headers: {
        'x-api-key': token,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DIDit report error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to download report', details: errorText },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="kyc-report-${sessionId}.pdf"`);

    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
