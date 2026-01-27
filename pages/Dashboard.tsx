import React from 'react';
// Fix: Explicitly import from store.tsx to avoid ambiguity with store.ts
import { useStore, Role, User } from '../store.tsx';
import { Users, Building2, UserPlus, History } from 'lucide-react';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const { branches, users, beneficiaries, families, logs, isDarkMode } = useStore();

  const isAdmin = user.role === Role.ADMIN;
  
  // Filter counts based on permissions
  const visibleBeneficiaries = isAdmin 
    ? beneficiaries 
    : beneficiaries.filter(b => b.branchId === user.branchId);

  const stats = [
    { label: 'إجمالي المستفيدين', value: visibleBeneficiaries.length, icon: <Users />, color: 'bg-blue-500' },
    { label: 'إجمالي الأسر', value: families.length, icon: <Users />, color: 'bg-emerald-500' },
    ...(isAdmin ? [
      { label: 'عدد الفروع', value: branches.length, icon: <Building2 />, color: 'bg-purple-500' },
      { label: 'عدد المستخدمين', value: users.length, icon: <UserPlus />, color: 'bg-orange-500' },
    ] : []),
    { label: 'عمليات السجل', value: logs.length, icon: <History />, color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">لوحة التحكم</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">نظرة عامة على البيانات الحالية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5">
            <div className={`p-4 rounded-lg text-white ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <h3 className="text-lg font-bold mb-4 dark:text-white">نشاط النظام الأخير</h3>
        <div className="space-y-4">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm border-r-4 border-emerald-500">
              <div className="dark:text-gray-200">
                <span className="font-bold">{log.userName}</span> قام بـ {log.action} ({log.entityType})
              </div>
              <div className="text-gray-400 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString('ar-EG')}
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-center text-gray-400 py-10">لا توجد سجلات بعد</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;