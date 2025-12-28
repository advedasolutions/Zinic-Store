import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  Zap, ArrowRight, Building2, 
  X, CheckCircle, ShieldCheck, 
  Shield, HelpCircle, Lock, User as UserIcon, Bot, Sparkles, Cpu
} from 'lucide-react';
import { Logo } from '../components/Logo';

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

  useEffect(() => {
    store.getHotels().then(setHotels);
  }, []);

  useEffect(() => {
    const normalized = formData.clientId.trim().toUpperCase();
    if (normalized.length >= 3) {
      const match = hotels.find(h => h.id.toUpperCase() === normalized);
      setDetectedHotel(match ? match.name : null);
    } else {
      setDetectedHotel(null);
    }
  }, [formData.clientId, hotels]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(formData.clientId, formData.username, formData.password);
      if (!result.success) {
        setError(result.error || 'Authentication Failed.');
      }
    } catch (err: any) {
      setError('System Error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoData.fullName || !demoData.mobile) {
      setDemoError('Please provide contact details.');
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
      setDemoError("System error.");
    } finally {
      setDemoLoading(false);
    }
  };

  const enterDemoSandbox = async () => {
    if (!generatedCreds) return;
    setDemoLoading(true);
    await login(generatedCreds.id, generatedCreds.user, generatedCreds.pass);
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#010409] font-sans antialiased overflow-x-hidden selection:bg-brand-accent selection:text-brand-navy">
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00D1FF 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
      <div className="mesh-gradient absolute inset-0 -z-10 opacity-40"></div>

      {/* PC VIEW: LEFT SIDE PANEL (BRANDING & BOT) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative z-10">
          <Logo size="xl" className="justify-start -ml-4" />
        </div>

        <div className="relative z-10 space-y-10">
           {/* THE "BOT" ELEMENT */}
           <div className="inline-flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl animate-reveal">
              <div className="w-16 h-16 bg-brand-accent rounded-[1.5rem] flex items-center justify-center text-brand-navy shadow-[0_0_30px_rgba(0,209,255,0.3)]">
                <Bot size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">Zinic A.I. Active</p>
                <p className="text-white font-bold text-sm tracking-tight">Intelligence Engine Ready.</p>
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-7xl font-black text-white leading-[0.9] tracking-tighter">
                Smart Stores. <br />
                <span className="text-brand-accent">Flawless Ops.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium max-w-lg leading-relaxed">
                Next-generation asset orchestration for high-velocity supply chains.
              </p>
           </div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
           <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-navy bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                  <UserIcon size={14} />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-brand-navy bg-brand-accent flex items-center justify-center text-[10px] font-black text-brand-navy">
                +1k
              </div>
           </div>
           <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Authorized Global Clusters</p>
        </div>
      </div>

      {/* FORM AREA: CENTERED ON MOBILE, RIGHT SIDE ON PC */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 min-h-screen">
        <div className="w-full max-w-[480px] animate-reveal">
          <div className="bg-[#0a0d14]/90 backdrop-blur-3xl p-8 lg:p-12 rounded-[3.5rem] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="space-y-10">
              {/* Encrypted Badge */}
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-black uppercase tracking-widest">
                  <Shield size={12} className="fill-current" /> Encrypted Terminal
                </div>
              </div>

              {/* Header */}
              <div className="space-y-3">
                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  System Authorization
                </h1>
                <p className="text-slate-400 text-base font-medium">
                  Securely access your entity's asset console.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Entity Identifier</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="e.g. ZNC-8801"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-brand-accent/50 focus:ring-4 focus:ring-brand-accent/5 transition-all"
                        value={formData.clientId}
                        onChange={e => setFormData({...formData, clientId: e.target.value.toUpperCase()})}
                      />
                      {detectedHotel && <span className="absolute top-1/2 -translate-y-1/2 right-6 text-[9px] font-black text-brand-accent uppercase tracking-widest">{detectedHotel}</span>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Staff Credentials</label>
                    <input 
                      type="text"
                      placeholder="Username"
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-brand-accent/50 focus:ring-4 focus:ring-brand-accent/5 transition-all"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
                    <input 
                      type="password"
                      placeholder="Master Secret"
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-brand-accent/50 focus:ring-4 focus:ring-brand-accent/5 transition-all"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest text-center rounded-2xl">
                    {error}
                  </div>
                )}

                <div className="pt-4 space-y-8">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-20 bg-brand-accent text-brand-navy rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(0,209,255,0.2)] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>Establish Connection <ArrowRight size={20} /></>
                    )}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setShowDemoModal(true)} 
                    className="w-full flex items-center justify-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-brand-accent transition-all group"
                  >
                    <Zap size={14} className="text-brand-accent transition-transform group-hover:scale-125" fill="currentColor" />
                    Request Trial Sandbox
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#010409]/95 backdrop-blur-2xl animate-fade-in">
          <div className="bg-[#0a101a] border border-white/10 rounded-[3rem] w-full max-w-xl p-8 lg:p-12 animate-reveal relative shadow-2xl">
            <button onClick={() => setShowDemoModal(false)} className="absolute top-8 right-8 text-slate-500 hover:text-rose-500"><X size={28} /></button>
            {demoStep === 1 ? (
              <div className="space-y-8 text-white">
                <div className="space-y-2">
                  <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent mb-6"><Zap size={28} fill="currentColor" /></div>
                  <h2 className="text-3xl font-black tracking-tight">Deploy Sandbox</h2>
                  <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">Provision a private node for your entity.</p>
                </div>
                <form onSubmit={handleDemoLaunch} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</label>
                      <input value={demoData.fullName} onChange={e => setDemoData({...demoData, fullName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-accent/40" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile</label>
                      <input value={demoData.mobile} onChange={e => setDemoData({...demoData, mobile: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-accent/40" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hotel / Entity Name</label>
                    <input value={demoData.hotelName} onChange={e => setDemoData({...demoData, hotelName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-accent/40" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</label>
                    <input value={demoData.location} onChange={e => setDemoData({...demoData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-bold outline-none focus:border-brand-accent/40" required />
                  </div>
                  <button type="submit" disabled={demoLoading} className="w-full h-16 bg-brand-navy text-brand-accent border border-brand-accent/30 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent hover:text-brand-navy transition-all mt-4 flex items-center justify-center">
                    {demoLoading ? <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin"></div> : 'Initialize Demo Node'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-10 py-6">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]"><CheckCircle size={48} /></div>
                <div>
                  <h3 className="text-4xl font-black text-white tracking-tight">Node Activated</h3>
                  <p className="text-slate-400 mt-2 font-medium text-sm uppercase tracking-widest">Use these keys to access your instance.</p>
                </div>
                <div className="p-10 bg-white/5 rounded-[2.5rem] text-left space-y-4 border border-white/5">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Node ID</span><span className="text-brand-accent font-black text-lg">{generatedCreds?.id}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">User</span><span className="text-white font-black text-lg">{generatedCreds?.user}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Secret</span><span className="text-brand-accent font-black text-lg">{generatedCreds?.pass}</span></div>
                </div>
                <button onClick={enterDemoSandbox} className="w-full h-20 bg-brand-accent text-brand-navy rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl">Enter Platform</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};