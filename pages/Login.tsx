import React, { useState } from 'react';
import { useStore, User } from '../store.tsx';
import { LogIn, Lock, User as UserIcon, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { users, saveUsers } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'change_password'>('login');
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.isFirstLogin) {
        setTempUser(user);
        setStep('change_password');
      } else {
        onLogin(user);
      }
    } else {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 رموز على الأقل');
      return;
    }
    if (tempUser) {
      const updatedUsers = users.map(u => 
        u.id === tempUser.id ? { ...u, password: newPassword, isFirstLogin: false } : u
      );
      saveUsers(updatedUsers);
      onLogin({ ...tempUser, password: newPassword, isFirstLogin: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-800 transition-all">
        
        <div className="bg-emerald-600 p-10 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-md">
            {step === 'login' ? <LogIn size={32} /> : <KeyRound size={32} />}
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {step === 'login' ? 'بوابة الجمعية' : 'تأمين الحساب'}
          </h1>
          <p className="text-emerald-100 text-[10px] mt-2 font-bold uppercase tracking-widest opacity-70">
            {step === 'login' ? 'Charity Management Portal' : 'Update Default Password'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs border border-red-100 dark:border-red-900/30 mb-6 animate-pulse">
              <AlertCircle size={18} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">اسم المستخدم</label>
                <div className="relative">
                  <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text" required
                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm font-bold shadow-sm"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="password" required
                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm font-bold shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:shadow-emerald-700/40 transition-all active:scale-95 text-sm mt-4"
              >
                دخول للنظام
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-[11px] text-blue-600 dark:text-blue-400 flex gap-3 mb-2 border border-blue-100 dark:border-blue-900/30">
                 <ShieldCheck size={20} className="shrink-0" />
                 <span className="font-bold leading-relaxed">هذا هو دخولك الأول، يرجى اختيار كلمة مرور جديدة لضمان أمان البيانات.</span>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">كلمة المرور الجديدة</label>
                <input 
                  type="password" required
                  className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none text-sm font-bold shadow-sm"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all text-sm"
              >
                تحديث والدخول
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;