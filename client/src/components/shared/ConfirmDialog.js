import React, { useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <FocusTrap active={isOpen}>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onCancel}
        />

        {/* Dialog Content */}
        <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-fadeIn text-zinc-100 p-6 space-y-6 z-10">
          <div className="flex items-start gap-4">
            {isDestructive && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
            )}
            <div className="space-y-1.5 flex-1 text-left">
              <h3 
                id="confirm-dialog-title" 
                className="font-semibold text-lg tracking-tight"
              >
                {title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-sans">
                {message}
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex gap-3 text-sm">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-lg font-semibold transition-colors"
            >
              {cancelLabel}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 font-bold rounded-lg transition-colors ${
                isDestructive 
                  ? 'bg-red-500 hover:bg-red-650 text-white' 
                  : 'bg-primary-500 hover:bg-primary-400 text-zinc-950'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
};

export default ConfirmDialog;
export { ConfirmDialog };
