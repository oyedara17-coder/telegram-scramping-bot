'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldCheck, Clock, Users, Zap, LogOut, ChevronRight } from 'lucide-react';


export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/accounts/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setAccounts(data);
    } catch (err) {}
  };

  const handleSendCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/accounts/send_code`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      setPhoneCodeHash(data.phone_code_hash);
      setStep(2);
    } catch (err) {
      alert('Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/accounts/signin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ phone, code, phone_code_hash: phoneCodeHash, password }),
      });
      if (response.ok) {
        setStep(1);
        setPhone('');
        setCode('');
        fetchAccounts();
      }
    } catch (err) {
      alert('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-black tracking-tight text-foreground font-heading uppercase italic">
            Telegram <span className="text-primary">Accounts</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage multiple nodes for secure automation and proxy-aware rotation.</p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
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
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-center tracking-[0.5em] text-lg"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">2FA Cloud Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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


          {/* Table */}
          <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Phone Node</th>
                    <th className="px-6 py-5 hidden sm:table-cell">Session Link</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Commander</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-50">
                        Scanning network... no nodes detected.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc: any) => (
                      <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-5 font-black text-foreground italic">{acc.phone}</td>
                        <td className="px-6 py-5 text-[10px] text-muted-foreground font-mono hidden sm:table-cell">
                          {acc.session_name.substring(0, 12)}...
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors">
                            Revoke Uplink
                          </button>
                        </td>
                      </tr>
                    ))
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
