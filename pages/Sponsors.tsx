import React, { useState, useMemo } from 'react';
import { useStore, User, Sponsor } from '../CharityStore';
import { Plus, Edit3, Trash2, X, Search, Phone, Coins, Calendar, FileText, HeartHandshake } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

const Sponsors: React.FC<{ user: User }> = ({ user }) => {
  const { sponsors, setSponsors, addLog } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<Sponsor, 'id' | 'createdAt'>>({
    name: '',
    phone: '',
    amount: 0,
    frequency: 'شهري',
    status: 'نشط',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const filteredSponsors = useMemo(() => {
    return sponsors.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.phone.includes(searchTerm)
    );
  }, [sponsors, searchTerm]);

  const handleOpenModal = (id: string | null = null) => {
    if (id) {
      const s = sponsors.find(x => x.id === id);
      if (s) {
        setFormData({ 
          name: s.name, 
          phone: s.phone, 
          amount: s.amount, 
          frequency: s.frequency, 
          status: s.status, 
          startDate: s.startDate, 
          notes: s.notes || '' 
        });
        setEditId(id);
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        amount: 0,
        frequency: 'شهري',
        status: 'نشط',
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setEditId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return alert('الاسم مطلوب');
    
    let updated: Sponsor[] = [];
    if (editId) {
      updated = sponsors.map(s => s.id === editId ? { ...s, ...formData } : s);
      addLog(user, 'تعديل', 'كفيل', editId);
    } else {
      const newId = 'sp_' + Math.random().toString(36).substring(2, 11);
      updated = [...sponsors, { ...formData, id: newId, createdAt: new Date().toISOString() }];
      addLog(user, 'إضافة', 'كفيل', newId);
    }
    setSponsors(updated);
    setIsModalOpen(false);
  };

  const executeDelete = () => {
    if (confirmModal.id) {
      setSponsors(sponsors.filter(s => s.id !== confirmModal.id));
      addLog(user, 'حذف', 'كفيل', confirmModal.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">إدارة الكفلاء</h1>
          <p className="text-gray-500 dark:text-gray-400">سجل بيانات المتبرعين والكفلاء وتفاصيل الكفالات</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition">
          <Plus size={18} /> تسجيل كفيل جديد
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث باسم الكفيل أو الهاتف..." 
              className="w-full pr-12 pl-4 py-2.5 bg-white dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/30 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4">اسم الكفيل</th>
                <th className="px-6 py-4">معلومات الاتصال</th>
                <th className="px-6 py-4">تفاصيل الكفالة</th>
                <th className="px-6 py-4">تاريخ البدء</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredSponsors.map(sponsor => (
                <tr key={sponsor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                          <HeartHandshake size={20} />
                       </div>
                       <p className="font-bold text-gray-800 dark:text-white text-sm">{sponsor.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs font-bold">
                       <Phone size={14} className="text-gray-400" />
                       <span dir="ltr">{sponsor.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col gap-1">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{sponsor.amount.toLocaleString()} ج.م</span>
                        <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded w-fit">{sponsor.frequency}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400">
                     {new Date(sponsor.startDate).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${sponsor.status === 'نشط' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {sponsor.status}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleOpenModal(sponsor.id)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition"><Edit3 size={16} /></button>
                       <button onClick={() => setConfirmModal({ isOpen: true, id: sponsor.id })} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSponsors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">لا توجد بيانات للكفلاء</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                 <HeartHandshake className="text-emerald-500" size={24} />
                 {editId ? 'تعديل بيانات كفيل' : 'إضافة كفيل جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="col-span-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">اسم الكفيل / المتبرع</label>
                   <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 
                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">رقم الهاتف</label>
                   <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold text-right" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="01xxxxxxxxx" />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">تاريخ بداية الكفالة</label>
                   <input type="date" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">مبلغ الكفالة (جنية)</label>
                   <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="number" className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">دورية الدفع</label>
                   <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})}>
                      <option value="شهري">شهري</option>
                      <option value="سنوي">سنوي</option>
                      <option value="مرة واحدة">مرة واحدة</option>
                   </select>
                 </div>

                 <div className="col-span-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">حالة الكفالة</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition ${formData.status === 'نشط' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 dark:border-gray-700'}`}>
                         <input type="radio" name="status" className="hidden" checked={formData.status === 'نشط'} onChange={() => setFormData({...formData, status: 'نشط'})} />
                         <span className="font-bold text-sm">نشط (مستمر)</span>
                      </label>
                      <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition ${formData.status === 'متوقف' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 dark:border-gray-700'}`}>
                         <input type="radio" name="status" className="hidden" checked={formData.status === 'متوقف'} onChange={() => setFormData({...formData, status: 'متوقف'})} />
                         <span className="font-bold text-sm">متوقف</span>
                      </label>
                   </div>
                 </div>

                 <div className="col-span-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">ملاحظات إضافية</label>
                   <textarea className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white text-sm font-bold resize-none h-24" placeholder="مثال: يفضل التواصل عبر الواتساب..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-black text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition">إلغاء</button>
              <button onClick={handleSave} className="flex-1 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="حذف الكفيل"
        message="هل أنت متأكد من حذف هذا الكفيل من السجلات؟"
      />
    </div>
  );
};

export default Sponsors;