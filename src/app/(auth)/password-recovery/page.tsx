'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PasswordRecoveryPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingrese su correo electrónico');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un email válido');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setError('Error al enviar el correo de recuperación. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1F4F8]">
        {/* Back button */}
        <div className="p-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[#212121] text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Regresar</span>
          </Link>
        </div>

        {/* Card */}
        <div className="flex-1 flex items-start justify-center px-6">
          <div className="w-full max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Orange accent */}
            <div className="h-1 bg-[#EE8B60]" />

            <div className="p-8 text-center flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-[#249689]" />
              <h2 className="text-[24px] font-semibold text-[#212121]">
                Correo Enviado
              </h2>
              <p className="text-[14px] text-[#57636C] leading-relaxed mb-2">
                Hemos enviado un enlace de recuperación a{' '}
                <strong className="text-[#212121]">{email}</strong>. Por favor revisa tu bandeja de entrada.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full h-[50px] bg-[#434447] hover:bg-[#333538] text-white text-[16px] font-medium rounded-lg transition-colors"
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F4F8]">
      {/* Back button */}
      <div className="p-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[#212121] text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Regresar</span>
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-6">
        <div className="w-full max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Orange accent */}
          <div className="h-1 bg-[#EE8B60]" />

          <div className="p-8">
            <h2 className="text-[24px] font-semibold text-[#212121] mb-3">
              Recuperación de Contraseña
            </h2>
            <p className="text-[14px] text-[#57636C] leading-relaxed mb-6">
              Te enviaremos un correo con un link para recuperar tu contraseña, por favor
              ingresa a tu correo electrónico después de presionar enviar.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-3 bg-[#FF5963]/10 border border-[#FF5963] rounded-lg text-[#FF5963] text-sm text-center">
                  {error}
                </div>
              )}

              {/* Floating label input */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  className="peer w-full h-[56px] px-4 pt-5 pb-2 text-[14px] text-[#212121] bg-white border border-[#E0E3E7] rounded-lg outline-none transition-colors focus:border-[#434447] focus:ring-1 focus:ring-[#434447]"
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-2 text-[11px] text-[#57636C] font-medium transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[14px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px]"
                >
                  Escribe tu dirección de correo
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[50px] bg-[#434447] hover:bg-[#333538] text-white text-[16px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
