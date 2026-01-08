'use client';

import { useState } from 'react';
import { Link2, Send, Copy, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getToken, createSession, launchWhatsApp } from '@/services/api';
import { addVerifiedUser } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LinksVerificacionAdminPage() {
  const { currentUser, userData } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [error, setError] = useState('');
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

  const handleGenerateLink = async () => {
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get token
      const tokenResponse = await getToken();
      const token = tokenResponse.token;

      // Create session
      const sessionResponse = await createSession(token);
      const url = sessionResponse.url;
      const id = sessionResponse.sessionId;

      setVerificationUrl(url);

      // Save to database
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
    if (!verificationUrl || !phone) return;

    const message = `Hola ${name}, le enviamos el siguiente enlace para completar su verificación de identidad (KYC):\n\n${verificationUrl}\n\nPor favor complete el proceso lo antes posible.`;

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    launchWhatsApp(cleanPhone, message);
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
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Badge variant="secondary" className="mb-2 gap-1.5">
          <Shield className="h-4 w-4" />
          <span>Admin</span>
        </Badge>
        <h1 className="text-2xl font-semibold text-foreground">
          Generar Link de Verificación
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de administración para crear enlaces de verificación KYC
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6">
        {/* Form card */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Link2 className="h-6 w-6 text-primary" />
              <CardTitle>Datos del Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                disabled={!!verificationUrl}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (con código de país)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+52 1234567890"
                disabled={!!verificationUrl}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                disabled={!!verificationUrl}
              />
            </div>

            {!verificationUrl ? (
              <Button
                className="w-full"
                onClick={handleGenerateLink}
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar Enlace de Verificación'}
              </Button>
            ) : (
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                  <CheckCircle className="h-6 w-6" />
                  <span>Enlace generado exitosamente</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={verificationUrl}
                    readOnly
                    className="flex-1 bg-muted text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copiar enlace"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                    onClick={handleSendWhatsApp}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={resetForm}
                  >
                    Crear Nuevo Enlace
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions card */}
        <Card className="h-fit">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">
              Instrucciones para Administradores
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
              <li>
                Como administrador, puede generar enlaces de verificación para
                cualquier cliente.
              </li>
              <li>
                Ingrese los datos completos del cliente que necesita verificar
                su identidad.
              </li>
              <li>
                Haga clic en &quot;Generar Enlace de Verificación&quot; para
                crear un enlace único.
              </li>
              <li>
                Envíe el enlace al cliente por WhatsApp o copie el enlace para
                compartirlo.
              </li>
              <li>
                Los enlaces generados se registrarán bajo su cuenta de
                administrador.
              </li>
              <li>
                Puede ver todos los estados de verificación en el Panel de
                Administración.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
