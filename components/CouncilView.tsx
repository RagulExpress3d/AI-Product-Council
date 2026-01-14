
import React from 'react';
import { Zap, CheckCircle2, XCircle, AlertCircle, RefreshCw, Scale, ShieldAlert, Target, Shield, Crosshair, Star } from 'lucide-react';
import { AgentPerspective, DecisionType } from '../types';

interface CouncilViewProps {
  perspectives: AgentPerspective[];
  isDiscussing: boolean;
  onRunCouncil: () => void;
  status: string;
  drivingLPs: string[];
  decisionType: DecisionType | null;
  readinessScore: number | null;
}

const getAgentIcon = (index: number) => {
  const icons = [<Shield className="text-blue-500" size={20} />, <Target className="text-orange-500" size={20} />, <Crosshair className="text-purple-500" size={20} />];
  return icons[index % icons.length];
};

const getScoreColor = (score: number) => {
  if (score >= 4) return 'text-green-600';
  if (score >= 2.5) return 'text-amber-500';
  return 'text-red-500';
};

const getReadinessColor = (score: number) => {
  if (score >= 8) return 'text-green-400';
  if (score >= 5) return 'text-amber-400';
  return 'text-red-400';
};

const CouncilView: React.FC<CouncilViewProps> = ({ perspectives, isDiscussing, onRunCouncil, status, drivingLPs, decisionType, readinessScore }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#232f3e] text-white rounded-xl p-8 shadow-md border border-[#37475a] flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-[#ff9900] p-2 rounded shadow-md mt-1"><ShieldAlert className="text-[#232f3e]" size={24} /></div>
            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tight">COUNCIL MANDATE</h3>
              <p className="text-slate-300 text-sm">Deterministic audit based on {drivingLPs.length} Leadership Principles.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {decisionType && (
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <span className="text-[10px] font-bold uppercase text-[#ff9900]">Decision Risk:</span>
                <span className="text-xs font-bold">{decisionType}</span>
              </div>
            )}
            {readinessScore !== null && (
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <span className="text-[10px] font-bold uppercase text-[#ff9900]">Readiness Score:</span>
                <span className={`text-xs font-bold ${getReadinessColor(readinessScore)}`}>{readinessScore}/10</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {status !== 'completed' && (
            <button
              onClick={onRunCouncil}
              disabled={isDiscussing}
              className={`px-10 py-4 rounded-lg text-[#232f3e] font-bold shadow-lg uppercase tracking-wider text-sm ${isDiscussing ? 'bg-slate-700 text-slate-400' : 'bg-[#ff9900] hover:bg-[#ffb84d]'}`}
            >
              {isDiscussing ? <><RefreshCw className="animate-spin inline mr-2" size={20} /> DEBATING...</> : <><Zap className="inline mr-2" size={20} fill="currentColor" /> CONVENE COUNCIL</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {drivingLPs.map((lp, idx) => {
          const perspective = perspectives.find(p => p.role === lp);
          return (
            <div key={lp} className={`bg-white rounded-xl border p-6 shadow-sm flex flex-col relative ${perspective ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-lg">{getAgentIcon(idx)}</div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm uppercase">{lp}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">Auditor</p>
                  </div>
                </div>
                {perspective && (
                  <div className="text-right">
                    <div className={`text-2xl font-black ${getScoreColor(perspective.score)}`}>{perspective.score}<span className="text-[10px] text-slate-400">/5</span></div>
                    <div className="flex gap-0.5 justify-end mt-1">
                      {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < perspective.score ? "currentColor" : "none"} className={i < perspective.score ? getScoreColor(perspective.score) : 'text-slate-200'} />)}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-h-[180px]">
                {perspective ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 italic text-sm text-slate-700 leading-relaxed">"{perspective.content}"</div>
                    <div className="text-xs text-slate-500 leading-relaxed bg-amber-50/20 p-3 rounded-lg border border-amber-100/50">
                      <span className="font-bold block uppercase text-[9px] mb-1">Reasoning Logic:</span>
                      {perspective.reasoning}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 py-4">
                    {isDiscussing ? <span className="text-[10px] font-bold uppercase animate-pulse">Analyzing...</span> : <span className="text-[10px] font-bold uppercase opacity-40">Ready</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CouncilView;
