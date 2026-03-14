'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Zap, Cpu, Users, Eye } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: number, status: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status }),
      });
      fetchUsers();
    } catch (err) {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Admin Header - Unique Style */}
        <div className="relative group overflow-hidden bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert className="w-32 h-32 text-red-500" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Global Control Center</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">System Console</h1>
              <p className="text-slate-400 mt-2 font-medium">Manage node access, monitor core telemetry, and override user statuses.</p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                  <span className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Active Nodes</span>
                  <span className="text-2xl font-black text-white">{users.length}</span>
               </div>
               <div className="px-6 py-4 bg-red-600/10 border border-red-600/20 rounded-2xl backdrop-blur-sm">
                  <span className="block text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1">Threat Level</span>
                  <span className="text-2xl font-black text-red-500 tracking-tighter italic">OPTIMAL</span>
               </div>
            </div>
          </div>
        </div>

        {/* User Management Grid - Different from Frontend Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full py-20 text-center text-slate-500 font-mono animate-pulse">Scanning network for active nodes...</div>
          ) : users.map((u: any) => (
            <div key={u.id} className="bg-slate-900 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group shadow-sm hover:shadow-red-900/10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-red-600/10 group-hover:border-red-600/30 transition-all">
                  <Users className="w-6 h-6 text-slate-400 group-hover:text-red-400" />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                  u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {u.status}
                </span>
              </div>
              
              <h3 className="text-xl font-black text-white tracking-tight truncate">{u.username.toUpperCase()}</h3>
              <p className="text-slate-500 text-xs font-mono mb-6 uppercase tracking-widest">ID: 0x00{u.id}</p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => updateStatus(u.id, 'active')}
                   className="py-2.5 bg-white/5 text-slate-400 text-xs font-black rounded-xl hover:bg-emerald-600/20 hover:text-emerald-400 transition-all uppercase tracking-widest"
                 >
                   Online
                 </button>
                 <button 
                   onClick={() => updateStatus(u.id, 'paused')}
                   className="py-2.5 bg-white/5 text-slate-400 text-xs font-black rounded-xl hover:bg-red-600/20 hover:text-red-400 transition-all uppercase tracking-widest"
                 >
                   Purge
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
