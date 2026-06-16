import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';
import { 
  FileText, Play, Save, Sparkles, RefreshCw, AlertTriangle, 
  HelpCircle, Download, FileCode, CheckCircle, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const templates = {
  deedy: {
    name: "Deedy Style Professional",
    description: "Standard layout for technical and product roles."
  },
  minimal: {
    name: "Minimalist Single-Column",
    description: "Clean, elegant layout emphasizing readability."
  },
  academic: {
    name: "Modern Academic",
    description: "Formatted specifically for research, projects and education."
  }
};

const ResumeBuilder = () => {
  const [latexSource, setLatexSource] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('deedy');
  const [compiling, setCompiling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef(null);

  // Fetch student info and initial LaTeX source code
  useEffect(() => {
    const init = async () => {
      try {
        const infoRes = await axios.get('/students/me');
        setStudentInfo(infoRes.data);
        
        const sourceRes = await axios.get('/students/resume/source');
        setLatexSource(sourceRes.data.latexSource);
        
        // Initial compile to populate preview
        compileResume(sourceRes.data.latexSource, infoRes.data?.name);
      } catch (err) {
        toast.error("Failed to load resume workspace.");
      }
    };
    init();
    
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const compileResume = async (sourceCode = latexSource, studentName = studentInfo?.name) => {
    if (!sourceCode) return;
    setCompiling(true);
    try {
      const response = await axios.post('/students/resume/compile', 
        { latexSource: sourceCode },
        { responseType: 'blob' }
      );
      
      const isFallback = response.headers['x-latex-fallback'] === 'true';
      setFallbackMode(isFallback);

      // Create blob URL for PDF preview
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      
      if (isFallback) {
        toast((t) => (
          <span className="flex items-center gap-2 text-amber-500 font-medium text-xs">
            <AlertTriangle size={16} />
            LaTeX compiler not found on server. Using simulated fallback preview.
          </span>
        ), { duration: 4000 });
      } else {
        toast.success("Compiled successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Compilation failed. Check LaTeX syntax.");
    } finally {
      setCompiling(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post('/students/resume/save', { latexSource });
      toast.success(data.fallback ? "Resume saved (simulated compile)" : "Resume published to placement profile!");
      
      // Update studentInfo locally to sync profile details
      const infoRes = await axios.get('/students/me');
      setStudentInfo(infoRes.data);
    } catch (err) {
      toast.error("Failed to save and publish resume.");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (key) => {
    if (!studentInfo) return;
    setSelectedTemplate(key);
    
    const name = studentInfo.name || "Student Name";
    const email = studentInfo.email || "student@college.edu";
    const phone = studentInfo.phone || "+91 9876543210";
    const dept = studentInfo.department || studentInfo.branch || "Computer Science";
    const cgpa = studentInfo.cgpa ? studentInfo.cgpa.toString() : "8.5";
    const tenth = studentInfo.tenthPercent ? studentInfo.tenthPercent.toString() : "90";
    const twelfth = studentInfo.twelfthPercent ? studentInfo.twelfthPercent.toString() : "88";
    const skillsList = studentInfo.skills && studentInfo.skills.length > 0 ? studentInfo.skills.join(", ") : "React, Node.js, Express, MongoDB, Python, Git";

    let templateSource = '';
    
    if (key === 'deedy') {
      templateSource = `\\documentclass[10pt,letterpaper]{article}
\\usepackage[letterpaper,margin=0.75in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\LARGE \\textbf{${name}}} \\\\
    Email: ${email} \\ | \\ Phone: ${phone} \\\\
    Department: ${dept} \\ | \\ CGPA: ${cgpa}
\\end{center}

\\section{Education}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{College Education} \\\\
    Bachelor of Technology in ${dept} \\hfill CGPA: ${cgpa} \\\\
    \\item \\textbf{High School (12th Grade)} \\hfill Percentage: ${twelfth}\\%
    \\item \\textbf{Secondary School (10th Grade)} \\hfill Percentage: ${tenth}\\%
\\end{itemize}

\\section{Skills}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Technical Skills:} ${skillsList}
\\end{itemize}

\\section{Projects}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Project 1: Online Placement Portal (PlaceIQ)} \\hfill \\textit{Jan 2026 -- Present}
    \\begin{itemize}
        \\item Built a fully functional multi-tenant college placement portal using Node.js, Express, React, and MongoDB.
        \\item Integrated AI-powered resume parsing and ATS scoring using meta-llama on OpenRouter.
    \\end{itemize}
    \\item \\textbf{Project 2: Job Scraper Microservice} \\hfill \\textit{Feb 2026}
    \\begin{itemize}
        \\item Created a FastAPI web scraping microservice with Python Playwright to pull dynamic postings.
    \\end{itemize}
\\end{itemize}

\\section{Experience}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Software Engineer Intern} | PlaceIQ Corp \\hfill \\textit{May 2025 -- July 2025}
    \\begin{itemize}
        \\item Optimized database queries and indexes, decreasing search latency by 40\\%.
        \\item Created responsive superadmin dashboards and student onboarding guides.
    \\end{itemize}
\\end{itemize}

\\end{document}`;
    } else if (key === 'minimal') {
      templateSource = `\\documentclass[11pt,a4paper]{article}
\\usepackage[a4paper,margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

{\\LARGE \\textbf{${name}}} \\\\
${email} \\ | \\ ${phone} \\ | \\ Dept: ${dept}

\\vspace{1em}
\\hrule
\\vspace{1em}

\\textbf{EDUCATION} \\\\
\\textbf{College Education} \\hfill CGPA: ${cgpa} \\\\
Bachelor of Technology in ${dept} \\\\
\\textbf{12th Grade:} ${twelfth}\\% \\ | \\ \\textbf{10th Grade:} ${tenth}\\%

\\vspace{1em}
\\textbf{TECHNICAL SKILLS} \\\\
${skillsList}

\\vspace{1em}
\\textbf{ACADEMIC PROJECTS} \\\\
\\textbf{PlaceIQ Placement Portal} \\hfill \\textit{Jan 2026} \\\\
Developed a React/Node placement engine with multi-tenant dashboard and ATS matching.

\\vspace{0.5em}
\\textbf{Playwright Job Scraper} \\hfill \\textit{Feb 2026} \\\\
Scraped job info from career pages using Python Playwright and metadata parser.

\\vspace{1em}
\\textbf{EXPERIENCE} \\\\
\\textbf{Software Developer Intern} --- PlaceIQ \\hfill \\textit{May 2025 -- July 2025} \\\\
Wrote integration tests and optimized API handlers.

\\end{document}`;
    } else {
      templateSource = `\\documentclass[10pt,letterpaper]{article}
\\usepackage[letterpaper,margin=0.8in]{geometry}
\\pagestyle{empty}
\\begin{document}

\\begin{center}
    {\\large \\textbf{${name.toUpperCase()}}} \\\\
    ${email} \\ | \\ ${phone} \\\\
    CGPA: ${cgpa} \\ | \\ branch: ${dept}
\\end{center}

\\textbf{EDUCATION}
\\hrule
\\vspace{0.5em}
B.Tech in ${dept} \\hfill Cumulative CGPA: ${cgpa} \\\\
12th Standard Board Exam \\hfill Percentage: ${twelfth}\\% \\\\
10th Standard Board Exam \\hfill Percentage: ${tenth}\\%

\\vspace{1em}
\\textbf{TECHNICAL EXPERIENCE}
\\hrule
\\vspace{0.5em}
\\textbf{PlaceIQ Online Portal} \\hfill \\textit{React, Node, Express, MongoDB} \\\\
* Integrated robust ATS review feedback with custom rule scorers. \\\\
* Built visual application pipelines with Kanban columns.

\\vspace{1.2em}
\\textbf{TECHNICAL SKILLS}
\\hrule
\\vspace{0.5em}
Languages \\& Frameworks: ${skillsList}

\\end{document}`;
    }
    
    setLatexSource(templateSource);
    compileResume(templateSource, name);
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${studentInfo?.name?.replace(/\s+/g, '_') || 'Resume'}_LaTeX.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const insertLatexCmd = (cmd) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    let insertion = '';
    let cursorOffset = 0;
    
    switch (cmd) {
      case 'bold':
        insertion = '\\textbf{}';
        cursorOffset = 8;
        break;
      case 'italic':
        insertion = '\\textit{}';
        cursorOffset = 8;
        break;
      case 'item':
        insertion = '\\item ';
        cursorOffset = 6;
        break;
      case 'section':
        insertion = '\\section{}';
        cursorOffset = 9;
        break;
      default:
        return;
    }
    
    setLatexSource(before + insertion + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 text-zinc-100">
      {/* ── Control Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-4 border border-zinc-800/80 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary-500/10 rounded-lg text-primary-500">
            <FileCode size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-200">LaTeX Resume Builder</h1>
            <p className="text-xs text-zinc-500">Edit source code, compile dynamically, and publish directly.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs hover:border-zinc-700 hover:text-zinc-200 transition-colors">
              <Sparkles size={14} className="text-primary-500" />
              Template: {templates[selectedTemplate]?.name || 'Custom'}
              <ChevronDown size={14} className="text-zinc-500" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden hidden group-hover:block z-50">
              <div className="p-2 border-b border-zinc-800/50 bg-zinc-900/20 text-[10px] uppercase font-mono tracking-widest text-zinc-500">Select Template</div>
              <div className="p-1 divide-y divide-zinc-900">
                {Object.entries(templates).map(([key, details]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className="w-full text-left p-2.5 hover:bg-zinc-900 rounded-md transition-colors flex flex-col"
                  >
                    <span className="text-xs font-semibold text-zinc-300">{details.name}</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">{details.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={() => compileResume()}
            disabled={compiling || !latexSource}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-all border border-zinc-700/50 disabled:opacity-40"
          >
            {compiling ? <RefreshCw size={14} className="animate-spin text-primary-500" /> : <Play size={14} className="text-emerald-500" />}
            {compiling ? 'Compiling...' : 'Compile'}
          </button>

          <button 
            onClick={handleSave}
            disabled={saving || compiling || !latexSource}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary-500 hover:bg-primary-400 text-zinc-950 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 shadow-lg shadow-primary-500/10"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Publish to Profile'}
          </button>

          {pdfUrl && (
            <button 
              onClick={handleDownload}
              title="Download PDF"
              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg hover:text-zinc-200 transition-colors"
            >
              <Download size={15} />
            </button>
          )}

          <button 
            onClick={() => setShowHelp(!showHelp)}
            title="Help & Info"
            className={`p-1.5 rounded-lg border transition-colors ${showHelp ? 'bg-primary-500/15 border-primary-500/35 text-primary-400' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>

      {/* ── Warning Fallback Banner ── */}
      {fallbackMode && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle size={16} />
            <span><strong>Simulated Compilation:</strong> The local server does not have the native LaTeX (pdflatex) executable installed. PlaceIQ has safely simulated the PDF preview format below. For native LaTeX compiles, install TeX Live on the server.</span>
          </div>
        </div>
      )}

      {/* ── Main Workspace ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* Left pane: LaTeX Source Editor */}
        <div className="flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
          {/* Editor Header */}
          <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">source.tex</span>
            
            {/* Formatting Commands */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => insertLatexCmd('bold')} 
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] font-bold font-mono text-zinc-400 hover:text-zinc-200"
                title="Bold Text"
              >
                B
              </button>
              <button 
                onClick={() => insertLatexCmd('italic')} 
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] italic font-mono text-zinc-400 hover:text-zinc-200"
                title="Italic Text"
              >
                I
              </button>
              <button 
                onClick={() => insertLatexCmd('section')} 
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
                title="New Section"
              >
                Sec
              </button>
              <button 
                onClick={() => insertLatexCmd('item')} 
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/60 rounded text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
                title="Bullet Point"
              >
                • Item
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={latexSource}
            onChange={(e) => setLatexSource(e.target.value)}
            className="flex-1 w-full p-4 bg-zinc-950 font-mono text-xs text-zinc-300 focus:outline-none resize-none leading-relaxed select-text cursor-text border-0"
            placeholder="% Type LaTeX Resume Code Here..."
          />
        </div>

        {/* Right pane: PDF Previewer */}
        <div className="flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl min-h-[400px]">
          <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">live_preview.pdf</span>
            {fallbackMode && (
              <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                <AlertTriangle size={10} /> FALLBACK
              </span>
            )}
          </div>
          
          <div className="flex-1 bg-zinc-900 relative">
            {compiling && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                <RefreshCw size={28} className="animate-spin text-primary-500" />
                <span className="text-xs text-zinc-400 font-medium font-mono">Compiling LaTeX...</span>
              </div>
            )}
            
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-0 bg-zinc-900" 
                title="Resume PDF Live Render"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                <FileText size={40} className="stroke-1 mb-3 text-zinc-700" />
                <p className="text-xs font-semibold text-zinc-400">Preview is empty</p>
                <p className="text-[10px] text-zinc-600 max-w-[200px] mt-1">Make sure you have source code written and click Compile.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Help Sidebar Overlay ── */}
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
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\section{Name}"}</span> - Adds a divider heading</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\textbf{Text}"}</span> - Bold text</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\textit{Text}"}</span> - Italicize text</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\hfill"}</span> - Aligns following text to the right</li>
                <li className="bg-zinc-900 p-1.5 rounded"><span className="text-primary-400">{"\\\\"}</span> - Inserts a line break</li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold text-zinc-300 uppercase tracking-widest text-[9px] mb-1">Bullet Point Lists</p>
              <pre className="bg-zinc-900 p-2 rounded font-mono text-[10px] overflow-x-auto">
{`\\begin{itemize}
  \\item First bullet
  \\item Second bullet
\\end{itemize}`}
              </pre>
            </div>

            <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-3 text-[10px]">
              <span className="font-bold text-primary-400 flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} /> Syncing with Profile
              </span>
              Clicking <strong className="text-zinc-200">Publish to Profile</strong> compiles the final PDF, saves the LaTeX source, parses your text details, and updates your resume so ATS matching models can run instantly!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
