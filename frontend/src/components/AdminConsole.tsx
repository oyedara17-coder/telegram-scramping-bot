'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import {
  Activity, AlertTriangle, Bell, Check, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, KeyRound, LayoutDashboard, LoaderCircle, Megaphone, Plus, Search,
  Send, Settings2, Shield, ShieldCheck, Trash2, Users,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { apiFetch } from '@/utils/api';

type TabKey = 'overview' | 'users' | 'accounts' | 'campaigns' | 'leads' | 'intelligence' | 'monitoring' | 'alerts' | 'templates' | 'activity' | 'settings';
type UserRecord = { id: number; username: string; email?: string | null; phone?: string | null; role: string; status: string; created_at?: string | null };
type ListRecord = Record<string, any>;

const fetcher = async (url: string) => {
  const response = await apiFetch(url, { cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Unable to load this section.');
  return body;
};

async function sendRequest(url: string, method = 'GET', body?: unknown) {
  const response = await apiFetch(url, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || 'The action could not be completed.');
  return result;
}

const tabs: { key: TabKey; title: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', title: 'Overview', icon: LayoutDashboard },
  { key: 'users', title: 'Users', icon: Users },
  { key: 'accounts', title: 'Telegram', icon: Send },
  { key: 'campaigns', title: 'Campaigns', icon: Megaphone },
  { key: 'leads', title: 'Leads', icon: Activity },
  { key: 'intelligence', title: 'Lead intelligence', icon: ShieldCheck },
  { key: 'monitoring', title: 'Monitoring', icon: Search },
  { key: 'alerts', title: 'Alerts', icon: Bell },
  { key: 'templates', title: 'Templates', icon: KeyRound },
  { key: 'activity', title: 'Activity log', icon: Clock3 },
  { key: 'settings', title: 'Settings', icon: Settings2 },
];

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`glass-card rounded-2xl p-5 sm:p-6 ${className}`}>{children}</section>;
}

function SectionTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-400">{eyebrow}</p>
      <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function StateMessage({ loading, error, empty = false, label = 'No records found.' }: { loading?: boolean; error?: Error; empty?: boolean; label?: string }) {
  if (loading) return <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><LoaderCircle className="size-4 animate-spin" /> Loading current data…</div>;
  if (error) return <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-200"><AlertTriangle className="size-4 shrink-0" />{error.message}</div>;
  if (empty) return <div className="py-12 text-center text-sm text-slate-400">{label}</div>;
  return null;
}

function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (value: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs text-slate-400">
      <span>{total === 0 ? '0 records' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronLeft className="size-4" /></button>
        <span className="min-w-12 text-center">{page} / {pages}</span>
        <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-lg border border-white/10 p-2 disabled:opacity-30"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder = 'Search records' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{placeholder}</span>
      <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-400/50" />
    </label>
  );
}

function DataTable({ children, headings }: { children: ReactNode; headings: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead><tr className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-slate-500">{headings.map((heading) => <th key={heading} className="px-3 py-3 font-bold">{heading}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone = ['active', 'running', 'completed', 'resolved', 'read', 'contacted'].includes(value) ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : ['paused', 'pending', 'new'].includes(value) ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-slate-400/20 bg-slate-400/10 text-slate-300';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{value}</span>;
}

function EmptyAction({ children, onClick, disabled = false, danger = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-40 ${danger ? 'border-rose-400/20 text-rose-200 hover:bg-rose-400/10' : 'border-white/10 text-slate-300 hover:border-blue-400/30 hover:bg-white/5'}`}>{children}</button>;
}

function MetricCard({ label, value, hint, icon: Icon }: { label: string; value: number; hint: string; icon: typeof Users }) {
  return (
    <Panel className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-white">{value.toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div>
        <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-3 text-blue-300"><Icon className="size-5" /></div>
      </div>
    </Panel>
  );
}

function BarPanel({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Panel>
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      {data.length ? <div className="h-60 w-full" role="img" aria-label={`${title} bar chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.12)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#07111f', border: '1px solid rgba(148,163,184,.2)', borderRadius: 12, color: '#e2e8f0' }} cursor={{ fill: 'rgba(59,130,246,.08)' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <p className="py-12 text-center text-sm text-slate-500">No chart data yet.</p>}
    </Panel>
  );
}

