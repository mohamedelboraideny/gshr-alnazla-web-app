import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role, Gender, EDUCATION_LEVELS, SponsorshipStatus, KINSHIP_RELATIONS } from '../CharityStore';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin, Check, Phone,
  ChevronDown, ChevronRight, Tag, Printer, Baby, BookOpen, GraduationCap, Heart, Link as LinkIcon, UserCheck, SearchCode, Fingerprint, CornerDownRight, Home, School, Settings, Activity, Stethoscope, AlertCircle, Filter, ArrowUpCircle
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, categories, healthConditions, addLog, branches, printSettings, setPrintSettings } = useStore();
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

  // Print Settings Modal State
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [localPrintSettings, setLocalPrintSettings] = useState(printSettings);

  // Search Family Head states
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [isLinkingFamily, setIsLinkingFamily] = useState(false);
  const [isSearchingHeads, setIsSearchingHeads] = useState(false);

  // Promotion Modal State
  const [promotionState, setPromotionState] = useState<{ isOpen: boolean; count: number; affectedIds: string[] }>({
    isOpen: false,
    count: 0,
    affectedIds: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setFilterCategoryIds([catParam]);
    } else {
      setFilterCategoryIds([]);
    }
  }, [searchParams]);

  useEffect(() => {
     setLocalPrintSettings(printSettings);
  }, [printSettings]);

  const initialForm = {
    name: '',
    nationalId: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: Gender.MALE,
    regionId: '',
    categoryIds: [] as string[],
    healthConditions: [] as string[],
    familyId: '',
    kinshipRelation: '',
    educationLevel: 'غير ملتحق',
    schoolName: '',
    status: BeneficiaryStatus.ACTIVE,
    sponsorshipStatus: SponsorshipStatus.NOT_SPONSORED
  };

  const [formData, setFormData] = useState(initialForm);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });

  const isAdmin = user.role === Role.ADMIN;
  const isManager = user.role === Role.MANAGER;
  
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
    
    // 1. Get filtered heads
    const heads = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD);
    
    // 2. Get filtered individuals
    const individuals = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.INDIVIDUAL);
    
    // 3. Prepare data structure
    const result: (Beneficiary & { children: Beneficiary[] })[] = [];

    // Add Heads and their members
    heads.forEach(head => {
       const members = beneficiaries.filter(m => m.familyId === head.id);
       result.push({ ...head, children: members });
    });

    // Add Individuals
    individuals.forEach(ind => {
       result.push({ ...ind, children: [] });
    });

    return result;
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
          healthConditions: b.healthConditions || [],
          familyId: b.familyId || '', 
          kinshipRelation: b.kinshipRelation || '',
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
    if (isLinkingFamily && formData.familyId && !formData.kinshipRelation) {
       newErrors.kinshipRelation = 'يجب تحديد صلة القرابة برب الأسرة';
    }
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

  // Helper to calculate Age
  const calculateAge = (dateString: string) => {
    if (!dateString) return '';
    const birth = new Date(dateString);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const branchRegions = regions.filter(r => isAdmin || r.branchId === user.branchId);

  // Search Results for Family Heads with enhanced UI
  const familyHeadResults = useMemo(() => {
    if (!familySearchQuery.trim()) return [];
    const query = familySearchQuery.toLowerCase().trim();
    return beneficiaries.filter(b => 
      b.type === BeneficiaryType.FAMILY_HEAD && 
      (isAdmin || b.branchId === user.branchId) &&
      (b.name.toLowerCase().includes(query) || b.nationalId.includes(query))
    ).slice(0, 6);
  }, [familySearchQuery, beneficiaries, user.branchId, isAdmin]);

  const selectedFamilyHead = beneficiaries.find(b => b.id === formData.familyId);

  // Dynamic Print Title Generation
  const printTitle = useMemo(() => {
    let title = "سجل المستفيدين";
    if (filterCategoryIds.length > 0) {
      const catNames = filterCategoryIds.map(id => categories.find(c => c.id === id)?.name).join(' - ');
      title += ` (${catNames})`;
    }
    if (filterSponsorship) title += ` - ${filterSponsorship}`;
    return title;
  }, [filterCategoryIds, filterSponsorship, categories]);

  const branchName = branches.find(b => b.id === user.branchId)?.name || "الإدارة العامة";

  const handleSavePrintSettings = () => {
    setPrintSettings(localPrintSettings);
    setIsPrintSettingsOpen(false);
  };

  // Check if any "Sick" or "Disabled" category is selected to highlight health conditions
  const isHealthConditionRelevant = useMemo(() => {
    // Check against keywords or specific IDs. Here we check keywords in category names for flexibility
    const relevantKeywords = ['مريض', 'مرضى', 'إعاقة', 'ذوي احتياجات', 'عجز'];
    const selectedCats = categories.filter(c => formData.categoryIds.includes(c.id));
    return selectedCats.some(c => relevantKeywords.some(kw => c.name.includes(kw)));
  }, [formData.categoryIds, categories]);

  // --- Promotion Logic ---
  const handlePreparePromotion = () => {
    const affectedIds: string[] = [];
    
    // Determine which beneficiaries are visible to this user
    const targets = isAdmin ? beneficiaries : beneficiaries.filter(b => b.branchId === user.branchId);

    targets.forEach(b => {
      if (b.educationLevel && b.educationLevel !== 'غير ملتحق' && b.educationLevel !== 'خريج') {
        const currentIndex = EDUCATION_LEVELS.indexOf(b.educationLevel);
        if (currentIndex !== -1 && currentIndex < EDUCATION_LEVELS.length - 1) {
          affectedIds.push(b.id);
        }
      }
    });

    if (affectedIds.length === 0) {
      alert("لا يوجد طلاب مؤهلين للترقية في الوقت الحالي.");
      return;
    }

    setPromotionState({
      isOpen: true,
      count: affectedIds.length,
      affectedIds: affectedIds
    });
  };

  const executePromotion = () => {
    const updatedBeneficiaries = beneficiaries.map(b => {
      if (promotionState.affectedIds.includes(b.id)) {
        const currentIndex = EDUCATION_LEVELS.indexOf(b.educationLevel || '');
        const nextLevel = EDUCATION_LEVELS[currentIndex + 1];
        return { ...b, educationLevel: nextLevel };
      }
      return b;
    });

    setBeneficiaries(updatedBeneficiaries);
    addLog(user, 'ترحيل عام دراسي', 'مجموعة مستفيدين', `عدد: ${promotionState.count}`);
    setPromotionState({ isOpen: false, count: 0, affectedIds: [] });
  };

  return (
    <div className="space-y-6">
      
      {/* --- Specialized Dynamic Print Header (Compacted) --- */}
      <div className="hidden print:flex flex-row justify-between items-center mb-1 border-b border-black pb-1">
        <div className="text-right">
           <h2 className="text-sm font-black">{printSettings.title}</h2>
           <p className="text-[10px] font-bold">{printSettings.subtitle}</p>
        </div>
        <div className="text-center">
           <h3 className="text-base font-black underline decoration-1 underline-offset-2">{printTitle}</h3>
        </div>
        <div className="text-left font-bold text-[9px] leading-tight">
           {printSettings.showBranch && <div>فرع: {branchName}</div>}
           {printSettings.showDate && <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>}
           {printSettings.showUser && <div>المستخدم: {user.name}</div>}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 print-hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white">سجل المستفيدين</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-bold">إدارة قاعدة البيانات وحالة الكفالة والربط الأسري</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          
          {/* Group 1: Utilities & Output (Least Frequent) */}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPrintSettingsOpen(true)}
              className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 px-3 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 font-bold transition shadow-sm"
              title="إعدادات الطباعة"
            >
               <Settings size={20} />
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 px-4 py-3 rounded-2xl hover:bg-gray-200 font-bold transition"
            >
              <Printer size={18} />
              <span className="text-sm hidden sm:inline">طباعة</span>
            </button>
          </div>

          {/* Group 2: View Controls (Medium Frequency) */}
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 flex shadow-sm">
            <button onClick={() => setIsTreeView(true)} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${isTreeView ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'text-gray-500'}`}>
              <Network size={18} /> شجري
            </button>
            <button onClick={() => setIsTreeView(false)} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${!isTreeView ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'text-gray-500'}`}>
              <LayoutList size={18} /> جدول
            </button>
          </div>

          {/* Group 3: Admin Actions (Specific Tasks) */}
          {(isAdmin || isManager) && (
            <button 
              onClick={handlePreparePromotion}
              className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold transition shadow-sm"
              title="نقل الطلاب للمرحلة الدراسية التالية"
            >
               <ArrowUpCircle size={18} />
               <span className="text-sm">ترحيل العام الدراسي</span>
            </button>
          )}

          {/* Group 4: Primary Actions (Most Frequent) - Placed last for visual emphasis in reading flow */}
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="flex-1 xl:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg font-bold transition">
            <UsersIcon size={18} /> <span className="text-sm">إضافة أسرة</span>
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="flex-1 xl:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg font-bold transition">
            <UserIcon size={18} /> <span className="text-sm">إضافة فرد</span>
          </button>

        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center z-20 relative print-hidden">
        {/* Search & Filters */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="بحث بالاسم، الهوية، الهاتف..." 
            className="w-full pr-12 pl-4 py-3 rounded-2xl border-none bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500" 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
           <Filter size={16} />
           <span className="text-xs font-black">النتائج: {filteredBeneficiaries.length}</span>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
           <MapPin size={16} className="text-gray-400" />
           <select className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
              <option value="">كل المناطق</option>
              {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:border-none print:shadow-none print:rounded-none print:overflow-visible">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 print:bg-gray-200">
              <tr>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[200px] print:text-black">الاسم / الهوية</th>
                <th className="px-2 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[50px] text-center print:text-black">العمر</th>
                <th className="px-3 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">المرحلة</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">المدرسة / الجامعة</th>
                <th className="px-3 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">المنطقة</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">العنوان</th>
                <th className="px-3 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest print:text-black">التصنيف والصحة</th>
                <th className="px-3 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-[80px] print:text-black">الكفالة</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center print-hidden">تحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isTreeView ? (
                treeData.map(item => (
                  <React.Fragment key={item.id}>
                    {/* Family Head Row */}
                    <tr className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors print:bg-gray-100">
                      <td className="px-4 py-3 relative">
                        {/* Visual indicator for Tree */}
                        {item.children.length > 0 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 print:hidden"></div>}
                        
                        <div className="flex items-start gap-2">
                          <button 
                             onClick={() => toggleExpand(item.id)} 
                             className="mt-1 p-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 print:hidden hover:bg-indigo-100 hover:text-indigo-600 transition"
                          >
                             {expandedFamilies.includes(item.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                               {item.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={12} className="text-indigo-500 print:hidden" /> : <UserIcon size={12} className="text-gray-400 print:hidden" />}
                               <p className="font-black text-gray-900 dark:text-gray-100 text-xs print:text-black">{item.name}</p>
                               <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/50 dark:border-indigo-800 dark:text-indigo-300 print:border-black print:text-black">رب أسرة</span>
                            </div>
                            <div className="flex flex-col mt-0.5">
                               <span className="text-[10px] font-bold font-mono text-gray-500 print:text-black">{item.nationalId}</span>
                               {item.phone && (
                                <span className="text-[10px] font-mono text-gray-400 print:text-black flex items-center gap-1">
                                  <Phone size={8} className="print:hidden" /> {item.phone}
                                </span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3 text-center">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 print:text-black">{calculateAge(item.birthDate)}</span>
                      </td>

                      <td className="px-3 py-3">
                         <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 print:text-black">{item.educationLevel || '---'}</span>
                      </td>

                      <td className="px-4 py-3">
                         <span className="text-[10px] text-gray-500 dark:text-gray-400 print:text-black">{item.schoolName || '---'}</span>
                      </td>

                      <td className="px-3 py-3 text-[10px] font-bold text-gray-600 dark:text-gray-300 print:text-black">
                         {regions.find(r => r.id === item.regionId)?.name}
                      </td>

                      <td className="px-4 py-3">
                         <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight block max-w-[150px] print:text-black">{item.address}</span>
                      </td>

                      <td className="px-3 py-3">
                         <div className="flex flex-col gap-1">
                           <div className="flex flex-wrap gap-1">
                             {item.categoryIds?.map(catId => (
                               <span key={catId} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 print:border print:border-black print:bg-white print:text-black border border-transparent whitespace-nowrap">
                                 {categories.find(c => c.id === catId)?.name || '---'}
                               </span>
                             ))}
                           </div>
                           {item.healthConditions && item.healthConditions.length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-1">
                               {item.healthConditions.map((cond, idx) => (
                                 <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 print:border-black print:bg-white print:text-black whitespace-nowrap">
                                   {cond}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                      </td>

                      <td className="px-3 py-3">
                         <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black w-fit border ${item.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'} print:border-black print:bg-white print:text-black`}>
                            {item.sponsorshipStatus}
                         </span>
                      </td>

                      <td className="px-4 py-3 flex justify-center gap-1 print-hidden">
                         <button onClick={() => handleOpenModal(item.type, item.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit3 size={14} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, id: item.id })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                      </td>
                    </tr>

                    {/* Children Rows */}
                    {(expandedFamilies.includes(item.id) || window.matchMedia('print').matches) && item.children.map(child => (
                      <tr key={child.id} className="bg-white dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors print:bg-white">
                        <td className="px-4 py-2 relative">
                           {/* Improved Tree Visuals */}
                           <div className="absolute right-6 top-0 h-full w-px bg-gray-200 dark:bg-gray-700 print:bg-black"></div>
                           <div className="absolute right-6 top-1/2 w-4 h-px bg-gray-200 dark:bg-gray-700 print:bg-black"></div>
                           
                           <div className="mr-10 flex items-start gap-1.5">
                             <div className="mt-0.5 text-gray-300 dark:text-gray-600 print:hidden">
                               <CornerDownRight size={14} />
                             </div>
                             <div>
                               <div className="flex items-center gap-2">
                                  <p className="font-bold text-gray-700 dark:text-gray-300 text-[11px] print:text-black">{child.name}</p>
                                  {child.kinshipRelation && (
                                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 print:border-black print:text-black whitespace-nowrap">
                                       {child.kinshipRelation}
                                    </span>
                                  )}
                               </div>
                               <span className="text-[9px] font-mono text-gray-400 print:text-black block">{child.nationalId}</span>
                             </div>
                           </div>
                        </td>
                        
                        <td className="px-2 py-2 text-center">
                          <span className="text-[11px] text-gray-600 dark:text-gray-400 print:text-black">{calculateAge(child.birthDate)}</span>
                        </td>
                        
                        <td className="px-3 py-2">
                           <span className="text-[10px] text-gray-500 dark:text-gray-400 print:text-black">{child.educationLevel || '---'}</span>
                        </td>

                        <td className="px-4 py-2">
                           <span className="text-[10px] text-gray-400 dark:text-gray-500 print:text-black">{child.schoolName || '---'}</span>
                        </td>

                        <td className="px-3 py-2 text-[10px] text-gray-400 print:text-black">
                           {regions.find(r => r.id === child.regionId)?.name}
                        </td>

                        <td className="px-4 py-2 text-[10px] text-gray-400 print:text-black truncate max-w-[150px]">
                           {child.address}
                        </td>

                        <td className="px-3 py-2">
                           <div className="flex flex-col gap-1">
                             <div className="flex flex-wrap gap-1">
                               {child.categoryIds?.map(catId => (
                                  <span key={catId} className="text-[9px] text-gray-500 print:text-black bg-gray-50 dark:bg-gray-800 px-1 rounded border border-gray-100 dark:border-gray-700 print:border-black">
                                     {categories.find(c => c.id === catId)?.name}
                                  </span>
                               ))}
                             </div>
                             {child.healthConditions && child.healthConditions.length > 0 && (
                               <div className="flex flex-wrap gap-1">
                                 {child.healthConditions.map((cond, idx) => (
                                   <span key={idx} className="text-[8px] text-rose-500 print:text-black bg-rose-50 dark:bg-rose-900/10 px-1 rounded border border-rose-100 dark:border-rose-900/20 print:border-black">
                                     {cond}
                                   </span>
                                 ))}
                               </div>
                             )}
                           </div>
                           {!child.categoryIds?.length && !child.healthConditions?.length && <span className="text-[9px] text-gray-300">---</span>}
                        </td>

                        <td className="px-3 py-2">
                           <span className={`text-[9px] ${child.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'text-emerald-600 font-bold' : 'text-gray-400'} print:text-black`}>
                              {child.sponsorshipStatus}
                           </span>
                        </td>

                        <td className="px-4 py-2 flex justify-center gap-1 print-hidden">
                           <button onClick={() => handleOpenModal(child.type, child.id)} className="p-1 text-gray-300 hover:text-blue-600 transition"><Edit3 size={12} /></button>
                           <button onClick={() => setConfirmModal({ isOpen: true, id: child.id })} className="p-1 text-gray-300 hover:text-red-600 transition"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                 // Flat View (Standard)
                filteredBeneficiaries.map(b => (
                   <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:bg-white">
                      <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                            <p className="font-black text-gray-800 dark:text-gray-200 text-xs print:text-black">{b.name}</p>
                            {b.type === BeneficiaryType.FAMILY_MEMBER && b.kinshipRelation && (
                               <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 print:border-black print:text-black">
                                  {b.kinshipRelation}
                               </span>
                            )}
                         </div>
                         <div className="flex flex-col mt-0.5">
                            <span className="text-[10px] text-gray-500 font-mono font-bold print:text-black">{b.nationalId}</span>
                            {b.phone && <span className="text-[10px] text-gray-400 font-mono print:text-black">{b.phone}</span>}
                         </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                         <span className="text-xs font-bold text-gray-700 dark:text-gray-300 print:text-black">{calculateAge(b.birthDate)}</span>
                      </td>
                      <td className="px-3 py-3">
                         <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 print:text-black">{b.educationLevel || '---'}</span>
                      </td>
                      <td className="px-4 py-3">
                         <span className="text-[10px] text-gray-500 dark:text-gray-400 print:text-black">{b.schoolName || '---'}</span>
                      </td>
                      <td className="px-3 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 print:text-black">
                         {regions.find(r => r.id === b.regionId)?.name}
                      </td>
                      <td className="px-4 py-3">
                         <span className="text-[10px] text-gray-500 print:text-black block max-w-[150px] leading-tight">{b.address}</span>
                      </td>
                      <td className="px-3 py-3">
                         <div className="flex flex-col gap-1">
                           <div className="flex flex-wrap gap-1">
                             {b.categoryIds?.map(catId => (
                               <span key={catId} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 print:border print:border-black print:bg-white print:text-black border border-transparent whitespace-nowrap">
                                 {categories.find(c => c.id === catId)?.name || '---'}
                               </span>
                             ))}
                           </div>
                           {b.healthConditions && b.healthConditions.length > 0 && (
                             <div className="flex flex-wrap gap-1">
                               {b.healthConditions.map((cond, idx) => (
                                 <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 print:border-black print:bg-white print:text-black whitespace-nowrap">
                                   {cond}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                      </td>
                      <td className="px-3 py-3">
                         <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] font-black w-fit border ${b.sponsorshipStatus === SponsorshipStatus.SPONSORED ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'} print:border-black print:bg-white print:text-black`}>
                            {b.sponsorshipStatus}
                         </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-1 print-hidden">
                         <button onClick={() => handleOpenModal(b.type, b.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition"><Edit3 size={16} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, id: b.id })} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition"><Trash2 size={16} /></button>
                      </td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Print Settings Modal --- */}
      {isPrintSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                 <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <Printer className="text-emerald-500" size={20} />
                    إعدادات وتخصيص الطباعة
                 </h3>
                 <button onClick={() => setIsPrintSettingsOpen(false)} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition text-gray-400"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                 
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">ترويسة الصفحة (Header)</h4>
                    <div>
                       <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">العنوان الرئيسي</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                         value={localPrintSettings.title}
                         onChange={(e) => setLocalPrintSettings({...localPrintSettings, title: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">العنوان الفرعي / الوصف</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                         value={localPrintSettings.subtitle}
                         onChange={(e) => setLocalPrintSettings({...localPrintSettings, subtitle: e.target.value})}
                       />
                    </div>
                 </div>

                 <hr className="border-gray-100 dark:border-gray-700" />

                 <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">خيارات العرض</h4>
                    <div className="flex flex-wrap gap-4">
                       <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                             checked={localPrintSettings.showDate}
                             onChange={(e) => setLocalPrintSettings({...localPrintSettings, showDate: e.target.checked})}
                          />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">إظهار التاريخ</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                             checked={localPrintSettings.showUser}
                             onChange={(e) => setLocalPrintSettings({...localPrintSettings, showUser: e.target.checked})}
                          />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">إظهار اسم المستخدم</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                             checked={localPrintSettings.showBranch}
                             onChange={(e) => setLocalPrintSettings({...localPrintSettings, showBranch: e.target.checked})}
                          />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">إظهار اسم الفرع</span>
                       </label>
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex gap-4">
                 <button onClick={() => setIsPrintSettingsOpen(false)} className="flex-1 py-3 text-sm font-black text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition">إلغاء</button>
                 <button onClick={handleSavePrintSettings} className="flex-1 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition">حفظ التفضيلات</button>
              </div>
           </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={promotionState.isOpen}
        onClose={() => setPromotionState({ isOpen: false, count: 0, affectedIds: [] })}
        onConfirm={executePromotion}
        title="تأكيد ترحيل العام الدراسي"
        message={`هل أنت متأكد من نقل ${promotionState.count} طالب إلى السنة الدراسية التالية؟ سيتم تحديث بيانات المرحلة الدراسية لجميع الطلاب المؤهلين.`}
        confirmText="تأكيد الترحيل"
        variant="primary"
      />

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