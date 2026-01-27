import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, UserPlus, History, LogOut, UserCircle, Map, BarChart3, Sun, Moon, Tag, RotateCcw
} from 'lucide-react';
import { User, Role, useStore } from '../store.tsx';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const { isDarkMode, toggleDarkMode, resetToSeedData } = useStore();
  
  // التحقق الدقيق من الأدوار بناءً على Enums
  const isAdmin = user.role === Role.ADMIN;
  const isManager = user.role === Role.MANAGER;
  
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { to: '/beneficiaries', icon: <Users size={20} />, label: 'المستفيدين' },
    
    // يراها المدير العام ومدير الفرع
    ...(isAdmin || isManager ? [
      { to: '/regions', icon: <Map size={20} />, label: 'المناطق' },
      { to: '/reports', icon: <BarChart3 size={20} />, label: 'التقارير الإحصائية' },
    ] : []),
    
    // يراها المدير العام فقط
    ...(isAdmin ? [
      { to: '/statuses', icon: <Tag size={20} />, label: 'تصنيفات الحالات' },
      { to: '/branches', icon: <Building2 size={20} />, label: 'الفروع' },
      { to: '/users', icon: <UserPlus size={20} />, label: 'الموظفين' },
    ] : []),
    
    // سجل التعديلات للمدراء
    ...(isAdmin || isManager ? [
       { to: '/logs', icon: <History size={20} />, label: 'سجل التعديلات' },
    ] : []),
  ];

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-200">
        
        <aside className="w-64 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-sm flex flex-col fixed inset-y-0 right-0 z-50 transition-colors duration-200">
          <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/20">ج</div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-emerald-800 dark:text-emerald-400 leading-none">نظام الجمعية</span>
              <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Charity Portal</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {isAdmin && (
               <button
                onClick={resetToSeedData}
                title="إعادة ضبط كافة البيانات للمصنع"
                className="flex items-center gap-3 px-4 py-2 w-full rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-bold"
              >
                <RotateCcw size={16} />
                <span>إعادة ضبط البيانات</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-sm"
            >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 mr-64 flex flex-col">
          <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-8 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2">
               <Building2 size={16} className="text-emerald-600" />
               <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">الفرع: {user.branchId}</span>
            </div>
            
            <div className="flex items-center gap-6">
              <button onClick={toggleDarkMode} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-all">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <div className="flex items-center gap-3 border-r border-gray-100 dark:border-gray-800 pr-6">
                <div className="text-left text-right">
                  <p className="font-bold text-xs dark:text-gray-200 leading-none">{user.name}</p>
                  <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">{user.role}</p>
                </div>
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold border border-emerald-200 dark:border-emerald-800">
                  {user.name[0]}
                </div>
              </div>
            </div>
          </header>

          <main className="p-8 max-w-7xl mx-auto w-full transition-all">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};