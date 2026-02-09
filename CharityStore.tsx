import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types & Enums ---
export enum Role {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff'
}

export enum BeneficiaryStatus {
  ACTIVE = 'نشط',
  SUSPENDED = 'موقوف'
}

export enum SponsorshipStatus {
  SPONSORED = 'مكفول',
  NOT_SPONSORED = 'غير مكفول'
}

export enum Gender {
  MALE = 'ذكر',
  FEMALE = 'أنثى'
}

export enum BeneficiaryType {
  INDIVIDUAL = 'فرد مستقل',
  FAMILY_HEAD = 'رب أسرة',
  FAMILY_MEMBER = 'فرد تابع لأسرة'
}

// Educational Levels
export const EDUCATION_LEVELS = [
  'غير ملتحق',
  'حضانة 1 (KG1)',
  'حضانة 2 (KG2)',
  'ابتدائي - الصف الأول',
  'ابتدائي - الصف الثاني',
  'ابتدائي - الصف الثالث',
  'ابتدائي - الصف الرابع',
  'ابتدائي - الصف الخامس',
  'ابتدائي - الصف السادس',
  'إعدادي - الصف الأول',
  'إعدادي - الصف الثاني',
  'إعدادي - الصف الثالث',
  'ثانوي - الصف الأول',
  'ثانوي - الصف الثاني',
  'ثانوي - الصف الثالث',
  'جامعي - سنة أولى',
  'جامعي - سنة ثانية',
  'جامعي - سنة ثالثة',
  'جامعي - سنة رابعة',
  'جامعي - سنة خامسة',
  'جامعي - سنة سادسة',
  'خريج'
];

// Kinship Relations
export const KINSHIP_RELATIONS = [
  'زوج / زوجة',
  'ابن / ابنة',
  'أخ / أخت',
  'والد / والدة',
  'حفيد / حفيدة',
  'جد / جدة',
  'قرابة أخرى'
];

export interface BeneficiaryCategory {
  id: string;
  name: string;
}

export interface HealthCondition {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  createdAt: string;
}

export interface Region {
  id: string;
  name: string;
  branchId: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  branchId: string;
  isFirstLogin?: boolean;
}

export interface Beneficiary {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  address: string;
  birthDate: string;
  gender?: Gender; 
  regionId?: string;
  branchId: string;
  status: BeneficiaryStatus;
  sponsorshipStatus: SponsorshipStatus;
  type: BeneficiaryType;
  categoryIds: string[]; 
  familyId?: string;
  kinshipRelation?: string; 
  healthConditions?: string[]; // Stores names of conditions
  educationLevel?: string;
  schoolName?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
}

export interface PrintSettings {
  title: string;
  subtitle: string;
  footerLeft: string;
  footerRight: string;
  showDate: boolean;
  showUser: boolean;
  showBranch: boolean;
}

// --- Seed Data Generation ---
const INITIAL_CATEGORIES: BeneficiaryCategory[] = [
  { id: 'cat1', name: 'فقراء' },
  { id: 'cat2', name: 'أيتام' },
  { id: 'cat3', name: 'أرملة' },
  { id: 'cat4', name: 'ذوي احتياجات خاصة' },
  { id: 'cat5', name: 'غارمين' },
  { id: 'cat6', name: 'مطلقة' },
  { id: 'cat7', name: 'مرضى' },
];

const INITIAL_HEALTH_CONDITIONS: HealthCondition[] = [
  { id: 'hc1', name: 'بتر في الساقين' },
  { id: 'hc2', name: 'بتر في اليدين' },
  { id: 'hc3', name: 'شلل أطفال' },
  { id: 'hc4', name: 'شلل نصفي' },
  { id: 'hc5', name: 'شلل رباعي' },
  { id: 'hc6', name: 'كفيف / ضعف بصر شديد' },
  { id: 'hc7', name: 'صمم / بكم' },
  { id: 'hc8', name: 'ضمور عضلات' },
  { id: 'hc9', name: 'تخلف عقلي' },
  { id: 'hc10', name: 'مرض قلب مزمن' },
  { id: 'hc11', name: 'فشل كلوي' },
  { id: 'hc12', name: 'أورام سرطانية' },
  { id: 'hc13', name: 'مرض مناعي' },
  { id: 'hc14', name: 'سليم صحياً' }
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'المركز الرئيسي - القاهرة', location: 'وسط البلد، القاهرة', createdAt: '2023-01-01' },
  { id: 'b2', name: 'فرع الجيزة', location: 'الدقي، الجيزة', createdAt: '2023-02-15' },
  { id: 'b3', name: 'فرع الإسكندرية', location: 'سموحة، الإسكندرية', createdAt: '2023-03-10' },
  { id: 'b4', name: 'فرع أسوان', location: 'أسوان الجديدة', createdAt: '2023-05-20' },
  { id: 'b5', name: 'فرع طنطا', location: 'ميدان المحطة، طنطا', createdAt: '2023-06-01' },
];

