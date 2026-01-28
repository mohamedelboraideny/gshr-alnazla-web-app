import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, User, Beneficiary, BeneficiaryStatus, BeneficiaryType, Role, Gender } from '../CharityStore';
import { 
  Plus, Search, Edit3, Trash2, 
  User as UserIcon, Users as UsersIcon, X, 
  LayoutList, Network, MapPin, Check, Phone,
  CheckSquare, Square, Building2, ChevronDown, ChevronRight, CornerDownLeft, Tag, Layers, Printer, Baby
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Beneficiaries: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, setBeneficiaries, regions, categories, addLog, branches } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterGender, setFilterGender] = useState<string>(''); // Gender Filter
  
  // Multi-select Category Filter State
  const [filterCategoryIds, setFilterCategoryIds] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [matchAllCategories, setMatchAllCategories] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<BeneficiaryType>(BeneficiaryType.INDIVIDUAL);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Tree View State
  const [isTreeView, setIsTreeView] = useState(true); // Default to Tree View
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Family Search State
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [showFamilyResults, setShowFamilyResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    status: BeneficiaryStatus.ACTIVE
  };

  const [formData, setFormData] = useState(initialForm);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; mode: 'single' | 'bulk'; id?: string }>({ isOpen: false, mode: 'single' });

  const isAdmin = user.role === Role.ADMIN;
  
  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowFamilyResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Logic Restoration: Strict Filtering based on Role
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      // Permission Logic:
      // If Admin -> See All.
      // If Manager/Staff -> See ONLY their branch.
      const hasPermission = isAdmin ? true : b.branchId === user.branchId;
      
      if (!hasPermission) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        b.name.toLowerCase().includes(searchLower) || 
        b.nationalId.includes(searchTerm) || 
        (b.phone && b.phone.includes(searchTerm));
      
      const matchesRegion = filterRegion ? b.regionId === filterRegion : true;
      const matchesBranch = filterBranch ? b.branchId === filterBranch : true;
      const matchesGender = filterGender ? b.gender === filterGender : true;

      // Multi-Category Filter Logic
      let matchesCategory = true;
      if (filterCategoryIds.length > 0) {
        if (matchAllCategories) {
          // AND Logic: Must have ALL selected categories (Intersection)
          matchesCategory = filterCategoryIds.every(id => b.categoryIds?.includes(id));
        } else {
          // OR Logic: Must have ANY of selected categories (Union)
          matchesCategory = b.categoryIds?.some(catId => filterCategoryIds.includes(catId)) || false;
        }
      }

      return matchesSearch && matchesRegion && matchesCategory && matchesBranch && matchesGender;
    });
  }, [beneficiaries, searchTerm, filterRegion, filterCategoryIds, filterBranch, filterGender, user.branchId, isAdmin, matchAllCategories]);

  // Family Search Logic
  const familySearchResults = useMemo(() => {
    if (!familySearchTerm.trim()) return [];
    const lowerTerm = familySearchTerm.toLowerCase();
    return beneficiaries.filter(b => 
      b.type === BeneficiaryType.FAMILY_HEAD &&
      (b.branchId === user.branchId || isAdmin) && // Only show families in same branch
      (b.name.toLowerCase().includes(lowerTerm) || 
       b.nationalId.includes(lowerTerm) || 
       (b.phone && b.phone.includes(lowerTerm)))
    ).slice(0, 5); // Limit to 5 results
  }, [familySearchTerm, beneficiaries, user.branchId, isAdmin]);

  // 2. Tree Data Construction
  const treeData = useMemo(() => {
    if (!isTreeView) return [];
    
    // Get Family Heads
    const heads = filteredBeneficiaries.filter(b => b.type === BeneficiaryType.FAMILY_HEAD);
    // Get Independent Individuals
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

  const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return '-';
    const age = new Date().getFullYear() - birth.getFullYear();
    return age;
  };

  const handleOpenModal = (type: BeneficiaryType, id: string | null = null) => {
    setModalType(type);
    setFamilySearchTerm(''); // Reset search
    if (id) {
      const b = beneficiaries.find(x => x.id === id);
      if (b) {
        setFormData({ 
          name: b.name, nationalId: b.nationalId, phone: b.phone || '', address: b.address,
          birthDate: b.birthDate || '', 
          gender: b.gender || Gender.MALE,
          regionId: b.regionId || '', 
          categoryIds: b.categoryIds || [],
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

  const toggleFormCategory = (catId: string) => {
    setFormData(prev => {
      const current = prev.categoryIds;
      if (current.includes(catId)) {
        return { ...prev, categoryIds: current.filter(id => id !== catId) };
      } else {
        return { ...prev, categoryIds: [...current, catId] };
      }
    });
  };

  const toggleFilterCategory = (catId: string) => {
    setFilterCategoryIds(prev => {
      if (prev.includes(catId)) return prev.filter(id => id !== catId);
      return [...prev, catId];
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    // Validation for Family Member
    if (modalType === BeneficiaryType.FAMILY_MEMBER && !formData.familyId) {
      alert('يجب اختيار رب الأسرة للمستفيد التابع');
      return;
    }

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
      setBeneficiaries(beneficiaries.filter(x => x.id !== confirmModal.id && x.familyId !== confirmModal.id)); // Delete head deletes family? Logic choice.
      addLog(user, 'حذف', 'مستفيد', confirmModal.id);
    } else if (confirmModal.mode === 'bulk') {
      setBeneficiaries(beneficiaries.filter(x => !selectedIds.includes(x.id)));
      setSelectedIds([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const branchRegions = regions.filter(r => isAdmin || r.branchId === user.branchId);

  // Get current Branch Name for print header
  const getBranchNameForPrint = () => {
    if (isAdmin && filterBranch) {
      return branches.find(b => b.id === filterBranch)?.name;
    }
    if (isAdmin) return "الإدارة العامة";
    return branches.find(b => b.id === user.branchId)?.name;
  };

  // Helper to get selected family head name
  const selectedFamilyHead = useMemo(() => {
    return beneficiaries.find(b => b.id === formData.familyId);
  }, [formData.familyId, beneficiaries]);

  return (
    <div className="space-y-6">
      
      {/* Print Header (Visible only in Print) */}
      <div className="hidden print:block border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-end">
           <div>
              <h2 className="text-2xl font-black">سجل المستفيدين</h2>
              <p className="text-sm mt-1">
                {filterCategoryIds.length > 0 ? `تصفية حسب: ${filterCategoryIds.map(id => categories.find(c => c.id === id)?.name).join('، ')}` : 'عرض شامل'}
              </p>
           </div>
           <div className="text-left">
              <h3 className="font-bold text-lg">الجمعية الشرعية</h3>
              <p className="text-sm font-bold text-gray-600">{getBranchNameForPrint()}</p>
           </div>
        </div>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 print-hidden">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white">سجل المستفيدين</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-bold">
            {isAdmin ? 'إدارة قاعدة البيانات المركزية' : `إدارة مستفيدين: ${branches.find(b => b.id === user.branchId)?.name}`}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
           {/* Print Button - Available for all */}
          <button 
             onClick={handlePrint}
             className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 font-bold transition"
          >
             <Printer size={18} /> <span className="text-sm">طباعة</span>
          </button>

          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 flex shadow-sm">
            <button 
              onClick={() => setIsTreeView(true)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${isTreeView ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <Network size={18} />
              شجري
            </button>
            <button 
              onClick={() => setIsTreeView(false)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${!isTreeView ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <LayoutList size={18} />
              جدول
            </button>
          </div>

          <button onClick={() => handleOpenModal(BeneficiaryType.INDIVIDUAL)} className="flex-1 xl:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-bold transition">
            <UserIcon size={18} /> <span className="text-sm">إضافة فرد</span>
          </button>
          <button onClick={() => handleOpenModal(BeneficiaryType.FAMILY_HEAD)} className="flex-1 xl:flex-none bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 font-bold transition">
            <UsersIcon size={18} /> <span className="text-sm">إضافة أسرة</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center z-20 relative print-hidden">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="بحث بالاسم، الهوية، الهاتف..." 
            className="w-full pr-12 pl-4 py-3 rounded-2xl border-none bg-gray-50 dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-shadow" 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
             <Building2 size={16} className="text-gray-400" />
             <select 
               className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0 w-32"
               value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}
             >
               <option value="">كل الفروع</option>
               {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
          </div>
        )}
        
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
           <MapPin size={16} className="text-gray-400" />
           <select 
             className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0 w-32"
             value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
           >
              <option value="">كل المناطق</option>
              {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
           </select>
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700">
           <UserIcon size={16} className="text-gray-400" />
           <select 
             className="bg-transparent border-none text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-0 w-24"
             value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
           >
              <option value="">كل الجنس</option>
              <option value={Gender.MALE}>ذكر</option>
              <option value={Gender.FEMALE}>أنثى</option>
           </select>
        </div>

        {/* Multi-Select Category Filter */}
        <div className="relative">
           <button 
             onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
             className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold ${
               filterCategoryIds.length > 0 
                 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' 
                 : 'bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300'
             }`}
           >
              <Tag size={16} className={filterCategoryIds.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"} />
              <span>
                {filterCategoryIds.length > 0 ? `${filterCategoryIds.length} تصنيفات` : 'كل التصنيفات'}
              </span>
              <ChevronDown size={14} />
           </button>
           
           {isCatDropdownOpen && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setIsCatDropdownOpen(false)}></div>
               <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                 {/* Match All Toggle */}
                 <div 
                   onClick={() => setMatchAllCategories(!matchAllCategories)}
                   className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
                 >
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-gray-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">تطابق الكل (AND)</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 duration-300 ${matchAllCategories ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`bg-white w-3 h-3 rounded-full shadow-sm duration-300 ${matchAllCategories ? '-translate-x-4' : ''}`}></div>
                    </div>
                 </div>

                 <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                   {categories.map(c => {
                     const isSelected = filterCategoryIds.includes(c.id);
                     return (
                       <div 
                         key={c.id} 
                         onClick={() => toggleFilterCategory(c.id)}
                         className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                       >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {c.name}
                          </span>
                       </div>
                     )
                   })}
                 </div>
                 {filterCategoryIds.length > 0 && (
                   <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30">
                     <button 
                       onClick={() => { setFilterCategoryIds([]); setIsCatDropdownOpen(false); }}
                       className="w-full py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                     >
                       مسح الكل
                     </button>
                   </div>
                 )}
               </div>
             </>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[500px] print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest w-[30%]">الاسم / الهوية</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest w-[15%]">السن والجنس</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">التصنيفات</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">رقم الهاتف</th>
                {/* Region is now always visible */}
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">المنطقة</th>
                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center print-hidden">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isTreeView ? (
                // --- TREE VIEW RENDERING ---
                treeData.map(item => (
                  <React.Fragment key={item.id}>
                    {/* Parent Row (Head/Individual) */}
                    <tr className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors print:break-inside-avoid">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {item.children.length > 0 ? (
                            <button 
                              onClick={() => toggleExpand(item.id)} 
                              className={`p-1.5 rounded-lg transition-colors print-hidden ${expandedFamilies.includes(item.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                              {expandedFamilies.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          ) : <div className="w-7 print-hidden"></div>}
                          
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 print:hidden ${item.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : 'bg-white text-emerald-600 dark:bg-gray-800'}`}>
                            {item.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={20} /> : <UserIcon size={20} />}
                          </div>
                          
                          <div>
                            <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{item.name}</p>
                            <div className="flex gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              <span>{item.nationalId}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 print-hidden"></span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.gender === Gender.MALE ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900' : 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900'}`}>
                              {item.gender === Gender.MALE ? 'ذكر' : 'أنثى'}
                           </span>
                           <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                             {calculateAge(item.birthDate)} سنة
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {item.categoryIds && item.categoryIds.length > 0 ? (
                            item.categoryIds.map(catId => (
                              <span key={catId} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 print:border-gray-300 print:text-black print:bg-transparent">
                                {categories.find(c => c.id === catId)?.name || 'غير معروف'}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400">لا يوجد تصنيف</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold font-mono text-gray-600 dark:text-gray-300">
                        {item.phone || '-'}
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-gray-400">
                         {regions.find(r => r.id === item.regionId)?.name}
                      </td>
                      <td className="px-6 py-5 flex justify-center gap-2 print-hidden">
                         <button onClick={() => handleOpenModal(item.type, item.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Edit3 size={18} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: item.id })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
                      </td>
                    </tr>

                    {/* Children Rows (Members) */}
                    {(expandedFamilies.includes(item.id) || window.matchMedia('print').matches) && item.children.map((child, idx) => {
                      const isLast = idx === item.children.length - 1;
                      return (
                        <tr key={child.id} className="bg-gray-50/50 dark:bg-gray-900/20 print:bg-transparent">
                          <td className="px-8 py-0 relative">
                            {/* Connector Lines Logic - Hide in Print */}
                            <div className="absolute right-[50px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 h-full print-hidden"></div> 
                            <div className="absolute right-[50px] top-1/2 w-8 h-px bg-gray-200 dark:bg-gray-700 print-hidden"></div> 
                            
                            {isLast && <div className="absolute right-[50px] top-1/2 bottom-0 w-1 bg-gray-50 dark:bg-gray-900/20 z-10 print-hidden"></div>} 

                            <div className="pr-16 py-3 flex items-center gap-3 relative z-20 print:pr-8">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 shadow-sm print-hidden">
                                <Baby size={14} />
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{child.name}</p>
                                 <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5 font-mono">
                                   <span>{child.nationalId}</span>
                                 </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                             <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${child.gender === Gender.MALE ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900' : 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900'}`}>
                                  {child.gender === Gender.MALE ? 'ذكر' : 'أنثى'}
                               </span>
                               <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                                 {calculateAge(child.birthDate)} سنة
                               </span>
                             </div>
                          </td>
                          <td className="px-6 py-3">
                            {/* Categories for child - usually same as parent or specific */}
                             <div className="flex flex-wrap gap-1">
                              {child.categoryIds && child.categoryIds.length > 0 ? (
                                child.categoryIds.map(catId => (
                                  <span key={catId} className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-70">
                                    {categories.find(c => c.id === catId)?.name || 'غير معروف'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-400 font-mono">-</td>
                          <td className="px-6 py-3 text-xs text-gray-400">{regions.find(r => r.id === child.regionId)?.name}</td>
                          <td className="px-6 py-3 flex justify-center gap-2 print-hidden">
                             <button onClick={() => handleOpenModal(child.type, child.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit3 size={16} /></button>
                             <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: child.id })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                // --- TABLE VIEW RENDERING ---
                filteredBeneficiaries.map(b => (
                   <tr key={b.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Similar columns to Tree View parent but flat */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700 print:hidden ${b.type === BeneficiaryType.FAMILY_HEAD ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' : b.type === BeneficiaryType.FAMILY_MEMBER ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' : 'bg-white text-emerald-600 dark:bg-gray-800'}`}>
                            {b.type === BeneficiaryType.FAMILY_HEAD ? <UsersIcon size={20} /> : b.type === BeneficiaryType.FAMILY_MEMBER ? <Baby size={20} /> : <UserIcon size={20} />}
                          </div>
                          <div>
                            <p className="font-black text-gray-800 dark:text-gray-200 text-sm">{b.name}</p>
                            <div className="flex gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              <span>{b.nationalId}</span>
                              <span className="print-hidden">• {b.type}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${b.gender === Gender.MALE ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900' : 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-900'}`}>
                              {b.gender === Gender.MALE ? 'ذكر' : 'أنثى'}
                           </span>
                           <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                             {calculateAge(b.birthDate)} سنة
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {b.categoryIds && b.categoryIds.length > 0 ? (
                            b.categoryIds.map(catId => (
                              <span key={catId} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                                {categories.find(c => c.id === catId)?.name || 'غير معروف'}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400">لا يوجد تصنيف</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold font-mono text-gray-600 dark:text-gray-300">
                        {b.phone || '-'}
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-gray-400">
                         {regions.find(r => r.id === b.regionId)?.name}
                      </td>
                      <td className="px-6 py-5 flex justify-center gap-2 print-hidden">
                         <button onClick={() => handleOpenModal(b.type, b.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Edit3 size={18} /></button>
                         <button onClick={() => setConfirmModal({ isOpen: true, mode: 'single', id: b.id })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
                      </td>
                   </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!isTreeView && filteredBeneficiaries.length === 0 && (
            <div className="p-10 text-center text-gray-400 font-bold">لا توجد نتائج مطابقة للبحث</div>
          )}
          
          {isTreeView && treeData.length === 0 && (
             <div className="p-10 text-center text-gray-400 font-bold">لا توجد بيانات للعرض</div>
          )}
        </div>
      </div>

      {/* MODAL for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-2xl p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                 {editId ? <Edit3 className="text-blue-500" /> : <Plus className="text-emerald-500" />}
                 <span>{editId ? 'تعديل بيانات' : 'إضافة مستفيد جديد'}</span>
                 <span className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-gray-500 font-bold">{modalType}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Basic Info */}
               <div className="space-y-4">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">البيانات الشخصية</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">الاسم رباعي</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="الاسم كما في البطاقة" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">الرقم القومي (14 رقم)</label>
                    <input type="text" maxLength={14} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-mono font-bold" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} placeholder="2900101..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">تاريخ الميلاد</label>
                      <input type="date" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">الجنس</label>
                      <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                        <option value={Gender.MALE}>ذكر</option>
                        <option value={Gender.FEMALE}>أنثى</option>
                      </select>
                    </div>
                  </div>
               </div>

               {/* Contact & Location */}
               <div className="space-y-4">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">بيانات الاتصال والسكن</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">رقم الهاتف</label>
                    <input type="tel" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-mono font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01xxxxxxxxx" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">العنوان بالتفصيل</label>
                    <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="اسم الشارع، رقم المنزل..." />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">المنطقة الجغرافية</label>
                    <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.regionId} onChange={e => setFormData({...formData, regionId: e.target.value})}>
                      <option value="">اختر المنطقة...</option>
                      {branchRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
               </div>

               {/* Classification & Family Link */}
               <div className="md:col-span-2 space-y-4">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">التصنيف والعلاقات</h4>
                  
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 px-1">تصنيفات الحالة (يمكن اختيار أكثر من واحد)</label>
                    <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700 max-h-32 overflow-y-auto custom-scrollbar">
                      {categories.map(cat => {
                        const isSelected = formData.categoryIds.includes(cat.id);
                        return (
                          <div 
                            key={cat.id} 
                            onClick={() => toggleFormCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 select-none ${
                              isSelected 
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400'
                            }`}
                          >
                             {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                             {cat.name}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Family Head Search (Only for Family Member) */}
                  {modalType === BeneficiaryType.FAMILY_MEMBER && (
                    <div className="relative" ref={searchContainerRef}>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 px-1">رب الأسرة التابع له</label>
                      
                      {/* If selected, show selected card */}
                      {selectedFamilyHead ? (
                        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                                <UsersIcon size={20} />
                             </div>
                             <div>
                               <p className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">{selectedFamilyHead.name}</p>
                               <p className="text-xs text-indigo-500 dark:text-indigo-400 font-mono">{selectedFamilyHead.nationalId}</p>
                             </div>
                          </div>
                          <button onClick={() => setFormData({...formData, familyId: ''})} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={18} /></button>
                        </div>
                      ) : (
                        // Search Input
                        <div>
                          <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              type="text" 
                              className="w-full pr-12 pl-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold"
                              placeholder="ابحث عن رب الأسرة بالاسم أو الرقم القومي..."
                              value={familySearchTerm}
                              onChange={(e) => {
                                setFamilySearchTerm(e.target.value);
                                setShowFamilyResults(true);
                              }}
                              onFocus={() => setShowFamilyResults(true)}
                            />
                          </div>
                          {/* Results Dropdown */}
                          {showFamilyResults && familySearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-30 max-h-48 overflow-y-auto custom-scrollbar">
                               {familySearchResults.map(head => (
                                 <div 
                                   key={head.id} 
                                   onClick={() => {
                                     setFormData({...formData, familyId: head.id});
                                     setFamilySearchTerm('');
                                     setShowFamilyResults(false);
                                   }}
                                   className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-none flex justify-between items-center"
                                 >
                                    <div>
                                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{head.name}</p>
                                      <p className="text-xs text-gray-400 font-mono">{head.nationalId}</p>
                                    </div>
                                    <CornerDownLeft size={16} className="text-gray-300" />
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
               </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transform hover:-translate-y-1 transition-all">
                {editId ? 'حفظ التعديلات' : 'إضافة المستفيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={executeDelete}
        title={confirmModal.mode === 'bulk' ? 'حذف متعدد' : 'حذف مستفيد'}
        message={confirmModal.mode === 'bulk' 
          ? `هل أنت متأكد من حذف ${selectedIds.length} مستفيدين؟ لا يمكن التراجع عن هذا الإجراء.` 
          : "هل أنت متأكد من حذف هذا المستفيد؟ إذا كان رب أسرة سيتم حذف التابعين أيضاً."}
      />
    </div>
  );
};

export default Beneficiaries;