'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-3 border-[#E0E3E7] border-t-[#39D2C0] rounded-full animate-spin" />
          <span className="text-[#434447]">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      {/* Main content - margin-left matches sidebar width */}
      <main className="flex-1 ml-[max(16vw,200px)] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
