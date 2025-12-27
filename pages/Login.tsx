
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { 
  Zap, ArrowRight, Building2, 
  X, CheckCircle, ShieldCheck, 
  UserCheck
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-brand-deep">
      <div className="mesh-gradient absolute inset-0 -z-10"></div>
      
      {/* Animated Logo Container */}
      <div 
        className={`fixed z-[100] transition-all duration-700 ease-in-out pointer-events-none ${
          isInteracting 
            ? 'top-8 right-8 scale-50 opacity-100 lg:top-12 lg:right-12' 
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200%] lg:-translate-y-[150%] scale-100 lg:static lg:translate-x-0 lg:translate-y-0'
        }`}
      >
        <div className="flex flex-col items-center gap-4 lg:items-start lg:mb-8">
           <Logo size="lg" />
           <div className={`transition-opacity duration-500 ${isInteracting ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
              <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter">Zinic<span className="text-brand-accent">.</span></h1>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.8em] mt-2">Supply Logic Platform</p>
           </div>
        </div>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        {/* DESKTOP INFO COLUMN */}
        <div className={`w-full lg:w-1/2 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start transition-all duration-700 ${isInteracting ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
          <div className="lg:block hidden">
            <p className="text-lg lg:text-xl text-white/40 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
              Enterprise-grade multi-tenant asset management for <span className="text-white">modern hotels</span>.
            </p>
            <div className="mt-8 flex flex-col items-center lg:items-start gap-12">
              <Button onClick={() => setShowDemoModal(true)} variant="secondary" className="!bg-white/5 !text-white !border-white/10 !rounded-3xl !py-6 w-full lg:w-auto !px-10">
                <Zap size={20} className="mr-3 text-brand-accent" fill="currentColor" /> Request Trial Access
              </Button>
            </div>
          </div>
        </div>

        {/* LOGIN FORM COLUMN */}
        <div className="w-full lg:w-1/2 max-w-md obsidian-glass rounded-[3rem] p-10 shadow-2xl animate-reveal border border-white/5 relative z-10">
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
