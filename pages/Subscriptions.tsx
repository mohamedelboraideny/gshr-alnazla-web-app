import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useStore, User, Role, supabase, Sponsor } from '../CharityStore';
import { SubscriptionService } from '../services/subscriptionService';
import { Plus, Search, FileText, CheckCircle, X, ChevronRight, ChevronLeft, HeartHandshake, Edit3, Trash2, Printer } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Subscriptions: React.FC<{ user: User }> = ({ user }) => {
  const { sponsors, setSponsors, addLog, branches, printSettings } = useStore();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 20;

  const isAdmin = user.role === Role.ADMIN;
  const branchName = branches.find(b => b.id === user.branchId)?.name || "الإدارة العامة";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Subscriptions
  const fetchKey = ['subscriptions', page, limit, debouncedSearch, isAdmin ? '' : user.branchId];
  const { data, error, mutate } = useSWR(fetchKey, async () => {
    return await SubscriptionService.getPaginated(page, limit, {
      searchTerm: debouncedSearch.length >= 3 ? debouncedSearch : '',
      branchId: isAdmin ? '' : user.branchId
    });
  });

  const subscriptions = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('');
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paidMonth: new Date().toISOString().slice(0, 7),
    bookNumber: '',
    paymentReceiptNumber: '',
    checkNumber: '',
    depositNumber: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{book: number, receipt: number} | null>(null);

  // Filter sponsors for dropdown based on branch and search
  const availableSponsors = sponsors.filter(s => isAdmin || s.branchId === user.branchId);
  const filteredSponsors = availableSponsors.filter(s => s.name.includes(sponsorSearch));

  const handleSponsorSelect = (id: string) => {
    setSelectedSponsorId(id);
    const sponsor = sponsors.find(s => s.id === id);
    if (sponsor) {
      setFormData(prev => ({ ...prev, amount: sponsor.amount }));
      setSponsorSearch(sponsor.name);
    }
    setIsDropdownOpen(false);
  };

  const handleOpenModal = () => {
    setEditId(null);
    setSelectedSponsorId('');
    setSponsorSearch('');
    setFormData({
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paidMonth: new Date().toISOString().slice(0, 7),
      bookNumber: '',
      paymentReceiptNumber: '',
      checkNumber: '',
      depositNumber: '',
      notes: ''
    });
    setSuccess(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (sub: any) => {
    setEditId(sub.id);
    setSelectedSponsorId(sub.sponsor_id);
    setSponsorSearch(sub.sponsors?.name || '');
    setFormData({
      amount: sub.amount,
      paymentDate: sub.payment_date,
      paidMonth: sub.paid_month,
      bookNumber: sub.book_number.toString(),
      paymentReceiptNumber: sub.payment_receipt_number || '',
      checkNumber: sub.check_number || '',
      depositNumber: sub.deposit_number || '',
      notes: sub.notes || ''
    });
    setSuccess(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (confirmModal.id) {
      try {
        if (!supabase) throw new Error('Supabase not initialized');
        await supabase.from('sponsor_subscriptions').delete().eq('id', confirmModal.id);
        addLog(user, 'حذف', 'اشتراك', confirmModal.id);
        mutate();
      } catch (err) {
        console.error('Error deleting subscription:', err);
      } finally {
        setConfirmModal({ isOpen: false, id: null });
      }
    }
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleSave = async () => {
    if (!selectedSponsorId) {
      setErrors({ sponsorId: 'يجب اختيار الكفيل' });
      return;
    }
    if (formData.amount <= 0) {
      setErrors({ amount: 'يجب إدخال مبلغ صحيح' });
      return;
    }
    if (!formData.paidMonth) {
      setErrors({ paidMonth: 'يجب تحديد الشهر' });
      return;
    }

    if (!formData.bookNumber) {
      setErrors({ bookNumber: 'يجب إدخال رقم الدفتر' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (!supabase) throw new Error('Supabase not initialized');

      if (editId) {
        const { error: updateError } = await supabase.from('sponsor_subscriptions').update({
          amount: formData.amount,
          payment_date: formData.paymentDate,
          paid_month: formData.paidMonth,
          book_number: parseInt(formData.bookNumber),
          payment_receipt_number: formData.paymentReceiptNumber || null,
          check_number: formData.checkNumber || null,
          deposit_number: formData.depositNumber || null,
          notes: formData.notes
        }).eq('id', editId);
        
        if (updateError) throw updateError;
        
        addLog(user, 'تعديل', 'اشتراك', editId);
        mutate();
        setIsModalOpen(false);
        return;
      }

      const { data: result, error: rpcError } = await supabase.rpc('add_sponsor_subscription', {
        p_sponsor_id: selectedSponsorId,
        p_amount: formData.amount,
        p_payment_date: formData.paymentDate,
        p_paid_month: formData.paidMonth,
        p_notes: formData.notes,
        p_user_id: user.id,
        p_book_number: parseInt(formData.bookNumber),
        p_payment_receipt_number: formData.paymentReceiptNumber || null,
        p_check_number: formData.checkNumber || null,
        p_deposit_number: formData.depositNumber || null
      });

      if (rpcError) throw rpcError;

      if (result && result.success) {
        setSuccess({ book: result.book_number, receipt: result.receipt_number });
        
        // Update local sponsor state
        setSponsors(sponsors.map(s => 
          s.id === selectedSponsorId ? { ...s, lastPaidMonth: formData.paidMonth } : s
        ));
        
        addLog(user, 'إضافة اشتراك', 'كفيل', `رقم الدفتر: ${result.book_number}, إيصال: ${result.receipt_number}`);
        
        // Refresh table
        mutate();

        // Close modal after 3 seconds
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(null);
        }, 3000);
      } else {
        throw new Error(result?.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error adding subscription:', err);
      setErrors({ submit: 'حدث خطأ أثناء حفظ الاشتراك' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="hidden print:flex flex-row justify-between items-center mb-1 border-b border-black pb-1">
        <div className="text-right">
           <h2 className="text-sm font-black">{printSettings.title}</h2>
           <p className="text-[10px] font-bold">{printSettings.subtitle}</p>
        </div>
        <div className="text-center">
           <h3 className="text-base font-black underline decoration-1 underline-offset-2">سجل الاشتراكات</h3>
        </div>
        <div className="text-left font-bold text-[9px] leading-tight">
           {printSettings.showBranch && <div>فرع: {branchName}</div>}
           {printSettings.showDate && <div>التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>}
           {printSettings.showUser && <div>المستخدم: {user.name}</div>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print-hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">سجل الاشتراكات</h1>
          <p className="text-gray-500 dark:text-gray-400">متابعة وتسجيل مدفوعات الكفلاء</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handlePrint} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-gray-200 transition">
             <Printer size={18} /> طباعة
           </button>
           <button onClick={handleOpenModal} className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition">
             <Plus size={18} /> إضافة اشتراك جديد
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden print:border-none print:shadow-none print:rounded-none">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-4 print-hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث باسم الكفيل (3 أحرف على الأقل)..." 
              className="w-full pr-12 pl-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible max-h-[60vh] overflow-y-auto relative">
          <table className="w-full text-right">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-700/90 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100 dark:border-gray-700 print:bg-gray-200 print:text-black">
                <th className="px-4 py-4 print:text-black">تاريخ الدفع</th>
                <th className="px-4 py-4 print:text-black">اسم الكفيل</th>
                <th className="px-4 py-4 print:text-black">المبلغ</th>
                <th className="px-4 py-4 print:text-black">عن شهر</th>
                <th className="px-4 py-4 print:text-black">رقم الدفتر</th>
                <th className="px-4 py-4 print:text-black">رقم القسيمة</th>
                <th className="px-4 py-4 print:text-black">قسيمة الدفع</th>
                <th className="px-4 py-4 print:text-black">رقم الشيك</th>
                <th className="px-4 py-4 print:text-black">رقم الإيداع</th>
                <th className="px-4 py-4 print:text-black">ملاحظات</th>
                <th className="px-4 py-4 text-center print-hidden">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {subscriptions.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group print:bg-white">
                  <td className="px-4 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 print:text-black">
                     {new Date(sub.payment_date).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <p className="font-bold text-gray-800 dark:text-white text-xs print:text-black">{sub.sponsors?.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                     <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs print:text-black">{sub.amount.toLocaleString()} ج.م</span>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
                     {sub.paid_month}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 print:text-black">
                     {sub.book_number}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 print:text-black">
                     {sub.receipt_number}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 print:text-black">
                     {sub.payment_receipt_number || '-'}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 print:text-black">
                     {sub.check_number || '-'}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 print:text-black">
                     {sub.deposit_number || '-'}
                  </td>
                  <td className="px-4 py-4 text-[10px] text-gray-500 dark:text-gray-400 print:text-black max-w-[150px] truncate">
                     {sub.notes || '-'}
                  </td>
                  <td className="px-4 py-4 print-hidden">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleEdit(sub)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"><Edit3 size={16} /></button>
                       <button onClick={() => setConfirmModal({ isOpen: true, id: sub.id })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && !error && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400">لا توجد اشتراكات مطابقة للبحث</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-red-500">حدث خطأ أثناء جلب البيانات</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between print-hidden">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
              إجمالي السجلات: {totalCount}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronRight size={18} />
              </button>
              <span className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                {page + 1} / {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print-hidden">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                 <FileText className="text-emerald-500" size={24} />
                 {editId ? 'تعديل بيانات الاشتراك' : 'إضافة اشتراك جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {success ? (
                <div className="text-center py-8">
                  <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
                  <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">تم إضافة الاشتراك بنجاح</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 inline-block text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">رقم الدفتر: <span className="text-emerald-600">{success.book}</span></p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">رقم القسيمة: <span className="text-emerald-600">{success.receipt}</span></p>
                  </div>
                </div>
              ) : (
                <>
                  {errors.submit && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center">{errors.submit}</div>}

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                    <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                      <HeartHandshake size={16} className="text-emerald-500" />
                      بيانات الكفيل
                    </h4>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">ابحث عن الكفيل</label>
                      <div className="relative">
                        <input 
                          type="text"
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${errors.sponsorId ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold`}
                          placeholder="اكتب اسم الكفيل للبحث..."
                          value={sponsorSearch}
                          disabled={!!editId} // Disable changing sponsor during edit
                          onChange={e => {
                            setSponsorSearch(e.target.value);
                            setIsDropdownOpen(true);
                            if(e.target.value === '') setSelectedSponsorId('');
                          }}
                          onFocus={() => !editId && setIsDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        />
                        {isDropdownOpen && filteredSponsors.length > 0 && !editId && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filteredSponsors.map(s => (
                              <div 
                                key={s.id} 
                                className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                onClick={() => handleSponsorSelect(s.id)}
                              >
                                {s.name} <span className="text-emerald-600 dark:text-emerald-400 text-xs mr-2">({s.amount} ج.م)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.sponsorId && <p className="text-red-500 text-[10px] font-bold mt-1 mr-1">{errors.sponsorId}</p>}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                    <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-emerald-500" />
                      تفاصيل الدفع
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">المبلغ المدفوع (جنية)</label>
                        <input 
                          type="number" 
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold`}
                          value={formData.amount} 
                          onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                        />
                        {errors.amount && <p className="text-red-500 text-[10px] font-bold mt-1 mr-1">{errors.amount}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">الشهر المدفوع عنه</label>
                        <input 
                          type="month" 
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${errors.paidMonth ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold`}
                          value={formData.paidMonth} 
                          onChange={e => setFormData({...formData, paidMonth: e.target.value})} 
                        />
                        {errors.paidMonth && <p className="text-red-500 text-[10px] font-bold mt-1 mr-1">{errors.paidMonth}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">تاريخ الدفع</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" 
                          value={formData.paymentDate} 
                          onChange={e => setFormData({...formData, paymentDate: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                    <h4 className="text-sm font-black text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-emerald-500" />
                      أرقام الإيصالات (إلزامي إدخال رقم الدفتر)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">رقم الدفتر</label>
                        <input 
                          type="number" 
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${errors.bookNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold`}
                          value={formData.bookNumber} 
                          onChange={e => setFormData({...formData, bookNumber: e.target.value})} 
                        />
                        {errors.bookNumber && <p className="text-red-500 text-[10px] font-bold mt-1 mr-1">{errors.bookNumber}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">قسيمة الدفع</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" 
                          value={formData.paymentReceiptNumber} 
                          onChange={e => setFormData({...formData, paymentReceiptNumber: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">رقم الشيك</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" 
                          value={formData.checkNumber} 
                          onChange={e => setFormData({...formData, checkNumber: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">رقم الإيداع</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" 
                          value={formData.depositNumber} 
                          onChange={e => setFormData({...formData, depositNumber: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">ملاحظات إضافية</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold resize-none h-20" 
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})} 
                    ></textarea>
                  </div>
                </>
              )}
            </div>

            {!success && (
              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-black text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition">إلغاء</button>
                <button onClick={handleSave} disabled={loading} className="flex-1 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50">
                  {loading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="حذف الاشتراك"
        message="هل أنت متأكد من حذف هذا الاشتراك؟ لا يمكن التراجع عن هذه الخطوة."
      />
    </div>
  );
};

export default Subscriptions;
