import type { TokenResponse, SessionResponse } from '@/types';

const DIDIT_API_URL = process.env.NEXT_PUBLIC_DIDIT_API_URL || 'https://apx.didit.me';
const DIDIT_CLIENT_ID = process.env.NEXT_PUBLIC_DIDIT_CLIENT_ID || '';
const DIDIT_CLIENT_SECRET = process.env.NEXT_PUBLIC_DIDIT_CLIENT_SECRET || '';

// Get authentication token from DIDit
export async function getToken(): Promise<TokenResponse> {
  const response = await fetch(`${DIDIT_API_URL}/auth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: DIDIT_CLIENT_ID,
      client_secret: DIDIT_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get token');
  }

  const data = await response.json();
  return { token: data.access_token };
}

// Create a verification session
export async function createSession(token: string): Promise<SessionResponse> {
  const response = await fetch(`${DIDIT_API_URL}/v1/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      callback: process.env.NEXT_PUBLIC_DIDIT_CALLBACK_URL || '',
      vendor_data: '',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create session');
  }

  const data = await response.json();
  return {
    url: data.url,
    sessionId: data.session_id,
  };
}

// Download PDF report
export async function downloadPDF(sessionId: string, token: string): Promise<void> {
  const response = await fetch(
    `${DIDIT_API_URL}/v1/session/${sessionId}/report/pdf`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kyc_report_${sessionId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Launch WhatsApp with message
export function launchWhatsApp(phone: string, message: string): void {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}
