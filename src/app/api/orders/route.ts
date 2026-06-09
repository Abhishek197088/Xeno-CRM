import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET orders list with filtering and search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Build query conditions
    const whereClause: any = {};
    
    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.customer = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      };
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { orderDate: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    // Calculate overall statistics for this filtered view
    const allFilteredOrders = await prisma.order.findMany({
      where: whereClause,
      select: { amount: true }
    });
    const totalRevenue = allFilteredOrders.reduce((sum, o) => sum + o.amount, 0);

    return NextResponse.json({
      orders,
      totalRevenue,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, amount, category, orderDate } = body;

    if (!customerId || amount === undefined || !category) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const order = await prisma.order.create({
      data: {
        customerId,
        amount: parseFloat(String(amount)),
        category,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
