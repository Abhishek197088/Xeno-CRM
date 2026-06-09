'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Send,
  MailOpen,
  MousePointerClick,
  Target,
  BadgeAlert,
  Loader2,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  HelpCircle,
  FileText,
  Bookmark
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

interface CampaignDetail {
  id: string;
  name: string;
  channel: string;
  message: string;
  status: string;
  createdAt: string;
  segment: { name: string } | null;
  stats: CampaignStats;
  communications: Array<{
    id: string;
    status: string;
    sentAt: string;
    content: string;
    customer: { id: string; name: string; email: string; city: string };
  }>;
}

interface InsightsResponse {
  campaignId: string;
  stats: any;
  insights: {
    analysis: string;
    recommendations: string[];
  };
  usedAi: boolean;
}

const FUNNEL_COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export default function CampaignDetail() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = params.id as string;

  const [aiInsights, setAiInsights] = useState<{ analysis: string; recommendations: string[] } | null>(null);

  // Query detailed campaign stats
  const { data: campaign, isLoading, error } = useQuery<CampaignDetail>({
    queryKey: ['campaignDetail', campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch campaign details');
      return res.json();
    },
    refetchInterval: 5000,
  });

  // Mutation to request AI insights
  const insightsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
      if (!res.ok) throw new Error('Failed to generate insights');
      return res.json();
    },
    onSuccess: (data: InsightsResponse) => {
      setAiInsights(data.insights);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 w-24 bg-zinc-900 rounded" />
        <div className="h-20 bg-zinc-900 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-950/30 p-4 border border-red-900/30 text-red-500">
          <BadgeAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-200">Campaign not found</h2>
        <p className="text-sm text-zinc-500">The requested campaign does not exist or may have been deleted.</p>
        <Link href="/campaigns" className="text-sm text-purple-400 font-semibold hover:underline">
          Return to campaigns list
        </Link>
      </div>
    );
  }

  const funnelData = [
    { name: 'Sent', value: campaign.stats.sent },
    { name: 'Delivered', value: campaign.stats.delivered },
    { name: 'Opened', value: campaign.stats.opened },
    { name: 'Clicked', value: campaign.stats.clicked },
    { name: 'Converted', value: campaign.stats.converted },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Back button & Title */}
      <div className="space-y-4">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">{campaign.name}</h1>
              <span className={`text-xxs px-2.5 py-0.5 rounded-full border uppercase font-bold tracking-wider ${
                campaign.status === 'COMPLETED'
                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                  : campaign.status === 'RUNNING'
                  ? 'bg-purple-950/20 border-purple-900/30 text-purple-400 animate-pulse'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              Channel: <span className="font-semibold text-zinc-300">{campaign.channel}</span> • 
              Target Segment: <span className="font-semibold text-zinc-300">{campaign.segment?.name || 'All Customers'}</span> • 
              Created {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <button
            onClick={() => insightsMutation.mutate()}
            disabled={insightsMutation.isPending || campaign.status === 'DRAFT' || campaign.stats.sent === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-gradient-purple-blue text-white shadow-lg shadow-purple-950/20 hover:scale-102 transition-all cursor-pointer disabled:opacity-40 disabled:hover:scale-100"
          >
            {insightsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Diagnosing metrics...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Performance with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Delivered</span>
          <div className="text-2xl font-bold text-white mt-1.5">{campaign.stats.delivered}</div>
          <p className="text-xxs text-zinc-500 mt-1">Total messages successfully delivered</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Open Rate</span>
          <div className="text-2xl font-bold text-purple-400 mt-1.5">{campaign.stats.openRate}%</div>
          <p className="text-xxs text-purple-900/40 mt-1">Opened messages / Delivered</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">CTR (Click-Through)</span>
          <div className="text-2xl font-bold text-blue-400 mt-1.5">{campaign.stats.clickRate}%</div>
          <p className="text-xxs text-blue-900/40 mt-1">Clicked links / Delivered</p>
        </div>

        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40">
          <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Conversion Rate</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">{campaign.stats.conversionRate}%</div>
          <p className="text-xxs text-emerald-900/40 mt-1">Purchase actions completed</p>
        </div>
      </div>

      {/* AI Insights Panel */}
      {aiInsights && (
        <div className="glass-card rounded-xl p-6 border-purple-500/30 bg-purple-500/5 neon-glow-purple space-y-5 animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-purple-500/10 pb-4">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-bold text-lg text-white font-outfit">AI Campaign Diagnostic</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
              {aiInsights.analysis.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>

            <div className="space-y-2.5 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Bookmark className="h-4 w-4" />
                Actionable Optimization Steps:
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiInsights.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-medium"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 font-bold shrink-0 text-xxs">
                      {idx + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Message Copy & Funnel Chart split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Funnel Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 border border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-white font-outfit">Campaign Performance Funnel</h3>
            <p className="text-xs text-zinc-400">Visualizing customer funnel progression</p>
          </div>
          <div className="h-72 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                  formatter={(val: any) => [Number(val).toLocaleString(), 'Shoppers']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Message copy & Template specs */}
        <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 space-y-4">
          <h3 className="font-bold text-lg text-white font-outfit flex items-center gap-2">
            <FileText className="h-5 w-5 text-zinc-400" />
            Message Template Spec
          </h3>
          <div className="space-y-4 text-xs font-semibold text-zinc-400">
            <div>
              <span className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Channel Format</span>
              <span className="text-zinc-200">{campaign.channel} Message</span>
            </div>
            <div>
              <span className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Unrendered Template</span>
              <p className="italic font-serif text-zinc-300 bg-zinc-900/40 p-4 border border-zinc-900 rounded-lg normal-case font-medium leading-relaxed">
                "{campaign.message}"
              </p>
            </div>
            <div className="border-t border-zinc-900 pt-4 flex justify-between text-xxs text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Target count: {campaign.communications.length} customers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Communications dispatches feed table */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl text-white font-outfit">Message Dispatch logs</h3>
        <div className="glass-card rounded-xl border border-zinc-800/80 overflow-hidden">
          {campaign.communications.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/10 rounded-xl">
              No dispatch logs recorded. Launch the campaign to trigger messages!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900/80 text-zinc-300 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Personalized Message Copy</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Time Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {campaign.communications.map((comm) => (
                    <tr key={comm.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-semibold">{comm.customer.name}</span>
                          <span className="text-zinc-500 text-xs mt-0.5">{comm.customer.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300 font-serif italic text-xs max-w-sm truncate">
                        "{comm.content}"
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xxs px-2 py-0.5 rounded-full border uppercase ${
                          comm.status === 'CONVERTED'
                            ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                            : comm.status === 'FAILED'
                            ? 'bg-red-950/20 border-red-900/30 text-red-400'
                            : comm.status === 'OPENED' || comm.status === 'CLICKED'
                            ? 'bg-purple-950/20 border-purple-900/30 text-purple-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {comm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {new Date(comm.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
