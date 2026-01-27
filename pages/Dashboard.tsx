import React from 'react';
import { useStore, Role, User, BeneficiaryType } from '../store.tsx';
import { Users, Building2, UserPlus, History, Tag, ShieldAlert, Plus, Edit3, Trash2, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const { branches, users, beneficiaries, logs, categories } = useStore();

  const isAdmin = user.role === Role.ADMIN;
  const isManager = user.role === Role.MANAGER;
  
  const visibleBeneficiaries = isAdmin 
    ? beneficiaries 
    : beneficiaries.filter(b => b.branchId === user.branchId);

  const familiesCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD).length;
  const individualCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL).length;

  const stats = [
    { label: 'إجمالي المستفيدين', value: visibleBeneficiaries.length, icon: <Users size={20} />, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { label: 'إجمالي الأسر', value: familiesCount, icon: <Tag size={20} />, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    ...(isAdmin ? [
      { label: 'فروع الجمعية', value: branches.length, icon: <Building2 size={20} />, color: 'bg-purple-500', shadow: 'shadow-purple-500/20' },
      { label: 'موظفي النظام', value: users.length, icon: <UserPlus size={20} />, color: 'bg-orange-500', shadow: 'shadow-orange-500/20' },
    ] : []),
    { label: 'أفراد مستقلين', value: individualCount, icon: <Users size={20} />, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getLogIcon = (action: string) => {
    if (action.includes('إضافة')) return <Plus size={14} className="text-white" />;
    if (action.includes('تعديل')) return <Edit3 size={14} className="text-white" />;
    if (action.includes('حذف')) return <Trash2 size={14} className="text-white" />;
    return <CheckCircle2 size={14} className="text-white" />;
  };

  const getLogColor = (action: string) => {
    if (action.includes('إضافة')) return 'bg-emerald-500';
    if (action.includes('تعديل')) return 'bg-blue-500';
    if (action.includes('حذف')) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">لوحة التحكم</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 font-bold flex items-center gap-2">
             مرحباً بك في نظام إدارة المستفيدين، <span className="text-emerald-600 dark:text-emerald-400 font-black">{user.name}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-[1.25rem] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
             {isAdmin ? 'الإدارة العامة للنظام' : `فرع: ${branches.find(b => b.id === user.branchId)?.name}`}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-emerald-200 dark:hover:border-emerald-900/50`}>
            <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center shrink-0 ${stat.color} shadow-lg shadow-gray-200 dark:shadow-none`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">{stat.label}</p>
              <p className="text-4xl font-black text-gray-800 dark:text-white leading-none tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
            <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-3 text-lg">
              <History size={22} className="text-emerald-600" />
              آخر النشاطات المسجلة
            </h3>
          </div>
          <div className="p-8">
            <div className="relative border-r-2 border-gray-100 dark:border-gray-700 pr-8 space-y-10">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="relative group">
                  <div className={`absolute -right-[43px] top-0 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${getLogColor(log.action)}`}>
                    {getLogIcon(log.action)}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-black text-gray-800 dark:text-gray-100">{log.action}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">{log.entityType}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        بواسطة: <span className="font-black text-gray-700 dark:text-gray-200">{log.userName}</span>
                      </p>
                    </div>
                    <div className="text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 whitespace-nowrap">
                       {new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                       <span className="mx-3 opacity-20">|</span>
                       {formatDate(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-8 space-y-10">
          <h3 className="font-black text-gray-800 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-6 text-lg">توزيع حالات المستفيدين</h3>
          <div className="space-y-8">
             {categories.map(cat => {
               const count = visibleBeneficiaries.filter(b => b.categoryId === cat.id).length;
               const percentage = visibleBeneficiaries.length > 0 ? (count / visibleBeneficiaries.length) * 100 : 0;
               return (
                 <div key={cat.id} className="space-y-3">
                    <div className="flex justify-between items-end">
                       <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{cat.name}</span>
                       <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{count}</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                       <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${percentage}%` }}></div>
                    </div>
                 </div>
               )
             })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;