import React, { useState } from 'react';
import { useStore, User, Role } from '../CharityStore';
import { LogIn, Lock, User as UserIcon, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { supabase } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // For password reset logic
  const [step, setStep] = useState<'login' | 'reset_password'>('login');
  const [tempUser, setTempUser] = useState<User | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let usersList: User[] = [];

      // Fetch users dynamically based on API mode
      if (import.meta.env.VITE_API_MODE === 'proxy') {
         const res = await fetch('/api/user_profiles');
         if (!res.ok) throw new Error('API fetch failed');
         usersList = await res.json();
      } else {
         if (!supabase) throw new Error('Supabase client not initialized.');
         const { data, error } = await supabase.from('user_profiles').select('*');
         if (error) throw error;
         usersList = data || [];
      }

      const user = usersList.find(u => u.username === username);

      if (user) {
        if (user.password === password) {
          if (user.isFirstLogin || password === '123') {
             setTempUser(user);
             setStep('reset_password');
          } else {
             onLogin(user);
          }
        } else {
          setError('بيانات الدخول غير صحيحة');
        }
      } else {
        setError('المستخدم غير موجود');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    
    if (password === '123') {
       setError('لا يمكن استخدام كلمة المرور الافتراضية، يرجى إدخال كلمة مرور جديدة.');
       return;
    }

    try {
       const updatedUser = { ...tempUser, password: password, isFirstLogin: false };
       
       if (import.meta.env.VITE_API_MODE === 'proxy') {
         await fetch(`/api/user_profiles/upsert`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(updatedUser)
         });
       } else {
         if (supabase) {
           await supabase.from('user_profiles').upsert(updatedUser);
         }
       }
       
       onLogin(updatedUser);
    } catch(err: any) {
       setError('حدث خطأ أثناء تغيير كلمة المرور');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-all">
        
        <div className="bg-emerald-600 p-12 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/20 shadow-xl">
            {step === 'login' ? <LogIn size={36} /> : <ShieldCheck size={36} />}
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">
            {step === 'login' ? 'نظام إدارة المستفيدين' : 'تأمين الحساب'}
          </h1>
          <p className="text-emerald-100 text-[11px] mt-2 font-black uppercase tracking-[0.2em] opacity-80">
            الجمعية الشرعية بالنزلة
          </p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-5 rounded-2xl flex items-center gap-4 text-xs border border-red-100 dark:border-red-900/30 mb-8 animate-shake">
              <AlertCircle size={20} />
              <span className="font-black">{error}</span>
            </div>
          )}

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">اسم المستخدم</label>
                <div className="relative">
                  <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="text" required
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm font-black shadow-sm"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="password" required
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm font-black shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-5 rounded-[1.25rem] font-black shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95 text-sm mt-4 disabled:opacity-50"
              >
                {isLoading ? 'جاري التحقق...' : 'دخول للنظام'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6">
                 <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-bold text-center">
                   مرحباً {tempUser?.name}، <br/>
                   هذا هو تسجيل الدخول الأول لك. يجب عليك تغيير كلمة المرور الافتراضية لحماية حسابك قبل الدخول للنظام.
                 </p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">كلمة المرور الجديدة</label>
                <div className="relative">
                  <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="password" required
                    minLength={6}
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm font-black shadow-sm"
                    placeholder="أدخل كلمة مرور قوية"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-5 rounded-[1.25rem] font-black shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95 text-sm mt-4 disabled:opacity-50"
              >
                تغيير كلمة المرور والدخول
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;