import React from 'react';
import { useStore, Role, User } from '../store.tsx';
import { History, ShieldAlert } from 'lucide-react';

const AuditLog: React.FC<{ user: User }> = ({ user }) => {
  const { logs } = useStore();
  
  const canAccess = user.role === Role.ADMIN || user.role === Role.MANAGER;

  if (!canAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">عذراً، الوصول مرفوض</h2>
        <p className="text-gray-500 max-w-sm">سجل التعديلات متاح فقط لمدراء النظام ومسؤولي الفروع لدواعي أمنية وحماية البيانات.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">سجل التعديلات</h1>
        <p className="text-gray-500 dark:text-gray-400">مراقبة كافة العمليات التي تمت على قاعدة البيانات</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">الموظف المسؤول</th>
                <th className="px-6 py-4">نوع العملية</th>
                <th className="px-6 py-4">الكيان المتأثر</th>
                <th className="px-6 py-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">{log.userName}</p>
                    <p className="text-[10px] text-gray-400">ID: {log.userId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{log.entityType}</p>
                     <p className="text-[10px] font-mono text-gray-300">ID: {log.entityId}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-20 text-center text-gray-300 flex flex-col items-center gap-3">
              <History size={64} className="opacity-10" />
              <span className="font-bold">لا توجد عمليات مسجلة حالياً</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;