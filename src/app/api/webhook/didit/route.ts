import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role key for webhook (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Webhook secret for signature verification (optional but recommended)
const WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET;

interface DiditWebhookPayload {
  session_id: string;
  status: string;
  webhook_type: 'status.updated' | 'data.updated';
  timestamp: string;
  workflow_id: string;
  vendor_data?: string;
  metadata?: Record<string, unknown>;
  decision?: {
    result: string;
    details?: Record<string, unknown>;
  };
}

// Verify webhook signature using HMAC-SHA256
function verifySignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  if (!WEBHOOK_SECRET || !signature || !timestamp) {
    // If no secret configured, skip verification (not recommended for production)
    console.warn('Webhook signature verification skipped - no secret configured');
    return true;
  }

  // Check timestamp is within 5 minutes
  const webhookTime = new Date(timestamp).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (Math.abs(now - webhookTime) > fiveMinutes) {
    console.error('Webhook timestamp too old');
    return false;
  }

  // Generate HMAC
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature headers
    const signature = request.headers.get('X-Signature');
    const timestamp = request.headers.get('X-Timestamp');

    // Verify signature
    if (!verifySignature(rawBody, signature, timestamp)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the body
    const payload: DiditWebhookPayload = JSON.parse(rawBody);

    console.log('DIDit webhook received:', {
      session_id: payload.session_id,
      status: payload.status,
      webhook_type: payload.webhook_type,
    });

    const { session_id, status } = payload;

    if (!session_id || !status) {
      return NextResponse.json(
        { error: 'Missing session_id or status in request body' },
        { status: 400 }
      );
    }

    // Search for the document by kyc_id (session_id)
    const { data: users, error: queryError } = await supabase
      .from('verified_users')
      .select('id, kyc_status')
      .eq('kyc_id', session_id);

    if (queryError) {
      console.error('Error querying database:', queryError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('No record found for session_id:', session_id);
      return NextResponse.json(
        { error: 'No record found for this session_id' },
        { status: 404 }
      );
    }

    // Update the matching document
    const userRecord = users[0];
    const { error: updateError } = await supabase
      .from('verified_users')
      .update({ kyc_status: status })
      .eq('id', userRecord.id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    console.log(`KYC status updated for session ${session_id}: ${userRecord.kyc_status} -> ${status}`);

    return NextResponse.json({
      message: 'Updated successfully',
      session_id,
      status,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification (some services ping the endpoint)
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'DIDit webhook endpoint' });
}
