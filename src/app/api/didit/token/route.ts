import { NextResponse } from 'next/server';

// DIDit V2 uses API Key authentication - no token exchange needed
// This endpoint just returns the API key for session creation
export async function POST() {
  const apiKey = process.env.NEXT_PUBLIC_DIDIT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  // Return the API key as the "token" for compatibility with existing code
  return NextResponse.json({ token: apiKey });
}
