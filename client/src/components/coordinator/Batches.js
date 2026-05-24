import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Upload, Plus, Users, Download } from 'lucide-react';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newBatch, setNewBatch] = useState({ name: '', branch: '', section: '', year: new Date().getFullYear() });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await axios.get('/batches');
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches', error);
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/batches', newBatch);
      setNewBatch({ name: '', branch: '', section: '', year: new Date().getFullYear() });
      fetchBatches();
    } catch (error) {
      console.error('Error creating batch', error);
    }
  };

  const selectBatch = async (batch) => {
    setSelectedBatch(batch);
    setLoading(true);
    try {
      const { data } = await axios.get(`/batches/${batch._id}/students`);
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (!selectedBatch || !e.target.files[0]) return;
    
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    
    setUploading(true);
    try {
      await axios.post(`/batches/${selectedBatch._id}/students`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Students imported successfully!');
      selectBatch(selectedBatch); // Refresh roster
      fetchBatches(); // Refresh batch counts
    } catch (error) {
      console.error('Error uploading CSV', error);
      alert('Error uploading file. Check console.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="p-4 flex flex-col md:flex-row gap-6">
      {/* Batches Sidebar */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users /> Batches</h2>
        
        <form onSubmit={createBatch} className="mb-6 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-sm">Create New Batch</h3>
          <input 
            type="text" placeholder="Batch Name (e.g. CSE-A 2025)" required
            className="w-full p-2 border rounded"
            value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})}
          />
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Branch"
              className="w-1/2 p-2 border rounded"
              value={newBatch.branch} onChange={e => setNewBatch({...newBatch, branch: e.target.value})}
            />
            <input 
              type="text" placeholder="Section"
              className="w-1/2 p-2 border rounded"
              value={newBatch.section} onChange={e => setNewBatch({...newBatch, section: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white p-2 rounded hover:bg-primary-700 flex items-center justify-center gap-2">
            <Plus size={16} /> Create Batch
          </button>
        </form>

        <div className="space-y-2">
          {batches.map(batch => (
            <div 
              key={batch._id} 
              onClick={() => selectBatch(batch)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedBatch?._id === batch._id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="font-semibold text-gray-800">{batch.name}</div>
              <div className="text-sm text-gray-500">{batch.studentIds?.length || 0} Students</div>
            </div>
          ))}
          {batches.length === 0 && <p className="text-gray-500 italic text-sm">No batches created yet.</p>}
        </div>
      </div>

      {/* Roster Area */}
      <div className="w-full md:w-2/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {selectedBatch ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedBatch.name} Roster</h2>
                <p className="text-gray-500">Manage students in this batch</p>
              </div>
              <div className="flex gap-3">
                <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer flex items-center gap-2">
                  <Upload size={18} /> {uploading ? 'Uploading...' : 'Import CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            {loading ? (
              <p>Loading students...</p>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">CGPA</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student._id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="p-3 font-medium">{student.name}</td>
                        <td className="p-3 text-gray-600">{student.email}</td>
                        <td className="p-3">{student.rollNumber || '-'}</td>
                        <td className="p-3">{student.cgpa || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.placementStatus === 'not_placed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {student.placementStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Users size={48} className="mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700">No students found</h3>
                <p className="text-gray-500 mb-4">Import a CSV file to add students to this batch.</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  CSV must include: Name, Email. Optional: RollNumber, Branch, Section, Department, CGPA, TenthPercent, TwelfthPercent, ActiveBacklogs. Default password is 'student123'.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Select a batch from the sidebar to view its roster.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Batches;
