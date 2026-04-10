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

export interface Sponsor {
  id: string;
  name: string;
  phone: string;
  branchId: string; // Linked Branch
  amount: number;
  frequency: 'شهري' | 'سنوي' | 'مرة واحدة';
  status: 'نشط' | 'متوقف';
  startDate: string;
  notes?: string;
  createdAt: string;
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

// --- Initial Defaults ---
const INITIAL_PRINT_SETTINGS: PrintSettings = {
  title: 'الجمعية الشرعية الرئيسية',
  subtitle: 'لتعاون العاملين بالكتاب والسنة المحمدية',
  footerLeft: 'توقيع مدير الفرع',
  footerRight: 'توقيع الموظف المختص',
  showDate: true,
  showUser: true,
  showBranch: true
};

interface StoreContextType {
  branches: Branch[];
  regions: Region[];
  users: User[];
  beneficiaries: Beneficiary[];
  categories: BeneficiaryCategory[];
  healthConditions: HealthCondition[];
  sponsors: Sponsor[];
  logs: AuditLog[];
  isDarkMode: boolean;
  printSettings: PrintSettings;
  isLoading: boolean;
  setBranches: (data: Branch[]) => Promise<void>;
  setRegions: (data: Region[]) => Promise<void>;
  saveUsers: (data: User[]) => Promise<void>;
  setBeneficiaries: (data: Beneficiary[]) => Promise<void>;
  setCategories: (data: BeneficiaryCategory[]) => Promise<void>;
  setHealthConditions: (data: HealthCondition[]) => Promise<void>;
  setSponsors: (data: Sponsor[]) => Promise<void>;
  addLog: (user: User, action: string, entityType: string, entityId: string) => Promise<void>;
  toggleDarkMode: () => void;
  resetToSeedData: () => void;
  setPrintSettings: (settings: PrintSettings) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranchesState] = useState<Branch[]>([]);
  const [regions, setRegionsState] = useState<Region[]>([]);
  const [users, setUsersState] = useState<User[]>([]);
  const [beneficiaries, setBeneficiariesState] = useState<Beneficiary[]>([]);
  const [categories, setCategoriesState] = useState<BeneficiaryCategory[]>([]);
  const [healthConditions, setHealthConditionsState] = useState<HealthCondition[]>([]);
  const [sponsors, setSponsorsState] = useState<Sponsor[]>([]);
  const [logs, setLogsState] = useState<AuditLog[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [printSettings, setPrintSettingsState] = useState<PrintSettings>(INITIAL_PRINT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Test connection first
        const healthRes = await fetch('/api/health');
        if (!healthRes.ok) throw new Error('API Health check failed');

        const fetchTable = async (table: string) => {
          const res = await fetch(`/api/${table}`);
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Failed to fetch ${table}`);
          }
          return res.json();
        };

        const [b, r, u, ben, cat, hc, sp, l] = await Promise.all([
          fetchTable('branches'),
          fetchTable('regions'),
          fetchTable('users'),
          fetchTable('beneficiaries'),
          fetchTable('categories'),
          fetchTable('health_conditions'),
          fetchTable('sponsors'),
          fetchTable('audit_logs')
        ]);

        const psRes = await fetch('/api/settings/print');
        const ps = psRes.ok ? await psRes.json() : null;

        if (b && !b.error) setBranchesState(b);
        if (r && !r.error) setRegionsState(r);
        if (u && !u.error) setUsersState(u);
        if (ben && !ben.error) setBeneficiariesState(ben);
        if (cat && !cat.error) setCategoriesState(cat);
        if (hc && !hc.error) setHealthConditionsState(hc);
        if (sp && !sp.error) setSponsorsState(sp);
        if (l && !l.error) setLogsState(l);
        if (ps && !ps.error) setPrintSettingsState(ps);

      } catch (error) {
        console.error('Error fetching data from API:', error);
        // We no longer fallback to seed data to ensure data integrity with the DB
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const apiUpsert = async (table: string, data: any) => {
    try {
      await fetch(`/api/${table}/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error(`API Error (upsert ${table}):`, err);
    }
  };

  const setBranches = async (data: Branch[]) => {
    setBranchesState(data);
    localStorage.setItem('branches', JSON.stringify(data));
    await apiUpsert('branches', data);
  };

  const setRegions = async (data: Region[]) => {
    setRegionsState(data);
    localStorage.setItem('regions', JSON.stringify(data));
    await apiUpsert('regions', data);
  };

  const saveUsers = async (data: User[]) => {
    setUsersState(data);
    localStorage.setItem('users', JSON.stringify(data));
    await apiUpsert('users', data);
  };

  const setBeneficiaries = async (data: Beneficiary[]) => {
    setBeneficiariesState(data);
    localStorage.setItem('beneficiaries', JSON.stringify(data));
    await apiUpsert('beneficiaries', data);
  };

  const setCategories = async (data: BeneficiaryCategory[]) => {
    setCategoriesState(data);
    localStorage.setItem('categories', JSON.stringify(data));
    await apiUpsert('categories', data);
  };

  const setHealthConditions = async (data: HealthCondition[]) => {
    setHealthConditionsState(data);
    localStorage.setItem('healthConditions', JSON.stringify(data));
    await apiUpsert('health_conditions', data);
  };

  const setSponsors = async (data: Sponsor[]) => {
    setSponsorsState(data);
    localStorage.setItem('sponsors', JSON.stringify(data));
    await apiUpsert('sponsors', data);
  };

  const addLog = async (user: User, action: string, entityType: string, entityId: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2, 11),
      userId: user.id,
      userName: user.name,
      action: action,
      entityType: entityType,
      entityId: entityId,
      timestamp: new Date().toISOString()
    };
    setLogsState((prev) => [newLog, ...prev]);
    try {
      await fetch('/api/audit_logs/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    } catch (err) {
      console.error('API Error (log):', err);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const setPrintSettings = async (settings: PrintSettings) => {
    setPrintSettingsState(settings);
    localStorage.setItem('print_settings', JSON.stringify(settings));
    await apiUpsert('print_settings', { id: 'default', ...settings });
  };

  const resetToSeedData = () => {
    // This now only clears local cache; data remains in Supabase
    localStorage.clear();
    window.location.reload();
  };

  return (
    <StoreContext.Provider value={{
      branches, regions, users, beneficiaries, categories, healthConditions, sponsors, logs, isDarkMode, printSettings, isLoading,
      setBranches, setRegions, saveUsers, setBeneficiaries, setCategories, setHealthConditions, setSponsors, addLog, toggleDarkMode, resetToSeedData, setPrintSettings
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