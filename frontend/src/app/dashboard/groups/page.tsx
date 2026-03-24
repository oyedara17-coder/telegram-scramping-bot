'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Globe, Users, Zap, ExternalLink } from 'lucide-react';


import { apiFetch } from '@/utils/api';

export default function GroupsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = () => fetchGroups(keyword, country);

  const fetchGroups = async (k: string, c: string) => {
    setLoading(true);
    try {
      const endpoint = `/api/telegram/search_groups?keyword=${encodeURIComponent(k)}${c ? `&country=${encodeURIComponent(c)}` : ''}&limit=5000`;
      const response = await apiFetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Search failed');
      }

      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.message === 'Unauthorized') return;
      console.error('Search error:', err);
      alert(err.message || 'Search failed. Ensure your Telegram account is connected.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
            Group <span className="text-primary">Finder</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Discover elite target clusters and niche communities across the network.</p>
        </div>


        <div className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-sm flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Niche (e.g. Real Estate)"
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs uppercase"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
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
            <option value="Australia">Australia</option>
            <option value="France">France</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="China">China</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="Mexico">Mexico</option>
            <option value="Indonesia">Indonesia</option>
            <option value="Turkey">Turkey</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Netherlands">Netherlands</option>
            <option value="Switzerland">Switzerland</option>
            <option value="Sweden">Sweden</option>
            <option value="Singapore">Singapore</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Kenya">Kenya</option>
            <option value="Egypt">Egypt</option>
            <option value="Ghana">Ghana</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all text-xs uppercase tracking-widest flex items-center justify-center min-w-[160px]"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>Explore Network</>
            )}
          </button>
        </div>


        <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
              Group <span className="text-primary">Finder</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Discover elite target clusters and niche communities across the network.</p>
          </div>
          {groups.length > 0 && (
            <span className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-xs font-black text-primary uppercase tracking-widest">
              {groups.length.toLocaleString()} Groups Found
            </span>
          )}
        </div>


        <div className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-sm flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Niche (e.g. Real Estate)"
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <select
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs uppercase"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
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
            <option value="Australia">Australia</option>
            <option value="France">France</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="China">China</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="Mexico">Mexico</option>
            <option value="Indonesia">Indonesia</option>
            <option value="Turkey">Turkey</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Netherlands">Netherlands</option>
            <option value="Switzerland">Switzerland</option>
            <option value="Sweden">Sweden</option>
            <option value="Singapore">Singapore</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Kenya">Kenya</option>
            <option value="Egypt">Egypt</option>
            <option value="Ghana">Ghana</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all text-xs uppercase tracking-widest flex items-center justify-center min-w-[160px]"
          >
            {loading ? (
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                 <span className="text-[10px] animate-pulse">Scanning...</span>
               </div>
            ) : (
              <>Explore Network</>
            )}
          </button>
        </div>


        {loading && (
          <div className="text-center py-4 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
            This may take a minute while we scan the network for groups...
          </div>
        )}

        {/* Scrollable results list — handles 5000+ groups without freezing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto pr-2">
          {groups.length === 0 && !loading ? (
            <div className="col-span-full py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-40">
              Enter target keywords above to scan the matrix.
            </div>
          ) : (
            groups.map((group: any) => (
              <div key={group.id} className="glass-card p-6 rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl font-black text-primary italic">
                    {group.title?.[0]}
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    {(group.participantsCount || 0).toLocaleString()} nodes
                  </span>
                </div>
                <h3 className="font-black text-foreground mb-1 text-base tracking-tight uppercase italic truncate">{group.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground mb-6 tracking-widest uppercase truncate opacity-60">@{group.username || 'private_link'}</p>
                <button 
                  onClick={() => router.push(`/dashboard/scraper?groupId=${group.username || group.id}`)}
                  className="w-full py-3 bg-slate-50 dark:bg-slate-900 text-foreground text-[10px] font-black rounded-xl hover:bg-primary hover:text-white border border-border hover:border-primary transition-all uppercase tracking-[0.2em]"
                >
                  Initiate Extraction
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
