
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { 
  Zap, ArrowRight, Building2, Cpu, 
  X, CheckCircle, MessageSquare, ShieldCheck, 
  EyeOff, UserCheck
} from 'lucide-react';

// Robot Component for Login Feedback (Visual Only - No Sound)
const LoginRobot: React.FC<{ 
  mode: 'idle' | 'speaking' | 'hiding', 
  message?: string 
}> = ({ mode, message }) => {
  return (
    <div className="relative w-32 h-32 flex flex-col items-center justify-center animate-bounce duration-[3000ms]">
      {message && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-brand-navy px-4 py-2 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap min-w-[120px] text-center border border-brand-accent/20 animate-fade-in">
          {message}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-brand-accent/10"></div>
        </div>
      )}
      
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(0,209,255,0.3)]">
        <rect x="20" y="30" width="60" height="50" rx="15" fill="#000a12" stroke="#00D1FF" strokeWidth="2" />
        <rect x="48" y="15" width="4" height="15" fill="#00D1FF" />
        <circle cx="50" cy="15" r="4" fill="#00D1FF" className={mode === 'speaking' ? 'animate-pulse' : ''} />
        
        {mode === 'hiding' ? (
          <>
            <path d="M25 45 Q 35 35 45 45" stroke="#00D1FF" strokeWidth="3" strokeLinecap="round" />
            <path d="M55 45 Q 65 35 75 45" stroke="#00D1FF" strokeWidth="3" strokeLinecap="round" />
            <rect x="28" y="42" width="15" height="4" rx="2" fill="#00D1FF" />
            <rect x="57" y="42" width="15" height="4" rx="2" fill="#00D1FF" />
          </>
        ) : (
          <>
            <circle cx="40" cy="50" r="4" fill="#00D1FF" className={mode === 'idle' ? 'animate-[blink_4s_infinite]' : ''} />
            <circle cx="60" cy="50" r="4" fill="#00D1FF" className={mode === 'idle' ? 'animate-[blink_4s_infinite]' : ''} />
          </>
        )}
        
        {mode === 'speaking' ? (
          <rect x="40" y="65" width="20" height="4" rx="2" fill="#00D1FF" className="animate-[talk_0.2s_infinite]" />
        ) : mode === 'hiding' ? (
          <path d="M45 68 Q 50 72 55 68" stroke="#00D1FF" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <rect x="45" y="68" width="10" height="2" rx="1" fill="#00D1FF" />
        )}

        <style>{`
          @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0); } }
          @keyframes talk { 0%, 100% { height: 2px; transform: translateY(1px); } 50% { height: 6px; transform: translateY(-1px); } }
        `}</style>
      </svg>
    </div>
  );
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ clientId: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [detectedHotel, setDetectedHotel] = useState<string | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(1);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [demoData, setDemoData] = useState({
    fullName: '',
    hotelName: '',
    position: 'Manager',
    email: '',
    mobile: '',
    location: ''
  });
  const [generatedCreds, setGeneratedCreds] = useState<{id: string, user: string, pass: string} | null>(null);

  // Robot State (Silent - Text Bubbles Only)
  const [robotMode, setRobotMode] = useState<'idle' | 'speaking' | 'hiding'>('idle');
  const [robotMsg, setRobotMsg] = useState('');
  // Fix: Use any to avoid NodeJS.Timeout error in browser environments
  const msgTimeout = useRef<any>(null);

  const displayMsg = (text: string, mode: 'speaking' | 'hiding' = 'speaking') => {
    setRobotMsg(text);
    setRobotMode(mode);
    if (msgTimeout.current) clearTimeout(msgTimeout.current);
    
    // Auto-clear message if not hiding
    if (mode !== 'hiding') {
      msgTimeout.current = setTimeout(() => {
        setRobotMode('idle');
      }, 3000);
    }
  };

  useEffect(() => {
    store.getHotels().then(setHotels);
  }, []);

  // Effect: React to Hotel Detection
  useEffect(() => {
    if (formData.clientId.length >= 3) {
      const match = hotels.find(h => h.id.toUpperCase() === formData.clientId.toUpperCase());
      const hotelName = match ? match.name : null;
      setDetectedHotel(hotelName);
      
      if (hotelName) {
        displayMsg(`Welcome to ${hotelName}`);
      }
    } else {
      setDetectedHotel(null);
    }
  }, [formData.clientId, hotels]);

  // Effect: React to Username
  useEffect(() => {
    if (formData.username.length > 3 && focusedField === 'username') {
      const timeout = setTimeout(() => {
        displayMsg(`Hello ${formData.username}!`);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData.username, focusedField]);

  // Effect: React to Password Focus
  useEffect(() => {
    if (focusedField === 'password') {
      displayMsg("Don't worry, I am not watching!", 'hiding');
    } else if (robotMode === 'hiding') {
      setRobotMode('idle');
      setRobotMsg('');
    }
  }, [focusedField, robotMode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.clientId, formData.username, formData.password);
      if (!result.success) {
        setError(result.error || 'Interface Connection Failed.');
        displayMsg("Access denied.");
      } else {
        displayMsg("Handshake success.");
      }
    } catch (err: any) {
      setError(err.message || 'Authentication Failure.');
      displayMsg("System Error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoData.fullName || !demoData.mobile || !demoData.hotelName || !demoData.location) {
      setDemoError('Mandatory fields required.');
      return;
    }
    setDemoLoading(true);
    try {
      const lead = await store.initiateDemoLead(demoData);
      const autoPass = `ZN-${Math.random().toString(36).slice(-6).toUpperCase()}`;
      await store.finalizeDemo(lead, autoPass);
      setGeneratedCreds({ id: lead.clientId, user: 'admin', pass: autoPass });
      setDemoStep(2);
    } catch (err: any) {
      setDemoError(err.message || "Provisioning failed.");
    } finally {
      setDemoLoading(false);
    }
  };

  const enterDemoSandbox = async () => {
    if (!generatedCreds) return;
    setDemoLoading(true);
    try {
      const result = await login(generatedCreds.id, generatedCreds.user, generatedCreds.pass);
      if (!result.success) {
        setDemoError(result.error || "Handshake failed.");
      }
    } catch (err: any) {
      setDemoError(err.message || "Handshake failed.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-brand-deep">
      <div className="mesh-gradient absolute inset-0 -z-10"></div>
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        {/* DESKTOP INFO COLUMN */}
        <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <Logo size="lg" />
            <div>
              <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter">Zinic<span className="text-brand-accent">.</span></h1>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.8em] mt-2">Supply Logic Platform</p>
            </div>
          </div>
          <p className="text-lg lg:text-xl text-white/40 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
            Enterprise-grade multi-tenant asset management for <span className="text-white">modern hotels</span>.
          </p>
          
          <div className="mt-8 lg:flex hidden flex-col items-center lg:items-start gap-12">
            <LoginRobot mode={robotMode} message={robotMsg} />
            <Button onClick={() => setShowDemoModal(true)} variant="secondary" className="!bg-white/5 !text-white !border-white/10 !rounded-3xl !py-6 w-full lg:w-auto !px-10">
              <Zap size={20} className="mr-3 text-brand-accent" fill="currentColor" /> Request Trial Access
            </Button>
          </div>
        </div>

        {/* LOGIN FORM COLUMN */}
        <div className="w-full lg:w-1/2 max-w-md obsidian-glass rounded-[3rem] p-10 shadow-2xl animate-reveal border border-white/5 relative">
          
          {/* MOBILE AI REPLACEMENT CHIP */}
          <div className="lg:hidden flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-8 animate-fade-in">
            <div className={`p-2 rounded-xl bg-brand-navy text-brand-accent ${robotMode === 'speaking' ? 'animate-pulse' : ''}`}>
               {robotMode === 'hiding' ? <EyeOff size={18}/> : robotMode === 'speaking' ? <MessageSquare size={18}/> : <Cpu size={18}/>}
            </div>
            <div className="flex-1">
               <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Assistant Status</p>
               <p className="text-[10px] font-black text-brand-accent uppercase truncate">
                  {robotMsg || (robotMode === 'hiding' ? "Security Protocol Active" : "Systems Operational")}
               </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  label="Client Node ID" 
                  placeholder="E.g. VIT001" 
                  value={formData.clientId} 
                  onChange={e => setFormData({...formData, clientId: e.target.value.toUpperCase()})} 
                  onFocus={() => setFocusedField('clientId')} 
                  onBlur={() => setFocusedField(null)} 
                />
                {detectedHotel && (
                  <div className="absolute top-2 right-4 flex items-center gap-2 animate-fade-in">
                    <Building2 size={14} className="text-brand-accent" />
                    <span className="text-[8px] font-black text-brand-accent uppercase tracking-widest">{detectedHotel}</span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Input label="Username" placeholder="Enter ID" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)} />
                {focusedField === 'username' && formData.username.length > 3 && (
                   <UserCheck size={16} className="absolute top-2 right-4 text-brand-accent animate-fade-in" />
                )}
              </div>
              <div className="relative">
                <Input label="Initial Key" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
                {focusedField === 'password' && (
                  <ShieldCheck size={16} className="absolute top-2 right-4 text-emerald-400 animate-pulse" />
                )}
              </div>
            </div>
            {error && <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center animate-shake px-2">{error}</div>}
            <Button type="submit" className="w-full h-16 !bg-brand-accent !text-brand-navy !text-sm shadow-xl" isLoading={loading}>
              Authorize Terminal <ArrowRight size={18} className="ml-2" />
            </Button>

            <button type="button" onClick={() => setShowDemoModal(true)} className="lg:hidden w-full text-center text-[10px] font-black text-white/40 uppercase tracking-widest mt-4 hover:text-white transition-colors">
              Request Trial Access
            </button>
          </form>
        </div>
      </div>

      {showDemoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-brand-deep/80 backdrop-blur-xl">
          <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-10 lg:p-12 animate-reveal relative">
            <button onClick={() => setShowDemoModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-rose-500"><X size={32} /></button>
            {demoStep === 1 ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-black text-brand-navy tracking-tight">Provision Sandbox</h2>
                <form onSubmit={handleDemoLaunch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Identity" value={demoData.fullName} onChange={e => setDemoData({...demoData, fullName: e.target.value})} required />
                    <Input label="Mobile Node" value={demoData.mobile} onChange={e => setDemoData({...demoData, mobile: e.target.value})} required />
                  </div>
                  <Input label="Hotel / Entity Title" value={demoData.hotelName} onChange={e => setDemoData({...demoData, hotelName: e.target.value})} required />
                  <Input label="Location" value={demoData.location} onChange={e => setDemoData({...demoData, location: e.target.value})} required />
                  <Button type="submit" className="w-full h-16 !bg-brand-navy !text-brand-accent mt-4" isLoading={demoLoading}>Deploy 48H Instance</Button>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto"><CheckCircle size={40} /></div>
                <div>
                  <h3 className="text-2xl font-black text-brand-navy">Instance Live</h3>
                  <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client ID: <span className="text-brand-navy">{generatedCreds?.id}</span></p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username: <span className="text-brand-navy">{generatedCreds?.user}</span></p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Key: <span className="text-brand-accent">{generatedCreds?.pass}</span></p>
                  </div>
                </div>
                {demoError && <p className="text-xs font-black text-rose-500 uppercase">{demoError}</p>}
                <Button onClick={enterDemoSandbox} className="w-full h-16 !bg-brand-navy !text-white" isLoading={demoLoading}>Enter Dashboard</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
