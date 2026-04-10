import React, { useState } from 'react';
import { useStore, User, Role } from '../CharityStore';
import { LogIn, Lock, User as UserIcon, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { supabase } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // We no longer use 'step' or 'tempUser' for password changes here, 
  // as Supabase handles password resets via email links.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check your .env file.');
      }

      // 1. Authenticate with Supabase GoTrue
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Fetch the user's profile from the secure user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        // Map the profile data to the User interface expected by the app
        const loggedInUser: User = {
          id: profileData.id,
          name: profileData.name,
          username: profileData.username,
          role: profileData.role as Role,
          branchId: profileData.branchId,
        };
        onLogin(loggedInUser);
      } else {
         throw new Error('User profile not found.');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-all">
        
        <div className="bg-emerald-600 p-12 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/20 shadow-xl">
            <LogIn size={36} />
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">
            نظام إدارة المستفيدين
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">البريد الإلكتروني</label>
              <div className="relative">
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type="email" required
                  className="w-full pr-12 pl-4 py-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none transition-all text-sm font-black shadow-sm"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
        </div>
      </div>
    </div>
  );
};

export default Login;