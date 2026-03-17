'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Send, MessageSquare, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function JoinedGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Messaging state
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/telegram/joined-groups`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !message.trim()) return;

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/telegram/send-message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          target_id: selectedGroup.id,
          message: message
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send message');
      }

      setSuccess(true);
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Joined <span className="text-primary">Groups</span></h1>
            <p className="text-muted-foreground font-medium mt-1">Directly interact with groups you've already joined.</p>
          </div>
          <button 
            onClick={fetchGroups}
            className="px-6 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl font-bold text-sm text-foreground hover:bg-slate-800 transition-all shadow-lg"
          >
            Refresh List
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3 animate-shake">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold uppercase tracking-wide">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Group List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="glass-card p-12 rounded-3xl text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Scanning account dialogs...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                    <Users className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No groups detected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group: any) => (
                  <div 
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                      selectedGroup?.id === group.id 
                      ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-primary/20' 
                      : 'bg-slate-900/40 border-white/5 hover:border-primary/30 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl transition-colors ${
                            selectedGroup?.id === group.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-950 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                            <Users className="w-6 h-6" />
                        </div>
                        {group.username && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">@{group.username}</span>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-foreground mt-4 truncate italic uppercase">{group.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-40">ID: {group.id}</p>
                    
                    <div className={`absolute bottom-4 right-4 transition-all ${
                        selectedGroup?.id === group.id ? 'opacity-100 scale-100' : 'opacity-0 translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                    }`}>
                        <Send className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Composer */}
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl sticky top-8">
              <h2 className="text-xl font-black text-foreground tracking-tighter flex items-center gap-2 uppercase italic leading-none">
                <MessageSquare className="w-5 h-5 text-primary" />
                Dispatch <span className="text-secondary">Center</span>
              </h2>
              
              {!selectedGroup ? (
                <div className="mt-8 py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <Info className="w-8 h-8 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-[10px] text-muted-foreground font-black px-6 uppercase tracking-[0.2em]">Select a node to start transmission</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-50">Target Uplink</p>
                    <p className="text-sm font-black text-foreground truncate italic">{selectedGroup.title}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Neural Message</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm font-medium text-foreground"
                      placeholder="Construct transmission payload..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {success && (
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 uppercase tracking-widest">
                        <CheckCircle2 className="w-5 h-5" />
                        Payload Delivered Successfully
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full py-5 bg-foreground text-background font-black rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
                  >
                    {sending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                            Transmitting...
                        </>
                    ) : (
                        <>
                            Initiate Broadcast
                            <Send className="w-4 h-4" />
                        </>
                    )}
                  </button>
                  
                  <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">
                    * Ensure the group allows member messages. Some channels may be read-only.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
