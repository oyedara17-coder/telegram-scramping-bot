'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldAlert, Users, Activity, ExternalLink, ShieldCheck, Zap, Key, Plus, Trash2, Power } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'nodes' | 'keywords'>('nodes');
  const [users, setUsers] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [keywordLoading, setKeywordLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchKeywords();
  }, []);


  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: number, status: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status }),
      });
      fetchUsers();
    } catch (err) {}
  };

  const fetchKeywords = async () => {
    try {
      setKeywordLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/keywords`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await response.json();
      setKeywords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setKeywordLoading(false);
    }
  };

  const addKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/keywords`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ keyword: newKeyword.trim(), is_active: true }),
      });
      setNewKeyword('');
      fetchKeywords();
    } catch (err) {}
  };

  const deleteKeyword = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/keywords/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchKeywords();
    } catch (err) {}
  };

  const toggleKeyword = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/keywords/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchKeywords();
    } catch (err) {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Admin Header - Unique Style */}
        <div className="relative group overflow-hidden glass-card p-8 rounded-[2rem]">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldAlert className="w-32 h-32 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Global Control Center</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Stepyzoid Studio Admin</h1>
              <p className="text-slate-500 mt-2 font-medium text-xs tracking-wide">Manage node access, monitor core telemetry, and override user statuses.</p>
            </div>
            <div className="flex gap-4">
               <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Nodes</span>
                  <span className="text-2xl font-black text-foreground leading-none">{users.length}</span>
               </div>
               <div className="px-6 py-4 bg-primary/10 border border-primary/20 rounded-2xl backdrop-blur-sm">
                  <span className="block text-primary/70 text-[10px] font-black uppercase tracking-widest mb-1">Threat Level</span>
                  <span className="text-2xl font-black text-primary tracking-tighter italic leading-none">OPTIMAL</span>
               </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex glass-card rounded-2xl p-1 gap-1 w-fit">
          <button 
            onClick={() => setActiveTab('nodes')}
            className={`px-8 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'nodes' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Node Directory
          </button>
          <button 
            onClick={() => setActiveTab('keywords')}
            className={`px-8 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'keywords' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            Detection Keywords
          </button>
        </div>

        {activeTab === 'nodes' && (
          <>
            <div className="flex items-center justify-between mt-8">
                <h2 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <Users className="w-3 h-3" />
                    Node Directory
                </h2>
                <div className="h-px flex-1 bg-white/5 mx-4" />
            </div>

            {/* User Management Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                 <div className="col-span-full py-20 text-center text-slate-500 font-mono animate-pulse uppercase text-xs tracking-[0.5em]">Scanning network for active nodes...</div>
              ) : users.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-500 font-mono uppercase text-xs tracking-widest">No nodes detected in current uplink.</div>
              ) : users.map((u: any) => (
                <div key={u.id} className="glass-card p-6 rounded-[2rem] hover:border-primary/50 transition-all group shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-all">
                      <Users className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-black text-foreground tracking-tighter truncate uppercase italic">{u.username}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest truncate">{u.email || 'NO EMAIL LINKED'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => updateStatus(u.id, 'active')}
                       className="py-2.5 bg-slate-950 text-slate-500 text-[10px] font-black rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 border border-white/5 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                     >
                       <ShieldCheck className="w-3 h-3" />
                       Online
                     </button>
                     <button 
                       onClick={() => updateStatus(u.id, 'paused')}
                       className="py-2.5 bg-slate-950 text-slate-500 text-[10px] font-black rounded-xl hover:bg-red-500/10 hover:text-red-500 border border-white/5 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                     >
                       <Zap className="w-3 h-3" />
                       Purge
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'keywords' && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mt-8 mb-6">
                <h2 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <Key className="w-3 h-3" />
                    Detection Keywords
                </h2>
                <div className="h-px flex-1 bg-white/5 mx-4" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <form onSubmit={addKeyword} className="glass-card p-6 rounded-[2rem] space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">New Trigger Keyword</label>
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="e.g. price, looking for, buy"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 text-foreground font-bold text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-white font-black rounded-xl hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Inject Global Trigger
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-white/10 dark:border-white/5">
                  <h3 className="font-black text-foreground uppercase tracking-widest text-xs">Active Global Triggers</h3>
                </div>
                <div className="divide-y divide-white/10 dark:divide-white/5">
                  {keywordLoading ? (
                    <div className="p-12 text-center text-slate-500 font-mono animate-pulse uppercase text-xs tracking-[0.5em]">Loading triggers...</div>
                  ) : keywords.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-mono uppercase text-xs tracking-widest">No triggers defined. Uplink monitoring is blind.</div>
                  ) : (
                    keywords.map((kw: any) => (
                      <div key={kw.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kw.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-950 border-white/10 text-slate-500'}`}>
                            <Key className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-foreground text-lg tracking-tighter italic uppercase">{kw.keyword}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-500">
                              Status: <span className={kw.is_active ? 'text-emerald-500' : 'text-slate-500'}>{kw.is_active ? 'ACTIVE TRACING' : 'DORMANT'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleKeyword(kw.id)}
                            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-500 transition-all"
                            title={kw.is_active ? "Disable Trigger" : "Enable Trigger"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteKeyword(kw.id)}
                            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-500 transition-all"
                            title="Purge Trigger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
