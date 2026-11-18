'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getApiUrl } from '@/utils/api';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const credentials = new URLSearchParams({ username: username.trim(), password });
      const response = await fetch(`${getApiUrl()}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: credentials.toString(),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.role !== 'admin') {
        throw new Error(result.detail || 'Administrator access is required.');
      }
      localStorage.setItem('token', result.access_token);
      router.replace('/dashboard/admin');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a12] px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,.18),transparent_55%)]" />
      <section className="relative w-full max-w-md rounded-3xl border border-blue-400/15 bg-slate-950/80 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-9">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 p-2">
            <Image src="/logo.png" alt="Stepyzoid Studio" width={64} height={64} className="size-full object-contain" priority />
          </div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-300"><ShieldCheck className="size-4" /> Admin access</div>
          <h1 className="text-2xl font-black tracking-tight text-white">Sign in to the control center</h1>
          <p className="mt-2 text-sm text-slate-400">Use an administrator account provisioned for this platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-100">{error}</div>}
          <label className="flex flex-col gap-2 text-xs font-bold text-slate-300">Username or email
            <input autoComplete="username" required maxLength={254} value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/50" />
          </label>
          <label className="flex flex-col gap-2 text-xs font-bold text-slate-300">Password
            <span className="relative"><LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input type="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-400/50" /></span>
          </label>
          <button disabled={loading} className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Sign in securely <ArrowRight className="size-4" /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">Administrator accounts are created through the backend&apos;s trusted provisioning process. There is no default password.</p>
      </section>
    </main>
  );
}
