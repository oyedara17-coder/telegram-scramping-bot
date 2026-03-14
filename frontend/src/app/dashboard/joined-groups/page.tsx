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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/telegram/joined-groups`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/telegram/send-message`, {
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
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Joined <span className="text-red-600">Groups</span></h1>
            <p className="text-gray-500 font-medium mt-1">Directly interact with groups you've already joined.</p>
          </div>
          <button 
            onClick={fetchGroups}
            className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
          >
            Refresh List
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Group List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Scanning account dialogs...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold">No groups detected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group: any) => (
                  <div 
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                      selectedGroup?.id === group.id 
                      ? 'bg-red-50 border-red-200 shadow-md ring-1 ring-red-500/10' 
                      : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl transition-colors ${
                            selectedGroup?.id === group.id ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-red-50 group-hover:text-red-500'
                        }`}>
                            <Users className="w-6 h-6" />
                        </div>
                        {group.username && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">@{group.username}</span>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mt-4 truncate">{group.title}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">ID: {group.id}</p>
                    
                    <div className={`absolute bottom-4 right-4 transition-all ${
                        selectedGroup?.id === group.id ? 'opacity-100' : 'opacity-0 translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                    }`}>
                        <Send className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Composer */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl sticky top-8">
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-600" />
                Dispatch <span className="text-red-600">Center</span>
              </h2>
              
              {!selectedGroup ? (
                <div className="mt-8 py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <Info className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm text-gray-400 font-bold px-6 uppercase tracking-wider">Select a group to start messaging</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Targeting</p>
                    <p className="text-sm font-black text-gray-900 truncate">{selectedGroup.title}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Your Message</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none text-sm font-medium"
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {success && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                        MESSAGE DISPATCHED SUCCESSFULLY
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                  >
                    {sending ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Transmitting...
                        </>
                    ) : (
                        <>
                            Send Message
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
