import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all campaigns with aggregated performance stats
export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        segment: {
          select: {
            name: true,
          },
        },
        events: true,
        communications: true,
      },
    });

    const campaignsWithStats = campaigns.map((campaign) => {
      const sent = campaign.events.filter((e) => e.eventType === 'sent').length;
      const delivered = campaign.events.filter((e) => e.eventType === 'delivered').length;
      const opened = campaign.events.filter((e) => e.eventType === 'opened').length;
      const clicked = campaign.events.filter((e) => e.eventType === 'clicked').length;
      const converted = campaign.events.filter((e) => e.eventType === 'converted').length;
      const failed = campaign.events.filter((e) => e.eventType === 'failed').length;

      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
      const conversionRate = delivered > 0 ? (converted / delivered) * 100 : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        segmentName: campaign.segment?.name || 'All Customers',
        segmentId: campaign.segmentId,
        channel: campaign.channel,
        message: campaign.message,
        status: campaign.status,
        createdAt: campaign.createdAt,
        stats: {
          sent,
          delivered,
          opened,
          clicked,
          converted,
          failed,
          openRate: Math.round(openRate * 10) / 10,
          clickRate: Math.round(clickRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
      };
    });

    return NextResponse.json(campaignsWithStats);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create campaign draft
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, segmentId, channel, message } = body;

    if (!name || !channel || !message) {
      return NextResponse.json({ error: 'Missing required campaign fields (name, channel, message)' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        segmentId: segmentId || null,
        channel,
        message,
        status: 'DRAFT',
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
