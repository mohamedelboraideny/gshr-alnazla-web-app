
import React, { useState, useMemo } from 'react';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role } from '../store.tsx';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin,
  Calendar, Phone, AlertCircle, CheckCircle2,
  Filter, CheckSquare, Square, Tag, ShieldAlert
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, categories, addLog } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BeneficiaryType>(BeneficiaryType.INDIVIDUAL);
  const [editId, setEditId] = useState<string | null>(null);
  const [isTreeView, setIsTreeView] = useState(false);
  
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
      const matchesRegion = filterRegion ? b.regionId === filterRegion : true;
      const matchesCategory = filterCategory ? b.categoryId === filterCategory : true;
      return isOwner && matchesSearch && matchesRegion && matchesCategory;
    });
  }, [beneficiaries, searchTerm, filterRegion, filterCategory, user.branchId, isAdmin]);

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
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setConfirmModal({ isOpen: true, mode: 'bulk' })}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-red-100 transition shadow-sm"
            >
              <Trash2 size={18} /> حذف ({selectedIds.length})
            </button>
          )}
          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 shadow-sm font-bold transition">
            <UserIcon size={18} /> إضافة فرد
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-bold transition">
            <UsersIcon size={18} /> إضافة أسرة
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="ابحث بالاسم أو الرقم القومي..." 
              className="w-full pr-10 pl-4 py-2 rounded-xl border-none bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex gap-2 items-center flex-wrap">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <MapPin size={14} />
                <select 
                  className="bg-white dark:bg-gray-900 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
                >
                   <option value="">كل المناطق</option>
                   {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <Tag size={14} />
                <select 
                  className="bg-white dark:bg-gray-900 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                >
                   <option value="">كل الحالات</option>
                   {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
             <button onClick={handleSelectAll} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                {selectedIds.length === filteredBeneficiaries.length ? <CheckSquare size={14}/> : <Square size={14}/>}
                <span>تحديد الكل</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 w-12 text-center">#</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">المستفيد</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">التصنيف</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">المنطقة</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBeneficiaries.map(b => (
                <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.includes(b.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleToggleSelect(b.id)} className="text-gray-300 hover:text-emerald-600 transition">
                       {selectedIds.includes(b.id) ? <CheckSquare size={20} className="text-emerald-600" /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-sm ${b.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                        {b.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={20} /> : <UserIcon size={20} />}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{b.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert size={10} /> {b.nationalId}
                           </span>
                           <span className="text-[10px] font-bold text-emerald-600">{calculateAge(b.birthDate)} سنة</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg w-fit">
                          {categories.find(c => c.id === b.categoryId)?.name || 'بدون تصنيف'}
                       </span>
                       <span className={`text-[10px] font-bold flex items-center gap-1 ${b.status === BeneficiaryStatus.ACTIVE ? 'text-emerald-500' : 'text-red-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${b.status === BeneficiaryStatus.ACTIVE ? 'bg-emerald-500' : 'bg-red-400'}`}></div> {b.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                       <MapPin size={12} className="text-gray-300" />
                       {regions.find(r => r.id === b.regionId)?.name || 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition shadow-sm"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: b.id })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition shadow-sm"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredBeneficiaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-gray-400 font-bold italic">لا توجد نتائج تطابق البحث والفلترة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black dark:text-white">{editId ? 'تعديل' : 'إضافة'} {modalType}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">تأكد من صحة البيانات قبل الحفظ</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">المنطقة</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                      value={formData.regionId} onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                    >
                      <option value="">-- اختر المنطقة --</option>
                      {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {errors.regionId && <p className="text-red-500 text-[10px] font-bold">{errors.regionId}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">الحالة</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                      value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">-- اختر التصنيف --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-[10px] font-bold">{errors.categoryId}</p>}
                  </div>
              </div>

              {/* Fix: Object literal may only specify known properties. Update modalType state directly instead of formData.type */}
              {(modalType === BeneficiaryType.INDIVIDUAL || modalType === BeneficiaryType.FAMILY_MEMBER) && (
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800 space-y-3">
                   <div className="flex items-center gap-2">
                      <UsersIcon size={14} className="text-emerald-600" />
                      <label className="block text-xs font-black text-emerald-800 dark:text-emerald-400">الربط الأسري</label>
                   </div>
                   <select 
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                      value={formData.familyId} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, familyId: val });
                        setModalType(val ? BeneficiaryType.FAMILY_MEMBER : BeneficiaryType.INDIVIDUAL);
                      }}
                    >
                      <option value="">هذا الفرد مستقل (ليس تابعاً لأسرة)</option>
                      {familyHeads.map(h => <option key={h.id} value={h.id}>تابع لأسرة: {h.name}</option>)}
                    </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">الاسم الرباعي</label>
                <input 
                  type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">الرقم القومي</label>
                  <input 
                    type="text" maxLength={14} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })} 
                  />
                  {errors.nationalId && <p className="text-red-500 text-[10px] font-bold">{errors.nationalId}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">تاريخ الميلاد</label>
                  <input 
                    type="date" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">الهاتف (اختياري)</label>
                <input 
                  type="text" maxLength={11} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                />
              </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-[1.25rem] font-black text-gray-500 transition hover:bg-white dark:hover:bg-gray-800 text-sm">تجاهل</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.25rem] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm">حفظ التغييرات</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, mode: 'single' })}
        onConfirm={executeDelete}
        title={confirmModal.mode === 'bulk' ? 'حذف جماعي' : 'حذف مستفيد'}
        message={confirmModal.mode === 'bulk' ? `هل أنت متأكد من حذف ${selectedIds.length} مستفيد دفعة واحدة؟ لا يمكن التراجع عن هذا القرار.` : "سيتم حذف كافة بيانات المستفيد من النظام نهائياً، هل تود الاستمرار؟"}
      />
    </div>
  );
};

export default Beneficiaries;
