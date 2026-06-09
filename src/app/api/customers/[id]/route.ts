import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

// GET customer by ID with full order history and campaign statistics
export async function GET(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { orderDate: 'desc' },
        },
        communications: {
          include: {
            campaign: true,
          },
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const totalSpend = customer.orders.reduce((sum, o) => sum + o.amount, 0);
    const orderCount = customer.orders.length;
    const averageOrderValue = orderCount > 0 ? totalSpend / orderCount : 0;

    return NextResponse.json({
      ...customer,
      stats: {
        totalSpend,
        orderCount,
        averageOrderValue,
      },
    });
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT edit customer details
export async function PUT(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;
    const body = await request.json();
    const { name, email, phone, city, age, gender } = body;

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check if new email conflicts with another customer
    if (email && email !== existing.email) {
      const emailConflict = await prisma.customer.findUnique({
        where: { email },
      });
      if (emailConflict) {
        return NextResponse.json({ error: 'Email already in use by another customer' }, { status: 400 });
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        city: city || undefined,
        age: age !== undefined ? parseInt(String(age), 10) : undefined,
        gender: gender || undefined,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE customer
export async function DELETE(request: Request, segmentData: { params: Params }) {
  try {
    const { id } = await segmentData.params;

    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Customer successfully deleted' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
