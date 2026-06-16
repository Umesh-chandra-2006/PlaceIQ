import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupAccount from './pages/SetupAccount';
import CoordinatorApp from './pages/CoordinatorApp';
import StudentApp from './pages/StudentApp';
import AdminApp from './pages/AdminApp';
import Landing from './pages/Landing';

import ErrorBoundary from './components/shared/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/setup-account" element={<SetupAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/coordinator/*" 
              element={
                <ProtectedRoute roles={['coordinator']}>
                  <CoordinatorApp />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentApp />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <AdminApp />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
        </ErrorBoundary>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a', fontSize: '14px' } }} />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
