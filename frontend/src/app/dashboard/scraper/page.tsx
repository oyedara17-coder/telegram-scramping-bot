'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Send, Users, ShieldCheck, Zap, MessageSquare, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';


export default function ScraperPage() {
  const [groupId, setGroupId] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Outreach State
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [outreachStatus, setOutreachStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/campaigns/templates`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates');
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword) return;
    setSearching(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/telegram/search_groups`);
      url.searchParams.append('keyword', searchKeyword);
      if (searchCountry) url.searchParams.append('country', searchCountry);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleScrape = async (overrideId?: string) => {
    const idToScrape = overrideId || groupId;
    if (!idToScrape) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/telegram/scrape_members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ group_id: idToScrape }),
      });
      const data = await response.json();
      setMembers(data);
      if (overrideId) setGroupId(overrideId);
    } catch (err) {
      alert('Scraping failed. Ensure the account is a member of the group.');
    } finally {
      setLoading(false);
    }
  };

  const startMassOutreach = async () => {
    if (members.length === 0) return;
    const finalMessage = selectedTemplate 
      ? templates.find(t => t.id === parseInt(selectedTemplate))?.content 
      : customMessage;
    
    if (!finalMessage) {
        alert('Please select a template or enter a custom message.');
        return;
    }

    setSending(true);
    setOutreachStatus('running');
    setSendProgress(0);

    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const target = member.username || member.id;
        
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/telegram/send-message`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    target_id: String(target),
                    message: finalMessage
                }),
            });
            
            setSendProgress(Math.round(((i + 1) / members.length) * 100));
            
            // Telegram safety: Wait between messages
            // Random delay between 30 and 60 seconds to comply with guild rules
            if (i < members.length - 1) {
                const delay = Math.floor(Math.random() * (60000 - 30000 + 1) + 30000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } catch (err) {
            console.error(`Failed to send to ${target}`);
        }
    }

    setSending(false);
    setOutreachStatus('completed');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">Member <span className="text-primary">Scraper</span></h1>
            <p className="text-muted-foreground font-medium mt-1">Extract high-quality nodes and initiate neural outreach protocols.</p>
          </div>
          <div className="flex gap-3">
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protocol Secured</span>
             </div>
             <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Delay: 30s-60s</span>
             </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Global Search Section */}
          <div className="glass-card p-8 rounded-[2rem] space-y-6 relative overflow-hidden group border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic leading-none">Global Group Search</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Niche (e.g. Real Estate)"
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <select
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs uppercase"
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                >
                  <option value="">Global Network</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                  <option value="India">India</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Russia">Russia</option>
                  <option value="Dubai">Dubai (UAE)</option>
                </select>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={searching || !searchKeyword}
                className="w-full py-4 bg-primary text-white font-black rounded-xl hover:shadow-lg transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
              >
                {searching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Detect Target Nodes <Zap className="w-4 h-4" /></>}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3 mt-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.map((group, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-2xl flex items-center justify-between group/item hover:border-primary/50 transition-all">
                    <div>
                      <p className="text-sm font-black text-foreground uppercase italic leading-none">{group.title}</p>
                      <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">@{group.username || group.id} • {group.participantsCount} Users</p>
                    </div>
                    <button 
                      onClick={() => handleScrape(group.username || group.id)}
                      className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="glass-card p-8 rounded-[2rem] space-y-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Terminal className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic leading-none">Direct Node Uplink</h2>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Group Username or ID"
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-border rounded-2xl outline-none focus:border-primary transition-all font-bold text-foreground"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />
              <button
                onClick={() => handleScrape()}
                disabled={loading || !groupId}
                className="w-full py-4 bg-foreground text-background font-black rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-3"
              >
                {loading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : <>Initialize Uplink <Zap className="w-4 h-4" /></>}
              </button>
            </div>
            
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <p className="text-[9px] text-amber-500/80 leading-relaxed font-bold uppercase italic tracking-widest">
                WARNING: DIRECT ACCESS REQUIRES PRE-ESTABLISHED AUTHENTICATION WITH THE TARGET NODE.
              </p>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results Table */}
          <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 dark:border-white/5 flex items-center justify-between">
                <h3 className="font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2 italic">
                    <Users className="w-4 h-4 text-primary" />
                    Extraction Stream
                </h3>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{members.length} nodes found</span>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-white/10 dark:border-white/5 sticky top-0 z-10">
                  <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4">Uplink</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 dark:divide-white/5">
                  {members.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-24 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto border border-border">
                            <Users className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Waiting for target Uplink...</p>
                      </td>
                    </tr>
                  ) : (
                    members.map((m: any, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group/row">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-xs font-black text-muted-foreground border border-border group-hover/row:border-primary/30 group-hover/row:text-primary transition-all">
                                    {(m.first_name?.[0] || 'A').toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground uppercase italic leading-none">{m.first_name || 'Anonymous'} {m.last_name || ''}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-50">ID: {m.id}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-primary font-black text-sm tracking-tight italic">
                            @{m.username || (m.phone ? `+${m.phone}` : 'HIDDEN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">Verified</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* Outreach Panel */}
          <div className="space-y-6">
            <div className={`glass-card p-8 rounded-[2rem] transition-all duration-500 ${members.length > 0 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 border border-white/10">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tighter italic leading-none">Mass Outreach</h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Uplink Commander</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Message Protocol</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs uppercase tracking-wider"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">MANUAL OVERRIDE</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {!selectedTemplate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Custom Payload</label>
                        <textarea
                            className="w-full h-36 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm resize-none"
                            placeholder="Construct manual transmission..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                        />
                    </div>
                )}

                {sending && (
                    <div className="space-y-3 py-4">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            <span className="animate-pulse">Transmitting Data...</span>
                            <span>{sendProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-500 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" 
                                style={{ width: `${sendProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-muted-foreground animate-spin" />
                           <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest italic">Safety delay active / Waiting for node sync...</p>
                        </div>
                    </div>
                )}

                {outreachStatus === 'completed' && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-500">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Uplink Success</p>
                            <p className="text-[9px] text-emerald-500/70 font-bold mt-0.5 uppercase italic">All nodes contacted / Protocol terminated.</p>
                        </div>
                    </div>
                )}

                <button
                  onClick={startMassOutreach}
                  disabled={sending || members.length === 0}
                  className="w-full py-5 bg-foreground text-background font-black rounded-2xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs border border-white/5"
                >
                  {sending ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                      <>
                        Initiate Outreach
                        <Send className="w-4 h-4" />
                      </>
                  )}
                </button>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-border group-hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest">Safety Compliance</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                      Neural rotation enabled. System enforces randomized delays (30s-60s) to bypass detection and preserve Uplink integrity.
                    </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

