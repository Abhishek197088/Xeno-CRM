import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, customerId, eventType, timestamp, communicationId } = body;

    if (!campaignId || !customerId || !eventType) {
      return NextResponse.json({ error: 'Missing parameters (campaignId, customerId, eventType)' }, { status: 400 });
    }

    console.log(`[Webhook Receipt] Campaign: ${campaignId}, Customer: ${customerId}, Event: ${eventType}`);

    // Find the communication record
    let communication = null;
    if (communicationId) {
      communication = await prisma.communication.findUnique({
        where: { id: communicationId },
      });
    }

    if (!communication) {
      // Fallback: Find the latest communication log for this campaign + customer
      communication = await prisma.communication.findFirst({
        where: {
          campaignId,
          customerId,
        },
        orderBy: { sentAt: 'desc' },
      });
    }

    // Create Event
    const event = await prisma.event.create({
      data: {
        campaignId,
        customerId,
        communicationId: communication?.id || null,
        eventType: eventType.toLowerCase(),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    // Update Communication status if communication record was found
    if (communication) {
      await prisma.communication.update({
        where: { id: communication.id },
        data: { status: eventType.toUpperCase() },
      });
    }

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('Error processing callback webhook receipt:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
