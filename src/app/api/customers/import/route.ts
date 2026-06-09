import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customers } = body;

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json({ error: 'Invalid payload: customers must be an array' }, { status: 400 });
    }

    // Clean and validate customer objects
    const cleanedCustomers = customers
      .filter((c: any) => c.name && c.email && c.phone && c.city)
      .map((c: any) => ({
        name: String(c.name).trim(),
        email: String(c.email).trim().toLowerCase(),
        phone: String(c.phone).trim(),
        city: String(c.city).trim(),
        age: parseInt(String(c.age || 25), 10),
        gender: String(c.gender || 'Non-binary').trim(),
      }));

    if (cleanedCustomers.length === 0) {
      return NextResponse.json({ error: 'No valid customers found in payload' }, { status: 400 });
    }

    // Extract emails to check duplicates in a single query
    const emails = cleanedCustomers.map((c) => c.email);
    const existingCustomers = await prisma.customer.findMany({
      where: {
        email: { in: emails },
      },
      select: { email: true },
    });

    const existingEmails = new Set(existingCustomers.map((c) => c.email));
    
    // Filter out customers that already exist in DB
    const newCustomers = cleanedCustomers.filter((c) => !existingEmails.has(c.email));

    if (newCustomers.length > 0) {
      await prisma.customer.createMany({
        data: newCustomers,
      });
    }

    return NextResponse.json({
      success: true,
      totalProcessed: cleanedCustomers.length,
      insertedCount: newCustomers.length,
      skippedCount: cleanedCustomers.length - newCustomers.length,
    });
  } catch (error: any) {
    console.error('Error importing customers:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
