'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserX, UserCheck } from 'lucide-react';
import { getUsers, deleteUser, signUpUser, toggleUserStatus } from '@/services/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';
import { ROLE_OPTIONS } from '@/types';

export default function AddUserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersList = await getUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
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
    if (!password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!role) {
      setError('Seleccione un rol');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await signUpUser(email, password, name, role);
      setSuccess('Usuario creado exitosamente');
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('already registered')) {
        setError('Ya existe un usuario con este email');
      } else {
        setError('Error al crear el usuario. Intente nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUser = async (user: User) => {
    const newStatus = !user.is_active;
    const action = newStatus ? 'habilitar' : 'deshabilitar';

    if (!window.confirm(`¿Está seguro de ${action} a ${user.name || user.email}?`)) {
      return;
    }

    setTogglingId(user.id);
    try {
      await toggleUserStatus(user.id, user.email, newStatus);
      setSuccess(`Usuario ${newStatus ? 'habilitado' : 'deshabilitado'} exitosamente`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      setError(`Error al ${action} el usuario`);
    } finally {
      setTogglingId(null);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('');
  };

  const getRoleLabel = (roleValue: string) => {
    const option = ROLE_OPTIONS.find((r) => r.value === roleValue);
    return option ? option.label : roleValue;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Gestión de Usuarios
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea y administra los usuarios del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Form section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-primary" />
              <CardTitle>Crear Nuevo Usuario</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500 rounded-lg text-emerald-600 text-sm">
                  {success}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users list section */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Usuarios del Sistema</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {users.filter((u) => u.is_active).length} activos
              </Badge>
              {users.filter((u) => !u.is_active).length > 0 && (
                <Badge variant="destructive">
                  {users.filter((u) => !u.is_active).length} deshabilitados
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-8 w-8 border-3 border-muted border-t-primary rounded-full animate-spin" />
                <span className="text-muted-foreground">
                  Cargando usuarios...
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      user.is_active
                        ? 'bg-muted/50 hover:bg-muted'
                        : 'bg-destructive/5 border border-destructive/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full text-white flex items-center justify-center text-base font-semibold ${
                          user.is_active
                            ? 'bg-gradient-to-br from-primary to-primary/60'
                            : 'bg-muted-foreground/50'
                        }`}
                      >
                        {(user.name || user.email || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              user.is_active ? 'text-foreground' : 'text-muted-foreground line-through'
                            }`}
                          >
                            {user.name || 'Sin nombre'}
                          </span>
                          {!user.is_active && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Deshabilitado
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                        <span className="text-xs text-primary font-medium">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleUser(user)}
                      disabled={togglingId === user.id}
                      title={user.is_active ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                      className={
                        user.is_active
                          ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                          : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                      }
                    >
                      {togglingId === user.id ? (
                        <div className="h-4 w-4 border-2 border-muted border-t-current rounded-full animate-spin" />
                      ) : user.is_active ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
