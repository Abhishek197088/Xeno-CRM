'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Send,
  Sparkles,
  MessageSquare,
  Users,
  Play,
  Mail,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Eye,
  Plus,
  Loader2,
  Calendar,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';

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

interface CampaignItem {
  id: string;
  name: string;
  segmentName: string;
  segmentId: string | null;
  channel: string;
  message: string;
  status: string;
  createdAt: string;
  stats: CampaignStats;
}

interface SegmentOption {
  id: string;
  name: string;
  audienceSize: number;
}

export default function Campaigns() {
  const queryClient = useQueryClient();
  
  // Page panels state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [step, setStep] = useState(1);
  
  // Campaign Creator Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    segmentId: '',
    channel: 'WhatsApp',
    message: '',
  });

  // Copilot recommendations response state
  const [copilotSuggestion, setCopilotSuggestion] = useState<{
    segmentName: string;
    channel: string;
    expectedOpenRate: number;
    generatedMessage: string;
    rules: any[];
    audienceSize: number;
  } | null>(null);

  // Fetch campaigns
  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery<CampaignItem[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds to show live event metrics during active dispatches!
  });

  // Fetch segments for manual creation select dropdown
  const { data: segments } = useQuery<SegmentOption[]>({
    queryKey: ['segmentsList'],
    queryFn: async () => {
      const res = await fetch('/api/segments');
      if (!res.ok) throw new Error('Failed to fetch segments');
      return res.json();
    },
  });

  // Mutation to parse copilot prompt
  const copilotMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Copilot failed to generate campaign strategy');
      return res.json();
    },
    onSuccess: (data) => {
      setCopilotSuggestion(data);
      // Pre-fill creation form with AI suggestions
      setCampaignForm({
        name: `Campaign: ${data.segmentName}`,
        segmentId: '', // Pre-filled rules will generate segment later or map to nearest
        channel: data.channel,
        message: data.generatedMessage,
      });
      setIsCreateOpen(true);
      setStep(1);
    },
  });

  // Mutation to create campaign draft
  const createCampaignMutation = useMutation({
    mutationFn: async (payload: typeof campaignForm) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create campaign draft');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreateOpen(false);
      setCopilotSuggestion(null);
      setCampaignForm({ name: '', segmentId: '', channel: 'WhatsApp', message: '' });
      setStep(1);
      alert('Campaign draft created successfully!');
    },
  });

  // Mutation to launch campaign
  const launchCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
      if (!res.ok) throw new Error('Failed to launch campaign');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      alert('Campaign launch successfully scheduled. Dispatching messages now!');
    },
  });

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotPrompt.trim()) return;
    copilotMutation.mutate(copilotPrompt);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.message) {
      alert('Please fill out campaign name and message copy');
      return;
    }
    
    // If copilot suggestion is present, save the segment first
    if (copilotSuggestion) {
      // Create segment first
      const saveSegmentPayload = {
        name: copilotSuggestion.segmentName,
        description: `AI generated segment for prompt: ${copilotPrompt}`,
        nlpQuery: copilotPrompt,
        rules: copilotSuggestion.rules,
      };

      fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveSegmentPayload),
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((seg) => {
          // Now create campaign with newly created segment ID
          createCampaignMutation.mutate({
            ...campaignForm,
            segmentId: seg.id,
          });
        })
        .catch(() => {
          // If segment save fails, fallback to creating campaign without segment
          createCampaignMutation.mutate(campaignForm);
        });
    } else {
      // Create campaign manually
      createCampaignMutation.mutate(campaignForm);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return Mail;
      case 'sms':
        return Smartphone;
      default:
        return MessageSquare; // WhatsApp
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">Campaign Manager</h1>
          <p className="text-sm text-zinc-400 mt-1">Design, execute, and monitor marketing campaigns with AI Copilot support.</p>
        </div>
        <button
          onClick={() => {
            setCopilotSuggestion(null);
            setStep(1);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer self-start btn-interactive"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </div>

      {/* Campaign Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Campaigns History List Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-xl text-white font-outfit flex items-center gap-2">
            Dispatched Campaigns
            {campaigns && campaigns.some((c) => c.status === 'RUNNING') && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            )}
          </h3>

          {isLoadingCampaigns ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            </div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 bg-zinc-900/10 rounded-xl border border-zinc-900 border-dashed">
              No campaigns created yet. Build one using the AI Copilot on the right!
            </div>
          ) : (
            <div className="space-y-5">
              {campaigns.map((campaign) => {
                const ChannelIcon = getChannelIcon(campaign.channel);
                return (
                  <div
                    key={campaign.id}
                    className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40 hover:border-zinc-750 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-white font-outfit">{campaign.name}</h4>
                          <span className={`text-xxs px-2 py-0.5 rounded-full border uppercase ${
                            campaign.status === 'COMPLETED'
                              ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 font-bold'
                              : campaign.status === 'RUNNING'
                              ? 'bg-purple-950/20 border-purple-900/30 text-purple-400 font-bold animate-pulse'
                              : campaign.status === 'FAILED'
                              ? 'bg-red-950/20 border-red-900/30 text-red-400 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Target Segment: <span className="font-semibold text-zinc-300">{campaign.segmentName}</span>
                        </p>
                      </div>
                      
                      {/* Launch / Details button options */}
                      <div className="flex items-center gap-2">
                        {campaign.status === 'DRAFT' && (
                          <button
                            onClick={() => launchCampaignMutation.mutate(campaign.id)}
                            disabled={launchCampaignMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer btn-interactive"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Launch
                          </button>
                        )}
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors btn-interactive"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Analytics
                        </Link>
                      </div>
                    </div>

                    {/* Stats metrics block */}
                    {campaign.status !== 'DRAFT' && (
                      <div className="grid grid-cols-5 gap-2 bg-zinc-900/30 border border-zinc-900/60 p-3 rounded-lg text-center text-xs font-semibold">
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 text-xxs font-bold uppercase">Sent</span>
                          <div className="text-white">{campaign.stats.sent}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 text-xxs font-bold uppercase">Delivered</span>
                          <div className="text-white">{campaign.stats.delivered}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 text-xxs font-bold uppercase">Open Rate</span>
                          <div className="text-purple-400">{campaign.stats.openRate}%</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 text-xxs font-bold uppercase">CTR</span>
                          <div className="text-blue-400">{campaign.stats.clickRate}%</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-zinc-500 text-xxs font-bold uppercase">Conversions</span>
                          <div className="text-emerald-400">{campaign.stats.conversionRate}%</div>
                        </div>
                      </div>
                    )}

                    {/* Message Template preview */}
                    <div className="flex items-start gap-2 text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded border border-zinc-900/80">
                      <ChannelIcon className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                      <p className="italic font-serif line-clamp-1">"{campaign.message}"</p>
                    </div>

                    <div className="flex items-center justify-between text-xxs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Campaign Copilot Chat panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 space-y-4 sticky top-6">
            <h3 className="font-bold text-lg text-white font-outfit flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Campaign Copilot
            </h3>
            <p className="text-xs text-zinc-400">Describe the campaign you want to run (e.g. discount for inactive users, VIP electronics launch).</p>
            
            <form onSubmit={handleCopilotSubmit} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Type your campaign goal..."
                value={copilotPrompt}
                onChange={(e) => setCopilotPrompt(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />
              <button
                type="submit"
                disabled={copilotMutation.isPending || !copilotPrompt.trim()}
                className="w-full py-2 rounded bg-gradient-purple-blue text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 btn-interactive"
              >
                {copilotMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing strategy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Ask Copilot
                  </>
                )}
              </button>
            </form>

            {/* Quick tips list */}
            <div className="text-xxs text-zinc-500 space-y-2 border-t border-zinc-900 pt-4 font-semibold uppercase tracking-wider">
              <span>Pro Suggestions:</span>
              <ul className="list-disc list-inside space-y-1 normal-case text-zinc-400 tracking-normal font-medium">
                <li>"Campaign for inactive customers"</li>
                <li>"Early access sale for high spenders"</li>
                <li>"Welcome gift for Delhi signups"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Campaign Modal (Wizard) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-card rounded-2xl border border-zinc-800 bg-zinc-950 w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/30">
              <h3 className="font-bold text-base text-white font-outfit flex items-center gap-2">
                {copilotSuggestion ? (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                    AI Campaign Strategies
                  </>
                ) : (
                  'New Campaign Setup Wizard'
                )}
              </h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setCopilotSuggestion(null);
                }}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Wizard Progress Line */}
            <div className="px-6 py-3.5 border-b border-zinc-900 bg-zinc-900/10">
              <div className="flex items-center justify-between">
                {[
                  { s: 1, label: 'Audience' },
                  { s: 2, label: 'Message Copy' },
                  { s: 3, label: 'Live Preview' },
                  { s: 4, label: 'Review' }
                ].map((item) => (
                  <div key={item.s} className="flex items-center gap-2">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border transition-all",
                      step >= item.s
                        ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    )}>
                      {item.s}
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase hidden sm:inline",
                      step === item.s ? "text-purple-400" : "text-zinc-500"
                    )}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Suggestion metrics card */}
            {copilotSuggestion && step === 1 && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                <div className="space-y-0.5 border-r border-purple-500/15">
                  <span className="text-purple-400 text-xxs font-bold uppercase">Audience</span>
                  <div className="text-white">{copilotSuggestion.audienceSize} shoppers</div>
                </div>
                <div className="space-y-0.5 border-r border-purple-500/15">
                  <span className="text-purple-400 text-xxs font-bold uppercase">Channel</span>
                  <div className="text-white">{copilotSuggestion.channel}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-purple-400 text-xxs font-bold uppercase">Exp. CTR</span>
                  <div className="text-purple-300 font-bold flex items-center justify-center gap-0.5">
                    <TrendingUp className="h-3 w-3 text-purple-400" />
                    {copilotSuggestion.expectedOpenRate}%
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5 text-sm">
              
              {/* STEP 1: CHOOSE AUDIENCE */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Campaign Name</label>
                    <input
                      type="text"
                      required
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      placeholder="e.g. Summer Clearance Offer"
                      className="w-full bg-zinc-900 border border-zinc-850 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {!copilotSuggestion && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Target Customer Segment</label>
                      <select
                        value={campaignForm.segmentId}
                        onChange={(e) => setCampaignForm({ ...campaignForm, segmentId: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="">All Customers</option>
                        {segments?.map((seg) => (
                          <option key={seg.id} value={seg.id}>
                            {seg.name} ({seg.audienceSize} shoppers)
                          </option>
                        ))}
                      </select>
                      <p className="text-xxs text-zinc-500 mt-1">Select one of your saved CRM segments or use AI Copilot to generate new ones.</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: WRITE MESSAGE COPY */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Dispatch Channel</label>
                    <select
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-400">Message Copy Template</label>
                      <button
                        type="button"
                        onClick={() => {
                          setCampaignForm({
                            ...campaignForm,
                            message: campaignForm.message + " 🔥 Limited time discount! Use coupon CODE20."
                          });
                        }}
                        className="text-xxs text-purple-400 hover:text-purple-300 font-bold uppercase flex items-center gap-0.5"
                      >
                        <Sparkles className="h-3 w-3 animate-pulse" /> Optimize Copy
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      required
                      value={campaignForm.message}
                      onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                      placeholder="Hi {{name}}, beat the heat in {{city}}! Get 20% off on electronics. Code SUMMER20."
                      className="w-full bg-zinc-900 border border-zinc-850 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500 resize-none font-serif text-xs leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-xxs text-zinc-500 mt-1.5">
                      <span>Variables: &#123;&#123;name&#125;&#125;, &#123;&#123;city&#125;&#125;, &#123;&#123;total_spend&#125;&#125;</span>
                      <span>Characters: {campaignForm.message.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LIVE PERSONALIZATION PREVIEW */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in-up">
                  <span className="block text-xs font-semibold text-zinc-400">Shopper Interface Preview</span>
                  
                  {/* Smartphone preview frame */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-3 relative">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-850 text-xxs font-bold text-zinc-500">
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Simulated {campaignForm.channel} Communication</span>
                    </div>

                    {/* Chat Bubble rendering */}
                    <div className={cn(
                      "p-3.5 rounded-lg text-xs leading-relaxed max-w-[85%] border",
                      campaignForm.channel.toLowerCase() === 'whatsapp' 
                        ? 'bg-emerald-950/20 border-emerald-900/30 text-zinc-200 ml-2 rounded-tl-none shadow-sm'
                        : campaignForm.channel.toLowerCase() === 'email'
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-300 w-full max-w-full'
                        : 'bg-zinc-800/60 border-zinc-700 text-zinc-200 ml-2 rounded-tl-none shadow-sm'
                    )}>
                      {campaignForm.channel.toLowerCase() === 'email' && (
                        <div className="pb-2 mb-2 border-b border-zinc-900 text-xxs text-zinc-400 space-y-0.5">
                          <div><span className="font-bold text-zinc-500">Subject:</span> Special Offer for You!</div>
                          <div><span className="font-bold text-zinc-500">From:</span> Shopper Engagement Team</div>
                        </div>
                      )}
                      
                      {/* Dynamic evaluation mock values */}
                      <p className="font-serif">
                        {campaignForm.message
                          .replace(/\{\{name\}\}/g, 'Abhishek')
                          .replace(/\{\{city\}\}/g, 'Delhi')
                          .replace(/\{\{total_spend\}\}/g, '₹24,500')
                          .replace(/\{\{last_order\}\}/g, '3 days ago') || "No message template specified."}
                      </p>
                    </div>

                    <div className="text-[10px] text-zinc-500 italic text-right mt-1.5">
                      Interpolated sample variables for: **Abhishek (Delhi, Spent ₹24,500)**
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & LAUNCH */}
              {step === 4 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="p-4 rounded-xl bg-purple-600/5 border border-purple-500/10 space-y-3">
                    <span className="block text-xs font-bold text-purple-400 uppercase tracking-widest">Campaign Overview</span>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 font-semibold block">Campaign Name</span>
                        <span className="text-zinc-200 font-bold">{campaignForm.name}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-semibold block">Target Segment</span>
                        <span className="text-zinc-200 font-bold">
                          {copilotSuggestion ? copilotSuggestion.segmentName : segments?.find(s => s.id === campaignForm.segmentId)?.name || 'All Customers'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-semibold block">Dispatch Channel</span>
                        <span className="text-zinc-200 font-bold">{campaignForm.channel}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-semibold block">Status</span>
                        <span className="text-amber-400 font-bold">Ready to Save</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="px-4 py-2 rounded border border-zinc-850 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1 && !campaignForm.name) {
                        alert('Please fill out campaign name');
                        return;
                      }
                      if (step === 2 && !campaignForm.message) {
                        alert('Please enter a message copy');
                        return;
                      }
                      setStep((s) => s + 1);
                    }}
                    className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer btn-interactive"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setCopilotSuggestion(null);
                      }}
                      className="px-4 py-2 rounded border border-zinc-850 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createCampaignMutation.isPending}
                      className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer btn-interactive"
                    >
                      {createCampaignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm & Save Draft
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
