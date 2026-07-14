import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Upload, Plus, Download, X, Loader2, Check, MoreVertical, Mail, UserX, UserCheck, FileText } from 'lucide-react';
import Pagination from '../shared/Pagination';
import StudentDetailsDrawer from '../shared/StudentDetailsDrawer';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [newBatch, setNewBatch] = useState({ name: '', branch: '', section: '', year: new Date().getFullYear() });

  // Add student modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', rollNumber: '', branch: '', year: '', cgpa: '' });
  const [submittingStudent, setSubmittingStudent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sidebar & Dropdown UI states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await axios.get('/batches?limit=1000');
      setBatches(data && data.data ? data.data : (Array.isArray(data) ? data : []));
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

  const fetchStudents = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/batches/${selectedBatch._id}/students?search=${search}&minCgpa=${minCgpa}&department=${department}&page=${page}&limit=${limit}`);
      if (data && data.data) {
        setStudents(data.data);
        setTotalPages(data.pages || 1);
        setTotalStudents(data.total || 0);
      } else {
        setStudents(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalStudents(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error('Error fetching students', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, search, minCgpa, department, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [search, minCgpa, department]);

  const selectBatch = (batch) => {
    setSelectedBatch(batch);
    setSearch('');
    setMinCgpa('');
    setDepartment('');
    setPage(1);
  };

  const handleDownloadRoster = () => {
    if (!selectedBatch) return;
    axios.get(`/export/students?batchId=${selectedBatch._id}`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cohort_roster_${selectedBatch.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error("Error downloading roster:", error);
        alert("Failed to download roster.");
      });
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
      fetchStudents(); 
      fetchBatches(); 
    } catch (error) {
      console.error('Error uploading CSV', error);
      alert('Error uploading file. Check console.');
    } finally {
      setUploading(false);
      e.target.value = ''; 
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) {
      alert("Name and Email are required.");
      return;
    }
    setSubmittingStudent(true);
    setSuccessMessage('');
    try {
      await axios.post(`/batches/${selectedBatch._id}/students/single`, {
        name: newStudent.name,
        email: newStudent.email,
        rollNumber: newStudent.rollNumber,
        branch: newStudent.branch || selectedBatch.branch,
        year: newStudent.year ? Number(newStudent.year) : Number(selectedBatch.year),
        cgpa: newStudent.cgpa ? Number(newStudent.cgpa) : 0
      });
      setSuccessMessage('Student account created. Share their login email with the default password: student123.');
      setNewStudent({
        name: '',
        email: '',
        rollNumber: '',
        branch: selectedBatch?.branch || '',
        year: selectedBatch?.year || '',
        cgpa: ''
      });
      fetchStudents();
      fetchBatches();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add student. Ensure email is unique and valid.');
    } finally {
      setSubmittingStudent(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-6rem)] gap-6 text-zinc-100 min-w-0">
      {/* Batches Sidebar */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 flex-shrink-0">
        <h1 className="text-xl font-medium tracking-tight">Student Directory</h1>
        
        <form onSubmit={createBatch} className="space-y-2 bg-zinc-950 border border-zinc-800 p-3 rounded">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">Create Cohort</h3>
          <input 
            type="text" placeholder="Cohort Name (e.g. CSE 2025)" required
            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-700"
            value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})}
          />
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Branch" required
              className="w-1/3 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-700"
              value={newBatch.branch} onChange={e => setNewBatch({...newBatch, branch: e.target.value})}
            />
            <input 
              type="text" placeholder="Section"
              className="w-1/3 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-700"
              value={newBatch.section} onChange={e => setNewBatch({...newBatch, section: e.target.value})}
            />
            <input 
              type="number" placeholder="Year" required
              className="w-1/3 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-700 font-mono"
              value={newBatch.year} onChange={e => setNewBatch({...newBatch, year: parseInt(e.target.value) || ''})}
            />
          </div>
          <button type="submit" className="w-full bg-zinc-800 text-zinc-200 text-sm py-1.5 rounded hover:bg-zinc-700 transition-colors mt-2">
            Add Cohort
          </button>
        </form>

        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded overflow-y-auto">
          <div className="px-4 py-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Active Cohorts</span>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {batches.map(batch => (
              <div 
                key={batch._id} 
                onClick={() => selectBatch(batch)}
                className={`px-4 py-3 cursor-pointer transition-colors flex justify-between items-center ${
                  selectedBatch?._id === batch._id ? 'bg-primary-500/10 border-l-2 border-primary-500' : 'hover:bg-zinc-900 border-l-2 border-transparent'
                }`}
              >
                <span className={`text-sm font-medium ${selectedBatch?._id === batch._id ? 'text-primary-500' : 'text-zinc-300'}`}>
                  {batch.name}
                </span>
                <span className="text-xs font-mono text-zinc-500">{batch.studentIds?.length || 0}</span>
              </div>
            ))}
            {batches.length === 0 && <p className="p-4 text-zinc-500 text-xs">0 cohorts active.</p>}
          </div>
        </div>
      </div>

      {/* Roster Area */}
      <div className="flex-1 flex flex-col border border-zinc-800 rounded bg-zinc-950 overflow-hidden">
        {selectedBatch ? (
          <>
            <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-200">{selectedBatch.name} Roster</span>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded font-mono text-[10px]">{totalStudents} students</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedBatch.studentIds?.length > 0 && (
                  <button 
                    onClick={handleDownloadRoster}
                    className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-3 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors border border-zinc-800"
                  >
                    <Download size={14} /> Export Roster
                  </button>
                )}
                <button 
                  onClick={() => {
                    setNewStudent({
                      name: '',
                      email: '',
                      rollNumber: '',
                      branch: selectedBatch?.branch || '',
                      year: selectedBatch?.year || '',
                      cgpa: ''
                    });
                    setShowAddModal(true);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors border border-zinc-700"
                >
                  <Plus size={14} /> Add Student
                </button>
                <label className="bg-primary-500 text-zinc-950 px-3 py-1 text-xs font-medium rounded hover:bg-primary-400 cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload size={14} /> {uploading ? 'Uploading...' : 'Import CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
              <div className="relative flex-1 w-full max-w-xs">
                <input
                  type="text"
                  placeholder="Search by name, roll no, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-3 pr-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-200"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Min CGPA"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="w-24 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-350"
                />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-700 text-zinc-350"
                >
                  <option value="">All Departments</option>
                  {["CSE", "ECE", "MECH", "CIVIL", "EEE", "IT"].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-zinc-950">
              {loading ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Loading records...</div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm whitespace-nowrap bg-zinc-950">
                    <thead className="bg-zinc-950 sticky top-0 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                      <tr>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Email</th>
                        <th className="px-4 py-2 font-medium">Roll No</th>
                        <th className="px-4 py-2 font-medium text-right">CGPA</th>
                        <th className="px-4 py-2 font-medium text-right">Status</th>
                        <th className="px-4 py-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 bg-zinc-950">
                      {students.map(student => (
                        <tr 
                          key={student._id} 
                          onClick={() => setSelectedStudent(student)}
                          className={`hover:bg-zinc-900/50 transition-colors cursor-pointer ${student.isActive === false ? 'opacity-50' : ''}`}
                        >
                          <td className="px-4 py-3.5 font-medium text-zinc-200">{student.name}</td>
                          <td className="px-4 py-3.5 text-zinc-500">{student.email}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-zinc-400">{student.rollNumber || '-'}</td>
                          <td className="px-4 py-3.5 text-right font-mono text-zinc-300">{student.cgpa || '-'}</td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                              student.placementStatus === 'not_placed' ? 'bg-zinc-800 text-zinc-400' : 'bg-primary-500/10 text-primary-500'
                            }`}>
                              {student.placementStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right relative" onClick={e => e.stopPropagation()}>
                            <div className="inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === student._id ? null : student._id);
                                }}
                                className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                <MoreVertical size={16} />
                              </button>
                              
                              {activeDropdown === student._id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(null);
                                    }} 
                                  />
                                  <div className="absolute right-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden text-xs text-zinc-350 text-left font-sans">
                                    <button
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-850 flex items-center gap-2 hover:text-zinc-100 transition-colors"
                                    >
                                      <FileText size={13} className="text-primary-400" />
                                      View Details
                                    </button>
                                    
                                    {!student.lastLoginAt && (
                                      <button
                                        disabled={student.loginEmailSent}
                                        onClick={async () => {
                                          try {
                                            await axios.post(`/batches/students/${student._id}/send-login`);
                                            setStudents(students.map(s => s._id === student._id ? { ...s, loginEmailSent: true } : s));
                                            alert('Login email dispatched.');
                                          } catch(e) {
                                            alert(e.response?.data?.error || 'Failed to send email.');
                                          } finally {
                                            setActiveDropdown(null);
                                          }
                                        }}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-850 flex items-center gap-2 hover:text-zinc-100 disabled:opacity-40 transition-colors"
                                      >
                                        <Mail size={13} className="text-amber-400" />
                                        {student.loginEmailSent ? 'Mail Sent' : 'Send Login Details'}
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={async () => {
                                        try {
                                          await axios.put(`/batches/students/${student._id}/status`);
                                          setStudents(students.map(s => s._id === student._id ? { ...s, isActive: s.isActive === false ? true : false } : s));
                                        } catch(e) {
                                          alert('Failed to update status.');
                                        } finally {
                                          setActiveDropdown(null);
                                        }
                                      }}
                                      className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-850 flex items-center gap-2 hover:text-zinc-100 border-t border-zinc-850/50 transition-colors"
                                    >
                                      {student.isActive !== false ? (
                                        <>
                                          <UserX size={13} className="text-red-400" />
                                          Deactivate Account
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck size={13} className="text-emerald-400" />
                                          Activate Account
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm flex-col gap-2">
                  <span>0 records found.</span>
                  <span className="text-xs text-zinc-600">Import a CSV file or add student manually.</span>
                </div>
              )}
            </div>

            <Pagination 
              page={page}
              pages={totalPages}
              limit={limit}
              total={totalStudents}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
            Select a cohort to view roster.
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans text-zinc-100">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Add Student to Cohort</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setSuccessMessage('');
                }} 
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>

            {successMessage && (
              <div className="bg-primary-500/10 border border-primary-500/30 p-3 rounded text-xs text-primary-400 font-medium leading-relaxed flex items-start gap-1.5">
                <Check size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Full Name *</label>
                <input 
                  type="text" required
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">College Email *</label>
                <input 
                  type="email" required
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                  placeholder="e.g. rahul@anurag.edu.in"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Roll Number</label>
                  <input 
                    type="text"
                    value={newStudent.rollNumber}
                    onChange={e => setNewStudent({...newStudent, rollNumber: e.target.value})}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                    placeholder="e.g. 21EG105101"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">CGPA</label>
                  <input 
                    type="number" step="0.01" min="0" max="10"
                    value={newStudent.cgpa}
                    onChange={e => setNewStudent({...newStudent, cgpa: e.target.value})}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                    placeholder="e.g. 8.45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Branch</label>
                  <input 
                    type="text"
                    value={newStudent.branch}
                    onChange={e => setNewStudent({...newStudent, branch: e.target.value})}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                    placeholder={selectedBatch?.branch || "e.g. CSE"}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Graduation Year</label>
                  <input 
                    type="number"
                    value={newStudent.year}
                    onChange={e => setNewStudent({...newStudent, year: e.target.value})}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                    placeholder={selectedBatch?.year || String(new Date().getFullYear())}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setSuccessMessage('');
                  }}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={submittingStudent}
                  className="px-4 py-1.5 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingStudent && <Loader2 className="animate-spin" size={12} />}
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudent && (
        <StudentDetailsDrawer 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

export default Batches;
