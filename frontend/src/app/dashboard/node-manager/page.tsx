'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { LogOut } from 'lucide-react';
import { apiFetch } from '@/utils/api';

export default function NodeManagerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [phone_code_hash, setPhoneCodeHash] = useState('');
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAccounts();

    // Global error catcher for this component
    const handleError = (e: ErrorEvent) => {
      setError(`CRITICAL_RUNTIME_ERROR: ${e.message}`);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const fetchAccounts = async () => {
    setFetching(true);
    setError('');
    try {
      const response = await apiFetch('/api/accounts');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }
      const data = await response.json().catch(() => []);
      console.log('DEBUG: Fetch accounts raw data:', data);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.message === 'Unauthorized') return; // Handled by apiFetch redirect
      console.error('Fetch accounts error:', err);
      setError(err.message || 'Failed to connect to the node cluster.');
      setAccounts([]);
    } finally {
      setFetching(false);
    }
  };

  const handleSendCode = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/accounts/send_code', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to send code');
      }
      const data = await response.json();
      setPhoneCodeHash(data.phone_code_hash);
      setStep(2);
    } catch (err: any) {
      if (err.message === 'Unauthorized') return;
      alert(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/accounts/signin', {
        method: 'POST',
        body: JSON.stringify({ phone, code, phone_code_hash, password }),
      });
      if (response.ok) {
        setStep(1);
        setPhone('');
        setCode('');
        setPassword('');
        fetchAccounts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Sign in failed');
      }
    } catch (err: any) {
      if (err.message === 'Unauthorized') return;
      alert(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this node? The session will be lost.')) return;
    try {
      const response = await apiFetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) fetchAccounts();
      else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to revoke node');
      }
    } catch (err: any) {
      if (err.message === 'Unauthorized') return;
      alert(err.message);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-slate-950" />;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-fade-in space-y-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
              Node <span className="text-primary">Manager</span> 
              <span className="ml-4 px-2 py-0.5 bg-emerald-500 text-white text-[8px] rounded font-mono not-italic">
                VERIFIED_STABLE_v3.2
              </span>
            </h1>
            <p className="text-muted-foreground font-medium mt-1">Manage multiple nodes for secure automation and proxy-aware rotation.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-shake">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">Protocol Error Detected</p>
                   <p className="text-[10px] font-bold text-red-500/70 mt-1 uppercase italic">{error}</p>
                </div>
                <button 
                  onClick={fetchAccounts}
                  className="ml-auto px-4 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all"
                >
                  Reconnect
                </button>
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-[2rem] h-fit space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight italic">{step === 1 ? 'Link New Node' : 'Node Verification'}</h3>
            <div className="space-y-5">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleSendCode} 
                    disabled={loading} 
                    className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Initialize Uplink</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Verification Code</label>
                    <input
                      type="text"
                      placeholder="Enter 5-digit code"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-center tracking-[0.5em] text-lg"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">2FA Cloud Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleSignIn} 
                    disabled={loading} 
                    className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Complete Integration</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/50 border-b border-white/10 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Phone Node</th>
                    <th className="px-6 py-5 hidden sm:table-cell">Session Link</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Commander</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fetching ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic animate-pulse">Synchronizing Node Data...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (!accounts || !Array.isArray(accounts) || accounts.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-50">
                        Scanning network... no nodes detected.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc: any, index: number) => {
                      if (!acc) return null;
                      return (
                        <tr key={acc.id || `acc-${index}`} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-6 py-5 font-black text-foreground italic">{acc.phone || 'Unknown'}</td>
                          <td className="px-6 py-5 text-[10px] text-muted-foreground font-mono hidden sm:table-cell">
                             {acc.session_name ? (String(acc.session_name).substring(0, 12) + '...') : 'active_node...'}
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                              {acc.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => handleRevoke(acc.id)}
                              className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
                            >
                              Revoke Uplink
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
