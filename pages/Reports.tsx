import React, { useMemo } from 'react';
import { useStore, User, Role, BeneficiaryType, BeneficiaryStatus } from '../CharityStore';
import { BarChart3, PieChart, TrendingUp, Users, Printer, MapPin, Tag } from 'lucide-react';

const ProgressBar: React.FC<{ label: string, value: number, max: number, colorClass: string }> = ({ label, value, max, colorClass }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400 font-bold">{value} ({Math.round(percentage)}%)</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const Reports: React.FC<{ user: User }> = ({ user }) => {
  const { beneficiaries, branches, categories, printSettings } = useStore();
  
  const isAdmin = user.role === Role.ADMIN;
  const branchName = branches.find(b => b.id === user.branchId)?.name || "الإدارة العامة";
  
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
      ageGroups: { child: 0, adult: 0, elderly: 0 }
    };

    visibleBeneficiaries.forEach(b => {
      if (b.type === BeneficiaryType.INDIVIDUAL) counts.types.individual++;
      if (b.type === BeneficiaryType.FAMILY_HEAD) counts.types.familyHead++;
      if (b.type === BeneficiaryType.FAMILY_MEMBER) counts.types.familyMember++;

      if (b.status === BeneficiaryStatus.ACTIVE) counts.status.active++;
      else counts.status.suspended++;

      if (b.categoryIds && b.categoryIds.length > 0) {
        b.categoryIds.forEach(catId => {
          const catName = categories.find(c => c.id === catId)?.name || 'غير مصنف';
          counts.categories[catName] = (counts.categories[catName] || 0) + 1;
        });
      } else {
        const catName = 'غير مصنف';
        counts.categories[catName] = (counts.categories[catName] || 0) + 1;
      }

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
      
      {/* --- Optimized Compact Print Header (No Logo) --- */}
      <div className="hidden print:flex flex-row justify-between items-center mb-1 border-b border-black pb-1">
        <div className="text-right">
           <h2 className="text-sm font-black">{printSettings.title}</h2>
           <p className="text-[10px] font-bold">{printSettings.subtitle}</p>
        </div>
        <div className="text-center">
           <h3 className="text-base font-black underline decoration-1 underline-offset-2">التقرير الإحصائي</h3>
        </div>
        <div className="text-left font-bold text-[9px] leading-tight">
           {printSettings.showBranch && <div>فرع: {branchName}</div>}
           {printSettings.showDate && <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>}
           {printSettings.showUser && <div>المستخدم: {user.name}</div>}
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ReportCard icon={<Users className="text-blue-600 dark:text-blue-400" />} label="إجمالي المستفيدين" value={reportData.total} color="border-blue-200 dark:border-blue-900/50" />
        <ReportCard icon={<TrendingUp className="text-emerald-600 dark:text-emerald-400" />} label="حالات نشطة" value={reportData.status.active} color="border-emerald-200 dark:border-emerald-900/50" />
        <ReportCard icon={<Users className="text-purple-600 dark:text-purple-400" />} label="أرباب أسر" value={reportData.types.familyHead} color="border-purple-200 dark:border-purple-900/50" />
        <ReportCard icon={<Tag className="text-orange-600 dark:text-orange-400" />} label="أفراد تابعين" value={reportData.types.familyMember} color="border-orange-200 dark:border-orange-900/50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 print:border print:border-black print:rounded-none print:shadow-none print:p-4">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 pb-4 print:border-black">
            <BarChart3 className="text-emerald-600 dark:text-emerald-500 print:text-black" size={24} />
            <h3 className="font-bold text-lg dark:text-white print:text-black">توزيع الحالات حسب التصنيف</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(reportData.categories).map(([name, count]) => (
              <ProgressBar key={name} label={name} value={count as number} max={reportData.total} colorClass="bg-emerald-500 print:bg-black" />
            ))}
            {Object.keys(reportData.categories).length === 0 && <p className="text-center text-gray-400 py-4">لا توجد بيانات كافية</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 print:border print:border-black print:rounded-none print:shadow-none print:p-4">
          <div className="flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 pb-4 print:border-black">
            <PieChart className="text-indigo-600 dark:text-indigo-500 print:text-black" size={24} />
            <h3 className="font-bold text-lg dark:text-white print:text-black">الفئات العمرية</h3>
          </div>
          <div className="space-y-5">
            <ProgressBar label="أطفال (أقل من 18)" value={reportData.ageGroups.child} max={reportData.total} colorClass="bg-blue-500 print:bg-black" />
            <ProgressBar label="بالغين (18 - 60)" value={reportData.ageGroups.adult} max={reportData.total} colorClass="bg-indigo-500 print:bg-black" />
            <ProgressBar label="كبار السن (أكثر من 60)" value={reportData.ageGroups.elderly} max={reportData.total} colorClass="bg-purple-500 print:bg-black" />
          </div>
          <div className="pt-4 border-t border-gray-50 dark:border-gray-700 print:border-black">
             <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 print:text-black">
                <span>إجمالي المسجلين</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 print:text-black">{reportData.total} مستفيد</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border ${color} dark:border-gray-700 flex items-center gap-5 transition hover:shadow-md print:border print:border-black print:rounded-none print:shadow-none print:p-2`}>
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl shrink-0 print:hidden">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-gray-400 dark:text-gray-400 font-bold mb-1 uppercase tracking-wider print:text-black">{label}</p>
      <p className="text-2xl font-black text-gray-800 dark:text-white leading-none print:text-black">{value}</p>
    </div>
  </div>
);

export default Reports;