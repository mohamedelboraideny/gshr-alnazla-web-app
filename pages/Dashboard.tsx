import React from 'react';
import { useStore, Role, User, BeneficiaryType } from '../CharityStore';
import { Users, Building2, UserPlus, History, Tag, ShieldAlert, Plus, Edit3, Trash2, CheckCircle2, TrendingUp } from 'lucide-react';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const { branches, users, beneficiaries, logs, categories } = useStore();

  const isAdmin = user.role === Role.ADMIN;
  
  // فلترة البيانات بدقة حسب الصلاحية
  const visibleBeneficiaries = isAdmin 
    ? beneficiaries 
    : beneficiaries.filter(b => b.branchId === user.branchId);

  const familiesCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD).length;
  const individualCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL).length;
  const membersCount = visibleBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_MEMBER).length;

  const stats = [
    { label: 'إجمالي المستفيدين', value: visibleBeneficiaries.length, icon: <Users size={24} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'عدد الأسر', value: familiesCount, icon: <Building2 size={24} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'أفراد مستقلين', value: individualCount, icon: <UserPlus size={24} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'أفراد تابعين', value: membersCount, icon: <Tag size={24} />, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  ];

  if (isAdmin) {
    stats.push(
      { label: 'عدد الفروع', value: branches.length, icon: <Building2 size={24} />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
      { label: 'موظفي النظام', value: users.length, icon: <Users size={24} />, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20' }
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
  };

  const getLogIcon = (action: string) => {
    if (action.includes('إضافة')) return <Plus size={14} className="text-white" />;
    if (action.includes('تعديل')) return <Edit3 size={14} className="text-white" />;
    if (action.includes('حذف')) return <Trash2 size={14} className="text-white" />;
    return <CheckCircle2 size={14} className="text-white" />;
  };

  const getLogColor = (action: string) => {
    if (action.includes('إضافة')) return 'bg-emerald-500 shadow-emerald-200';
    if (action.includes('تعديل')) return 'bg-blue-500 shadow-blue-200';
    if (action.includes('حذف')) return 'bg-red-500 shadow-red-200';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">لوحة التحكم</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
             نظرة عامة على أداء الجمعية وإحصائيات المستفيدين
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
           <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
             {isAdmin ? 'System Admin' : user.role}
           </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <span className="bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">إحصاء</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-3">
              <History className="text-emerald-500" />
              آخر العمليات
            </h3>
          </div>
          <div className="p-8 flex-1">
            <div className="space-y-8 relative before:absolute before:right-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="relative flex items-center gap-6 group">
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${getLogColor(log.action)}`}>
                    {getLogIcon(log.action)}
                  </div>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 dark:text-white text-sm">{log.action} <span className="text-emerald-600">{log.entityType}</span></span>
                      <span className="text-[10px] text-gray-400 font-mono">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      بواسطة: <span className="font-bold">{log.userName}</span>
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-10">
                   <ShieldAlert size={48} className="mx-auto text-gray-200 mb-2" />
                   <p className="text-gray-400 text-sm">لا توجد نشاطات مسجلة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col">
          <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-8 border-b border-gray-50 dark:border-gray-700 pb-4">تصنيفات الحالات</h3>
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
             {categories.map(cat => {
               const count = visibleBeneficiaries.filter(b => b.categoryIds?.includes(cat.id)).length;
               const percentage = visibleBeneficiaries.length > 0 ? (count / visibleBeneficiaries.length) * 100 : 0;
               return (
                 <div key={cat.id} className="group">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{cat.name}</span>
                       <span className="text-xs font-black text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg">{count}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 group-hover:bg-emerald-400 relative" style={{ width: `${percentage}%` }}>
                       </div>
                    </div>
                 </div>
               )
             })}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={20} />
                <span className="text-xs font-bold">يتم تحديث البيانات لحظياً</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;