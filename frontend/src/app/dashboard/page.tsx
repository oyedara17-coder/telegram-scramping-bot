'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Send, 
  Search, 
  Target, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
  MessageSquare,
  Megaphone
} from 'lucide-react';


export default function DashboardOverview() {
  const [stats, setStats] = useState({
    joined_groups: 0,
    active_campaigns: 0,
    total_leads: 0,
    messagesSent: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/telegram/stats`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats({
            ...stats,
            joined_groups: data.joined_groups,
            active_campaigns: data.active_campaigns,
            total_leads: data.total_leads,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    { name: 'Joined Groups', value: stats.joined_groups, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: 'Live nodes' },
    { name: 'Total Leads', value: stats.total_leads, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: 'Potential buyers' },
    { name: 'Messaging Groups', value: stats.active_campaigns, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'Active outreach' },
    { name: 'Campaigns Total', value: stats.active_campaigns, icon: Megaphone, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 'Orchestration active' },
  ];


  return (
    <DashboardLayout>
      <div className="space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-heading uppercase italic">
              System <span className="text-primary">Overview</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Real-time automation telemetry and performance metrics.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Anti-Ban Armed</span>
             </div>
             <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Global Delay: 60s+</span>
             </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {kpis.map((kpi, idx) => (
             <div key={idx} className="glass-card p-6 rounded-2xl hover:shadow-xl hover:shadow-cyan-900/20 hover:-translate-y-1 transition-all group overflow-hidden relative">
               <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                 <kpi.icon className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                 <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                   <kpi.icon className="w-6 h-6" />
                 </div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.name}</h3>
                 <div className="flex items-baseline gap-3 mt-1">
                   <p className="text-3xl font-black text-foreground font-heading leading-none italic">{kpi.value}</p>
                   <span className="text-[10px] font-bold text-emerald-500 uppercase">{kpi.trend}</span>
                 </div>
               </div>
             </div>
           ))}
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Activity Monitor */}
           <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-8 rounded-[2rem] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                         <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-lg font-black uppercase tracking-tight italic">Live Activity Stream</h2>
                   </div>
                   <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b-2 border-primary/20 hover:border-primary transition-all pb-1">Export Telemetry</button>
                </div>
                
                {/* Visual Chart Placeholder */}
                <div className="h-64 bg-black/20 rounded-2xl border border-white/10 border-dashed flex items-center justify-center relative group">
                   <TrendingUp className="w-12 h-12 text-slate-200 dark:text-slate-700 group-hover:scale-125 transition-transform" />
                   <p className="absolute bottom-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Real-time Throughput Graph</p>
                </div>
              </div>

              {/* Account Status Monitor */}
              <div className="glass-card p-8 rounded-[2rem]">
                <h2 className="text-lg font-black uppercase tracking-tight italic mb-8">Node Safety Monitor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-5 bg-black/20 rounded-2xl border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                         <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Risk Profile</p>
                         <p className="text-sm font-black text-emerald-600 uppercase">Minimal Threat</p>
                      </div>
                   </div>
                   <div className="p-5 bg-black/20 rounded-2xl border border-white/5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                         <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Flood Protection</p>
                         <p className="text-sm font-black text-primary uppercase">Auto-Detection active</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>

           {/* Sidebar Component (Secondary) */}
           <div className="space-y-6">
              {/* Daily Limits Card */}
              <div className="glass-card p-8 rounded-[2rem] border-l-4 border-l-primary">
                 <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest italic">Safety Protocol</h2>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Daily Send Limit</span>
                          <span>30 / 100</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full w-[30%] bg-primary rounded-full" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Group Join Limit</span>
                          <span>2 / 15</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full w-[15%] bg-blue-500 rounded-full" />
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary/70 font-medium leading-relaxed italic">
                       * "Warm-up Mode" is currently active for 2 accounts to prevent ban risk.
                    </p>
                 </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-8 rounded-[2rem]">
                 <h2 className="text-sm font-black uppercase tracking-widest italic mb-6">Commander Center</h2>
                 <div className="space-y-3">
                    <button className="w-full py-3.5 bg-primary text-white text-[10px] font-black rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                       <Megaphone className="w-4 h-4" />
                       New Campaign
                    </button>
                    <button className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-foreground text-[10px] font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                       <Search className="w-4 h-4 text-slate-400" />
                       Search Groups
                    </button>
                    <button className="w-full py-3.5 border border-border text-[10px] font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                       <MessageSquare className="w-4 h-4 text-slate-400" />
                       Open Templates
                    </button>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
