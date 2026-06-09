'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Find customers inactive for 60 days",
  "Create a win-back campaign for fashion shoppers",
  "Generate a weekend electronics promotion",
  "Recommend the best channel for high-GMV buyers"
];

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am your Xeno AI Copilot. I can translate natural language into customer segments, write high-converting campaign copies, suggest channels, and predict conversion lift. Ask me anything!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat panel to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, streamingText]);

  // Simulate AI streaming response typing effect
  const simulateStreamingText = (fullText: string) => {
    setStreamingText('');
    let index = 0;
    const interval = setInterval(() => {
      setStreamingText((prev) => prev + fullText.charAt(index));
      index++;
      if (index >= fullText.length) {
        clearInterval(interval);
        setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
        setStreamingText('');
      }
    }, 12);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setInputValue('');
    setIsThinking(true);

    try {
      // Hit the real backend AI Copilot api or segment api
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setIsThinking(false);
      
      const formattedResponse = `🤖 **Copilot Strategy Recommendation**:\n\n` +
        `• **Suggested Segment**: "${data.segmentName}" (Matches ~${data.audienceSize} customers)\n` +
        `• **Recommended Channel**: ${data.channel}\n` +
        `• **Expected Open Rate**: ${data.expectedOpenRate}%\n\n` +
        `📝 **Generated Campaign Message Copy**:\n` +
        `*"${data.generatedMessage}"*\n\n` +
        `⚡ You can preview and launch this campaign directly inside the Campaign Manager tab. Let me know if you would like me to adjust the tone!`;

      simulateStreamingText(formattedResponse);
    } catch (error) {
      setIsThinking(false);
      // Fallback response if API fails or mock behavior
      const fallbackText = `Here is a custom recommendation for your goal:\n\n` +
        `• **Audience Segment**: VIP High-Spenders (Spent > ₹15,000)\n` +
        `• **Suggested Channel**: WhatsApp (Highest conversion velocity for luxury items)\n` +
        `• **Campaign Copy Draft**: "Hi {{name}}, we have a special preview of our latest premium collection. Use code VIP20 at checkout for 20% off!"\n\n` +
        `Let me know if you'd like to refine this segmentation criteria.`;
      
      simulateStreamingText(fallbackText);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit flex items-center gap-2">
            AI Assistant Copilot
            <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Chat naturally to build segments, draft copies, and analyze marketing outcomes.</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
          <Zap className="h-3.5 w-3.5 fill-current" />
          GPT-4o-Mini Engine Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Suggested Prompts & Orb column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Animated 3D Floating AI Orb */}
          <div className="glass-card rounded-xl p-6 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-4 overflow-hidden relative min-h-[180px]">
            {/* The Orb */}
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-400 blur-sm animate-pulse" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-bl from-purple-500 via-pink-500 to-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="absolute inset-2.5 rounded-full bg-zinc-950 flex items-center justify-center border border-white/10">
                <Bot className="h-7 w-7 text-purple-400 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-white">Xeno AI Hub</span>
              <p className="text-xxs text-zinc-500 mt-1 leading-normal">Ready to process segments and optimize revenue funnels.</p>
            </div>
          </div>

          {/* Quick Suggestions list */}
          <div className="glass-card rounded-xl p-5 border border-zinc-800 space-y-3">
            <span className="text-xxs font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Quick suggestions
            </span>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isThinking || !!streamingText}
                  className="text-left text-xs p-2.5 rounded-lg border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center justify-between group btn-interactive"
                >
                  <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ChatGPT Chat Interface panel */}
        <div className="lg:col-span-3 glass-card rounded-xl border border-zinc-800 overflow-hidden flex flex-col h-[600px] shadow-2xl bg-zinc-950/20">
          {/* Top chat status */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/40">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-zinc-300">Live Assistant Session</span>
            </div>
            <button 
              onClick={() => setMessages([{ role: 'assistant', content: 'Session restarted. How can I assist you today?' }])}
              className="p-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              title="Reset Chat Session"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Chat Messages Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 items-start max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 border-zinc-700 text-purple-400'
                    : 'bg-purple-600/10 border-purple-500/25 text-purple-400'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div className={`rounded-xl p-4 text-sm leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-purple-600/10 border-purple-500/20 text-white font-medium shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-850 text-zinc-300 whitespace-pre-line'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Simulated Streaming text animation bubble */}
            {streamingText && (
              <div className="flex gap-4 items-start max-w-3xl">
                <div className="h-8 w-8 rounded-full bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-xl p-4 text-sm leading-relaxed border bg-zinc-900/60 border-zinc-850 text-zinc-300 whitespace-pre-line">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-400 animate-pulse align-middle" />
                </div>
              </div>
            )}

            {/* AI thinking/typing bubble */}
            {isThinking && (
              <div className="flex gap-4 items-start">
                <div className="h-8 w-8 rounded-full bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-xl p-4 border bg-zinc-900/60 border-zinc-850 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input area */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-900/20">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isThinking || !!streamingText}
                placeholder="Ask AI Copilot to generate segments or campaigns..."
                className="w-full bg-zinc-900 border border-zinc-850 rounded-xl pl-4 pr-12 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isThinking || !!streamingText}
                className="absolute right-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-all cursor-pointer btn-interactive"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
