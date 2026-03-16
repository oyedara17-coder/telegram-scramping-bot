'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Users, ShieldCheck, ArrowRight, Lock, Activity } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white font-sans relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-700/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 w-full px-6 py-5 flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 relative bg-blue-600/10 rounded-xl p-1.5 border border-blue-600/20">
            <Image src="/logo.png" alt="Stepyzoid Studio Logo" fill className="object-contain" />
          </div>
          <span className="text-lg font-black tracking-tight uppercase italic font-heading">
            Stepyzoid <span className="text-blue-500">Studio</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              Dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/login" 
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-16 pb-24 px-6 text-center animate-fade-in">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
          <Activity className="w-3 h-3" />
          Native Telegram Node v3.0
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase font-heading mb-6">
          Telegram <br />
          <span className="text-blue-500 italic">Automation</span> <br />
          Perfected.
        </h1>
        
        <p className="max-w-xl text-slate-400 text-base font-medium leading-relaxed mb-10">
          The ultimate studio for scalable Telegram scraping, automated messaging, and elite campaign management. Built for professionals.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center gap-3"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center gap-3"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/login" 
                className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-white/10 transition-all"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Security badges */}
        <div className="flex items-center gap-8 mt-10 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Native MTProto v2</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">E2E App Encrypted</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24">
          {[
            {
              icon: <Zap className="w-6 h-6 text-blue-400" />,
              title: "Advanced Scraping",
              desc: "Highly efficient group and channel scraping with country-based targeting and automated proxy rotation."
            },
            {
              icon: <Users className="w-6 h-6 text-indigo-400" />,
              title: "Intelligent Campaigns",
              desc: "Schedule and manage complex messaging campaigns with smart safety delays to protect your account."
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
              title: "Elite Security",
              desc: "Enterprise-grade encryption and account protection. Native Telegram authentication for all operations."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm p-8 rounded-3xl text-left space-y-4 hover:border-blue-600/30 hover:bg-blue-600/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight italic text-white font-heading">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative opacity-60">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 italic">Stepyzoid Studio</span>
          </div>
          
          <p className="text-slate-600 text-xs">© 2026 Stepyzoid Studio. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold">Terms</Link>
            <Link href="/privacy" className="text-xs text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest font-bold">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
