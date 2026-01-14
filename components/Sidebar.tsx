
import React from 'react';
import { Plus, MessageSquare, Briefcase, Settings, ChevronRight } from 'lucide-react';
import { CouncilSession } from '../types';

interface SidebarProps {
  sessions: CouncilSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, onSelectSession, onNewSession, onOpenSettings }) => {
  return (
    <div className="w-64 bg-[#232f3e] text-white flex flex-col h-full border-r border-[#1a232e]">
      <div className="p-4 flex items-center gap-3 border-b border-[#37475a]">
        <div className="bg-[#ff9900] p-1.5 rounded-lg">
          <Briefcase size={20} className="text-[#232f3e]" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">PM Council</h1>
      </div>

      <div className="p-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 bg-[#37475a] hover:bg-[#48596e] py-2.5 px-4 rounded-md transition-all text-sm font-medium border border-[#48596e]"
        >
          <Plus size={18} />
          New Product Idea
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
        <div className="px-3 mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Product Journeys</p>
        </div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left p-3 rounded-lg flex items-center gap-3 group transition-all ${
              activeSessionId === session.id 
              ? 'bg-[#37475a] text-[#ff9900]' 
              : 'hover:bg-[#2b3949] text-slate-300'
            }`}
          >
            <MessageSquare size={16} className={activeSessionId === session.id ? 'text-[#ff9900]' : 'text-slate-500'} />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{session.title || 'Draft Session'}</p>
              <p className="text-[10px] text-slate-500">{new Date(session.createdAt).toLocaleDateString()}</p>
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-500 italic">No sessions yet. Start your first product journey!</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#37475a] bg-[#1a232e]">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors p-2 rounded hover:bg-white/5"
        >
          <Settings size={16} />
          <span>LP Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
