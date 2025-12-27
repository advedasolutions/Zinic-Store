
import React, { useEffect, useState, useCallback } from 'react';
import { store } from '../services/mockStore';
import { useAuth } from '../App';
import { User, UserRole, Department, UserPermission } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { X, UserPlus, Shield, User as UserIcon, Lock, Check, Building2, Briefcase, KeyRound, ChevronDown } from 'lucide-react';

const PERMISSIONS_LIST: { key: UserPermission; label: string; desc: string }[] = [
  { key: 'MANAGE_USERS', label: 'User Administration', desc: 'Manage staff accounts' },
  { key: 'APPROVE_REQUESTS', label: 'Request Approval', desc: 'Authorize stock requests' },
  { key: 'MANAGE_INVENTORY', label: 'Inventory Control', desc: 'Manage stock & catalog' },
  { key: 'MANAGE_CONSUMPTION', label: 'Request & Consumption', desc: 'Create orders & log usage' },
  { key: 'MANAGE_FINANCE', label: 'Vendor Financials', desc: 'Manage invoices & payments' }
];

export const Users: React.FC = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isPermDropdownOpen, setIsPermDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: UserRole.DEPT_USER,
    department: 'Admin' as Department,
    permissions: [] as UserPermission[],
    password: ''
  });

  const canManageUsers = session.user?.role === UserRole.SUPERADMIN || 
                         session.user?.role === UserRole.HOTEL_ADMIN || 
                         session.user?.permissions?.includes('MANAGE_USERS');

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
    setIsPermDropdownOpen(false);
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        permissions: user.permissions || [],
        password: '' 
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        role: UserRole.DEPT_USER,
        department: departments[0] || 'Admin',
        permissions: [], 
        password: '' 
      });
    }
    setShowModal(true);
  };

  const getDefaultPermissions = (role: UserRole): UserPermission[] => {
    switch (role) {
      case UserRole.HOTEL_ADMIN:
        return ['MANAGE_USERS', 'APPROVE_REQUESTS', 'MANAGE_INVENTORY', 'MANAGE_CONSUMPTION', 'MANAGE_FINANCE'];
      case UserRole.APPROVER:
        return ['APPROVE_REQUESTS'];
      case UserRole.DEPT_USER:
        return ['MANAGE_CONSUMPTION'];
      case UserRole.VIEWER:
      default:
        return [];
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: getDefaultPermissions(newRole)
    }));
  };

  const togglePermission = (perm: UserPermission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) 
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.user) return;
    setError('');
    try {
      const userData: User = {
        id: editingUser?.id || '',
        clientId: session.user.clientId,
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions,
        password: formData.password || editingUser?.password
      };
      await store.saveUser(userData);
      setShowModal(false);
      loadData();
    } catch (err: any) { setError(err.message); }
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
          <p className="text-slate-500 font-medium text-sm mt-1">Configure roles, departments, and financial access.</p>
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
                {(u.permissions || []).map(p => (
                  <span key={p} className="text-[8px] bg-slate-50 text-slate-500 px-2 py-1 rounded-lg border border-slate-100 uppercase font-bold tracking-wider">
                    {p.split('_').pop()?.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full !rounded-xl" onClick={() => handleOpenModal(u)} disabled={!canManageUsers}>Configure Access</Button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-brand-navy/60 backdrop-blur-md animate-fade-in">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl my-8 relative">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2.5rem]">
                <div>
                  <h2 className="text-2xl font-black text-brand-navy tracking-tight">{editingUser ? 'Edit Profile' : 'Onboard Staff'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Access Control & Identity</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-rose-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-8">
                <div className="space-y-6">
                  <Input label="Full Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="!rounded-2xl" placeholder="e.g. Sarah Jenkins" required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="System Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="!rounded-2xl" required />
                    {!editingUser && <Input label="Assign Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="!rounded-2xl" required />}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-navy uppercase tracking-widest">Functional Role</label>
                      <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-brand-navy" value={formData.role} onChange={e => handleRoleChange(e.target.value as UserRole)}>
                        {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN).map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-brand-navy uppercase tracking-widest">Department</label>
                      <select className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-brand-navy" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value as Department })}>
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 relative">
                   <label className="text-xs font-black text-brand-navy uppercase tracking-widest">Granular Capabilities</label>
                   <button type="button" onClick={() => setIsPermDropdownOpen(!isPermDropdownOpen)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-brand-navy font-bold">
                     <div className="flex flex-wrap gap-2">
                        {formData.permissions.length === 0 ? <span className="text-slate-400">Select Capabilities...</span> : formData.permissions.map(p => <span key={p} className="bg-brand-navy text-white px-2.5 py-1 rounded-lg text-[9px] font-black">{p.split('_').pop()}</span>)}
                     </div>
                     <ChevronDown size={18} className={`text-slate-400 transition-transform ${isPermDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isPermDropdownOpen && (
                     <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] max-h-60 overflow-y-auto">
                        {PERMISSIONS_LIST.map((perm) => (
                           <div key={perm.key} onClick={() => togglePermission(perm.key)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer mb-1 ${formData.permissions.includes(perm.key) ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                             <div>
                               <p className="text-xs font-black uppercase text-brand-navy">{perm.label}</p>
                               <p className="text-[9px] text-slate-400">{perm.desc}</p>
                             </div>
                             {formData.permissions.includes(perm.key) && <Check size={16} className="text-brand-accent" strokeWidth={3} />}
                           </div>
                        ))}
                     </div>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Discard</Button>
                  <Button type="submit" className="flex-1 !bg-brand-navy !text-white !rounded-2xl">Confirm Profile</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
