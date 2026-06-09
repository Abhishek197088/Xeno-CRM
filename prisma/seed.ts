import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Kolkata', 'Chennai', 'Hyderabad', 'Noida', 'Gurgaon', 'Ahmedabad'];
const GENDERS = ['Male', 'Female', 'Non-binary'];
const CATEGORIES = ['Electronics', 'Fashion', 'Grocery', 'Home Decor', 'Beauty', 'Fitness', 'Books'];

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Aditya', 'Diya', 'Arjun', 'Isha', 'Vivaan', 'Kavya', 'Reyansh', 'Meera',
  'Rahul', 'Priya', 'Amit', 'Neha', 'Rohan', 'Sneha', 'Vikram', 'Pooja', 'Siddharth', 'Tanvi',
  'Alex', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Mehra', 'Joshi', 'Patel', 'Rao', 'Nair', 'Singh', 'Kumar',
  'Choudhury', 'Reddy', 'Mishra', 'Das', 'Sen', 'Smith', 'Johnson', 'Brown', 'Taylor', 'Miller'
];

async function main() {
  console.log('Starting seed process...');

  // Clean existing data
  console.log('Cleaning existing database data...');
  await prisma.event.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Generating 1000 customers...');
  const customersData: any[] = [];
  const emailsSet = new Set<string>();

  for (let i = 0; i < 1000; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    
    // Ensure email uniqueness
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 10000)}@example.com`;
    while (emailsSet.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100000)}@example.com`;
    }
    emailsSet.add(email);

    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const age = Math.floor(Math.random() * 53) + 18; // 18 to 70
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const phone = `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    // Spread customer creation date over last year
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365));

    customersData.push({
      name,
      email,
      phone,
      city,
      age,
      gender,
      createdAt
    });
  }

  // Batch insert customers
  await prisma.customer.createMany({
    data: customersData
  });

  const dbCustomers = await prisma.customer.findMany();
  console.log(`Successfully seeded ${dbCustomers.length} customers.`);

  console.log('Generating 5000 orders...');
  const ordersData: any[] = [];

  for (let i = 0; i < 5000; i++) {
    const customer = dbCustomers[Math.floor(Math.random() * dbCustomers.length)];
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    
    // Order amount based on category to feel realistic
    let amount = 0;
    if (category === 'Electronics') amount = Math.floor(Math.random() * 45000) + 5000;
    else if (category === 'Home Decor') amount = Math.floor(Math.random() * 12000) + 1000;
    else if (category === 'Fitness') amount = Math.floor(Math.random() * 8000) + 800;
    else if (category === 'Fashion') amount = Math.floor(Math.random() * 6000) + 500;
    else if (category === 'Beauty') amount = Math.floor(Math.random() * 4000) + 300;
    else if (category === 'Books') amount = Math.floor(Math.random() * 1500) + 150;
    else amount = Math.floor(Math.random() * 3000) + 100; // Grocery

    // Order date between customer creation date and today
    const customerCreatedAt = new Date(customer.createdAt);
    const today = new Date();
    const timeDiff = today.getTime() - customerCreatedAt.getTime();
    const randomDays = Math.floor(Math.random() * (timeDiff / (1000 * 60 * 60 * 24) || 1));
    const orderDate = new Date(customerCreatedAt);
    orderDate.setDate(orderDate.getDate() + randomDays);

    ordersData.push({
      customerId: customer.id,
      amount,
      category,
      orderDate
    });
  }

  // Batch insert orders in chunks of 1000 to prevent SQLite variable limits
  const chunkSize = 1000;
  for (let i = 0; i < ordersData.length; i += chunkSize) {
    const chunk = ordersData.slice(i, i + chunkSize);
    await prisma.order.createMany({
      data: chunk
    });
  }
  console.log('Successfully seeded 5000 orders.');

  // Create default segments
  console.log('Creating default segments...');
  const segment1 = await prisma.segment.create({
    data: {
      name: 'High Spenders (Delhi & Mumbai)',
      description: 'Customers from Delhi or Mumbai who spent more than ₹20,000 in total',
      nlpQuery: 'High spenders in Delhi and Mumbai',
      rules: JSON.stringify([
        { field: 'city', op: 'in', val: ['Delhi', 'Mumbai'] },
        { field: 'total_spend', op: 'gt', val: 20000 }
      ])
    }
  });

  const segment2 = await prisma.segment.create({
    data: {
      name: 'Inactive Customers (60+ days)',
      description: 'Customers who have not placed an order in the last 60 days',
      nlpQuery: 'Inactive for 60 days',
      rules: JSON.stringify([
        { field: 'last_order_days', op: 'gt', val: 60 }
      ])
    }
  });

  const segment3 = await prisma.segment.create({
    data: {
      name: 'Young Fashion Enthusiasts',
      description: 'Customers below age 30 who bought Fashion products',
      nlpQuery: 'Shoppers under 30 who bought fashion items',
      rules: JSON.stringify([
        { field: 'age', op: 'lt', val: 30 },
        { field: 'category', op: 'eq', val: 'Fashion' }
      ])
    }
  });

  console.log('Creating campaigns and historical communication logs...');
  
  // Historical Campaign 1: Completed
  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Summer Fashion Fiesta',
      segmentId: segment3.id,
      channel: 'WhatsApp',
      message: 'Hi {{name}}, beat the heat in style! Grab 20% off on our latest Summer Fashion collection in {{city}}. Use code SUMMER20.',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }
  });

  // Historical Campaign 2: Completed
  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'We Miss You! Special Deal',
      segmentId: segment2.id,
      channel: 'Email',
      message: 'Hello {{name}}, we notice you haven\'t visited us in a while. Here is an exclusive discount code for you: COMEBACK15. Get 15% off on your next purchase!',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    }
  });

  // Historical Campaign 3: Completed
  const campaign3 = await prisma.campaign.create({
    data: {
      name: 'VIP Electronics Access',
      segmentId: segment1.id,
      channel: 'SMS',
      message: 'Hi {{name}}, VIP Alert! Pre-book the latest electronics launching tomorrow. Direct access: https://xeno.shop/vip',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    }
  });

  // Draft Campaign
  await prisma.campaign.create({
    data: {
      name: 'Monsoon Grocery Bonanza',
      segmentId: null,
      channel: 'WhatsApp',
      message: 'Hi {{name}}, stay cozy at home. Get fresh groceries delivered at your doorstep in {{city}} with free shipping on orders above ₹1000.',
      status: 'DRAFT'
    }
  });

  // Generate historical event logs for campaigns to populate charts
  // Campaign 1 (WhatsApp) - Target 400 random customers
  console.log('Generating logs for Campaign 1 (WhatsApp)...');
  await generateCampaignLogs(campaign1.id, dbCustomers.slice(0, 400), {
    deliveryRate: 0.94,
    openRate: 0.72,
    clickRate: 0.32,
    conversionRate: 0.15,
    failureRate: 0.06,
    sentDate: campaign1.createdAt
  });

  // Campaign 2 (Email) - Target 300 random customers
  console.log('Generating logs for Campaign 2 (Email)...');
  await generateCampaignLogs(campaign2.id, dbCustomers.slice(400, 700), {
    deliveryRate: 0.98,
    openRate: 0.38,
    clickRate: 0.12,
    conversionRate: 0.04,
    failureRate: 0.02,
    sentDate: campaign2.createdAt
  });

  // Campaign 3 (SMS) - Target 200 random customers
  console.log('Generating logs for Campaign 3 (SMS)...');
  await generateCampaignLogs(campaign3.id, dbCustomers.slice(700, 900), {
    deliveryRate: 0.90,
    openRate: 0.85,
    clickRate: 0.18,
    conversionRate: 0.06,
    failureRate: 0.10,
    sentDate: campaign3.createdAt
  });

  console.log('Database seeding completed successfully!');
}

async function generateCampaignLogs(
  campaignId: string, 
  customers: any[], 
  options: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    failureRate: number;
    sentDate: Date;
  }
) {
  const commsData: any[] = [];
  const eventsData: any[] = [];

  for (const customer of customers) {
    const commId = crypto.randomUUID();
    const content = `Personalized content for ${customer.name}`;
    
    // Determine lifecycle state
    const rand = Math.random();
    let status = 'SENT';
    const lifecycleEvents: string[] = ['sent'];

    if (rand < options.failureRate) {
      status = 'FAILED';
      lifecycleEvents.push('failed');
    } else {
      // Delivered
      lifecycleEvents.push('delivered');
      status = 'DELIVERED';
      
      // Opened
      if (Math.random() < options.openRate) {
        lifecycleEvents.push('opened');
        status = 'OPENED';
        
        // Clicked
        if (Math.random() < options.clickRate) {
          lifecycleEvents.push('clicked');
          status = 'CLICKED';
          
          // Converted
          if (Math.random() < options.conversionRate) {
            lifecycleEvents.push('converted');
            status = 'CONVERTED';
          }
        }
      }
    }

    commsData.push({
      id: commId,
      campaignId,
      customerId: customer.id,
      status,
      content,
      sentAt: options.sentDate
    });

    // Create Event records for each step
    let timeOffset = 0;
    for (const evt of lifecycleEvents) {
      const timestamp = new Date(options.sentDate.getTime() + timeOffset);
      eventsData.push({
        campaignId,
        customerId: customer.id,
        communicationId: commId,
        eventType: evt,
        timestamp
      });
      // Stagger events by few minutes/hours
      timeOffset += Math.floor(Math.random() * 3 * 3600 * 1000) + 10000;
    }
  }

  // Insert communications
  await prisma.communication.createMany({
    data: commsData
  });

  // Insert events in chunks
  const chunkSize = 500;
  for (let i = 0; i < eventsData.length; i += chunkSize) {
    const chunk = eventsData.slice(i, i + chunkSize);
    await prisma.event.createMany({
      data: chunk
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
