import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getCopilotFallback } from '@/lib/aiFallback';
import { getMatchingCustomers } from '@/lib/segmentEvaluator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const totalCustomers = await prisma.customer.count();
    let copilotResult: any = null;
    let usedAi = false;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a Senior SaaS CRM Campaign Strategist and Copywriter.
Given a prompt describing a marketing objective, suggest a campaign design.
Return a valid JSON object matching this schema:
{
  "segmentName": "string describing the target group",
  "rules": [
    {
      "field": "city" | "age" | "gender" | "total_spend" | "order_count" | "last_order_days" | "category",
      "op": "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "contains",
      "val": any
    }
  ],
  "channel": "WhatsApp" | "Email" | "SMS",
  "expectedOpenRate": number (1 to 100 representing percentage),
  "generatedMessage": "highly personalized campaign copy. Must include relevant placeholders like {{name}}, {{city}}, {{total_spend}}, and {{last_order}} depending on context."
}

Ensure:
- Messages are warm, premium, and call-to-action oriented.
- WhatsApp messages are short and direct, Email is longer and professional, SMS is concise (under 160 chars).
- The rules array translates to a segment targeting customers related to the prompt.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          copilotResult = JSON.parse(content);
          usedAi = true;
        }
      } catch (err: any) {
        console.warn('OpenAI Copilot failed. Falling back to local template engine.', err.message);
      }
    }

    // Fall back if OpenAI key not configured or fails
    if (!usedAi || !copilotResult) {
      copilotResult = getCopilotFallback(prompt, totalCustomers);
    }

    // Calculate actual audience size dynamically based on segment rules generated
    let actualAudienceSize = 0;
    try {
      const matched = await getMatchingCustomers(copilotResult.rules);
      actualAudienceSize = matched.length;
    } catch (e) {
      actualAudienceSize = copilotResult.audienceSize || Math.floor(totalCustomers * 0.25);
    }

    return NextResponse.json({
      ...copilotResult,
      audienceSize: actualAudienceSize,
      usedAi,
    });
  } catch (error: any) {
    console.error('Error in AI Campaign Copilot:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
