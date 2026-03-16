'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Key, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('INVALID RECOVERY TOKEN. ACCESS DENIED.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('ACCESS KEYS DO NOT MATCH.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'RECOVERY FAILED.');
      
      setMessage(data.message.toUpperCase());
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {(error || message) && (
          <div className={`p-4 rounded-2xl text-[10px] font-black border flex items-center gap-3 animate-shake ${error ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
            <Terminal className="w-4 h-4 shrink-0" />
            {error || message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="group">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-500"
                placeholder="New access key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="group">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-500"
                placeholder="Confirm access key"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] group"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Protocol Update
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 transform hover:-rotate-12 transition-transform p-3">
             <Image src="/logo.png" alt="Logo" width={96} height={96} className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase font-heading italic">
            Security <span className="text-primary italic">Override</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-extrabold text-[11px] uppercase tracking-[0.3em] mt-2">Provision new access protocol</p>
        </div>

        <Suspense fallback={<div className="text-center text-slate-500">Loading secure protocol...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
