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
  const { isDarkMode, toggleDarkMode, resetToSeedData, branches } = useStore();
  
  const isAdmin = user.role === Role.ADMIN;
  const isManager = user.role === Role.MANAGER;
  
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { to: '/beneficiaries', icon: <Users size={20} />, label: 'إدارة المستفيدين' },
    
    // يراها المدير العام ومدير الفرع
    ...(isAdmin || isManager ? [
      { to: '/regions', icon: <Map size={20} />, label: 'المناطق الجغرافية' },
      { to: '/reports', icon: <BarChart3 size={20} />, label: 'التقارير الإحصائية' },
    ] : []),
    
    // يراها المدير العام فقط
    ...(isAdmin ? [
      { to: '/statuses', icon: <Tag size={20} />, label: 'تصنيفات الحالات' },
      { to: '/branches', icon: <Building2 size={20} />, label: 'إدارة الفروع' },
      { to: '/users', icon: <UserPlus size={20} />, label: 'حسابات الموظفين' },
    ] : []),
    
    // سجل التعديلات للمدراء
    ...(isAdmin || isManager ? [
       { to: '/logs', icon: <History size={20} />, label: 'سجل العمليات' },
    ] : []),
  ];

  const branchName = branches.find(b => b.id === user.branchId)?.name || user.branchId;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 transition-colors duration-200">
        
        <aside className="w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-sm flex flex-col fixed inset-y-0 right-0 z-50 transition-colors duration-200">
          <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-600/30">ش</div>
            <div className="flex flex-col">
              <span className="font-black text-xs text-emerald-800 dark:text-emerald-400 leading-tight">الجمعية الشرعية</span>
              <span className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-tighter">بالنزلة</span>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-black shadow-xl shadow-emerald-600/30 -translate-x-1'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {isAdmin && (
               <button
                onClick={resetToSeedData}
                className="flex items-center gap-3 px-5 py-3 w-full rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all text-[11px] font-black"
              >
                <RotateCcw size={16} />
                <span>إعادة ضبط البيانات</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-5 py-4 w-full rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-black text-sm border border-transparent hover:border-red-100"
            >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 mr-72 flex flex-col">
          <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-10 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">{isAdmin ? 'الإدارة العامة' : `الفرع: ${branchName}`}</span>
            </div>
            
            <div className="flex items-center gap-8">
              <button onClick={toggleDarkMode} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div className="flex items-center gap-4 border-r border-gray-100 dark:border-gray-800 pr-8">
                <div className="text-right">
                  <p className="font-black text-xs text-gray-800 dark:text-gray-200 leading-none">{user.name}</p>
                  <p className="text-[10px] text-emerald-600 font-black mt-1.5 uppercase tracking-widest">{user.role}</p>
                </div>
                <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black border border-emerald-200 dark:border-emerald-800 shadow-sm">
                  {user.name[0]}
                </div>
              </div>
            </div>
          </header>

          <main className="p-10 max-w-[1400px] mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};