'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceProvider } from '@/lib/workspace/WorkspaceContext';
import { SetupProvider, useSetup } from '@/lib/setup/SetupContext';
import { LayoutDashboard, Clock, FileText, FileDown, ArrowLeft, Settings, Target, Building2, Users } from 'lucide-react';

function WorkspaceTopNav() {
  const pathname = usePathname();
  const { state } = useSetup();
  const [activeOrgId, setActiveOrgId] = useState<string>('');

  useEffect(() => {
    const savedOrgId = localStorage.getItem('cpos_active_org_id');
    if (savedOrgId) {
      setActiveOrgId(savedOrgId);
    } else if (state.organizations.length > 0) {
      const firstOrgId = state.organizations[0].id;
      setActiveOrgId(firstOrgId);
      localStorage.setItem('cpos_active_org_id', firstOrgId);
    }
  }, [state.organizations]);

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrgId = e.target.value;
    setActiveOrgId(newOrgId);
    localStorage.setItem('cpos_active_org_id', newOrgId);
    // Force a full page reload to ensure all child contexts re-initialize with the new org sandbox
    window.location.reload();
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/cpos/workspace', icon: LayoutDashboard },
    { name: 'Timeline', href: '/admin/cpos/workspace/timeline', icon: Clock },
    { name: 'Journals', href: '/admin/cpos/workspace/journals', icon: FileText },
    { name: 'Deliverables', href: '/admin/cpos/workspace/deliverables', icon: FileDown },
    { name: 'Outcomes', href: '/admin/cpos/workspace/outcomes', icon: Target },
    { name: 'Stakeholders', href: '/admin/cpos/workspace/stakeholders', icon: Users },
    { name: 'Setup', href: '/admin/cpos/workspace/setup/organizations', icon: Settings },
  ];

  return (
    <div className="border-b border-border bg-card print:hidden">
      <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/cpos" className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Exit
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
          </div>
        </div>
        
        {/* Organization Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <select 
            value={activeOrgId}
            onChange={handleOrgChange}
            className="text-sm bg-muted text-foreground border-none rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-primary"
          >
            {state.organizations.length === 0 && (
              <option value="" disabled>No Organizations...</option>
            )}
            {state.organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SetupProvider>
      {/* WorkspaceProvider needs to be re-rendered when org changes, but since we do window.location.reload(), it's fine */}
      <WorkspaceProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <WorkspaceTopNav />
          <main className="container mx-auto px-4 max-w-7xl py-6 flex-1">
            {children}
          </main>
        </div>
      </WorkspaceProvider>
    </SetupProvider>
  );
}
