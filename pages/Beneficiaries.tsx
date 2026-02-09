import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role, Gender, EDUCATION_LEVELS, SponsorshipStatus } from '../CharityStore';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin, Check, Phone,
  CheckSquare, Square, Building2, ChevronDown, ChevronRight, CornerDownLeft, Tag, Layers, Printer, Baby, AlertCircle, BookOpen, GraduationCap, Heart, Shield, Calendar, Link as LinkIcon, UserCheck, SearchCode, Fingerprint
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, categories, addLog, branches } = useStore();
  const [searchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterEducation, setFilterEducation] = useState('');
  const [filterSponsorship, setFilterSponsorship] = useState('');
  const [filterGender, setFilterGender] = useState<string>(''); 
  
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BeneficiaryType>(BeneficiaryType.INDIVIDUAL);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [isTreeView, setIsTreeView] = useState(true); 
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);

  // Search Family Head states
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [isLinkingFamily, setIsLinkingFamily] = useState(false);
  const [isSearchingHeads, setIsSearchingHeads] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setFilterCategoryIds([catParam]);
    } else {
      setFilterCategoryIds([]);
    }
  }, [searchParams]);

  const initialForm = {
    name: '',
    nationalId: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: Gender.MALE,
    regionId: '',
    categoryIds: [] as string[],
    familyId: '',
    educationLevel: 'غير ملتحق',
    schoolName: '',
    status: BeneficiaryStatus.ACTIVE,
    sponsorshipStatus: SponsorshipStatus.NOT_SPONSORED
  };

  const [formData, setFormData] = useState(initialForm);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });

  const isAdmin = user.role === Role.ADMIN;
  
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const hasPermission = isAdmin ? true : b.branchId === user.branchId;
      if (!hasPermission) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        b.name.toLowerCase().includes(searchLower) || 
        b.nationalId.includes(searchTerm) || 
        (b.phone && b.phone.includes(searchTerm));
      
      const matchesRegion = filterRegion ? b.regionId === filterRegion : true;
      const matchesEducation = filterEducation ? b.educationLevel === filterEducation : true;
      const matchesSponsorship = filterSponsorship ? b.sponsorshipStatus === filterSponsorship : true;
      const matchesGender = filterGender ? b.gender === filterGender : true;

      let matchesCategory = true;
      if (filterCategoryIds.length > 0) {
        matchesCategory = b.categoryIds?.some(catId => filterCategoryIds.includes(catId)) || false;
      }

      return matchesSearch && matchesRegion && matchesEducation && matchesSponsorship && matchesCategory && matchesGender;
    });
  }, [beneficiaries, searchTerm, filterRegion, filterEducation, filterSponsorship, filterCategoryIds, filterGender, user.branchId, isAdmin]);

  const treeData = useMemo(() => {
    if (!isTreeView) return [];
    const heads = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD);
    const individuals = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL);
    const allMembers = beneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_MEMBER);

    return [
      ...heads.map(head => ({
        ...head,
        children: allMembers.filter(m => m.familyId === head.id)
      })),
      ...individuals.map(ind => ({ ...ind, children: [] }))
    ];
  }, [filteredBeneficiaries, isTreeView, beneficiaries]);

  const toggleExpand = (id: string) => {
    setExpandedFamilies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleOpenModal = (type: BeneficiaryType, id: string | null = null) => {
    setModalType(type);
    setErrors({}); 
    setFamilySearchQuery('');
    setIsLinkingFamily(false);
    if (id) {
      const b = beneficiaries.find(x => x.id === id);
      if (b) {
        setFormData({ 
          name: b.name, nationalId: b.nationalId, phone: b.phone || '', address: b.address,
          birthDate: b.birthDate || '', 
          gender: b.gender || Gender.MALE,
          regionId: b.regionId || '', 
          categoryIds: b.categoryIds || [],
          familyId: b.familyId || '', 
          educationLevel: b.educationLevel || 'غير ملتحق',
          schoolName: b.schoolName || '',
          status: b.status,
          sponsorshipStatus: b.sponsorshipStatus || SponsorshipStatus.NOT_SPONSORED
        });
        setEditId(id);
        if (b.familyId) setIsLinkingFamily(true);
      }
    } else {
      setFormData(initialForm);
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const toggleFilterCategory = (catId: string) => {
    setFilterCategoryIds(prev => {
      if (prev.includes(catId)) return prev.filter(id => id !== catId);
      return [...prev, catId];
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    if (!formData.nationalId.trim() || formData.nationalId.length !== 14) {
      newErrors.nationalId = 'الرقم القومي مطلوب (14 رقماً)';
    }
    if (!formData.birthDate) newErrors.birthDate = 'تاريخ الميلاد مطلوب';
    if (!formData.regionId) newErrors.regionId = 'المنطقة مطلوبة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    let updatedList: Beneficiary[];
    
    // Determine the type based on whether a family is linked
    let finalType = modalType;
    if (modalType !== BeneficiaryType.FAMILY_HEAD) {
       finalType = formData.familyId ? BeneficiaryType.FAMILY_MEMBER : BeneficiaryType.INDIVIDUAL;
    }

    if (editId) {
      updatedList = beneficiaries.map(b => b.id === editId ? { ...b, ...formData, type: finalType } : b);
      addLog(user, 'تعديل', 'مستفيد', editId);
    } else {
      const newId = Math.random().toString(36).substring(2, 11);
      const newB: Beneficiary = { 
        ...formData, id: newId, branchId: user.branchId, type: finalType, createdAt: new Date().toISOString() 
      };
      updatedList = [...beneficiaries, newB];
      addLog(user, 'إضافة', finalType, newId);
    }
    setBeneficiaries(updatedList);
    setIsModalOpen(false);
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      setBeneficiaries(beneficiaries.filter(x => x.id !== confirmModal.id && x.familyId !== confirmModal.id)); 
      addLog(user, 'حذف', 'مستفيد', confirmModal.id);
    }
  };

  const branchRegions = regions.filter(r => isAdmin || r.branchId === user.branchId);

  // Search Results for Family Heads with enhanced UI
  const familyHeadResults = useMemo(() => {
    if (!familySearchQuery.trim()) return [];
    return beneficiaries.filter(b => 
      b.type === BeneficiaryType.FAMILY_HEAD && 
      (isAdmin || b.branchId === user.branchId) &&
      (b.name.includes(familySearchQuery) || b.nationalId.includes(familySearchQuery))
    ).slice(0, 6);
  }, [familySearchQuery, beneficiaries, user.branchId, isAdmin]);

  const selectedFamilyHead = beneficiaries.find(b => b.id === formData.familyId);

  // Dynamic Print Title Generation
  const printTitle = useMemo(() => {
    let title = "تقرير سجل المستفيدين";
    if (filterCategoryIds.length > 0) {
      const catNames = filterCategoryIds.map(id => categories.find(c => c.id === id)?.name).join(' - ');
      title += ` (${catNames})`;
    }
    if (filterSponsorship) title += ` - ${filterSponsorship}`;
    if (filterEducation) title += ` - ${filterEducation}`;
    return title;
  }, [filterCategoryIds, filterSponsorship, filterEducation, categories]);

  const branchName = branches.find(b => b.id === user.branchId)?.name || "الإدارة العامة";

  return (
    <div className="space-y-6">
      
      {/* --- Specialized Print Header --- */}
      <div className="hidden print:block mb-8 border-b-4 border-black pb-4">
        <div className="flex justify-between items-start">
           <div className="text-right">
              <h2 className="text-2xl font-black mb-1">الجمعية الشرعية الرئيسية</h2>
              <p className="text-sm font-bold">لتعاون العاملين بالكتاب والسنة المحمدية</p>
              <p className="text-sm font-bold">فرع: {branchName}</p>
           </div>
           <div className="text-center">
              <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-2 font-black text-xl">
                 ش
              </div>
           </div>
           <div className="text-left font-bold text-xs space-y-1">
              <div className="flex justify-end gap-2"><span>التاريخ:</span> <span>{new Date().toLocaleDateString('ar-EG')}</span></div>
              <div className="flex justify-end gap-2"><span>الوقت:</span> <span>{new Date().toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span></div>
              <div className="flex justify-end gap-2"><span>القائم بالاستخراج:</span> <span>{user.name}</span></div>
           </div>
        </div>
        <div className="mt-6 text-center">
           <h3 className="text-xl font-black underline decoration-2 underline-offset-8 uppercase">{printTitle}</h3>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 print-hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white">سجل المستفيدين</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-bold">إدارة قاعدة البيانات وحالة الكفالة والربط الأسري</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button 
            onClick={() => window.print()}
            className="flex-1 xl:flex-none bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 font-bold transition"
          >
            <Printer size={18} /> <span className="text-sm">طباعة الجدول</span>
          </button>

          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 flex shadow-sm">
            <button onClick={() => setIsTreeView(true)} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${isTreeView ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'text-gray-500'}`}>
              <Network size={18} /> شجري
            </button>
            <button onClick={() => setIsTreeView(false)} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${!isTreeView ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'text-gray-500'}`}>
              <LayoutList size={18} /> جدول
            </button>
          </div>

          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="flex-1 xl:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg font-bold transition">
            <UserIcon size={18} /> <span className="text-sm">إضافة فرد</span>
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="flex-1 xl:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg font-bold transition">
            <UsersIcon size={18} /> <span className="text-sm">إضافة أسرة</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center z-20 relative print-hidden">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="بحث بالاسم، الهوية، الهاتف..." 
            className="w-full pr-12 pl-4 py-3 rounded-2xl border-none bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500" 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
           <MapPin size={16} className="text-gray-400" />
           <select className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
              <option value="">كل المناطق</option>
              {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
           </select>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
           <GraduationCap size={16} className="text-gray-400" />
           <select className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0" value={filterEducation} onChange={(e) => setFilterEducation(e.target.value)}>
              <option value="">كل المراحل الدراسية</option>
              {EDUCATION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
           </select>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
           <Heart size={16} className="text-gray-400" />
           <select className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0" value={filterSponsorship} onChange={(e) => setFilterSponsorship(e.target.value)}>
              <option value="">كل حالات الكفالة</option>
              <option value={SponsorshipStatus.SPONSORED}>{SponsorshipStatus.SPONSORED}</option>
              <option value={SponsorshipStatus.NOT_SPONSORED}>{SponsorshipStatus.NOT_SPONSORED}</option>
           </select>
        </div>

        <div className="relative">
           <button onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${filterCategoryIds.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30' : 'bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-900'}`}>
              <Tag size={16} className="text-gray-400" />
              <span>{filterCategoryIds.length > 0 ? `${filterCategoryIds.length} تصنيفات` : 'كل التصنيفات'}</span>
              <ChevronDown size={14} />
           </button>
           {isCatDropdownOpen && (
             <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-20 overflow-hidden">
               <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                 {categories.map(c => {
                   const isSelected = filterCategoryIds.includes(c.id);
                   return (
                     <div key={c.id} onClick={() => toggleFilterCategory(c.id)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                          {isSelected && <Check size={10} className="text-white mx-auto" />}
                        </div>
                        <span className="text-xs font-bold">{c.name}</span>
                     </div>
                   )
                 })}
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 print:bg-gray-100">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest w-[25%] print:text-black">الاسم / الهوية</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest print:text-black">الدراسة</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest print:text-black">الحالة والتصنيف</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest print:text-black">المنطقة</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center print-hidden">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isTreeView ? (
                treeData.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors print:bg-white">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {item.children.length > 0 ? (
                            <button onClick={() => toggleExpand(item.id)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 print-hidden">
                              {expandedFamilies.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          ) : <div className="w-7 print:hidden"></div>}
                          <div>
                            <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{item.name}</p>
                            <span className="text-[10px] text-gray-400 font-bold">{item.nationalId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                            <BookOpen size={14} className="text-blue-500 print:hidden" />
                            <span>{item.educationLevel || '---'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex flex-wrap gap-1">
                             {item.categoryIds?.map(catId => (
                               <span key={catId} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 print:border print:border-black print:bg-white print:text-black">
                                 {categories.find(c => c.id === catId)?.name || 'غير معروف'}
                               </span>
                             ))}
                           </div>
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black w-fit ${item.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 print:bg-gray-200 print:text-black' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 print:bg-white print:border print:border-gray-300'}`}>
                              <Heart size={10} className={`print:hidden ${item.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'fill-emerald-500' : ''}`} />
                              {item.sponsorshipStatus}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-gray-500 dark:text-gray-400">{regions.find(r => r.id === item.regionId)?.name}</td>
                      <td className="px-6 py-5 flex justify-center gap-2 print-hidden">
                         <button onClick={() => handleOpenModal(item.type, item.id)} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl transition"><Edit3 size={18} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, id: item.id })} className="p-2 text-gray-400 hover:text-red-600 rounded-xl transition"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                    {expandedFamilies.includes(item.id) && item.children.map(child => (
                      <tr key={child.id} className="bg-gray-50/50 dark:bg-gray-900/20 print:bg-white">
                        <td className="px-20 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 print:px-12">
                          <Baby size={14} className="print:hidden" /> {child.name}
                        </td>
                        <td className="px-6 py-3">
                           <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              {child.educationLevel || '---'}
                           </div>
                        </td>
                        <td className="px-6 py-3">
                           <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold w-fit ${child.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'bg-emerald-50 text-emerald-600 print:border print:border-black' : 'bg-gray-100 text-gray-400 print:bg-white'}`}>
                                 {child.sponsorshipStatus}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">{regions.find(r => r.id === child.regionId)?.name}</td>
                        <td className="px-6 py-3 flex justify-center gap-2 print-hidden">
                           <button onClick={() => handleOpenModal(child.type, child.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition"><Edit3 size={16} /></button>
                           <button onClick={() => setConfirmModal({ isOpen: true, id: child.id })} className="p-1.5 text-gray-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                filteredBeneficiaries.map(b => (
                   <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:bg-white">
                      <td className="px-8 py-5">
                         <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{b.name}</p>
                         <span className="text-[10px] text-gray-400 font-bold">{b.nationalId}</span>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                            <span>{b.educationLevel || '---'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex flex-wrap gap-1">
                             {b.categoryIds?.map(catId => (
                               <span key={catId} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 print:border print:border-black print:text-black">
                                 {categories.find(c => c.id === catId)?.name || 'غير معروف'}
                               </span>
                             ))}
                           </div>
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black w-fit ${b.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                              {b.sponsorshipStatus}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-gray-500 dark:text-gray-400">{regions.find(r => r.id === b.regionId)?.name}</td>
                      <td className="px-6 py-5 flex justify-center gap-2 print-hidden">
                         <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2 text-gray-400 hover:text-blue-600 rounded-xl transition"><Edit3 size={18} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, id: b.id })} className="p-2 text-gray-400 hover:text-red-600 rounded-xl transition"><Trash2 size={18} /></button>
                      </td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Print Signatures */}
        <div className="hidden print:flex mt-12 justify-between px-10 font-bold">
           <div className="text-center">
              <p>توقيع الموظف المختص</p>
              <div className="mt-10 border-b border-black w-40 mx-auto"></div>
           </div>
           <div className="text-center">
              <p>توقيع مدير الفرع</p>
              <div className="mt-10 border-b border-black w-40 mx-auto"></div>
           </div>
           <div className="text-center">
              <p>ختم الجمعية</p>
              <div className="mt-10 border-2 border-black border-dashed rounded-full w-24 h-24 mx-auto opacity-20 flex items-center justify-center">الختم</div>
           </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                    {modalType === BeneficiaryType.INDIVIDUAL ? <UserIcon size={24} /> : <UsersIcon size={24} />}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white">
                       {editId ? 'تعديل بيانات' : 'إضافة'} {modalType === BeneficiaryType.INDIVIDUAL ? 'مستفيد' : 'رب أسرة'}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold">يرجى استيفاء كافة البيانات المطلوبة بدقة</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition text-gray-400"><X size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- Linking to Family Section (Conditional) --- */}
                {modalType !== BeneficiaryType.FAMILY_HEAD && (
                   <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                               <UsersIcon size={20} />
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-gray-800 dark:text-white">الارتباط بأسرة</h4>
                               <p className="text-[10px] text-gray-500 font-bold">هل هذا الفرد تابع لأسرة مسجلة؟</p>
                            </div>
                         </div>
                         <button 
                           type="button" 
                           onClick={() => {
                             setIsLinkingFamily(!isLinkingFamily);
                             if (!isLinkingFamily) setFormData({...formData, familyId: ''});
                           }}
                           className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isLinkingFamily ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-100 dark:border-indigo-900/50'}`}
                         >
                            {isLinkingFamily ? 'مرتبط بأسرة' : 'فرد مستقل'}
                         </button>
                      </div>

                      {isLinkingFamily && (
                         <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {selectedFamilyHead ? (
                               <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-sm transition-all animate-in zoom-in-95 duration-200">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                                        <UserCheck size={24} />
                                     </div>
                                     <div>
                                        <p className="text-sm font-black text-gray-800 dark:text-white">{selectedFamilyHead.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                           <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                              <Fingerprint size={10} /> {selectedFamilyHead.nationalId}
                                           </span>
                                           <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                           <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                                              {selectedFamilyHead.type}
                                           </span>
                                        </div>
                                     </div>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => setFormData({...formData, familyId: ''})}
                                    className="p-2.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition active:scale-90"
                                    title="إزالة الربط"
                                  >
                                     <Trash2 size={20} />
                                  </button>
                               </div>
                            ) : (
                               <div className="relative group">
                                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${familySearchQuery ? 'text-indigo-500' : 'text-gray-400'}`}>
                                     <SearchCode size={20} />
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="ابحث بالاسم أو الرقم القومي لرب الأسرة..." 
                                    className="w-full pr-12 pl-4 py-4 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500/30 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold outline-none transition-all" 
                                    value={familySearchQuery}
                                    onChange={(e) => setFamilySearchQuery(e.target.value)}
                                    onFocus={() => setIsSearchingHeads(true)}
                                  />
                                  
                                  {familyHeadResults.length > 0 && (
                                     <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-2xl z-[110] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                                        <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 px-5 py-2">
                                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">نتائج البحث المقترحة</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                           {familyHeadResults.map(head => (
                                              <div 
                                                key={head.id} 
                                                onClick={() => {
                                                  setFormData({
                                                     ...formData, 
                                                     familyId: head.id,
                                                     regionId: head.regionId || formData.regionId, // Auto-match region
                                                     address: head.address || formData.address // Auto-match address
                                                  });
                                                  setFamilySearchQuery('');
                                                }}
                                                className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b last:border-b-0 border-gray-50 dark:border-gray-800 flex justify-between items-center group/item transition-colors"
                                              >
                                                 <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                                                       <UserIcon size={18} />
                                                    </div>
                                                    <div>
                                                       <p className="text-sm font-black text-gray-800 dark:text-white group-hover/item:text-indigo-700 dark:group-hover/item:text-indigo-400 transition-colors">{head.name}</p>
                                                       <div className="flex items-center gap-2 mt-0.5">
                                                          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                                             <Fingerprint size={10} /> {head.nationalId}
                                                          </span>
                                                       </div>
                                                    </div>
                                                 </div>
                                                 <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-300 group-hover/item:bg-indigo-500 group-hover/item:text-white group-hover/item:border-indigo-500 transition-all">
                                                    <Check size={14} />
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  )}
                               </div>
                            )}
                         </div>
                      )}
                   </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">الاسم الرباعي الكامل للمستفيد</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1 mr-1 font-bold">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">الرقم القومي (14 رقم)</label>
                  <input type="text" maxLength={14} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-inner" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                  {errors.nationalId && <p className="text-[10px] text-red-500 mt-1 mr-1 font-bold">{errors.nationalId}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">رقم الهاتف للتواصل</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-inner" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">حالة الكفالة الحالية</label>
                   <select className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-sm" value={formData.sponsorshipStatus} onChange={e => setFormData({...formData, sponsorshipStatus: e.target.value as SponsorshipStatus})}>
                      <option value={SponsorshipStatus.NOT_SPONSORED}>{SponsorshipStatus.NOT_SPONSORED}</option>
                      <option value={SponsorshipStatus.SPONSORED}>{SponsorshipStatus.SPONSORED}</option>
                   </select>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">المنطقة الجغرافية</label>
                   <select className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-sm" value={formData.regionId} onChange={e => setFormData({...formData, regionId: e.target.value})}>
                      <option value="">اختر المنطقة</option>
                      {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                   </select>
                </div>

                <div className="md:col-span-2 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/50 space-y-6">
                   <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-4">
                      <GraduationCap size={16} /> المسار التعليمي (اختياري)
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">المرحلة الدراسية</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 dark:text-white text-sm font-bold shadow-sm"
                          value={formData.educationLevel}
                          onChange={e => setFormData({...formData, educationLevel: e.target.value})}
                        >
                          {EDUCATION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">اسم المدرسة / الجامعة</label>
                        <input 
                          type="text"
                          className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 dark:text-white text-sm font-bold shadow-sm"
                          value={formData.schoolName}
                          onChange={e => setFormData({...formData, schoolName: e.target.value})}
                          placeholder="مثال: مدرسة النهضة الابتدائية"
                        />
                      </div>
                   </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">تصنيف الحالة (يمكن اختيار أكثر من واحد)</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => {
                      const isSelected = formData.categoryIds.includes(c.id);
                      return (
                        <button 
                          key={c.id} type="button" 
                          onClick={() => {
                            const newIds = isSelected ? formData.categoryIds.filter(id => id !== c.id) : [...formData.categoryIds, c.id];
                            setFormData({...formData, categoryIds: newIds});
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500 hover:border-gray-200'}`}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">تاريخ الميلاد</label>
                   <input type="date" className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-inner" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                </div>

                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">الجنس</label>
                   <select className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold shadow-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                      <option value={Gender.MALE}>{Gender.MALE}</option>
                      <option value={Gender.FEMALE}>{Gender.FEMALE}</option>
                   </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">العنوان بالتفصيل</label>
                  <textarea rows={2} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold resize-none shadow-inner" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="رقم المنزل، الشارع، علامة مميزة..."></textarea>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-sm font-black text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 transition active:scale-95">إلغاء الأمر</button>
              <button onClick={handleSave} className="flex-1 py-4 text-sm font-black text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition active:scale-95">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={executeDelete}
        title="حذف مستفيد"
        message="هل أنت متأكد من حذف هذا السجل؟ سيؤدي ذلك أيضاً لحذف ارتباطاته الأسرية."
      />
    </div>
  );
};

export default Beneficiaries;