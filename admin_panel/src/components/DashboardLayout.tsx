'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Users, 
  Terminal, 
  Activity, 
  LogOut, 
  Cpu, 
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');
    
    if (!token || role !== 'admin') {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    router.push('/login');
  };

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  if (loading) return null;

  return (
    <div className="min-h-screen dark">
      <div className="flex h-screen bg-transparent text-foreground overflow-hidden font-sans">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar - High Tech Dark */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 w-72 flex flex-col glass-card !rounded-none !border-y-0 !border-l-0 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] overflow-hidden p-1.5 backdrop-blur-sm">
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="w-full h-full object-contain drop-shadow-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tighter text-white uppercase font-heading">Stepyzoid</span>
              <span className="text-xs font-bold text-primary uppercase tracking-widest -mt-1">Studio Admin</span>
            </div>
          </div>

          <div className="mt-8 px-4 py-2 bg-slate-950 border border-white/10 rounded-lg flex items-center gap-2 backdrop-blur-sm shadow-inner">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Node Status: Active</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 mt-4 custom-scrollbar">
          <a href="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-all group">
            <Cpu className="w-5 h-5 text-white" />
            <span className="text-sm font-bold truncate">Core Console</span>
          </a>
          <a href="/dashboard" className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-800/50 hover:text-primary transition-all group">
            <Users className="w-5 h-5 group-hover:text-primary" />
            <span className="text-sm font-bold truncate">Users</span>
          </a>
          {/* Add more nav items as needed */}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-500" />
            <span className="text-sm font-bold">Abort Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header (Admin) */}
        <header className="h-20 glass-card !rounded-none !border-x-0 !border-t-0 px-6 flex items-center justify-between lg:hidden z-30">
          <button onClick={toggleMobileSidebar} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </button>
          <div className="font-black italic text-sm tracking-tighter text-white">ADMIN NODE</div>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto relative p-4 lg:p-10 bg-transparent scroll-smooth">
             {children}
        </main>
      </div>
      </div>
    </div>
  );
}

