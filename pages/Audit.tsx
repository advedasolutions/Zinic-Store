import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { InventoryItem, AuditRecord, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FileSearch, History, Plus, X, Search, CheckCircle, AlertTriangle, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';

export const Audit: React.FC = () => {
  const { session } = useAuth();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [auditLines, setAuditLines] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = useMemo(() => {
    return session.user?.role === UserRole.SUPERADMIN || session.user?.role === UserRole.HOTEL_ADMIN;
  }, [session.user]);

  const canModify = useMemo(() => {
    return isAdmin || session.user?.permissions?.includes('audit:modify');
  }, [session.user, isAdmin]);

  const categories = useMemo(() => {
    return ['All', ...new Set(items.map(i => i.category))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);
  }, [activeCategory, items]);

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    try {
      const [auditData, itemData] = await Promise.all([
        store.getAudits(session.user.clientId),
        store.getItems(session.user.clientId)
      ]);
      setAudits(auditData.sort((a, b) => b.auditDate.localeCompare(a.auditDate)));
      setItems(itemData);
    } catch (err) {
      console.error("Failed to load audit data", err);
    } finally {
      setLoading(false);
    }
  }, [session.user]);

  useEffect(() => { 
    loadData(); 
    const unsubscribe = store.subscribe(loadData);
    return () => { unsubscribe(); };
  }, [loadData]);

  const handleStartAudit = () => {
    const initialLines: Record<string, number> = {};
    items.forEach(i => initialLines[i.id] = i.currentStock);
    setAuditLines(initialLines);
    setShowModal(true);
  };

  const commitAudit = async () => {
    if (!session.user || !canModify) return;
    setIsSaving(true);
    try {
      const auditItems = filteredItems.map(i => ({
        itemId: i.id,
        itemName: i.name,
        systemStock: i.currentStock,
        actualStock: auditLines[i.id] || 0,
        variance: (auditLines[i.id] || 0) - i.currentStock
      }));

      const audit: AuditRecord = {
        id: '',
        clientId: session.user.clientId,
        auditDate: new Date().toISOString(),
        auditorId: session.user.id,
        auditorName: session.user.fullName,
        category: activeCategory,
        items: auditItems,
        status: 'COMMITTED'
      };

      await store.createAudit(audit);
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert("Failed to commit audit record.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && audits.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 h-[60vh] text-brand-navy">
      <Loader2 size={40} className="animate-spin mb-4 text-brand-accent" />
      <p className="text-xs font-black uppercase tracking-widest">Opening Audit Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Physical Audit</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Stock reconciliation and variance reporting.</p>
        </div>
        {canModify && (
          <Button onClick={handleStartAudit} className="!bg-brand-navy !text-brand-accent h-14 !px-8 shadow-xl !rounded-2xl">
            <Plus size={20} className="mr-2" /> Start New Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
             <div className="flex items-center gap-3 mb-6">
                <FileSearch className="text-brand-accent" size={24} />
                <h3 className="text-lg font-black text-brand-navy">Registry History</h3>
             </div>
             <div className="space-y-4">
                {audits.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <History size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No prior sessions</p>
                  </div>
                ) : audits.map(a => (
                  <div key={a.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-brand-accent transition-all cursor-default">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.auditDate).toLocaleDateString()}</p>
                        <p className="text-sm font-black text-brand-navy mt-1 truncate max-w-[150px]">{a.category} Count</p>
                      </div>
                      <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black uppercase tracking-tighter">Verified</span>
                    </div>
                    <div className="mt-4 flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       <span>{a.items.length} SKUs</span>
                       <span className={a.items.reduce((acc, i) => acc + i.variance, 0) < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                         Var: {a.items.reduce((acc, i) => acc + i.variance, 0)}
                       </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-brand-navy rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-brand-accent text-[9px] font-black uppercase tracking-widest mb-6">
                <ShieldCheck size={12} /> Entity Integrity Guard
              </div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4">Stock Integrity</h2>
              <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium">
                Perform regular physical counts to match system records and identify operational leaks, wastage, or inventory shrinkages.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Total Cycles</p>
                  <p className="text-3xl font-black">{audits.length}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-3xl font-black">99.2%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-xl animate-fade-in overflow-y-auto no-scrollbar pt-10 md:pt-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-reveal my-auto">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-navy text-brand-accent rounded-2xl shadow-lg"><FileSearch size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black text-brand-navy tracking-tight">Active Audit Session</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Auditor: {session.user?.fullName}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><X size={32} /></button>
            </div>

            <div className="p-6 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-white">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-brand-navy text-brand-accent shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-4 no-scrollbar bg-white">
              <div className="grid grid-cols-12 gap-4 px-6 mb-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <div className="col-span-6">Asset Specification</div>
                <div className="col-span-2 text-center">Ledger</div>
                <div className="col-span-2 text-center">Physical</div>
                <div className="col-span-2 text-center">Delta</div>
              </div>
              
              {filteredItems.map(item => {
                const actual = auditLines[item.id] ?? item.currentStock;
                const variance = actual - item.currentStock;
                return (
                  <div key={item.id} className="grid grid-cols-12 items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:scale-[1.01]">
                    <div className="col-span-6">
                      <p className="font-black text-brand-navy text-sm uppercase truncate">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.category} • {item.unit}</p>
                    </div>
                    <div className="col-span-2 text-center font-black text-slate-400 text-lg">{item.currentStock}</div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        value={actual} 
                        onChange={e => setAuditLines({ ...auditLines, [item.id]: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-3 text-center font-black text-brand-navy focus:ring-4 focus:ring-brand-accent/5 outline-none shadow-sm"
                      />
                    </div>
                    <div className={`col-span-2 text-center font-black text-lg ${variance === 0 ? 'text-slate-300' : variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {variance > 0 ? `+${variance}` : variance}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4 shrink-0">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1 !rounded-2xl h-16">Discard Session</Button>
              <Button onClick={commitAudit} isLoading={isSaving} className="flex-[2] !bg-brand-navy !text-brand-accent shadow-xl !rounded-2xl h-16 !font-black !uppercase !tracking-widest">
                Confirm & Sync Cluster Ledger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
