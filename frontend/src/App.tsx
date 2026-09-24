import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { FarmsListPage } from './pages/farms/FarmsListPage';
import { CreateFarmPage } from './pages/farms/CreateFarmPage';
import { FarmDetailPage } from './pages/farms/FarmDetailPage';
import { ProfilePage } from './pages/profile/ProfilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/farms" element={<FarmsListPage />} />
              <Route path="/farms/new" element={<CreateFarmPage />} />
              <Route path="/farms/:id" element={<FarmDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Backward-compatibility redirects for removed routes */}
              <Route path="/weather" element={<Navigate to="/dashboard" replace />} />
              <Route path="/health" element={<Navigate to="/farms" replace />} />
            </Route>
          </Route>

          {/* Fallback Redirection */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
