'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Sparkles, Sun, Moon, User, Command } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const notifications = [
    { id: 1, title: 'Campaign Delivered', desc: 'Summer Discount campaign reached 820 users.', time: '5m ago' },
    { id: 2, title: 'AI Recommendation Ready', desc: 'New VIP segment insights generated.', time: '1h ago' },
    { id: 3, title: 'Webhook Callback Ingested', desc: 'Received 120 new conversion logs.', time: '2h ago' },
  ];

  return (
    <header className="sticky top-0 right-0 left-0 z-30 h-16 border-b border-zinc-850/60 bg-zinc-950/50 backdrop-blur-xl px-8 flex items-center justify-between transition-all duration-300">
      {/* Search Input Bar */}
      <div className="relative w-80 max-w-xs md:max-w-md hidden sm:block">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search shoppers, segments, campaigns..."
          className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-xxs text-zinc-500 font-bold">
          <Command className="h-2.5 w-2.5" /> K
        </span>
      </div>

      {/* Action Items Panel */}
      <div className="flex items-center gap-4 ml-auto">
        {/* AI Copilot Quick Button */}
        <Link
          href="/copilot"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-purple-blue text-white shadow-lg shadow-purple-950/30 transition-all btn-interactive"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          AI Copilot
        </Link>

        {/* Notifications bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-all cursor-pointer relative btn-interactive"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-2xl p-4 space-y-3 animate-fade-in-up z-50 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs font-bold text-white">Notifications</span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xxs text-zinc-500 hover:text-zinc-300"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-2 rounded-lg hover:bg-zinc-900/40 border border-transparent hover:border-zinc-900 transition-all text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200">{notif.title}</span>
                      <span className="text-xxs text-zinc-500">{notif.time}</span>
                    </div>
                    <p className="text-xxs text-zinc-400 mt-0.5">{notif.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-all cursor-pointer btn-interactive"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Account avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-850">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-500/20 text-white font-bold text-xs shadow-md">
            AK
          </div>
          <div className="flex flex-col text-left hidden md:block">
            <span className="text-xs font-semibold text-zinc-200 leading-none">Abhishek Kumar</span>
            <span className="text-xxs text-zinc-500 mt-0.5 leading-none">Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}
