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
import { User, StoreProvider } from './store.tsx';

const AuthGate: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('logged_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('logged_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('logged_user');
  };

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