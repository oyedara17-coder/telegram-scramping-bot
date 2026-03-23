'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Zap, Terminal, ArrowRight, Phone, Key, Lock, User } from 'lucide-react';

import { apiFetch } from '@/utils/api';

export default function TelegramLoginPage() {
  const [loginMode, setLoginMode] = useState<'admin' | 'telegram'>('admin');

  // Admin mode state
  const [username, setUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Telegram mode state
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: Code, 3: 2FA Password
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ---------- Admin Login ----------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', adminPassword);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space';
      const response = await fetch(`${apiBase}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Invalid username or password.');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  // ---------- Telegram Login ----------
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/users/auth/telegram/send-code', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to send verification code.');
      }

      const data = await response.json();
      setPhoneCodeHash(data.phone_code_hash);
      setStep(2);
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/users/auth/telegram/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), code, phone_code_hash: phoneCodeHash, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorDetail = data.detail || 'Invalid verification code.';
        
        if (errorDetail.includes('2FA') || errorDetail.includes('password')) {
           setStep(3);
           return;
        }
        
        throw new Error(errorDetail);
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans relative overflow-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-multiply" />
      </div>

      <div className="max-w-md w-full relative z-10 transition-all duration-300">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-blue-600/10 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-blue-600/20 transform hover:-rotate-12 transition-transform p-3">
             <Image src="/logo.png" alt="Logo" width={96} height={96} className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase font-heading italic">
            Stepyzoid <span className="text-blue-600 italic">Studio</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-extrabold text-[11px] uppercase tracking-[0.3em] mt-2">Native Telegram Node v3.0</p>
          <p className="text-[8px] font-mono text-blue-500/50 mt-1 uppercase tracking-widest">BUILD_STABLE_v3.2_PRODUCTION</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl">
          
          {/* Mode Toggle */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl mb-8 border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => { setLoginMode('admin'); setError(''); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                loginMode === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('telegram'); setError(''); setStep(1); }}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
                loginMode === 'telegram'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Telegram Login
            </button>
          </div>

          {/* ===== ADMIN LOGIN FORM ===== */}
          {loginMode === 'admin' && (
            <form className="space-y-6" onSubmit={handleAdminLogin}>
              <div className="text-center mb-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Admin Access</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Enter credentials to authenticate</p>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-600 dark:text-red-500 p-4 rounded-2xl text-[10px] font-black border border-red-500/20 flex items-center gap-3 animate-shake">
                  <Terminal className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="group">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/30 transition-all font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-500"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="group">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/30 transition-all font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-500"
                      placeholder="Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Authenticate Session <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          )}

          {/* ===== TELEGRAM LOGIN FORM ===== */}
          {loginMode === 'telegram' && (
            <form className="space-y-6" onSubmit={step === 1 ? handleSendCode : handleVerifyCode}>
              <div className="text-center mb-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">
                  {step === 1 ? 'Node Initialization' : 'Identity Verification'}
                </h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {step === 1 ? 'Enter phone number for uplink' : 'Enter 5-digit Telegram code'}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-600 dark:text-red-500 p-4 rounded-2xl text-[10px] font-black border border-red-500/20 flex items-center gap-3 animate-shake">
                  <Terminal className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                {step === 1 ? (
                  <div className="group">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        autoFocus
                        className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/30 transition-all font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-500"
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                ) : step === 2 ? (
                  <div className="group">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        autoFocus
                        className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/30 transition-all font-mono text-xl tracking-[0.5em] font-black placeholder:text-slate-500 dark:placeholder:text-slate-500 text-center"
                        placeholder="00000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        autoFocus
                        className="w-full pl-12 pr-4 py-4 bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/30 transition-all font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-500"
                        placeholder="Cloud Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {step === 1 ? 'Request Link Code' : step === 2 ? 'Authorize Session' : 'Confirm 2FA Password'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-[10px] text-slate-600 dark:text-slate-400 font-black hover:text-blue-600 transition-colors uppercase tracking-widest text-center"
                >
                  Change Phone Alias
                </button>
              )}
            </form>
          )}
        </div>

        {/* Security Badge */}
        <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Native MTProto v2</span>
           </div>
           <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">E2E App Encrypted</span>
           </div>
        </div>
      </div>
    </div>
  );
}
