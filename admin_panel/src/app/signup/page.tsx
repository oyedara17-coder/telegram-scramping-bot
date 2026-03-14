'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ShieldAlert, Terminal, Lock } from 'lucide-react';

export default function AdminSignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          role: 'admin' // Force role to admin for this application
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'CLEARANCE REQUEST FAILED');
      }

      router.push('/login');
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-md w-full space-y-8 bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl relative">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-600/10 rounded-2xl mx-auto flex items-center justify-center border border-red-500/20 mb-6 group hover:bg-red-600/20 transition-all">
            <UserPlus className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
            Request <span className="text-red-500">Access</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Terminal className="w-3 h-3 text-red-500/50" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">New Administrator Registration</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-xs font-black border border-red-500/20 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Identity handle</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Secure Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800"
                placeholder="EMAIL@STEZYOID.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Cipher Key</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] focus:ring-2 focus:ring-red-500/50 transition-all disabled:opacity-50 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
          >
            {loading ? 'Processing...' : 'Provision Clearance'}
          </button>
          
          <div className="text-center mt-6">
             <Link href="/login" className="text-[10px] text-slate-600 font-bold hover:text-slate-400 underline uppercase tracking-widest">
               Return to Uplink
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
