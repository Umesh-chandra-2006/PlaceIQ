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
  ZoomIn, ZoomOut, Maximize, Download,
  Upload, X, Check, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const isStandardJsonResume = (data) => {
  return data && data.basics && data.work && Array.isArray(data.skills);
};

const convertToStandardJsonResume = (data) => {
  if (!data) return {};
  if (isStandardJsonResume(data)) return data;

  return {
    basics: {
      name: data.personal?.name || "",
      email: data.personal?.email || "",
      phone: data.personal?.phone || "",
      url: "",
      summary: "Motivated student eager to contribute to software development and engineering teams.",
      location: {
        address: "",
        postalCode: "",
        city: data.personal?.location || "India",
        countryCode: "IN",
        region: ""
      },
      profiles: [
        {
          network: "GitHub",
          username: "",
          url: data.personal?.github || ""
        },
        {
          network: "LinkedIn",
          username: "",
          url: data.personal?.linkedin || ""
        }
      ]
    },
    education: (data.education || []).map(e => ({
      institution: e.institution || "",
      url: "",
      area: e.field || "",
      studyType: e.degree || "",
      startDate: e.startDate || "",
      endDate: e.endDate || "",
      score: e.cgpa || "",
      courses: []
    })),
    work: (data.experience || []).map(exp => ({
      name: exp.company || "",
      position: exp.role || "",
      url: "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      summary: "",
      highlights: exp.bullets || []
    })),
    projects: (data.projects || []).map(p => ({
      name: p.name || "",
      description: "",
      highlights: p.bullets || [],
      keywords: p.technologies ? p.technologies.split(",").map(s => s.trim()) : [],
      startDate: p.startDate || "",
      endDate: p.endDate || "",
      url: ""
    })),
    skills: [
      {
        name: "Languages",
        level: "Expert",
        keywords: data.skills?.languages ? data.skills.languages.split(",").map(s => s.trim()) : []
      },
      {
        name: "Frameworks",
        level: "Intermediate",
        keywords: data.skills?.frameworks ? data.skills.frameworks.split(",").map(s => s.trim()) : []
      },
      {
        name: "Tools",
        level: "Intermediate",
        keywords: data.skills?.tools ? data.skills.tools.split(",").map(s => s.trim()) : []
      }
    ]
  };
};

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

  // AI Optimizer States
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(25);
  const [resetDate, setResetDate] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedDraft, setOptimizedDraft] = useState(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: resData } = await axios.get('/students/resume/data');
        setResumeData(resData.resumeData);
        if (resData.aiOptimizationsUsed !== undefined) {
          setQuotaUsed(resData.aiOptimizationsUsed);
          setQuotaLimit(resData.aiOptimizationQuota);
          setResetDate(resData.aiOptimizationResetDate);
        }

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
    setResumeData(prev => {
      const basics = prev.basics ? { ...prev.basics } : {};
      if (field === 'location') {
        basics.location = { ...basics.location, city: val };
      } else if (field === 'github') {
        const profiles = [...(basics.profiles || [])];
        let gh = profiles.find(p => p.network?.toLowerCase() === 'github');
        if (gh) {
          gh.url = val;
        } else {
          profiles.push({ network: 'GitHub', username: '', url: val });
        }
        basics.profiles = profiles;
      } else if (field === 'linkedin') {
        const profiles = [...(basics.profiles || [])];
        let li = profiles.find(p => p.network?.toLowerCase() === 'linkedin');
        if (li) {
          li.url = val;
        } else {
          profiles.push({ network: 'LinkedIn', username: '', url: val });
        }
        basics.profiles = profiles;
      } else {
        basics[field] = val;
      }
      return { ...prev, basics };
    });
  };

  const updateEducation = (index, field, val) => {
    setResumeData(prev => {
      const updated = [...(prev.education || [])];
      const item = { ...updated[index] };
      if (field === 'field') item.area = val;
      else if (field === 'degree') item.studyType = val;
      else if (field === 'cgpa') item.score = val;
      else item[field] = val;
      updated[index] = item;
      return { ...prev, education: updated };
    });
  };

  const addEducation = () => {
    const empty = { institution: '', studyType: '', area: '', score: '', startDate: '', endDate: '', courses: [] };
    setResumeData(prev => ({ ...prev, education: [...(prev.education || []), empty] }));
  };

  const deleteEducation = (index) => {
    setResumeData(prev => {
      const updated = (prev.education || []).filter((_, idx) => idx !== index);
      return { ...prev, education: updated };
    });
  };

  const updateExperience = (index, field, val) => {
    setResumeData(prev => {
      const updated = [...(prev.work || prev.experience || [])];
      const item = { ...updated[index] };
      if (field === 'company') item.name = val;
      else if (field === 'role') item.position = val;
      else item[field] = val;
      updated[index] = item;
      return { ...prev, work: updated };
    });
  };

  const updateExperienceBullet = (expIndex, bulletIndex, val) => {
    setResumeData(prev => {
      const updatedWork = [...(prev.work || prev.experience || [])];
      const item = { ...updatedWork[expIndex] };
      const updatedHighlights = [...(item.highlights || item.bullets || [])];
      updatedHighlights[bulletIndex] = val;
      item.highlights = updatedHighlights;
      item.bullets = updatedHighlights;
      updatedWork[expIndex] = item;
      return { ...prev, work: updatedWork };
    });
  };

  const addExperienceBullet = (expIndex) => {
    setResumeData(prev => {
      const updatedWork = [...(prev.work || prev.experience || [])];
      const item = { ...updatedWork[expIndex] };
      const highlights = item.highlights || item.bullets || [];
      item.highlights = [...highlights, ''];
      item.bullets = item.highlights;
      updatedWork[expIndex] = item;
      return { ...prev, work: updatedWork };
    });
  };

  const deleteExperienceBullet = (expIndex, bulletIndex) => {
    setResumeData(prev => {
      const updatedWork = [...(prev.work || prev.experience || [])];
      const item = { ...updatedWork[expIndex] };
      const highlights = (item.highlights || item.bullets || []).filter((_, idx) => idx !== bulletIndex);
      item.highlights = highlights;
      item.bullets = highlights;
      updatedWork[expIndex] = item;
      return { ...prev, work: updatedWork };
    });
  };

  const addExperience = () => {
    const empty = { name: '', position: '', startDate: '', endDate: '', summary: '', highlights: [''] };
    setResumeData(prev => ({ ...prev, work: [...(prev.work || prev.experience || []), empty] }));
  };

  const deleteExperience = (index) => {
    setResumeData(prev => {
      const updated = (prev.work || prev.experience || []).filter((_, idx) => idx !== index);
      return { ...prev, work: updated };
    });
  };

  const updateProject = (index, field, val) => {
    setResumeData(prev => {
      const updated = [...(prev.projects || [])];
      const item = { ...updated[index] };
      if (field === 'technologies') {
        item.keywords = val.split(',').map(s => s.trim());
      } else {
        item[field] = val;
      }
      updated[index] = item;
      return { ...prev, projects: updated };
    });
  };

  const updateProjectBullet = (projIndex, bulletIndex, val) => {
    setResumeData(prev => {
      const updatedProj = [...(prev.projects || [])];
      const item = { ...updatedProj[projIndex] };
      const updatedHighlights = [...(item.highlights || item.bullets || [])];
      updatedHighlights[bulletIndex] = val;
      item.highlights = updatedHighlights;
      item.bullets = updatedHighlights;
      updatedProj[projIndex] = item;
      return { ...prev, projects: updatedProj };
    });
  };

  const addProjectBullet = (projIndex) => {
    setResumeData(prev => {
      const updatedProj = [...(prev.projects || [])];
      const item = { ...updatedProj[projIndex] };
      const highlights = item.highlights || item.bullets || [];
      item.highlights = [...highlights, ''];
      item.bullets = item.highlights;
      updatedProj[projIndex] = item;
      return { ...prev, projects: updatedProj };
    });
  };

  const deleteProjectBullet = (projIndex, bulletIndex) => {
    setResumeData(prev => {
      const updatedProj = [...(prev.projects || [])];
      const item = { ...updatedProj[projIndex] };
      const highlights = (item.highlights || item.bullets || []).filter((_, idx) => idx !== bulletIndex);
      item.highlights = highlights;
      item.bullets = highlights;
      updatedProj[projIndex] = item;
      return { ...prev, projects: updatedProj };
    });
  };

  const addProject = () => {
    const empty = { name: '', keywords: [], highlights: [''], startDate: '', endDate: '', url: '', description: '' };
    setResumeData(prev => ({ ...prev, projects: [...(prev.projects || []), empty] }));
  };

  const deleteProject = (index) => {
    setResumeData(prev => {
      const updated = (prev.projects || []).filter((_, idx) => idx !== index);
      return { ...prev, projects: updated };
    });
  };

  const updateSkill = (category, val) => {
    setResumeData(prev => {
      const skills = Array.isArray(prev.skills) ? [...prev.skills] : [];
      let item = skills.find(s => s.name?.toLowerCase() === category.toLowerCase());
      const keywords = val.split(',').map(s => s.trim());
      if (item) {
        item.keywords = keywords;
      } else {
        skills.push({ name: category, level: 'Intermediate', keywords });
      }
      return { ...prev, skills };
    });
  };

  // Import/Export functions
  const handleExportJson = () => {
    if (!resumeData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${resumeData.basics?.name || 'resume'}_schema.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("JSON Resume schema exported successfully!");
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const normalized = isStandardJsonResume(importedData) 
          ? importedData 
          : convertToStandardJsonResume(importedData);
        setResumeData(normalized);
        toast.success("JSON Resume imported and normalized successfully!");
      } catch (err) {
        toast.error("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // AI Optimizer Functions
  const handleAiOptimize = async () => {
    setOptimizing(true);
    try {
      const response = await axios.post('/students/resume/ai-optimize', {
        jobDescription,
        resumeData
      });
      if (response.data?.success) {
        setOptimizedDraft(response.data.resumeData);
        setQuotaUsed(response.data.quotaUsed);
        setQuotaLimit(response.data.quotaLimit);
        setShowDiffModal(true);
        toast.success("AI optimization proposal generated!");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "AI optimization failed.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimization = () => {
    if (!optimizedDraft) return;
    setResumeData(optimizedDraft);
    setShowDiffModal(false);
    toast.success("AI tailored resume applied to workspace! Saving...");
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
      resumeData.basics?.name,
      resumeData.basics?.email,
      resumeData.basics?.location?.city,
      ...(resumeData.education || []).map(e => `${e.institution} ${e.studyType} ${e.area}`),
      ...(resumeData.work || resumeData.experience || []).flatMap(w => [w.name || w.company, w.position || w.role, ...(w.highlights || w.bullets || [])]),
      ...(resumeData.projects || []).flatMap(p => [p.name, Array.isArray(p.keywords) ? p.keywords.join(' ') : p.technologies, ...(p.highlights || p.bullets || [])]),
      ...(resumeData.skills || []).flatMap(s => [s.name, ...(s.keywords || [])])
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
            value={resumeData.basics?.name || ''} 
            onChange={e => updatePersonal('name', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1">Email</label>
          <input 
            value={resumeData.basics?.email || ''} 
            onChange={e => updatePersonal('email', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1">Phone Number</label>
          <input 
            value={resumeData.basics?.phone || ''} 
            onChange={e => updatePersonal('phone', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1">Location</label>
          <input 
            value={resumeData.basics?.location?.city || ''} 
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
            value={resumeData.basics?.profiles?.find(p => p.network?.toLowerCase() === 'linkedin')?.url || ''} 
            onChange={e => updatePersonal('linkedin', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
            placeholder="linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-400 mb-1">GitHub URL</label>
          <input 
            value={resumeData.basics?.profiles?.find(p => p.network?.toLowerCase() === 'github')?.url || ''} 
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
      {(resumeData.education || []).map((edu, idx) => (
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
                value={edu.studyType || edu.degree || ''} 
                onChange={e => updateEducation(idx, 'degree', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                placeholder="B.Tech, High School"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Field of Study</label>
              <input 
                value={edu.area || edu.field || ''} 
                onChange={e => updateEducation(idx, 'field', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
                placeholder="CSE, Science"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">CGPA / Grade</label>
              <input 
                value={edu.score || edu.cgpa || ''} 
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
      {(resumeData.work || resumeData.experience || []).map((exp, idx) => (
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
                value={exp.name || exp.company || ''} 
                onChange={e => updateExperience(idx, 'company', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-850 rounded text-xs focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">Role</label>
              <input 
                value={exp.position || exp.role || ''} 
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
            <label className="block text-[10px] font-mono uppercase text-zinc-555">Description Bullets</label>
            {(exp.highlights || exp.bullets || []).map((b, bIdx) => (
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
      {(resumeData.projects || []).map((proj, idx) => (
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
                value={Array.isArray(proj.keywords) ? proj.keywords.join(', ') : (proj.technologies || '')} 
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
            <label className="block text-[10px] font-mono uppercase text-zinc-555">Accomplishment Bullets</label>
            {(proj.highlights || proj.bullets || []).map((b, bIdx) => (
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

  const renderSkillsForm = () => {
    const skillsArr = Array.isArray(resumeData.skills) ? resumeData.skills : [];
    const getSkillKeywords = (cat) => {
      const match = skillsArr.find(s => s.name?.toLowerCase() === cat.toLowerCase());
      return match?.keywords ? match.keywords.join(', ') : '';
    };

    return (
      <div className="space-y-4 pt-1">
        <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">Programming Languages</label>
            <input 
              value={getSkillKeywords('languages') || resumeData.skills?.languages || ''} 
              onChange={e => updateSkill('languages', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs focus:outline-none focus:border-zinc-700"
              placeholder="JavaScript, Python, C++, SQL"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">Libraries & Frameworks</label>
            <input 
              value={getSkillKeywords('frameworks') || resumeData.skills?.frameworks || ''} 
              onChange={e => updateSkill('frameworks', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs focus:outline-none focus:border-zinc-700"
              placeholder="React, Express, Node.js, TailwindCSS"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">Tools & Platforms</label>
            <input 
              value={getSkillKeywords('tools') || resumeData.skills?.tools || ''} 
              onChange={e => updateSkill('tools', e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-850 rounded-lg text-xs focus:outline-none focus:border-zinc-700"
              placeholder="Git, Docker, Postman, AWS, MongoDB"
            />
          </div>
        </div>
      </div>
    );
  };

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

  const renderAiOptimizerForm = () => (
    <div className="space-y-4 pt-1">
      <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl space-y-4">
        {/* Quota Status */}
        <div className="flex justify-between items-center bg-zinc-950 p-3 border border-zinc-850 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary-500 animate-pulse" size={14} />
            <span className="font-semibold text-zinc-350">Monthly AI Rewrite Quota</span>
          </div>
          <span className="font-mono text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded">
            {quotaLimit - quotaUsed} / {quotaLimit} Left
          </span>
        </div>

        <div>
          <label className="block text-[10px] text-zinc-400 mb-1.5 uppercase font-mono tracking-wider">
            Target Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={6}
            className="w-full bg-zinc-900 text-zinc-200 border border-zinc-850 rounded-lg p-2.5 text-xs focus:outline-none focus:border-zinc-700 leading-normal resize-none"
            placeholder="Paste the target job description or requirements here to tailor your resume..."
          />
        </div>

        <button
          onClick={handleAiOptimize}
          disabled={optimizing || !jobDescription || quotaUsed >= quotaLimit}
          className="w-full flex items-center justify-center gap-2 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-primary-500/10 transition-all disabled:opacity-50"
        >
          {optimizing ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Tailoring Resume...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Optimize Resume with Claude AI
            </>
          )}
        </button>
        {quotaUsed >= quotaLimit && (
          <p className="text-[10px] text-red-400 text-center font-mono">
            Quota exceeded for this billing cycle. Resets on {new Date(resetDate).toLocaleDateString()}.
          </p>
        )}
      </div>
    </div>
  );

  const sectionsList = resumeData ? [
    { 
      id: 'personal', 
      name: 'Contact Details', 
      icon: FileSignature, 
      completed: !!((resumeData.basics?.name || resumeData.personal?.name) && (resumeData.basics?.email || resumeData.personal?.email) && (resumeData.basics?.phone || resumeData.personal?.phone) && (resumeData.basics?.phone !== '+91 9876543210' && resumeData.personal?.phone !== '+91 9876543210')) 
    },
    { 
      id: 'education', 
      name: 'Education History', 
      icon: GraduationCap, 
      completed: !!(resumeData.education?.length > 0 && resumeData.education[0]?.institution && resumeData.education[0]?.institution !== 'College Education') 
    },
    { 
      id: 'experience', 
      name: 'Work Experience', 
      icon: FileText, 
      completed: !!((resumeData.work || resumeData.experience)?.length > 0 && ((resumeData.work || resumeData.experience)[0]?.name || (resumeData.work || resumeData.experience)[0]?.company) && (resumeData.work || resumeData.experience)[0]?.name !== 'PlaceIQ Corp' && (resumeData.work || resumeData.experience)[0]?.company !== 'PlaceIQ Corp') 
    },
    { 
      id: 'projects', 
      name: 'Academic Projects', 
      icon: Code, 
      completed: !!(resumeData.projects?.length > 0 && resumeData.projects[0]?.name && resumeData.projects[0]?.name !== 'PlaceIQ Placement Portal') 
    },
    { 
      id: 'skills', 
      name: 'Skills Summary', 
      icon: Save, 
      completed: !!(
        (Array.isArray(resumeData.skills) && resumeData.skills.length > 0) || 
        (resumeData.skills?.languages && resumeData.skills?.languages !== 'JavaScript, Python, C++, SQL')
      ) 
    },
    { id: 'templates', name: 'Choose Template', icon: Sparkles, completed: true },
    { id: 'ai-optimizer', name: 'AI Resume Optimizer', icon: Sparkles, completed: true }
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
    <div className="h-auto lg:h-[calc(100vh-10.5rem)] flex flex-col gap-4 text-zinc-100">
      
      {/* ── Top Dashboard Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-zinc-950 via-zinc-900/30 to-zinc-950 p-5 border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-primary-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-500/5 blur-2xl pointer-events-none rounded-full" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-500/20 to-indigo-500/10 rounded-xl text-primary-400 border border-primary-500/20 shadow-lg shadow-primary-500/5">
            <FileSignature size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-100 tracking-tight text-base flex items-center gap-1.5">
              Interactive Resume Workspace
              <span className="text-[9px] font-mono font-bold tracking-widest text-primary-400 bg-primary-500/10 border border-primary-500/20 px-1.5 py-0.5 rounded-full uppercase">PRO</span>
            </h1>
            <p className="text-xs text-zinc-450 mt-0.5">Build premium LaTeX resumes live using modular form sections.</p>
          </div>
        </div>

        {/* Tab Selector Toggle */}
        <div className="flex bg-zinc-950/80 p-1 border border-zinc-800 rounded-xl shadow-inner backdrop-blur-sm">
          <button
            onClick={() => setActiveMode('form')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              activeMode === 'form' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20 scale-[1.02]' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GraduationCap size={14} />
            Form Builder
          </button>
          <button
            onClick={() => setActiveMode('code')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
              activeMode === 'code' 
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20 scale-[1.02]' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code size={14} />
            Advanced LaTeX
          </button>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[4fr_6fr] gap-4 lg:overflow-hidden">
        
        {/* Left pane: Active Editor Accordion / LaTeX Code */}
        <div className="flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl lg:overflow-y-auto shadow-xl lg:h-full">
          {activeMode === 'form' ? (
            <div className="space-y-3 p-4">
              {/* Import/Export Panel */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="text-zinc-400 font-medium">JSON Resume Schema</div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportJson}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-350 hover:text-zinc-200 rounded-lg transition-all"
                  >
                    <Upload size={12} /> Import JSON
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-350 hover:text-zinc-200 rounded-lg transition-all"
                  >
                    <Download size={12} /> Export JSON
                  </button>
                </div>
              </div>

              {sectionsList.map(sec => {
                const Icon = sec.icon;
                const isOpen = activeSection === sec.id;
                return (
                  <div 
                    key={sec.id} 
                    className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                      isOpen 
                        ? 'bg-zinc-950/80 border-primary-500/60 shadow-lg shadow-primary-500/5 ring-1 ring-primary-500/15' 
                        : 'bg-zinc-900/20 border-zinc-850/80 hover:border-zinc-800 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Header bar button */}
                    <button
                      onClick={() => setActiveSection(isOpen ? null : sec.id)}
                      className="w-full flex items-center justify-between px-4 py-4 text-left transition-colors duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-2 rounded-xl transition-all duration-300 ${
                          isOpen 
                            ? 'bg-gradient-to-br from-primary-500/25 to-indigo-500/10 text-primary-400 border border-primary-500/20 shadow-md shadow-primary-500/5' 
                            : 'bg-zinc-950/60 text-zinc-500 border border-zinc-850'
                        }`}>
                          <Icon size={15} />
                        </span>
                        <span className={`text-xs font-semibold tracking-wide transition-colors ${
                          isOpen ? 'text-zinc-100 font-bold' : 'text-zinc-455'
                        }`}>
                          {sec.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {sec.completed && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none shadow-sm">
                            ✓ Complete
                          </span>
                        )}
                        <span className={`text-zinc-650 text-[10px] select-none font-mono transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary-400' : 'rotate-0 text-zinc-550'}`}>
                          ▼
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
                        {sec.id === 'ai-optimizer' && renderAiOptimizerForm()}
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
                    className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded transition-all"
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
        <div className="flex flex-col gap-4 lg:h-full lg:overflow-hidden">
          
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
                    link.download = `${resumeData.basics?.name || 'Resume'}.pdf`;
                    link.click();
                  };

                  return (
                    <div className="w-full h-full flex flex-col">
                      {/* Premium Viewer Toolbar */}
                      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">live_preview.pdf</span>
                          <span className="text-[9px] text-zinc-650">•</span>
                          <span className="text-[9px] font-mono text-zinc-550 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'Saving...' ? 'bg-amber-500 animate-pulse' : saveStatus === 'Auto-saved' ? 'bg-emerald-500' : 'bg-zinc-650'}`} />
                            {saveIndicatorText}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Page Count Badge */}
                          <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-950 border border-zinc-850 text-zinc-400 rounded-md select-none">
                            1 Page Template
                          </span>
                          <span className="w-[1px] h-3.5 bg-zinc-850 mx-0.5" />
                          
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
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-450 text-xs bg-zinc-900">
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
                        <span className="text-[10px] text-zinc-550 font-mono">PDF compiled client-side instantly.</span>
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
                              <span className="text-[9px] text-zinc-650 font-mono">|</span>
                              <span className="text-[10px] text-zinc-500 font-mono">Press ESC to exit</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg"
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
                <span className="font-semibold text-zinc-350 block">Resume Rationale & Styling</span>
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

      {/* ── AI Side-by-Side Comparison Diff Modal ── */}
      {showDiffModal && optimizedDraft && (
        <div className="fixed inset-0 z-[10000] bg-zinc-950/90 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary-500" size={18} />
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Review AI Optimized Resume</h3>
                  <p className="text-[11px] text-zinc-500">Compare original content with Claude's tailored draft before applying.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDiffModal(false)}
                className="text-zinc-500 hover:text-zinc-350 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Help Banner */}
              <div className="bg-primary-500/5 border border-primary-500/10 p-3 rounded-lg flex gap-2.5 text-[11px] text-primary-400">
                <Info size={15} className="shrink-0 mt-0.5" />
                <p>
                  We have tailored your experience summaries, project descriptions, and keywords to semantically align with the job description. Review and click "Apply" to save.
                </p>
              </div>

              {/* Grid Column Labels */}
              <div className="grid grid-cols-2 gap-6 border-b border-zinc-850 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <div>Original Resume</div>
                <div>AI Tailored Draft</div>
              </div>

              {/* Summary Diff */}
              {((resumeData.basics?.summary || '') !== (optimizedDraft.basics?.summary || '')) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-350 font-mono uppercase tracking-wider">Professional Summary</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-3.5 bg-red-950/10 border border-red-500/10 rounded-xl text-xs text-red-400/80 leading-relaxed">
                      {resumeData.basics?.summary || <span className="italic text-zinc-650">No summary.</span>}
                    </div>
                    <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/10 rounded-xl text-xs text-emerald-300 leading-relaxed">
                      {optimizedDraft.basics?.summary}
                    </div>
                  </div>
                </div>
              )}

              {/* Experience Highlights Diff */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-350 font-mono uppercase tracking-wider">Work Experience Highlights</h4>
                {(optimizedDraft.work || []).map((w, idx) => {
                  const origW = (resumeData.work || [])[idx] || {};
                  const origHighlights = origW.highlights || origW.bullets || [];
                  const newHighlights = w.highlights || w.bullets || [];

                  return (
                    <div key={idx} className="space-y-2 border-t border-zinc-850/60 pt-3">
                      <div className="text-xs font-bold text-zinc-350">{w.name} — {w.position}</div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 p-3.5 bg-red-950/10 border border-red-500/5 rounded-xl text-xs text-red-400/80">
                          {origHighlights.length > 0 ? origHighlights.map((hl, hIdx) => (
                            <div key={hIdx} className="flex gap-2">
                              <span className="shrink-0">•</span>
                              <span>{hl}</span>
                            </div>
                          )) : <span className="italic text-zinc-650">No bullets.</span>}
                        </div>
                        <div className="space-y-2 p-3.5 bg-emerald-950/10 border border-emerald-500/5 rounded-xl text-xs text-emerald-300">
                          {newHighlights.map((hl, hIdx) => {
                            const isChanged = origHighlights[hIdx] !== hl;
                            return (
                              <div key={hIdx} className={`flex gap-2 ${isChanged ? 'text-emerald-200 font-medium' : 'text-emerald-400/85'}`}>
                                <span className="shrink-0">•</span>
                                <span>{hl}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Projects Highlights Diff */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-350 font-mono uppercase tracking-wider">Academic Projects Highlights</h4>
                {(optimizedDraft.projects || []).map((p, idx) => {
                  const origP = (resumeData.projects || [])[idx] || {};
                  const origHighlights = origP.highlights || origP.bullets || [];
                  const newHighlights = p.highlights || p.bullets || [];

                  return (
                    <div key={idx} className="space-y-2 border-t border-zinc-850/60 pt-3">
                      <div className="text-xs font-bold text-zinc-350">Project: {p.name}</div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 p-3.5 bg-red-950/10 border border-red-500/5 rounded-xl text-xs text-red-400/80">
                          <div className="text-[10px] text-red-500/70 font-mono mb-1">
                            Keywords: {Array.isArray(origP.keywords) ? origP.keywords.join(', ') : (origP.technologies || '')}
                          </div>
                          {origHighlights.map((hl, hIdx) => (
                            <div key={hIdx} className="flex gap-2">
                              <span className="shrink-0">•</span>
                              <span>{hl}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2 p-3.5 bg-emerald-950/10 border border-emerald-500/5 rounded-xl text-xs text-emerald-300">
                          <div className="text-[10px] text-emerald-400/70 font-mono mb-1">
                            Keywords: {Array.isArray(p.keywords) ? p.keywords.join(', ') : ''}
                          </div>
                          {newHighlights.map((hl, hIdx) => {
                            const isChanged = origHighlights[hIdx] !== hl;
                            return (
                              <div key={hIdx} className={`flex gap-2 ${isChanged ? 'text-emerald-200 font-medium' : 'text-emerald-400/85'}`}>
                                <span className="shrink-0">•</span>
                                <span>{hl}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Skills Keywords Diff */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-350 font-mono uppercase tracking-wider">Skills & Categorized Keywords</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-3.5 bg-red-950/10 border border-red-500/5 rounded-xl space-y-2">
                    {Array.isArray(resumeData.skills) ? resumeData.skills.map((s, idx) => (
                      <div key={idx} className="text-xs text-red-400/80">
                        <strong className="text-red-500/70 capitalize font-mono text-[10px] tracking-wider">{s.name}:</strong>{' '}
                        {Array.isArray(s.keywords) ? s.keywords.join(', ') : ''}
                      </div>
                    )) : (
                      <div className="text-xs text-red-400/80">
                        <div><strong className="text-red-500/70 font-mono text-[10px]">Languages:</strong> {resumeData.skills?.languages}</div>
                        <div><strong className="text-red-500/70 font-mono text-[10px]">Frameworks:</strong> {resumeData.skills?.frameworks}</div>
                        <div><strong className="text-red-500/70 font-mono text-[10px]">Tools:</strong> {resumeData.skills?.tools}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/5 rounded-xl space-y-2">
                    {(optimizedDraft.skills || []).map((s, idx) => (
                      <div key={idx} className="text-xs text-emerald-300">
                        <strong className="text-emerald-400/70 capitalize font-mono text-[10px] tracking-wider">{s.name}:</strong>{' '}
                        {Array.isArray(s.keywords) ? s.keywords.join(', ') : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-zinc-850 bg-zinc-950/40 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Discard Draft
              </button>
              <button
                onClick={handleApplyOptimization}
                className="flex items-center gap-1.5 px-5 py-2 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-bold rounded-lg shadow-lg shadow-primary-500/10 transition-all"
              >
                <Check size={14} />
                Apply & Overwrite
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeBuilder;
