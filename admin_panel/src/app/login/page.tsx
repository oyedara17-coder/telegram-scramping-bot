'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Key, Lock, Terminal } from 'lucide-react';
import Image from 'next/image';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Verify 6-digit security code (080789)
    if (securityCode !== '080789') {
      setError('INVALID SECURITY CODE. ACCESS DENIED.');
      setLoading(false);
      return;
    }

    try {
      // Admin login against the same backend
      const response = await fetch('http://127.0.0.1:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: username.toLowerCase().trim(), password }),
      });

      if (!response.ok) {
        throw new Error('AUTHENTICATION FAILED: INVALID CREDENTIALS');
      }

      const data = await response.json();
      
      // Strict role check for Admin Panel
      if (data.role !== 'admin') {
        throw new Error('ACCESS DENIED: INSUFFICIENT CLEARANCE');
      }

      localStorage.setItem('adminToken', data.access_token);
      localStorage.setItem('adminRole', data.role);
      router.push('/dashboard');
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
          <div className="w-20 h-20 bg-red-600/10 rounded-2xl mx-auto flex items-center justify-center border border-red-500/20 mb-6 group hover:bg-red-600/20 transition-all overflow-hidden p-3">
            <Image src="/logo.png" alt="Logo" width={80} height={80} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">
            Stepyzoid <span className="text-red-500">Studio Admin</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Terminal className="w-3 h-3 text-red-500/50" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure Administrative Node</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-xs font-black border border-red-500/20 flex items-center gap-3 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Node Identifier</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-950/50 border border-white/5 rounded-xl text-white outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Access Protocol</label>
              <div className="relative">
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

            <div className="group pt-2">
              <label className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-1.5 block px-1 flex justify-between">
                <span>6-Digit clearance</span>
                <Key className="w-3 h-3" />
              </label>
              <input
                type="password"
                maxLength={6}
                required
                className="w-full px-4 py-4 bg-red-600/5 border border-red-500/20 rounded-xl text-red-500 text-center text-2xl font-black tracking-[0.5em] outline-none focus:bg-red-600/10 focus:border-red-500/50 transition-all placeholder:text-red-900/30 font-mono"
                placeholder="000000"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] focus:ring-2 focus:ring-red-500/50 transition-all disabled:opacity-50 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Initialize Link
                <Lock className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="text-center mt-6">
             <a href="/signup" className="text-[10px] text-slate-600 font-bold hover:text-slate-400 underline uppercase tracking-widest">
               Request New Clearance
             </a>
          </div>
        </form>
      </div>
    </div>
  );
}
