import React, { useEffect, useState, useCallback } from 'react';
import { store } from '../services/mockStore';
import { Hotel, UserRole, Department, DemoLead } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ICONS } from '../constants';
import { 
  X, CheckCircle2, AlertCircle, Globe, Zap, 
  RefreshCw, Trash2, ShieldAlert, Lock, Save, Ban, Check,
  Settings, Loader2, MapPin, Power, ShieldX, Server, Building2,
  ChevronDown, KeyRound, Mail, User as UserIcon, ShieldCheck,
  Users, Calendar, Clock, Phone, ExternalLink
} from 'lucide-react';

export const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'leads'>('tenants');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [demoLeads, setDemoLeads] = useState<DemoLead[]>([]);
  const [hotelStats, setHotelStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    id: '', 
    name: '', 
    isActive: true, 
    maxUsers: 20, 
    maxItems: 500, 
    contactEmail: '', 
    adminFullName: '', 
    adminEmail: '', 
    adminUsername: 'admin', 
    adminPassword: '', 
    newResetPassword: '' 
  });

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await store.refreshHotels(); // Force fetch from DB
      const hotelsData = await store.getHotels();
      const leadsData = await store.getDemoLeads();
      
      setHotels([...hotelsData]);
      setDemoLeads([...leadsData]);
      
      const statsMap: Record<string, any> = {};
      for (const h of hotelsData) { 
        statsMap[h.id] = await store.getStats(h.id); 
      }
      setHotelStats(statsMap);
    } catch (err) { 
      console.error("SuperAdmin sync failed", err); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, []);

  useEffect(() => { 
    loadData(); 
    const unsubscribe = store.subscribe(loadData); 
    return () => { unsubscribe(); }; 
  }, [loadData]);

  const handleOpenModal = (hotel: Hotel | null = null) => {
    setFormError(''); 
    setSuccessMsg(''); 
    setIsDeleting(false);
    
    if (hotel) {
      setEditingHotel(hotel);
      setFormData({ 
        id: hotel.id, 
        name: hotel.name, 
        isActive: hotel.isActive, 
        maxUsers: hotel.maxUsers || 20, 
        maxItems: hotel.maxItems || 500, 
        contactEmail: hotel.contactEmail || '', 
        adminFullName: '', 
        adminEmail: '', 
        adminUsername: 'admin', 
        adminPassword: '', 
        newResetPassword: '' 
      });
    } else {
      setEditingHotel(null);
      setFormData({ 
        id: '', 
        name: '', 
        isActive: true, 
        maxUsers: 20, 
        maxItems: 500, 
        contactEmail: '', 
        adminFullName: '', 
        adminEmail: '', 
        adminUsername: 'admin', 
        adminPassword: '', 
        newResetPassword: '' 
      });
    }
    setShowModal(true);
  };

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setFormError(''); 
    setIsSaving(true); 
    setSuccessMsg('');
    
    try {
      if (editingHotel) {
        await store.updateHotel({ 
          ...editingHotel, 
          name: formData.name, 
          isActive: formData.isActive, 
          maxUsers: Number(formData.maxUsers), 
          maxItems: Number(formData.maxItems), 
          contactEmail: formData.contactEmail 
        });
        
        if (formData.newResetPassword) {
          await store.forceResetAdminPassword(editingHotel.id, formData.newResetPassword);
        }
        setSuccessMsg('Configurations synchronized.');
      } else {
        if (!/^[a-zA-Z0-9]{3,8}$/.test(formData.id)) { 
          setFormError('Client ID must be 3-8 alphanumeric characters.'); 
          setIsSaving(false); 
          return; 
        }
        if (!formData.adminPassword) { 
          setFormError('Initial Admin Key required for new clusters.'); 
          setIsSaving(false); 
          return; 
        }
        
        await store.createHotelWithAdmin(
          { 
            id: formData.id.toUpperCase(), 
            name: formData.name, 
            isActive: true, 
            maxUsers: Number(formData.maxUsers), 
            maxItems: Number(formData.maxItems), 
            contactEmail: formData.contactEmail || formData.adminEmail, 
            createdAt: new Date().toISOString() 
          }, 
          { 
            fullName: formData.adminFullName, 
            email: formData.adminEmail, 
            username: formData.adminUsername, 
            password: formData.adminPassword 
          }
        );
        setSuccessMsg(`Cluster ${formData.id.toUpperCase()} successfully deployed.`);
      }
      
      await loadData(); 
      setTimeout(() => { 
        setShowModal(false); 
        setSuccessMsg(''); 
      }, 1500);
    } catch (err: any) { 
      setFormError(err.message || 'Operation failed.'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleDeleteTenant = async () => {
    if (!editingHotel) return;
    const confirmText = prompt(`Type "DECOMMISSION ${editingHotel.id}" to confirm permanent removal.`);
    
    if (confirmText !== `DECOMMISSION ${editingHotel.id}`) {
      alert("Confirmation mismatch. Operation cancelled.");
      return;
    }

    setIsDeleting(true); 
    setFormError('');
    try {
      await store.deleteHotel(editingHotel.id);
      setSuccessMsg('Tenant decommissioned successfully.'); 
      setTimeout(() => { 
        setShowModal(false); 
        loadData(); 
      }, 1500);
    } catch (err: any) { 
      setFormError(err.message || 'Decommissioning failed.'); 
    } finally { 
      setIsDeleting(false); 
    }
  };

  if (loading && hotels.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 h-[60vh]">
      <Loader2 size={48} className="text-brand-accent animate-spin mb-6" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-navy/40">Syncing Master Cluster...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-brand-navy tracking-tighter">Global Terminal</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
            <Server size={14} className="text-brand-accent" /> Infrastructure Protocol v5.0
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={loadData} variant="secondary" className="!rounded-2xl h-14 !px-4 hover:bg-slate-50">
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </Button>
          <Button onClick={() => handleOpenModal()} className="flex-1 md:flex-none !bg-brand-accent !text-brand-navy shadow-2xl !px-10 !rounded-[1.5rem] h-14 !font-black !uppercase !tracking-widest !text-[10px]">
            <Zap size={18} fill="currentColor" /> Deploy Tenant
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('tenants')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'tenants' ? 'border-brand-accent text-brand-navy' : 'border-transparent text-slate-400'}`}>
          Active Nodes ({hotels.length})
        </button>
        <button onClick={() => setActiveTab('leads')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'leads' ? 'border-brand-accent text-brand-navy' : 'border-transparent text-slate-400'}`}>
          Waitlist Leads ({demoLeads.length})
        </button>
      </div>

      {activeTab === 'tenants' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
              <p className="text-4xl font-black text-brand-navy leading-none">{hotels.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Active Cluster Points</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
              <p className="text-4xl font-black text-emerald-500 leading-none">99.9%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Network Link Integrity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {hotels.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Infrastructure silent</p>
              </div>
            ) : hotels.map(hotel => {
              const stats = hotelStats[hotel.id];
              return (
                <div key={hotel.id} className="group bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6 transition-all relative overflow-hidden hover:shadow-2xl">
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl transition-all shadow-inner shrink-0 ${hotel.isActive ? 'bg-brand-navy text-brand-accent' : 'bg-slate-100 text-slate-300'}`}>
                      <Building2 size={24} />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-xl font-black truncate ${hotel.isActive ? 'text-brand-navy' : 'text-slate-400 line-through'}`}>{hotel.name}</h3>
                        {!hotel.isActive && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">Suspended</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="text-brand-navy bg-brand-accent/10 px-2 py-0.5 rounded-md font-bold">NODE: {hotel.id}</span>
                        {stats && <span>{stats.totalUsers} Staff Nodes</span>}
                        {stats && <span>{stats.totalItems} Asset Entries</span>}
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" className="!rounded-2xl h-14 !px-8 w-full lg:w-auto font-black" onClick={() => handleOpenModal(hotel)}>
                    <Settings size={18} className="mr-2" /> Manage Node
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {demoLeads.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
              <Users size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No pending requests</p>
            </div>
          ) : demoLeads.map(lead => (
            <div key={lead.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-brand-navy"><UserIcon size={24} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-black text-brand-navy">{lead.fullName}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${lead.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><Building2 size={12}/> {lead.hotelName}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12}/> {lead.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <a href={`mailto:${lead.email}`} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-navy"><Mail size={18}/></a>
                 <a href={`tel:${lead.mobile}`} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-navy"><Phone size={18}/></a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INFRASTRUCTURE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 lg:p-10 bg-brand-navy/60 backdrop-blur-xl animate-fade-in overflow-y-auto no-scrollbar">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl my-auto animate-reveal overflow-hidden flex flex-col">
            <div className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-navy text-brand-accent rounded-2xl shadow-lg">
                  {editingHotel ? <Settings size={28} /> : <Zap size={28} fill="currentColor" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">{editingHotel ? `Node: ${editingHotel.id}` : 'Deploy Cluster'}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cluster Management Protocol</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-300 hover:text-rose-500"><X size={32} /></button>
            </div>

            <form onSubmit={handleSaveHotel} className="p-8 lg:p-10 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-brand-accent" />
                  <span className="text-[11px] font-black text-brand-navy uppercase tracking-widest">General Identity</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Input label="Entity Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Grand Vista Resort" required />
                  </div>
                  <div>
                    <Input label="Client ID" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="VIT001" disabled={!!editingHotel} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem]">
                  <Input label="Max Staff" type="number" value={formData.maxUsers} onChange={e => setFormData({...formData, maxUsers: Number(e.target.value)})} />
                  <Input label="Max Assets" type="number" value={formData.maxItems} onChange={e => setFormData({...formData, maxItems: Number(e.target.value)})} />
                </div>
              </div>

              {!editingHotel && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-brand-accent" />
                    <span className="text-[11px] font-black text-brand-navy uppercase tracking-widest">Cluster Administrator</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Admin Name" value={formData.adminFullName} onChange={e => setFormData({...formData, adminFullName: e.target.value})} required />
                    <Input label="Admin Email" type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required />
                    <Input label="Username" value={formData.adminUsername} onChange={e => setFormData({...formData, adminUsername: e.target.value})} required />
                    <Input label="Initial Key" type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} required />
                  </div>
                </div>
              )}

              {editingHotel && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound size={14} className="text-brand-accent" />
                    <span className="text-[11px] font-black text-brand-navy uppercase tracking-widest">Security Override</span>
                  </div>
                  <Input label="Force Update Admin Key" type="password" placeholder="Leave blank to keep" value={formData.newResetPassword} onChange={e => setFormData({...formData, newResetPassword: e.target.value})} />
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem]">
                    <span className="text-[11px] font-black text-brand-navy uppercase tracking-widest">Terminal Active</span>
                    <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${formData.isActive ? 'bg-brand-accent' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-9' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {formError && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-2xl flex items-center gap-3"><AlertCircle size={16}/> {formError}</div>}
              {successMsg && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black rounded-2xl flex items-center gap-3"><CheckCircle2 size={16}/> {successMsg}</div>}

              <div className="flex gap-4 pt-4">
                {editingHotel && <Button type="button" variant="ghost" className="!text-rose-500 !bg-rose-50" onClick={handleDeleteTenant} isLoading={isDeleting}><Trash2 size={18}/></Button>}
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-[2] !bg-brand-navy !text-brand-accent" isLoading={isSaving}><Save size={18} className="mr-2"/> Save Protocol</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};