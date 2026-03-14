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
  Search as SearchIcon, 
  ChevronLeft, 
  LogOut, 
  Moon, 
  Sun,
  User,
  ShieldCheck,
  Zap,
  ChevronRight,
  Send
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !pathname.includes('/login') && !pathname.includes('/signup')) {
      router.push('/login');
    }
  }, [pathname, router]);

  // Handle mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(true); // Always expanded when in mobile drawer mode
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Accounts', icon: Users, path: '/dashboard/accounts' },
    { name: 'Direct Message', icon: Send, path: '/dashboard/joined-groups' },
    { name: 'Group Finder', icon: Search, path: '/dashboard/groups' },
    { name: 'Scraper', icon: UserPlus, path: '/dashboard/scraper' },
    { name: 'Campaigns', icon: Megaphone, path: '/dashboard/campaigns' },
    { name: 'Leads', icon: MessageSquare, path: '/dashboard/leads' },
    { name: 'Templates', icon: MessageSquare, path: '/dashboard/templates' },
    { name: 'Automation Logs', icon: Terminal, path: '/dashboard/logs' },
    { name: 'System Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-transparent text-foreground overflow-hidden font-sans">
        
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 lg:relative flex flex-col glass-card !rounded-none !border-y-0 !border-l-0 transition-all duration-300 ease-in-out ${
            isMobileOpen 
              ? 'translate-x-0 w-72' 
              : '-translate-x-full lg:translate-x-0 ' + (isSidebarOpen ? 'w-72' : 'w-20')
          }`}
        >
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 border-b border-border">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="min-w-[40px] h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <Zap className="w-5 h-5 text-white" />
               </div>
               {(isSidebarOpen || isMobileOpen) && (
                 <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
                    <span className="text-sm font-black tracking-tighter uppercase font-heading">Stepyzoid</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] -mt-1">Studio Elite</span>
                 </div>
               )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative ${
                    isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary'
                  }`}
                >
                  <item.icon className={`w-5 h-5 min-w-[20px] ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
                  {(isSidebarOpen || isMobileOpen) && (
                    <span className="text-sm font-bold truncate animate-in fade-in slide-in-from-left-2">{item.name}</span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
            >
              <LogOut className="w-5 h-5 min-w-[20px] group-hover:text-red-600" />
              {(isSidebarOpen || isMobileOpen) && <span className="text-sm font-bold animate-in fade-in">Sign Out</span>}
            </button>
          </div>

          {/* Collapse Toggle (Desktop only) */}
          <button 
            onClick={toggleSidebar}
            className="absolute -right-4 top-24 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform hidden lg:flex"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Navbar */}
          <header className="h-20 glass-card !rounded-none !border-x-0 !border-t-0 px-4 lg:px-8 flex items-center justify-between z-20">
            <div className="flex items-center gap-4 lg:gap-6 flex-1">
              <button 
                onClick={toggleMobileSidebar}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="max-w-md w-full relative hidden md:block">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Universal Search..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative group"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Toggle Theme</span>
              </button>

              {/* Notifications */}
              <button className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative hidden sm:flex">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
              </button>

              <div className="w-px h-6 bg-border mx-1 sm:mx-2" />

              {/* Profile Dropdown */}
              <button className="flex items-center gap-2 lg:gap-3 pl-2 pr-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <div className="flex flex-col text-right hidden xl:flex">
                  <span className="text-xs font-black uppercase tracking-wider leading-none">Admin Node</span>
                  <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest mt-0.5">Verified</span>
                </div>
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-slate-100 dark:bg-slate-800 rounded-xl border border-border flex items-center justify-center overflow-hidden">
                   <User className="w-5 h-5 text-slate-400" />
                </div>
              </button>
            </div>
          </header>

          {/* Breadcrumbs */}
          <div className="px-4 lg:px-8 py-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 bg-transparent">
             <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
             <ChevronRight className="w-3 h-3" />
             <span className="text-slate-200">Dashboard</span>
          </div>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-10 relative scroll-smooth bg-transparent">
             <div className="max-w-[1600px] mx-auto animate-fade-in">
               {children}
             </div>
          </main>
        </div>

      </div>
    </div>
  );
}

