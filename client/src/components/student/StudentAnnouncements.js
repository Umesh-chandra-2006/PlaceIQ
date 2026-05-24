import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Megaphone, CheckCircle, Loader2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get('/announcements');
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, index) => {
    // Optimistic UI update
    const newAnns = [...announcements];
    if (!newAnns[index].readBy.includes(user.id)) {
      newAnns[index].readBy.push(user.id);
      setAnnouncements(newAnns);
      try {
        await axios.post(`/announcements/${id}/read`);
      } catch (error) {
        console.error("Failed to mark as read");
      }
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Megaphone size={24}/> Announcements</h1>
        <p className="text-gray-500">Important updates from your placement cell</p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann, i) => {
            const isUnread = !ann.readBy.includes(user.id);
            return (
              <div 
                key={ann._id} 
                onClick={() => markAsRead(ann._id, i)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${isUnread ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-gray-100 shadow-sm opacity-80'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    <h3 className={`text-lg font-bold ${isUnread ? 'text-indigo-900' : 'text-gray-800'}`}>{ann.title}</h3>
                  </div>
                  {ann.priority === 'high' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase">Important</span>}
                </div>
                
                <p className={`${isUnread ? 'text-indigo-800' : 'text-gray-600'} whitespace-pre-wrap text-sm mb-4`}>
                  {ann.content}
                </p>

                <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1"><Clock size={14}/> {new Date(ann.createdAt).toLocaleString()}</span>
                  <span>From: {ann.author?.name || 'Coordinator'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;
