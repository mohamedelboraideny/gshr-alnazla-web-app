import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, User, Branch } from '../store.tsx';
import { Plus, Edit3, Trash2, MapPin, X, ChevronLeft } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Branches: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { branches, setBranches, addLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '' });
  
  // State for Custom Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const handleOpenModal = (id: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id) {
      const b = branches.find(x => x.id === id);
      if (b) { 
        setFormData({ name: b.name, location: b.location }); 
        setEditId(id); 
      }
    } else {
      setFormData({ name: '', location: '' }); 
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return alert('الاسم مطلوب');
    
    let updated: Branch[] = [];
    if (editId) {
      updated = branches.map(b => b.id === editId ? { ...b, ...formData } : b);
      addLog(user, 'تعديل', 'فرع', editId);
    } else {
      const newId = 'b' + (branches.length + 1);
      updated = [...branches, { ...formData, id: newId, createdAt: new Date().toISOString() }];
      addLog(user, 'إضافة', 'فرع', newId);
    }
    setBranches(updated);
    setIsModalOpen(false);
  };

  const openDeleteConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      const updated = branches.filter(b => b.id !== confirmModal.id);
      setBranches(updated);
      addLog(user, 'حذف', 'فرع', confirmModal.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">إدارة الفروع</h1>
          <p className="text-gray-500">استعرض الفروع أو أضف فرعاً جديداً للجمعية</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-emerald-700 transition shadow-sm">
          <Plus size={18} /> إضافة فرع
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div 
            key={branch.id} 
            onClick={() => navigate(`/branches/${branch.id}`)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group hover:border-emerald-300 transition cursor-pointer hover:shadow-md"
          >
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition flex gap-2 z-10">
               <button 
                 onClick={(e) => handleOpenModal(branch.id, e)} 
                 className="p-1.5 text-blue-600 bg-white border border-gray-200 rounded shadow-sm hover:bg-blue-50"
               >
                 <Edit3 size={16} />
               </button>
               <button 
                 onClick={(e) => openDeleteConfirm(branch.id, e)} 
                 className="p-1.5 text-red-600 bg-white border border-gray-200 rounded shadow-sm hover:bg-red-50"
               >
                 <Trash2 size={16} />
               </button>
            </div>
            
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 transition group-hover:bg-emerald-600 group-hover:text-white">
              <MapPin size={24} />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl text-gray-800">{branch.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{branch.location}</p>
              </div>
              <ChevronLeft size={20} className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-[-4px] transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal إضافة وتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editId ? 'تعديل' : 'إضافة'} فرع</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم الفرع</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الموقع / العنوان</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                />
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
        title="حذف الفرع"
        message="هل أنت متأكد من حذف هذا الفرع؟ سيؤدي ذلك لإزالة ارتباط كافة البيانات المسجلة تحته."
      />
    </div>
  );
};

export default Branches;