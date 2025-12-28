
import React, { useState, useEffect, useCallback } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { InternalTransfer, InventoryItem, Department } from '../types';
import { Button } from '../components/Button';
import { ICONS } from '../constants';
import { Repeat, Plus, X, ArrowRightLeft, Search, CheckCircle, Package, Truck, User, ArrowDown, ArrowUp } from 'lucide-react';

export const Transfers: React.FC = () => {
  const { session } = useAuth();
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [depts, setDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('outgoing');
  
  const [showModal, setShowModal] = useState(false);
  const [targetDept, setTargetDept] = useState('');
  const [transferItems, setTransferItems] = useState<{ itemId: string; itemName: string; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    const [tData, iData, dData] = await Promise.all([
      store.getTransfers(session.user.clientId),
      store.getItems(session.user.clientId),
      store.getDepartments(session.user.clientId)
    ]);
    setTransfers(tData.sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt)));
    setItems(iData);
    setDepts(dData.filter(d => d !== session.user?.department));
    setLoading(false);
  }, [session.user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateTransfer = async () => {
    if (!session.user || !targetDept || transferItems.length === 0) return;
    setIsSaving(true);
    const transfer: InternalTransfer = {
      id: '',
      clientId: session.user.clientId,
      fromDept: session.user.department,
      toDept: targetDept,
      initiatedBy: session.user.fullName,
      initiatedAt: new Date().toISOString(),
      items: transferItems,
      status: 'PENDING'
    };
    await store.createTransfer(transfer);
    setShowModal(false);
    setTransferItems([]);
    setTargetDept('');
    setIsSaving(false);
    loadData();
  };

  const handleUpdateStatus = async (id: string, status: 'RECEIVED' | 'CANCELLED') => {
    if (!session.user) return;
    await store.updateTransferStatus(id, status, session.user.fullName);
    loadData();
  };

  const filteredTransfers = transfers.filter(t => 
    activeTab === 'incoming' ? t.toDept === session.user?.department : t.fromDept === session.user?.department
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Internal Transfers</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Inter-departmental stock movement tracking.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="!bg-brand-navy !text-brand-accent h-14 !px-8 shadow-xl">
          <Plus size={20} className="mr-2" /> New Movement
        </Button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button onClick={() => setActiveTab('outgoing')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'outgoing' ? 'border-brand-accent text-brand-navy' : 'border-transparent text-slate-400'}`}>
          <ArrowUp size={14} className="inline mr-2" /> Outgoing Flow
        </button>
        <button onClick={() => setActiveTab('incoming')} className={`pb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'incoming' ? 'border-brand-accent text-brand-navy' : 'border-transparent text-slate-400'}`}>
          <ArrowDown size={14} className="inline mr-2" /> Incoming Requests
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-24 bg-slate-50 animate-pulse rounded-[2.5rem]" />
        ) : filteredTransfers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <Repeat size={40} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No active movements in this pipeline</p>
          </div>
        ) : filteredTransfers.map(t => (
          <div key={t.id} className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6 group hover:shadow-2xl transition-all">
             <div className="flex items-center gap-6 flex-1 w-full">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shrink-0 ${t.status === 'PENDING' ? 'bg-amber-500' : t.status === 'RECEIVED' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                   {t.status === 'PENDING' ? <Truck size={24}/> : <CheckCircle size={24}/>}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-brand-navy truncate">Transfer #{t.id.split('-').pop()}</h3>
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${t.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{t.status}</span>
                   </div>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-1.5"><ArrowRightLeft size={12}/> {t.fromDept} → {t.toDept}</span>
                      <span className="flex items-center gap-1.5"><User size={12}/> {t.initiatedBy}</span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="flex-1 lg:flex-none">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Payload Size</p>
                  <p className="text-lg font-black text-brand-navy">{t.items.length} Items</p>
                </div>
                {activeTab === 'incoming' && t.status === 'PENDING' && (
                  <Button onClick={() => handleUpdateStatus(t.id, 'RECEIVED')} className="!bg-emerald-600 !text-white !rounded-2xl h-14 !px-8">Accept Stock</Button>
                )}
                {activeTab === 'outgoing' && t.status === 'PENDING' && (
                  <Button variant="ghost" onClick={() => handleUpdateStatus(t.id, 'CANCELLED')} className="!text-rose-500 !bg-rose-50 !rounded-2xl h-14 !px-8">Revoke</Button>
                )}
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-reveal flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-brand-navy text-brand-accent rounded-2xl shadow-lg"><Truck size={28}/></div>
                <div>
                  <h3 className="text-2xl font-black text-brand-navy tracking-tight">Internal Dispatch</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inter-Departmental Pipeline</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><X size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination Node</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5" value={targetDept} onChange={e => setTargetDept(e.target.value)}>
                  <option value="">Select Destination Department...</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input placeholder="Search SKU to Move..." className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl p-3 z-[160] border border-slate-100 max-h-60 overflow-y-auto">
                    {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(i => (
                      <button 
                        key={i.id} 
                        onClick={() => { setTransferItems([...transferItems, { itemId: i.id, itemName: i.name, quantity: 1 }]); setSearchTerm(''); }} 
                        className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-black text-brand-navy text-[11px] uppercase tracking-wider flex justify-between items-center"
                      >
                        {i.name} (Available: {i.currentStock})
                        <Plus size={14} className="text-brand-accent" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Payload</p>
                {transferItems.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 font-bold uppercase text-[9px] tracking-[0.2em]">Add items to movement</div>
                ) : transferItems.map(ti => (
                  <div key={ti.itemId} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <span className="font-black text-brand-navy text-xs uppercase tracking-tight">{ti.itemName}</span>
                    <div className="flex items-center gap-4">
                      <input type="number" value={ti.quantity} onChange={e => setTransferItems(prev => prev.map(p => p.itemId === ti.itemId ? { ...p, quantity: Number(e.target.value) } : p))} className="w-16 bg-slate-50 rounded-xl px-2 py-2 text-center font-black text-brand-navy outline-none" />
                      <button onClick={() => setTransferItems(prev => prev.filter(p => p.itemId !== ti.itemId))} className="text-rose-400"><X size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100">
              <Button onClick={handleCreateTransfer} disabled={!targetDept || transferItems.length === 0} isLoading={isSaving} className="w-full h-16 !bg-brand-navy !text-brand-accent !rounded-2xl shadow-xl !text-sm">Initiate Cluster Dispatch</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
