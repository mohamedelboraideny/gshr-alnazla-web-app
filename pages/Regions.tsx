import React, { useState, useMemo } from 'react';
import { useStore, Region, Role, User } from '../store.tsx';
import { Plus, Edit3, Trash2, Map, X, Search } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Regions: React.FC<{ user: User }> = ({ user }) => {
  const { regions, setRegions, branches, addLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', branchId: user.branchId });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Confirm State
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

  const openDeleteConfirm = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      const updated = regions.filter(r => r.id !== confirmModal.id);
      setRegions(updated);
      addLog(user, 'حذف', 'منطقة', confirmModal.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة المناطق</h1>
          <p className="text-gray-500">تقسيم الفرع إلى مناطق سكنية صغيرة لتسهيل الوصول</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-emerald-700 shadow-sm transition">
          <Plus size={18} /> إضافة منطقة
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن منطقة..." 
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">اسم المنطقة</th>
                {isAdmin && <th className="px-6 py-4">الفرع</th>}
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRegions.map(reg => (
                <tr key={reg.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-bold text-gray-700 flex items-center gap-2">
                    <Map size={16} className="text-emerald-500" />
                    {reg.name}
                  </td>
                  {isAdmin && <td className="px-6 py-4 text-sm text-gray-500">{branches.find(b => b.id === reg.branchId)?.name}</td>}
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(reg.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Edit3 size={16} /></button>
                    <button onClick={() => openDeleteConfirm(reg.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filteredRegions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 3 : 2} className="px-6 py-10 text-center text-gray-400">لا توجد مناطق مسجلة بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editId ? 'تعديل' : 'إضافة'} منطقة</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنطقة</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
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