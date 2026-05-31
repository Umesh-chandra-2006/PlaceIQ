import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Loader2, Clock } from 'lucide-react';
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-650" size={24} /></div>;

  return (
    <div className="max-w-3xl mx-auto text-zinc-100">
      <div className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Announcements</h1>
        <p className="text-zinc-400 text-sm mt-1">Updates and notices from the placement cell.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-24 border border-zinc-850 rounded-lg bg-zinc-900/20">
          <p className="text-zinc-400 text-sm">No announcements to display.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.map((ann, i) => {
            const isUnread = !ann.readBy.includes(user.id);
            return (
              <div 
                key={ann._id} 
                onClick={() => markAsRead(ann._id, i)}
                className={`p-6 rounded-lg border transition-all cursor-pointer group ${isUnread ? 'bg-zinc-900/80 border-zinc-700 hover:border-zinc-650' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-750'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>}
                    <h3 className={`text-base font-semibold tracking-tight ${isUnread ? 'text-zinc-100' : 'text-zinc-300'}`}>{ann.title}</h3>
                  </div>
                  {ann.priority === 'high' && <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">Important</span>}
                </div>
                
                <p className={`whitespace-pre-wrap text-sm mb-5 leading-relaxed ${isUnread ? 'text-zinc-250' : 'text-zinc-400'}`}>
                  {ann.content}
                </p>

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-4 border-t border-zinc-800/80">
                  <span className="flex items-center gap-1.5"><Clock size={12}/> {ann.createdAt && !isNaN(new Date(ann.createdAt)) ? new Date(ann.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
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
