import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { BlobProvider } from '@react-pdf/renderer';
import JakesTemplate from './JakesTemplate';
import AtsScoreWidget from './AtsScoreWidget';
import { templates } from './Templates';
import { 
  FileText, Play, Save, RefreshCw, AlertTriangle, 
  Plus, Trash2, 
  GraduationCap, Code, FileSignature, Sparkles,
  ZoomIn, ZoomOut, Maximize, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeBuilder = () => {
  const [activeMode, setActiveMode] = useState('form'); // 'form' or 'code'
  const [activeSection, setActiveSection] = useState('personal'); // active accordion tab
  const [selectedTemplate, setSelectedTemplate] = useState('jakes'); // template ID
  const [resumeData, setResumeData] = useState(null);
  const [latexSource, setLatexSource] = useState('');
  const [compilingCode, setCompilingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [codePdfUrl, setCodePdfUrl] = useState(null);
  const [codeFallback, setCodeFallback] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // PDF preview states
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Auto-save states
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved', 'Saving...', 'Unsaved Changes'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveIndicatorText, setSaveIndicatorText] = useState('All changes saved');

  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

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

  // Debounced auto-save hook for structural JSON resume data changes
  useEffect(() => {
    if (!resumeData) return;
    
    setSaveStatus('Saving...');
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await axios.post('/students/resume/data', { resumeData });
        setSaveStatus('Auto-saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus('Unsaved Changes');
      }
    }, 2500); // 2.5s debounce timer
    
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData]);

  // Update save indicator display text
  useEffect(() => {
    if (saveStatus === 'Saving...') {
      setSaveIndicatorText('Saving draft...');
      return;
    }
    if (saveStatus === 'Unsaved Changes') {
      setSaveIndicatorText('Unsaved changes');
      return;
    }
    
    if (!lastSavedTime) {
      setSaveIndicatorText('All changes saved');
      return;
    }

    const updateText = () => {
      const diff = Math.round((new Date() - lastSavedTime) / 1000);
      if (diff < 5) {
        setSaveIndicatorText('Saved just now');
      } else if (diff < 60) {
        setSaveIndicatorText(`Saved ${diff}s ago`);
      } else {
        setSaveIndicatorText(`Saved at ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    };
    
    updateText();
    const interval = setInterval(updateText, 5000);
    return () => clearInterval(interval);
  }, [saveStatus, lastSavedTime]);

  // Keyboard shortcut listener to exit fullscreen with Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Save structured JSON form resume along with base64 PDF
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
        setSaveStatus('Auto-saved');
        setLastSavedTime(new Date());
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

  // Custom hotkey/helpers for code cheatsheet
  const insertLatexCmd = (cmd, placeholderOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setLatexSource(before + cmd + after);

    setTimeout(() => {
      textarea.focus();
      const offset = cmd.length - placeholderOffset;
      textarea.setSelectionRange(start + offset, start + offset);
    }, 50);
  };

  // ── FORM SECTION RENDERING HELPERS ──
  const renderPersonalForm = () => (
    <div className="space-y-3 pt-1">
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
          <label className="block text-[10px] text-zinc-400 mb-1">Phone Number</label>
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
            placeholder="City, India"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1">LinkedIn URL</label>
          <input 
            value={resumeData.personal?.linkedin || ''} 
            onChange={e => updatePersonal('linkedin', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
            placeholder="linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1">GitHub URL</label>
          <input 
            value={resumeData.personal?.github || ''} 
            onChange={e => updatePersonal('github', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
            placeholder="github.com/..."
          />
        </div>
      </div>
    </div>
  );

  const renderEducationForm = () => (
    <div className="space-y-4 pt-1">
      {resumeData.education?.map((edu, idx) => (
        <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-3 relative">
          <button
            onClick={() => deleteEducation(idx)}
            className="absolute top-2 right-2 text-zinc-555 hover:text-red-400 transition-colors"
            title="Delete School"
          >
            <Trash2 size={12} />
          </button>
          <div className="text-[10px] font-mono text-zinc-500 uppercase">School #{idx + 1}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] text-zinc-400 mb-1">Institution</label>
              <input 
                value={edu.institution || ''} 
                onChange={e => updateEducation(idx, 'institution', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Degree</label>
              <input 
                value={edu.degree || ''} 
                onChange={e => updateEducation(idx, 'degree', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                placeholder="B.Tech, High School"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Field of Study</label>
              <input 
                value={edu.field || ''} 
                onChange={e => updateEducation(idx, 'field', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                placeholder="CSE, Science"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">CGPA / Grade</label>
              <input 
                value={edu.cgpa || ''} 
                onChange={e => updateEducation(idx, 'cgpa', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-zinc-500 mb-1">Start Date</label>
                <input 
                  value={edu.startDate || ''} 
                  onChange={e => updateEducation(idx, 'startDate', e.target.value)}
                  className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="Aug 2022"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 mb-1">End Date</label>
                <input 
                  value={edu.endDate || ''} 
                  onChange={e => updateEducation(idx, 'endDate', e.target.value)}
                  className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="May 2026"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addEducation}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-450 hover:text-zinc-300 transition-colors"
      >
        <Plus size={12} /> Add Institution
      </button>
    </div>
  );

  const renderExperienceForm = () => (
    <div className="space-y-4 pt-1">
      {resumeData.experience?.map((exp, idx) => (
        <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-3 relative">
          <button
            onClick={() => deleteExperience(idx)}
            className="absolute top-2 right-2 text-zinc-555 hover:text-red-400 transition-colors"
            title="Delete Experience"
          >
            <Trash2 size={12} />
          </button>
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Work Experience #{idx + 1}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Company</label>
              <input 
                value={exp.company || ''} 
                onChange={e => updateExperience(idx, 'company', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Role</label>
              <input 
                value={exp.role || ''} 
                onChange={e => updateExperience(idx, 'role', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-zinc-500 mb-1">Start Date</label>
                <input 
                  value={exp.startDate || ''} 
                  onChange={e => updateExperience(idx, 'startDate', e.target.value)}
                  className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="May 2025"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 mb-1">End Date</label>
                <input 
                  value={exp.endDate || ''} 
                  onChange={e => updateExperience(idx, 'endDate', e.target.value)}
                  className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="July 2025"
                />
              </div>
            </div>
          </div>
          
          {/* Bullet Points */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[10px] font-mono uppercase text-zinc-550">Description Bullets</label>
            {exp.bullets?.map((b, bIdx) => (
              <div key={bIdx} className="flex gap-2 items-center">
                <span className="text-zinc-650 text-xs shrink-0 select-none">•</span>
                <input 
                  value={b} 
                  onChange={e => updateExperienceBullet(idx, bIdx, e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="Action-verb bullet describing accomplishment..."
                />
                <button
                  onClick={() => deleteExperienceBullet(idx, bIdx)}
                  className="text-zinc-650 hover:text-red-400 p-0.5"
                  title="Remove Line"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => addExperienceBullet(idx)}
              className="text-[10px] font-mono text-primary-500 hover:text-primary-400 flex items-center gap-1 pt-1"
            >
              <Plus size={10} /> Add Description Bullet
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addExperience}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-450 hover:text-zinc-300 transition-colors"
      >
        <Plus size={12} /> Add Experience Record
      </button>
    </div>
  );

  const renderProjectsForm = () => (
    <div className="space-y-4 pt-1">
      {resumeData.projects?.map((proj, idx) => (
        <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-3 relative">
          <button
            onClick={() => deleteProject(idx)}
            className="absolute top-2 right-2 text-zinc-555 hover:text-red-400 transition-colors"
            title="Delete Project"
          >
            <Trash2 size={12} />
          </button>
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Project #{idx + 1}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Project Name</label>
              <input 
                value={proj.name || ''} 
                onChange={e => updateProject(idx, 'name', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Technologies Used</label>
              <input 
                value={proj.technologies || ''} 
                onChange={e => updateProject(idx, 'technologies', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                placeholder="React, Express, Git"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-zinc-500 mb-1">Start Date</label>
                <input 
                  value={proj.startDate || ''} 
                  onChange={e => updateProject(idx, 'startDate', e.target.value)}
                  className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="Jan 2026"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-500 mb-1">End Date</label>
                <input 
                  value={proj.endDate || ''} 
                  onChange={e => updateProject(idx, 'endDate', e.target.value)}
                  className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="Present"
                />
              </div>
            </div>
          </div>
          
          {/* Project Bullets */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[10px] font-mono uppercase text-zinc-550">Accomplishment Bullets</label>
            {proj.bullets?.map((b, bIdx) => (
              <div key={bIdx} className="flex gap-2 items-center">
                <span className="text-zinc-650 text-xs shrink-0 select-none">•</span>
                <input 
                  value={b} 
                  onChange={e => updateProjectBullet(idx, bIdx, e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded text-xs focus:outline-none"
                  placeholder="Description of task accomplished..."
                />
                <button
                  onClick={() => deleteProjectBullet(idx, bIdx)}
                  className="text-zinc-650 hover:text-red-400 p-0.5"
                  title="Remove Line"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => addProjectBullet(idx)}
              className="text-[10px] font-mono text-primary-500 hover:text-primary-400 flex items-center gap-1 pt-1"
            >
              <Plus size={10} /> Add Accomplishment Bullet
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addProject}
        className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-450 hover:text-zinc-300 transition-colors"
      >
        <Plus size={12} /> Add Project Record
      </button>
    </div>
  );

  const renderSkillsForm = () => (
    <div className="space-y-4 pt-1">
      <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl space-y-4">
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">Programming Languages</label>
          <input 
            value={resumeData.skills?.languages || ''} 
            onChange={e => updateSkill('languages', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs focus:outline-none focus:border-zinc-700"
            placeholder="JavaScript, Python, C++, SQL"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">Libraries & Frameworks</label>
          <input 
            value={resumeData.skills?.frameworks || ''} 
            onChange={e => updateSkill('frameworks', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs focus:outline-none focus:border-zinc-700"
            placeholder="React, Express, Node.js, TailwindCSS"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">Tools & Platforms</label>
          <input 
            value={resumeData.skills?.tools || ''} 
            onChange={e => updateSkill('tools', e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs focus:outline-none focus:border-zinc-700"
            placeholder="Git, Docker, Postman, AWS, MongoDB"
          />
        </div>
      </div>
    </div>
  );

  const renderTemplateSelector = () => (
    <div className="space-y-4 pt-1">
      <div className="grid grid-cols-1 gap-3">
        {Object.values(templates).map(tmpl => (
          <button
            key={tmpl.id}
            onClick={() => {
              setSelectedTemplate(tmpl.id);
              toast.success(`Switched to ${tmpl.name}!`);
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedTemplate === tmpl.id 
                ? 'bg-zinc-900 border-primary-500 shadow-lg shadow-primary-500/5' 
                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none">{tmpl.thumbnail}</span>
              <div>
                <h4 className={`text-xs font-semibold ${selectedTemplate === tmpl.id ? 'text-primary-400' : 'text-zinc-200'}`}>{tmpl.name}</h4>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">{tmpl.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const sectionsList = resumeData ? [
    { id: 'personal', name: 'Contact Details', icon: FileSignature, completed: !!(resumeData.personal?.name && resumeData.personal?.email) },
    { id: 'education', name: 'Education History', icon: GraduationCap, completed: !!(resumeData.education?.length > 0 && resumeData.education[0]?.institution) },
    { id: 'experience', name: 'Work Experience', icon: FileText, completed: !!(resumeData.experience?.length > 0 && resumeData.experience[0]?.company) },
    { id: 'projects', name: 'Academic Projects', icon: Code, completed: !!(resumeData.projects?.length > 0 && resumeData.projects[0]?.name) },
    { id: 'skills', name: 'Skills Summary', icon: Save, completed: !!(resumeData.skills?.languages || resumeData.skills?.frameworks) },
    { id: 'templates', name: 'Choose Template', icon: Sparkles, completed: true }
  ] : [];

  if (!resumeData) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const ActiveTemplate = templates[selectedTemplate]?.component || JakesTemplate;

  return (
    <div className="h-[calc(100vh-10.5rem)] flex flex-col gap-4 text-zinc-100">
      
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden">
        
        {/* Left pane: Active Editor Accordion / LaTeX Code */}
        <div className="lg:col-span-5 flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl lg:overflow-y-auto shadow-xl lg:h-full">
          {activeMode === 'form' ? (
            <div className="space-y-3 p-4">
              {sectionsList.map(sec => {
                const Icon = sec.icon;
                const isOpen = activeSection === sec.id;
                return (
                  <div 
                    key={sec.id} 
                    className={`border rounded-xl transition-all overflow-hidden ${
                      isOpen 
                        ? 'bg-zinc-950 border-primary-500/40 shadow-md shadow-primary-500/2' 
                        : 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-800'
                    }`}
                  >
                    {/* Header bar button */}
                    <button
                      onClick={() => setActiveSection(isOpen ? null : sec.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded-lg ${isOpen ? 'bg-primary-500/10 text-primary-400' : 'bg-zinc-950 text-zinc-550'}`}>
                          <Icon size={14} />
                        </span>
                        <span className={`text-xs font-semibold ${isOpen ? 'text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                          {sec.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sec.completed && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none">
                            ✓ Complete
                          </span>
                        )}
                        <span className="text-zinc-600 text-[9px] select-none font-mono">
                          {isOpen ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* Collapsible content */}
                    {isOpen && (
                      <div className="px-4 pb-5 pt-1 border-t border-zinc-850 bg-zinc-955/5">
                        {sec.id === 'personal' && renderPersonalForm()}
                        {sec.id === 'education' && renderEducationForm()}
                        {sec.id === 'experience' && renderExperienceForm()}
                        {sec.id === 'projects' && renderProjectsForm()}
                        {sec.id === 'skills' && renderSkillsForm()}
                        {sec.id === 'templates' && renderTemplateSelector()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Advanced LaTeX raw source code workspace */
            <div className="flex-1 flex flex-col p-4 space-y-4 h-full">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">latex_source.tex</span>
                <button
                  onClick={() => setShowHelp(prev => !prev)}
                  className="text-primary-500 hover:underline text-[10px] font-mono"
                >
                  {showHelp ? "Hide Cheatsheet" : "Show Cheatsheet"}
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={latexSource}
                onChange={e => setLatexSource(e.target.value)}
                className="flex-1 w-full bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-zinc-700 leading-relaxed resize-none"
                placeholder="% Type your custom LaTeX code here..."
              />

              <div className="flex justify-between items-center gap-3 shrink-0">
                <span className="text-[10px] text-zinc-500 font-mono">Requires local pdflatex compiler or fallbacks.</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => compileLatexCode()}
                    disabled={compilingCode || !latexSource}
                    className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded transition-all"
                  >
                    {compilingCode ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                    Compile PDF
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
            </div>
          )}
        </div>

        {/* Center/Right pane: PDF preview & widget area */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:h-full lg:overflow-hidden">
          
          {/* PDF preview container */}
          <div className="flex-1 flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl min-h-[500px] lg:min-h-0">
            {activeMode === 'form' ? (
              <BlobProvider document={<ActiveTemplate data={resumeData} />}>
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

                  const handleDownload = () => {
                    if (!url) return;
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${resumeData.personal?.name || 'Resume'}.pdf`;
                    link.click();
                  };

                  return (
                    <div className="w-full h-full flex flex-col">
                      {/* Premium Viewer Toolbar */}
                      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">live_preview.pdf</span>
                          <span className="text-[9px] text-zinc-650">•</span>
                          <span className="text-[9px] font-mono text-zinc-550 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' : saveStatus === 'Auto-saved' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                            {saveIndicatorText}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Zoom Scale Controls */}
                          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 border border-zinc-850 rounded-lg">
                            <button 
                              onClick={() => setZoomScale(prev => Math.max(prev - 0.1, 0.6))}
                              disabled={zoomScale <= 0.6}
                              className="p-1 text-zinc-450 hover:text-zinc-200 disabled:opacity-40 rounded"
                              title="Zoom Out"
                            >
                              <ZoomOut size={12} />
                            </button>
                            <span className="text-[9px] font-mono px-1.5 text-zinc-400 select-none">{Math.round(zoomScale * 100)}%</span>
                            <button 
                              onClick={() => setZoomScale(prev => Math.min(prev + 0.1, 1.5))}
                              disabled={zoomScale >= 1.5}
                              className="p-1 text-zinc-450 hover:text-zinc-200 disabled:opacity-40 rounded"
                              title="Zoom In"
                            >
                              <ZoomIn size={12} />
                            </button>
                          </div>

                          <span className="w-[1px] h-3.5 bg-zinc-850 mx-0.5" />

                          {/* Action Buttons */}
                          <button
                            onClick={handleDownload}
                            className="p-1.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg"
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>
                          <button 
                            onClick={() => setIsFullscreen(prev => !prev)}
                            className={`p-1.5 border rounded-lg ${isFullscreen ? 'text-primary-400 bg-zinc-900 border-primary-500/20' : 'text-zinc-450 hover:text-zinc-200 bg-zinc-950 border-zinc-850'}`}
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
                          >
                            <Maximize size={13} />
                          </button>
                        </div>
                      </div>

                      {/* PDF object representation with zoom */}
                      <div className="flex-1 bg-zinc-900 overflow-auto relative p-2 flex justify-center items-start">
                        <object 
                          data={`${url}#toolbar=0&navpanes=0&view=FitH`} 
                          type="application/pdf"
                          className="border-0 shadow-lg bg-zinc-950"
                          style={{
                            width: `${zoomScale * 100}%`,
                            height: '98%',
                            minHeight: '450px',
                            transition: 'width 0.15s ease-out'
                          }}
                          aria-label="Structured Resume PDF Preview"
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-405 text-xs bg-zinc-900">
                            <FileText size={32} className="text-zinc-700 mb-2" />
                            <p>PDF preview loaded.</p>
                            <a href={url} target="_blank" rel="noreferrer" className="text-primary-500 underline mt-2 font-semibold">
                              Open PDF in new tab
                            </a>
                          </div>
                        </object>
                      </div>

                      {/* Instant Save Bar */}
                      <div className="p-3 bg-zinc-950/90 border-t border-zinc-850 flex justify-between items-center gap-3 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-mono">PDF compiled client-side instantly.</span>
                        <button
                          onClick={() => handleSaveForm(blob)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-semibold rounded-lg shadow-lg shadow-primary-500/10 transition-all disabled:opacity-55"
                        >
                          {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                          Publish & Sync Profile
                        </button>
                      </div>

                      {/* Fullscreen Overlay Mode */}
                      {isFullscreen && (
                        <div className="fixed inset-0 z-[9999] bg-zinc-950 p-6 flex flex-col gap-4">
                          <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">fullscreen_preview.pdf</span>
                              <span className="text-[9px] text-zinc-600 font-mono">|</span>
                              <span className="text-[10px] text-zinc-500 font-mono">Press ESC to exit</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg"
                              >
                                <Download size={12} /> Download
                              </button>
                              <button
                                onClick={() => setIsFullscreen(false)}
                                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-semibold rounded-lg"
                              >
                                Exit Fullscreen
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative flex justify-center items-start p-4">
                            <object 
                              data={`${url}#toolbar=0&navpanes=0&view=FitH`} 
                              type="application/pdf"
                              className="h-full w-4/5 border-0 bg-zinc-950 shadow-2xl"
                              aria-label="Fullscreen Resume Preview"
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 text-xs bg-zinc-900">
                                <p>Fullscreen preview loaded.</p>
                                <a href={url} target="_blank" rel="noreferrer" className="text-primary-500 underline mt-2">Open in tab</a>
                              </div>
                            </object>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              </BlobProvider>
            ) : (
              /* PDF Viewer for custom LaTeX Code Compile */
              <div className="w-full h-full flex flex-col h-full">
                <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">live_preview.pdf</span>
                  <div className="flex items-center gap-2">
                    {codeFallback && (
                      <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={10} /> FALLBACK
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 bg-zinc-900 relative h-full">
                  {compilingCode && (
                    <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center gap-2 z-10">
                      <RefreshCw size={24} className="animate-spin text-primary-500" />
                      <span className="text-xs text-zinc-400 font-mono">Compiling LaTeX...</span>
                    </div>
                  )}
                  {codePdfUrl ? (
                    <object 
                      data={`${codePdfUrl}#toolbar=0&navpanes=0&view=FitH`} 
                      type="application/pdf"
                      className="w-full h-full border-0 bg-zinc-900"
                      aria-label="LaTeX Code PDF Preview"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-450 text-xs bg-zinc-900">
                        <FileText size={32} className="text-zinc-700 mb-2" />
                        <p>PDF preview loaded.</p>
                        <a href={codePdfUrl} target="_blank" rel="noreferrer" className="text-primary-500 underline mt-2 font-semibold">
                          Open PDF in new tab
                        </a>
                      </div>
                    </object>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-550 text-xs text-center p-4 h-[400px]">
                      <FileText size={32} className="text-zinc-700 mb-2" />
                      No LaTeX PDF compiled. Click Compile on the left.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom widgets area */}
          <div className="flex flex-col sm:flex-row gap-4 h-auto shrink-0 pb-4">
            <div className="flex-1">
              <AtsScoreWidget resumeText={getResumeTextRepresentation()} />
            </div>
            <div className="flex-1 bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl space-y-2.5 text-xs text-zinc-400 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-300 block">Resume Rationale & Styling</span>
                <p className="leading-relaxed text-[11px] text-zinc-500">
                  This builder is designed specifically around single-page recruiter-friendly standards. 
                  By separating content fields from styling templates, you avoid parsing bugs and guarantee your resume compiles correctly in automated placement filters.
                </p>
              </div>
              <div className="text-[10px] text-zinc-650 font-mono border-t border-zinc-850 pt-2 flex justify-between items-center">
                <span>Active Template: {templates[selectedTemplate]?.name}</span>
                <span>🎓 PlaceIQ CV Engine</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Cheatsheet overlay panel for LaTeX editor */}
      {showHelp && activeMode === 'code' && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
            <h2 className="font-semibold text-sm text-zinc-200">LaTeX Cheatsheet</h2>
            <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">Close</button>
          </div>
          <div className="space-y-4 text-xs text-zinc-400">
            <div>
              <h3 className="font-bold text-zinc-300 mb-1">Sections & Hierarchy</h3>
              <div className="space-y-1 font-mono text-[11px]">
                <button onClick={() => insertLatexCmd("\\section{Education}\n", 0)} className="block w-full text-left bg-zinc-900 hover:bg-zinc-850 p-1.5 rounded border border-zinc-800 text-primary-400">
                  {"\\section{Section Name}"}
                </button>
                <button onClick={() => insertLatexCmd("\\subsection{Sub-section}\n", 0)} className="block w-full text-left bg-zinc-900 hover:bg-zinc-850 p-1.5 rounded border border-zinc-800 text-primary-400 mt-1">
                  {"\\subsection{Sub-section}"}
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-zinc-300 mb-1">Lists & Bullet Points</h3>
              <div className="space-y-1 font-mono text-[11px]">
                <button onClick={() => insertLatexCmd("\\begin{itemize}\n  \\item \n\\end{itemize}", 14)} className="block w-full text-left bg-zinc-900 hover:bg-zinc-850 p-1.5 rounded border border-zinc-800 text-primary-400">
                  {"\\begin{itemize} \\item \\end{itemize}"}
                </button>
                <button onClick={() => insertLatexCmd("\\item ", 0)} className="block w-full text-left bg-zinc-900 hover:bg-zinc-850 p-1.5 rounded border border-zinc-800 text-primary-400 mt-1">
                  {"\\item bullet point"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-zinc-300 mb-1">Text Formatting</h3>
              <div className="space-y-1 font-mono text-[11px]">
                <button onClick={() => insertLatexCmd("\\textbf{bold text}", 1)} className="block w-full text-left bg-zinc-900 hover:bg-zinc-850 p-1.5 rounded border border-zinc-800 text-primary-400">
                  {"\\textbf{bold text}"}
                </button>
                <button onClick={() => insertLatexCmd("\\textit{italic text}", 1)} className="block w-full text-left bg-zinc-900 hover:bg-zinc-850 p-1.5 rounded border border-zinc-800 text-primary-400 mt-1">
                  {"\\textit{italic text}"}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800 text-[11px] leading-relaxed">
              <span className="font-semibold text-zinc-300 block mb-1">Escaping Rules:</span>
              Remember to escape special characters:
              <br />• Write <code className="text-primary-400">\%</code> instead of <code className="text-zinc-300">%</code>
              <br />• Write <code className="text-primary-400">\&</code> instead of <code className="text-zinc-300">&</code>
              <br />• Write <code className="text-primary-400">\_</code> instead of <code className="text-zinc-300">_</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
