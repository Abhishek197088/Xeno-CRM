'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  Sparkles,
  PieChart as PieIcon,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
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

export default function Analytics() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-9 w-48 bg-zinc-800 rounded-md" />
        <div className="h-96 bg-zinc-900 rounded-xl" />
        <div className="grid grid-cols-2 gap-8">
          <div className="h-80 bg-zinc-900 rounded-xl" />
          <div className="h-80 bg-zinc-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, revenueTrend, categoryData, audienceGrowth, campaignFunnel } = data;

  // Calculate AOV (Average Order Value)
  const aov = kpis.totalOrders > 0 ? kpis.totalRevenue / kpis.totalOrders : 0;

  // Calculate category averages
  const categoryAverages = categoryData.map((cat) => ({
    name: cat.name,
    aov: Math.round(cat.value / (cat.count || 1)),
    volume: cat.count,
    revenue: cat.value,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit flex items-center gap-2">
          Business Analytics
          <BarChart3 className="h-6 w-6 text-purple-400" />
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Deep analysis of customer acquisitions, segment conversions, and sales GMV.</p>
      </div>

      {/* Advanced KPIs row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Average Order Value (AOV)</span>
          <div className="text-2xl font-bold text-white mt-1">₹{Math.round(aov).toLocaleString()}</div>
          <p className="text-xxs text-zinc-500 mt-1">Mean purchase value per logged cart</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Average Customer Lifetime Value (LTV)</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">
            ₹{Math.round(kpis.totalCustomers > 0 ? kpis.totalRevenue / kpis.totalCustomers : 0).toLocaleString()}
          </div>
          <p className="text-xxs text-zinc-500 mt-1">Mean cumulative spend per shopper profile</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Total Store GMV</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">₹{kpis.totalRevenue.toLocaleString()}</div>
          <p className="text-xxs text-zinc-500 mt-1">Sum total of all orders across categories</p>
        </div>
      </div>

      {/* Sales trends split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly sales volume vs revenue growth */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 border border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-white font-outfit">Revenue Generation Trend</h3>
            <p className="text-xs text-zinc-400">Comparing store sales revenue month-over-month</p>
          </div>
          <div className="h-80 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'GMV']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown volumes */}
        <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-white font-outfit">Category Share</h3>
            <p className="text-xs text-zinc-400">Analyzing transaction volume across categories</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryAverages}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="volume"
                  nameKey="name"
                >
                  {categoryAverages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Transactions']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xxs max-h-24 overflow-y-auto pr-1">
            {categoryAverages.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-zinc-400 truncate">{entry.name} ({entry.volume} orders)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AOV & volumes details table */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl text-white font-outfit">Category Spending Metrics</h3>
        <div className="glass-card rounded-xl border border-zinc-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-900/80 text-zinc-300 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product Category</th>
                  <th className="px-6 py-4 text-right">Transaction Volume</th>
                  <th className="px-6 py-4 text-right">Average Order Value (AOV)</th>
                  <th className="px-6 py-4 text-right">Gross Revenue (GMV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {categoryAverages.map((cat, index) => (
                  <tr key={cat.name} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {cat.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-300">{cat.volume} orders</td>
                    <td className="px-6 py-4 text-right text-zinc-300 font-semibold">₹{cat.aov.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-purple-400 font-bold">₹{cat.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
