import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Branches from './pages/Branches';
import BranchDetail from './pages/BranchDetail';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Regions from './pages/Regions';
import Reports from './pages/Reports';
import Statuses from './pages/Statuses';
import Sponsors from './pages/Sponsors';
import { User, StoreProvider, useStore } from './CharityStore';

const AuthGate: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const { isLoading, fetchData } = useStore();
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('logged_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  // Fetch data ONLY when user is authenticated
  useEffect(() => {
    if (user && !isDataLoaded) {
      fetchData().then(() => setIsDataLoaded(true));
    }
  }, [user, isDataLoaded, fetchData]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('logged_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('logged_user');
  };

  if (isLoading || (user && !isDataLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/beneficiaries" element={<Beneficiaries user={user} />} />
          <Route path="/regions" element={<Regions user={user} />} />
          <Route path="/statuses" element={<Statuses user={user} />} />
          <Route path="/sponsors" element={<Sponsors user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/branches" element={<Branches user={user} />} />
          <Route path="/branches/:id" element={<BranchDetail user={user} />} />
          <Route path="/users" element={<Users user={user} />} />
          <Route path="/logs" element={<AuditLog user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => (
  <StoreProvider>
    <AuthGate />
  </StoreProvider>
);

export default App;