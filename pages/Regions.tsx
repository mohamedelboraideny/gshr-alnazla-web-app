import React, { useState, useMemo } from 'react';
import { useStore, Region, Role, User } from '../store.tsx';
import { Plus, Edit3, Trash2, Map, X, Search, Building2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Regions: React.FC<{ user: User }> = ({ user }) => {
  const { regions, setRegions, branches, addLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', branchId: user.branchId });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const isAdmin = user.role === Role.ADMIN;

  const filteredRegions = useMemo(() => {
    return regions.filter(r => {
      const isOwner = isAdmin || r.branchId === user.branchId;
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      return isOwner && matchesSearch;
    });
  }, [regions, searchTerm, user.branchId, isAdmin]);

  const handleOpenModal = (id: string | null = null) => {
    if (id) {
      const r = regions.find(x => x.id === id);
      if (r) {
        setFormData({ name: r.name, branchId: r.branchId });
        setEditId(id);
      }
    } else {
      setFormData({ name: '', branchId: user.branchId });
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return alert('الاسم مطلوب');
    if (!formData.branchId) return alert('يجب اختيار الفرع');
    
    let updated: Region[] = [];
    if (editId) {
      updated = regions.map(r => r.id === editId ? { ...r, ...formData } : r);
      addLog(user, 'تعديل', 'منطقة', editId);
    } else {
      const newId = 'reg_' + Math.random().toString(36).substring(2, 11);
      updated = [...regions, { ...formData, id: newId }];
      addLog(user, 'إضافة', 'منطقة', newId);
    }
    setRegions(updated);
    setIsModalOpen(false);
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      setRegions(regions.filter(r => r.id !== confirmModal.id));
      addLog(user, 'حذف', 'منطقة', confirmModal.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة المناطق</h1>
          <p className="text-gray-500 dark:text-gray-400">تقسيم النطاق الجغرافي لتنظيم عمليات التوزيع والزيارات</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-emerald-700 shadow-sm transition">
          <Plus size={18} /> إضافة منطقة جديدة
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن منطقة..." 
              className="w-full pr-10 pl-4 py-2 bg-white dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">اسم المنطقة</th>
                <th className="px-6 py-4">الفرع التابع له</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRegions.map(reg => (
                <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Map size={16} className="text-emerald-500" />
                    {reg.name}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                       <Building2 size={12} className="text-gray-300" />
                       {branches.find(b => b.id === reg.branchId)?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(reg.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, id: reg.id })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredRegions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">لا توجد مناطق مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">{editId ? 'تعديل' : 'إضافة'} منطقة</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 px-1">اسم المنطقة</label>
                <input 
                  type="text" autoFocus
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none text-sm" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 px-1">الفرع المسؤول</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm" 
                    value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl font-bold text-gray-500 transition hover:bg-gray-50">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">حفظ المنطقة</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="حذف المنطقة"
        message="هل أنت متأكد من حذف هذه المنطقة؟ سيتم إزالة ارتباط المستفيدين بها."
      />
    </div>
  );
};

export default Regions;