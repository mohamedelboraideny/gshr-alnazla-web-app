
import React, { useMemo } from 'react';
import { useStore, User, Role, BeneficiaryType, BeneficiaryStatus } from '../store.tsx';
import { BarChart3, PieChart, TrendingUp, Users, Printer, MapPin, Tag } from 'lucide-react';

// ProgressBar defined as a separate functional component with React.FC to handle the key prop correctly in lists.
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

  const reportData = useMemo(() => {
    const counts = {
      total: visibleBeneficiaries.length,
      types: { individual: 0, familyHead: 0, familyMember: 0 },
      status: { active: 0, suspended: 0 },
      categories: {} as { [key: string]: number },
      ageGroups: { child: 0, adult: 0, elderly: 0 }
    };

    visibleBeneficiaries.forEach(b => {
      if (b.type === BeneficiaryType.INDIVIDUAL) counts.types.individual++;
      if (b.type === BeneficiaryType.FAMILY_HEAD) counts.types.familyHead++;
      if (b.type === BeneficiaryType.FAMILY_MEMBER) counts.types.familyMember++;

      if (b.status === BeneficiaryStatus.ACTIVE) counts.status.active++;
      else counts.status.suspended++;

      const catName = categories.find(c => c.id === b.categoryId)?.name || 'غير مصنف';
      counts.categories[catName] = (counts.categories[catName] || 0) + 1;

      const age = calculateAge(b.birthDate);
      if (age <= 18) counts.ageGroups.child++;
      else if (age <= 60) counts.ageGroups.adult++;
      else counts.ageGroups.elderly++;
    });

    return counts;
  }, [visibleBeneficiaries, categories]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print-area">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">التقارير الإحصائية</h1>
          <p className="text-gray-500 dark:text-gray-400">تحليل البيانات الديموغرافية والاجتماعية للمستفيدين</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 font-bold"
        >
          <Printer size={18} />
          <span>طباعة هذا التقرير</span>
        </button>
      </div>

      {/* Header for Print Only */}
      <div className="hidden print:block border-b-2 border-emerald-600 pb-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-emerald-800">تقرير بيانات الجمعية الخيرية</h1>
            <p className="text-sm text-gray-500 mt-1">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">قصر النزلة للأرشفة الرقمية</p>
            <p className="text-xs text-gray-400">{isAdmin ? 'الإدارة العامة' : 'تقرير الفرع الخاص'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard icon={<Users className="text-blue-600" />} label="إجمالي المستفيدين" value={reportData.total} color="border-blue-200" />
        <ReportCard icon={<TrendingUp className="text-emerald-600" />} label="حالات نشطة" value={reportData.status.active} color="border-emerald-200" />
        <ReportCard icon={<Users className="text-purple-600" />} label="أرباب أسر" value={reportData.types.familyHead} color="border-purple-200" />
        <ReportCard icon={<Tag className="text-orange-600" />} label="أفراد تابعين" value={reportData.types.familyMember} color="border-orange-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 pb-4">
            <BarChart3 className="text-emerald-600" size={24} />
            <h3 className="font-bold text-lg dark:text-white">توزيع الحالات حسب التصنيف</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(reportData.categories).map(([name, count]) => (
              // Fix: Cast 'count' to number to resolve 'unknown' type inference from Object.entries in some environments
              <ProgressBar key={name} label={name} value={count as number} max={reportData.total} colorClass="bg-emerald-500" />
            ))}
            {Object.keys(reportData.categories).length === 0 && <p className="text-center text-gray-400 py-4">لا توجد بيانات كافية</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 pb-4">
            <PieChart className="text-indigo-600" size={24} />
            <h3 className="font-bold text-lg dark:text-white">الفئات العمرية</h3>
          </div>
          <div className="space-y-5">
            <ProgressBar label="أطفال (أقل من 18)" value={reportData.ageGroups.child} max={reportData.total} colorClass="bg-blue-500" />
            <ProgressBar label="بالغين (18 - 60)" value={reportData.ageGroups.adult} max={reportData.total} colorClass="bg-indigo-500" />
            <ProgressBar label="كبار السن (أكثر من 60)" value={reportData.ageGroups.elderly} max={reportData.total} colorClass="bg-purple-500" />
          </div>
          <div className="pt-4 border-t border-gray-50 dark:border-gray-700">
             <div className="flex justify-between items-center text-xs text-gray-500">
                <span>إجمالي المسجلين</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{reportData.total} مستفيد</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border ${color} dark:border-gray-700 flex items-center gap-5 transition hover:shadow-md`}>
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">{value}</p>
    </div>
  </div>
);

export default Reports;
