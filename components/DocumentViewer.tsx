
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, FileBarChart, Download, Copy, Check, GitPullRequest, ShieldAlert, XCircle, Info } from 'lucide-react';
import { RejectedPath, DecisionType } from '../types';

interface DocumentViewerProps {
  prfaq: string | null;
  report: string | null;
  rejectedPaths: RejectedPath[];
  decisionType: DecisionType | null;
  readinessScore: number | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ prfaq, report, rejectedPaths, decisionType, readinessScore }) => {
  const [activeTab, setActiveTab] = useState<'prfaq' | 'report'>('prfaq');
  const [copied, setCopied] = useState(false);

  if (!prfaq && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
        <FileText size={48} strokeWidth={1} />
        <p className="mt-4 font-medium">The Council has not yet produced documents.</p>
        <p className="text-sm">Complete a council debate to generate your PRFAQ.</p>
      </div>
    );
  }

  const handleCopy = () => {
    const content = activeTab === 'prfaq' ? prfaq : report;
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const content = activeTab === 'prfaq' ? prfaq : report;

  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full max-h-[85vh]">
      <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0 no-print">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('prfaq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'prfaq' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} /> PRFAQ
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              activeTab === 'report' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileBarChart size={16} /> Council Report
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" 
            title="Download PDF"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div id="print-content" className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none space-y-8 scroll-smooth min-h-0">
        {activeTab === 'report' && (decisionType || readinessScore !== null) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-[#232f3e] text-white p-5 rounded-xl border border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-[#ff9900]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Readiness Score</span>
                  </div>
                  {readinessScore !== null && (
                    <span className="text-2xl font-black text-[#ff9900]">{readinessScore}<span className="text-xs text-slate-400">/10</span></span>
                  )}
                </div>
                <div className="text-lg font-bold">{decisionType || 'Determining Risk...'}</div>
                <div className="mt-2 pt-2 border-t border-slate-700 flex gap-2">
                  <Info size={12} className="text-[#ff9900] flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {decisionType && decisionType.toLowerCase().includes('one-way') 
                      ? "One-Way Door decisions require deep audit because they are permanent once committed." 
                      : "Two-Way Door decisions are flexible; prioritize 'Bias for Action' and iterate fast."}
                  </p>
                </div>
             </div>
             <div className="bg-slate-50 border p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={16} className="text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rejected Path Log</span>
                </div>
                <div className="space-y-3">
                  {rejectedPaths.length > 0 ? rejectedPaths.map((rp, i) => (
                    <div key={i} className="text-xs">
                      <div className="font-bold text-slate-800">Path: {rp.path}</div>
                      <div className="text-slate-500 italic">Rejection Reason: {rp.reason}</div>
                    </div>
                  )) : (
                    <p className="text-[10px] text-slate-400 italic">No alternative paths were formally rejected in this iteration.</p>
                  )}
                </div>
             </div>
          </div>
        )}

        <div className="chat-markdown font-serif text-slate-800 leading-relaxed text-sm">
          <ReactMarkdown>{content || ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
