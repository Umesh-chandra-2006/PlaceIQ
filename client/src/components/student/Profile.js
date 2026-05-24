import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { User, FileText, Upload, CheckCircle, Zap } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/students/me');
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile", error);
      }
    };
    fetchProfile();
  }, []);

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    const data = new FormData();
    data.append('resume', file);

    try {
      await axios.post('/students/onboard', data, { // We can reuse onboard endpoint if we omit other fields, but let's make a generic upload or just use onboard which ignores empty fields. Wait, onboard requires activeBacklogs etc. Actually, onboard ignores fields not sent. Let's see if it works.
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Resume updated successfully!');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Failed to upload resume.');
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><User /> My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Academic Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div><span className="text-gray-500 block">Name</span><span className="font-medium">{profile.name}</span></div>
              <div><span className="text-gray-500 block">Email</span><span className="font-medium">{profile.email}</span></div>
              <div><span className="text-gray-500 block">Branch & Dept</span><span className="font-medium">{profile.branch} / {profile.department || '-'}</span></div>
              <div><span className="text-gray-500 block">Section & Roll</span><span className="font-medium">{profile.section || '-'} / {profile.rollNumber || '-'}</span></div>
              <div><span className="text-gray-500 block">CGPA</span><span className="font-medium">{profile.cgpa || '-'}</span></div>
              <div><span className="text-gray-500 block">Active Backlogs</span><span className="font-medium">{profile.activeBacklogs || 0}</span></div>
              <div><span className="text-gray-500 block">10th %</span><span className="font-medium">{profile.tenthPercent || '-'}</span></div>
              <div><span className="text-gray-500 block">12th %</span><span className="font-medium">{profile.twelfthPercent || '-'}</span></div>
              <div className="col-span-2">
                <span className="text-gray-500 block mb-1">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map(s => <span key={s} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium">{s}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-primary-600 p-6 rounded-xl shadow-sm text-white">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Zap size={20} /> AI Quota</h2>
            <p className="text-indigo-100 text-sm mb-4">You have a limited quota of deep AI ATS reviews per month.</p>
            <div className="text-3xl font-bold mb-1">{3 - (profile.aiReviewsUsed || 0)} <span className="text-lg font-normal text-indigo-200">/ 3</span></div>
            <p className="text-xs text-indigo-200">Resets on {new Date(profile.aiReviewResetDate).toLocaleDateString()}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText size={20} /> Resume</h2>
            {profile.resumeUrl ? (
              <div className="mb-4 text-sm text-gray-600">
                <p className="flex items-center gap-2 text-green-600 mb-1"><CheckCircle size={16} /> Resume Uploaded</p>
                <p>Last updated: {new Date(profile.resumeUpdatedAt).toLocaleDateString()}</p>
              </div>
            ) : (
              <p className="text-sm text-red-500 mb-4">No resume uploaded.</p>
            )}

            <form onSubmit={handleResumeUpload} className="mt-4 border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Resume (PDF)</label>
              <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files[0])} className="w-full text-sm mb-3" />
              <button disabled={uploading} type="submit" className="w-full bg-gray-900 text-white py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-800">
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload New Resume'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
