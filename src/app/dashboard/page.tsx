'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Send,
  MailOpen,
  MousePointerClick,
  Target,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface DashboardData {
  kpis: {
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    totalCampaigns: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  revenueTrend: Array<{ name: string; revenue: number }>;
  categoryData: Array<{ name: string; value: number; count: number }>;
  audienceGrowth: Array<{ name: string; customers: number }>;
  campaignFunnel: Array<{ name: string; value: number }>;
}

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10 seconds to show live webhook callbacks!
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-zinc-800 rounded-md" />
            <div className="h-4 w-64 bg-zinc-900 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900 rounded-xl border border-zinc-800/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-zinc-900 rounded-xl border border-zinc-800/50" />
          <div className="h-96 bg-zinc-900 rounded-xl border border-zinc-800/50" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-950/30 p-4 border border-red-900/30 text-red-500">
          <Target className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-200">Failed to load dashboard data</h2>
        <p className="text-sm text-zinc-500 max-w-md">Make sure your Prisma database and services are running properly.</p>
      </div>
    );
  }

  const { kpis, revenueTrend, categoryData, audienceGrowth, campaignFunnel } = data;

  const kpiList = [
    { name: 'Total Customers', value: kpis.totalCustomers.toLocaleString(), icon: Users, desc: 'Registered shopper profiles' },
    { name: 'Total Orders', value: kpis.totalOrders.toLocaleString(), icon: ShoppingCart, desc: 'Sales order transaction logs' },
    { name: 'Gross Revenue', value: `₹${kpis.totalRevenue.toLocaleString()}`, icon: TrendingUp, desc: 'Cumulative store GMV' },
    { name: 'Campaigns Dispatched', value: kpis.totalCampaigns.toLocaleString(), icon: Send, desc: 'Live campaigns launched' },
    { name: 'Average Open Rate', value: `${kpis.openRate}%`, icon: MailOpen, desc: 'Delivery-to-read metric' },
    { name: 'Average Click Rate (CTR)', value: `${kpis.clickRate}%`, icon: MousePointerClick, desc: 'Delivery-to-click metric' },
    { name: 'Conversion Rate', value: `${kpis.conversionRate}%`, icon: Target, desc: 'Total Conversion rate' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-200 font-outfit flex items-center gap-2">
            Intelligent CRM Dashboard
            <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time engagement analysis, revenue growth, and campaign logs.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 max-w-fit shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          Live Webhook Callbacks Active
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Render first 4 KPIs in prominent grid */}
        {kpiList.slice(0, 4).map((kpi, idx) => {
          const Icon = kpi.icon;
          const glowClass = 
            idx === 0 ? 'glow-accent-purple' :
            idx === 1 ? 'glow-accent-blue' :
            idx === 2 ? 'glow-accent-emerald' :
            'glow-accent-pink';

          const trendVal = 
            idx === 0 ? '+23.4%' :
            idx === 1 ? '+15.2%' :
            idx === 2 ? '+42.8%' :
            '+38.1%';

          const sparklineStroke =
            idx === 0 ? '#a855f7' :
            idx === 1 ? '#3b82f6' :
            idx === 2 ? '#10b981' :
            '#ec4899';

          return (
            <div
              key={idx}
              className={cn(
                "glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.4)] group",
                glowClass
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">{kpi.name}</span>
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400 transition-all duration-300 group-hover:bg-purple-600/10">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between relative z-10">
                <span className="text-2xl font-extrabold text-zinc-200 tracking-tight">{kpi.value}</span>
                <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <ArrowUpRight className="h-3 w-3" />
                  {trendVal}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5 relative z-10">{kpi.desc}</p>

              {/* Sparkline decoration */}
              <div className="absolute right-4 bottom-2 h-10 w-24 opacity-30 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                  <path
                    d={
                      idx === 0 ? "M 0 25 Q 20 15, 40 20 T 80 5 T 100 2" :
                      idx === 1 ? "M 0 20 Q 25 25, 50 10 T 75 18 T 100 5" :
                      idx === 2 ? "M 0 15 Q 20 28, 40 12 T 80 8 T 100 2" :
                      "M 0 22 Q 25 18, 50 22 T 75 10 T 100 6"
                    }
                    fill="none"
                    stroke={sparklineStroke}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiList.slice(4).map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">{kpi.name}</span>
                <div className="text-xl font-bold text-zinc-200 mt-1">{kpi.value}</div>
                <p className="text-xs text-zinc-500 mt-0.5">{kpi.desc}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend Area Chart */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-zinc-200">Revenue Trend</h3>
              <p className="text-xs text-zinc-400">Monthly gross merchandise value (GMV)</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Conversion Funnel */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-zinc-200">Campaign Funnel</h3>
              <p className="text-xs text-zinc-400">Conversion breakdown of dispatched campaigns</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignFunnel} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {campaignFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Audience Growth Trend */}
        <div className="glass-card rounded-xl p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-zinc-200">Audience Growth</h3>
              <p className="text-xs text-zinc-400">Cumulative customer profile growth over 12 months</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={audienceGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Spend Pie Chart */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-zinc-200">Engagement Analytics</h3>
              <p className="text-xs text-zinc-400">Total consumer spending by category</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Spend']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs max-h-24 overflow-y-auto pr-1">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-zinc-400 truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
