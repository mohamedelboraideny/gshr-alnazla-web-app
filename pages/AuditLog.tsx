import React from 'react';
// Fix: Explicitly import from store.tsx to avoid ambiguity with store.ts
import { useStore } from '../store.tsx';
import { History } from 'lucide-react';

const AuditLog: React.FC = () => {
  const { logs } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">سجل التعديلات</h1>
        <p className="text-gray-500">سجل تاريخي لكل العمليات التي تمت على النظام</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">العملية</th>
                <th className="px-6 py-4">نوع الكيان</th>
                <th className="px-6 py-4">معرف الكيان</th>
                <th className="px-6 py-4">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-bold text-gray-700">{log.userName}</td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-600 font-semibold">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.entityType}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{log.entityId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
              <History size={48} className="opacity-20" />
              <span>لا توجد سجلات بعد</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;