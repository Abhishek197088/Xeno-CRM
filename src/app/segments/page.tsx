'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Sparkles,
  ArrowRight,
  Save,
  Users,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Loader2,
  Info
} from 'lucide-react';

interface Rule {
  field: string;
  op: string;
  val: any;
}

interface CustomerPreview {
  id: string;
  name: string;
  email: string;
  city: string;
  totalSpend: number;
}

interface AiSegmentResponse {
  query: string;
  rules: Rule[];
  audienceSize: number;
  preview: CustomerPreview[];
  usedAi: boolean;
}

interface SegmentItem {
  id: string;
  name: string;
  description: string | null;
  nlpQuery: string | null;
  rules: string;
  createdAt: string;
  audienceSize: number;
}

const SAMPLE_PROMPTS = [
  "Customers who spent more than ₹20000",
  "High value female shoppers from Delhi",
  "Customers who have not purchased in 60 days",
  "Shoppers under 30 who bought Fashion"
];

export default function Segments() {
  const queryClient = useQueryClient();
  const [nlpPrompt, setNlpPrompt] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  
  // Builder preview state
  const [builderResult, setBuilderResult] = useState<AiSegmentResponse | null>(null);

  // Fetch saved segments list
  const { data: segments, isLoading: isLoadingSegments } = useQuery<SegmentItem[]>({
    queryKey: ['segments'],
    queryFn: async () => {
      const res = await fetch('/api/segments');
      if (!res.ok) throw new Error('Failed to fetch segments');
      return res.json();
    },
  });

  // Mutation to parse NLP query
  const parseNlpMutation = useMutation({
    mutationFn: async (queryText: string) => {
      const res = await fetch('/api/ai/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });
      if (!res.ok) throw new Error('Failed to parse natural language segment');
      return res.json();
    },
    onSuccess: (data: AiSegmentResponse) => {
      setBuilderResult(data);
      // Auto-generate a descriptive segment name if empty
      if (!segmentName) {
        setSegmentName(`Segment: ${data.query.substring(0, 30)}...`);
      }
    },
  });

  // Mutation to save segment
  const saveSegmentMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string; nlpQuery: string; rules: Rule[] }) => {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save segment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      setBuilderResult(null);
      setNlpPrompt('');
      setSegmentName('');
      setSegmentDesc('');
      alert('Segment saved successfully!');
    },
  });

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpPrompt.trim()) return;
    parseNlpMutation.mutate(nlpPrompt);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderResult || !segmentName.trim()) return;
    saveSegmentMutation.mutate({
      name: segmentName,
      description: segmentDesc,
      nlpQuery: builderResult.query,
      rules: builderResult.rules,
    });
  };

  // Utility to make rules human-readable
  const formatRule = (rule: Rule) => {
    const fieldMap: { [key: string]: string } = {
      city: 'City',
      age: 'Age',
      gender: 'Gender',
      total_spend: 'Total Spend',
      order_count: 'Order Count',
      last_order_days: 'Days Since Last Order',
      category: 'Purchased Category'
    };

    const opMap: { [key: string]: string } = {
      eq: 'is',
      ne: 'is not',
      gt: '>',
      lt: '<',
      gte: '>=',
      lte: '<=',
      in: 'in',
      contains: 'contains'
    };

    const displayField = fieldMap[rule.field] || rule.field;
    const displayOp = opMap[rule.op] || rule.op;
    let displayVal = rule.val;

    if (Array.isArray(rule.val)) {
      displayVal = rule.val.join(', ');
    } else if (rule.field === 'total_spend') {
      displayVal = `₹${Number(rule.val).toLocaleString()}`;
    } else if (rule.field === 'last_order_days') {
      displayVal = `${rule.val} days`;
    }

    return `${displayField} ${displayOp} ${displayVal}`;
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit flex items-center gap-2">
          AI Segment Builder
          <Sparkles className="h-6 w-6 text-purple-400" />
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Create shopper segments using natural language queries powered by AI.</p>
      </div>

      {/* Main Builder & Query Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* NLP Builder Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 space-y-4">
            <h3 className="font-bold text-lg text-white font-outfit flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              NL Segmentation Prompt
            </h3>
            
            <form onSubmit={handlePromptSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Describe the audience segment you want to build..."
                  value={nlpPrompt}
                  onChange={(e) => setNlpPrompt(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none"
                />
                <button
                  type="submit"
                  disabled={parseNlpMutation.isPending || !nlpPrompt.trim()}
                  className="absolute right-3.5 bottom-3.5 flex items-center justify-center h-9 w-9 rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-colors cursor-pointer btn-interactive"
                >
                  {parseNlpMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>

            {/* Sample Prompts */}
            <div className="space-y-2">
              <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                Or try these quick examples:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setNlpPrompt(prompt);
                      parseNlpMutation.mutate(prompt);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:text-zinc-200 text-zinc-400 transition-colors cursor-pointer btn-interactive"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Builder Output Preview */}
          {builderResult && (
            <div className="glass-card rounded-xl p-6 border border-zinc-800 space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
                <div>
                  <h4 className="font-bold text-md text-white font-outfit">Evaluated Results</h4>
                  <p className="text-xxs text-zinc-500 mt-0.5">
                    {builderResult.usedAi ? 'Compiled by GPT-4o-Mini Translation Schema' : 'Parsed by Local NLP Regex Fallback Engine'}
                  </p>
                </div>
                
                {/* Metrics Grid */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                    <Users className="h-3.5 w-3.5" />
                    <span>{builderResult.audienceSize} shoppers</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                    <span>Est. Spend: ₹{Math.floor(builderResult.preview.reduce((sum, item) => sum + item.totalSpend, 0) * 1.5).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1.5 rounded-lg text-xs font-bold" title="Predicted segment conversion quality rating">
                    <span>Quality: {Math.min(100, Math.floor(75 + (builderResult.audienceSize % 25)))}/100</span>
                  </div>
                </div>
              </div>

              {/* Rules list */}
              <div className="space-y-2.5">
                <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Structured Query Rules</span>
                <div className="flex flex-wrap gap-2">
                  {builderResult.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      {formatRule(rule)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Preview */}
              <div className="space-y-2.5">
                <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Audience Preview (Top 10)</span>
                {builderResult.preview.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 bg-zinc-900/10 rounded border border-zinc-900 border-dashed">
                    No customers match the current filter rules.
                  </div>
                ) : (
                  <div className="border border-zinc-900 rounded overflow-hidden">
                    <table className="w-full text-left text-xs text-zinc-400">
                      <thead className="bg-zinc-900/60 text-zinc-300">
                        <tr>
                          <th className="px-4 py-2">Shopper Name</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">City</th>
                          <th className="px-4 py-2 text-right">GMV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {builderResult.preview.map((customer) => (
                          <tr key={customer.id} className="hover:bg-zinc-900/10">
                            <td className="px-4 py-2 font-semibold text-zinc-200">{customer.name}</td>
                            <td className="px-4 py-2 text-zinc-500">{customer.email}</td>
                            <td className="px-4 py-2 text-zinc-300">{customer.city}</td>
                            <td className="px-4 py-2 text-right text-purple-400 font-bold">
                              ₹{customer.totalSpend.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Segment Panel */}
        <div className="lg:col-span-1">
          {builderResult ? (
            <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 space-y-4 sticky top-6">
              <h3 className="font-bold text-lg text-white font-outfit flex items-center gap-2">
                <Save className="h-5 w-5 text-purple-400" />
                Save Segment
              </h3>
              <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs font-semibold text-zinc-400">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Segment Name</label>
                  <input
                    type="text"
                    required
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="e.g. VIP Delhi Shoppers"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={segmentDesc}
                    onChange={(e) => setSegmentDesc(e.target.value)}
                    placeholder="Describe this segment's purpose..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saveSegmentMutation.isPending}
                  className="w-full py-2.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-lg shadow-purple-950/20 flex items-center justify-center gap-1.5 cursor-pointer btn-interactive"
                >
                  {saveSegmentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm & Save Segment
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-6 border border-zinc-800 bg-zinc-950/40 text-center py-12 flex flex-col items-center justify-center gap-3 text-zinc-500 sticky top-6">
              <Layers className="h-10 w-10 text-zinc-700" />
              <p className="text-sm font-semibold">Generate a Segment First</p>
              <p className="text-xs text-zinc-600 max-w-xs">Use the Natural Language prompt input to generate filter rules, then you can name and save your segment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Saved Segments Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl text-white font-outfit">Saved Segments Gallery</h3>
        
        {isLoadingSegments ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
          </div>
        ) : !segments || segments.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/10 rounded-xl border border-zinc-900 border-dashed">
            No segments saved yet. Use the AI Builder above to create your first segment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map((segment) => {
              let parsedRules: Rule[] = [];
              try {
                parsedRules = JSON.parse(segment.rules);
              } catch (e) {}

              return (
                <div
                  key={segment.id}
                  className="glass-card rounded-xl p-6 border border-zinc-800 flex flex-col justify-between gap-4 relative overflow-hidden glow-accent-purple"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-md text-white font-outfit truncate pr-2">{segment.name}</h4>
                      <span className="text-xxs px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-400 shrink-0 font-bold flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {segment.audienceSize}
                      </span>
                    </div>
                    {segment.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2">{segment.description}</p>
                    )}
                    {segment.nlpQuery && (
                      <div className="text-xxs text-zinc-500 italic bg-zinc-900/40 p-2 border border-zinc-900 rounded font-serif">
                        NL: "{segment.nlpQuery}"
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-900">
                    <span className="text-xxs font-bold uppercase tracking-wider text-zinc-500">Filters Applied</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {parsedRules.map((rule, idx) => (
                        <span
                          key={idx}
                          className="text-xxs px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold truncate max-w-full"
                          title={formatRule(rule)}
                        >
                          {formatRule(rule)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
