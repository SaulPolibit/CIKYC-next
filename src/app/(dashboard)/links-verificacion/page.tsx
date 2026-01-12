'use client';

import { useState } from 'react';
import { CheckCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getToken, createSession, launchWhatsApp, sendVerificationEmail } from '@/services/api';
import { addVerifiedUser } from '@/services/database';

export default function LinksVerificacionPage() {
  const { currentUser, userData } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [error, setError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!phone.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    if (!email.trim()) {
      setError('El email es requerido');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Ingrese un email válido');
      return false;
    }
    return true;
  };

  const handleCreateLink = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const tokenResponse = await getToken();
      const token = tokenResponse.token;
      const sessionResponse = await createSession(token);
      const url = sessionResponse.url;
      const id = sessionResponse.sessionId;

      setVerificationUrl(url);

      await addVerifiedUser({
        name,
        phone,
        user_email: email,
        agent_email: currentUser?.email || '',
        agent_name: userData?.name || currentUser?.email || '',
        kyc_url: url,
        kyc_id: id,
        kyc_status: 'Not Started',
        downloaded: false,
      });
    } catch (error) {
      console.error('Error generating link:', error);
      setError('Error al generar el enlace. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!verificationUrl) return;
    const message = `Hola ${name}, le enviamos el siguiente enlace para completar su verificación de identidad (KYC):\n\n${verificationUrl}\n\nPor favor complete el proceso lo antes posible.`;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    launchWhatsApp(cleanPhone, message);
  };

  const handleSendEmail = async () => {
    if (!verificationUrl) return;
    setError('');

    setSendingEmail(true);
    try {
      await sendVerificationEmail(email, name, verificationUrl);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Error al enviar el correo. Verifique la configuración de email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyLink = async () => {
    if (!verificationUrl) return;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setVerificationUrl('');
    setError('');
    setEmailSent(false);
    setCopied(false);
  };

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-[28px] font-semibold text-[#212121] mb-6">
        Link de verificación
      </h1>

      {/* Section title */}
      <h2 className="text-[18px] font-semibold text-[#212121] mb-2">
        Información del Cliente
      </h2>

      {/* Description */}
      <p className="text-[14px] text-[#57636C] mb-8 max-w-[800px]">
        Para generar el link de verificación y enviarlo por correo es necesario ingresar los datos del cliente y posteriormente presionar el botón de crear link.
      </p>

      {error && (
        <div className="mb-6 p-3 bg-[#FF5963]/10 border border-[#FF5963] rounded-lg text-[#FF5963] text-sm max-w-[600px]">
          {error}
        </div>
      )}

      {verificationUrl && (
        <div className="mb-6 max-w-[600px]">
          <div className="flex items-center gap-2 text-[#249689] mb-3">
            <CheckCircle className="h-5 w-5" />
            <span className="text-[14px] font-medium">Enlace generado exitosamente</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={verificationUrl}
              readOnly
              className="flex-1 h-[44px] px-3 text-[12px] text-[#57636C] bg-[#F1F4F8] border border-[#E0E3E7] rounded-lg outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="h-[44px] px-4 bg-[#E0E3E7] hover:bg-[#D0D3D7] text-[#434447] text-[14px] font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex flex-col gap-6 max-w-[600px]">
        {/* Nombre Completo */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] text-[#57636C]">Nombre Completo:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!verificationUrl}
            className="w-full h-[44px] px-0 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447] disabled:opacity-60"
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] text-[#57636C]">Teléfono:</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!!verificationUrl}
            className="w-full h-[44px] px-0 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447] disabled:opacity-60"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="text-[14px] text-[#57636C]">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!verificationUrl}
            className="w-full h-[44px] px-0 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447] disabled:opacity-60"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          {!verificationUrl ? (
            <button
              onClick={handleCreateLink}
              disabled={loading}
              className="h-[44px] px-6 bg-[#434447] hover:bg-[#333538] text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Generando...' : 'Crear Link'}
            </button>
          ) : (
            <>
              <button
                onClick={handleSendWhatsApp}
                className="h-[44px] px-6 bg-[#434447] hover:bg-[#333538] text-white text-[14px] font-medium rounded-lg transition-colors"
              >
                Enviar por Whatsapp
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="h-[44px] px-6 bg-[#434447] hover:bg-[#333538] text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Enviando...' : emailSent ? 'Correo Enviado' : 'Enviar por Correo'}
              </button>
              <button
                onClick={resetForm}
                className="h-[44px] px-6 bg-[#E0E3E7] hover:bg-[#D0D3D7] text-[#434447] text-[14px] font-medium rounded-lg transition-colors"
              >
                Nuevo Enlace
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
