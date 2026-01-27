import React, { useMemo } from 'react';
import { useStore, User, Role, BeneficiaryType, BeneficiaryStatus } from '../store.tsx';
import { BarChart3, PieChart, TrendingUp, Users, Printer, MapPin } from 'lucide-react';

const Reports: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, branches, regions } = useStore();
  
  const isAdmin = user.role === Role.ADMIN;
  
  const visibleBeneficiaries = useMemo(() => {
    return isAdmin ? beneficiaries : beneficiaries.filter(b => b.branchId === user.branchId);
  }, [beneficiaries, user.branchId, isAdmin]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
  };

  const reportData = useMemo(() => {
    const counts = {
      total: visibleBeneficiaries.length,
      types: {
        individual: 0,
        familyHead: 0,
        familyMember: 0
      },
      status: {
        active: 0,
        suspended: 0
      },
      ageGroups: {
        child: 0, // 0-18
        adult: 0, // 19-60
        elderly: 0 // 61+
      },
      branchPerformance: {} as { [key: string]: number }
    };

    visibleBeneficiaries.forEach(b => {
      if (b.type === BeneficiaryType.INDIVIDUAL) counts.types.individual++;
      if (b.type === BeneficiaryType.FAMILY_HEAD) counts.types.familyHead++;
      if (b.type === BeneficiaryType.FAMILY_MEMBER) counts.types.familyMember++;

      if (b.status === BeneficiaryStatus.ACTIVE) counts.status.active++;
      if (b.status === BeneficiaryStatus.SUSPENDED) counts.status.suspended++;

      const age = calculateAge(b.birthDate);
      if (age <= 18) counts.ageGroups.child++;
      else if (age <= 60) counts.ageGroups.adult++;
      else counts.ageGroups.elderly++;

      const branchName = branches.find(br => br.id === b.branchId)?.name || 'غير معروف';
      counts.branchPerformance[branchName] = (counts.branchPerformance[branchName] || 0) + 1;
    });

    return counts;
  }, [visibleBeneficiaries, branches]);

  const handlePrint = () => {
    window.print();
  };

  const ProgressBar = ({ label, value, max, colorClass }: { label: string, value: number, max: number, colorClass: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-500 font-bold">{value} ({Math.round(percentage)}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">التقارير والتحليلات</h1>
          <p className="text-gray-500">إحصائيات دقيقة عن نشاط الجمعية والمستفيدين</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-bold text-gray-700"
        >
          <Printer size={18} />
          <span>طباعة التقرير</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard icon={<Users className="text-blue-600" />} label="إجمالي المستفيدين" value={reportData.total} color="border-blue-200" />
        <ReportCard icon={<TrendingUp className="text-emerald-600" />} label="حالات نشطة" value={reportData.status.active} color="border-emerald-200" />
        <ReportCard icon={<PieChart className="text-purple-600" />} label="رب أسرة" value={reportData.types.familyHead} color="border-purple-200" />
        <ReportCard icon={<MapPin className="text-orange-600" />} label="أفراد أسر" value={reportData.types.familyMember} color="border-orange-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <BarChart3 className="text-emerald-600" size={24} />
            <h3 className="font-bold text-lg">توزيع أنواع المستفيدين</h3>
          </div>
          <div className="space-y-4">
            <ProgressBar label="أفراد مستقليين" value={reportData.types.individual} max={reportData.total} colorClass="bg-blue-500" />
            <ProgressBar label="أرباب أسر" value={reportData.types.familyHead} max={reportData.total} colorClass="bg-indigo-500" />
            <ProgressBar label="أفراد تابعين لأسر" value={reportData.types.familyMember} max={reportData.total} colorClass="bg-purple-500" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Users className="text-indigo-600" size={24} />
            <h3 className="font-bold text-lg">الفئات العمرية</h3>
          </div>
          <div className="space-y-4">
            <ProgressBar label="أطفال (0 - 18 سنة)" value={reportData.ageGroups.child} max={reportData.total} colorClass="bg-emerald-500" />
            <ProgressBar label="بالغين (19 - 60 سنة)" value={reportData.ageGroups.adult} max={reportData.total} colorClass="bg-blue-500" />
            <ProgressBar label="كبار السن (61+ سنة)" value={reportData.ageGroups.elderly} max={reportData.total} colorClass="bg-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border ${color} flex items-center gap-5 transition hover:shadow-md`}>
    <div className="p-4 bg-gray-50 rounded-xl">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500 font-bold mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-800">{value}</p>
    </div>
  </div>
);

export default Reports;