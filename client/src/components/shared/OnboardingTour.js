import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Play, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';

const studentSteps = [
  {
    path: '/student',
    target: '#sidebar-link-job-feed',
    title: 'Recommended Job Feed',
    content: 'Explore active job openings posted by your coordinators. Filter by salary, location, and apply directly.',
    placement: 'right'
  },
  {
    path: '/student',
    target: '#job-search-input',
    title: 'Search Filters',
    content: 'Instantly find jobs by search matching specific titles, companies, or programming skills.',
    placement: 'bottom'
  },
  {
    path: '/student',
    target: '#job-feed-list',
    title: 'Job Openings List',
    content: 'Review deadlines, CTC compensation packages, and trigger deep AI ATS matches for any job posting.',
    placement: 'top'
  },
  {
    path: '/student/tracker',
    target: '#sidebar-link-application-tracker',
    title: 'Applications Tracking Roster',
    content: 'Keep track of all your applied drives, scheduled assessments, and round-by-round interview stages.',
    placement: 'right'
  },
  {
    path: '/student/tracker',
    target: '#application-stages-board',
    title: 'Workflow Stages',
    content: 'Drag-and-drop workflow tracker mapping rounds, reviewer notes, and where to upload verify offer letters.',
    placement: 'top'
  },
  {
    path: '/student/profile',
    target: '#sidebar-link-my-profile',
    title: 'Profile Settings',
    content: 'Manage your CGPA, backlogs records, and check your resume details.',
    placement: 'right'
  },
  {
    path: '/student/profile',
    target: '#ai-quota-card',
    title: 'OpenRouter AI Quota',
    content: 'Your monthly quota status. Reset schedules and see remaining deep review credits here.',
    placement: 'left'
  },
  {
    path: '/student/profile',
    target: '#resume-upload-card',
    title: 'Resume & Skill Extraction',
    content: 'Upload your latest resume PDF. PlaceIQ will automatically parse text and extract key technology skills.',
    placement: 'left'
  }
];

const coordinatorSteps = [
  {
    path: '/coordinator',
    target: '#sidebar-link-overview',
    title: 'Overview Metrics Dashboard',
    content: 'Quick overview showing placed cohorts statistics, overall placement rates, and pending jobs.',
    placement: 'right'
  },
  {
    path: '/coordinator',
    target: '#coordinator-metrics-row',
    title: 'Live Cohort Analytics',
    content: 'Track total students count, active job status, and current placement performance percentages.',
    placement: 'bottom'
  },
  {
    path: '/coordinator',
    target: '#coordinator-deadlines-panel',
    title: 'Upcoming Deadlines',
    content: 'Urgent placement drive dates that are ending soon, requiring active applications follow-ups.',
    placement: 'left'
  },
  {
    path: '/coordinator/jobs',
    target: '#sidebar-link-jobs-listings',
    title: 'Jobs Management Hub',
    content: 'Create, schedule, edit job posts, and track coordinator review approvals or candidate round pipelines.',
    placement: 'right'
  },
  {
    path: '/coordinator/students',
    target: '#sidebar-link-student-directory',
    title: 'Student Database',
    content: 'Search and inspect cohort student lists, academic CGPA stats, resumes, and placement flags.',
    placement: 'right'
  },
  {
    path: '/coordinator/companies',
    target: '#sidebar-link-companies-crm',
    title: 'Recruiters Directory CRM',
    content: 'Maintain contact detail records, scheduled campus visit calendars, ratings, and logs of hiring companies.',
    placement: 'right'
  }
];

