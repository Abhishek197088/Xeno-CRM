import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getInsightsFallback } from '@/lib/aiFallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        events: true,
        segment: { select: { name: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Compile statistics
    const sent = campaign.events.filter((e) => e.eventType === 'sent').length;
    const delivered = campaign.events.filter((e) => e.eventType === 'delivered').length;
    const opened = campaign.events.filter((e) => e.eventType === 'opened').length;
    const clicked = campaign.events.filter((e) => e.eventType === 'clicked').length;
    const converted = campaign.events.filter((e) => e.eventType === 'converted').length;
    const failed = campaign.events.filter((e) => e.eventType === 'failed').length;

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const conversionRate = delivered > 0 ? (converted / delivered) * 100 : 0;

    const stats = {
      sent,
      delivered,
      opened,
      clicked,
      converted,
      failed,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };

    let insightsResult: any = null;
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
              content: `You are an AI Growth Marketer and Analytics Advisor.
Analyze the provided campaign statistics and copy. Return a JSON object explaining why the campaign performed as it did, highlighting:
- Reasons for the results (open rate, clicks, conversions).
- Audience observations (relevance of the message to the target audience).
- Channel recommendations (if WhatsApp, SMS, or Email was appropriate or if they should switch).
- Specific optimization suggestions for next campaigns.

Return a valid JSON object matching this schema:
{
  "analysis": "detailed markdown paragraph summarizing performance reasons, observations, and channel effectiveness",
  "recommendations": ["list of 3-4 highly actionable and clear recommendations"]
}`,
            },
            {
              role: 'user',
              content: `Campaign Name: ${campaign.name}
Segment Name: ${campaign.segment?.name || 'All Customers'}
Channel: ${campaign.channel}
Message: ${campaign.message}

Campaign Stats:
- Sent: ${stats.sent}
- Delivered: ${stats.delivered} (${((stats.delivered / stats.sent) * 100 || 0).toFixed(1)}%)
- Opened: ${stats.opened} (Open Rate: ${stats.openRate}%)
- Clicked: ${stats.clicked} (Click-through Rate: ${stats.clickRate}%)
- Converted: ${stats.converted} (Conversion Rate: ${stats.conversionRate}%)
- Failed: ${stats.failed}`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          insightsResult = JSON.parse(content);
          usedAi = true;
        }
      } catch (err: any) {
        console.warn('OpenAI Campaign Insights failed. Falling back to local analyzer.', err.message);
      }
    }

    if (!usedAi || !insightsResult) {
      insightsResult = getInsightsFallback(campaign.name, stats);
    }

    return NextResponse.json({
      campaignId,
      stats,
      insights: insightsResult,
      usedAi,
    });
  } catch (error: any) {
    console.error('Error in campaign insights:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
