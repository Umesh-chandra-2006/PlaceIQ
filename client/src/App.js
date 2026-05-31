import React from 'react';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup-account" element={<SetupAccount />} />
          
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
    </AuthProvider>
  );
}

export default App;
