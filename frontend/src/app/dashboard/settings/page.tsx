'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldCheck, Command, Settings, Sliders, Bell, Database, Globe, Key, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/utils/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [openaiKey, setOpenaiKey] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [telegramHash, setTelegramHash] = useState('');

  useEffect(() => {
    setMounted(true);
    const fetchSettings = async () => {
      try {
        const response = await apiFetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setOpenaiKey(data.openai_api_key || '');
          setTelegramId(data.telegram_api_id || '');
          setTelegramHash(data.telegram_api_hash || '');
        }
      } catch (err) {
        console.error('Failed to fetch settings');
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          openai_api_key: openaiKey,
          telegram_api_id: telegramId,
          telegram_api_hash: telegramHash
        })
      });
      
      if (response.ok) {
        alert("System configuration updated! (Restart might be required)");
      } else {
        alert("Failed to update settings");
      }
    } catch (err) {
       alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-5xl animate-fade-in mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground font-heading uppercase italic">
              Global <span className="text-primary">Configuration</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">Calibrate neural parameters, API uplinks, and system-wide security protocols.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Section Tabs (Visual Only for now) */}
           <div className="space-y-3">
              {[
                { name: 'API Linkage', icon: Globe, active: true },
                { name: 'Safety Delays', icon: Sliders, active: false },
                { name: 'Neural Filters', icon: Command, active: false },
                { name: 'Alert Nodes', icon: Bell, active: false },
                { name: 'Data Security', icon: Database, active: false }
              ].map((tab, i) => (
                <button key={i} className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${tab.active ? 'bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/10' : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}`}>
                   <tab.icon className="w-5 h-5" />
                   <span className="text-xs font-black uppercase tracking-widest">{tab.name}</span>
                </button>
              ))}
           </div>

           <div className="lg:col-span-2 space-y-8">
              {/* API Configuration */}
              <div className="glass-card p-8 rounded-[2.5rem] space-y-8 border border-white/5 h-fit relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Key className="w-32 h-32" />
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    Neural Uplink Keys
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">OpenAI API Authorization</label>
                    <input 
                      type="password" 
                      placeholder="sk-neural-prot-..." 
                      className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl outline-none focus:border-primary/50 transition-all font-mono text-sm text-foreground shadow-inner" 
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Telegram System API ID</label>
                    <input 
                      type="text" 
                      placeholder="UPLINK_0987654" 
                      className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl outline-none focus:border-primary/50 transition-all font-mono text-sm text-foreground shadow-inner" 
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Telegram System API HASH</label>
                    <input 
                      type="password" 
                      placeholder="e9876..." 
                      className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl outline-none focus:border-primary/50 transition-all font-mono text-sm text-foreground shadow-inner" 
                      value={telegramHash}
                      onChange={(e) => setTelegramHash(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                   <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
                   <div>
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Warning: Secure Storage</p>
                       <p className="text-[11px] text-amber-500/70 leading-relaxed font-bold italic uppercase"> Keys are encrypted before being committed to the neural cluster. Ensure keys have "Global Write" permissions. </p>
                   </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-6 pt-4">
                <button className="px-10 py-4 bg-slate-950 text-slate-500 font-black tracking-[0.2em] uppercase text-[10px] rounded-2xl border border-white/5 hover:border-white/20 transition-all">Cancel Calibration</button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-10 py-4 bg-primary text-white font-black tracking-[0.2em] uppercase text-[10px] rounded-2xl hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl"
                >
                  {loading ? (
                     <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                     <>Apply Changes <Sliders className="w-4 h-4" /></>
                  )}
                </button>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
