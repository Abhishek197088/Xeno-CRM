'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Layers,
  Send,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Segments', href: '/segments', icon: Layers },
  { name: 'Campaigns', href: '/campaigns', icon: Send },
  { name: 'AI Copilot', href: '/copilot', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'System Design', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync sidebar width with global layout padding using CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '4.5rem' : '16rem'
    );
  }, [isCollapsed]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-850/60 bg-zinc-950/80 backdrop-blur-xl transition-all duration-300",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Logo Header */}
      <div className={cn(
        "flex h-16 items-center border-b border-zinc-850/40 relative",
        isCollapsed ? "justify-center px-0" : "justify-between px-6"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-purple-blue neon-glow-purple shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent animate-fade-in-up font-outfit">
              Xeno CRM
            </span>
          )}
        </Link>
        
        {/* Toggle Collapse button */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-all hover:bg-zinc-850 absolute right-4 btn-interactive"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 space-y-1.5 py-6", isCollapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-lg py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                isCollapsed ? "justify-center px-0 h-11 w-11 mx-auto" : "gap-3.5 px-3.5",
                isActive
                  ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.25)]"
                  : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200 border border-transparent"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              {/* Active left indicator strip */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-gradient-to-b from-purple-400 to-blue-500 rounded-r shadow-[0_0_8px_#a855f7]" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-all duration-300 group-hover:scale-110",
                  isActive ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-300 group-hover:rotate-3",
                  isCollapsed ? "" : "shrink-0"
                )}
              />
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Expand sidebar button when collapsed */}
      {isCollapsed && (
        <div className="flex justify-center py-2 border-t border-zinc-900">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer btn-interactive"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User Footer Panel */}
      <div className={cn("border-t border-zinc-850/60 bg-zinc-950/40", isCollapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center gap-3 rounded-lg hover:bg-zinc-900/40 transition-colors", isCollapsed ? "justify-center p-0 h-10 w-10 mx-auto" : "p-2")}>
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-850 border border-zinc-700 font-bold text-xs text-purple-400 shadow-inner">
              AK
            </div>
            {/* Pulsing online status dot */}
            <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-zinc-950"></span>
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-semibold text-zinc-200 truncate">Abhishek Kumar</span>
              <span className="text-xs text-zinc-500 truncate">abhishek197088@gmail.com</span>
              <span className="text-xxs text-zinc-650 truncate font-mono">+91 8825139113</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
