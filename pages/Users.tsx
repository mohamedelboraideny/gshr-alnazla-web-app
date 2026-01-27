import React, { useState } from 'react';
import { useStore, User, Role } from '../store.tsx';
import { UserPlus, Edit3, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Users: React.FC<{ user: User }> = ({ user: currentUser }) => {
  const store = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '123', role: Role.STAFF, branchId: '' });
  
  // Custom Confirm State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
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
      newUsers.push({ ...formData, id: newId });
      store.addLog(currentUser, 'إضافة مستخدم', 'مستخدم', newId);
    }
    store.saveUsers(newUsers);
    setIsModalOpen(false);
  };

  const openDeleteConfirm = (id: string) => {
    if (id === currentUser.id) return alert('لا يمكنك حذف نفسك!');
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      const updated = store.users.filter(u => u.id !== confirmModal.id);
      store.saveUsers(updated);
      store.addLog(currentUser, 'حذف مستخدم', 'مستخدم', confirmModal.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">المستخدمين</h1>
          <p className="text-gray-500">إدارة صلاحيات الموظفين ومدراء الفروع</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm font-bold"
        >
          <UserPlus size={18} />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4">اسم المستخدم</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">الفرع</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {store.users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-bold">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' :
                      u.role === Role.MANAGER ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{store.branches.find(b => b.id === u.branchId)?.name || u.branchId}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(u.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Edit3 size={16} /></button>
                    <button onClick={() => openDeleteConfirm(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editId ? 'تعديل' : 'إضافة'} مستخدم</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الدور</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white outline-none" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}>
                  <option value={Role.ADMIN}>{Role.ADMIN}</option>
                  <option value={Role.MANAGER}>{Role.MANAGER}</option>
                  <option value={Role.STAFF}>{Role.STAFF}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الفرع</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white outline-none" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                  {store.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="حذف مستخدم"
        message="هل أنت متأكد من حذف هذا المستخدم من النظام؟ سيفقد صلاحية الدخول فوراً."
      />
    </div>
  );
};

export default Users;