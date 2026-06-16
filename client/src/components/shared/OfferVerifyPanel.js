import React from 'react';
import { Loader2, FileText } from 'lucide-react';

const OfferVerifyPanel = ({
  application,
  isStudent = true,
  onOfferUploadSubmit,
  onVerifyOffer,
  offerFile,
  setOfferFile,
  ctcInput,
  setCtcInput,
  uploadingOffer,
  offerFileInputRef,
  getFileUrl
}) => {
  if (!application) return null;

  const offerDetails = application.offerDetails;

  if (isStudent) {
    // Renders only if stage is offer or there is already an uploaded offer
    if (application.stage !== "offer" && (!offerDetails || !offerDetails.offerLetterUrl)) {
      return null;
    }

    return (
      <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-lg space-y-4 text-xs font-mono animate-fadeIn">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
          <span className="font-bold text-zinc-200 uppercase tracking-wider text-[10px]">Offer Letter Verification Vault</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
            offerDetails?.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' :
            offerDetails?.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
            'bg-amber-500/10 text-amber-500'
          }`}>
            {offerDetails?.status?.replace('_', ' ') || 'pending_upload'}
          </span>
        </div>

        {offerDetails?.offerLetterUrl ? (
          <div className="space-y-3 font-sans">
            <p className="text-xs text-zinc-450 leading-relaxed font-mono">
              Offer details submitted on: {new Date(offerDetails.uploadedAt).toLocaleDateString()}
            </p>
            {offerDetails.ctc && (
              <p className="text-xs font-mono text-zinc-300">
                Compensation Package: <strong className="text-zinc-100">{offerDetails.ctc}</strong>
              </p>
            )}
            <div className="flex gap-4 text-xs font-mono">
              <a 
                href={getFileUrl(offerDetails.offerLetterUrl)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-500 hover:text-primary-400 underline font-semibold flex items-center gap-1.5"
              >
                <FileText size={14} /> Open Offer PDF
              </a>
            </div>
            {offerDetails.reviewNotes && (
              <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs font-mono mt-3">
                <span className="text-zinc-550 block text-[9px] uppercase tracking-wider mb-1 font-bold">Reviewer Feedback:</span>
                <p className="text-zinc-400 font-sans">{offerDetails.reviewNotes}</p>
              </div>
            )}
          </div>
        ) : null}

        {(!offerDetails || offerDetails.status === 'rejected') && (
          <form onSubmit={onOfferUploadSubmit} className="space-y-3 font-sans pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5">Offered CTC / Package</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12 LPA or 35k/m" 
                  required
                  value={ctcInput}
                  onChange={e => setCtcInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5">PDF Document</label>
                <button 
                  type="button"
                  onClick={() => offerFileInputRef.current.click()}
                  className="w-full text-center px-2.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-800 font-mono"
                >
                  {offerFile ? offerFile.name : "Select PDF File"}
                </button>
                <input 
                  type="file" 
                  ref={offerFileInputRef}
                  accept=".pdf"
                  className="hidden"
                  required
                  onChange={e => setOfferFile(e.target.files[0] || null)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={uploadingOffer || !offerFile}
              className="w-full bg-primary-500 hover:bg-primary-400 text-zinc-955 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
            >
              {uploadingOffer && <Loader2 className="animate-spin" size={12} />}
              Upload Offer Letter For Verification
            </button>
          </form>
        )}
      </div>
    );
  }

  // Coordinator View
  if (!offerDetails?.offerLetterUrl) return null;

  return (
    <div className="border-t border-zinc-850/50 pt-3 space-y-3 font-mono text-xs font-semibold animate-fadeIn">
      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Offer Letter Submission</span>
      <div className="bg-zinc-955 p-3 rounded border border-zinc-800 flex justify-between items-center">
        <div className="font-sans text-xs">
          <p className="text-zinc-400 font-mono">Package Offered: <strong className="text-zinc-200">{offerDetails.ctc || 'N/A'}</strong></p>
          <a 
            href={getFileUrl(offerDetails.offerLetterUrl)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary-500 hover:text-primary-400 underline font-mono text-[10px] mt-1.5 inline-flex items-center gap-1 font-semibold"
          >
            <FileText size={12} /> Inspect Uploaded PDF
          </a>
        </div>

        {offerDetails.status === "pending_review" ? (
          <div className="flex gap-2 text-[10px]">
            <button 
              onClick={() => onVerifyOffer(application._id, 'rejected')}
              className="px-2 py-1 bg-red-955/20 text-red-500 hover:bg-red-955/45 border border-red-900/30 rounded"
            >
              Reject
            </button>
            <button 
              onClick={() => onVerifyOffer(application._id, 'verified')}
              className="px-2.5 py-1 bg-emerald-500 text-zinc-950 font-bold rounded hover:bg-emerald-400"
            >
              Approve
            </button>
          </div>
        ) : (
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
            offerDetails.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {offerDetails.status}
          </span>
        )}
      </div>
    </div>
  );
};

export default OfferVerifyPanel;
export { OfferVerifyPanel };
