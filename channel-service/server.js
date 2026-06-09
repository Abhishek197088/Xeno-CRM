const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || 'http://localhost:3000/api/receipt';

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for waiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry helper for webhook callbacks
async function sendCallbackWithRetry(payload, retries = 3, backoff = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Callback] Sending ${payload.eventType} for campaign ${payload.campaignId}, customer ${payload.customerId} (Attempt ${attempt}/${retries})`);
      
      const response = await fetch(CRM_CALLBACK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`[Callback] Success: Sent ${payload.eventType} event.`);
        return true;
      }
      
      console.warn(`[Callback] Warning: Webhook returned status ${response.status}`);
    } catch (error) {
      console.error(`[Callback] Error on attempt ${attempt}: ${error.message}`);
    }

    if (attempt < retries) {
      const waitTime = backoff * Math.pow(2, attempt - 1);
      console.log(`[Callback] Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }
  console.error(`[Callback] Failed to deliver ${payload.eventType} event after ${retries} attempts.`);
  return false;
}

// Microservice send handler
app.post('/send', (req, res) => {
  const { customerId, campaignId, channel, message } = req.body;

  if (!customerId || !campaignId || !channel || !message) {
    return res.status(400).json({ error: 'Missing required parameters (customerId, campaignId, channel, message)' });
  }

  console.log(`[Channel Service] Queueing message dispatch. Campaign: ${campaignId}, Customer: ${customerId}, Channel: ${channel}`);
  
  // Return response immediately to simulate asynchronous message queue
  res.status(202).json({ status: 'queued', campaignId, customerId });

  // Process asynchronously in background
  processMessageLifecycle(campaignId, customerId, channel, message).catch((err) => {
    console.error(`[Error in Lifecycle Process]:`, err);
  });
});

// Asynchronous simulation of message delivery lifecycle
async function processMessageLifecycle(campaignId, customerId, channel, message) {
  // Stagger start time slightly to simulate network queues
  await delay(100 + Math.random() * 500);

  // 1. Sent Event (100% chance)
  const sentPayload = {
    campaignId,
    customerId,
    eventType: 'sent',
    timestamp: new Date().toISOString()
  };
  await sendCallbackWithRetry(sentPayload);

  // Stagger before delivery check (500ms to 2000ms)
  await delay(500 + Math.random() * 1500);

  // 2. Delivered Event (90% chance)
  const isDelivered = Math.random() < 0.90;
  if (!isDelivered) {
    const failedPayload = {
      campaignId,
      customerId,
      eventType: 'failed',
      timestamp: new Date().toISOString()
    };
    await sendCallbackWithRetry(failedPayload);
    console.log(`[Lifecycle End] Message failed delivery for customer ${customerId}`);
    return;
  }

  const deliveredPayload = {
    campaignId,
    customerId,
    eventType: 'delivered',
    timestamp: new Date().toISOString()
  };
  await sendCallbackWithRetry(deliveredPayload);

  // Stagger before open check (1000ms to 3000ms)
  await delay(1000 + Math.random() * 2000);

  // 3. Opened Event (60% chance)
  const isOpened = Math.random() < 0.60;
  if (!isOpened) {
    console.log(`[Lifecycle End] Message delivered but not opened for customer ${customerId}`);
    return;
  }

  const openedPayload = {
    campaignId,
    customerId,
    eventType: 'opened',
    timestamp: new Date().toISOString()
  };
  await sendCallbackWithRetry(openedPayload);

  // Stagger before click check (1000ms to 3000ms)
  await delay(1000 + Math.random() * 2000);

  // 4. Clicked Event (25% chance)
  const isClicked = Math.random() < 0.25;
  if (!isClicked) {
    console.log(`[Lifecycle End] Message opened but not clicked for customer ${customerId}`);
    return;
  }

  const clickedPayload = {
    campaignId,
    customerId,
    eventType: 'clicked',
    timestamp: new Date().toISOString()
  };
  await sendCallbackWithRetry(clickedPayload);

  // Stagger before conversion check (1000ms to 4000ms)
  await delay(1000 + Math.random() * 3000);

  // 5. Converted Event (10% chance)
  const isConverted = Math.random() < 0.10;
  if (!isConverted) {
    console.log(`[Lifecycle End] Message clicked but not converted for customer ${customerId}`);
    return;
  }

  const convertedPayload = {
    campaignId,
    customerId,
    eventType: 'converted',
    timestamp: new Date().toISOString()
  };
  await sendCallbackWithRetry(convertedPayload);
  console.log(`[Lifecycle End] Conversion successful for customer ${customerId}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'channel-service' });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`Channel Service microservice listening on port ${PORT}`);
  console.log(`Callback Target URL configured to: ${CRM_CALLBACK_URL}`);
  console.log(`======================================================\n`);
});
