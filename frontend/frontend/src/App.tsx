import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ClinicQuestionnairePage from './pages/ClinicQuestionnairePage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorEncounterDetailPage from './pages/DoctorEncounterDetailPage';
import TechnologistDashboardPage from './pages/TechnologistDashboardPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/clinic/questionnaire" element={
            <ProtectedRoute roles={['clinic']}>
              <ClinicQuestionnairePage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/encounters" element={
            <ProtectedRoute roles={['doctor']}>
              <DoctorDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/doctor/encounters/:id" element={
            <ProtectedRoute roles={['doctor']}>
              <DoctorEncounterDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/technologist/imaging" element={
            <ProtectedRoute roles={['technologist']}>
              <TechnologistDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
