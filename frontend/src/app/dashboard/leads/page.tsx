'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Target, UserCheck, ShieldAlert, Clock, Activity } from 'lucide-react';


export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/telegram/leads`, { // Note: need to implement this endpoint
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      } else {
        // Fallback for demo
        setLeads([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
            Detected <span className="text-primary">Leads</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage high-intent users detected via intelligent network monitoring.</p>
        </div>


        <div className="glass-card rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/10 dark:border-white/5 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-5">Uplink Target</th>
                  <th className="px-6 py-5">Signal Source</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Detection Timestamp</th>
                  <th className="px-6 py-5 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-muted-foreground animate-pulse italic text-xs tracking-widest uppercase opacity-50">Scanning targets...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-50">Monitoring queue clear. No new signals.</td></tr>
                ) : (
                  leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-black text-foreground italic">{lead.username}</p>
                        <p className="text-[10px] text-primary/70 font-mono tracking-widest">ID: {lead.telegram_id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                          {lead.detection_keyword}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current shadow-sm ${
                          lead.status === 'new' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors">
                          Engage Node
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
