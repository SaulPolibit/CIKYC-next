'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
        <Card className="w-full max-w-[420px] p-10 shadow-lg">
          <CardContent className="p-0 text-center flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-emerald-600" />
            <h2 className="text-2xl font-semibold text-foreground">
              Correo Enviado
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Hemos enviado un enlace de recuperación a{' '}
              <strong>{email}</strong>. Por favor revisa tu bandeja de entrada.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Volver al Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
      <Card className="w-full max-w-[420px] p-10 shadow-lg">
        <CardContent className="p-0">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-muted-foreground text-sm font-medium mb-6 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Recuperar Contraseña
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
