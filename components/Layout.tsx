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
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
// Fix: Explicitly import from store.tsx to avoid ambiguity with store.ts
import { User, Role, useStore } from '../store.tsx';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const { isDarkMode, toggleDarkMode } = useStore();
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
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-sm flex flex-col fixed inset-y-0 right-0 z-50 transition-colors duration-200">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              ج
            </div>
            <span className="font-bold text-lg text-emerald-800 dark:text-emerald-400">نظام الجمعية</span>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 mr-64 flex flex-col">
          {/* Top Header */}
          <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">الفرع: {user.branchId}</h2>
            <div className="flex items-center gap-6">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                title={isDarkMode ? "الوضع المضيء" : "الوضع المظلم"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-semibold text-sm dark:text-gray-200">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{user.role}</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <UserCircle size={28} />
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};