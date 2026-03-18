'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Users, ShieldCheck, ArrowRight, Lock, Activity } from 'lucide-react';

export default function RootPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.warn('LocalStorage access blocked:', err);
    }
  }, []);

  // Use a stable, non-null placeholder that matches the theme
  if (!mounted) {
    return <div className="min-h-screen bg-[#050a12]" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050a12] text-[#F1F5F9] font-sans relative overflow-hidden">
      
      {/* Stable Background Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* The bubbles are hardcoded style to avoid any theme mismatch */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '50%', height: '50%', background: 'rgba(29, 78, 216, 0.2)', borderRadius: '9999px', filter: 'blur(140px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(79, 70, 229, 0.15)', borderRadius: '9999px', filter: 'blur(140px)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '40%', background: 'rgba(30, 58, 138, 0.1)', borderRadius: '9999px', filter: 'blur(120px)' }} />
      </div>

      {/* Standard Navigation */}
      <nav className="relative z-50 w-full px-6 py-5 flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 relative bg-blue-600/10 rounded-xl p-1.5 border border-blue-600/20">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" priority />
          </div>
          <span className="text-lg font-black tracking-tight uppercase italic font-heading">
            Stepyzoid <span className="text-blue-500">Studio</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2"
            >
              Dashboard
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center pt-16 pb-24 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
          <Activity className="w-3 h-3" />
          Native Telegram Node v3.0
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase font-heading mb-6">
          Telegram <br />
          <span className="text-blue-500 italic">Automation</span> <br />
          Perfected.
        </h1>
        
        <p className="max-w-xl text-slate-400 text-base font-medium leading-relaxed mb-10">
          The ultimate studio for scalable Telegram scraping, automated messaging, and elite campaign management.
        </p>

        <div className="flex items-center gap-4">
          <Link 
            href={isLoggedIn ? "/dashboard" : "/login"} 
            className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:shadow-2xl hover:shadow-blue-600/30 transition-all"
          >
            {isLoggedIn ? "Go to Dashboard" : "Get Started"}
          </Link>
        </div>

        {/* Feature Grid - Fixed to avoid layout shifts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24">
          {[
            { icon: <Zap className="w-6 h-6 text-blue-400" />, title: "Scraping" },
            { icon: <Users className="w-6 h-6 text-indigo-400" />, title: "Campaigns" },
            { icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, title: "Security" }
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm p-8 rounded-3xl text-left space-y-4 hover:border-blue-600/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black/50 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight italic text-white font-heading">{feature.title}</h3>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-8 border-t border-white/5 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
           <span className="text-xs font-black uppercase tracking-widest text-slate-500 italic">Stepyzoid Studio</span>
           <p className="text-slate-600 text-xs">© 2026 Stepyzoid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
