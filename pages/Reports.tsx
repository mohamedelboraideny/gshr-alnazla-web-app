
import React, { useMemo } from 'react';
import { useStore, User, Role, BeneficiaryType, BeneficiaryStatus } from '../store.tsx';
import { BarChart3, PieChart, TrendingUp, Users, Printer, MapPin, Tag } from 'lucide-react';

const ProgressBar: React.FC<{ label: string, value: number, max: number, colorClass: string }> = ({ label, value, max, colorClass }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 font-bold">{value} ({Math.round(percentage)}%)</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const Reports: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, branches, categories } = useStore();
  
  const isAdmin = user.role === Role.ADMIN;
  
  const visibleBeneficiaries = useMemo(() => {
    return isAdmin ? beneficiaries : beneficiaries.filter(b => b.branchId === user.branchId);
  }, [beneficiaries, user.branchId, isAdmin]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    return age;
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const reportData = useMemo(() => {
    const counts = {
      total: visibleBeneficiaries.length,
      types: { individual: 0, familyHead: 0, familyMember: 0 },
      status: { active: 0, suspended: 0 },
      categories: {} as { [key: string]: number },