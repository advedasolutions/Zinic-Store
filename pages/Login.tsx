
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { 
  Zap, ArrowRight, Building2, 
  X, CheckCircle, ShieldCheck, 
  UserCheck, Shield
} from 'lucide-react';

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

  // Detect if user has started interaction
  const isInteracting = useMemo(() => {
    return focusedField !== null || formData.clientId.length > 0 || formData.username.length > 0 || formData.password.length > 0;
  }, [focusedField, formData]);

  // Effect: React to Hotel Detection
  useEffect(() => {
    if (formData.clientId.length >= 3) {
      const match = hotels.find(h => h.id.toUpperCase() === formData.clientId.toUpperCase());
      const hotelName = match ? match.name : null;
      setDetectedHotel(hotelName);
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
        setError(result.error || 'Interface Connection Failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication Failure.');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#010409] selection:bg-brand-accent selection:text-brand-navy font-sans antialiased overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00D1FF 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
      <div className="mesh-gradient absolute inset-0 -z-10 opacity-60"></div>

      {/* Brand Side (Desktop) */}
      <div className={`hidden lg:flex lg:w-1/2 flex-col justify-between p-16 transition-all duration-1000 ${isInteracting ? 'opacity-30 blur-sm scale-95 translate-x-[-5%]' : 'opacity-100'}`}>
        <div className="flex items-center gap-4">
          <Logo size="xl" />
        </div>

        <div className="space-y-6 max-w-lg">
          <h2 className="text-6xl font-black text-white leading-tight tracking-tighter">
            Smart Stores. <br />
            <span className="text-brand-accent">Flawless Ops.</span>
          </h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            The industrial standard for multi-tenant inventory orchestration and high-velocity hotel supply chains.
          </p>
          <div className="pt-8 flex gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-deep bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">H{i}</div>
              ))}
            </div>
            <div className="text-sm">
              <p className="text-white font-bold">Trusted by 500+ Entities</p>
              <p className="text-slate-500 font-medium">Across the hospitality network</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
          <span>© 2024 Zinic Platform</span>
          <span className="w-1 h-1 bg-white/20 rounded-full"></span>
          <span>Security Level: Tier-IV</span>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 min-h-screen">
        
        {/* Mobile-Only Header Brand - Properly Spaced to prevent overlap */}
        <div 
          className={`lg:hidden flex flex-col items-center mb-10 transition-all duration-700 ${
            isInteracting ? 'opacity-0 scale-90 -translate-y-10' : 'opacity-100'
          }`}
        >
          <Logo size="lg" />
        </div>

        {/* Small Floating Logo - Top Right when interacting */}
        <div 
          className={`fixed z-[100] transition-all duration-700 ease-in-out pointer-events-none ${
            isInteracting 
              ? 'top-8 right-8 scale-50 opacity-100 visible' 
              : 'top-8 right-8 scale-50 opacity-0 invisible'
          }`}
        >
          <Logo size="lg" />
        </div>

        <div className={`w-full max-w-[480px] transition-all duration-700 ${isInteracting ? 'translate-y-0' : 'translate-y-4'}`}>
          <div className="bg-[#0D1117]/80 backdrop-blur-3xl p-8 lg:p-14 rounded-[3rem] lg:rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent/5 rounded-full blur-[60px] group-hover:bg-brand-accent/10 transition-colors"></div>

            <div className="relative z-10 space-y-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/5 border border-brand-accent/10 text-brand-accent text-[9px] font-black uppercase tracking-widest mb-2">
                  <Shield size={12} /> Encrypted Terminal
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">System Authorization</h3>
                <p className="text-slate-500 text-sm font-medium">Securely access your entity's asset console.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="relative group">
                    <Input 
                      label="Entity Identifier" 
                      placeholder="e.g. ZNC-8801" 
                      className="!bg-white/5 !border-white/10 !text-white !py-5 focus:!border-brand-accent/40 !rounded-2xl placeholder:!text-slate-600 transition-all"
                      value={formData.clientId} 
                      onChange={e => setFormData({...formData, clientId: e.target.value.toUpperCase()})} 
                      onFocus={() => setFocusedField('clientId')} 
                      onBlur={() => setFocusedField(null)} 
                    />
                    {detectedHotel && (
                      <div className="absolute top-[48px] right-4 flex items-center gap-2 animate-reveal">
                        <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">{detectedHotel}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <Input 
                      label="Staff Credentials" 
                      placeholder="Username" 
                      className="!bg-white/5 !border-white/10 !text-white !py-5 focus:!border-brand-accent/40 !rounded-2xl placeholder:!text-slate-600 transition-all"
                      value={formData.username} 
                      onChange={e => setFormData({...formData, username: e.target.value})} 
                      onFocus={() => setFocusedField('username')} 
                      onBlur={() => setFocusedField(null)} 
                    />
                    {focusedField === 'username' && formData.username.length > 2 && (
                       <UserCheck size={16} className="absolute top-[48px] right-4 text-brand-accent/60 animate-reveal" />
                    )}
                  </div>

                  <div className="relative group">
                    <Input 
                      label="Security Key" 
                      type="password" 
                      placeholder="Master Secret" 
                      className="!bg-white/5 !border-white/10 !text-white !py-5 focus:!border-brand-accent/40 !rounded-2xl placeholder:!text-slate-600 transition-all"
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      onFocus={() => setFocusedField('password')} 
                      onBlur={() => setFocusedField(null)} 
                    />
                    {focusedField === 'password' && (
                      <ShieldCheck size={16} className="absolute top-[48px] right-4 text-emerald-400/60 animate-pulse" />
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-[10px] font-black uppercase tracking-widest animate-shake">
                    <X size={16} /> {error}
                  </div>
                )}

                <div className="pt-4 space-y-6">
                  <Button type="submit" className="w-full h-16 !bg-brand-accent !text-brand-navy !text-[11px] !rounded-2xl shadow-[0_20px_40px_rgba(0,209,255,0.15)] group relative overflow-hidden" isLoading={loading}>
                    <span className="relative z-10 flex items-center justify-center font-black uppercase tracking-[0.2em]">
                      Establish Connection <ArrowRight size={18} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                  
                  <div className="flex flex-col items-center gap-6">
                    <button 
                      type="button" 
                      onClick={() => setShowDemoModal(true)} 
                      className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-brand-accent transition-colors flex items-center gap-2"
                    >
                      <Zap size={14} className="text-brand-accent" fill="currentColor" /> Request Trial Sandbox
                    </button>
                    
                    <div className="flex items-center gap-4 w-full">
                      <div className="h-px flex-1 bg-white/5"></div>
                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">Protected by AES-256</span>
                      <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* DEMO MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-brand-deep/90 backdrop-blur-2xl">
          <div className="bg-[#0D1117] border border-white/10 rounded-[3rem] lg:rounded-[3.5rem] w-full max-w-xl p-8 lg:p-14 animate-reveal relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand-accent/5 rounded-full blur-[80px]"></div>
            
            <button onClick={() => setShowDemoModal(false)} className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-rose-500 transition-all">
              <X size={24} />
            </button>

            {demoStep === 1 ? (
              <div className="space-y-10 relative z-10">
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent mb-6">
                    <Zap size={32} fill="currentColor" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Rapid Onboarding</h2>
                  <p className="text-slate-400 font-medium text-sm">Provision a secure trial node for your organization.</p>
                </div>

                <form onSubmit={handleDemoLaunch} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                      label="Representative Name" 
                      className="!bg-white/5 !border-white/10 !text-white !rounded-2xl"
                      value={demoData.fullName} 
                      onChange={e => setDemoData({...demoData, fullName: e.target.value})} 
                      required 
                    />
                    <Input 
                      label="Contact Node" 
                      className="!bg-white/5 !border-white/10 !text-white !rounded-2xl"
                      value={demoData.mobile} 
                      onChange={e => setDemoData({...demoData, mobile: e.target.value})} 
                      required 
                    />
                  </div>
                  <Input 
                    label="Hotel / Corporate Entity" 
                    className="!bg-white/5 !border-white/10 !text-white !rounded-2xl"
                    value={demoData.hotelName} 
                    onChange={e => setDemoData({...demoData, hotelName: e.target.value})} 
                    required 
                  />
                  <Input 
                    label="Operational Location" 
                    className="!bg-white/5 !border-white/10 !text-white !rounded-2xl"
                    value={demoData.location} 
                    onChange={e => setDemoData({...demoData, location: e.target.value})} 
                    required 
                  />
                  <Button type="submit" className="w-full h-16 !bg-brand-accent !text-brand-navy mt-4 !rounded-2xl" isLoading={demoLoading}>
                    Deploy 48H Instance
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-10 relative z-10 py-4">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                  <CheckCircle size={48} />
                </div>
                <div>
                  <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Provisioning Complete</h3>
                  <p className="text-slate-400 mt-2 font-medium">Your ephemeral cloud terminal is now live.</p>
                </div>
                
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-left space-y-4 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client ID</span>
                    <span className="text-brand-accent font-black tracking-widest">{generatedCreds?.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Root User</span>
                    <span className="text-white font-black tracking-widest">{generatedCreds?.user}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Key</span>
                    <span className="text-white font-black tracking-widest">{generatedCreds?.pass}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button onClick={enterDemoSandbox} className="w-full h-16 !bg-brand-accent !text-brand-navy !rounded-2xl" isLoading={demoLoading}>
                    Enter Management Console
                  </Button>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Store these credentials. Instance self-destructs in 48 hours.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