const INITIAL_REGIONS: Region[] = [
  { id: 'r1', name: 'السيدة زينب', branchId: 'b1' },
  { id: 'r2', name: 'الحسين', branchId: 'b1' },
  { id: 'r3', name: 'العجوزة', branchId: 'b2' },
  { id: 'r4', name: 'فيصل', branchId: 'b2' },
  { id: 'r5', name: 'المنتزة', branchId: 'b3' },
  { id: 'r6', name: 'سيدي بشر', branchId: 'b3' },
  { id: 'r7', name: 'حي الصداقة', branchId: 'b4' },
  { id: 'r8', name: 'سيجر', branchId: 'b5' },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'أحمد الإدريسي', username: 'admin', password: '123', role: Role.ADMIN, branchId: 'b1', isFirstLogin: false },
  { id: 'u2', name: 'سناء يوسف', username: 'manager', password: '123', role: Role.MANAGER, branchId: 'b2', isFirstLogin: false },
  { id: 'u3', name: 'ياسر كمال', username: 'staff', password: '123', role: Role.STAFF, branchId: 'b3', isFirstLogin: false },
];

const INITIAL_PRINT_SETTINGS: PrintSettings = {
  title: 'الجمعية الشرعية الرئيسية',
  subtitle: 'لتعاون العاملين بالكتاب والسنة المحمدية',
  footerLeft: 'توقيع مدير الفرع',
  footerRight: 'توقيع الموظف المختص',
  showDate: true,
  showUser: true,
  showBranch: true
};

const generateMockBeneficiaries = (): Beneficiary[] => {
  const data: Beneficiary[] = [];
  const firstNames = ['محمد', 'أحمد', 'محمود', 'علي', 'إبراهيم', 'مصطفى', 'ياسين', 'يوسف', 'عبد الله', 'خالد', 'عمر', 'سعيد', 'كريم', 'حسن', 'حسين'];
  const femaleNames = ['فاطمة', 'زينب', 'مريم', 'عائشة', 'نور', 'سلمى', 'هبة', 'منى', 'سارة', 'هدى'];
  const lastNames = ['الشافعي', 'السيد', 'العدوي', 'منصور', 'كامل', 'جلال', 'عبد النبي', 'غنيم', 'راضي', 'نجم', 'الفيومي', 'القاضي', 'العربي', 'سالم', 'صلاح'];

  const rnd = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const rndCondition = () => INITIAL_HEALTH_CONDITIONS[Math.floor(Math.random() * INITIAL_HEALTH_CONDITIONS.length)].name;
  
  // 1. Create 25 Family Heads (distributed across branches)
  for (let i = 0; i < 25; i++) {
    const headId = `head_${i+1}`;
    const branch = INITIAL_BRANCHES[i % INITIAL_BRANCHES.length];
    const region = INITIAL_REGIONS.find(r => r.branchId === branch.id) || INITIAL_REGIONS[0];
    
    // Assign 1 or 2 categories
    const cat1 = INITIAL_CATEGORIES[i % INITIAL_CATEGORIES.length].id;
    const cat2 = INITIAL_CATEGORIES[(i + 2) % INITIAL_CATEGORIES.length].id;
    const categoryIds = i % 3 === 0 ? [cat1, cat2] : [cat1];

    const address = `شارع ${rnd(['التحرير', 'النصر', 'الجمهورية', 'الثورة', 'النيل'])}، رقم ${Math.floor(Math.random() * 50) + 1}`;
    
    const firstName = rnd(firstNames);
    const fatherName = rnd(firstNames);
    const grandFatherName = rnd(firstNames);
    const familyName = rnd(lastNames);
    const headName = `${firstName} ${fatherName} ${grandFatherName} ${familyName}`;

    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
    const status = Math.random() > 0.1 ? BeneficiaryStatus.ACTIVE : BeneficiaryStatus.SUSPENDED;

    const hasHealthIssue = Math.random() > 0.7;
    const healthConditions = hasHealthIssue ? [rndCondition()] : [];

    // Create Head
    data.push({
      id: headId,
      name: headName,
      nationalId: `2${Math.floor(70 + Math.random() * 20)}0101${10000 + i}`,
      phone: `010${Math.floor(Math.random() * 100000000)}`,
      address: address,
      birthDate: `${1970 + Math.floor(Math.random() * 20)}-05-15`,
      gender: Gender.MALE,
      branchId: branch.id,
      regionId: region.id,
      status: status,
      sponsorshipStatus: SponsorshipStatus.NOT_SPONSORED,
      type: BeneficiaryType.FAMILY_HEAD,
      categoryIds: categoryIds,
      healthConditions: healthConditions,
      createdAt: createdAt
    });

    // 2. Add 2-5 Members for each Family
    const numMembers = Math.floor(Math.random() * 4) + 2; 
    for (let j = 1; j <= numMembers; j++) {
      const isFemale = Math.random() > 0.5;
      const childFirstName = isFemale ? rnd(femaleNames) : rnd(firstNames);
      const childName = `${childFirstName} ${firstName} ${fatherName} ${familyName}`;
      
      const birthYear = 2005 + Math.floor(Math.random() * 15);
      
      // Determine Relation
      let relation = 'ابن / ابنة';
      if (j === 1 && isFemale && birthYear < 1990) relation = 'زوج / زوجة';

      const childHealthConditions = Math.random() > 0.8 ? [rndCondition()] : [];

      data.push({
        id: `mem_${i}_${j}`,
        name: childName,
        nationalId: `3${birthYear.toString().substring(2)}0101${20000 + (i*100) + j}`,
        phone: '', 
        address: address,
        birthDate: `${birthYear}-01-01`,
        gender: isFemale ? Gender.FEMALE : Gender.MALE,
        branchId: branch.id,
        regionId: region.id,
        status: status, 
        sponsorshipStatus: Math.random() > 0.7 ? SponsorshipStatus.SPONSORED : SponsorshipStatus.NOT_SPONSORED,
        type: BeneficiaryType.FAMILY_MEMBER,
        categoryIds: categoryIds, 
        familyId: headId,
        kinshipRelation: relation,
        healthConditions: childHealthConditions,
        educationLevel: rnd(EDUCATION_LEVELS),
        createdAt: createdAt
      });
    }
  }

  // 3. Add 15 Independent Individuals
  for (let i = 0; i < 15; i++) {
    const branch = INITIAL_BRANCHES[i % INITIAL_BRANCHES.length];
    const region = INITIAL_REGIONS.find(r => r.branchId === branch.id) || INITIAL_REGIONS[0];
    const catId = INITIAL_CATEGORIES[Math.floor(Math.random() * INITIAL_CATEGORIES.length)].id;
    
    const firstName = rnd(firstNames);
    const fatherName = rnd(firstNames);
    const familyName = rnd(lastNames);
    const name = `${firstName} ${fatherName} ${familyName}`;
    const status = Math.random() > 0.2 ? BeneficiaryStatus.ACTIVE : BeneficiaryStatus.SUSPENDED;
    const indHealthConditions = Math.random() > 0.6 ? [rndCondition()] : [];

    data.push({
      id: `ind_${i+1}`,
      name: name,
      nationalId: `2850909${30000 + i}`,
      phone: `012${Math.floor(Math.random() * 100000000)}`,
      address: `منطقة ${region.name}، شارع جانبي`,
      birthDate: '1985-09-09',
      gender: Gender.MALE,
      branchId: branch.id,
      regionId: region.id,
      status: status,
      sponsorshipStatus: Math.random() > 0.5 ? SponsorshipStatus.SPONSORED : SponsorshipStatus.NOT_SPONSORED,
      type: BeneficiaryType.INDIVIDUAL,
      categoryIds: [catId],
      healthConditions: indHealthConditions,
      educationLevel: rnd(EDUCATION_LEVELS),
      createdAt: new Date().toISOString()
    });
  }

  return data;
};

