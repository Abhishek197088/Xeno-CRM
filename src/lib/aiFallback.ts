import { Rule } from './segmentEvaluator';

// Fallback NLP parser for Segment Builder
export function parseNlpQueryToRules(query: string): Rule[] {
  const rules: Rule[] = [];
  const lowercaseQuery = query.toLowerCase();

  // 1. Parse spend constraints
  const spendRegex = /(spent|spend|purchased|bought|more than|above|>\s*|₹)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i;
  const spendMatch = lowercaseQuery.match(spendRegex);
  if (spendMatch) {
    const val = parseInt(spendMatch[2], 10);
    if (lowercaseQuery.includes('less than') || lowercaseQuery.includes('below') || lowercaseQuery.includes('<')) {
      rules.push({ field: 'total_spend', op: 'lt', val });
    } else {
      rules.push({ field: 'total_spend', op: 'gt', val });
    }
  }

  // 2. Parse inactivity/days constraints
  const daysRegex = /(not purchased|inactive|last purchase|days)\s*(?:in|for|since)?\s*(\d+)\s*days/i;
  const daysMatch = lowercaseQuery.match(daysRegex);
  if (daysMatch) {
    const val = parseInt(daysMatch[2], 10);
    rules.push({ field: 'last_order_days', op: 'gt', val });
  } else if (lowercaseQuery.includes('inactive')) {
    // Default fallback for general "inactive" query
    rules.push({ field: 'last_order_days', op: 'gt', val: 60 });
  }

  // 3. Parse cities
  const cities = ['delhi', 'mumbai', 'bangalore', 'pune', 'kolkata', 'chennai', 'hyderabad', 'noida', 'gurgaon', 'ahmedabad'];
  const matchedCities: string[] = [];
  cities.forEach((city) => {
    if (lowercaseQuery.includes(city)) {
      // Capitalize city name
      matchedCities.push(city.charAt(0).toUpperCase() + city.slice(1));
    }
  });
  if (matchedCities.length > 0) {
    rules.push({ field: 'city', op: 'in', val: matchedCities });
  }

  // 4. Parse age
  const ageUnderRegex = /(under|below|younger than|age\s*<\s*)\s*(\d+)/i;
  const ageUnderMatch = lowercaseQuery.match(ageUnderRegex);
  if (ageUnderMatch) {
    rules.push({ field: 'age', op: 'lt', val: parseInt(ageUnderMatch[2], 10) });
  }

  const ageOverRegex = /(over|above|older than|age\s*>\s*)\s*(\d+)/i;
  const ageOverMatch = lowercaseQuery.match(ageOverRegex);
  if (ageOverMatch) {
    rules.push({ field: 'age', op: 'gt', val: parseInt(ageOverMatch[2], 10) });
  }

  // 5. Parse gender
  if (lowercaseQuery.includes('female') || lowercaseQuery.includes('women') || lowercaseQuery.includes('girls')) {
    rules.push({ field: 'gender', op: 'eq', val: 'Female' });
  } else if (lowercaseQuery.includes('male') || lowercaseQuery.includes('men') || lowercaseQuery.includes('boys')) {
    rules.push({ field: 'gender', op: 'eq', val: 'Male' });
  }

  // 6. Parse category
  const categories = ['electronics', 'fashion', 'grocery', 'home decor', 'beauty', 'fitness', 'books'];
  let matchedCategory = '';
  categories.forEach((cat) => {
    if (lowercaseQuery.includes(cat)) {
      matchedCategory = cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  });
  if (matchedCategory) {
    rules.push({ field: 'category', op: 'eq', val: matchedCategory });
  }

  // Default if no rules could be parsed
  if (rules.length === 0) {
    // Default to city match as general placeholder
    rules.push({ field: 'total_spend', op: 'gt', val: 0 });
  }

  return rules;
}

// Fallback for Campaign Copilot
export interface CopilotResponse {
  audienceSize: number;
  channel: string;
  expectedOpenRate: number;
  generatedMessage: string;
  segmentName: string;
  rules: Rule[];
}

export function getCopilotFallback(prompt: string, totalCustomerCount: number): CopilotResponse {
  const lowercasePrompt = prompt.toLowerCase();
  
  let audienceSize = Math.floor(totalCustomerCount * 0.35); // 35% default
  let channel = 'WhatsApp';
  let expectedOpenRate = 65;
  let segmentName = 'General Engaged Audience';
  let rules: Rule[] = [{ field: 'total_spend', op: 'gt', val: 5000 }];
  let generatedMessage = 'Hi {{name}}, enjoy 15% off on your next purchase at Xeno. Use code OFF15!';

  if (lowercasePrompt.includes('inactive') || lowercasePrompt.includes('miss you') || lowercasePrompt.includes('comeback')) {
    segmentName = 'Inactive Customers (60+ Days)';
    rules = [{ field: 'last_order_days', op: 'gt', val: 60 }];
    audienceSize = Math.floor(totalCustomerCount * 0.25);
    channel = 'Email';
    expectedOpenRate = 38;
    generatedMessage = 'Hello {{name}}, we notice it\'s been a while since you last ordered. We miss you! Grab 15% off your next purchase with discount code COMEBACK15.';
  } else if (lowercasePrompt.includes('vip') || lowercasePrompt.includes('high spender') || lowercasePrompt.includes('spend')) {
    segmentName = 'VIP Customers (> ₹15000)';
    rules = [{ field: 'total_spend', op: 'gt', val: 15000 }];
    audienceSize = Math.floor(totalCustomerCount * 0.15);
    channel = 'WhatsApp';
    expectedOpenRate = 82;
    generatedMessage = 'Hey {{name}}, VIP Early Access Alert! Pre-book our next-gen Electronics collection with free delivery in {{city}}. Reply VIP to unlock.';
  } else if (lowercasePrompt.includes('youth') || lowercasePrompt.includes('young') || lowercasePrompt.includes('age')) {
    segmentName = 'Young Shoppers (< 30)';
    rules = [{ field: 'age', op: 'lt', val: 30 }];
    audienceSize = Math.floor(totalCustomerCount * 0.4);
    channel = 'SMS';
    expectedOpenRate = 70;
    generatedMessage = 'Hey {{name}}! Flash Sale: Get 25% off fashion wear! Use code FLASH25. Valid for 24 hours. Shop now!';
  } else if (lowercasePrompt.includes('delhi') || lowercasePrompt.includes('mumbai')) {
    segmentName = 'Metro Shoppers (Delhi/Mumbai)';
    rules = [{ field: 'city', op: 'in', val: ['Delhi', 'Mumbai'] }];
    audienceSize = Math.floor(totalCustomerCount * 0.2);
    channel = 'WhatsApp';
    expectedOpenRate = 74;
    generatedMessage = 'Hi {{name}}, monsoon is here! Get free delivery on all grocery orders in {{city}} this weekend. Code FREEGROCERY.';
  }

  return {
    audienceSize,
    channel,
    expectedOpenRate,
    generatedMessage,
    segmentName,
    rules,
  };
}

// Fallback for Campaign Insights
export interface InsightsResponse {
  analysis: string;
  recommendations: string[];
}

export function getInsightsFallback(campaignName: string, stats: any): InsightsResponse {
  const { sent, delivered, opened, clicked, converted, openRate, clickRate, conversionRate } = stats;

  let analysis = `Here is an analysis of your campaign "${campaignName}":\n\n`;
  const recommendations: string[] = [];

  // Low delivery
  const deliveryPct = sent > 0 ? (delivered / sent) * 100 : 0;
  if (deliveryPct < 85) {
    analysis += `• The delivery rate is low (${deliveryPct.toFixed(1)}%). This usually indicates database decay, with invalid email addresses or bouncebacks on phone numbers.\n`;
    recommendations.push('Run a phone number validation script before triggering SMS/WhatsApp campaigns.');
    recommendations.push('Implement double-opt-in workflows on email signup forms to ensure valid customer contacts.');
  } else {
    analysis += `• Delivery rates are healthy (${deliveryPct.toFixed(1)}%), indicating a high-quality list.\n`;
  }

  // Check Open rates
  if (openRate < 45) {
    analysis += `• The open rate is underperforming (${openRate.toFixed(1)}%). The recipient list might not be warm, or the subject/opening hook lacked urgency and personalization.\n`;
    recommendations.push('A/B test subject lines or WhatsApp headline blocks. Use active verbs and emojis.');
    recommendations.push('Improve personalization by inserting local relevance, e.g. mentioning their city, or recent category purchase.');
  } else {
    analysis += `• The open rate is strong (${openRate.toFixed(1)}%), showing the message layout or sender identity is highly trusted.\n`;
  }

  // Check Click rates
  if (clickRate < 15) {
    analysis += `• Click-through rate (CTR) is low (${clickRate.toFixed(1)}%). The CTA (Call to Action) link was either missing, buried, or the offer wasn\'t compelling enough.\n`;
    recommendations.push('Make the call-to-action button or link prominent in the first fold of the message.');
    recommendations.push('Structure your offer as a limited-time scarcity item to boost engagement (e.g. "Expires tonight").');
  } else {
    analysis += `• The click rate is solid (${clickRate.toFixed(1)}%), showing good alignment between the segment and the offer.`;
  }

  // Check Conversions
  if (conversionRate < 5) {
    analysis += `\n• Conversion rate is lagging behind at ${conversionRate.toFixed(1)}%. Customers clicked through but didn't complete a purchase. This usually implies friction on the landing page, lack of checkout trust, or high shipping fees.\n`;
    recommendations.push('Simplify the mobile checkout funnel. Support 1-click UPI payments.');
    recommendations.push('Match landing page copy exactly with the campaign promotion (e.g. show code COMEBACK15 pre-applied).');
  } else {
    analysis += `\n• Conversion rate is highly optimal (${conversionRate.toFixed(1)}%), proving that the product, offer, and audience targeting was well-matched.\n`;
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent overall performance. Try duplicate targeting on a similar segment.');
    recommendations.push('Scale this campaign format as an automated trigger for recurring audience growth.');
  }

  return {
    analysis,
    recommendations,
  };
}
