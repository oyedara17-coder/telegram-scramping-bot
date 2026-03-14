'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Globe, Users, Zap, ExternalLink } from 'lucide-react';


export default function GroupsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  const handleSearch = () => fetchGroups(keyword);

  const fetchGroups = async (k: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/telegram/search_groups?keyword=${k}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      setGroups(data);
    } catch (err) {
      alert('Search failed. Ensure your Telegram account is connected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
            Group <span className="text-primary">Finder</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Discover elite target clusters and niche communities across the network.</p>
        </div>


        <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="e.g. Crypto Traders, Marketing, London Real Estate"
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
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


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 && !loading ? (
            <div className="col-span-full py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-40">
              Enter target keywords above to scan the matrix.
            </div>
          ) : (
            groups.map((group: any) => (
              <div key={group.id} className="bg-card p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl font-black text-primary italic">
                    {group.title?.[0]}
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    {group.participantsCount} nodes
                  </span>
                </div>
                <h3 className="font-black text-foreground mb-1 text-lg tracking-tight uppercase italic">{group.title}</h3>
                <p className="text-[10px] font-bold text-muted-foreground mb-8 tracking-widest uppercase truncate opacity-60">@{group.username || 'private_link'}</p>
                <button 
                  onClick={() => router.push(`/dashboard/scraper?groupId=${group.username || group.id}`)}
                  className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-foreground text-[10px] font-black rounded-xl hover:bg-primary hover:text-white border border-border hover:border-primary transition-all uppercase tracking-[0.2em]"
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
