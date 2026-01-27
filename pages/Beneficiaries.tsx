
import React, { useState, useMemo } from 'react';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role } from '../store.tsx';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin,
  Calendar, Phone, AlertCircle, CheckCircle2,
  Filter, CheckSquare, Square, Tag, ShieldAlert,
  Building2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, categories, addLog, branches } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BeneficiaryType>(BeneficiaryType.INDIVIDUAL);
  const [editId, setEditId] = useState<string | null>(null);
  
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
      const canSee = isAdmin || b.branchId === user.branchId;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = b.name.toLowerCase().includes(searchLower) || b.nationalId.includes(searchTerm);
      const matchesRegion = filterRegion ? b.regionId === filterRegion : true;
      const matchesCategory = filterCategory ? b.categoryId === filterCategory : true;
      const matchesBranch = filterBranch ? b.branchId === filterBranch : true;
      return canSee && matchesSearch && matchesRegion && matchesCategory && matchesBranch;
    });
  }, [beneficiaries, searchTerm, filterRegion, filterCategory, filterBranch, user.branchId, isAdmin]);

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

  // Fix for error on line 290: Defining executeDelete function
  const executeDelete = () => {
    if (confirmModal.mode === 'single' && confirmModal.id) {
      const bToDelete = beneficiaries.find(x => x.id === confirmModal.id);
      setBeneficiaries(beneficiaries.filter(x => x.id !== confirmModal.id));
      addLog(user, 'حذف', bToDelete?.type || 'مستفيد', confirmModal.id);
      setSelectedIds(prev => prev.filter(x => x !== confirmModal.id));
    } else if (confirmModal.mode === 'bulk') {
      setBeneficiaries(beneficiaries.filter(x => !selectedIds.includes(x.id)));
      selectedIds.forEach(id => {
        const b = beneficiaries.find(x => x.id === id);
        addLog(user, 'حذف جماعي', b?.type || 'مستفيد', id);
      });
      setSelectedIds([]);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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
          <p className="text-gray-500 dark:text-gray-400">قاعدة بيانات {isAdmin ? 'الجمعية الكاملة' : 'المستفيدين بالفرع'}</p>
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
              className="w-full pr-10 pl-4 py-2 rounded-xl border-none bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm font-bold" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex gap-2 items-center flex-wrap">
             {isAdmin && (
               <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  {/* Fix for error on line 161: Building2 added to imports */}
                  <Building2 size={14} />
                  <select 
                    className="bg-white dark:bg-gray-900 border-none rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}
                  >
                    <option value="">كل الفروع</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
               </div>
             )}
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
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => {
                       setSelectedIds(prev => prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id]);
                    }} className="text-gray-300 hover:text-emerald-600 transition">
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
                              {b.nationalId}
                           </span>
                           <span className="text-[10px] font-bold text-emerald-600">{calculateAge(b.birthDate)} سنة</span>
                           {isAdmin && <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 px-1 py-0.5 rounded font-black">{branches.find(br => br.id === b.branchId)?.name}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        {categories.find(c => c.id === b.categoryId)?.name || 'بدون تصنيف'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                    {regions.find(r => r.id === b.regionId)?.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: b.id })} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition shadow-sm"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black dark:text-white">{editId ? 'تعديل' : 'إضافة'} {modalType}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1">بيانات التسجيل الرسمية</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">الاسم الكامل</label>
                <input 
                  type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">تاريخ الميلاد</label>
                  <input 
                    type="date" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-tighter mb-1 px-1">الرقم القومي</label>
                  <input 
                    type="text" maxLength={14} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })} 
                  />
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-[1.25rem] font-black text-gray-500 transition hover:bg-white dark:hover:bg-gray-800 text-sm">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-emerald-600 text-white rounded-[1.25rem] font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition text-sm">حفظ</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, mode: 'single' })}
        onConfirm={executeDelete}
        title="تأكيد الحذف"
        message="هل تود حذف هذا السجل نهائياً من قاعدة البيانات؟"
      />
    </div>
  );
};

export default Beneficiaries;
