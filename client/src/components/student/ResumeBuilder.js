import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { BlobProvider } from '@react-pdf/renderer';
import JakesTemplate from './JakesTemplate';
import AtsScoreWidget from './AtsScoreWidget';
import { 
  FileText, Play, Save, RefreshCw, AlertTriangle, 
  CheckCircle, Plus, Trash2, 
  GraduationCap, Code, FileSignature
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeBuilder = () => {
  const [activeMode, setActiveMode] = useState('form'); // 'form' or 'code'
  const [resumeData, setResumeData] = useState(null);
  const [latexSource, setLatexSource] = useState('');
  const [compilingCode, setCompilingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [codePdfUrl, setCodePdfUrl] = useState(null);
  const [codeFallback, setCodeFallback] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: resData } = await axios.get('/students/resume/data');
        setResumeData(resData.resumeData);

        const { data: sourceData } = await axios.get('/students/resume/source');
        setLatexSource(sourceData.latexSource);
        
        // Compile initial LaTeX preview in background
        if (sourceData.latexSource) {
          compileLatexCode(sourceData.latexSource);
        }
      } catch (err) {
        toast.error("Failed to load resume workspace.");
      }
    };
    loadData();
    
    return () => {
      if (codePdfUrl) URL.revokeObjectURL(codePdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers for structural updates
  const updatePersonal = (field, val) => {
    setResumeData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: val }
    }));
  };

  const updateEducation = (index, field, val) => {
    const updated = [...resumeData.education];
    updated[index] = { ...updated[index], [field]: val };
    setResumeData(prev => ({ ...prev, education: updated }));
  };

  const addEducation = () => {
    const empty = { institution: '', degree: '', field: '', cgpa: '', startDate: '', endDate: '' };
    setResumeData(prev => ({ ...prev, education: [...prev.education, empty] }));
  };

  const deleteEducation = (index) => {
    const updated = resumeData.education.filter((_, idx) => idx !== index);
    setResumeData(prev => ({ ...prev, education: updated }));
  };

  const updateExperience = (index, field, val) => {
    const updated = [...resumeData.experience];
    updated[index] = { ...updated[index], [field]: val };
    setResumeData(prev => ({ ...prev, experience: updated }));
  };

  const updateExperienceBullet = (expIndex, bulletIndex, val) => {
    const updatedExp = [...resumeData.experience];
    const updatedBullets = [...updatedExp[expIndex].bullets];
    updatedBullets[bulletIndex] = val;
    updatedExp[expIndex] = { ...updatedExp[expIndex], bullets: updatedBullets };
    setResumeData(prev => ({ ...prev, experience: updatedExp }));
  };

  const addExperienceBullet = (expIndex) => {
    const updatedExp = [...resumeData.experience];
    updatedExp[expIndex] = { 
      ...updatedExp[expIndex], 
      bullets: [...(updatedExp[expIndex].bullets || []), ''] 
    };
    setResumeData(prev => ({ ...prev, experience: updatedExp }));
  };

  const deleteExperienceBullet = (expIndex, bulletIndex) => {
    const updatedExp = [...resumeData.experience];
    const updatedBullets = updatedExp[expIndex].bullets.filter((_, idx) => idx !== bulletIndex);
    updatedExp[expIndex] = { ...updatedExp[expIndex], bullets: updatedBullets };
    setResumeData(prev => ({ ...prev, experience: updatedExp }));
  };

  const addExperience = () => {
    const empty = { company: '', role: '', startDate: '', endDate: '', bullets: [''] };
    setResumeData(prev => ({ ...prev, experience: [...prev.experience, empty] }));
  };

  const deleteExperience = (index) => {
    const updated = resumeData.experience.filter((_, idx) => idx !== index);
    setResumeData(prev => ({ ...prev, experience: updated }));
  };

  const updateProject = (index, field, val) => {
    const updated = [...resumeData.projects];
    updated[index] = { ...updated[index], [field]: val };
    setResumeData(prev => ({ ...prev, projects: updated }));
  };

  const updateProjectBullet = (projIndex, bulletIndex, val) => {
    const updatedProj = [...resumeData.projects];
    const updatedBullets = [...updatedProj[projIndex].bullets];
    updatedBullets[bulletIndex] = val;
    updatedProj[projIndex] = { ...updatedProj[projIndex], bullets: updatedBullets };
    setResumeData(prev => ({ ...prev, projects: updatedProj }));
  };

  const addProjectBullet = (projIndex) => {
    const updatedProj = [...resumeData.projects];
    updatedProj[projIndex] = { 
      ...updatedProj[projIndex], 
      bullets: [...(updatedProj[projIndex].bullets || []), ''] 
    };
    setResumeData(prev => ({ ...prev, projects: updatedProj }));
  };

  const deleteProjectBullet = (projIndex, bulletIndex) => {
    const updatedProj = [...resumeData.projects];
    const updatedBullets = updatedProj[projIndex].bullets.filter((_, idx) => idx !== bulletIndex);
    updatedProj[projIndex] = { ...updatedProj[projIndex], bullets: updatedBullets };
    setResumeData(prev => ({ ...prev, projects: updatedProj }));
  };

  const addProject = () => {
    const empty = { name: '', technologies: '', startDate: '', endDate: '', bullets: [''] };
    setResumeData(prev => ({ ...prev, projects: [...prev.projects, empty] }));
  };

  const deleteProject = (index) => {
    const updated = resumeData.projects.filter((_, idx) => idx !== index);
    setResumeData(prev => ({ ...prev, projects: updated }));
  };

  const updateSkill = (field, val) => {
    setResumeData(prev => ({
      ...prev,
      skills: { ...prev.skills, [field]: val }
    }));
  };

  // Compile LaTeX code mode
  const compileLatexCode = async (sourceCode = latexSource) => {
    if (!sourceCode) return;
    setCompilingCode(true);
    try {
      const response = await axios.post('/students/resume/compile', 
        { latexSource: sourceCode },
        { responseType: 'blob' }
      );
      const isFallback = response.headers['x-latex-fallback'] === 'true';
      setCodeFallback(isFallback);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (codePdfUrl) URL.revokeObjectURL(codePdfUrl);
      setCodePdfUrl(url);
    } catch (err) {
      toast.error("LaTeX compilation failed.");
    } finally {
      setCompilingCode(false);
    }
  };

  // Save structured JSON form resume
  const handleSaveForm = async (blob) => {
    if (!blob) return;
    setSaving(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        await axios.post('/students/resume/data', {
          resumeData,
          pdfBase64: base64data
        });
        toast.success("Resume saved and published to profile!");
      };
    } catch (err) {
      toast.error("Failed to save resume.");
    } finally {
      setSaving(false);
    }
  };

  // Save raw LaTeX Code resume
  const handleSaveCode = async () => {
    setSaving(true);
    try {
      await axios.post('/students/resume/save', { latexSource });
      toast.success("LaTeX source code and PDF published!");
      if (codePdfUrl) compileLatexCode();
    } catch (err) {
      toast.error("Failed to save LaTeX resume.");
    } finally {
      setSaving(false);
    }
  };

  // Extract clean text representation for live ATS widget evaluation
  const getResumeTextRepresentation = () => {
    if (activeMode === 'code') return latexSource;
    if (!resumeData) return "";
    const parts = [
      resumeData.personal?.name,
      resumeData.personal?.email,
      resumeData.personal?.location,
      ...(resumeData.education || []).map(e => `${e.institution} ${e.degree} ${e.field}`),
      ...(resumeData.experience || []).flatMap(exp => [exp.company, exp.role, ...(exp.bullets || [])]),
      ...(resumeData.projects || []).flatMap(p => [p.name, p.technologies, ...(p.bullets || [])]),
      resumeData.skills?.languages,
      resumeData.skills?.frameworks,
      resumeData.skills?.tools
    ];
    return parts.filter(Boolean).join("\n");
  };

  // Insert LaTeX command helpers
  const insertLatexCmd = (cmd) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    let insertion = '';
    let offset = 0;
    
    if (cmd === 'bold') { insertion = '\\textbf{}'; offset = 8; }
    else if (cmd === 'italic') { insertion = '\\textit{}'; offset = 8; }
    else if (cmd === 'item') { insertion = '\\item '; offset = 6; }
    else if (cmd === 'section') { insertion = '\\section{}'; offset = 9; }
    
    setLatexSource(before + insertion + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offset, start + offset);
    }, 50);
  };

  if (!resumeData) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 text-zinc-100">
      
      {/* ── Top Dashboard Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-4 border border-zinc-800/80 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary-500/10 rounded-lg text-primary-500">
            <FileSignature size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-200">Interactive Resume Workspace</h1>
            <p className="text-xs text-zinc-500">Separates text content from LaTeX quality templates client-side.</p>
          </div>
        </div>

        {/* Tab Selector Toggle */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-850 rounded-lg">
          <button
            onClick={() => setActiveMode('form')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeMode === 'form' ? 'bg-zinc-850 text-primary-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <GraduationCap size={14} />
            Form Builder
          </button>
          <button
            onClick={() => setActiveMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${activeMode === 'code' ? 'bg-zinc-850 text-primary-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Code size={14} />
            Advanced LaTeX
          </button>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left pane: Active Editor View */}
        <div className="lg:col-span-5 flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-y-auto shadow-xl max-h-[calc(100vh-14rem)]">
          {activeMode === 'form' ? (
            <div className="p-5 space-y-6">
              <h2 className="text-sm font-bold border-b border-zinc-800 pb-2 text-zinc-300">Resume Details Form</h2>
              
              {/* Personal Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary-500">Contact Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Full Name</label>
                    <input 
                      value={resumeData.personal?.name || ''} 
                      onChange={e => updatePersonal('name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Email</label>
                    <input 
                      value={resumeData.personal?.email || ''} 
                      onChange={e => updatePersonal('email', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Phone</label>
                    <input 
                      value={resumeData.personal?.phone || ''} 
                      onChange={e => updatePersonal('phone', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Location</label>
                    <input 
                      value={resumeData.personal?.location || ''} 
                      onChange={e => updatePersonal('location', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">LinkedIn Profile Link</label>
                    <input 
                      value={resumeData.personal?.linkedin || ''} 
                      onChange={e => updatePersonal('linkedin', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">GitHub Link</label>
                    <input 
                      value={resumeData.personal?.github || ''} 
                      onChange={e => updatePersonal('github', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-primary-500">Education Details</h3>
                  <button onClick={addEducation} className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 font-semibold">
                    <Plus size={12} /> Add School
                  </button>
                </div>
                {resumeData.education?.map((edu, idx) => (
                  <div key={idx} className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-lg space-y-3 relative">
                    <button onClick={() => deleteEducation(idx)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Institution</label>
                        <input 
                          value={edu.institution || ''} 
                          onChange={e => updateEducation(idx, 'institution', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Degree</label>
                        <input 
                          value={edu.degree || ''} 
                          onChange={e => updateEducation(idx, 'degree', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Field / Department</label>
                        <input 
                          value={edu.field || ''} 
                          onChange={e => updateEducation(idx, 'field', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">CGPA / Score</label>
                        <input 
                          value={edu.cgpa || ''} 
                          onChange={e => updateEducation(idx, 'cgpa', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Start Date (e.g. Aug 2022)</label>
                        <input 
                          value={edu.startDate || ''} 
                          onChange={e => updateEducation(idx, 'startDate', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">End Date (e.g. May 2026)</label>
                        <input 
                          value={edu.endDate || ''} 
                          onChange={e => updateEducation(idx, 'endDate', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-primary-500">Work Experience</h3>
                  <button onClick={addExperience} className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 font-semibold">
                    <Plus size={12} /> Add Experience
                  </button>
                </div>
                {resumeData.experience?.map((exp, idx) => (
                  <div key={idx} className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-lg space-y-3 relative">
                    <button onClick={() => deleteExperience(idx)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Company</label>
                        <input 
                          value={exp.company || ''} 
                          onChange={e => updateExperience(idx, 'company', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Role</label>
                        <input 
                          value={exp.role || ''} 
                          onChange={e => updateExperience(idx, 'role', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Start Date</label>
                        <input 
                          value={exp.startDate || ''} 
                          onChange={e => updateExperience(idx, 'startDate', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">End Date</label>
                        <input 
                          value={exp.endDate || ''} 
                          onChange={e => updateExperience(idx, 'endDate', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Experience Bullets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[9px] text-zinc-400">Description Bullets</label>
                        <button onClick={() => addExperienceBullet(idx)} className="text-[9px] text-primary-500 hover:underline">
                          + Add Line
                        </button>
                      </div>
                      {exp.bullets?.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <input 
                            value={bullet || ''}
                            onChange={e => updateExperienceBullet(idx, bIdx, e.target.value)}
                            placeholder="e.g. Led design scaling for internal microservices..."
                            className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs focus:outline-none"
                          />
                          <button onClick={() => deleteExperienceBullet(idx, bIdx)} className="text-zinc-600 hover:text-red-500 shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Projects Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-primary-500">Academic / Side Projects</h3>
                  <button onClick={addProject} className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 font-semibold">
                    <Plus size={12} /> Add Project
                  </button>
                </div>
                {resumeData.projects?.map((proj, idx) => (
                  <div key={idx} className="bg-zinc-900/30 p-3 border border-zinc-900 rounded-lg space-y-3 relative">
                    <button onClick={() => deleteProject(idx)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Project Name</label>
                        <input 
                          value={proj.name || ''} 
                          onChange={e => updateProject(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Technologies Used</label>
                        <input 
                          value={proj.technologies || ''} 
                          onChange={e => updateProject(idx, 'technologies', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">Start Date</label>
                        <input 
                          value={proj.startDate || ''} 
                          onChange={e => updateProject(idx, 'startDate', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-zinc-400 mb-1">End Date</label>
                        <input 
                          value={proj.endDate || ''} 
                          onChange={e => updateProject(idx, 'endDate', e.target.value)}
                          className="w-full px-2 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Project Bullets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[9px] text-zinc-400">Description Bullets</label>
                        <button onClick={() => addProjectBullet(idx)} className="text-[9px] text-primary-500 hover:underline">
                          + Add Line
                        </button>
                      </div>
                      {proj.bullets?.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <input 
                            value={bullet || ''}
                            onChange={e => updateProjectBullet(idx, bIdx, e.target.value)}
                            placeholder="e.g. Integrated client-side PDF renderer using react-pdf..."
                            className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs focus:outline-none"
                          />
                          <button onClick={() => deleteProjectBullet(idx, bIdx)} className="text-zinc-600 hover:text-red-500 shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-primary-500 border-b border-zinc-900 pb-1">Technical Skills</h3>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Languages (comma-separated)</label>
                  <input 
                    value={resumeData.skills?.languages || ''} 
                    onChange={e => updateSkill('languages', e.target.value)}
                    placeholder="e.g. Python, JavaScript, Java, C++"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Frameworks (comma-separated)</label>
                  <input 
                    value={resumeData.skills?.frameworks || ''} 
                    onChange={e => updateSkill('frameworks', e.target.value)}
                    placeholder="e.g. React, Node.js, Express, Next.js, FastAPI"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Developer Tools (comma-separated)</label>
                  <input 
                    value={resumeData.skills?.tools || ''} 
                    onChange={e => updateSkill('tools', e.target.value)}
                    placeholder="e.g. Git, Docker, MongoDB, Postman"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* LaTeX Code Editor Header */}
              <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">source.tex</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => insertLatexCmd('bold')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] font-bold font-mono text-zinc-400 hover:text-zinc-200">B</button>
                  <button onClick={() => insertLatexCmd('italic')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] italic font-mono text-zinc-400 hover:text-zinc-200">I</button>
                  <button onClick={() => insertLatexCmd('section')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200">Sec</button>
                  <button onClick={() => insertLatexCmd('item')} className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200">• Item</button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={latexSource}
                onChange={e => setLatexSource(e.target.value)}
                className="flex-1 w-full p-4 bg-zinc-950 font-mono text-xs text-zinc-300 focus:outline-none resize-none leading-relaxed select-text cursor-text border-0 h-full"
                placeholder="% Type LaTeX Resume Code Here..."
              />
              {/* Control Footer for LaTeX Compile */}
              <div className="p-3 bg-zinc-900/40 border-t border-zinc-850 flex justify-end gap-2">
                <button 
                  onClick={() => compileLatexCode()}
                  disabled={compilingCode || !latexSource}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-all disabled:opacity-40"
                >
                  {compilingCode ? <RefreshCw size={12} className="animate-spin text-primary-500" /> : <Play size={12} className="text-emerald-500" />}
                  Compile
                </button>
                <button 
                  onClick={handleSaveCode}
                  disabled={saving || compilingCode || !latexSource}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-semibold rounded transition-all"
                >
                  {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                  Publish LaTeX
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right pane: radial preview & widget sidebar */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-4 max-h-[calc(100vh-14rem)] overflow-hidden">
          
          {/* Iframe preview container */}
          <div className="md:col-span-8 flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl min-h-[400px]">
            <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">live_preview.pdf</span>
              <div className="flex items-center gap-2">
                {activeMode === 'form' && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    <CheckCircle size={10} /> AUTO-RENDER
                  </span>
                )}
                {activeMode === 'code' && codeFallback && (
                  <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle size={10} /> FALLBACK
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-zinc-900 relative h-full">
              {activeMode === 'form' ? (
                <BlobProvider document={<JakesTemplate data={resumeData} />}>
                  {({ blob, url, loading, error }) => {
                    if (loading) {
                      return (
                        <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center gap-2">
                          <RefreshCw size={24} className="animate-spin text-primary-500" />
                          <span className="text-xs text-zinc-400 font-mono">Generating PDF...</span>
                        </div>
                      );
                    }
                    if (error) {
                      return (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-xs">
                          <AlertTriangle size={24} className="text-red-500 mb-2" />
                          Failed to compile PDF.
                        </div>
                      );
                    }
                    return (
                      <div className="w-full h-full flex flex-col">
                        <iframe 
                          src={url} 
                          className="flex-1 w-full border-0 bg-zinc-900" 
                          title="Structured Resume PDF Preview"
                        />
                        {/* Instant Save Bar */}
                        <div className="p-3 bg-zinc-950/90 border-t border-zinc-850 flex justify-between items-center gap-3">
                          <span className="text-[10px] text-zinc-500 font-mono">PDF compiled client-side instantly.</span>
                          <button
                            onClick={() => handleSaveForm(blob)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-semibold rounded-lg shadow-lg shadow-primary-500/10 transition-colors disabled:opacity-55"
                          >
                            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                            Publish & Sync Profile
                          </button>
                        </div>
                      </div>
                    );
                  }}
                </BlobProvider>
              ) : (
                <div className="w-full h-full flex flex-col">
                  {compilingCode && (
                    <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-primary-500" />
                      <span className="text-xs text-zinc-400 font-mono">Compiling LaTeX...</span>
                    </div>
                  )}
                  {codePdfUrl ? (
                    <iframe 
                      src={codePdfUrl} 
                      className="flex-1 w-full border-0 bg-zinc-900" 
                      title="LaTeX Code PDF Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs text-center p-4">
                      <FileText size={32} className="text-zinc-700 mb-2" />
                      No LaTeX PDF. Click Compile above.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right widget pane */}
          <div className="md:col-span-4 space-y-4">
            <AtsScoreWidget resumeText={getResumeTextRepresentation()} />
            
            {/* Template Card Info */}
            <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300 block">Jake's Resume Design</span>
              <p className="leading-relaxed text-[11px]">
                This layout follows standard, high-readability rules optimized for applicant tracking scanners. 
                Using clean dividers and the classic <strong className="text-zinc-200">Times-Roman</strong> serif font ensures premium presentation with zero styling clutter.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
            <h2 className="font-semibold text-sm text-zinc-200">LaTeX Cheatsheet</h2>
            <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
          </div>
          <div className="space-y-4 text-xs text-zinc-400">
            <div>
              <p className="font-semibold text-zinc-300 uppercase tracking-widest text-[9px] mb-1">Commands</p>
              <ul className="space-y-2 font-mono text-[10px]">
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\section{Name}"}</span> - Divider heading</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\textbf{Text}"}</span> - Bold</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\textit{Text}"}</span> - Italic</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\hfill"}</span> - Right-align</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\\\"}</span> - Line break</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-300 uppercase tracking-widest text-[9px] mb-1">List</p>
              <pre className="bg-zinc-900 p-2 rounded font-mono text-[10px] overflow-x-auto">
{`\\begin{itemize}
  \\item First bullet
  \\item Second bullet
\\end{itemize}`}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeBuilder;
