import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getMatchingCustomers } from '@/lib/segmentEvaluator';
import { parseNlpQueryToRules } from '@/lib/aiFallback';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    let rules: any[] = [];
    let usedAi = false;

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a data analyst database query translator.
Translate the user's natural language request into a JSON array of filters.
Each filter object MUST strictly adhere to this schema:
{
  "field": "city" | "age" | "gender" | "total_spend" | "order_count" | "last_order_days" | "category",
  "op": "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "contains",
  "val": any (string, number, or array of strings/numbers depending on the op and field)
}

Guidelines:
- For city: field: "city", val is string (e.g. "Delhi") or array of strings if multiple cities (e.g. ["Delhi", "Mumbai"] with op "in").
- For spent amount: field: "total_spend", val is number (e.g. 10000) with op "gt" or "lt".
- For inactivity period: field: "last_order_days", val is number of days (e.g. 60) with op "gt" (more than 60 days).
- For purchased category: field: "category", val is string (e.g. "Fashion") with op "eq".
- Age: field: "age", val is number.
- Gender: field: "gender", val is "Male", "Female", or "Non-binary".

Output MUST be a valid JSON array of these filters. Return ONLY the JSON block. Do not include markdown formatting or explanations.`,
            },
            {
              role: 'user',
              content: query,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          // Handle cases where the LLM wraps it in a "rules" or "filters" key
          rules = parsed.rules || parsed.filters || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]);
          if (!Array.isArray(rules)) {
            rules = [parsed];
          }
          usedAi = true;
        }
      } catch (err: any) {
        console.warn('OpenAI Segment translation failed. Falling back to local NLP engine.', err.message);
      }
    }

    // Local heuristic fallback if OpenAI not configured or failed
    if (!usedAi || rules.length === 0) {
      rules = parseNlpQueryToRules(query);
    }

    // Evaluate matching customers and counts from DB
    const matchingCustomers = await getMatchingCustomers(rules);

    return NextResponse.json({
      query,
      rules,
      audienceSize: matchingCustomers.length,
      preview: matchingCustomers.slice(0, 10), // return top 10 for preview
      usedAi,
    });
  } catch (error: any) {
    console.error('Error in AI segment builder:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
