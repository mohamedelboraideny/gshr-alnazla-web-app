import React from 'react';
import { useStore, Role, User, BeneficiaryType } from '../store.tsx';
import { Users, Building2, UserPlus, History, Tag, ShieldAlert, Plus, Edit3, Trash2, ArrowLeftRight } from 'lucide-react';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const { branches, users, beneficiaries, logs, categories } = useStore();

  const isAdmin = user.role === Role.ADMIN;
  
  const visibleBeneficiaries = isAdmin 
    ? beneficiaries 
    : beneficiaries.filter(b => b.branchId === user.branchId);

  const familiesCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD).length;
  const individualCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL).length;

  const stats = [
    { label: 'إجمالي المستفيدين', value: visibleBeneficiaries.length, icon: <Users size={20} />, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { label: 'إجمالي الأسر', value: familiesCount, icon: <Tag size={20} />, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    ...(isAdmin ? [
      { label: 'عدد الفروع', value: branches.length, icon: <Building2 size={20} />, color: 'bg-purple-500', shadow: 'shadow-purple-500/20' },
      { label: 'عدد الموظفين', value: users.length, icon: <UserPlus size={20} />, color: 'bg-orange-500', shadow: 'shadow-orange-500/20' },
    ] : []),
    { label: 'أفراد مستقلين', value: individualCount, icon: <Users size={20} />, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
  ];

  const getLogIcon = (action: string) => {
    if (action.includes('إضافة')) return <Plus size={14} className="text-emerald-500" />;
    if (action.includes('تعديل')) return <Edit3 size={14} className="text-blue-500" />;
    if (action.includes('حذف')) return <Trash2 size={14} className="text-red-500" />;
    return <ArrowLeftRight size={14} className="text-gray-500" />;
  };

  const getLogBg = (action: string) => {
    if (action.includes('إضافة')) return 'bg-emerald-50 dark:bg-emerald-900/10';
    if (action.includes('تعديل')) return 'bg-blue-50 dark:bg-blue-900/10';
    if (action.includes('حذف')) return 'bg-red-50 dark:bg-red-900/10';
    return 'bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">نظرة عامة</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">مرحباً بك مجدداً، {user.name}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
           الفرع: {branches.find(b => b.id === user.branchId)?.name || 'عام'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 transition-all hover:scale-[1.02] hover:shadow-lg ${stat.shadow}`}>
            <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              سجل النشاط الحديث
            </h3>
          </div>
          <div className="p-6">
            <div className="relative border-r-2 border-gray-100 dark:border-gray-700 pr-6 space-y-8">
              {logs.slice(0, 5).map((log, idx) => (
                <div key={log.id} className="relative">
                  <div className={`absolute -right-[33px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 ${getLogBg(log.action).replace('bg-', 'bg-').split(' ')[0]}`}></div>
                  <div className={`p-4 rounded-2xl border border-gray-100 dark:border-gray-700 ${getLogBg(log.action)}`}>
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            {getLogIcon(log.action)}
                          </span>
                          <span className="text-xs font-black text-gray-800 dark:text-gray-100">{log.action}</span>
                       </div>
                       <span className="text-[10px] text-gray-400 font-bold">{new Date(log.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400">
                       بواسطة الموظف <span className="font-bold text-gray-800 dark:text-gray-200">{log.userName}</span> 
                       على <span className="font-bold px-1.5 py-0.5 bg-white/50 dark:bg-gray-700 rounded-md mx-1">{log.entityType}</span>
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-20 pr-0">
                   <ShieldAlert size={48} className="mx-auto text-gray-200 mb-4" />
                   <p className="text-gray-400 font-bold">لا توجد عمليات مسجلة حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
          <h3 className="font-bold text-gray-800 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-4">إحصائيات الحالات</h3>
          <div className="space-y-5">
             {categories.map(cat => {
               const count = visibleBeneficiaries.filter(b => b.categoryId === cat.id).length;
               const percentage = visibleBeneficiaries.length > 0 ? (count / visibleBeneficiaries.length) * 100 : 0;
               return (
                 <div key={cat.id} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                       <span className="text-emerald-600">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
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