
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { store } from '../services/mockStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserRole } from '../types';
import { Lock, Shield, CheckCircle2, AlertCircle, LogOut, Terminal, Activity, Server, Plus, Trash2, Building2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { session, logout } = useAuth();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{status: 'PASSED' | 'FAILED', message: string, time: string} | null>(null);

  const isHotelAdmin = session.user?.role === UserRole.HOTEL_ADMIN || session.user?.role === UserRole.SUPERADMIN;

  const loadDepartments = useCallback(async () => {
    if (!session.user || !isHotelAdmin) return;
    const depts = await store.getDepartments(session.user.clientId);
    setDepartments(depts);
  }, [session.user, isHotelAdmin]);

  useEffect(() => {
    loadDepartments();
    const unsubscribe = store.subscribe(loadDepartments);
    return () => { unsubscribe(); };
  }, [loadDepartments]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await store.changePassword(session.user!.id, formData.oldPassword, formData.newPassword);
      setSuccess('Password updated successfully.');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !session.user) return;
    setDeptLoading(true);
    try {
      await store.addDepartment(session.user.clientId, newDeptName.trim());
      setNewDeptName('');
    } catch (err) {
      console.error(err);
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (name: string) => {
    if (!session.user || !confirm(`Remove department "${name}"? This might affect existing staff records.`)) return;
    try {
      await store.deleteDepartment(session.user.clientId, name);
    } catch (err) {
      console.error(err);
    }
  };

  const runDiagnostics = async () => {
    setDiagLoading(true);
    setDiagResult(null);
    try {
      const isConnected = await store.checkConnection();
      setDiagResult({
        status: isConnected ? 'PASSED' : 'FAILED',
        message: isConnected 
          ? "Cloud connectivity confirmed" 
          : "Network connectivity issues detected",
        time: new Date().toLocaleTimeString()
      });
    } catch (e) {
      setDiagResult({
        status: 'FAILED',
        message: "Connectivity handshake failed",
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setDiagLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Account Core</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage security credentials and profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 text-center">
            <div className="w-24 h-24 bg-brand-navy text-brand-accent rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-2xl">
              {session.user?.fullName.charAt(0)}
            </div>
            <h3 className="text-xl font-black text-brand-navy">{session.user?.fullName}</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">@{session.user?.username}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Client</span>
                <span className="font-black text-brand-navy">{session.user?.clientId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Role</span>
                <span className="px-3 py-1 bg-brand-navy text-brand-accent rounded-xl font-black">{session.user?.role.replace('_', ' ')}</span>
              </div>
            </div>

            <Button variant="danger" className="w-full mt-10 !rounded-2xl" onClick={logout}>
              <LogOut size={16} /> Sign Out
            </Button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {isHotelAdmin && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-slate-50 text-brand-navy rounded-2xl"><Building2 size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy">Department Registry</h3>
                  <p className="text-sm text-slate-400 font-medium">Define and manage operational units.</p>
                </div>
              </div>
              
              <form onSubmit={handleAddDept} className="flex gap-4 mb-8">
                <Input 
                  placeholder="New Department Name..." 
                  value={newDeptName} 
                  onChange={e => setNewDeptName(e.target.value)}
                  className="!rounded-2xl flex-1"
                />
                <Button type="submit" isLoading={deptLoading} className="!bg-brand-navy !text-brand-accent h-14 !rounded-2xl shadow-lg">
                  <Plus size={20} />
                </Button>
              </form>

              <div className="flex flex-wrap gap-3">
                {departments.map(dept => (
                  <div key={dept} className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 group hover:border-brand-accent transition-all">
                    <span className="text-[11px] font-black text-brand-navy uppercase tracking-widest">{dept}</span>
                    <button 
                      onClick={() => handleDeleteDept(dept)}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-slate-50 text-brand-navy rounded-2xl"><Shield size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-brand-navy">Security Credentials</h3>
                <p className="text-sm text-slate-400 font-medium">Reset your system access keys.</p>
              </div>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <Input label="Current Password" type="password" placeholder="••••••••" className="!rounded-2xl !py-4" value={formData.oldPassword} onChange={e => setFormData({...formData, oldPassword: e.target.value})} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="New Password" type="password" placeholder="••••••••" className="!rounded-2xl !py-4" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} required />
                <Input label="Confirm New Password" type="password" placeholder="••••••••" className="!rounded-2xl !py-4" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
              </div>
              {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl flex items-center gap-3 animate-shake"><AlertCircle size={20} />{error}</div>}
              {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-black rounded-2xl flex items-center gap-3"><CheckCircle2 size={20} />{success}</div>}
              <Button type="submit" className="w-full !rounded-2xl !bg-brand-navy !text-white h-16" isLoading={loading}>Update Account Access</Button>
            </form>
          </div>

          {isHotelAdmin && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-slate-50 text-brand-navy rounded-2xl"><Terminal size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy">Connectivity Diagnostic</h3>
                  <p className="text-sm text-slate-500 font-medium">Verify live synchronization status.</p>
                </div>
              </div>
              
              <div className="p-8 bg-slate-50 rounded-[2rem] mb-6 relative overflow-hidden border border-slate-100 flex flex-col items-center justify-center text-center">
                 <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.2em] text-xs">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                    Connection Active
                 </div>
                 {diagResult && (
                   <div className="mt-8 pt-8 border-t border-slate-200 w-full animate-slide-up">
                      <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl ${diagResult.status === 'PASSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <span className="text-sm font-black uppercase tracking-wider">{diagResult.message}</span>
                      </div>
                   </div>
                 )}
              </div>

              <Button 
                onClick={runDiagnostics} 
                className="w-full !rounded-2xl !bg-brand-navy !text-brand-accent shadow-xl h-16" 
                isLoading={diagLoading}
              >
                <Server size={18} className="mr-2" />
                Perform Handshake Test
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
