'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Search, 
  UserPlus, 
  Megaphone, 
  MessageSquare, 
  Terminal, 
  Settings, 
  Menu, 
  Bell, 
  ChevronLeft, 
  LogOut, 
  User,
  Zap,
  ChevronRight,
  Send,
  Target
} from 'lucide-react';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token && pathname && !pathname.includes('/login')) {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    // Only call handleResize after mount to prevent hydration mismatch
    if (mounted) {
      handleResize();
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Accounts', icon: Users, path: '/dashboard/accounts' },
    { name: 'Direct Message', icon: Send, path: '/dashboard/joined-groups' },
    { name: 'Group Finder', icon: Search, path: '/dashboard/groups' },
    { name: 'Scraper', icon: UserPlus, path: '/dashboard/scraper' },
    { name: 'Campaigns', icon: Megaphone, path: '/dashboard/campaigns' },
    { name: 'Leads', icon: Target, path: '/dashboard/leads' },
    { name: 'Templates', icon: MessageSquare, path: '/dashboard/templates' },
    { name: 'Automation Logs', icon: Terminal, path: '/dashboard/logs' },
    { name: 'System Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 lg:relative flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen 
            ? 'translate-x-0 w-72' 
            : '-translate-x-full lg:translate-x-0 ' + (isSidebarOpen ? 'w-64' : 'w-[72px]')
        }`}
        style={{
          background: 'rgba(4, 8, 20, 0.92)',
          borderRight: '1px solid rgba(59,130,246,0.15)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-5 gap-3" style={{ borderBottom: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="min-w-[44px] h-11 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <div className="w-8 h-8 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
          </div>
          {(isSidebarOpen || isMobileOpen) && (
            <div className="overflow-hidden">
              <p className="text-white font-black text-sm uppercase tracking-tight leading-none font-heading" style={{ fontFamily: 'Poppins, sans-serif' }}>Stepyzoid</p>
              <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: '#3B82F6' }}>Studio Elite</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                }}
              >
                {isActive && <div className="absolute left-0 w-0.5 h-6 rounded-r-full" style={{ background: '#3B82F6' }} />}
                <item.icon className="w-5 h-5 min-w-[20px]" style={{ color: isActive ? '#60A5FA' : '#64748B' }} />
                {(isSidebarOpen || isMobileOpen) && (
                  <span className="text-sm font-bold truncate" style={{ color: isActive ? '#F1F5F9' : '#94A3B8' }}>{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(59,130,246,0.12)' }}>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-500 text-slate-500"
          >
            <LogOut className="w-5 h-5 min-w-[20px]" />
            {(isSidebarOpen || isMobileOpen) && <span className="text-sm font-bold">Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-24 w-7 h-7 rounded-full hidden lg:flex items-center justify-center transition-all hover:scale-110"
          style={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6' }}
        >
          {isSidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className="h-20 flex items-center justify-between px-6 z-20 flex-shrink-0"
          style={{
            background: 'rgba(4, 8, 20, 0.85)',
            borderBottom: '1px solid rgba(59,130,246,0.12)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="p-2 rounded-xl lg:hidden"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search */}
            <div className="max-w-sm w-full relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
              <input 
                type="text"
                placeholder="Universal Search..."
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#F1F5F9' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2.5 rounded-xl relative hidden sm:flex"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Bell className="w-5 h-5" style={{ color: '#94A3B8' }} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="w-px h-8 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* User */}
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-black text-white uppercase tracking-wider">Admin Node</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>Verified</span>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <User className="w-5 h-5" style={{ color: '#60A5FA' }} />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="px-6 py-2.5 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: '#475569' }}>Home</Link>
          <ChevronRight className="w-3 h-3" style={{ color: '#334155' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>Dashboard</span>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10" style={{ background: 'transparent' }}>
          <div className="max-w-[1600px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
