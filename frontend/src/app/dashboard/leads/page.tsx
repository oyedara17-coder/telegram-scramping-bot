'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Target, UserCheck, ShieldAlert, Clock, Activity, Search } from 'lucide-react';
import { apiFetch } from '@/utils/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await apiFetch('/api/telegram/leads');
      if (response.ok) {
        const data = await response.json().catch(() => []);
        setLeads(Array.isArray(data) ? data : []);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateDM = (username: string | null, telegramId: string | number) => {
    const target = username || String(telegramId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pending_dm_target', target);
      router.push('/dashboard/scraper');
    }
  };

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-heading uppercase italic">
              Target <span className="text-primary">Intelligence</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">High-intent leads harvested via automated group monitoring and scraping.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Leads Detected: {leads.length}</span>
             </div>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 border-b border-white/10 text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-8 py-6">Node Identity</th>
                  <th className="px-8 py-6">Signal Vector</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Detected At</th>
                  <th className="px-8 py-6 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Scanning lead matrix...</p>
                        </div>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-30">
                            <Activity className="w-16 h-16 text-slate-500" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">No active signals detected. Monitoring queue... </p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-all group border-b border-white/5 last:border-0 cursor-default">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-foreground italic uppercase tracking-tight">@{lead.username || 'PRIVATE_NODE'}</p>
                                <p className="text-[9px] text-slate-500 font-mono tracking-widest mt-1">UUID: {lead.telegram_id}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]">
                          {lead.detection_keyword || 'MANUAL_SCRAPE'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-current shadow-sm ${
                          lead.status === 'new' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[10px] text-slate-500 font-mono uppercase tracking-widest font-black italic">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right">
                        {/* Updated button with onClick handler */}
                        <button
                          onClick={() => handleInitiateDM(lead.username, lead.telegram_id)}
                          className="px-6 py-2.5 bg-slate-950 text-[10px] font-black text-slate-400 hover:text-white hover:bg-primary border border-white/10 hover:border-primary/50 rounded-xl uppercase tracking-widest transition-all shadow-xl"
                        >
                          Initiate DM
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