export default function AdminConsole({ initialTab = 'overview' }: { initialTab?: TabKey }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<'checking' | 'authorized' | 'denied'>('checking');
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userSort, setUserSort] = useState<'created_at' | 'username' | 'email' | 'role' | 'status'>('created_at');
  const [userOrder, setUserOrder] = useState<'asc' | 'desc'>('desc');
  const [createOpen, setCreateOpen] = useState(false);
  const [draftUser, setDraftUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [draftTemplate, setDraftTemplate] = useState({ name: '', content: '' });
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [editTemplateDraft, setEditTemplateDraft] = useState({ name: '', content: '' });
  const [newKeyword, setNewKeyword] = useState('');
  const [delayDraft, setDelayDraft] = useState(60);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    let active = true;
    apiFetch('/api/users/me')
      .then(async (response) => {
        if (!response.ok) {
          if (active) setAuthState('denied');
          router.replace('/admin/login');
          return;
        }
        const user = await response.json();
        if (user.role !== 'admin' || user.status !== 'active') {
          if (active) setAuthState('denied');
          router.replace(user.status === 'active' ? '/dashboard' : '/admin/login');
          return;
        }
        if (active) setAuthState('authorized');
      })
      .catch(() => {
        if (active) setAuthState('denied');
        router.replace('/admin/login');
      });
    return () => { active = false; };
  }, [router]);

  const overviewKey = '/api/admin/overview';
  const userRoleFilter = ['user', 'admin'].includes(statusFilter) ? statusFilter : '';
  const userStatusFilter = ['active', 'paused'].includes(statusFilter) ? statusFilter : '';
  const usersKey = `/api/admin/users?search=${encodeURIComponent(search)}&status=${encodeURIComponent(userStatusFilter)}&role=${encodeURIComponent(userRoleFilter)}&sort=${userSort}&order=${userOrder}&page=${page}&page_size=10`;
  const accountsKey = `/api/admin/accounts?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}&page=${page}&page_size=10`;
  const campaignsKey = `/api/admin/campaigns?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}&page=${page}&page_size=10`;
  const leadsKey = `/api/admin/leads?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}&page=${page}&page_size=10`;
  const intelligenceKey = '/api/admin/lead-intelligence';
  const keywordsKey = '/api/keywords/';
  const alertsKey = `/api/admin/alerts?status=${encodeURIComponent(statusFilter)}&page=${page}&page_size=10`;
  const templatesKey = `/api/admin/templates?search=${encodeURIComponent(search)}&page=${page}&page_size=10`;
  const activityKey = `/api/admin/activity?search=${encodeURIComponent(search)}&level=${encodeURIComponent(statusFilter)}&page=${page}&page_size=20`;
  const settingsKey = '/api/admin/settings';

  const overview = useSWR(authState === 'authorized' && activeTab === 'overview' ? overviewKey : null, fetcher);
  const users = useSWR(authState === 'authorized' && activeTab === 'users' ? usersKey : null, fetcher);
  const userDetails = useSWR(authState === 'authorized' && activeTab === 'users' && selectedUser ? `/api/admin/users/${selectedUser}` : null, fetcher);
  const accounts = useSWR(authState === 'authorized' && activeTab === 'accounts' ? accountsKey : null, fetcher);
  const campaigns = useSWR(authState === 'authorized' && activeTab === 'campaigns' ? campaignsKey : null, fetcher);
  const leads = useSWR(authState === 'authorized' && activeTab === 'leads' ? leadsKey : null, fetcher);
  const intelligence = useSWR(authState === 'authorized' && activeTab === 'intelligence' ? intelligenceKey : null, fetcher);
  const keywords = useSWR(authState === 'authorized' && activeTab === 'monitoring' ? keywordsKey : null, fetcher);
  const alerts = useSWR(authState === 'authorized' && activeTab === 'alerts' ? alertsKey : null, fetcher);
  const templates = useSWR(authState === 'authorized' && activeTab === 'templates' ? templatesKey : null, fetcher);
  const activity = useSWR(authState === 'authorized' && activeTab === 'activity' ? activityKey : null, fetcher);
  const systemSettings = useSWR(authState === 'authorized' && activeTab === 'settings' ? settingsKey : null, fetcher);

  useEffect(() => {
    if (typeof systemSettings.data?.global_delay === 'number') setDelayDraft(systemSettings.data.global_delay);
  }, [systemSettings.data?.global_delay]);

  const refreshAdmin = async () => {
    await mutate((key) => typeof key === 'string' && (key.startsWith('/api/admin/') || key === '/api/keywords/'));
  };

  const act = async (key: string, task: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setActionError('');
    setNotice('');
    try {
      await task();
      setNotice(success);
      await refreshAdmin();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The action could not be completed.');
    } finally {
      setBusy('');
    }
  };

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    setSearch('');
    setStatusFilter('');
    setPage(1);
    setActionError('');
    setNotice('');
  };

  const sectionSearch = useMemo(() => ['users', 'accounts', 'campaigns', 'leads', 'templates', 'activity'].includes(activeTab), [activeTab]);
  const metricStats = overview.data?.stats;
  const pageToolbar = (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {sectionSearch && <SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder={`Search ${activeTab}`} />}
      <div className="flex items-center gap-2">
        {['users', 'accounts', 'campaigns', 'leads', 'alerts', 'activity'].includes(activeTab) && (
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs text-slate-200">
              <option value="">All statuses</option>
              {(activeTab === 'users' ? ['active', 'paused', 'user', 'admin'] : activeTab === 'accounts' ? ['active', 'paused', 'disabled'] : activeTab === 'campaigns' ? ['pending', 'running', 'paused', 'completed', 'terminated', 'failed'] : activeTab === 'leads' ? ['new', 'contacted', 'ignored'] : activeTab === 'alerts' ? ['pending', 'read', 'resolved'] : ['INFO', 'WARNING', 'ERROR']).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        )}
        {activeTab === 'users' && <>
          <label><span className="sr-only">Sort users by</span><select value={userSort} onChange={(event) => { setUserSort(event.target.value as typeof userSort); setPage(1); }} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs text-slate-200"><option value="created_at">Sort: joined</option><option value="username">Sort: username</option><option value="email">Sort: email</option><option value="role">Sort: role</option><option value="status">Sort: status</option></select></label>
          <EmptyAction onClick={() => { setUserOrder((value) => value === 'desc' ? 'asc' : 'desc'); setPage(1); }}>Order: {userOrder === 'desc' ? 'Newest' : 'Oldest'}</EmptyAction>
          <EmptyAction onClick={() => setCreateOpen((value) => !value)}><Plus className="size-3.5" /> Add user</EmptyAction>
        </>}
      </div>
    </div>
  );

  if (authState !== 'authorized') {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">{authState === 'checking' ? 'Verifying administrator access…' : 'Redirecting to secure sign-in…'}</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-blue-400/15 bg-[linear-gradient(120deg,rgba(12,26,47,.97),rgba(5,10,20,.95))] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-4 -top-8 opacity-[0.07]"><Shield className="size-40 text-blue-300" /></div>
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300"><span className="size-2 rounded-full bg-emerald-400" /> Administration</div><h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Control center</h1><p className="mt-2 max-w-xl text-sm text-slate-400">Manage platform users, connected Telegram accounts, campaigns, leads, and audit activity.</p></div>
          <div className="flex flex-wrap gap-2 text-xs"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-emerald-200"><ShieldCheck className="size-4" /> Protected admin session</span><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300"><CircleHelp className="size-4" /> Live database</span></div>
        </div>
      </div>

      {(notice || actionError) && <div role={actionError ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${actionError ? 'border-rose-400/25 bg-rose-400/5 text-rose-100' : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-100'}`}>{actionError ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}{actionError || notice}</div>}

      <div role="tablist" aria-label="Admin panel sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/45 p-2">
        {tabs.map(({ key, title, icon: Icon }) => <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => selectTab(key)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors sm:px-4 ${activeTab === key ? 'bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon className="size-4" />{title}</button>)}
      </div>

      <div role="tabpanel" aria-label={tabs.find((tab) => tab.key === activeTab)?.title}>
        {activeTab === 'overview' && <>
          <SectionTitle eyebrow="Platform analytics" title="System overview" detail="Current totals and distributions from the production database." />
          <StateMessage loading={overview.isLoading} error={overview.error} />
          {metricStats && <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Platform users" value={metricStats.users} hint={`${metricStats.active_users} currently active`} icon={Users} />
              <MetricCard label="Telegram accounts" value={metricStats.accounts} hint={`${metricStats.active_accounts} active links`} icon={Send} />
              <MetricCard label="Campaigns" value={metricStats.campaigns} hint={`${metricStats.active_campaigns} running now`} icon={Megaphone} />
              <MetricCard label="Leads" value={metricStats.leads} hint={`${metricStats.unread_alerts} pending alerts`} icon={Activity} />
            </div>
            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2"><BarPanel title="Campaign status distribution" data={overview.data.campaign_statuses} /><BarPanel title="Lead status distribution" data={overview.data.lead_statuses} /></div>
            <Panel><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold text-white">Recent platform activity</h3><button type="button" onClick={() => selectTab('activity')} className="text-xs font-bold text-blue-300 hover:text-blue-200">Open activity log</button></div>
              {overview.data.recent_activity.length ? <div className="divide-y divide-white/5">{overview.data.recent_activity.map((row: ListRecord) => <div key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="line-clamp-2 text-sm text-slate-200">{row.message}</span><span className="shrink-0 text-[11px] text-slate-500">{row.level} · {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</span></div>)}</div> : <StateMessage empty label="No recorded activity yet." />}</Panel>
          </>}
        </>}

        {activeTab === 'users' && <>
          <SectionTitle eyebrow="Access administration" title="User management" detail="Search accounts, update access, review activity, and revoke sessions." />{pageToolbar}
          {createOpen && <Panel className="mb-5"><form className="grid grid-cols-1 gap-3 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); act('create-user', () => sendRequest('/api/admin/users', 'POST', draftUser), 'User created.'); setDraftUser({ username: '', email: '', password: '', role: 'user' }); setCreateOpen(false); }}>
            <label className="text-xs text-slate-400">Username<input required minLength={2} maxLength={64} value={draftUser.username} onChange={(event) => setDraftUser({ ...draftUser, username: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-slate-400">Email<input type="email" value={draftUser.email} onChange={(event) => setDraftUser({ ...draftUser, email: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-slate-400">Temporary password<input type="password" required minLength={12} maxLength={72} value={draftUser.password} onChange={(event) => setDraftUser({ ...draftUser, password: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-slate-400">Role<select value={draftUser.role} onChange={(event) => setDraftUser({ ...draftUser, role: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"><option value="user">User</option><option value="admin">Administrator</option></select></label>
            <div className="flex items-end gap-2"><button disabled={busy === 'create-user'} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Create</button><button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Cancel</button></div>
          </form><p className="mt-3 text-xs text-slate-500">Passwords must be at least 12 characters. They are never returned by the API.</p></Panel>}
          <StateMessage loading={users.isLoading} error={users.error} empty={!users.isLoading && users.data?.items.length === 0} label="No users match these filters." />
          {users.data && users.data.items.length > 0 && <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]"><Panel className="min-w-0"><DataTable headings={['User', 'Role', 'Status', 'Joined', 'Actions']}>
            {users.data.items.map((user: UserRecord) => <tr key={user.id} className={`transition-colors hover:bg-white/[0.03] ${selectedUser === user.id ? 'bg-blue-400/[0.06]' : ''}`}>
              <td className="px-3 py-4"><button type="button" onClick={() => setSelectedUser(user.id)} className="block text-left font-bold text-white hover:text-blue-200">{user.username}</button><span className="text-xs text-slate-500">{user.email || user.phone || 'No contact address'}</span></td><td className="px-3 py-4"><StatusPill value={user.role} /></td><td className="px-3 py-4"><StatusPill value={user.status} /></td><td className="px-3 py-4 text-xs text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
              <td className="px-3 py-4"><div className="flex flex-wrap gap-1.5" onClick={(event) => event.stopPropagation()}><EmptyAction onClick={() => act(`user-${user.id}-status`, () => sendRequest(`/api/admin/users/${user.id}`, 'PATCH', { status: user.status === 'active' ? 'paused' : 'active' }), `User ${user.status === 'active' ? 'paused' : 'reactivated'}.`)}>{user.status === 'active' ? 'Pause' : 'Resume'}</EmptyAction><EmptyAction danger onClick={() => { if (window.confirm(`Delete ${user.username} and their owned records?`)) act(`user-${user.id}-delete`, () => sendRequest(`/api/admin/users/${user.id}`, 'DELETE'), 'User and owned records deleted.'); }}>Delete</EmptyAction></div></td>
            </tr>)}
          </DataTable><div className="mt-4"><Pager page={users.data.page} pageSize={users.data.page_size} total={users.data.total} onPage={setPage} /></div></Panel>
          <Panel className="h-fit"><h3 className="mb-4 text-sm font-bold text-white">{userDetails.data?.username || 'User profile'}</h3>{selectedUser && userDetails.data ? <>
            <div className="grid grid-cols-2 gap-2">{[['Role', userDetails.data.role], ['Status', userDetails.data.status], ['Accounts', userDetails.data.accounts_count], ['Campaigns', userDetails.data.campaigns_count], ['Leads', userDetails.data.leads_count], ['Templates', userDetails.data.templates_count]].map(([name, value]) => <div key={name} className="rounded-xl border border-white/5 bg-slate-950/40 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{name}</p><p className="mt-1 text-sm font-bold text-slate-200">{value}</p></div>)}</div>
            <div className="mt-4 flex flex-wrap gap-2"><EmptyAction onClick={() => act(`revoke-${selectedUser}`, () => sendRequest(`/api/admin/users/${selectedUser}/revoke-sessions`, 'POST'), 'All sessions revoked.')}>Revoke sessions</EmptyAction><EmptyAction onClick={() => { const password = window.prompt('Enter a new password with at least 12 characters.'); if (password) act(`reset-${selectedUser}`, () => sendRequest(`/api/admin/users/${selectedUser}/reset-password`, 'POST', { password }), 'Password reset; existing sessions revoked.'); }}>Reset password</EmptyAction><EmptyAction onClick={() => act(`role-${selectedUser}`, () => sendRequest(`/api/admin/users/${selectedUser}`, 'PATCH', { role: userDetails.data.role === 'admin' ? 'user' : 'admin' }), `Role updated.`)}>{userDetails.data.role === 'admin' ? 'Demote admin' : 'Promote to admin'}</EmptyAction></div>
            {userDetails.data.recent_activity?.length > 0 && <div className="mt-5 border-t border-white/5 pt-4"><p className="mb-2 text-xs font-bold text-slate-300">Recent user activity</p><div className="flex flex-col gap-2">{userDetails.data.recent_activity.slice(0, 4).map((row: ListRecord) => <p key={row.id} className="line-clamp-2 text-xs text-slate-500">{row.message}</p>)}</div></div>}
          </> : <p className="text-sm text-slate-500">Select a user to inspect profile details and session controls.</p>}</Panel></div>}
        </>}

        {activeTab === 'accounts' && <><SectionTitle eyebrow="Connected services" title="Telegram accounts" detail="Review account ownership and pause access without exposing session strings or API hashes." />{pageToolbar}<StateMessage loading={accounts.isLoading} error={accounts.error} empty={!accounts.isLoading && accounts.data?.items.length === 0} label="No Telegram accounts found." />{accounts.data?.items.length > 0 && <Panel><DataTable headings={['Account', 'Owner', 'Status', 'Actions']}>{accounts.data.items.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4 font-mono text-sm text-white">{row.phone}</td><td className="px-3 py-4 text-sm text-slate-300">{row.owner_username || 'Unassigned'}</td><td className="px-3 py-4"><StatusPill value={row.status} /></td><td className="px-3 py-4"><div className="flex gap-2"><EmptyAction onClick={() => act(`account-${row.id}`, () => sendRequest(`/api/admin/accounts/${row.id}`, 'PATCH', { status: row.status === 'active' ? 'paused' : 'active' }), `Account ${row.status === 'active' ? 'paused' : 'resumed'}.`)}>{row.status === 'active' ? 'Pause' : 'Resume'}</EmptyAction><EmptyAction danger onClick={() => { if (window.confirm(`Unlink Telegram account ${row.phone} from the platform?`)) act(`account-${row.id}-delete`, () => sendRequest(`/api/admin/accounts/${row.id}`, 'DELETE'), 'Account unlinked.'); }}>Unlink</EmptyAction></div></td></tr>)}</DataTable><div className="mt-4"><Pager page={accounts.data.page} pageSize={accounts.data.page_size} total={accounts.data.total} onPage={setPage} /></div></Panel>}</>}

        {activeTab === 'campaigns' && <><SectionTitle eyebrow="Delivery operations" title="Campaign management" detail="Inspect status and progress, pause or resume queued work, or terminate a running campaign." />{pageToolbar}<StateMessage loading={campaigns.isLoading} error={campaigns.error} empty={!campaigns.isLoading && campaigns.data?.items.length === 0} label="No campaigns match these filters." />{campaigns.data?.items.length > 0 && <Panel><DataTable headings={['Campaign', 'Owner', 'Status', 'Progress', 'Controls']}>{campaigns.data.items.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4 font-bold text-white">{row.name}</td><td className="px-3 py-4 text-slate-300">{row.owner_username || '—'}</td><td className="px-3 py-4"><StatusPill value={row.status} /></td><td className="px-3 py-4 text-slate-300">{row.processed_count} processed</td><td className="px-3 py-4"><div className="flex flex-wrap gap-2">{['running', 'pending', 'paused'].includes(row.status) && <EmptyAction danger onClick={() => act(`campaign-${row.id}-status`, () => sendRequest(`/api/admin/campaigns/${row.id}/status`, 'PATCH', { status: row.status === 'running' ? 'paused' : row.status === 'pending' ? 'terminated' : 'pending' }), row.status === 'running' ? 'Campaign pause requested.' : row.status === 'paused' ? 'Campaign queued to resume.' : 'Campaign terminated.')}>{row.status === 'running' ? 'Pause' : row.status === 'paused' ? 'Resume' : 'Terminate'}</EmptyAction>}{!['running', 'paused'].includes(row.status) && <EmptyAction danger onClick={() => { if (window.confirm(`Delete campaign ${row.name}?`)) act(`campaign-${row.id}-delete`, () => sendRequest(`/api/admin/campaigns/${row.id}`, 'DELETE'), 'Campaign deleted.'); }}><Trash2 className="size-3.5" /> Delete</EmptyAction>}</div></td></tr>)}</DataTable><div className="mt-4"><Pager page={campaigns.data.page} pageSize={campaigns.data.page_size} total={campaigns.data.total} onPage={setPage} /></div></Panel>}</>}

        {activeTab === 'leads' && <><SectionTitle eyebrow="Prospect records" title="Lead management" detail="Search detection records, update follow-up status, or remove a lead." />{pageToolbar}<StateMessage loading={leads.isLoading} error={leads.error} empty={!leads.isLoading && leads.data?.items.length === 0} label="No leads match these filters." />{leads.data?.items.length > 0 && <Panel><DataTable headings={['Prospect', 'Matched keyword', 'Owner', 'Message', 'Status', 'Actions']}>{leads.data.items.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4"><span className="font-bold text-white">{row.username || 'Unknown'}</span><span className="block text-xs text-slate-500">{row.telegram_id}</span></td><td className="px-3 py-4 text-slate-300">{row.detection_keyword || '—'}</td><td className="px-3 py-4 text-slate-300">{row.owner_username || '—'}</td><td className="max-w-64 px-3 py-4"><p className="line-clamp-2 text-xs text-slate-400">{row.message_content || 'No message content'}</p></td><td className="px-3 py-4"><select aria-label={`Lead status for ${row.username || row.id}`} value={row.status} onChange={(event) => act(`lead-${row.id}`, () => sendRequest(`/api/admin/leads/${row.id}`, 'PATCH', { status: event.target.value }), 'Lead status updated.')} className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-white">{['new', 'contacted', 'ignored'].map((value) => <option key={value}>{value}</option>)}</select></td><td className="px-3 py-4"><EmptyAction danger onClick={() => { if (window.confirm('Delete this lead?')) act(`lead-${row.id}-delete`, () => sendRequest(`/api/admin/leads/${row.id}`, 'DELETE'), 'Lead deleted.'); }}><Trash2 className="size-3.5" /> Delete</EmptyAction></td></tr>)}</DataTable><div className="mt-4"><Pager page={leads.data.page} pageSize={leads.data.page_size} total={leads.data.total} onPage={setPage} /></div></Panel>}</>}

        {activeTab === 'intelligence' && <><SectionTitle eyebrow="Scored from stored lead data" title="Lead intelligence" detail="A transparent heuristic ranks recent leads from stored keywords and message intent signals." /><StateMessage loading={intelligence.isLoading} error={intelligence.error} empty={!intelligence.isLoading && intelligence.data?.items.length === 0} label="Lead scoring will appear when monitored messages produce leads." />{intelligence.data?.items.length > 0 && <><Panel className="mb-4"><div className="flex flex-wrap items-center gap-6"><div><p className="text-xs uppercase tracking-wider text-slate-500">Leads scored</p><p className="mt-1 text-2xl font-black text-white">{intelligence.data.total_scored}</p></div><div><p className="text-xs uppercase tracking-wider text-slate-500">Average intent score</p><p className="mt-1 text-2xl font-black text-blue-300">{intelligence.data.average_score}/100</p></div><p className="max-w-lg text-xs leading-5 text-slate-400">Scores are derived from the detection keyword, message length, and explicit purchase-intent phrases. They are indicators, not a prediction.</p></div></Panel><Panel><DataTable headings={['Lead', 'Score', 'Intent signals', 'Message']}>{intelligence.data.items.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4 font-bold text-white">{row.username || row.telegram_id}</td><td className="px-3 py-4"><span className="rounded-lg bg-blue-400/10 px-2 py-1 font-black text-blue-200">{row.score}</span></td><td className="px-3 py-4 text-xs text-slate-300">{row.signals.length ? row.signals.join(', ') : row.detection_keyword || 'Keyword only'}</td><td className="max-w-xl px-3 py-4"><p className="line-clamp-2 text-xs text-slate-400">{row.message_content || 'No message content'}</p></td></tr>)}</DataTable></Panel></>}</>}

        {activeTab === 'monitoring' && <><SectionTitle eyebrow="Keyword triggers" title="Monitoring configuration" detail="Manage the existing global keyword rules used by the live Telegram monitor." /><Panel className="mb-4"><form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); const keyword = newKeyword.trim(); if (!keyword) return; act('keyword-add', () => sendRequest('/api/keywords/', 'POST', { keyword, is_active: true }), 'Keyword added.'); setNewKeyword(''); }}><label className="flex-1"><span className="sr-only">New monitoring keyword</span><input required maxLength={120} value={newKeyword} onChange={(event) => setNewKeyword(event.target.value)} placeholder="Add a keyword trigger" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" /></label><button disabled={busy === 'keyword-add'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"><Plus className="size-4" /> Add keyword</button></form></Panel><StateMessage loading={keywords.isLoading} error={keywords.error} empty={!keywords.isLoading && keywords.data?.length === 0} label="No monitoring keywords are configured." />{keywords.data?.length > 0 && <Panel><DataTable headings={['Keyword', 'Status', 'Actions']}>{keywords.data.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4 font-bold text-white">{row.keyword}</td><td className="px-3 py-4"><StatusPill value={row.is_active ? 'active' : 'paused'} /></td><td className="px-3 py-4"><div className="flex gap-2"><EmptyAction onClick={() => act(`keyword-${row.id}`, () => sendRequest(`/api/keywords/${row.id}/toggle`, 'PATCH'), `Keyword ${row.is_active ? 'paused' : 'activated'}.`)}>{row.is_active ? 'Pause' : 'Activate'}</EmptyAction><EmptyAction danger onClick={() => { if (window.confirm(`Delete keyword “${row.keyword}”?`)) act(`keyword-${row.id}-delete`, () => sendRequest(`/api/keywords/${row.id}`, 'DELETE'), 'Keyword deleted.'); }}><Trash2 className="size-3.5" /> Delete</EmptyAction></div></td></tr>)}</DataTable></Panel>}</>}

        {activeTab === 'alerts' && <><SectionTitle eyebrow="Operational notifications" title="Alerts" detail="Review persisted alert records and acknowledge or resolve them." />{pageToolbar}<StateMessage loading={alerts.isLoading} error={alerts.error} empty={!alerts.isLoading && alerts.data?.items.length === 0} label="There are no alerts for this filter." />{alerts.data?.items.length > 0 && <Panel><DataTable headings={['Type', 'Destination', 'Status', 'Created', 'Action']}>{alerts.data.items.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4 font-bold text-white">{row.type}</td><td className="px-3 py-4 text-slate-300">{row.destination}</td><td className="px-3 py-4"><StatusPill value={row.status} /></td><td className="px-3 py-4 text-xs text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td><td className="px-3 py-4"><div className="flex gap-2"><EmptyAction onClick={() => act(`alert-${row.id}`, () => sendRequest(`/api/admin/alerts/${row.id}`, 'PATCH', { status: row.status === 'resolved' ? 'pending' : 'resolved' }), 'Alert status updated.')}>{row.status === 'resolved' ? 'Reopen' : 'Resolve'}</EmptyAction><EmptyAction onClick={() => act(`alert-${row.id}-read`, () => sendRequest(`/api/admin/alerts/${row.id}`, 'PATCH', { status: 'read' }), 'Alert acknowledged.')}>Mark read</EmptyAction></div></td></tr>)}</DataTable><div className="mt-4"><Pager page={alerts.data.page} pageSize={alerts.data.page_size} total={alerts.data.total} onPage={setPage} /></div></Panel>}</>}

        {activeTab === 'templates' && <><SectionTitle eyebrow="Reusable copy" title="Template library" detail="Templates are stored in the existing database and can be edited or removed when not assigned to campaigns." /><Panel className="mb-4"><form className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_auto]" onSubmit={(event) => { event.preventDefault(); act('template-create', () => sendRequest('/api/admin/templates', 'POST', draftTemplate), 'Template created.'); setDraftTemplate({ name: '', content: '' }); }}><label className="text-xs text-slate-400">Template name<input required maxLength={120} value={draftTemplate.name} onChange={(event) => setDraftTemplate({ ...draftTemplate, name: event.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label><label className="text-xs text-slate-400">Message content<textarea required maxLength={10000} rows={2} value={draftTemplate.content} onChange={(event) => setDraftTemplate({ ...draftTemplate, content: event.target.value })} className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /></label><button className="self-end rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">Create template</button></form></Panel>{pageToolbar}<StateMessage loading={templates.isLoading} error={templates.error} empty={!templates.isLoading && templates.data?.items.length === 0} label="No templates found." />{templates.data?.items.length > 0 && <Panel><DataTable headings={['Template', 'Owner', 'Campaign usage', 'Actions']}>{templates.data.items.map((row: ListRecord) => <tr key={row.id}><td className="max-w-lg px-3 py-4"><span className="font-bold text-white">{row.name}</span><p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.content}</p></td><td className="px-3 py-4 text-slate-300">{row.owner_username || '—'}</td><td className="px-3 py-4 text-slate-300">{row.campaign_count}</td><td className="px-3 py-4"><div className="flex gap-2"><EmptyAction onClick={() => { if (editingTemplate === row.id) setEditingTemplate(null); else { setEditingTemplate(row.id); setEditTemplateDraft({ name: row.name, content: row.content }); } }}>Edit</EmptyAction><EmptyAction danger disabled={row.campaign_count > 0} onClick={() => { if (window.confirm(`Delete template “${row.name}”?`)) act(`template-${row.id}-delete`, () => sendRequest(`/api/admin/templates/${row.id}`, 'DELETE'), 'Template deleted.'); }}><Trash2 className="size-3.5" /> Delete</EmptyAction></div></td></tr>)}
            {editingTemplate !== null && <tr><td colSpan={4} className="px-3 py-4"><form className="grid gap-3 md:grid-cols-[1fr_2fr_auto]" onSubmit={(event) => { event.preventDefault(); act(`template-${editingTemplate}`, () => sendRequest(`/api/admin/templates/${editingTemplate}`, 'PATCH', editTemplateDraft), 'Template updated.'); setEditingTemplate(null); }}><input aria-label="Edit template name" value={editTemplateDraft.name} onChange={(event) => setEditTemplateDraft({ ...editTemplateDraft, name: event.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /><textarea aria-label="Edit template content" rows={2} value={editTemplateDraft.content} onChange={(event) => setEditTemplateDraft({ ...editTemplateDraft, content: event.target.value })} className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" /><div className="flex gap-2"><button className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Save</button><button type="button" onClick={() => setEditingTemplate(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Cancel</button></div></form></td></tr>}
          </DataTable><div className="mt-4"><Pager page={templates.data.page} pageSize={templates.data.page_size} total={templates.data.total} onPage={setPage} /></div></Panel>}</>}

        {activeTab === 'activity' && <><SectionTitle eyebrow="Audit trail" title="Activity log" detail="Search persisted user and admin actions. Passwords, session strings, and API credentials are not returned." />{pageToolbar}<StateMessage loading={activity.isLoading} error={activity.error} empty={!activity.isLoading && activity.data?.items.length === 0} label="No activity matches these filters." />{activity.data?.items.length > 0 && <Panel><DataTable headings={['Level', 'Actor', 'Activity', 'Time']}>{activity.data.items.map((row: ListRecord) => <tr key={row.id}><td className="px-3 py-4"><StatusPill value={row.level.toLowerCase()} /></td><td className="px-3 py-4 text-slate-300">{row.username || (row.user_id ? `User ${row.user_id}` : 'System')}</td><td className="max-w-2xl px-3 py-4 text-slate-200">{row.message}</td><td className="px-3 py-4 text-xs text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td></tr>)}</DataTable><div className="mt-4"><Pager page={activity.data.page} pageSize={activity.data.page_size} total={activity.data.total} onPage={setPage} /></div></Panel>}</>}

        {activeTab === 'settings' && <><SectionTitle eyebrow="Runtime configuration" title="Admin settings" detail="Only supported, non-secret settings are editable here. External credentials remain in server environment configuration." /><StateMessage loading={systemSettings.isLoading} error={systemSettings.error} />{systemSettings.data && <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]"><Panel><form className="max-w-xl" onSubmit={(event) => { event.preventDefault(); act('settings', () => sendRequest('/api/admin/settings', 'PUT', { global_delay: delayDraft }), 'Settings saved and active for subsequent campaign deliveries.'); }}><label className="block text-sm font-bold text-white" htmlFor="global-delay">Global campaign delay</label><p className="mb-3 mt-1 text-xs leading-5 text-slate-400">Base delay in seconds between recipients. The campaign runner applies a randomized interval from this value up to twice the value.</p><div className="flex flex-wrap items-center gap-3"><input id="global-delay" type="number" min={10} max={3600} required value={delayDraft} onChange={(event) => setDelayDraft(Number(event.target.value))} className="w-36 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white" /><span className="text-xs text-slate-500">10–3600 seconds</span><button disabled={busy === 'settings'} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Save setting</button></div></form></Panel><Panel><h3 className="mb-4 text-sm font-bold text-white">Server integrations</h3><div className="flex flex-col gap-3">{[['Telegram API', systemSettings.data.telegram_configured], ['OpenAI', systemSettings.data.openai_configured], ['Email delivery', systemSettings.data.sendgrid_configured], ['WhatsApp delivery', systemSettings.data.twilio_configured]].map(([label, configured]) => <div key={String(label)} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0"><span className="text-sm text-slate-300">{label}</span><StatusPill value={configured ? 'configured' : 'not configured'} /></div>)}</div><p className="mt-3 text-xs leading-5 text-slate-500">Configuration values and credentials are never included in API responses. Manage them in the backend deployment environment.</p></Panel></div>}</>}
      </div>
      {busy && <div className="sr-only" role="status" aria-live="polite">Applying changes</div>}
    </div>
  );
}
