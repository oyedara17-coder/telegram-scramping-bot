'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/campaigns/templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setTemplates(data);
    } catch (err) {}
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/campaigns/templates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, content }),
      });
      if (response.ok) {
        setName('');
        setContent('');
        fetchTemplates();
      }
    } catch (err) {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
              Message <span className="text-primary">Templates</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Create and manage reusable message flows for your campaigns.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8 rounded-[2rem] space-y-5 h-fit">
             <h3 className="text-lg font-black uppercase tracking-tight italic">New Template</h3>
             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Template Identifier</label>
                 <input 
                   className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-mono text-sm text-foreground"
                   placeholder="e.g. WELCOME_SEQUENCE"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Neural Payload</label>
                 <textarea 
                   className="w-full h-48 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-sans text-sm resize-none text-foreground"
                   placeholder="Hi {first_name}, I saw you in {group}..."
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                 ></textarea>
               </div>
               <button onClick={handleCreate} disabled={loading} className="w-full py-5 bg-foreground text-background font-black rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 border border-white/5">
                 {loading ? (
                   <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                 ) : (
                   <>Save Protocol Template</>
                 )}
               </button>
             </div>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {templates.map((t: any) => (
              <div key={t.id} className="glass-card p-6 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all relative group cursor-pointer border-white/5">
                <h4 className="font-black text-foreground mb-2 truncate pr-12 text-sm uppercase italic">{t.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3 font-medium">"{t.content}"</p>
                <button className="absolute top-6 right-6 text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100">Delete</button>
              </div>
            ))}
            {templates.length === 0 && <div className="text-muted-foreground/50 italic py-20 text-center font-black uppercase text-xs tracking-widest flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-3xl border border-dashed border-border flex items-center justify-center text-border/50">
                  <span className="text-2xl">+</span>
              </div>
              No templates yet. Create your first one to the left.
            </div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