const OnboardingTour = ({ role }) => {
  const { user, updateUser } = useAuth();
  const steps = role === 'coordinator' ? coordinatorSteps : studentSteps;
  const location = useLocation();
  const navigate = useNavigate();

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const tooltipRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  // Initialize: run if local storage key is not set and user has not completed tour in DB
  useEffect(() => {
    const isCompleted = user?.hasCompletedTour || localStorage.getItem(`has-completed-tour-${role}`) === 'true';
    if (!isCompleted) {
      // Only auto-start the tour if the user is on the main landing/dashboard route.
      // This prevents interrupting the user if they directly access a sub-page.
      const mainPath = role === 'coordinator' ? '/coordinator' : '/student';
      const isMainRoute = location.pathname === mainPath || location.pathname === `${mainPath}/`;
      
      if (!isMainRoute) return;

      // Small timeout to let initial page load
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStepIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, location.pathname, user?.hasCompletedTour]);

  const activeStep = steps[currentStepIndex];

  // Poll for the target element and measure its bounding rectangle
  useEffect(() => {
    if (!isActive || !activeStep) {
      setRect(null);
      return;
    }

    let attempts = 0;
    const findElement = () => {
      const el = document.querySelector(activeStep.target);
      if (el) {
        // Scroll target into view gently if offscreen
        const elementRect = el.getBoundingClientRect();
        const isOffscreen = 
          elementRect.top < 0 || 
          elementRect.left < 0 || 
          elementRect.bottom > window.innerHeight || 
          elementRect.right > window.innerWidth;
          
        if (isOffscreen && attempts === 0) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setRect(el.getBoundingClientRect());
        clearInterval(pollInterval);
      } else {
        attempts++;
        if (attempts > 30) {
          clearInterval(pollInterval); // Give up after 3s
          setRect(null);
        }
      }
    };

    const pollInterval = setInterval(findElement, 100);
    findElement();

    window.addEventListener('resize', findElement);
    window.addEventListener('scroll', findElement);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('resize', findElement);
      window.removeEventListener('scroll', findElement);
    };
  }, [isActive, currentStepIndex, activeStep, location.pathname]);

  // Calculate dynamic floating tooltip placement relative to highlighted element
  useEffect(() => {
    if (!rect || !activeStep) return;

    const spacing = 14;
    const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 300;
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 160;

    let top = 0;
    let left = 0;

    switch (activeStep.placement) {
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left + rect.width + spacing;
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - spacing;
        break;
      case 'bottom':
        top = rect.top + rect.height + spacing;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'top':
      default:
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
    }

    // Boundary Collisions Checks (keep card inside viewport)
    const margin = 16;
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tooltipHeight - margin;
    }

    setTooltipPos({ top, left });
  }, [rect, activeStep]);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      // Navigate to required path before showing popover
      if (nextStep.path && location.pathname !== nextStep.path) {
        navigate(nextStep.path);
      }
      setCurrentStepIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex];
      if (prevStep.path && location.pathname !== prevStep.path) {
        navigate(prevStep.path);
      }
      setCurrentStepIndex(prevIndex);
    }
  };

  const handleComplete = async () => {
    localStorage.setItem(`has-completed-tour-${role}`, 'true');
    setIsActive(false);
    try {
      await axios.put('/auth/complete-tour');
      updateUser({ hasCompletedTour: true });
    } catch (e) {
      console.error("Failed to save tour completion in database:", e);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isActive || !activeStep) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none font-sans select-none">
      {/* Target Element Highlight Box */}
      {rect && (
        <div 
          className="fixed transition-all duration-300 pointer-events-auto shadow-[0_0_0_9999px_rgba(0,0,0,0.5),_0_0_15px_rgba(16,185,129,0.5)] rounded border-2 border-primary-500 z-[9998]"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* Fallback backdrop overlay if target is not active/loaded */}
      {!rect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto z-[9998]" />
      )}

      {/* Floating Glassmorphic Tooltip Card */}
      <div 
        ref={tooltipRef}
        className={`fixed bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl p-5 w-[300px] md:w-[320px] pointer-events-auto transition-all duration-200 z-[9999] text-zinc-100 flex flex-col gap-3 ${
          !rect ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''
        }`}
        style={rect ? {
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
        } : {}}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary-400" />
            <h4 className="text-sm font-semibold tracking-tight text-zinc-100">{activeStep.title}</h4>
          </div>
          <button 
            onClick={handleSkip} 
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-full hover:bg-zinc-900"
            title="Skip Tour"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <p className="text-xs text-zinc-400 leading-relaxed font-sans select-text">
          {activeStep.content}
        </p>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-850 mt-1.5">
          {/* Step Count */}
          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">
            Step {currentStepIndex + 1} <span className="text-zinc-700">/</span> {steps.length}
          </span>
          
          <div className="flex items-center gap-2">
            {/* Back Button */}
            {currentStepIndex > 0 && (
              <button 
                onClick={handleBack}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-zinc-100 rounded text-xs transition-colors flex items-center gap-0.5"
              >
                <ChevronLeft size={12} /> Back
              </button>
            )}

            {/* Skip Option (only first few steps) */}
            {currentStepIndex === 0 && (
              <button 
                onClick={handleSkip}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase font-mono tracking-wider font-semibold mr-2"
              >
                Skip
              </button>
            )}

            {/* Next / Finish Button */}
            <button 
              onClick={handleNext}
              className="px-3 py-1 bg-primary-500 hover:bg-primary-400 text-zinc-950 font-bold rounded text-xs transition-colors flex items-center gap-0.5 shadow-md shadow-primary-500/10"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>Finish <Play size={10} className="fill-current ml-0.5" /></>
              ) : (
                <>Next <ChevronRight size={12} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
