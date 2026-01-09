'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Send, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, userData, logout, isAdmin, isOperator } = useAuth();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: isAdmin ? '/dashboard-admin' : '/dashboard',
      show: true,
    },
    {
      label: 'Link de verificación',
      icon: Send,
      path: isOperator ? '/links-verificacion-admin' : '/links-verificacion',
      show: true,
    },
    {
      label: 'Gestión de Usuarios',
      icon: Users,
      path: '/add-user',
      show: isAdmin,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <aside className="w-[16vw] min-w-[200px] max-w-[280px] h-screen bg-[#F1F4F8] border-r border-[#E0E3E7] flex flex-col fixed left-0 top-0 z-50 py-6">
      {/* Logo */}
      <div className="px-4 pb-6 flex justify-center">
        <Image
          src="/ci_logo.png"
          alt="C-IKYC Logo"
          width={150}
          height={60}
          className="object-cover"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 flex flex-col gap-3">
        {menuItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-xl text-[14px] font-normal transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E0E3E7] text-[#212121]'
                    : 'bg-[#F1F4F8] text-[#212121] hover:bg-[#E0E3E7]'
                }`}
              >
                <item.icon className="h-6 w-6 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Footer - User info */}
      <div className="px-4 pt-3 border-t border-[#E0E3E7]">
        <div className="flex flex-col gap-0.5 pl-2">
          <span className="text-[14px] font-medium text-[#212121]">
            Usuario
          </span>
          <span className="text-[12px] text-[#57636C] break-all">
            {currentUser?.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 p-2 text-[#434447] hover:text-[#212121] transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
