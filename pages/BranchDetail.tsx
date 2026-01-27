import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Role, User } from '../store.tsx';
import { ArrowRight, Building2, Users, UserCircle, MapPin, Calendar } from 'lucide-react';

const BranchDetail: React.FC<{ user: User }> = ({ user: currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { branches, users, beneficiaries, regions } = useStore();

  const branch = branches.find(b => b.id === id);
  if (!branch) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">عذراً، الفرع غير موجود</h2>
        <button onClick={() => navigate('/branches')} className="mt-4 text-emerald-600 font-bold underline">العودة لقائمة الفروع</button>
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
          className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{branch.name}</h1>
          <p className="text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={16} /> {branch.location}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-2 text-emerald-600">
            <Users size={20} />
            <span className="font-bold">إجمالي المستفيدين</span>
          </div>
          <p className="text-3xl font-black">{branchBeneficiaries.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-2 text-indigo-600">
            <UserCircle size={20} />
            <span className="font-bold">الموظفين</span>
          </div>
          <p className="text-3xl font-black">{branchUsers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-2 text-orange-600">
            <MapPin size={20} />
            <span className="font-bold">المناطق المسجلة</span>
          </div>
          <p className="text-3xl font-black">{branchRegions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold flex items-center gap-2">
            <UserCircle size={18} /> قائمة الموظفين
          </div>
          <div className="divide-y divide-gray-100">
            {branchUsers.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-400">{u.username}</span>
              </div>
            ))}
            {branchUsers.length === 0 && <p className="p-8 text-center text-gray-400">لا يوجد موظفين في هذا الفرع</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b font-bold flex items-center gap-2">
            <Users size={18} /> آخر المستفيدين المضافين
          </div>
          <div className="divide-y divide-gray-100">
            {branchBeneficiaries.slice(-5).reverse().map(b => (
              <div key={b.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.type} - {b.phone || 'بدون هاتف'}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-emerald-600 font-bold">{regions.find(r => r.id === b.regionId)?.name || '---'}</p>
                  <p className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString('ar-EG')}</p>
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