const INITIAL_BENEFICIARIES = generateMockBeneficiaries();

interface StoreContextType {
  branches: Branch[];
  regions: Region[];
  users: User[];
  beneficiaries: Beneficiary[];
  categories: BeneficiaryCategory[];
  healthConditions: HealthCondition[];
  logs: AuditLog[];
  isDarkMode: boolean;
  printSettings: PrintSettings;
  setBranches: (data: Branch[]) => void;
  setRegions: (data: Region[]) => void;
  saveUsers: (data: User[]) => void;
  setBeneficiaries: (data: Beneficiary[]) => void;
  setCategories: (data: BeneficiaryCategory[]) => void;
  setHealthConditions: (data: HealthCondition[]) => void;
  addLog: (user: User, action: string, entityType: string, entityId: string) => void;
  toggleDarkMode: () => void;
  resetToSeedData: () => void;
  setPrintSettings: (settings: PrintSettings) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranchesState] = useState<Branch[]>(() => {
    const item = localStorage.getItem('branches');
    return item ? JSON.parse(item) : INITIAL_BRANCHES;
  });
  const [regions, setRegionsState] = useState<Region[]>(() => {
    const item = localStorage.getItem('regions');
    return item ? JSON.parse(item) : INITIAL_REGIONS;
  });
  const [users, setUsersState] = useState<User[]>(() => {
    const item = localStorage.getItem('users');
    return item ? JSON.parse(item) : INITIAL_USERS;
  });
  const [beneficiaries, setBeneficiariesState] = useState<Beneficiary[]>(() => {
    const item = localStorage.getItem('beneficiaries');
    return item ? JSON.parse(item) : INITIAL_BENEFICIARIES;
  });
  const [categories, setCategoriesState] = useState<BeneficiaryCategory[]>(() => {
    const item = localStorage.getItem('categories');
    return item ? JSON.parse(item) : INITIAL_CATEGORIES;
  });
  const [healthConditions, setHealthConditionsState] = useState<HealthCondition[]>(() => {
    const item = localStorage.getItem('healthConditions');
    return item ? JSON.parse(item) : INITIAL_HEALTH_CONDITIONS;
  });
  const [logs, setLogsState] = useState<AuditLog[]>(() => {
    const item = localStorage.getItem('audit_logs');
    return item ? JSON.parse(item) : [];
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [printSettings, setPrintSettingsState] = useState<PrintSettings>(() => {
    const item = localStorage.getItem('print_settings');
    return item ? JSON.parse(item) : INITIAL_PRINT_SETTINGS;
  });

  const setBranches = (data: Branch[]) => {
    setBranchesState(data);
    localStorage.setItem('branches', JSON.stringify(data));
  };

  const setRegions = (data: Region[]) => {
    setRegionsState(data);
    localStorage.setItem('regions', JSON.stringify(data));
  };

  const saveUsers = (data: User[]) => {
    setUsersState(data);
    localStorage.setItem('users', JSON.stringify(data));
  };

  const setBeneficiaries = (data: Beneficiary[]) => {
    setBeneficiariesState(data);
    localStorage.setItem('beneficiaries', JSON.stringify(data));
  };

  const setCategories = (data: BeneficiaryCategory[]) => {
    setCategoriesState(data);
    localStorage.setItem('categories', JSON.stringify(data));
  };

  const setHealthConditions = (data: HealthCondition[]) => {
    setHealthConditionsState(data);
    localStorage.setItem('healthConditions', JSON.stringify(data));
  };

  const addLog = (user: User, action: string, entityType: string, entityId: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2, 11),
      userId: user.id,
      userName: user.name,
      action: action,
      entityType: entityType,
      entityId: entityId,
      timestamp: new Date().toISOString()
    };
    setLogsState((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const setPrintSettings = (settings: PrintSettings) => {
    setPrintSettingsState(settings);
    localStorage.setItem('print_settings', JSON.stringify(settings));
  };

  const resetToSeedData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <StoreContext.Provider value={{
      branches, regions, users, beneficiaries, categories, healthConditions, logs, isDarkMode, printSettings,
      setBranches, setRegions, saveUsers, setBeneficiaries, setCategories, setHealthConditions, addLog, toggleDarkMode, resetToSeedData, setPrintSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};