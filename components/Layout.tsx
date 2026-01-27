
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, UserPlus, History, LogOut, Map, BarChart3, Sun, Moon, Tag, RotateCcw, Menu, X
} from 'lucide-react';
import { User, Role, useStore } from '../store.tsx';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const { isDarkMode, toggleDarkMode, resetToSeedData, branches } = useStore();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  const isAdmin = user.role === Role.ADMIN;
  const isManager = user.role === Role.MANAGER;
  
  // تعريف القوائم بناءً على الصلاحيات الصارمة
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={22} />, label: 'لوحة التحكم', allowed: true },
    { to: '/beneficiaries', icon: <Users size={22} />, label: 'سجل المستفيدين', allowed: true },
    
    { to: '/reports', icon: <BarChart3 size={22} />, label: 'التقارير والإحصائيات', allowed: isAdmin || isManager },
    { to: '/regions', icon: <Map size={22} />, label: 'المناطق الجغرافية', allowed: isAdmin || isManager },
    
    { to: '/branches', icon: <Building2 size={22} />, label: 'إدارة الفروع', allowed: isAdmin },
    { to: '/users', icon: <UserPlus size={22} />, label: 'شؤون الموظفين', allowed: isAdmin },
    { to: '/statuses', icon: <Tag size={22} />, label: 'تصنيفات الحالات', allowed: isAdmin },
    
    { to: '/logs', icon: <History size={22} />, label: 'سجل العمليات', allowed: isAdmin || isManager },
  ];

  const branchName = branches.find(b => b.id === user.branchId)?.name || user.branchId;

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-950 transition-colors duration-300`}>
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-100 dark:border-gray-800
        ${isSidebarOpen ? 'translate-x-0 w-72' : 'translate-x-full w-0 lg:translate-x-0 lg:w-72'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 flex items-center gap-4 border-b border-gray-50 dark:border-gray-800/50">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/30 shrink-0">
              ش
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-black text-sm text-gray-800 dark:text-white truncate">الجمعية الشرعية</span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider truncate">فرع النزلة</span>
            </div>
            <button className="lg:hidden mr-auto text-gray-400" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
            {navItems.filter(item => item.allowed).map((item) => (
              <NavLink
                key={item.to} to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium'
                  }`
                }
              >
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10 text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {isAdmin && (
               <button
                onClick={resetToSeedData}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/10 transition-colors text-xs font-bold"
              >
                <RotateCcw size={18} />
                <span>إعادة تعيين النظام</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold text-sm"
            >
              <LogOut size={20} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:mr-72' : ''}`}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-20 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl lg:hidden">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`}></div>
               <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                 {isAdmin ? 'الإدارة المركزية' : `فرع: ${branchName}`}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleDarkMode} 
              className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="flex items-center gap-3 pl-2">
              <div className="text-left hidden md:block">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 leading-none mb-1">{user.name}</p>
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center font-black shadow-inner">
                {user.name[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
          {children}
        </main>

      </div>
    </div>
  );
};
