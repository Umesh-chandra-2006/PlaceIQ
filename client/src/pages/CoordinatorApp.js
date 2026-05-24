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

const CoordinatorApp = () => {
  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobsManager />} />
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/students" element={<Batches />} />
          <Route path="/announcements" element={<AnnouncementsManager />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="*" element={<Navigate to="/coordinator" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default CoordinatorApp;
