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
  name: string; // مثال: فقير، يتيم، ذوي احتياجات خاصة
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
  categoryId?: string; // تصنيف الحالة
  familyId?: string; // لربط الفرد برب الأسرة
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

// --- Initial Mock Data ---
const INITIAL_CATEGORIES: BeneficiaryCategory[] = [
  { id: 'cat1', name: 'فقير' },
  { id: 'cat2', name: 'يتيم' },
  { id: 'cat3', name: 'أرملة' },
  { id: 'cat4', name: 'ذوي احتياجات خاصة' },
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'الفرع الرئيسي', location: 'القاهرة', createdAt: new Date().toISOString() },
  { id: 'b2', name: 'فرع الجيزة', location: 'الجيزة', createdAt: new Date().toISOString() },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'مدير النظام العام', username: 'admin', password: '123', role: Role.ADMIN, branchId: 'b1', isFirstLogin: false },
];

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
    return item ? JSON.parse(item) : [];
  });
  const [users, setUsersState] = useState<User[]>(() => {
    const item = localStorage.getItem('users');
    return item ? JSON.parse(item) : INITIAL_USERS;
  });
  const [beneficiaries, setBeneficiariesState] = useState<Beneficiary[]>(() => {
    const item = localStorage.getItem('beneficiaries');
    return item ? JSON.parse(item) : [];
  });
  const [categories, setCategoriesState] = useState<BeneficiaryCategory[]>(() => {
    const item = localStorage.getItem('categories');
    return item ? JSON.parse(item) : INITIAL_CATEGORIES;
  });
  const [logs, setLogsState] = useState<AuditLog[]>(() => {
    const item = localStorage.getItem('audit_logs');
    return item ? JSON.parse(item) : [];
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