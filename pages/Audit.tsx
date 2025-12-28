
import React, { useState, useEffect, useCallback } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { InventoryItem, AuditRecord, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ClipboardCheck, History, Plus, X, Search, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

export const Audit: React.FC = () => {
  const { session } = useAuth();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [auditLines, setAuditLines] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['All', ...new Set(items.map(i => i.category))];
  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    const [auditData, itemData] = await Promise.all([
      store.getAudits(session.user.clientId),
      store.getItems(session.user.clientId)
    ]);
    setAudits(auditData.sort((a, b) => b.auditDate.localeCompare(a.auditDate)));
    setItems(itemData);
    setLoading(false);
  }, [session.user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStartAudit = () => {
    const initialLines: Record<string, number> = {};
    items.forEach(i => initialLines[i.id] = i.currentStock);
    setAuditLines(initialLines);
    setShowModal(true);
  };

  const commitAudit = async () => {
    if (!session.user) return;
    setIsSaving(true);
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
    setIsSaving(false);
    loadData();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Physical Audit</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Stock reconciliation and variance reporting.</p>
        </div>
        <Button onClick={handleStartAudit} className="!bg-brand-navy !text-brand-accent h-14 !px-8 shadow-xl">
          <Plus size={20} className="mr-2" /> Start Audit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
             <div className="flex items-center gap-3 mb-6">
                <History className="text-brand-accent" size={24} />
                <h3 className="text-lg font-black text-brand-navy">Audit History</h3>
             </div>
             <div className="space-y-4">
                {audits.length === 0 ? (
                  <p className="text-xs font-bold text-slate-300 uppercase">No prior audits found</p>
                ) : audits.map(a => (
                  <div key={a.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.auditDate).toLocaleDateString()}</p>
                        <p className="text-sm font-black text-brand-navy mt-1">{a.category} Reconciliation</p>
                      </div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black uppercase">Sync'd</span>
                    </div>
                    <div className="mt-3 flex gap-4 text-[10px] font-black text-slate-400 uppercase">
                       <span>{a.items.length} SKUs</span>
                       <span className={a.items.reduce((acc, i) => acc + i.variance, 0) < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                         Variance: {a.items.reduce((acc, i) => acc + i.variance, 0)}
                       </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-brand-navy rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black tracking-tight mb-2">Inventory Integrity</h2>
              <p className="text-slate-400 text-sm max-w-lg">Perform regular physical counts to match system records and identify operational leaks or wastage.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Total Audits</p>
                  <p className="text-2xl font-black">{audits.length}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Last Variance</p>
                  <p className="text-2xl font-black">{audits[0]?.items.reduce((acc, i) => acc + i.variance, 0) || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-reveal">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-navy text-brand-accent rounded-2xl shadow-lg"><ClipboardCheck size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black text-brand-navy tracking-tight">Active Audit Session</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Reconciliation Mode Enabled</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><X size={32} /></button>
            </div>

            <div className="p-8 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
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

            <div className="flex-1 overflow-y-auto p-10 space-y-4 no-scrollbar">
              <div className="grid grid-cols-12 gap-4 px-6 mb-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <div className="col-span-6">SKU Information</div>
                <div className="col-span-2 text-center">System</div>
                <div className="col-span-2 text-center">Physical</div>
                <div className="col-span-2 text-center">Variance</div>
              </div>
              
              {filteredItems.map(item => {
                const actual = auditLines[item.id] ?? item.currentStock;
                const variance = actual - item.currentStock;
                return (
                  <div key={item.id} className="grid grid-cols-12 items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="col-span-6">
                      <p className="font-black text-brand-navy text-sm uppercase">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{item.category}</p>
                    </div>
                    <div className="col-span-2 text-center font-black text-slate-400">{item.currentStock}</div>
                    <div className="col-span-2">
                      <input 
                        type="number" 
                        value={actual} 
                        onChange={e => setAuditLines({ ...auditLines, [item.id]: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2 py-3 text-center font-black text-brand-navy focus:ring-4 focus:ring-brand-accent/5 outline-none"
                      />
                    </div>
                    <div className={`col-span-2 text-center font-black ${variance === 0 ? 'text-slate-300' : variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {variance > 0 ? `+${variance}` : variance}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">Discard Session</Button>
              <Button onClick={commitAudit} isLoading={isSaving} className="flex-[2] !bg-brand-navy !text-brand-accent shadow-xl">Commit & Adjust Ledger</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
