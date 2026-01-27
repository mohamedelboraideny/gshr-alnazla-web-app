import React, { useState } from 'react';
import { useStore, User, Role } from '../store.tsx';
import { UserPlus, Edit3, Trash2, X, RotateCcw, ShieldCheck, KeyRound } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Users: React.FC<{ user: User }> = ({ user: currentUser }) => {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '123', role: Role.STAFF, branchId: '' });
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null; mode: 'delete' | 'reset' }>({
    isOpen: false, id: null, mode: 'delete'
  });

  const handleOpenModal = (id: string | null = null) => {
    if (id) {
      const u = store.users.find(x => x.id === id);
      if (u) {
        setFormData({ name: u.name, username: u.username, password: '123', role: u.role, branchId: u.branchId });
        setEditId(id);
      }
    } else {
      setFormData({ name: '', username: '', password: '123', role: Role.STAFF, branchId: store.branches[0]?.id || '' });
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    let newUsers = [...store.users];
    if (editId) {
      newUsers = newUsers.map(u => u.id === editId ? { ...u, ...formData } : u);
      store.addLog(currentUser, 'تعديل مستخدم', 'مستخدم', editId);
    } else {
      const newId = 'u' + (store.users.length + 1);
      // New users always start with first login flag
      newUsers.push({ ...formData, id: newId, isFirstLogin: true });
      store.addLog(currentUser, 'إضافة مستخدم جديد', 'مستخدم', newId);
    }
    store.saveUsers(newUsers);
    setIsModalOpen(false);
  };

  const executeAction = () => {
    if (!confirmModal.id) return;
    if (confirmModal.mode === 'delete') {
      store.saveUsers(store.users.filter(u => u.id !== confirmModal.id));
      store.addLog(currentUser, 'حذف مستخدم', 'مستخدم', confirmModal.id);
    } else {
      // Reset password to 123 and force change
      store.saveUsers(store.users.map(u => 
        u.id === confirmModal.id ? { ...u, password: '123', isFirstLogin: true } : u
      ));
      store.addLog(currentUser, 'إعادة تعيين كلمة مرور', 'مستخدم', confirmModal.id);
      alert('تمت إعادة كلمة المرور إلى 123 بنجاح');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة الموظفين</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">إدارة حسابات {Role.MANAGER} و {Role.STAFF} عبر كافة الفروع</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl hover:bg-emerald-700 transition shadow-sm font-bold"
        >
          <UserPlus size={18} />
          <span>إضافة حساب جديد</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">الاسم والمستخدم</th>
                <th className="px-6 py-4">الدور الوظيفي</th>
                <th className="px-6 py-4">الفرع التابع له</th>
                <th className="px-6 py-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {store.users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 font-bold">{u.name[0]}</div>
                        <div>
                           <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{u.name}</p>
                           <p className="text-[10px] text-gray-400">@{u.username}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      u.role === Role.MANAGER ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    {store.branches.find(b => b.id === u.branchId)?.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, id: u.id, mode: 'reset' })} 
                      title="إعادة تعيين كلمة المرور"
                      className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button onClick={() => handleOpenModal(u.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, id: u.id, mode: 'delete' })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">{editId ? 'تعديل حساب' : 'إضافة مستخدم جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 px-1">الاسم الكامل</label>
                <input type="text" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 px-1">اسم المستخدم (للدخول)</label>
                <input type="text" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 px-1">الدور الوظيفي</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}>
                    <option value={Role.ADMIN}>{Role.ADMIN}</option>
                    <option value={Role.MANAGER}>{Role.MANAGER}</option>
                    <option value={Role.STAFF}>{Role.STAFF}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 px-1">الفرع التابع له</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                    {store.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              {!editId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[10px] text-blue-600 dark:text-blue-400 flex gap-2">
                   <KeyRound size={16} />
                   <span>سيتم إنشاء الحساب بكلمة مرور افتراضية (123) وسيطلب من المستخدم تغييرها عند أول دخول.</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">حفظ الحساب</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null, mode: 'delete' })}
        onConfirm={executeAction}
        title={confirmModal.mode === 'delete' ? 'حذف الحساب' : 'تصفير كلمة المرور'}
        message={confirmModal.mode === 'delete' ? "هل أنت متأكد من حذف هذا الحساب نهائياً؟" : "سيتم إعادة كلمة مرور الموظف إلى (123) وسيجبر على تغييرها عند الدخول القادم. هل أنت متأكد؟"}
      />
    </div>
  );
};

export default Users;