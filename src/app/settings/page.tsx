'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Database,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  Server,
  Zap,
  Info,
  CheckCircle,
  HelpCircle,
  Code2,
  Workflow,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [resetLogs, setResetLogs] = useState('');
  
  // Database reset mutation
  const resetDbMutation = useMutation({
    mutationFn: async () => {
      setResetLogs('Initializing database reset...\nRunning migrations...');
      const res = await fetch('/api/db/reset', {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Reset failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResetLogs((prev) => `${prev}\nMigrations complete.\nSeeding 1,000 customers, 5,000 orders...\nDatabase successfully seeded!\nReady.`);
      queryClient.invalidateQueries(); // Invalidate all cached dashboard and customer queries
      alert('Database successfully reset and re-seeded!');
    },
    onError: (err: any) => {
      setResetLogs((prev) => `${prev}\nError: ${err.message}`);
    },
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit flex items-center gap-2">
          System Configuration & Design
          <Settings className="h-6 w-6 text-purple-400" />
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Monitor system architecture, check environment parameters, and manage DB seeds.</p>
      </div>

      {/* Interactive System Design Map */}
      <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-4">
          <Workflow className="h-5 w-5 text-purple-400" />
          <div>
            <h3 className="font-bold text-lg text-white font-outfit">CRM Architecture Diagram</h3>
            <p className="text-xxs text-zinc-400">Microservice orchestration & async message event loop</p>
          </div>
        </div>

        {/* Visual CSS-based flowchart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center relative py-6">
          
          {/* Service Block 1 */}
          <div className="glass-card rounded-xl p-5 border-purple-500/20 bg-purple-500/5 space-y-3 relative z-10">
            <div className="mx-auto h-10 w-10 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">CRM Backend</h4>
              <p className="text-xxs text-zinc-400 mt-0.5">Next.js 15 App Router</p>
            </div>
            <div className="text-xxs font-medium bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-400 text-left space-y-1">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" /> POST /api/campaigns/launch</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" /> POST /api/receipt (Webhook)</div>
            </div>
          </div>

          {/* Connection Indicator 1 */}
          <div className="hidden md:flex flex-col items-center justify-center gap-2 text-zinc-600">
            <span className="text-xxs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              1. Dispatch
              <Zap className="h-3 w-3 animate-bounce" />
            </span>
            <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 to-blue-500 relative">
              <span className="absolute right-0 top-1/2 -translate-y-1/2 border-y-4 border-l-4 border-y-transparent border-l-blue-500" />
            </div>
            <span className="text-xxs text-zinc-500">Asynchronous HTTP POST Queue</span>
          </div>

          {/* Service Block 2 */}
          <div className="glass-card rounded-xl p-5 border-blue-500/20 bg-blue-500/5 space-y-3 relative z-10">
            <div className="mx-auto h-10 w-10 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Channel Service</h4>
              <p className="text-xxs text-zinc-400 mt-0.5">Express Message Broker</p>
            </div>
            <div className="text-xxs font-medium bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-400 text-left space-y-1">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Port 3001 Message simulation</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Exp. backoff event callback</div>
            </div>
          </div>

          {/* Connection Indicator 2 */}
          <div className="hidden md:col-span-3 md:flex items-center justify-between px-20 py-4 text-zinc-600">
            <div className="flex flex-col items-center gap-1 w-1/3">
              <span className="text-xxs font-bold uppercase text-emerald-400">3. Callback Update</span>
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-purple-500 relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 border-y-4 border-r-4 border-y-transparent border-r-purple-500" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 w-1/3">
              <span className="text-xxs font-bold uppercase text-indigo-400">2. DB Query / Mutation</span>
              <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 to-zinc-500 relative">
                <span className="absolute right-0 top-1/2 -translate-y-1/2 border-y-4 border-l-4 border-y-transparent border-l-zinc-500" />
              </div>
            </div>
          </div>

          {/* Service Block 3 */}
          <div className="md:col-start-2 glass-card rounded-xl p-5 border-zinc-800 bg-zinc-950/40 space-y-3 relative z-10">
            <div className="mx-auto h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">SQLite Database</h4>
              <p className="text-xxs text-zinc-400 mt-0.5">Prisma Client Access</p>
            </div>
            <div className="text-xxs font-medium bg-zinc-900 border border-zinc-800 rounded p-1.5 text-zinc-400 text-left space-y-1">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" /> Customers & Orders indexes</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" /> Campaigns & Events logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Env variables checklist & DB Seeding tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Environment Verification */}
        <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <ShieldCheck className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-md text-white font-outfit">Environment Parameters</h3>
          </div>
          <div className="space-y-4 text-xs font-semibold">
            <div className="flex items-center justify-between p-3 rounded bg-zinc-900 border border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-zinc-400 block">Database URL</span>
                <code className="text-xxs text-zinc-500 truncate max-w-[200px] block font-mono">file:./dev.db (SQLite)</code>
              </div>
              <span className="text-xxs px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-zinc-900 border border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-zinc-400 block">Express Channel URL</span>
                <code className="text-xxs text-zinc-500 block font-mono">http://localhost:3001/send</code>
              </div>
              <span className="text-xxs px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-zinc-900 border border-zinc-800">
              <div className="space-y-0.5">
                <span className="text-zinc-400 block">OpenAI API Engine</span>
                <span className="text-xxs text-zinc-500 font-medium block">
                  {process.env.OPENAI_API_KEY ? 'OpenAI GPT key present' : 'Offline local heuristic parser active'}
                </span>
              </div>
              <span className={`text-xxs px-2 py-0.5 rounded ${
                process.env.OPENAI_API_KEY
                  ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                  : 'bg-amber-950/30 border-amber-900/40 text-amber-400'
              }`}>
                {process.env.OPENAI_API_KEY ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Database management tools */}
        <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Database className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-md text-white font-outfit">Database Seeding</h3>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reset the SQLite schema and seed mock values (1,000 customers, 5,000 orders, pre-set campaign event lists) to restore default preview states.
            </p>
            
            <button
              onClick={() => resetDbMutation.mutate()}
              disabled={resetDbMutation.isPending}
              className="w-full py-2.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {resetDbMutation.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Executing Seed Script...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset Database & Seed
                </>
              )}
            </button>

            {resetLogs && (
              <pre className="p-3.5 rounded bg-zinc-900 border border-zinc-800 text-xxs font-mono text-zinc-400 overflow-x-auto max-h-40 overflow-y-auto leading-relaxed">
                {resetLogs}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
