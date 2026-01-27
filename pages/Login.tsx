
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
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-800 transition-all">
        
        <div className="bg-emerald-600 p-8 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            {step === 'login' ? <LogIn size={28} /> : <KeyRound size={28} />}
          </div>
          <h1 className="text-xl font-bold">
            {step === 'login' ? 'نظام إدارة الجمعية' : 'تحديث كلمة المرور'}
          </h1>
          <p className="text-emerald-100 text-xs mt-1 opacity-80">
            {step === 'login' ? 'تسجيل الدخول للموظفين' : 'يرجى تغيير كلمة المرور الافتراضية'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs border border-red-100 dark:border-red-900/30 mb-4 animate-shake">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 px-1">اسم المستخدم</label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" required
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm"
                    placeholder="User_123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 px-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" required
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-95 text-sm"
              >
                دخول للنظام
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-[11px] text-blue-600 dark:text-blue-400 flex gap-2 mb-2">
                 <ShieldCheck size={16} className="shrink-0" />
                 <span>هذا هو دخولك الأول، يجب اختيار كلمة مرور قوية لحماية حسابك.</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 px-1">كلمة المرور الجديدة</label>
                <input 
                  type="password" required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none text-sm"
                  placeholder="أدخل الكلمة الجديدة"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 text-sm"
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
