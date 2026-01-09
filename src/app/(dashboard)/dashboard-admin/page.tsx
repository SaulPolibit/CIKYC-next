'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Info, User, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllVerifiedUsers, filterVerifiedUsers } from '@/services/database';
import { getToken, downloadPDF } from '@/services/api';
import { ChoiceChips } from '@/components/choice-chips';
import type { VerifiedUser, KYCStatusSpanish } from '@/types';
import { KYC_STATUS_OPTIONS, statusMap, statusReverseMap } from '@/types';

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

const getStatusDisplay = (status: string | null) => {
  if (!status) return 'Enviado';
  return statusMap[status as keyof typeof statusMap] || status;
};

export default function DashboardAdminPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchString, setSearchString] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!currentUser?.email) return;

    setLoading(true);
    try {
      const users = await getAllVerifiedUsers(true, currentUser.email);
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const mappedStatuses = useMemo(() => {
    return selectedStatuses.flatMap(
      (status) => statusReverseMap[status as KYCStatusSpanish] || [status]
    );
  }, [selectedStatuses]);

  const filteredUsers = useMemo(() => {
    return filterVerifiedUsers(allUsers, mappedStatuses, searchString);
  }, [allUsers, mappedStatuses, searchString]);

  const clearSearch = () => {
    setSearchString('');
  };

  const handleDownloadPDF = async (user: VerifiedUser) => {
    if (!user.kyc_id) return;

    setDownloadingPDF(user.id);
    try {
      const tokenResponse = await getToken();
      await downloadPDF(user.kyc_id, tokenResponse.token);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF. Intente nuevamente.');
    } finally {
      setDownloadingPDF(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[28px] font-semibold text-[#212121]">
          Dashboard
        </h1>
        <button
          onClick={() => router.push('/add-user')}
          className="h-[40px] px-5 bg-[#434447] hover:bg-[#333538] text-white text-[14px] font-medium rounded-lg transition-colors"
        >
          Administrar usuarios
        </button>
      </div>

      {/* Search bar */}
      <div className="flex justify-end items-center gap-2 mb-4">
        <div className="relative w-[280px]">
          <input
            type="text"
            placeholder="Buscar ..."
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            className="w-full h-[40px] px-4 pr-10 text-[14px] text-[#212121] bg-white border border-[#E0E3E7] rounded-lg outline-none transition-colors focus:border-[#434447]"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#57636C]" />
        </div>
        {searchString && (
          <button
            onClick={clearSearch}
            className="p-1 text-[#57636C] hover:text-[#212121]"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex items-start gap-2 mb-4">
        <button
          onClick={() => setShowInfoDialog(true)}
          title="Información de Estatus"
          className="p-1 text-[#57636C] hover:text-[#212121]"
        >
          <Info className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <ChoiceChips
            options={KYC_STATUS_OPTIONS}
            selected={selectedStatuses}
            onChange={setSelectedStatuses}
            multiple
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-8 w-8 border-3 border-[#E0E3E7] border-t-[#434447] rounded-full animate-spin" />
            <span className="text-[#57636C]">Cargando...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[#57636C] text-[14px]">
            No hay usuarios verificados
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredUsers.map((user) => (
              <div key={user.id} className="py-2">
                {/* Header row with client and agent */}
                <div className="flex items-center gap-6 mb-1">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#212121]" />
                    <span className="text-[12px] font-semibold text-[#212121]">Cliente:</span>
                    <span className="text-[12px] text-[#212121]">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#434447]" />
                    <span className="text-[12px] font-semibold text-[#57636C]">Asesor:</span>
                    <span className="text-[12px] text-[#212121]">{user.agent_email}</span>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex items-center pl-7">
                  <span className="flex-1 text-[14px] text-[#212121]">
                    {user.user_email}
                  </span>
                  <span className="flex-1 text-[14px] text-[#212121]">
                    {user.phone}
                  </span>
                  <span className="flex-1 text-[14px] text-[#212121]">
                    {formatDate(user.date_sent)}
                  </span>
                  <span className="flex-1 text-[14px] text-[#212121]">
                    {getStatusDisplay(user.kyc_status)}
                  </span>
                  <div className="flex items-center gap-2">
                    {user.kyc_id && user.kyc_status === 'Approved' && (
                      <button
                        onClick={() => handleDownloadPDF(user)}
                        disabled={downloadingPDF === user.id}
                        className="flex items-center gap-1 text-[12px] text-[#57636C] hover:text-[#212121] disabled:opacity-50"
                      >
                        <span>PDF</span>
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      className="p-1 text-[#57636C] hover:text-[#FF5963]"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#E0E3E7] mt-3" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Dialog */}
      {showInfoDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowInfoDialog(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-[500px] w-[90%] max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-semibold text-[#212121] mb-4">
              Información de Estatus
            </h3>
            <div className="text-[14px] text-[#57636C] leading-7 mb-5">
              <p><strong className="text-[#212121]">Enviado:</strong> Link de Verificación enviado al cliente.</p>
              <p><strong className="text-[#212121]">En Progreso:</strong> Cliente ha iniciado el KYC.</p>
              <p><strong className="text-[#212121]">Aprobado:</strong> El Cliente terminó el KYC y fue aprobado.</p>
              <p><strong className="text-[#212121]">Declinado:</strong> El Cliente terminó el KYC pero fue declinado.</p>
              <p><strong className="text-[#212121]">En Revisión:</strong> El KYC del Cliente se encuentra en revisión.</p>
              <p><strong className="text-[#212121]">Expirado:</strong> El link enviado al Cliente ya expiró.</p>
              <p><strong className="text-[#212121]">Abandonado:</strong> El Cliente inició el KYC, no terminó el proceso y el link expiró.</p>
              <p><strong className="text-[#212121]">KYC Expirado:</strong> El Cliente pasó el KYC pero algún documento de identificación ya expiró.</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInfoDialog(false)}
                className="px-6 py-2 text-[14px] font-medium text-[#434447] hover:text-[#212121]"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
