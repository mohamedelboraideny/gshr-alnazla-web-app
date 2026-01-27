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

export enum BeneficiaryType {
  INDIVIDUAL = 'فرد مستقل',
  FAMILY_HEAD = 'رب أسرة',
  FAMILY_MEMBER = 'فرد تابع لأسرة'
}

export interface BeneficiaryCategory {
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
  regionId?: string;
  branchId: string;
  status: BeneficiaryStatus;
  type: BeneficiaryType;
  categoryId?: string;
  familyId?: string;
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

// --- Large Seed Data Generation ---
const INITIAL_CATEGORIES: BeneficiaryCategory[] = [
  { id: 'cat1', name: 'فقير' },
  { id: 'cat2', name: 'يتيم' },
  { id: 'cat3', name: 'أرملة' },
  { id: 'cat4', name: 'ذوي احتياجات خاصة' },
  { id: 'cat5', name: 'غارمين' },
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

const generateMockBeneficiaries = (): Beneficiary[] => {
  const data: Beneficiary[] = [];
  const names = ['محمد', 'أحمد', 'محمود', 'علي', 'إبراهيم', 'مصطفى', 'ياسين', 'ليلى', 'فاطمة', 'زينب', 'هدى', 'عبير', 'خالد', 'عمر', 'سعيد', 'كريم', 'نورهان', 'منى', 'يوسف', 'عبد الله'];
  const lastNames = ['الشافعي', 'السيد', 'العدوي', 'منصور', 'كامل', 'جلال', 'عبد النبي', 'غنيم', 'راضي', 'نجم', 'الفيومي', 'القاضي', 'العربي'];
  
  // 1. Create 20 Family Heads (distributed across 5 branches)
  for (let i = 0; i < 20; i++) {
    const headId = `head_${i+1}`;
    const branch = INITIAL_BRANCHES[i % 5];
    const region = INITIAL_REGIONS.find(r => r.branchId === branch.id) || INITIAL_REGIONS[0];
    const categoryId = INITIAL_CATEGORIES[i % 5].id;
    const address = `شارع ${i * 2 + 1}، بلوك ${i + 1}`;
    const createdAt = new Date(Date.now() - (i * 86400000)).toISOString();

    const headName = `${names[i % names.length]} ${lastNames[i % lastNames.length]} ${lastNames[(i+1) % lastNames.length]}`;

    const head: Beneficiary = {
      id: headId,
      name: headName,
      nationalId: `2900101010${1000 + i}`,
      phone: `010203040${i < 10 ? '0' + i : i}`,
      address: address,
      birthDate: '1975-06-12',
      branchId: branch.id,
      regionId: region.id,
      status: BeneficiaryStatus.ACTIVE,
      type: BeneficiaryType.FAMILY_HEAD,
      categoryId: categoryId,
      createdAt: createdAt
    };
    data.push(head);

    // 2. Add 3 Members for each Family (60 members)
    for (let j = 1; j <= 3; j++) {
      data.push({
        id: `member_${i}_${j}`,
        // Use a different first name + Head's first name as father name
        name: `${names[(i + j + 5) % names.length]} ${headName.split(' ')[0]}`,
        nationalId: `3100101010${2000 + (i * 10) + j}`,
        phone: '',
        address: address, // Inherit address
        birthDate: '2010-01-01',
        branchId: branch.id,
        regionId: region.id,
        status: BeneficiaryStatus.ACTIVE,
        type: BeneficiaryType.FAMILY_MEMBER,
        categoryId: categoryId, // Inherit category
        familyId: headId,
        createdAt: createdAt
      });
    }
  }

  // 3. Add 20 Independent Individuals
  for (let i = 0; i < 20; i++) {
    const branch = INITIAL_BRANCHES[i % 5];
    const region = INITIAL_REGIONS.find(r => r.branchId === branch.id) || INITIAL_REGIONS[0];
    data.push({
      id: `ind_${i+1}`,
      name: `${names[(i + 10) % names.length]} ${lastNames[(i + 5) % lastNames.length]} (مستقل)`,
      nationalId: `2850101010${3000 + i}`,
      phone: `011122233${i < 10 ? '0' + i : i}`,
      address: `منطقة سكنية عشوائية ${i + 1}`,
      birthDate: '1988-04-20',
      branchId: branch.id,
      regionId: region.id,
      status: BeneficiaryStatus.ACTIVE,
      type: BeneficiaryType.INDIVIDUAL,
      categoryId: INITIAL_CATEGORIES[(i + 2) % 5].id,
      createdAt: new Date(Date.now() - (i * 3600000)).toISOString()
    });
  }

  return data;
};

const INITIAL_BENEFICIARIES = generateMockBeneficiaries();

// --- Store Context & Provider ---
interface StoreContextType {
  branches: Branch[];
  regions: Region[];
  users: User[];
  beneficiaries: Beneficiary[];
  categories: BeneficiaryCategory[];
  logs: AuditLog[];
  isDarkMode: boolean;
  setBranches: (data: Branch[]) => void;
  setRegions: (data: Region[]) => void;
  saveUsers: (data: User[]) => void;
  setBeneficiaries: (data: Beneficiary[]) => void;
  setCategories: (data: BeneficiaryCategory[]) => void;
  addLog: (user: User, action: string, entityType: string, entityId: string) => void;
  toggleDarkMode: () => void;
  resetToSeedData: () => void;
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
  const [logs, setLogsState] = useState<AuditLog[]>(() => {
    const item = localStorage.getItem('audit_logs');
    return item ? JSON.parse(item) : [
      { id: 'l1', userId: 'u1', userName: 'أحمد الإدريسي', action: 'تسجيل دخول', entityType: 'النظام', entityId: '-', timestamp: new Date().toISOString() },
    ];
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
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

  const resetToSeedData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <StoreContext.Provider value={{
      branches, regions, users, beneficiaries, categories, logs, isDarkMode,
      setBranches, setRegions, saveUsers, setBeneficiaries, setCategories, addLog, toggleDarkMode, resetToSeedData
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