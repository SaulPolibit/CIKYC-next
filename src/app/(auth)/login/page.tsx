'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);

  // Check localStorage for existing user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('cikyc_user');
    if (storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        const userIsAdmin = user.role === '2' || user.role === '3';
        router.push(userIsAdmin ? '/dashboard-admin' : '/dashboard');
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('cikyc_user');
        setCheckingStorage(false);
      }
    } else {
      setCheckingStorage(false);
    }
  }, [router]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingrese un email válido');
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);

      if (!user) {
        setError('Usuario no registrado en el sistema. Contacte al administrador.');
        setLoading(false);
        return;
      }

      // Store user in localStorage
      localStorage.setItem('cikyc_user', JSON.stringify(user));

      const userIsAdmin = user.role === '2' || user.role === '3';
      router.push(userIsAdmin ? '/dashboard-admin' : '/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      console.error('Login error stringified:', JSON.stringify(err));
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log('Error message extracted:', errorMessage);

      if (errorMessage.includes('Invalid login')) {
        setError('Credenciales inválidas');
      } else if (errorMessage.includes('Email not confirmed')) {
        setError('Email no confirmado');
      } else {
        setError(`Error: ${errorMessage || 'Error desconocido'}`);
      }
      setLoading(false);
    }
  };

  // Show loading while checking localStorage
  if (checkingStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-3 border-[#E0E3E7] border-t-[#39D2C0] rounded-full animate-spin" />
          <span className="text-[#434447]">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8 py-8">
        <div className="w-full max-w-[370px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 mt-[50px]">
          <Image
            src="/ci_logo.png"
            alt="C-IKYC Logo"
            width={220}
            height={100}
            className="object-cover rounded-lg"
            priority
          />
        </div>

        {/* Form container */}
        <div className="w-full px-8 text-center">
          {/* Title - displaySmall: 36px, w600 */}
          <h2 className="text-[36px] font-semibold text-[#212121] mb-3">
            Bienvenido
          </h2>
          {/* Subtitle - labelMedium: 14px */}
          <p className="text-[14px] font-normal text-[#434447] mb-6">
            Ingresa tus datos
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {error && (
              <div className="p-3 bg-[#FF5963]/10 border border-[#FF5963] rounded-xl text-[#FF5963] text-sm text-center">
                {error}
              </div>
            )}

            {/* Email input */}
            <div className="text-left">
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[50px] px-5 text-[14px] text-[#212121] placeholder:text-[#57636C] bg-[#F1F4F8] border-0 rounded-xl outline-none transition-colors focus:ring-2 focus:ring-[#434447]"
              />
            </div>

            {/* Password input */}
            <div className="text-left">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[50px] px-5 pr-12 text-[14px] text-[#212121] placeholder:text-[#57636C] bg-[#F1F4F8] border-0 rounded-xl outline-none transition-colors focus:ring-2 focus:ring-[#434447]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#57636C]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit button - 44px height, #434447 bg, 12px radius, elevation 3 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] bg-[#434447] hover:bg-[#333538] text-white text-[16px] font-semibold rounded-xl shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            {/* Forgot password link */}
            <div className="flex justify-center mt-3">
              <Link href="/password-recovery" className="text-[16px] text-[#212121]">
                <span>¿Olvidaste tu contraseña? </span>
                <span className="font-semibold text-[#434447] hover:text-[#212121]">
                  Recupérala dando click aquí
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
      </div>
      {/* Orange accent line at bottom */}
      <div className="h-1 bg-[#EE8B60] w-full" />
    </div>
  );
}
