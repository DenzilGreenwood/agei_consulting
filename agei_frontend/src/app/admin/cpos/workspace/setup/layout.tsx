'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SetupProvider } from '@/lib/setup/SetupContext';
import { Building2, Users, LayoutTemplate, ArrowLeft, Settings } from 'lucide-react';

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Global Settings', href: '/admin/cpos/workspace/setup/settings', icon: Settings },
    { name: 'Organizations', href: '/admin/cpos/workspace/setup/organizations', icon: Building2 },
    { name: 'Users (Principals)', href: '/admin/cpos/workspace/setup/users', icon: Users },
    { name: 'Form Builder', href: '/admin/cpos/workspace/setup/forms', icon: LayoutTemplate },
  ];

  return (
    <SetupProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/cpos/workspace" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm mr-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
              <h1 className="font-semibold text-sm">Platform Administration</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 flex container mx-auto px-4 max-w-7xl py-6 gap-6">
          {/* Side Navigation */}
          <aside className="w-64 shrink-0 space-y-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Configuration</h2>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SetupProvider>
  );
}
