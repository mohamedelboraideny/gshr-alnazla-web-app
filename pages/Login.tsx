import React, { useState } from 'react';
import { useStore, User } from '../store.tsx';
import { LogIn, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { users } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-emerald-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-bold">نظام إدارة الجمعية</h1>
          <p className="text-emerald-100 mt-2 opacity-80">نظام تسجيل المستفيدين الرقمي</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm border border-red-100">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
            <div className="relative">
              <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                required
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-shadow"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-95 transform"
          >
            دخول للنظام
          </button>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">تجربة الدخول:</p>
            <div className="flex justify-center gap-4 mt-2">
               <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">admin / 123</span>
               <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">manager / 123</span>
               <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">staff / 123</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;