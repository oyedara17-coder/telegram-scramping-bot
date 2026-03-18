'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Globe, Users, Zap, ExternalLink } from 'lucide-react';


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
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/telegram/search_groups`);
      url.searchParams.append('keyword', k);
      if (c) url.searchParams.append('country', c);

      const response = await fetch(url.toString(), {
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


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 && !loading ? (
            <div className="col-span-full py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-40">
              Enter target keywords above to scan the matrix.
            </div>
          ) : (
            groups.map((group: any) => (
              <div key={group.id} className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
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
