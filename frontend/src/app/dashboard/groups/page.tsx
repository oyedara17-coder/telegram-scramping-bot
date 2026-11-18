'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch } from '@/utils/api';

type TelegramGroup = {
  id: number | string;
  title?: string;
  username?: string;
  participantsCount?: number;
};

const countries = [
  'United States', 'United Kingdom', 'Nigeria', 'Canada', 'Germany', 'India',
  'South Africa', 'Brazil', 'Russia', 'Dubai', 'Australia', 'France', 'Italy',
  'Spain', 'China', 'Japan', 'South Korea', 'Mexico', 'Indonesia', 'Turkey',
  'Saudi Arabia', 'Netherlands', 'Switzerland', 'Sweden', 'Singapore', 'Malaysia',
  'Vietnam', 'Kenya', 'Egypt', 'Ghana',
];

export default function GroupsPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = `/api/telegram/search_groups?keyword=${encodeURIComponent(keyword)}${country ? `&country=${encodeURIComponent(country)}` : ''}&limit=5000`;
      const response = await apiFetch(endpoint);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || 'Search failed.');
      setGroups(Array.isArray(body) ? body : []);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message !== 'Unauthorized') {
        setError(requestError.message || 'Search failed. Check your Telegram account connection.');
      }
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Group finder</h1>
            <p className="mt-1 text-sm text-slate-400">Discover Telegram groups that match your search.</p>
          </div>
          {groups.length > 0 && <span className="text-xs font-bold text-blue-300">{groups.length.toLocaleString()} groups found</span>}
        </header>

        <form onSubmit={handleSearch} className="glass-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Group keyword</span>
            <input required maxLength={120} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search by group topic" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" />
          </label>
          <label>
            <span className="sr-only">Country</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white sm:min-w-48">
              <option value="">All regions</option>
              {countries.map((item) => <option key={item} value={item}>{item === 'Dubai' ? 'Dubai (UAE)' : item}</option>)}
            </select>
          </label>
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-500 disabled:opacity-50">
            <Search className="size-4" />{loading ? 'Searching…' : 'Search groups'}
          </button>
        </form>

        {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200">{error}</p>}
        {loading && <p role="status" className="text-center text-xs text-blue-300">Searching Telegram for matching groups…</p>}
        {!loading && !error && groups.length === 0 && <div className="glass-card rounded-2xl px-5 py-14 text-center text-sm text-slate-400">Enter a topic to search for groups.</div>}

        {groups.length > 0 && <div className="grid max-h-[75vh] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => <article key={group.id} className="glass-card flex flex-col rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3"><h2 className="truncate text-lg font-bold text-white">{group.title || 'Untitled group'}</h2><span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-bold text-emerald-200">{(group.participantsCount || 0).toLocaleString()} members</span></div>
            <p className="mt-1 text-xs text-slate-500">{group.username ? `@${group.username}` : 'Private group'}</p>
            <button type="button" onClick={() => router.push(`/dashboard/scraper?groupId=${encodeURIComponent(String(group.username || group.id))}`)} className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-bold text-slate-200 transition-colors hover:border-blue-400/30 hover:text-white">Open scraper with this group</button>
          </article>)}
        </div>}
      </div>
    </DashboardLayout>
  );
}
