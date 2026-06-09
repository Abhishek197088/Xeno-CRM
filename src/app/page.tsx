'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Activity, Users, Send, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[800px] h-[350px] bg-purple-600/10 rounded-full blur-[160px] z-0 animate-pulse" />
      <div className="absolute bottom-10 right-1/4 pointer-events-none w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-[140px] z-0" />

      {/* Floating Particles decoration */}
      <div className="absolute top-20 left-10 h-3 w-3 rounded-full bg-purple-500/20 blur-[1px] animate-float-blob-1" />
      <div className="absolute bottom-40 right-20 h-4 w-4 rounded-full bg-blue-500/20 blur-[1px] animate-float-blob-2" />
      <div className="absolute top-1/2 right-12 h-2.5 w-2.5 rounded-full bg-pink-500/20 blur-[1px] animate-float-blob-3" />

      {/* Hero Content Area */}
      <div className="text-center max-w-4xl space-y-6 relative z-10 animate-fade-in-up mt-8">
        {/* Release tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xxs font-bold uppercase tracking-widest shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)] select-none">
          <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          Xeno CRM Series-A Release
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-outfit leading-[1.15]">
          AI-Powered Shopper{' '}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
            Engagement Platform
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Create intelligent customer segments, launch personalized campaigns, and maximize conversions with AI.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-lg bg-gradient-purple-blue text-white shadow-xl shadow-purple-950/40 hover:shadow-purple-900/40 transition-all scale-100 active:scale-[0.98] cursor-pointer btn-interactive"
          >
            Launch CRM Workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/settings"
            className="px-6 py-3 text-sm font-semibold rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all scale-100 active:scale-[0.98] cursor-pointer btn-interactive"
          >
            View System Architecture
          </Link>
        </div>
      </div>

      {/* Hero Dashboard Live Mockup */}
      <div className="mt-16 w-full max-w-5xl rounded-2xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl relative z-10 animate-fade-in-up glow-accent-purple overflow-hidden">
        {/* Window controls decoration */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
          </div>
          <div className="text-xxs font-mono text-zinc-600 bg-zinc-900/40 border border-zinc-850 px-3 py-1 rounded-md">
            xeno-crm-dashboard.app
          </div>
          <div className="w-12" />
        </div>

        {/* Mock Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Chart Panel Mock */}
          <div className="md:col-span-2 space-y-4">
            <div className="glass-card rounded-xl p-4 border border-zinc-900/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400">Store Revenue Velocity</span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +23.8%
                </span>
              </div>
              <div className="h-44 w-full flex items-end justify-between gap-1.5 pt-4">
                {[45, 60, 52, 70, 85, 65, 95, 110, 88, 120, 135, 148].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-sm hover:from-purple-500 hover:to-pink-500 transition-all duration-300 cursor-pointer"
                      style={{ height: `${(h / 150) * 100}%` }}
                    />
                    <span className="text-[9px] text-zinc-600 font-bold hidden sm:block">M{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Mock widgets */}
          <div className="space-y-4">
            {/* Live Campaign funnel widget */}
            <div className="glass-card rounded-xl p-4 border border-zinc-900/80 space-y-3">
              <span className="text-xs font-bold text-zinc-400">Campaign Dispatches</span>
              <div className="space-y-2.5">
                {[
                  { label: 'Sent Messages', count: '100%', val: '9,500', color: 'bg-purple-500/20 text-purple-400' },
                  { label: 'Delivered', count: '94.7%', val: '9,000', color: 'bg-blue-500/20 text-blue-400' },
                  { label: 'Opened', count: '62.2%', val: '5,909', color: 'bg-indigo-500/20 text-indigo-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-zinc-900/50 border border-zinc-850">
                    <span className="text-zinc-500 font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.val}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.color}`}>{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI segment rules mock */}
            <div className="glass-card rounded-xl p-4 border border-zinc-900/80 space-y-3">
              <span className="text-xs font-bold text-zinc-400">AI Prompt Input</span>
              <div className="text-[11px] font-mono text-zinc-400 p-2.5 rounded bg-zinc-900 border border-zinc-850 italic">
                "Find inactive shoppers with spends &gt; ₹10,000"
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">Days Inactive &gt; 60</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">GMV &gt; ₹10k</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Live Platform Metrics Panel */}
      <div className="mt-20 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center animate-fade-in-up">
        {[
          { label: 'Messages Sent', val: '1.2M+', icon: Send, color: 'text-purple-400' },
          { label: 'Conversion Uplift', val: '+23.8%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Client Retention', val: '99.9%', icon: ShieldCheck, color: 'text-blue-400' },
          { label: 'AI Parse Speed', val: '320ms', icon: Zap, color: 'text-yellow-400' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card rounded-xl p-4 border border-zinc-900/60 bg-zinc-950/20 hover:border-zinc-800 transition-colors flex flex-col items-center justify-center gap-1.5">
              <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-850 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">{stat.val}</span>
              <span className="text-xxs text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
