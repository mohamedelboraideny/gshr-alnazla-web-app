import React, { useState, useMemo } from 'react';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role } from '../store.tsx';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin,
  Calendar, Phone, AlertCircle, CheckCircle2,
  MoreVertical, CheckSquare, Square
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, categories, addLog, isDarkMode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BeneficiaryType>(BeneficiaryType.INDIVIDUAL);
  const [editId, setEditId] = useState<string | null>(null);
  const [isTreeView, setIsTreeView] = useState(false);
  
  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const initialForm = {
    name: '',
    nationalId: '',
    phone: '',
    address: '',
    birthDate: '',
    regionId: '',
    categoryId: '',
    familyId: '',
    status: BeneficiaryStatus.ACTIVE
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; mode: 'single' | 'bulk'; id?: string }>({ isOpen: false, mode: 'single' });

  const isAdmin = user.role === Role.ADMIN;
  
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const isOwner = isAdmin || b.branchId === user.branchId;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(searchLower) || b.nationalId.includes(searchTerm);
      return isOwner && matchesSearch;
    });
  }, [beneficiaries, searchTerm, user.branchId, isAdmin]);

  const treeData = useMemo(() => {
    const heads = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD);
    const others = filteredBeneficiaries.filter(b => b.type !== BeneficiaryType.FAMILY_MEMBER);
    
    return [
      ...heads.map(head => ({
        ...head,
        members: filteredBeneficiaries.filter(m => m.familyId === head.id)
      })),
      ...filteredBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL)
    ];
  }, [filteredBeneficiaries]);

  const validate = () => {
    const e: { [key: string]: string } = {};
    if (!formData.name.trim()) e.name = 'الاسم مطلوب';
    if (formData.nationalId && !/^\d{14}$/.test(formData.nationalId)) e.nationalId = 'الرقم القومي (14 رقم)';
    if (!formData.birthDate) e.birthDate = 'تاريخ الميلاد مطلوب';
    if (!formData.regionId) e.regionId = 'اختر المنطقة';
    if (!formData.categoryId) e.categoryId = 'حدد تصنيف الحالة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleOpenModal = (type: BeneficiaryType, id: string | null = null) => {
    setModalType(type);
    setErrors({});
    if (id) {
      const b = beneficiaries.find(x => x.id === id);
      if (b) {
        setFormData({ 
          name: b.name, nationalId: b.nationalId, phone: b.phone || '', address: b.address,
          birthDate: b.birthDate || '', regionId: b.regionId || '', categoryId: b.categoryId || '',
          familyId: b.familyId || '', status: b.status
        });
        setEditId(id);
      }
    } else {
      setFormData(initialForm);
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    let updatedList: Beneficiary[];
    if (editId) {
      updatedList = beneficiaries.map(b => b.id === editId ? { ...b, ...formData, type: modalType } : b);
      addLog(user, 'تعديل', 'مستفيد', editId);
    } else {
      const newId = Math.random().toString(36).substring(2, 11);
      const newB: Beneficiary = { 
        ...formData, id: newId, branchId: user.branchId, type: modalType, createdAt: new Date().toISOString() 
      };
      updatedList = [...beneficiaries, newB];
      addLog(user, 'إضافة', modalType, newId);
    }
    setBeneficiaries(updatedList);
    setIsModalOpen(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredBeneficiaries.length) setSelectedIds([]);
    else setSelectedIds(filteredBeneficiaries.map(x => x.id));
  };

  const executeDelete = () => {
    if (confirmModal.mode === 'single' && confirmModal.id) {
      setBeneficiaries(beneficiaries.filter(b => b.id !== confirmModal.id));
      addLog(user, 'حذف', 'مستفيد فردي', confirmModal.id);
    } else {
      setBeneficiaries(beneficiaries.filter(b => !selectedIds.includes(b.id)));
      addLog(user, 'حذف متعدد', 'مستفيدين', selectedIds.join(', '));
      setSelectedIds([]);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    const age = new Date().getFullYear() - birth.getFullYear();
    return age;
  };

  const branchRegions = regions.filter(r => isAdmin || r.branchId === user.branchId);
  const familyHeads = beneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD && (isAdmin || b.branchId === user.branchId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة المستفيدين</h1>
          <p className="text-gray-500 dark:text-gray-400">قاعدة بيانات المستفيدين والربط الأسري</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, mode: 'bulk' })}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              <Trash2 size={18} /> حذف المحدد ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setIsTreeView(!isTreeView)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-50 font-bold transition shadow-sm">
            {isTreeView ? <LayoutList size={18} /> : <Network size={18} />}
            <span>{isTreeView ? 'قائمة' : 'عرض شجري'}</span>
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-sm font-bold transition">
            <UserIcon size={18} /> إضافة فرد
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-bold transition">
            <UsersIcon size={18} /> إضافة أسرة
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="ابحث بالاسم أو الرقم القومي..." 
              className="w-full pr-10 pl-4 py-2 rounded-xl border-none bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button onClick={handleSelectAll} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
             {selectedIds.length === filteredBeneficiaries.length ? <CheckSquare size={16}/> : <Square size={16}/>}
             {selectedIds.length === filteredBeneficiaries.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">الاسم والبيانات</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">الحالة / التصنيف</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">المنطقة</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBeneficiaries.map(b => (
                <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedIds.includes(b.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleSelect(b.id)} className="text-gray-400 hover:text-emerald-600 transition">
                       {selectedIds.includes(b.id) ? <CheckSquare size={20} className="text-emerald-600" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${b.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {b.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={18} /> : <UserIcon size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{b.name}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                           <span>{b.nationalId}</span> • <span>{calculateAge(b.birthDate)} سنة</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md w-fit">
                          {categories.find(c => c.id === b.categoryId)?.name || 'بدون تصنيف'}
                       </span>
                       <span className={`text-[10px] font-medium flex items-center gap-1 ${b.status === BeneficiaryStatus.ACTIVE ? 'text-emerald-500' : 'text-red-400'}`}>
                          <CheckCircle2 size={10} /> {b.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                    {regions.find(r => r.id === b.regionId)?.name || '---'}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: b.id })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal الإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold dark:text-white">{editId ? 'تعديل بيانات' : 'إضافة'} {modalType}</h3>
                <p className="text-[10px] text-gray-400 mt-1">تأكد من دقة الرقم القومي وتصنيف الحالة</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">المنطقة السكنية</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500" 
                      value={formData.regionId} onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                    >
                      <option value="">-- اختر المنطقة --</option>
                      {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {errors.regionId && <p className="text-red-500 text-[10px] font-bold">{errors.regionId}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">تصنيف الحالة</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500" 
                      value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">-- اختر التصنيف --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-[10px] font-bold">{errors.categoryId}</p>}
                  </div>
              </div>

              {/* الربط الأسري: يظهر فقط عند إضافة فرد أسرة */}
              {modalType === BeneficiaryType.INDIVIDUAL && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                   <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">هل هذا الفرد تابع لأسرة مسجلة؟</label>
                   <select 
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500" 
                      value={formData.familyId} onChange={(e) => setFormData({ ...formData, familyId: e.target.value, type: e.target.value ? BeneficiaryType.FAMILY_MEMBER : BeneficiaryType.INDIVIDUAL })}
                    >
                      <option value="">لا، فرد مستقل</option>
                      {familyHeads.map(h => <option key={h.id} value={h.id}>نعم، تابع لأسرة: {h.name}</option>)}
                    </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">الاسم الكامل</label>
                <input 
                  type="text" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500" 
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="أدخل الاسم الرباعي"
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">الرقم القومي</label>
                  <input 
                    type="text" maxLength={14} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500" 
                    value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })} 
                    placeholder="29910xxxxxxxx"
                  />
                  {errors.nationalId && <p className="text-red-500 text-[10px] font-bold">{errors.nationalId}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">تاريخ الميلاد</label>
                  <input 
                    type="date" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500" 
                    value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">رقم الهاتف (اختياري)</label>
                <input 
                  type="text" maxLength={11} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500" 
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-2xl font-bold text-gray-600 transition hover:bg-white dark:hover:bg-gray-800">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, mode: 'single' })}
        onConfirm={executeDelete}
        title={confirmModal.mode === 'bulk' ? 'حذف مجموعة' : 'حذف مستفيد'}
        message={confirmModal.mode === 'bulk' ? `هل أنت متأكد من حذف ${selectedIds.length} مستفيد دفعة واحدة؟` : "هل أنت متأكد من حذف هذا المستفيد؟ لا يمكن التراجع عن هذه العملية."}
      />
    </div>
  );
};

export default Beneficiaries;