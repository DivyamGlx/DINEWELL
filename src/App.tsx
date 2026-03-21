/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { MessDetails } from './pages/MessDetails';
import { Feedback } from './pages/Feedback';
import { Portfolio } from './pages/Portfolio';
import { AuditLogs } from './pages/AuditLogs';
import { Performance } from './pages/Performance';
import { AdminStudents } from './pages/AdminStudents';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'mess' && <MessDetails />}
      {activeTab === 'feedback' && <Feedback />}
      {activeTab === 'portfolio' && <Portfolio />}
      {activeTab === 'audit' && <AuditLogs />}
      {activeTab === 'performance' && <Performance />}
      {activeTab === 'bplus' && <AdminStudents />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
