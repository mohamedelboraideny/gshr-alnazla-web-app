import React, { useState, useMemo } from 'react';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role } from '../store.tsx';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin,
  Calendar, Download, Phone, AlertCircle
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, branches, addLog, isDarkMode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BeneficiaryType>(BeneficiaryType.INDIVIDUAL);
  const [editId, setEditId] = useState<string | null>(null);
  const [isTreeView, setIsTreeView] = useState(false);

  const initialForm = {
    name: '',
    nationalId: '',
    phone: '',
    address: '',
    birthDate: '',
    regionId: '',
    status: BeneficiaryStatus.ACTIVE,
    familyId: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

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
    const others = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL || (b.type === BeneficiaryType.FAMILY_MEMBER && !b.familyId));
    
    return [
      ...heads.map(head => ({
        ...head,
        members: filteredBeneficiaries.filter(m => m.familyId === head.id)
      })),
      ...others.map(o => ({ ...o, members: [] }))
    ];
  }, [filteredBeneficiaries]);

  const validate = () => {
    const e: { [key: string]: string } = {};
    if (!formData.name.trim()) e.name = 'الاسم مطلوب';
    if (formData.nationalId && !/^\d{14}$/.test(formData.nationalId)) e.nationalId = 'الرقم القومي يجب أن يكون 14 رقماً';
    
    // Egyptian Phone Validation (Optional but must be valid if provided)
    if (formData.phone.trim()) {
      const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
      if (!egyptianPhoneRegex.test(formData.phone)) {
        e.phone = 'رقم هاتف مصري غير صحيح (يجب أن يبدأ بـ 010, 011, 012, 015 ومكون من 11 رقم)';
      }
    }

    if (!formData.birthDate) e.birthDate = 'تاريخ الميلاد مطلوب';
    if (!formData.regionId) e.regionId = 'اختر المنطقة';
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
          name: b.name, 
          nationalId: b.nationalId, 
          phone: b.phone || '', 
          address: b.address, 
          birthDate: b.birthDate || '',
          regionId: b.regionId || '',
          status: b.status, 
          familyId: b.familyId || '' 
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
        ...formData, 
        id: newId, 
        branchId: user.branchId, 
        type: modalType, 
        createdAt: new Date().toISOString() 
      };
      updatedList = [...beneficiaries, newB];
      addLog(user, 'إضافة', modalType, newId);
    }
    setBeneficiaries(updatedList);
    setIsModalOpen(false);
  };

  const openDeleteConfirm = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      const updated = beneficiaries.filter(x => x.id !== confirmModal.id);
      setBeneficiaries(updated);
      addLog(user, 'حذف', 'مستفيد', confirmModal.id);
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  };

  const branchRegions = regions.filter(r => isAdmin || r.branchId === user.branchId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة المستفيدين</h1>
          <p className="text-gray-500 dark:text-gray-400">الأرشفة الرقمية المتطورة للجمعية</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsTreeView(!isTreeView)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition shadow-sm">
            {isTreeView ? <LayoutList size={18} /> : <Network size={18} />}
            <span>{isTreeView ? 'قائمة' : 'عرض شجري'}</span>
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm font-bold transition">
            <UserIcon size={18} /> إضافة فرد
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm font-bold transition">
            <UsersIcon size={18} /> إضافة أسرة
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو الرقم القومي..." 
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 text-sm outline-none transition-all" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isTreeView ? (
            <div className="p-6 space-y-4">
              {treeData.map(node => (
                <div key={node.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition">
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${node.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                        {node.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={20} /> : <UserIcon size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">{node.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-500" /> {regions.find(r => r.id === node.regionId)?.name || 'غير محدد'}</span>
                          <span className="flex items-center gap-1"><Phone size={12} className="text-blue-500" /> {node.phone || 'بدون هاتف'}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} className="text-orange-500" /> {calculateAge(node.birthDate)} سنة</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleOpenModal(node.type, node.id)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><Edit3 size={18} /></button>
                       <button onClick={() => openDeleteConfirm(node.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  {node.members.length > 0 && (
                     <div className="p-4 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-2">
                       {node.members.map(m => (
                         <div key={m.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                           <div>
                            <span className="font-bold text-gray-700 dark:text-gray-200">{m.name}</span>
                            <span className="text-gray-400 dark:text-gray-500 text-[10px] block">العمر: {calculateAge(m.birthDate)} سنة</span>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => handleOpenModal(m.type, m.id)} className="p-1 text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-600 rounded"><Edit3 size={14} /></button>
                             <button onClick={() => openDeleteConfirm(m.id)} className="p-1 text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-gray-600 rounded"><Trash2 size={14} /></button>
                           </div>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">المستفيد</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">المنطقة</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">العمر</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">الهاتف</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredBeneficiaries.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{b.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{b.type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-bold">{regions.find(r => r.id === b.regionId)?.name || '---'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">{calculateAge(b.birthDate)} سنة</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{b.phone || <span className="text-gray-300 dark:text-gray-600 italic">لا يوجد</span>}</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"><Edit3 size={18} /></button>
                      <button onClick={() => openDeleteConfirm(b.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal الإضافة والتعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <h3 className="text-xl font-bold dark:text-white">{editId ? 'تعديل بيانات' : 'إضافة'} {modalType}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">المنطقة</label>
                    <select 
                      className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.regionId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'}`} 
                      value={formData.regionId} 
                      onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                    >
                      <option value="">-- اختر المنطقة --</option>
                      {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    {errors.regionId && <p className="text-red-500 text-[10px] font-bold">{errors.regionId}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">تاريخ الميلاد</label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.birthDate ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'}`} 
                      value={formData.birthDate} 
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} 
                    />
                    {errors.birthDate && <p className="text-red-500 text-[10px] font-bold">{errors.birthDate}</p>}
                  </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">الاسم الكامل</label>
                <input 
                  type="text" 
                  className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'}`} 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="الاسم الثلاثي أو الرباعي"
                />
                {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  رقم الهاتف <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(اختياري)</span>
                </label>
                <div className="relative">
                   <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                    type="text" 
                    maxLength={11} 
                    className={`w-full pr-10 pl-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'}`} 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">الرقم القومي</label>
                <input 
                  type="text" 
                  maxLength={14} 
                  className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${errors.nationalId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700'}`} 
                  value={formData.nationalId} 
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })} 
                  placeholder="29910xxxxxxxx"
                />
                {errors.nationalId && <p className="text-red-500 text-xs font-bold">{errors.nationalId}</p>}
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="حذف مستفيد"
        message="هل أنت متأكد من حذف هذا المستفيد؟ لا يمكن التراجع عن هذه العملية."
      />
    </div>
  );
};

export default Beneficiaries;