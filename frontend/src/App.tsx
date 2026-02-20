import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ActivityLogsPage from './pages/ActivityLogsPage';
import Subnetting from './pages/Subnetting';
import ScanPage from './pages/ScanPage';
import { ProfilePageNew } from './pages/ProfilePageNew';
import { SettingsPage } from './pages/SettingsPage';
import PasswordGeneratorPage from './pages/PasswordGeneratorPage';
import ZabbixPage from './pages/ZabbixPage';
import DatabaseManagement from './pages/DatabaseManagement';
import TwoFactorAuth from './pages/TwoFactorAuth';
// import AutoSaveDemo from './pages/AutoSaveDemo';
import OrganizationListPage from './pages/OrganizationListPage';
import Login from './pages/Login';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import { useAuth } from './hooks/useAuth';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationManager } from './components/NotificationManager';
import { ConfirmDialog } from './components/ConfirmDialog';

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
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/otp-verification" element={<OTPVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <NotificationProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitoring" element={<ZabbixPage />} />
          <Route path="/logs" element={<ActivityLogsPage />} />
          <Route path="/subnetting" element={<Subnetting />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/passwords" element={<PasswordGeneratorPage />} />
          <Route path="/database" element={<DatabaseManagement />} />
          <Route path="/2fa" element={<TwoFactorAuth />} />
          {/* <Route path="/autosave-demo" element={<AutoSaveDemo />} /> */}
          <Route path="/profile" element={<ProfilePageNew />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/organizations" element={<OrganizationListPage />} />
        </Routes>
      </Layout>
      <NotificationManager />
      <ConfirmDialog />
    </NotificationProvider>
  );
};

export default App;