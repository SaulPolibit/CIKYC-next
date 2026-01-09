import type { TokenResponse, SessionResponse } from '@/types';

// Get access token from DIDit (via API route)
export async function getToken(): Promise<TokenResponse> {
  const response = await fetch('/api/didit/token', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to get token');
  }

  return response.json();
}

// Create KYC session (via API route)
export async function createSession(token: string): Promise<SessionResponse> {
  const response = await fetch('/api/didit/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error('Failed to create session');
  }

  return response.json();
}

// Download PDF report (via API route)
export async function downloadPDF(sessionId: string, token: string): Promise<void> {
  const response = await fetch(`/api/didit/report?sessionId=${sessionId}&token=${token}`);

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kyc-report-${sessionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Launch WhatsApp with message
export function launchWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
}
