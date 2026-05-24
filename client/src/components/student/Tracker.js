/**
 * Student Application Tracker component (Kanban style).
 */
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Loader2, ChevronRight, Clock } from 'lucide-react';

const stages = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { id: 'oa', label: 'Online Assessment', color: 'bg-purple-500' },
  { id: 'interview', label: 'Interview', color: 'bg-orange-500' },
  { id: 'offer', label: 'Offer', color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-500' }
];

const Tracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const { data } = await axios.get('/applications');
        setApplications(data);
      } catch (error) {
        console.error("Error fetching applications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Application Tracker</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage.id} className="min-w-[250px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                {stage.label}
              </h3>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {applications.filter(a => a.stage === stage.id).length}
              </span>
            </div>
            
            <div className="space-y-3">
              {applications.filter(a => a.stage === stage.id).map(app => (
                <div key={app._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors cursor-pointer">
                  <h4 className="font-bold text-gray-900 text-sm">{app.jobId?.title || 'Unknown Role'}</h4>
                  <p className="text-primary-600 text-xs font-medium mb-3">{app.jobId?.company || 'Unknown Company'}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(app.updatedAt).toLocaleDateString()}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))}
              {applications.filter(a => a.stage === stage.id).length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-lg py-8 text-center">
                  <p className="text-gray-300 text-xs">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tracker;
