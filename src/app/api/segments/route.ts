import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerStats, evaluateRules, Rule } from '@/lib/segmentEvaluator';

// GET all segments with dynamic audience count
export async function GET() {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const allCustomers = await getCustomerStats();

    const segmentsWithCounts = segments.map((segment) => {
      let rules: Rule[] = [];
      try {
        rules = JSON.parse(segment.rules);
      } catch (e) {
        console.error('Failed to parse rules for segment:', segment.id);
      }

      const matchingCount = allCustomers.filter((c) => evaluateRules(c, rules)).length;

      return {
        ...segment,
        audienceSize: matchingCount,
      };
    });

    return NextResponse.json(segmentsWithCounts);
  } catch (error: any) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST save a new segment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, nlpQuery, rules } = body;

    if (!name || !rules) {
      return NextResponse.json({ error: 'Missing required segment fields (name, rules)' }, { status: 400 });
    }

    // Validate rules is parseable JSON
    let parsedRules: any = [];
    if (typeof rules === 'string') {
      try {
        parsedRules = JSON.parse(rules);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid rules JSON format' }, { status: 400 });
      }
    } else if (Array.isArray(rules)) {
      parsedRules = rules;
    } else {
      return NextResponse.json({ error: 'Rules must be a JSON array or stringified JSON array' }, { status: 400 });
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        nlpQuery,
        rules: typeof rules === 'string' ? rules : JSON.stringify(rules),
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
