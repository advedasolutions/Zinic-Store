
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { StockRequest, RequestStatus, InventoryItem, Department, UserRole } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  CheckCircle, 
  XCircle, 
  PackageCheck, 
  ClipboardList, 
  Clock, 
  Search, 
  ChevronRight,
  User as UserIcon,
  Plus,
  X,
  ShoppingCart,
  Trash2,
  AlertCircle,
  Hash,
  ArrowRight,
  Zap,
  RotateCw,
  Gauge,
  NotebookPen,
  History,
  Minus,
  Truck
} from 'lucide-react';

export const Requests: React.FC = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [activeTab, setActiveTab] = useState<RequestStatus | 'ALL'>('ALL');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestItems, setRequestItems] = useState<{ itemId: string; itemName: string; quantity: number; unit: string }[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumingItem, setConsumingItem] = useState<{ itemId: string; itemName: string; max: number } | null>(null);
  const [consumeAmount, setConsumeAmount] = useState('1');
  const [consumeNote, setConsumeNote] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const canApprove = useMemo(() => {
    if (!session.user) return false;
    const role = session.user.role;
    const perms = session.user.permissions || [];
    // Fix: Updated to check for granular requests:modify permission instead of legacy string
    return role === UserRole.SUPERADMIN || 
           role === UserRole.HOTEL_ADMIN || 
           perms.includes('requests:modify');
  }, [session.user]);
                     
  const canConsume = useMemo(() => {
    if (!session.user) return false;
    const role = session.user.role;
    const perms = session.user.permissions || [];
    // Fix: Updated to check for granular requests:modify permission for consumption
    return role === UserRole.SUPERADMIN || 
           role === UserRole.HOTEL_ADMIN || 
           perms.includes('requests:modify');
  }, [session.user]);

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    try {
      const [reqData, invData] = await Promise.all([
        store.getRequests(session.user.clientId),
        store.getItems(session.user.clientId)
      ]);
      setRequests(reqData);
      setInventory(invData);
      
      if (selectedRequest) {
        const updated = reqData.find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [session.user, selectedRequest]);

  useEffect(() => {
    loadData();
    const unsubscribe = store.subscribe(loadData);
    return () => { unsubscribe(); };
  }, [loadData]);

  const handleStatusUpdate = async (reqId: string, status: RequestStatus) => {
    setErrorMsg('');
    try {
      await store.updateRequestStatus(reqId, status);
      await loadData();
    } catch (err: any) { setErrorMsg(err.message); }
  };

  const confirmConsumption = async () => {
    if (!session.user || !selectedRequest || !consumingItem) return;
    const amount = parseInt(consumeAmount);
    if (isNaN(amount) || amount <= 0 || amount > consumingItem.max) { alert("Invalid quantity"); return; }
    
    try {
      setIsSubmitting(true);
      await store.consumeRequestItem(selectedRequest.id, consumingItem.itemId, amount, session.user.id, consumeNote, session.user.fullName);
      setShowConsumeModal(false);
      setConsumeNote('');
      setConsumeAmount('1');
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const submitRequest = async () => {
    if (requestItems.length === 0 || !session.user) return;
    setIsSubmitting(true);
    try {
      const newRequest: StockRequest = {
        id: '', clientId: session.user.clientId, requesterId: session.user.id, requesterName: session.user.fullName,
        department: session.user.department, items: requestItems.map(ri => ({ ...ri, consumedQuantity: 0 })),
        status: RequestStatus.PENDING, requestedAt: new Date().toISOString()
      };
      await store.createRequest(newRequest);
      setShowCreateModal(false);
      setRequestItems([]);
      await loadData();
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const getStatusConfig = (status: RequestStatus) => {
    const configs = {
      [RequestStatus.PENDING]: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending Approval" },
      [RequestStatus.APPROVED]: { bg: "bg-sky-100", text: "text-sky-700", label: "Approved" },
      [RequestStatus.REJECTED]: { bg: "bg-rose-100", text: "text-rose-700", label: "Rejected" },
      [RequestStatus.TRANSFERRED]: { bg: "bg-emerald-100", text: "text-emerald-700", label: "In Dept Store" },
      [RequestStatus.CONSUMED]: { bg: "bg-slate-900", text: "text-brand-accent", label: "Fully Consumed" },
    };
    return configs[status] || configs[RequestStatus.PENDING];
  };

  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'ALL' || req.status === activeTab;
    const isOwner = req.requesterId === session.user?.id;
    const isApprover = canApprove;
    return matchesTab && (isApprover || isOwner);
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-24 lg:pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-brand-navy tracking-tight">Supply Lifecycle</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Movement & Consumption Ledger</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="!bg-brand-navy !text-brand-accent h-14 px-6 !rounded-2xl">
            <Plus size={20} className="mr-2" /> New Requisition
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {['ALL', ...Object.values(RequestStatus)].map(s => (
            <button 
              key={s} 
              onClick={() => setActiveTab(s as any)} 
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === s ? 'bg-brand-navy text-brand-accent shadow-xl' : 'bg-white text-slate-400 border border-slate-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
              <ClipboardList size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Registry is empty for this filter</p>
            </div>
          ) : filteredRequests.map(req => (
            <div 
              key={req.id} 
              onClick={() => setSelectedRequest(req)} 
              className={`p-6 bg-white rounded-[2.5rem] border-2 transition-all cursor-pointer flex items-center gap-6 group ${
                selectedRequest?.id === req.id ? 'border-brand-accent shadow-2xl scale-[1.01]' : 'border-transparent shadow-xl hover:bg-slate-50/50'
              }`}
            >
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${getStatusConfig(req.status).bg} ${getStatusConfig(req.status).text}`}>
                  {req.status === RequestStatus.PENDING ? <Clock size={24}/> : <PackageCheck size={24}/>}
               </div>
               <div className="flex-1 overflow-hidden">
                 <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-brand-navy truncate">Order #{req.id.split('-').pop()}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusConfig(req.status).bg} ${getStatusConfig(req.status).text}`}>
                      {getStatusConfig(req.status).label}
                    </span>
                 </div>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{req.requesterName} • {req.department}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-navy group-hover:text-brand-accent transition-all">
                  <ChevronRight size={18} />
               </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5">
          {selectedRequest ? (
            <div className="bg-white rounded-[3rem] shadow-2xl p-8 lg:p-10 space-y-8 animate-fade-in border border-slate-100 sticky top-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">Transaction Card</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedRequest.id}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} className="text-slate-400" /></button>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <AlertCircle size={16}/> {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Allocation Profile</p>
                {selectedRequest.items.map((item, idx) => {
                  const progress = (item.consumedQuantity / item.quantity) * 100;
                  return (
                    <div key={idx} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-brand-navy text-sm uppercase">{item.itemName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Quantity: {item.quantity}</p>
                          </div>
                          {selectedRequest.status === RequestStatus.TRANSFERRED && canConsume && (
                            <button 
                              onClick={() => { setConsumingItem({ ...item, max: item.quantity - item.consumedQuantity }); setShowConsumeModal(true); }} 
                              disabled={item.consumedQuantity >= item.quantity} 
                              className="w-10 h-10 bg-brand-navy text-brand-accent rounded-xl flex items-center justify-center disabled:opacity-20 hover:scale-105 transition-all shadow-lg"
                            >
                              <NotebookPen size={18}/>
                            </button>
                          )}
                       </div>
                       
                       {selectedRequest.status === RequestStatus.TRANSFERRED && (
                         <div className="space-y-2">
                           <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-brand-navy transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                           </div>
                           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <span>Consumed</span>
                              <span className="text-brand-navy">{item.consumedQuantity} / {item.quantity} units</span>
                           </div>
                         </div>
                       )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-4">
                {selectedRequest.status === RequestStatus.PENDING && canApprove && (
                   <div className="grid grid-cols-2 gap-4">
                      <Button className="h-16 !bg-brand-navy !text-brand-accent shadow-xl" onClick={() => handleStatusUpdate(selectedRequest.id, RequestStatus.APPROVED)}>Authorize</Button>
                      <Button variant="danger" className="h-16 shadow-xl" onClick={() => handleStatusUpdate(selectedRequest.id, RequestStatus.REJECTED)}>Deny</Button>
                   </div>
                )}
                {selectedRequest.status === RequestStatus.APPROVED && canApprove && (
                   <div className="space-y-4">
                      <p className="text-center text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 py-3 rounded-2xl border border-amber-100 animate-pulse">Ready for Stock Handover</p>
                      <Button className="w-full h-16 !bg-emerald-600 !text-white shadow-xl" onClick={() => handleStatusUpdate(selectedRequest.id, RequestStatus.TRANSFERRED)}>
                        <Truck size={20} className="mr-2" /> Complete Transfer
                      </Button>
                   </div>
                )}
                {selectedRequest.status === RequestStatus.TRANSFERRED && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
                    <CheckCircle size={18}/>
                    <p className="text-[10px] font-black uppercase tracking-widest">Department has physical stock</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">
                   <span>Initiated: {new Date(selectedRequest.requestedAt).toLocaleDateString()}</span>
                   <span>Node: {session.user?.clientId}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3.5rem] bg-white/30 backdrop-blur-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <RotateCw size={32} className="text-slate-100" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select entry for workflow</p>
            </div>
          )}
        </div>
      </div>

      {showConsumeModal && consumingItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden p-10 animate-reveal">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-brand-navy tracking-tight">Log Consumption</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resource Handover Log</p>
                </div>
                <button onClick={() => setShowConsumeModal(false)} className="p-3 hover:bg-slate-50 rounded-2xl"><X size={24} className="text-slate-300"/></button>
              </div>
              <div className="space-y-8">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] text-center border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quantity Utilized</p>
                    <div className="flex items-center justify-center gap-6">
                      <button onClick={() => setConsumeAmount(prev => Math.max(1, parseInt(prev) - 1).toString())} className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-navy"><Minus size={20}/></button>
                      <input type="number" value={consumeAmount} onChange={e => setConsumeAmount(e.target.value)} className="text-5xl font-black text-brand-navy bg-transparent text-center w-24 outline-none" />
                      <button onClick={() => setConsumeAmount(prev => Math.min(consumingItem.max, parseInt(prev) + 1).toString())} className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-navy"><Plus size={20}/></button>
                    </div>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4">Remaining Limit: {consumingItem.max} units</p>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumption Narrative</label>
                   <textarea value={consumeNote} onChange={e => setConsumeNote(e.target.value)} className="w-full h-28 p-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-brand-accent/5 outline-none resize-none" placeholder="Explain usage (e.g. Daily prep, room refresh...)" />
                 </div>
                 <Button onClick={confirmConsumption} isLoading={isSubmitting} className="w-full h-16 !bg-brand-navy !text-brand-accent !rounded-2xl shadow-xl !text-sm">Authorize Log Entry</Button>
              </div>
           </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-reveal flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-navy text-brand-accent rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCart size={28}/></div>
                  <div>
                    <h3 className="text-2xl font-black text-brand-navy tracking-tight">Internal Requisition</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sourcing from Central Store</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={28} className="text-slate-300"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input placeholder="Search Central Inventory..." className="w-full pl-14 pr-6 py-5 bg-slate-50 rounded-2xl outline-none font-bold text-brand-navy focus:ring-4 focus:ring-brand-accent/5" value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                  {itemSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl p-3 z-[160] border border-slate-100 max-h-60 overflow-y-auto">
                      {inventory.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 ? (
                        <p className="p-4 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No assets found</p>
                      ) : inventory.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                        <button 
                          key={i.id} 
                          onClick={() => { setRequestItems([...requestItems, { itemId: i.id, itemName: i.name, quantity: 1, unit: i.unit }]); setItemSearch(''); }} 
                          className="w-full text-left p-4 hover:bg-slate-50 rounded-xl font-black text-brand-navy text-[11px] uppercase tracking-wider flex justify-between items-center group"
                        >
                          {i.name}
                          <Plus size={14} className="text-slate-300 group-hover:text-brand-accent" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Payload</p>
                  {requestItems.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 font-bold uppercase text-[9px] tracking-[0.2em]">Add items to requisition</div>
                  ) : requestItems.map(ri => (
                    <div key={ri.itemId} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div>
                        <span className="font-black text-brand-navy text-xs uppercase tracking-tight">{ri.itemName}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Unit: {ri.unit}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                          <button onClick={() => setRequestItems(prev => prev.map(p => p.itemId === ri.itemId ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-navy"><Minus size={14}/></button>
                          <input type="number" value={ri.quantity} onChange={e => setRequestItems(prev => prev.map(p => p.itemId === ri.itemId ? { ...p, quantity: Math.max(1, Number(e.target.value)) } : p))} className="w-12 bg-transparent text-center font-black text-brand-navy outline-none" />
                          <button onClick={() => setRequestItems(prev => prev.map(p => p.itemId === ri.itemId ? { ...p, quantity: p.quantity + 1 } : p))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-navy"><Plus size={14}/></button>
                        </div>
                        <button onClick={() => setRequestItems(prev => prev.filter(p => p.itemId !== ri.itemId))} className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-10 bg-slate-50/50 border-t border-slate-100">
                <Button onClick={submitRequest} disabled={requestItems.length === 0} isLoading={isSubmitting} className="w-full h-16 !bg-brand-navy !text-brand-accent !rounded-2xl shadow-xl !text-sm">
                  Commit Order to Store
                </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
