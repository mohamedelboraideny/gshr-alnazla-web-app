import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserPlus, 
  History, 
  LogOut, 
  UserCircle,
  Map,
  BarChart3
} from 'lucide-react';
// Fix: Explicitly import from store.tsx to avoid ambiguity with store.ts
import { User, Role } from '../store.tsx';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const isAdmin = user.role === Role.ADMIN;
  const isManager = user.role === Role.MANAGER;
  
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { to: '/beneficiaries', icon: <Users size={20} />, label: 'المستفيدين' },
    ...(isAdmin || isManager ? [
      { to: '/regions', icon: <Map size={20} />, label: 'المناطق' },
      { to: '/reports', icon: <BarChart3 size={20} />, label: 'التقارير الإحصائية' },
    ] : []),
    ...(isAdmin ? [
      { to: '/branches', icon: <Building2 size={20} />, label: 'الفروع' },
      { to: '/users', icon: <UserPlus size={20} />, label: 'المستخدمين' },
    ] : []),
    { to: '/logs', icon: <History size={20} />, label: 'سجل التعديلات' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 shadow-sm flex flex-col fixed inset-y-0 right-0 z-50">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            ج
          </div>
          <span className="font-bold text-lg text-emerald-800">نظام الجمعية</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 mr-64 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <h2 className="text-xl font-bold text-gray-700">الفرع: {user.branchId}</h2>
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-xs text-gray-500 uppercase">{user.role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <UserCircle size={28} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};