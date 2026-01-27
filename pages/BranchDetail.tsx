import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Role, User } from '../CharityStore';
import { ArrowRight, Building2, Users, UserCircle, MapPin, Calendar } from 'lucide-react';

const BranchDetail: React.FC<{ user: User }> = ({ user: currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branches, users, beneficiaries, regions, isDarkMode } = useStore();

  const branch = branches.find(b => b.id === id);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!branch) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">عذراً، الفرع غير موجود</h2>
        <button onClick={() => navigate('/branches')} className="mt-4 text-emerald-600 dark:text-emerald-400 font-bold underline">العودة لقائمة الفروع</button>
      </div>
    );
  }

  const branchUsers = users.filter(u => u.branchId === branch.id);
  const branchBeneficiaries = beneficiaries.filter(b => b.branchId === branch.id);
  const branchRegions = regions.filter(r => r.branchId === branch.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/branches')}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{branch.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <MapPin size={16} /> {branch.location}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-2 text-emerald-600 dark:text-emerald-400">
            <Users size={20} />
            <span className="font-bold">إجمالي المستفيدين</span>
          </div>
          <p className="text-3xl font-black dark:text-white">{branchBeneficiaries.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-2 text-indigo-600 dark:text-indigo-400">
            <UserCircle size={20} />
            <span className="font-bold">الموظفين</span>
          </div>
          <p className="text-3xl font-black dark:text-white">{branchUsers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-2 text-orange-600 dark:text-orange-400">
            <MapPin size={20} />
            <span className="font-bold">المناطق المسجلة</span>
          </div>
          <p className="text-3xl font-black dark:text-white">{branchRegions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 font-bold flex items-center gap-2 dark:text-white">
            <UserCircle size={18} /> قائمة الموظفين
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {branchUsers.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.role}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-400 dark:text-gray-500">{u.username}</span>
              </div>
            ))}
            {branchUsers.length === 0 && <p className="p-8 text-center text-gray-400">لا يوجد موظفين في هذا الفرع</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 font-bold flex items-center gap-2 dark:text-white">
            <Users size={18} /> آخر المستفيدين المضافين
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {branchBeneficiaries.slice(-5).reverse().map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{b.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.type} - {b.phone || 'بدون هاتف'}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{regions.find(r => r.id === b.regionId)?.name || '---'}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(b.createdAt)}</p>
                </div>
              </div>
            ))}
            {branchBeneficiaries.length === 0 && <p className="p-8 text-center text-gray-400">لا يوجد مستفيدين في هذا الفرع</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetail;