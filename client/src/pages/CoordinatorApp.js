/**
 * Coordinator layout and routing.
 */
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from '../components/shared/Sidebar';
import OnboardingTour from '../components/shared/OnboardingTour';

// Lazy loaded components
const Dashboard = lazy(() => import('../components/coordinator/Dashboard'));
const JobsManager = lazy(() => import('../components/coordinator/JobsManager'));
const JobForm = lazy(() => import('../components/coordinator/JobForm'));
const Batches = lazy(() => import('../components/coordinator/Batches'));
const AnnouncementsManager = lazy(() => import('../components/coordinator/AnnouncementsManager'));
const AnalyticsDashboard = lazy(() => import('../components/coordinator/AnalyticsDashboard'));
const Profile = lazy(() => import('../components/coordinator/Profile'));
const CompaniesManager = lazy(() => import('../components/coordinator/CompaniesManager'));

const CoordinatorApp = () => {
  return (
    <div className="flex min-h-screen bg-zinc-955 text-zinc-100 selection:bg-primary-500/30 selection:text-primary-100 font-sans">
      <Sidebar />
      <OnboardingTour role="coordinator" />
      <div className="flex-1 md:ml-64 pt-16 md:pt-8 p-4 md:p-8">
        <Suspense fallback={
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<JobsManager />} />
            <Route path="/jobs/new" element={<JobForm />} />
            <Route path="/students" element={<Batches />} />
            <Route path="/companies" element={<CompaniesManager />} />
            <Route path="/announcements" element={<AnnouncementsManager />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/coordinator" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default CoordinatorApp;
