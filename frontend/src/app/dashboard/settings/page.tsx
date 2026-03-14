'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/admin/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mock: 'data' }),
      });
      if (response.ok) alert('Settings updated successfully!');
    } catch (err) {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl animate-fade-in mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
              System <span className="text-primary">Settings</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Configure your API keys and notification preferences.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 rounded-[2rem] space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight italic">API Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">OpenAI API Key</label>
                <input type="password" placeholder="sk-..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Telegram API ID</label>
                <input type="text" placeholder="1234567" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black tracking-widest uppercase text-[10px] rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancel</button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-4 bg-primary text-primary-foreground font-black tracking-widest uppercase text-[10px] rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                 <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                 'Save Configuration'
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
