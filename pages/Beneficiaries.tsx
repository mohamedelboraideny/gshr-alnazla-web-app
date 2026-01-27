import React, { useState, useMemo } from 'react';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role } from '../store.tsx';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin,
  Calendar, Phone, AlertCircle, CheckCircle2,
  Filter, CheckSquare, Square, Tag, ShieldAlert,
  Building2, ChevronDown, ChevronRight
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
  const [isTreeView, setIsTreeView] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  
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

  const treeData = useMemo(() => {
    if (!isTreeView) return [];
    
    const familyHeads = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD);
    const independent = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL);
    const members = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_MEMBER);
    
    return [
      ...familyHeads.map(head => ({
        ...head,
        children: members.filter(m => m.familyId === head.id)
      })),
      ...independent.map(ind => ({ ...ind, children: [] }))
    ];
  }, [filteredBeneficiaries, isTreeView]);

  const toggleExpand = (id: string) => {
    setExpandedFamilies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
    if (!formData.name.trim()) return;
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

  const executeDelete = () => {
    if (confirmModal.mode === 'single' && confirmModal.id) {
      setBeneficiaries(beneficiaries.filter(x => x.id !== confirmModal.id));
      addLog(user, 'حذف', 'مستفيد', confirmModal.id);
    } else if (confirmModal.mode === 'bulk') {
      setBeneficiaries(beneficiaries.filter(x => !selectedIds.includes(x.id)));
      setSelectedIds([]);
    }
  };

  const branchRegions = regions.filter(r => isAdmin || r.branchId === user.branchId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white">إدارة المستفيدين</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-bold">قاعدة بيانات {isAdmin ? 'الجمعية الشرعية بالكامل' : 'المستفيدين بالفرع'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsTreeView(!isTreeView)}
            className={`px-5 py-3 rounded-2xl flex items-center gap-2 font-black transition shadow-sm ${isTreeView ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}
          >
            {isTreeView ? <LayoutList size={20} /> : <Network size={20} />}
            {isTreeView ? 'عرض الجدول' : 'عرض شجري'}
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 font-black transition">
            <UserIcon size={20} /> إضافة فرد
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 font-black transition">
            <UsersIcon size={20} /> إضافة أسرة
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap gap-6 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" placeholder="ابحث بالاسم، الرقم القومي، أو رقم الهاتف..." 
              className="w-full pr-12 pl-6 py-3.5 rounded-2xl border-none bg-white dark:bg-gray-900 text-sm font-black focus:ring-2 focus:ring-emerald-500 shadow-sm" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
             {isAdmin && (
               <div className="flex items-center gap-2 text-xs font-black text-gray-500">
                  <Building2 size={16} className="text-gray-400" />
                  <select 
                    className="bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}
                  >
                    <option value="">كل الفروع</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
               </div>
             )}
             <div className="flex items-center gap-2 text-xs font-black text-gray-500">
                <MapPin size={16} className="text-gray-400" />
                <select 
                  className="bg-white dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
                >
                   <option value="">كل المناطق</option>
                   {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50/80 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">المستفيد / الأسرة</th>
                {!isTreeView && (
                  <>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">التصنيف</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">المنطقة</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">العمر</th>
                  </>
                )}
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.2em] text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-bold">
              {isTreeView ? (
                treeData.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {item.children.length > 0 && (
                            <button onClick={() => toggleExpand(item.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                              {expandedFamilies.includes(item.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          )}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${item.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                            {item.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={22} /> : <UserIcon size={22} />}
                          </div>
                          <div>
                            <p className="font-black text-gray-800 dark:text-gray-200 text-base">{item.name}</p>
                            <div className="flex gap-4 mt-1">
                              <span className="text-[11px] text-gray-400">ID: {item.nationalId}</span>
                              <span className="text-[11px] text-emerald-600 uppercase tracking-widest">{categories.find(c => c.id === item.categoryId)?.name}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 flex justify-center gap-3">
                         <button onClick={() => handleOpenModal(item.type, item.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"><Edit3 size={18} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: item.id })} className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                    {expandedFamilies.includes(item.id) && item.children.map(child => (
                      <tr key={child.id} className="bg-gray-50/30 dark:bg-gray-900/10 border-r-4 border-emerald-500/20">
                        <td className="px-20 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
                              <UserIcon size={16} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-gray-700 dark:text-gray-300">{child.name}</p>
                               <span className="text-[10px] text-gray-400">{calculateAge(child.birthDate)} سنة - {child.nationalId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 flex justify-center gap-2">
                           <button onClick={() => handleOpenModal(child.type, child.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                           <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: child.id })} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                filteredBeneficiaries.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${b.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                          {b.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={22} /> : <UserIcon size={22} />}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 dark:text-gray-200 text-sm leading-none">{b.name}</p>
                          <p className="text-[11px] text-gray-400 mt-2 font-black tracking-widest">{b.nationalId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          {categories.find(c => c.id === b.categoryId)?.name || 'غير مصنف'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-black text-gray-500 dark:text-gray-400">
                      {regions.find(r => r.id === b.regionId)?.name || '---'}
                    </td>
                    <td className="px-8 py-6 text-xs font-black text-emerald-600">
                      {calculateAge(b.birthDate)} سنة
                    </td>
                    <td className="px-8 py-6 flex justify-center gap-3">
                      <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition"><Edit3 size={18} /></button>
                      <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: b.id })} className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredBeneficiaries.length === 0 && (
            <div className="py-32 text-center text-gray-300 flex flex-col items-center gap-4">
               <ShieldAlert size={64} className="opacity-20" />
               <p className="font-black italic text-lg uppercase tracking-widest">لا توجد بيانات تطابق البحث</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black dark:text-white">{editId ? 'تعديل' : 'إضافة'} {modalType}</h3>
                <p className="text-[11px] text-gray-400 font-black mt-2 uppercase tracking-widest">نموذج تسجيل المستفيد الرسمي</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-3 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1 px-1">الاسم الرباعي للمستفيد</label>
                <input 
                  type="text" className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-[1.25rem] text-sm font-black focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1 px-1">تاريخ الميلاد</label>
                  <input 
                    type="date" className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-[1.25rem] text-sm font-black focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1 px-1">الرقم القومي (14 رقم)</label>
                  <input 
                    type="text" maxLength={14} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-[1.25rem] text-sm font-black focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1 px-1">المنطقة</label>
                  <select 
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-[1.25rem] text-sm font-black focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.regionId} onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                  >
                    <option value="">-- اختر المنطقة --</option>
                    {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1 px-1">الحالة الاجتماعية</label>
                  <select 
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-[1.25rem] text-sm font-black focus:ring-2 focus:ring-emerald-500 shadow-sm" 
                    value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">-- اختر التصنيف --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-10 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex gap-5">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border border-gray-200 dark:border-gray-700 rounded-3xl font-black text-gray-500 transition hover:bg-white dark:hover:bg-gray-800 text-sm">تجاهل</button>
              <button onClick={handleSave} className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition text-sm">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, mode: 'single' })}
        onConfirm={executeDelete}
        title="تأكيد الحذف النهائي"
        message="هل أنت متأكد من حذف هذا السجل من قاعدة بيانات الجمعية؟ لا يمكن استرجاع البيانات بعد الحذف."
      />
    </div>
  );
};

export default Beneficiaries;