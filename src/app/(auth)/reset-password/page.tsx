'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid session from the recovery link
    const checkSession = async () => {
      try {
        // The hash fragment contains the access_token from Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken) {
          // Set the session using the access token
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) {
            console.error('Session error:', error);
            setError('El enlace de recuperación es inválido o ha expirado.');
            setValidToken(false);
          } else if (data.session) {
            setValidToken(true);
          }
        } else {
          // Check if user already has an active session from recovery
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setValidToken(true);
          } else {
            setError('No se encontró un enlace de recuperación válido.');
            setValidToken(false);
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Error al verificar el enlace de recuperación.');
        setValidToken(false);
      } finally {
        setCheckingToken(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);

      // Clear localStorage and sign out after password change, then redirect to login
      setTimeout(async () => {
        localStorage.removeItem('cikyc_user');
        await supabase.auth.signOut();
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      console.error('Error resetting password:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('same as the old password')) {
        setError('La nueva contraseña debe ser diferente a la anterior');
      } else {
        setError('Error al cambiar la contraseña. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="h-8 w-8 border-3 border-[#E0E3E7] border-t-[#434447] rounded-full animate-spin" />
        <span className="mt-4 text-[#57636C]">Verificando enlace...</span>
      </div>
    );
  }

  if (!validToken && !checkingToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-xl border-t-4 border-t-[#F9A826] border border-[#E0E3E7] p-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/ci_logo.png"
                alt="C-IKYC Logo"
                width={150}
                height={60}
                className="object-cover"
                priority
              />
            </div>
            <div className="text-center">
              <h2 className="text-[18px] font-semibold text-[#212121] mb-4">
                Enlace Inválido
              </h2>
              <p className="text-[14px] text-[#FF5963] mb-6">
                {error || 'El enlace de recuperación es inválido o ha expirado.'}
              </p>
              <Link
                href="/password-recovery"
                className="text-[14px] text-[#434447] hover:text-[#212121] underline"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-xl border-t-4 border-t-[#F9A826] border border-[#E0E3E7] p-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/ci_logo.png"
                alt="C-IKYC Logo"
                width={150}
                height={60}
                className="object-cover"
                priority
              />
            </div>
            <div className="text-center">
              <h2 className="text-[18px] font-semibold text-[#212121] mb-4">
                Contraseña Actualizada
              </h2>
              <p className="text-[14px] text-[#249689] mb-6">
                Su contraseña ha sido cambiada exitosamente. Redirigiendo al inicio de sesión...
              </p>
              <div className="flex justify-center">
                <div className="h-6 w-6 border-2 border-[#E0E3E7] border-t-[#434447] rounded-full animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-xl border-t-4 border-t-[#F9A826] border border-[#E0E3E7] p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/ci_logo.png"
              alt="C-IKYC Logo"
              width={150}
              height={60}
              className="object-cover"
              priority
            />
          </div>

          {/* Title */}
          <h2 className="text-[18px] font-semibold text-[#212121] text-center mb-2">
            Nueva Contraseña
          </h2>
          <p className="text-[14px] text-[#57636C] text-center mb-6">
            Ingrese su nueva contraseña
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[#FF5963]/10 border border-[#FF5963] rounded-lg text-[#FF5963] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full h-[50px] px-4 pr-12 text-[14px] text-[#212121] bg-white border border-[#E0E3E7] rounded-lg outline-none transition-colors focus:border-[#434447]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#57636C]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full h-[50px] px-4 pr-12 text-[14px] text-[#212121] bg-white border border-[#E0E3E7] rounded-lg outline-none transition-colors focus:border-[#434447]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#57636C]"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] bg-[#434447] hover:bg-[#333538] text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Contraseña'}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-[14px] text-[#434447] hover:text-[#212121]"
            >
              Regresar al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
