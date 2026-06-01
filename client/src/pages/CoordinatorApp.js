/**
 * Coordinator layout and routing.
 */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../components/coordinator/Dashboard';
import JobsManager from '../components/coordinator/JobsManager';
import JobForm from '../components/coordinator/JobForm';
import Batches from '../components/coordinator/Batches';
import AnnouncementsManager from '../components/coordinator/AnnouncementsManager';
import AnalyticsDashboard from '../components/coordinator/AnalyticsDashboard';
import Profile from '../components/coordinator/Profile';
import CompaniesManager from '../components/coordinator/CompaniesManager';
import Sidebar from '../components/shared/Sidebar';
import OnboardingTour from '../components/shared/OnboardingTour';

const CoordinatorApp = () => {
  return (
    <div className="flex min-h-screen bg-zinc-955 text-zinc-100 selection:bg-primary-500/30 selection:text-primary-100">
      <Sidebar />
      <OnboardingTour role="coordinator" />
      <div className="flex-1 md:ml-64 pt-16 md:pt-8 p-4 md:p-8">
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
      </div>
    </div>
  );
};

export default CoordinatorApp;
