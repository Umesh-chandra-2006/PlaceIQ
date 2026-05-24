/**
 * Student layout and routing.
 */
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import Feed from '../components/student/Feed';
import Tracker from '../components/student/Tracker';
import Onboarding from '../components/student/Onboarding';
import Profile from '../components/student/Profile';
import StudentAnnouncements from '../components/student/StudentAnnouncements';
import { Loader2 } from 'lucide-react';

const StudentApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await axios.get('/students/me');
        setProfile(data);
        if (!data.isOnboarded && location.pathname !== '/student/onboard') {
          navigate('/student/onboard');
        } else if (data.isOnboarded && location.pathname === '/student/onboard') {
          navigate('/student');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [location.pathname, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/onboard" element={<Onboarding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/announcements" element={<StudentAnnouncements />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default StudentApp;
