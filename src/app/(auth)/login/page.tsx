'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-8 py-8">
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
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="email" className="text-[14px] font-normal text-[#434447]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[44px] px-5 text-[14px] text-[#212121] bg-[#F1F4F8] border-2 border-[#F1F4F8] rounded-xl outline-none transition-colors focus:border-[#434447]"
              />
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="password" className="text-[14px] font-normal text-[#434447]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[44px] px-5 pr-12 text-[14px] text-[#212121] bg-[#F1F4F8] border-2 border-[#F1F4F8] rounded-xl outline-none transition-colors focus:border-[#434447]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#434447]"
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
  );
}
