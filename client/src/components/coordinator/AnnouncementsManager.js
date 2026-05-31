import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Send, Loader2 } from 'lucide-react';

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

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)] text-zinc-100">
      
      {/* Compose Form */}
      <div className="w-1/3 flex flex-col gap-4">
        <h1 className="text-xl font-medium tracking-tight">Announcements</h1>
        <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-950 border border-zinc-800 p-4 rounded flex flex-col h-full overflow-hidden">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Send size={12}/> Compose</h2>
          
          <div>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700" placeholder="Title (e.g. Infosys Drive)" />
          </div>
          
          <div className="flex-1 min-h-[100px]">
            <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full h-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none" placeholder="Message content..."></textarea>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Priority:</span>
            <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none">
              <option value="normal">Normal</option>
              <option value="high">High (Email Alert)</option>
            </select>
          </div>

          <div className="border border-zinc-800 rounded bg-zinc-900 overflow-hidden flex flex-col h-40">
            <div className="px-2 py-1 bg-zinc-950 border-b border-zinc-800 text-[10px] uppercase text-zinc-500 tracking-wider">Target Cohorts (Uncheck all = Global)</div>
            <div className="flex-1 overflow-y-auto p-1 space-y-1">
              {batches.map(batch => (
                <label key={batch._id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-zinc-800 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={formData.targetBatches.includes(batch._id)}
                    onChange={() => handleBatchToggle(batch._id)}
                    className="rounded bg-zinc-950 border-zinc-700 text-primary-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-zinc-300">{batch.name}</span>
                  <span className="text-zinc-600 font-mono ml-auto">{batch.studentIds?.length || 0}</span>
                </label>
              ))}
            </div>
          </div>

          <button disabled={sending} type="submit" className="w-full bg-primary-500 text-zinc-950 py-1.5 rounded text-sm font-medium hover:bg-primary-400 flex justify-center items-center gap-2 transition-colors">
            {sending ? <Loader2 className="animate-spin" size={14}/> : 'Broadcast'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-medium tracking-tight opacity-0 pointer-events-none">History</h2> {/* Spacer alignment */}
        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Broadcast History</span>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
            {loading ? (
              <div className="p-8 text-center text-zinc-500 text-sm">Loading...</div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">0 announcements sent.</div>
            ) : (
              announcements.map(ann => (
                <div key={ann._id} className="p-4 hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-zinc-200">{ann.title}</h3>
                      {ann.priority === 'high' && <span className="text-[10px] font-mono bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {ann.createdAt && !isNaN(new Date(ann.createdAt))
                        ? new Date(ann.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{ann.content}</p>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <div className="text-zinc-500">
                      Target: {ann.targetBatches.length > 0 ? ann.targetBatches.map(b => b.name).join(', ') : 'Global'}
                    </div>
                    <div className="text-primary-500">
                      Read: {ann.readBy.length}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AnnouncementsManager;
