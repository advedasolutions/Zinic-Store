
import React, { useEffect, useState, useCallback } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { User, UserRole, Department, UserPermission } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { X, UserPlus, User as UserIcon, Building2, Eye, PlusSquare, ShieldCheck } from 'lucide-react';

type ModuleKey = 'inventory' | 'requests' | 'users' | 'vendors' | 'reports' | 'dashboard';
type RightLevel = 'VIEW' | 'ADD' | 'MODIFY';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  hasAdd: boolean;
  hasModify: boolean;
}

const MODULES_LIST: ModuleConfig[] = [
  { key: 'dashboard', label: 'Home/Analytics', hasAdd: false, hasModify: false },
  { key: 'inventory', label: 'Stock Catalog', hasAdd: true, hasModify: true },
  { key: 'requests', label: 'Orders (Requests)', hasAdd: true, hasModify: true },
  { key: 'reports', label: 'Reporting Hub', hasAdd: false, hasModify: false },
  { key: 'users', label: 'Team Directory', hasAdd: true, hasModify: true },
  { key: 'vendors', label: 'Vendor Finance', hasAdd: true, hasModify: true },
];

export const Users: React.FC = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: UserRole.DEPT_USER,
    department: 'Admin' as Department,
    moduleAccess: {} as Record<ModuleKey, RightLevel | null>,
    password: ''
  });

  const canManageUsers = session.user?.role === UserRole.SUPERADMIN || 
                         session.user?.role === UserRole.HOTEL_ADMIN || 
                         session.user?.permissions?.includes('users:modify');

  const loadData = useCallback(async () => {
    if (!session.user) return;
    setLoading(true);
    const [userData, deptData] = await Promise.all([
      store.getUsers(session.user.clientId),
      store.getDepartments(session.user.clientId)
    ]);
    setUsers(userData);
    setDepartments(deptData);
    setLoading(false);
  }, [session.user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenModal = (user: User | null = null) => {
    setError('');
    const initialAccess: Record<ModuleKey, RightLevel | null> = {
      dashboard: null, inventory: null, requests: null, reports: null, users: null, vendors: null
    };

    if (user) {
      setEditingUser(user);
      // Map permissions back to moduleAccess UI state
      MODULES_LIST.forEach(m => {
        if (user.permissions.includes(`${m.key}:modify` as UserPermission)) initialAccess[m.key] = 'MODIFY';
        else if (user.permissions.includes(`${m.key}:add` as UserPermission)) initialAccess[m.key] = 'ADD';
        else if (user.permissions.includes(`${m.key}:view` as UserPermission)) initialAccess[m.key] = 'VIEW';
      });

      setFormData({
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        moduleAccess: initialAccess,
        password: '' 
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        role: UserRole.DEPT_USER,
        department: departments[0] || 'Admin',
        moduleAccess: initialAccess,
        password: '' 
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user) return;
    setError('');

    // Convert moduleAccess state to flat permission array
    const permissions: UserPermission[] = [];
    Object.entries(formData.moduleAccess).forEach(([mod, level]) => {
      if (level) {
        permissions.push(`${mod}:view` as UserPermission);
        if (level === 'ADD' || level === 'MODIFY') permissions.push(`${mod}:add` as UserPermission);
        if (level === 'MODIFY') permissions.push(`${mod}:modify` as UserPermission);
      }
    });

    try {
      const userData: User = {
        id: editingUser?.id || '',
        clientId: session.user.clientId,
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        department: formData.department,
        permissions: permissions,
        password: formData.password || editingUser?.password
      };
      await store.saveUser(userData);
      setShowModal(false);
      loadData();
    } catch (err: any) { setError(err.message); }
  };

  const updateAccess = (key: ModuleKey, level: RightLevel | null) => {
    setFormData(prev => ({
      ...prev,
      moduleAccess: { ...prev.moduleAccess, [key]: level }
    }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-brand-navy">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-black uppercase tracking-widest">Accessing Team Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tight">Team Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Configure roles and granular module access.</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => handleOpenModal()} className="!bg-brand-navy !text-brand-accent shadow-xl !rounded-2xl h-14 px-6">
            <UserPlus size={20} /> <span className="ml-2">Register Staff</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-navy to-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-navy font-black text-xl shadow-inner">
                  {u.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-brand-navy text-lg leading-tight">{u.fullName}</h3>
                  <p className="text-xs font-bold text-slate-400">@{u.username}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === UserRole.HOTEL_ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-brand-50 text-brand-600'}`}>
                {u.role.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <Building2 size={16} className="text-slate-300" />
                <span>{u.department}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.permissions.filter(p => p.endsWith(':view')).map(p => (
                  <span key={p} className="text-[8px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 uppercase font-bold tracking-wider">
                    {p.split(':')[0]}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full !rounded-xl" onClick={() => handleOpenModal(u)} disabled={!canManageUsers}>Configure Access</Button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-brand-navy/60 backdrop-blur-md animate-fade-in no-scrollbar">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-8 relative">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2.5rem]">
                <div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">{editingUser ? 'Access Matrix' : 'Onboard Staff'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Identity & Rights Protocol</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-rose-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-8">
                <div className="space-y-6">
                  <Input label="Full Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="!rounded-2xl" required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="System Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="!rounded-2xl" required />
                    {!editingUser && <Input label="Assign Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="!rounded-2xl" required />}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Base Role</label>
                      <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-brand-navy text-xs" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                        {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN).map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Department</label>
                      <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-brand-navy text-xs" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value as Department })}>
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-brand-accent" />
                      <label className="text-[11px] font-black text-brand-navy uppercase tracking-widest">Module Access Matrix</label>
                   </div>
                   <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                      {MODULES_LIST.map((m) => {
                        const level = formData.moduleAccess[m.key];
                        return (
                          <div key={m.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                             <div className="flex items-center gap-3">
                                <button type="button" onClick={() => updateAccess(m.key, level ? null : 'VIEW')} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${level ? 'bg-brand-navy border-brand-navy text-brand-accent' : 'border-slate-200 bg-white'}`}>
                                   {level && <PlusSquare size={14} className="rotate-45" strokeWidth={3} />}
                                </button>
                                <span className={`text-[11px] font-black uppercase tracking-wider ${level ? 'text-brand-navy' : 'text-slate-300'}`}>{m.label}</span>
                             </div>
                             
                             {level && (
                               <div className="flex gap-2">
                                  <button type="button" onClick={() => updateAccess(m.key, 'VIEW')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${level === 'VIEW' ? 'bg-brand-navy text-brand-accent' : 'bg-slate-50 text-slate-400'}`}>View Only</button>
                                  {m.hasAdd && <button type="button" onClick={() => updateAccess(m.key, 'ADD')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${level === 'ADD' ? 'bg-brand-navy text-brand-accent' : 'bg-slate-50 text-slate-400'}`}>Can Add</button>}
                                  {m.hasModify && <button type="button" onClick={() => updateAccess(m.key, 'MODIFY')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${level === 'MODIFY' ? 'bg-brand-navy text-brand-accent' : 'bg-slate-50 text-slate-400'}`}>Full Access</button>}
                               </div>
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="secondary" className="flex-1 h-14" onClick={() => setShowModal(false)}>Discard</Button>
                  <Button type="submit" className="flex-1 !bg-brand-navy !text-brand-accent !rounded-2xl h-14">Confirm Matrix</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
