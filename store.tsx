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
  INDIVIDUAL = 'فرد',
  FAMILY_HEAD = 'رب أسرة',
  FAMILY_MEMBER = 'فرد أسرة'
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
  familyId?: string;
  createdAt: string;
}

export interface Family {
  id: string;
  name: string;
  headId: string;
  branchId: string;
  membersCount: number;
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
const INITIAL_BRANCHES: Branch[] = [
  { id: 'b1', name: 'الفرع الرئيسي - القاهرة', location: 'القاهرة، مدينة نصر', createdAt: new Date().toISOString() },
  { id: 'b2', name: 'فرع الجيزة', location: 'الجيزة، الدقي', createdAt: new Date().toISOString() },
];

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'أحمد المسؤول', username: 'admin', password: '123', role: Role.ADMIN, branchId: 'b1' },
  { id: 'u2', name: 'محمد مدير الجيزة', username: 'manager', password: '123', role: Role.MANAGER, branchId: 'b2' },
  { id: 'u3', name: 'سارة موظفة القاهرة', username: 'staff', password: '123', role: Role.STAFF, branchId: 'b1' },
];

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  { 
    id: 'ben1', 
    name: 'محمود عبد الله', 
    nationalId: '12345678901234', 
    phone: '01011223344', 
    address: 'شارع 10، المعادي', 
    birthDate: '1985-05-15',
    branchId: 'b1', 
    regionId: '',
    status: BeneficiaryStatus.ACTIVE, 
    type: BeneficiaryType.INDIVIDUAL, 
    createdAt: new Date().toISOString() 
  },
];

// --- Store Context & Provider ---
interface StoreContextType {
  branches: Branch[];
  regions: Region[];
  users: User[];
  beneficiaries: Beneficiary[];
  families: Family[];
  logs: AuditLog[];
  setBranches: (data: Branch[]) => void;
  setRegions: (data: Region[]) => void;
  saveUsers: (data: User[]) => void;
  setBeneficiaries: (data: Beneficiary[]) => void;
  setFamilies: (data: Family[]) => void;
  addLog: (user: User, action: string, entityType: string, entityId: string) => void;
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
    return item ? JSON.parse(item) : INITIAL_BENEFICIARIES;
  });
  const [families, setFamiliesState] = useState<Family[]>(() => {
    const item = localStorage.getItem('families');
    return item ? JSON.parse(item) : [];
  });
  const [logs, setLogsState] = useState<AuditLog[]>(() => {
    const item = localStorage.getItem('audit_logs');
    return item ? JSON.parse(item) : [];
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

  const setFamilies = (data: Family[]) => {
    setFamiliesState(data);
    localStorage.setItem('families', JSON.stringify(data));
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

  return (
    <StoreContext.Provider value={{
      branches, regions, users, beneficiaries, families, logs,
      setBranches, setRegions, saveUsers, setBeneficiaries, setFamilies, addLog
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