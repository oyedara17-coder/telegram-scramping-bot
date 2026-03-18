'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Terminal, ShieldCheck, Clock, Activity, AlertCircle } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/admin/logs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-heading uppercase italic">
              System <span className="text-primary">Telemety</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Real-time audit trails and neural network activity logs.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Stream</span>
             </div>
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden bg-slate-950/40 backdrop-blur-2xl">
          <div className="p-6 bg-slate-950/80 border-b border-white/10 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
            <div className="flex items-center gap-2">
               <Terminal className="w-3.5 h-3.5 text-primary" />
               <span className="text-[10px] text-slate-500 font-mono tracking-[0.3em] uppercase font-black">STPZ_DEBUG_STREAM_V3</span>
            </div>
          </div>
          
          <div className="p-8 font-mono text-sm space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar bg-black/20">
            {loading ? (
               <div className="flex items-center gap-3 text-slate-500 italic animate-pulse">
                  <Clock className="w-4 h-4" />
                  <span>Synchronizing with global clusters...</span>
               </div>
            ) : logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
                  <AlertCircle className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] italic">No active telemetry detected.</p>
               </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex gap-4 group transition-colors hover:bg-white/5 p-2 rounded-lg border border-transparent hover:border-white/5">
                  <span className="text-slate-600 shrink-0 font-bold tabular-nums">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                  <span className={`font-black uppercase tracking-widest text-[10px] py-0.5 px-2 rounded-md ${
                    log.level === 'ERROR' ? 'bg-red-500/10 text-red-500' : 
                    log.level === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 
                    'bg-primary/10 text-primary'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-300 group-hover:text-white transition-colors break-words leading-relaxed">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 glass-card rounded-2xl border border-white/5 bg-primary/5">
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                 <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Privacy Protocol</h4>
                 <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
                    Telegram session data and credential hashes are NEVER logged. All displayed telemetry consists of high-level functional responses and network status updates to maintain node anonymity.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
