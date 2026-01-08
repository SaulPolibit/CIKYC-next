'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Info, User, Download } from 'lucide-react';
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
      // Admin gets all users
      const users = await getAllVerifiedUsers(true, currentUser.email);
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map selected Spanish statuses to include English equivalents for filtering
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Title */}
      <div className="px-4 pt-4 pb-1">
        <h1 className="text-[32px] font-semibold text-[#212121]">
          Dashboard Admin
        </h1>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 flex justify-end items-center gap-2.5">
        <div className="relative w-[300px]">
          <input
            type="text"
            placeholder="Buscar ..."
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            className="w-full h-[44px] px-5 pr-12 text-[14px] text-[#212121] bg-white border-2 border-[#E0E3E7] rounded-xl outline-none transition-colors focus:border-[#212121]"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#434447] pointer-events-none" />
        </div>
        {searchString && (
          <button
            onClick={clearSearch}
            className="p-1 text-[#57636C]/50 hover:text-[#57636C]"
          >
            <X className="h-9 w-9" />
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="py-2 flex items-start">
        <button
          onClick={() => setShowInfoDialog(true)}
          title="Información de Estatus"
          className="p-2 text-[#57636C]/50 hover:text-[#57636C] rounded-lg"
        >
          <Info className="h-6 w-6" />
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
      <div className="px-4 pt-2.5 pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-8 w-8 border-3 border-[#E0E3E7] border-t-[#39D2C0] rounded-full animate-spin" />
            <span className="text-[#434447]">Cargando...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[#434447] text-[14px]">
            <span>No hay usuarios verificados</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white">
                <div className="flex items-center gap-2.5 pb-1">
                  <User className="h-6 w-6 text-[#212121]" />
                  <span className="text-[12px] font-bold text-[#212121] flex-1">
                    {user.name}
                  </span>
                  {user.kyc_id && (
                    <button
                      onClick={() => handleDownloadPDF(user)}
                      disabled={downloadingPDF === user.id}
                      title="Descargar PDF"
                      className="p-1.5 text-[#434447] hover:text-[#212121] hover:bg-[#E0E3E7] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="h-[18px] w-[18px]" />
                    </button>
                  )}
                </div>
                <div className="pl-[44px]">
                  <div className="flex py-1">
                    <span className="flex-1 text-[14px] font-normal text-[#212121] text-center">
                      {user.user_email}
                    </span>
                    <span className="flex-1 text-[14px] font-normal text-[#212121] text-center">
                      {user.phone}
                    </span>
                    <span className="flex-1 text-[14px] font-normal text-[#212121] text-center">
                      {formatDate(user.date_sent)}
                    </span>
                    <span className="flex-1 text-[14px] font-normal text-[#212121] text-center">
                      {getStatusDisplay(user.kyc_status)}
                    </span>
                  </div>
                  <div className="h-px bg-[#E0E3E7] mt-3 mb-3" />
                </div>
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
            <div className="text-[14px] text-[#434447] leading-7 mb-5">
              <p>
                <strong>Enviado:</strong> Link de Verificación enviado al
                cliente.
              </p>
              <p>
                <strong>En Progreso:</strong> Cliente ha iniciado el KYC.
              </p>
              <p>
                <strong>Aprobado:</strong> El Cliente terminó el KYC y fue
                aprobado.
              </p>
              <p>
                <strong>Declinado:</strong> El Cliente terminó el KYC pero fue
                declinado.
              </p>
              <p>
                <strong>En Revisión:</strong> El KYC del Cliente se encuentra en
                revisión.
              </p>
              <p>
                <strong>Expirado:</strong> El link enviado al Cliente ya expiró.
              </p>
              <p>
                <strong>Abandonado:</strong> El Cliente inició el KYC, no
                terminó el proceso y el link expiró.
              </p>
              <p>
                <strong>KYC Expirado:</strong> El Cliente pasó el KYC pero algún
                documento de identificación ya expiró.
              </p>
            </div>
            <button
              onClick={() => setShowInfoDialog(false)}
              className="float-right px-6 py-2.5 text-[14px] font-medium text-[#39D2C0] hover:text-[#249689] bg-transparent border-none cursor-pointer"
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
