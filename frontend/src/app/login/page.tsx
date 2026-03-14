'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Zap, Lock, Eye, EyeOff, Terminal, ArrowRight, User, Key } from 'lucide-react';

export default function PremiumLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });

      if (!response.ok) throw new Error('Invalid node credentials. Access denied.');

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      setForgotMessage(data.message);
    } catch (err) {
      setForgotMessage('FAILED TO CONNECT TO SECURITY NODE.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans relative overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-multiply" />
      </div>

      <div className="max-w-md w-full relative z-10 transition-all duration-300">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 transform hover:rotate-12 transition-transform">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase font-heading italic">
            Stepyzoid <span className="text-primary italic">Studio</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Elite Automation Node v2.0</p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[2rem] border border-white/5 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Access Recovery</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6 px-1">Specify node email for provision link</p>
              
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  className="w-full px-4 py-4 bg-slate-100 dark:bg-slate-950 border border-transparent rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                  placeholder="Node Email Address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                
                {forgotMessage && (
                  <div className="bg-primary/10 text-primary p-3 rounded-xl text-[10px] font-black border border-primary/20">
                    {forgotMessage}
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(false); setForgotMessage(''); }}
                    className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl">
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 text-red-600 dark:text-red-500 p-4 rounded-2xl text-[10px] font-black border border-red-500/20 flex items-center gap-3 animate-shake">
                <Terminal className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="group">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-950/50 border border-transparent rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    placeholder="Email Address"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 tracking-widest hidden group-focus-within:block uppercase animate-in fade-in">Required</div>
                </div>
              </div>

              <div className="group">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-slate-100/50 dark:bg-slate-950/50 border border-transparent rounded-2xl text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    placeholder="Access protocol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Initialize Terminal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="flex items-center justify-between px-2">
               <Link href="/signup" className="text-[10px] text-slate-400 font-bold hover:text-primary transition-colors uppercase tracking-widest">
                 Provision Node
               </Link>
               <button 
                 type="button"
                 onClick={() => setShowForgotModal(true)}
                 className="text-[10px] text-slate-400 font-bold hover:text-primary transition-colors uppercase tracking-widest"
               >
                 Lost Access?
               </button>
            </div>
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">AES-256 Validated</span>
           </div>
           <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Anti-Ban Armed</span>
           </div>
        </div>
      </div>
    </div>
  );
}
