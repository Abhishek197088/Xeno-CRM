import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET customers list with search, pagination, and sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {};

    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          orders: true,
        },
      }),
      prisma.customer.count({
        where: whereClause,
      }),
    ]);

    // Attach computed fields
    const formattedCustomers = customers.map((c) => {
      const totalSpend = c.orders.reduce((sum, o) => sum + o.amount, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        age: c.age,
        gender: c.gender,
        createdAt: c.createdAt,
        totalSpend,
        orderCount: c.orders.length,
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create new customer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, city, age, gender } = body;

    if (!name || !email || !phone || !city || age === undefined || !gender) {
      return NextResponse.json({ error: 'Missing required customer fields' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        city,
        age: parseInt(String(age), 10),
        gender,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
