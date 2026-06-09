import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Core KPIs
    const [totalCustomers, totalOrders, ordersSum, totalCampaigns, allEvents] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { amount: true },
      }),
      prisma.campaign.count({
        where: {
          status: { in: ['COMPLETED', 'RUNNING'] },
        },
      }),
      prisma.event.findMany(),
    ]);

    const totalRevenue = ordersSum._sum.amount || 0;

    // Engagement Metrics
    const sent = allEvents.filter((e) => e.eventType === 'sent').length;
    const delivered = allEvents.filter((e) => e.eventType === 'delivered').length;
    const opened = allEvents.filter((e) => e.eventType === 'opened').length;
    const clicked = allEvents.filter((e) => e.eventType === 'clicked').length;
    const converted = allEvents.filter((e) => e.eventType === 'converted').length;

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const conversionRate = delivered > 0 ? (converted / delivered) * 100 : 0;

    // 2. Revenue Trend (Last 12 Months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const orders = await prisma.order.findMany({
      where: {
        orderDate: { gte: twelveMonthsAgo },
      },
      select: {
        amount: true,
        orderDate: true,
      },
      orderBy: { orderDate: 'asc' },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth: { [key: string]: number } = {};

    // Initialize last 12 months
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      revenueByMonth[key] = 0;
    }

    orders.forEach((order) => {
      const d = new Date(order.orderDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (revenueByMonth[key] !== undefined) {
        revenueByMonth[key] += order.amount;
      }
    });

    const revenueTrend = Object.keys(revenueByMonth).map((month) => ({
      name: month,
      revenue: Math.round(revenueByMonth[month]),
    }));

    // 3. Category Spend (Pie Chart)
    const categoryAggregates = await prisma.order.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoryData = categoryAggregates.map((cat) => ({
      name: cat.category,
      value: Math.round(cat._sum.amount || 0),
      count: cat._count.id,
    }));

    // 4. Audience Growth Trend
    const customers = await prisma.customer.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const signupsByMonth: { [key: string]: number } = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      signupsByMonth[key] = 0;
    }

    customers.forEach((c) => {
      const d = new Date(c.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (signupsByMonth[key] !== undefined) {
        signupsByMonth[key] += 1;
      }
    });

    // Calculate baseline customers before 12 months ago
    const baselineCustomers = await prisma.customer.count({
      where: {
        createdAt: { lt: twelveMonthsAgo },
      },
    });

    let runningTotal = baselineCustomers;
    const audienceGrowth = Object.keys(signupsByMonth).map((month) => {
      runningTotal += signupsByMonth[month];
      return {
        name: month,
        customers: runningTotal,
      };
    });

    // 5. Funnel Chart
    const campaignFunnel = [
      { name: 'Sent', value: sent },
      { name: 'Delivered', value: delivered },
      { name: 'Opened', value: opened },
      { name: 'Clicked', value: clicked },
      { name: 'Converted', value: converted },
    ];

    return NextResponse.json({
      kpis: {
        totalCustomers,
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        totalCampaigns,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      revenueTrend,
      categoryData,
      audienceGrowth,
      campaignFunnel,
    });
  } catch (error: any) {
    console.error('Error generating dashboard stats:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
