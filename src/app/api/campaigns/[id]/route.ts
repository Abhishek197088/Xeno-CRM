import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

export async function GET(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        segment: true,
        events: true,
        communications: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                city: true,
              },
            },
          },
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const sent = campaign.events.filter((e) => e.eventType === 'sent').length;
    const delivered = campaign.events.filter((e) => e.eventType === 'delivered').length;
    const opened = campaign.events.filter((e) => e.eventType === 'opened').length;
    const clicked = campaign.events.filter((e) => e.eventType === 'clicked').length;
    const converted = campaign.events.filter((e) => e.eventType === 'converted').length;
    const failed = campaign.events.filter((e) => e.eventType === 'failed').length;

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const conversionRate = delivered > 0 ? (converted / delivered) * 100 : 0;

    return NextResponse.json({
      ...campaign,
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
    });
  } catch (error: any) {
    console.error('Error fetching campaign detail:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
