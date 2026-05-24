import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Send, Megaphone, Loader2, Users, CheckCircle } from 'lucide-react';

const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetBatches: [],
    priority: 'normal'
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [annRes, batchRes] = await Promise.all([
        axios.get('/announcements'),
        axios.get('/batches')
      ]);
      setAnnouncements(annRes.data);
      setBatches(batchRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchToggle = (batchId) => {
    setFormData(prev => {
      const selected = prev.targetBatches.includes(batchId)
        ? prev.targetBatches.filter(id => id !== batchId)
        : [...prev.targetBatches, batchId];
      return { ...prev, targetBatches: selected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post('/announcements', formData);
      setFormData({ title: '', content: '', targetBatches: [], priority: 'normal' });
      fetchData();
      alert('Announcement sent successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" size={32} /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500">Broadcast important updates to students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Send size={20}/> Compose</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="e.g. Infosys Drive Update" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea required rows="4" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Message details..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="normal">Normal (In-App Only)</option>
                <option value="high">High (In-App + Email Alert)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <div className="text-xs text-gray-500 mb-2">Leave all unchecked to send to EVERY student in the college.</div>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2 bg-gray-50">
                {batches.map(batch => (
                  <label key={batch._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                    <input 
                      type="checkbox" 
                      checked={formData.targetBatches.includes(batch._id)}
                      onChange={() => handleBatchToggle(batch._id)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-medium">{batch.name}</span>
                    <span className="text-gray-400 text-xs ml-auto">{batch.studentIds?.length || 0} students</span>
                  </label>
                ))}
              </div>
            </div>

            <button disabled={sending} type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-primary-700">
              {sending ? <Loader2 className="animate-spin" size={18}/> : <Megaphone size={18}/>}
              Broadcast
            </button>
          </form>
        </div>

        {/* History */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Past Announcements</h2>
          {announcements.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
              No announcements sent yet.
            </div>
          ) : (
            announcements.map(ann => (
              <div key={ann._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{ann.title}</h3>
                  {ann.priority === 'high' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wide">High Priority</span>}
                </div>
                <p className="text-gray-600 text-sm whitespace-pre-wrap mb-4">{ann.content}</p>
                
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-50 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Users size={14}/> {ann.targetBatches.length > 0 ? ann.targetBatches.map(b => b.name).join(', ') : 'Global (All Students)'}</span>
                    <span>Sent: {new Date(ann.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle size={14}/> Read by {ann.readBy.length} students
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsManager;
