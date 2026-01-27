import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types & Enums ---
export enum Role {
  ADMIN = 'مدير النظام',
  MANAGER = 'مسؤول فرع',
  STAFF = 'عضو فرع'
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
  { id: 'b1', name: 'الفرع الرئيسي - القاهرة', location: 'القصر العيني، القاهرة', createdAt: '2023-01-01' },
  { id: 'b2', name: 'فرع الجيزة', location: 'شارع الهرم، الجيزة', createdAt: '2023-02-15' },
  { id: 'b3', name: 'فرع الإسكندرية', location: 'محطة الرمل، الإسكندرية', createdAt: '2023-03-10' },
  { id: 'b4', name: 'فرع أسوان', location: 'كورنيش النيل، أسوان', createdAt: '2023-05-20' },
  { id: 'b5', name: 'فرع طنطا', location: 'ميدان المحطة، طنطا', createdAt: '2023-06-01' },
];

const INITIAL_REGIONS: Region[] = [
  { id: 'r1', name: 'حي السيدة زينب', branchId: 'b1' },
  { id: 'r2', name: 'حي الدقي', branchId: 'b2' },
  { id: 'r3', name: 'منطقة سموحة', branchId: 'b3' },
  { id: 'r4', name: 'حي غرب طنطا', branchId: 'b5' },
  { id: 'r5', name: 'المنشية', branchId: 'b3' },
  { id: 'r6', name: 'فيصل', branchId: 'b2' },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'أحمد علي (المدير العام)', username: 'admin', password: '123', role: Role.ADMIN, branchId: 'b1', isFirstLogin: false },
  { id: 'u2', name: 'سارة محمود (مدير الجيزة)', username: 'manager_giza', password: '123', role: Role.MANAGER, branchId: 'b2', isFirstLogin: false },
  { id: 'u3', name: 'محمد حسن (موظف الإسكندرية)', username: 'staff_alex', password: '123', role: Role.STAFF, branchId: 'b3', isFirstLogin: false },
];

// Helper to generate 100 beneficiaries
const generateMockBeneficiaries = (): Beneficiary[] => {
  const data: Beneficiary[] = [];
  const names = ['محمد', 'أحمد', 'محمود', 'علي', 'إبراهيم', 'مصطفى', 'ياسين', 'ليلى', 'فاطمة', 'زينب', 'هدى', 'عبير', 'خالد', 'عمر', 'سعيد'];
  const lastNames = ['الشافعي', 'السيد', 'العدوي', 'منصور', 'كامل', 'جلال', 'عبد النبي', 'غنيم', 'راضي', 'نجم'];
  
  // Create 20 Family Heads first
  for (let i = 1; i <= 20; i++) {
    const headId = `head_${i}`;
    const branch = INITIAL_BRANCHES[i % 5];
    data.push({
      id: headId,
      name: `${names[i % names.length]} ${lastNames[i % lastNames.length]} (رب أسرة)`,
      nationalId: `2901010${1000000 + i}`,
      phone: `010203040${i < 10 ? '0' + i : i}`,
      address: `شارع رقم ${i}, الحي السكني`,
      birthDate: '1975-05-15',
      branchId: branch.id,
      regionId: INITIAL_REGIONS.find(r => r.branchId === branch.id)?.id || 'r1',
      status: BeneficiaryStatus.ACTIVE,
      type: BeneficiaryType.FAMILY_HEAD,
      categoryId: INITIAL_CATEGORIES[i % 5].id,
      createdAt: new Date().toISOString()
    });

    // Each family head has 3 members
    for (let j = 1; j <= 3; j++) {
      data.push({
        id: `member_${i}_${j}`,
        name: `${names[(i+j) % names.length]} ${data[data.length-1].name.split(' ')[0]}`,
        nationalId: `3101010${2000000 + (i * 10) + j}`,
        phone: '',
        address: data[data.length-1].address,
        birthDate: '2010-01-01',
        branchId: branch.id,
        regionId: data[data.length-1].regionId,
        status: BeneficiaryStatus.ACTIVE,
        type: BeneficiaryType.FAMILY_MEMBER,
        categoryId: INITIAL_CATEGORIES[i % 5].id,
        familyId: headId,
        createdAt: new Date().toISOString()
      });
    }
  }

  // Fill the rest with independent individuals to reach ~100
  for (let i = 81; i <= 100; i++) {
    const branch = INITIAL_BRANCHES[i % 5];
    data.push({
      id: `ind_${i}`,
      name: `${names[i % names.length]} ${lastNames[i % lastNames.length]} (مستقل)`,
      nationalId: `2851010${3000000 + i}`,
      phone: `011506070${i}`,
      address: `منطقة عشوائية ${i}`,
      birthDate: '1985-08-10',
      branchId: branch.id,
      regionId: INITIAL_REGIONS.find(r => r.branchId === branch.id)?.id || 'r1',
      status: BeneficiaryStatus.ACTIVE,
      type: BeneficiaryType.INDIVIDUAL,
      categoryId: INITIAL_CATEGORIES[i % 5].id,
      createdAt: new Date().toISOString()
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
      { id: 'l1', userId: 'u1', userName: 'أحمد علي', action: 'تسجيل دخول', entityType: 'نظام', entityId: '-', timestamp: new Date().toISOString() },
      { id: 'l2', userId: 'u1', userName: 'أحمد علي', action: 'إضافة', entityType: 'مستفيد', entityId: 'head_1', timestamp: new Date(Date.now() - 3600000).toISOString() }
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

  return (
    <StoreContext.Provider value={{
      branches, regions, users, beneficiaries, categories, logs, isDarkMode,
      setBranches, setRegions, saveUsers, setBeneficiaries, setCategories, addLog, toggleDarkMode
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