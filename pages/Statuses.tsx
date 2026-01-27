import React, { useState } from 'react';
import { useStore, User, Role, BeneficiaryCategory } from '../CharityStore';
import { Plus, Edit3, Trash2, X, Tag } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Statuses: React.FC<{ user: User }> = ({ user }) => {
  const { categories, setCategories, addLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const isAdmin = user.role === Role.ADMIN;

  if (!isAdmin) {
    return (
      <div className="p-20 text-center text-gray-400">عذراً، هذه الصفحة متاحة لمدير النظام فقط.</div>
    );
  }

  const handleOpenModal = (id: string | null = null) => {
    if (id) {
      const c = categories.find(x => x.id === id);
      if (c) {
        setFormData({ name: c.name });
        setEditId(id);
      }
    } else {
      setFormData({ name: '' });
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    let updated: BeneficiaryCategory[];
    if (editId) {
      updated = categories.map(c => c.id === editId ? { ...c, ...formData } : c);
      addLog(user, 'تعديل', 'تصنيف حالة', editId);
    } else {
      const newId = 'cat_' + Math.random().toString(36).substring(2, 11);
      updated = [...categories, { ...formData, id: newId }];
      addLog(user, 'إضافة', 'تصنيف حالة', newId);
    }
    setCategories(updated);
    setIsModalOpen(false);
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      setCategories(categories.filter(c => c.id !== confirmModal.id));
      addLog(user, 'حذف', 'تصنيف حالة', confirmModal.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">تصنيفات الحالات</h1>
          <p className="text-gray-500 dark:text-gray-400">إدارة أنواع الحالات (فقير، يتيم، معاق، إلخ)</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition shadow-sm">
          <Plus size={18} /> إضافة تصنيف
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-indigo-300 transition">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Tag size={20} />
               </div>
               <span className="font-bold text-gray-700 dark:text-gray-200">{cat.name}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => handleOpenModal(cat.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit3 size={16} /></button>
              <button onClick={() => setConfirmModal({ isOpen: true, id: cat.id })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">{editId ? 'تعديل' : 'إضافة'} تصنيف</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 px-1">اسم التصنيف</label>
              <input 
                type="text" autoFocus
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm" 
                value={formData.name} onChange={e => setFormData({ name: e.target.value })} 
                placeholder="مثال: ذوي احتياجات خاصة"
              />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl font-bold text-gray-500 transition hover:bg-gray-50">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition">حفظ التصنيف</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="حذف التصنيف"
        message="هل أنت متأكد من حذف هذا التصنيف؟ لن يتم حذف المستفيدين المرتبطين به ولكن سيصبح تصنيفهم 'بدون'."
      />
    </div>
  );
};

export default Statuses;