import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { 
  Building, Plus, Edit2, Search, Calendar, Phone, Mail, User, 
  ChevronDown, X, Loader2, Save, FileText, CheckCircle, Clock, AlertTriangle 
} from 'lucide-react';

const CompaniesManager = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals / forms states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [status, setStatus] = useState('prospect');
  const [expectedVisitDate, setExpectedVisitDate] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [avgCtc, setAvgCtc] = useState('');
  const [industry, setIndustry] = useState('');
  const [glassdoorRating, setGlassdoorRating] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/companies');
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setName('');
    setStatus('prospect');
    setExpectedVisitDate('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setNotes('');
    setAvgCtc('');
    setIndustry('');
    setGlassdoorRating('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setName(company.name || '');
    setStatus(company.status || 'prospect');
    
    // Format date for date picker (YYYY-MM-DD)
    if (company.expectedVisitDate) {
      const d = new Date(company.expectedVisitDate);
      const formattedDate = d.toISOString().split('T')[0];
      setExpectedVisitDate(formattedDate);
    } else {
      setExpectedVisitDate('');
    }
    
    setContactPerson(company.contactPerson || '');
    setContactEmail(company.contactEmail || '');
    setContactPhone(company.contactPhone || '');
    setNotes(company.notes || '');
    setAvgCtc(company.publicData?.avgCtc || '');
    setIndustry(company.publicData?.industry || '');
    setGlassdoorRating(company.publicData?.glassdoorRating || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      name,
      status,
      expectedVisitDate: expectedVisitDate ? new Date(expectedVisitDate) : null,
      contactPerson,
      contactEmail,
      contactPhone,
      notes,
      publicData: {
        avgCtc,
        industry,
        glassdoorRating: glassdoorRating ? parseFloat(glassdoorRating) : undefined
      }
    };

    try {
      if (editingCompany) {
        // Update existing company
        const { data } = await axios.put(`/companies/${editingCompany._id}`, payload);
        setCompanies(companies.map(c => c._id === editingCompany._id ? data : c));
        alert("Company updated successfully!");
      } else {
        // Create new company
        const { data } = await axios.post('/companies', payload);
        setCompanies([data, ...companies]);
        alert("Company registered successfully!");
      }
      setIsFormOpen(false);
    } catch (error) {
      alert(error.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search Logic
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          company.publicData?.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (statusVal) => {
    switch (statusVal) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'on_campus':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'closed':
        return 'bg-zinc-800 text-zinc-500 border border-zinc-800';
      case 'prospect':
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6 text-zinc-100 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Companies CRM</h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">Manage recruiter contacts, drive schedules, and corporate notes</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-primary-500 hover:bg-primary-400 text-zinc-950 font-semibold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} /> Register Company
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-950 border border-zinc-850 rounded-lg shadow-xl">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by company name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="flex gap-2 min-w-[200px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-zinc-700 text-zinc-300"
          >
            <option value="all">All Statuses</option>
            <option value="prospect">Prospect</option>
            <option value="confirmed">Confirmed</option>
            <option value="on_campus">On Campus</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main content grid */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950/40 border border-zinc-900 rounded-lg">
          <Building size={36} className="mx-auto text-zinc-650 mb-3" />
          <p className="text-zinc-500 text-xs font-mono">No companies found matching the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <div 
              key={company._id}
              className="border border-zinc-800 rounded-lg bg-zinc-950/70 hover:bg-zinc-950 transition-colors p-5 space-y-4 shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Title & Status badge */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">{company.name}</h3>
                    {company.publicData?.industry && (
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase block mt-0.5">{company.publicData.industry}</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${getStatusStyle(company.status)}`}>
                    {company.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Date and CTC brief */}
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                  {company.expectedVisitDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-zinc-550" />
                      {new Date(company.expectedVisitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-550 italic">
                      <Calendar size={13} />
                      No visit scheduled
                    </span>
                  )}
                  {company.publicData?.avgCtc && (
                    <span className="bg-zinc-900 text-zinc-450 px-1.5 py-0.5 border border-zinc-850 rounded text-[10px]">
                      Avg: {company.publicData.avgCtc}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-900" />

                {/* Recruiter details */}
                <div className="space-y-1.5 text-xs text-zinc-350">
                  {company.contactPerson ? (
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-zinc-500" />
                      <span>{company.contactPerson}</span>
                    </div>
                  ) : (
                    <div className="text-zinc-550 italic flex items-center gap-2">
                      <User size={13} />
                      <span>No contact person</span>
                    </div>
                  )}

                  {company.contactEmail && (
                    <div className="flex items-center gap-2 text-zinc-400 font-mono">
                      <Mail size={13} className="text-zinc-500" />
                      <a href={`mailto:${company.contactEmail}`} className="hover:text-primary-400 truncate">{company.contactEmail}</a>
                    </div>
                  )}

                  {company.contactPhone && (
                    <div className="flex items-center gap-2 text-zinc-400 font-mono">
                      <Phone size={13} className="text-zinc-500" />
                      <span>{company.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {company.notes && (
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded p-2.5 text-xs">
                    <p className="text-zinc-400 line-clamp-3 leading-relaxed font-sans">{company.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleOpenEdit(company)}
                  className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 py-1.5 rounded text-xs transition-colors"
                >
                  <Edit2 size={12} /> Edit Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over / Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />

          {/* Drawer container */}
          <div className="relative w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 flex flex-col z-10 shadow-2xl animate-slideOver">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                  {editingCompany ? `Edit ${name}` : 'Register Company'}
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {editingCompany ? `ID: ${editingCompany._id}` : 'Create a persistent recruiter log'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Google India"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-200"
                  />
                </div>

                {/* Status and Visit Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">CRM Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-300"
                    >
                      <option value="prospect">Prospect</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="on_campus">On Campus</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">Expected Visit</label>
                    <input
                      type="date"
                      value={expectedVisitDate}
                      onChange={(e) => setExpectedVisitDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-300"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-900 my-4" />
                <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-550">Recruitment Contact</h4>

                {/* Contact Person */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. John Doe (Talent Lead)"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-200"
                  />
                </div>

                {/* Contact Email & Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="hr@company.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-250 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-250 font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-900 my-4" />
                <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-550">Intelligence Details</h4>

                {/* Average CTC, Industry, Rating */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Avg CTC</label>
                    <input
                      type="text"
                      value={avgCtc}
                      onChange={(e) => setAvgCtc(e.target.value)}
                      placeholder="12 LPA"
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-zinc-700 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="SaaS"
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-zinc-700 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono tracking-wider text-zinc-500 mb-1">Glassdoor</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={glassdoorRating}
                      onChange={(e) => setGlassdoorRating(e.target.value)}
                      placeholder="4.2"
                      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-zinc-700 text-zinc-200"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1.5">Coordinator Internal Notes</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Prefers candidates with React knowledge. Looking to hire 5 interns. Tech interview is hard."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs focus:outline-none focus:border-zinc-700 text-zinc-200 resize-none font-sans"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-900 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-250 hover:bg-zinc-850 rounded text-xs transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={13} />
                  ) : (
                    <Save size={13} />
                  )}
                  {editingCompany ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesManager;
