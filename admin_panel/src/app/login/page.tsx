'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldAlert, Terminal, ArrowRight, Phone, Key, Lock, ShieldCheck } from 'lucide-react';

export default function AdminTelegramLoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: Code
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (securityCode !== '080789') {
      setError('INVALID SECURITY CLEARANCE CODE.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/users/auth/telegram/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      setError(`${err.message.toUpperCase()} (LINK: ${apiUrl})`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/users/auth/telegram/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, phone_code_hash: phoneCodeHash }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Invalid verification code.');
      }

      const data = await response.json();
      
      if (data.role !== 'admin') {
        throw new Error('ACCESS DENIED: INSUFFICIENT CLEARANCE. ADMIN ONLY.');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-red-600/10 rounded-2xl mx-auto flex items-center justify-center border border-red-500/20 mb-6 group hover:bg-red-600/20 transition-all p-3">
             <Image src="/logo.png" alt="Logo" width={80} height={80} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1 italic">
            Stepyzoid <span className="text-red-600">Studio Admin</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Terminal className="w-3 h-3 text-red-600" />
            <span className="text-[10px] text-slate-300 uppercase tracking-widest font-black">Security Node v3.0</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
          
          <form className="space-y-6" onSubmit={step === 1 ? handleSendCode : handleVerifyCode}>
            <div className="text-center mb-2">
              <h2 className="text-xl font-black text-white uppercase italic">
                {step === 1 ? 'Root Authorization' : 'Identity Confirmed'}
              </h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                {step === 1 ? 'Provide administrative uplink' : 'Provide temporary link code'}
              </p>
            </div>

            {error && (
              <div className="bg-red-600/10 text-red-600 p-4 rounded-xl text-[10px] font-black border border-red-600/20 flex items-center gap-3 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Node Phone</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-600 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all font-bold placeholder:text-slate-700"
                        placeholder="+1 234..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Clearance Code</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-600 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all font-bold placeholder:text-slate-700"
                        placeholder="••••••"
                        value={securityCode}
                        onChange={(e) => setSecurityCode(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1 text-center">Telegram Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={5}
                      autoFocus
                      className="w-full py-4 bg-red-600/5 border border-red-500/20 rounded-xl text-red-500 text-center text-3xl font-black tracking-[0.5em] outline-none focus:bg-red-600/10 focus:border-red-500/50 transition-all font-mono"
                      placeholder="00000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 1 ? 'Initialize Link' : 'Confirm Identity'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[10px] text-slate-500 font-black hover:text-red-600 transition-colors uppercase tracking-widest text-center"
              >
                Reset Authorized Node
              </button>
            )}
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Tier-1 Access Admin</span>
           </div>
        </div>
      </div>
    </div>
  );
}
