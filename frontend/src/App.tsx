import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import IpManagement from './pages/IpManagement';
import Monitoring from './pages/Monitoring';
import Alerts from './pages/Alerts';
import ActivityLogsPage from './pages/ActivityLogsPage';
import Subnetting from './pages/Subnetting';
import { ScanPage } from './pages/ScanPage';
import Topology from './pages/Topology';
import { ProfilePage } from './pages/ProfilePage';
import PasswordGeneratorPage from './pages/PasswordGeneratorPage';
import AutoSaveDemo from './pages/AutoSaveDemo';
import OrganizationListPage from './pages/OrganizationListPage';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ip-management" element={<IpManagement />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/logs" element={<ActivityLogsPage />} />
        <Route path="/subnetting" element={<Subnetting />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/topology" element={<Topology />} />
        <Route path="/passwords" element={<PasswordGeneratorPage />} />
        <Route path="/autosave-demo" element={<AutoSaveDemo />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/organizations" element={<OrganizationListPage />} />
      </Routes>
    </Layout>
  );
};

export default App;