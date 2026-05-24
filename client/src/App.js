/**
 * Root App component with role-based routing.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/shared/Navbar';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CoordinatorApp from './pages/CoordinatorApp';
import StudentApp from './pages/StudentApp';
import AdminApp from './pages/AdminApp';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'coordinator') return <Navigate to="/coordinator" />;
  if (user.role === 'student') return <Navigate to="/student" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
              <ProtectedRoute roles={['admin']}>
                <AdminApp />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
