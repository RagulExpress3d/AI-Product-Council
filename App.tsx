
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Sidebar from './components/Sidebar';
import CouncilView from './components/CouncilView';
import DocumentViewer from './components/DocumentViewer';
import { CouncilSession, Message, AgentPerspective, UserSettings, CouncilTone, SpecialRoles } from './types';
import { getAgentResponse, generatePRFAQ, getChatResponse } from './services/geminiService';
import { Send, Sparkles, MessageSquare, ShieldCheck, ChevronRight, Loader2, X, Check, Info, Target } from 'lucide-react';

const AMAZON_LPS = [
  "Customer Obsession", "Ownership", "Invent and Simplify", "Are Right, A Lot",
  "Learn and Be Curious", "Hire and Develop the Best", "Insist on the Highest Standards",
  "Think Big", "Bias for Action", "Frugality", "Earn Trust", "Dive Deep",
  "Have Backbone; Disagree and Commit", "Deliver Results", 
  "Strive to be Earth’s Best Employer", "Success and Scale Bring Broad Responsibility"
];

const App: React.FC = () => {
  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isDiscussing, setIsDiscussing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'council' | 'documents'>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    lpFocus: ['Customer Obsession', 'Ownership', 'Bias for Action'],
    tone: 'Doc Bar-Raiser',
    orgContext: 'Amazon Retail'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  useEffect(() => { scrollToBottom(); }, [activeSession?.messages, isChatLoading]);
  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const handleNewSession = () => {
    const newSession: CouncilSession = {
      id: crypto.randomUUID(),
      title: 'New Product Journey',
      topic: '',
      messages: [],
      perspectives: [],
      prfaq: null,
      councilReport: null,
      rejectedPaths: [],
      decisionType: null,
      status: 'draft',
      facets: { customer: false, problem: false, benefit: false, solution: false },
      createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');
  };

  const updateFacets = (text: string) => {
    if (!activeSession) return;
    const lowerText = text.toLowerCase();
    const newFacets = { ...activeSession.facets };
    if (lowerText.includes('customer') || lowerText.includes('user')) newFacets.customer = true;
    if (lowerText.includes('problem') || lowerText.includes('pain')) newFacets.problem = true;
    if (lowerText.includes('benefit') || lowerText.includes('value')) newFacets.benefit = true;
    if (lowerText.includes('solution') || lowerText.includes('how it works')) newFacets.solution = true;
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, facets: newFacets } : s));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeSessionId || isChatLoading) return;

    const currentInput = inputValue;
    setInputValue('');
    updateFacets(currentInput);

    const userMessage: Message = { id: crypto.randomUUID(), sender: 'User', content: currentInput, timestamp: Date.now() };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, topic: s.topic || currentInput, title: s.title === 'New Product Journey' ? currentInput.slice(0, 30) : s.title, messages: [...s.messages, userMessage] };
      }
      return s;
    }));

    setIsChatLoading(true);
    try {
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) {
        const aiContent = await getChatResponse([...session.messages, userMessage], settings);
        const aiMessage: Message = { id: crypto.randomUUID(), sender: SpecialRoles.MASTER_PM, content: aiContent, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMessage] } : s));
      }
    } catch (err) { console.error(err); } finally { setIsChatLoading(false); }
  };

  const runCouncilDebate = async () => {
    if (!activeSession || !activeSessionId) return;
    setIsDiscussing(true);
    setActiveTab('council');
    try {
      const context = activeSession.messages.map(m => `${m.sender}: ${m.content}`).join('\n');
      const perspectives = await Promise.all(settings.lpFocus.map(role => getAgentResponse(role, activeSession.topic, context, settings)));
      const { prfaq, report, decisionType, rejectedPaths } = await generatePRFAQ(activeSession.topic, perspectives.map(p => `${p.role}: ${p.content}`).join('\n\n'), settings);
      
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
        ...s, 
        perspectives, 
        prfaq, 
        councilReport: report, 
        decisionType: decisionType as any, 
        rejectedPaths,
        status: 'completed' 
      } : s));
      setTimeout(() => setActiveTab('documents'), 1500);
    } catch (error) { console.error(error); } finally { setIsDiscussing(false); }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f3f4f6]">
      <Sidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={setActiveSessionId} onNewSession={handleNewSession} onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 flex flex-col min-w-0 relative">
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-[#232f3e]/60 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">LP Settings</h2>
                  <X className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setIsSettingsOpen(false)} />
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-4 tracking-wider">Leadership Principle Focus (Select 3)</p>
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {AMAZON_LPS.map(lp => (
                        <button key={lp} onClick={() => {
                          setSettings(prev => {
                            const exists = prev.lpFocus.includes(lp);
                            if (!exists && prev.lpFocus.length >= 3) return prev;
                            return { ...prev, lpFocus: exists ? prev.lpFocus.filter(i => i !== lp) : [...prev.lpFocus, lp] };
                          });
                        }} className={`text-left text-sm p-3 rounded-lg border transition-all flex justify-between items-center ${settings.lpFocus.includes(lp) ? 'bg-[#ff9900]/10 border-[#ff9900] text-[#232f3e] font-bold shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                          {lp}
                          {settings.lpFocus.includes(lp) && <Check size={16} className="text-[#ff9900]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <button onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-[#232f3e] text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Confirm Principles</button>
                </div>
             </div>
          </div>
        )}

        {activeSession && (
          <div className="bg-white border-b px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-800">{activeSession.title}</h2>
              <div className="flex gap-4 mt-2">
                {Object.entries(activeSession.facets).map(([key, val]) => (
                  <div key={key} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${val ? 'text-green-600' : 'text-slate-300'}`}>
                    {val ? <Check size={12} /> : <Target size={12} />} {key}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('chat')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'chat' ? 'bg-white shadow text-[#ff9900]' : 'text-slate-500'}`}>Discovery</button>
              <button onClick={() => setActiveTab('council')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'council' ? 'bg-white shadow text-[#ff9900]' : 'text-slate-500'}`}>Review</button>
              <button onClick={() => setActiveTab('documents')} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'documents' ? 'bg-white shadow text-[#ff9900]' : 'text-slate-500'}`}>Docs</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden p-8">
          <div className="max-w-6xl mx-auto h-full flex flex-col">
            {activeTab === 'chat' && activeSession && (
              <div className="flex flex-col flex-1 bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {activeSession.messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'User' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-6 py-4 border ${m.sender === 'User' ? 'bg-[#232f3e] text-white border-[#232f3e]' : 'bg-white border-slate-200 text-slate-800 shadow-sm'}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${m.sender === 'User' ? 'text-[#ff9900]' : 'text-[#ff9900]'}`}>{m.sender === 'User' ? 'PM' : 'MASTER AGENT'}</span>
                        <div className="text-sm chat-markdown"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && <div className="animate-pulse text-slate-400 text-xs font-bold uppercase tracking-widest">Master Agent is performing analysis...</div>}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-6 border-t bg-slate-50 flex gap-4 flex-shrink-0">
                  <input 
                    type="text" 
                    value={inputValue} 
                    onChange={e => setInputValue(e.target.value)} 
                    placeholder="Refine facets (Customer, Problem, Solution...)" 
                    className="flex-1 bg-white border rounded-xl px-6 py-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff9900]/40 placeholder:text-slate-400 shadow-sm" 
                  />
                  <button type="submit" className="bg-[#232f3e] text-white p-4 rounded-xl shadow-lg hover:bg-slate-800 transition-colors"><Send size={24} /></button>
                </form>
              </div>
            )}
            {activeTab === 'council' && activeSession && (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <CouncilView perspectives={activeSession.perspectives} isDiscussing={isDiscussing} onRunCouncil={runCouncilDebate} status={activeSession.status} drivingLPs={settings.lpFocus} decisionType={activeSession.decisionType} />
              </div>
            )}
            {activeTab === 'documents' && activeSession && (
              <div className="flex-1 min-h-0">
                <DocumentViewer 
                  prfaq={activeSession.prfaq} 
                  report={activeSession.councilReport} 
                  rejectedPaths={activeSession.rejectedPaths}
                  decisionType={activeSession.decisionType}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
