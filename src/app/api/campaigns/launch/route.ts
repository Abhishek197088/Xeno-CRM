import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMatchingCustomers, getCustomerStats, Rule } from '@/lib/segmentEvaluator';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001/send';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'RUNNING') {
      return NextResponse.json({ error: 'Campaign is already running' }, { status: 400 });
    }

    // Set status to RUNNING
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'RUNNING' },
    });

    // Run dispatch asynchronously
    dispatchCampaign(campaign).catch((err) => {
      console.error(`[Async Campaign Dispatch Error] Campaign ${campaignId}:`, err);
      prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' },
      }).catch(console.error);
    });

    return NextResponse.json({ message: 'Campaign launch initiated', campaignId });
  } catch (error: any) {
    console.error('Error initiating campaign launch:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

async function dispatchCampaign(campaign: any) {
  const campaignId = campaign.id;
  let targetCustomers: any[] = [];

  // Get targeted customers
  if (campaign.segment) {
    let rules: Rule[] = [];
    try {
      rules = JSON.parse(campaign.segment.rules);
    } catch (e) {
      console.error('Failed to parse rules for segment:', campaign.segment.id);
    }
    targetCustomers = await getMatchingCustomers(rules);
  } else {
    // If no segment, send to all customers
    targetCustomers = await getCustomerStats();
  }

  if (targetCustomers.length === 0) {
    console.log(`[Campaign Launch] No target customers for campaign ${campaignId}. Marking as COMPLETED.`);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED' },
    });
    return;
  }

  console.log(`[Campaign Launch] Dispatching to ${targetCustomers.length} customers for campaign ${campaignId}`);

  // Process customer notifications
  for (const customer of targetCustomers) {
    // 1. Personalize message
    const formattedLastOrder = customer.lastOrderDate
      ? new Date(customer.lastOrderDate).toLocaleDateString()
      : 'No previous orders';

    const personalizedMessage = campaign.message
      .replace(/\{\{\s*name\s*\}\}/g, customer.name)
      .replace(/\{\{\s*city\s*\}\}/g, customer.city)
      .replace(/\{\{\s*total_spend\s*\}\}/g, `₹${customer.totalSpend.toFixed(2)}`)
      .replace(/\{\{\s*last_order\s*\}\}/g, formattedLastOrder);

    // 2. Create Communication log in PENDING
    const communication = await prisma.communication.create({
      data: {
        campaignId,
        customerId: customer.id,
        status: 'PENDING',
        content: personalizedMessage,
      },
    });

    // 3. Dispatch to Channel Service (Fire-and-forget or async processing)
    // We fetch in background
    fetch(CHANNEL_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer.id,
        campaignId,
        communicationId: communication.id, // pass down communication ID for precise tracing
        channel: campaign.channel,
        message: personalizedMessage,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        console.error(`[Channel Service API Error] Failed to send message for customer ${customer.id}`);
      }
    }).catch((err) => {
      console.error(`[Channel Service Connection Error] Unreachable:`, err.message);
    });
  }

  // Once all are dispatched to queue, mark campaign as COMPLETED
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'COMPLETED' },
  });
  console.log(`[Campaign Launch] All dispatches successfully queued for campaign ${campaignId}`);
}
