import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import UserPanelPage from './pages/UserPanel';
import { UpcomingReservations } from './pages/UpcomingReservations';
import { RealTimeMap } from './pages/RealTimeMap';
import { GuardDashboard } from './pages/GuardDashboard';
import { VisitorPass } from './pages/VisitorPass';
import { NotFoundPage } from './pages/NotFoundPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PassesPage } from './pages/PassesPage';
import { SecurityLogsPage } from './pages/SecurityLogsPage';
import { BlockedVehiclesPage } from './pages/BlockedVehiclesPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<UserPanelPage />} />
          <Route path="/dashboard/upcoming" element={<UpcomingReservations />} />
          <Route path="/dashboard/map" element={<RealTimeMap />} />
          <Route path="/guard" element={<GuardDashboard />} />
          <Route path="/visitor-pass" element={<VisitorPass />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/passes" element={<PassesPage />} />
          <Route path="/security/logs" element={<SecurityLogsPage />} />
          <Route path="/security/blocked" element={<BlockedVehiclesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/user-panel" element={<UserPanelPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  );
}
