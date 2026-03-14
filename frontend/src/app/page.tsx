'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card px-6 py-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <Image src="/logo.png" alt="Stepyzoid Studio Logo" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">Stepyzoid Studio</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            Elite Automation Node v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Telegram Automation <br />
            <span className="text-primary italic">Perfected.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            The ultimate studio for scalable Telegram scraping, automated messaging, and elite campaign management. Built for performance, designed for professionals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
              >
                Go to Dashboard
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/signup" 
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold hover:shadow-2xl hover:shadow-primary/30 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-background border border-border text-lg font-semibold hover:bg-muted/50 transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
            {[
              {
                title: "Advanced Scraping",
                desc: "Highly efficient group and channel scraping with automated proxy rotation.",
                icon: "⚡"
              },
              {
                title: "Intelligent Campaigns",
                desc: "Schedule and manage complex messaging campaigns with full analytics.",
                icon: "📊"
              },
              {
                title: "Elite Security",
                desc: "Enterprise-grade encryption and account protection for all operations.",
                icon: "🛡️"
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-3xl text-left space-y-4 hover:scale-[1.02] transition-transform">
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
             <div className="w-6 h-6 relative opacity-80">
                <Image src="/logo.png" alt="Stepyzoid Studio Logo" fill className="object-contain" />
             </div>
             <span className="font-bold">Stepyzoid Studio</span>
          </div>
          
          <p className="text-muted-foreground text-sm">
            © 2026 Stepyzoid Studio. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

