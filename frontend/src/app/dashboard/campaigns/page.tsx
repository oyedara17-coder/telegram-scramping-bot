'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Megaphone, Clock, Zap, Target, Activity } from 'lucide-react';


export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCampaigns();
    fetchTemplates();
    fetchGroups();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/campaigns/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {}
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/campaigns/templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setTemplates(data || []);
    } catch (err) {}
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/telegram/joined-groups`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setGroups(data || []);
    } catch (err) {}
  };

  const handleCreate = async () => {
    if (!name || !templateId) {
      alert('Please enter a name and select a template.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/campaigns/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name, 
          template_id: parseInt(templateId),
          group_id: groupId ? parseInt(groupId) : null,
          schedule_time: scheduleTime ? new Date(scheduleTime).toISOString() : null
        }),
      });
      if (response.ok) {
        setName('');
        setTemplateId('');
        setGroupId('');
        setScheduleTime('');
        fetchCampaigns();
      }
    } catch (err) {
      alert('Failed to create campaign');
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
            <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
              Messaging <span className="text-primary">Campaigns</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Automate your outreach with intelligent node rotation and safety protocols.</p>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Campaign */}
          <div className="glass-card p-8 rounded-[2rem] h-fit space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight italic">New Campaign</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Campaign ID Name</label>
                <input
                  type="text"
                  placeholder="e.g. ALPHA_OUTREACH_V1"
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-mono text-foreground"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Message Protocol</label>
                <select
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs uppercase tracking-wider text-foreground"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">Select Protocol</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Target Cluster (Optional)</label>
                <select
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs uppercase tracking-wider text-foreground"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">Global Broadcast</option>
                  {groups.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Execution Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs uppercase tracking-wider text-foreground"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-5 bg-foreground text-background font-black rounded-2xl hover:shadow-2xl hover:translate-y-[-2px] transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/5"
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                ) : (
                  <>Execute Campaign <Zap className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>


          {/* Campaigns List */}
          <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950 border-b border-white/5 text-[10px] text-muted-foreground uppercase font-black tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5">Protocol Identity</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Uplink Vitality</th>
                    <th className="px-6 py-5 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 dark:divide-white/5">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-50">
                        No active protocols. Initiate a new campaign.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group border-b border-white/5 last:border-0">
                        <td className="px-6 py-6">
                            <p className="font-black text-foreground italic uppercase leading-none">{c.name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-widest">NODE_ID: {c.id}</p>
                        </td>
                        <td className="px-6 py-6">
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current ${
                            c.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] border-emerald-500/20' : 
                            c.status === 'running' ? 'bg-primary/10 text-primary animate-pulse border-primary/20' : 
                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5 max-w-[120px]">
                                <div className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] ${c.status === 'completed' ? 'bg-emerald-500 w-full' : 'bg-primary w-[45%]'}`}></div>
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tabular-nums">{c.status === 'completed' ? '100%' : '45%'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <button className="px-4 py-2 text-[10px] font-black text-muted-foreground hover:text-red-500 uppercase tracking-widest transition-all bg-slate-900/50 hover:bg-red-500/10 rounded-lg border border-white/5 hover:border-red-500/20">
                            Terminate
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
      </div>
    </DashboardLayout>
  );
}
