'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, UserX, UserCheck } from 'lucide-react';
import { getUsers, signUpUser, toggleUserStatus } from '@/services/database';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setError('');
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

  return (
    <div className="p-6">
      {/* Title */}
      <h1 className="text-[28px] font-semibold text-[#212121] mb-8">
        Alta de Usuario
      </h1>

      {error && (
        <div className="mb-6 p-3 bg-[#FF5963]/10 border border-[#FF5963] rounded-lg text-[#FF5963] text-sm max-w-[800px]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-3 bg-[#249689]/10 border border-[#249689] rounded-lg text-[#249689] text-sm max-w-[800px]">
          {success}
        </div>
      )}

      {/* Create User Form */}
      <form onSubmit={handleSubmit} className="max-w-[800px]">
        <div className="flex flex-col gap-6">
          {/* Nombre */}
          <div className="flex items-center gap-4">
            <label className="w-[140px] text-[14px] text-[#212121] text-right shrink-0">
              Nombre:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-[44px] px-0 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447]"
            />
          </div>

          {/* Correo */}
          <div className="flex items-center gap-4">
            <label className="w-[140px] text-[14px] text-[#212121] text-right shrink-0">
              Correo:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-[44px] px-0 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447]"
            />
          </div>

          {/* Rol */}
          <div className="flex items-center gap-4">
            <label className="w-[140px] text-[14px] text-[#212121] text-right shrink-0">
              Rol:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-[200px] h-[44px] px-3 text-[14px] text-[#212121] bg-white border border-[#E0E3E7] rounded-lg outline-none transition-colors focus:border-[#434447]"
            >
              <option value="">Seleccione...</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contraseña */}
          <div className="flex items-center gap-4">
            <label className="w-[140px] text-[14px] text-[#212121] text-right shrink-0">
              Contraseña:
            </label>
            <div className="flex-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[44px] px-0 pr-10 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#57636C]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="flex items-center gap-4">
            <label className="w-[140px] text-[14px] text-[#212121] text-right shrink-0">
              Confirmar Contraseña:
            </label>
            <div className="flex-1 relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[44px] px-0 pr-10 text-[14px] text-[#212121] bg-transparent border-0 border-b border-[#E0E3E7] outline-none transition-colors focus:border-[#434447]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#57636C]"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="h-[44px] px-12 bg-[#434447] hover:bg-[#333538] text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </form>

      {/* Divider */}
      <div className="h-px bg-[#E0E3E7] my-10 max-w-[800px]" />

      {/* Users List */}
      <h2 className="text-[24px] font-semibold text-[#212121] mb-6 max-w-[800px]">
        Usuarios del Sistema
      </h2>

      <div className="max-w-[800px]">
        {/* Users count */}
        <div className="mb-4 flex gap-4 text-[14px] text-[#57636C]">
          <span>{users.filter(u => u.is_active).length} usuarios activos</span>
          <span>•</span>
          <span>{users.filter(u => !u.is_active).length} deshabilitados</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-8 w-8 border-3 border-[#E0E3E7] border-t-[#434447] rounded-full animate-spin" />
            <span className="text-[#57636C]">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[#57636C] text-[14px]">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  user.is_active
                    ? 'bg-white border-[#E0E3E7] hover:bg-[#F1F4F8]'
                    : 'bg-[#FF5963]/5 border-[#FF5963]/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full text-white flex items-center justify-center text-base font-semibold ${
                      user.is_active
                        ? 'bg-[#434447]'
                        : 'bg-[#57636C]/50'
                    }`}
                  >
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[14px] font-medium ${
                          user.is_active ? 'text-[#212121]' : 'text-[#57636C] line-through'
                        }`}
                      >
                        {user.name || 'Sin nombre'}
                      </span>
                      {!user.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#FF5963] text-white rounded">
                          Deshabilitado
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#57636C]">
                      {user.email}
                    </span>
                    <span className="text-[12px] text-[#434447] font-medium">
                      {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleUser(user)}
                  disabled={togglingId === user.id}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                    user.is_active
                      ? 'text-[#FF5963] hover:bg-[#FF5963]/10'
                      : 'text-[#249689] hover:bg-[#249689]/10'
                  }`}
                  title={user.is_active ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                >
                  {togglingId === user.id ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : user.is_active ? (
                    <UserX className="h-5 w-5" />
                  ) : (
                    <UserCheck className="h-5 w-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
