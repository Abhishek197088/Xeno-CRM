# Xeno AI-Native Mini CRM for Shopper Engagement

An intelligent, production-grade SaaS customer relationship management (CRM) platform designed for modern brands to orchestrate high-conversion shopper engagement. The system features natural-language audience segmentation, AI-driven campaign strategy generation, real-time message templates personalization, and an asynchronous message lifecycle loop tracked via webhook callbacks.

---

## 📖 Project Overview

Marketers traditionally struggle to translate marketing concepts ("VIP shoppers who have not bought anything in the last month") into clean SQL query constraints. **Xeno AI-Native Mini CRM** bridges this gap by embedding AI intelligence into every step of the marketing lifecycle:

* **Audience Synthesis**: Marketers write audience criteria in natural language. The AI translates prompts into database filters instantly.
* **Campaign Strategy**: The AI Campaign Copilot recommends segment constraints, selects high-performing channels, predicts open rates, and writes message copy.
* **Feedback Loops**: Launches campaigns to an external simulated Channel Service queue. Webhook receivers process async callback events to construct conversion funnels.
* **Optimization Diagnostics**: AI Insights analyze campaign logs and outline actionable conversion recommendations.

---

## ✨ Features

* **AI Segment Builder**: Translates natural language requests into structured rules queries and previews matched shopper lists. Includes a heuristic regex-based NLP engine fallback.
* **AI Campaign Copilot**: A chat assistant that suggests audiences, selects optimal dispatch channels, models open rates, drafts message templates, and pre-fills forms.
* **Customer Management**: Profile view displaying individual demographic variables, lifetime value (LTV), AOV indexes, transaction histories, and campaign logs. Supports bulk CSV uploads.
* **Order Management**: Stores sales orders across categories with real-time analytics.
* **Campaign Management**: Dynamic marketing log tracker displaying campaign drafts, completed dispatches, and active dispatches.
* **Personalization Engine**: Renders dynamic tags (`{{name}}`, `{{city}}`, `{{total_spend}}`, `{{last_order}}`) before message dispatches.
* **Channel Service Simulation**: An external Express.js microservice simulating network delay, carrier queues, and message dispatch.
* **Webhook Callback Processing**: Endpoint (`/api/receipt`) accepting asynchronous carrier statuses to update databases in real time.
* **Analytics Dashboard**: Graphical dashboard displaying store KPIs (GMV, AOV, CTR) and growth charts.
* **AI Insights Engine**: Analyzes conversion performance and delivers actionable diagnostic recommendations.

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Components**: Radix UI (via ShadCN UI primitives)
* **Data Fetching/State**: TanStack React Query (v5)
* **Visualization**: Recharts

### Backend & Database
* **Server**: Next.js App Router API endpoints
* **Runtime**: Node.js 20+
* **ORM**: Prisma ORM
* **Database**: PostgreSQL (Neon Serverless) for production, SQLite (`dev.db`) for local testing.

### AI & Services
* **Language Model**: OpenAI API (`gpt-4o-mini`) with JSON structured output validation.
* **Message Broker Simulation**: Node/Express Queue Service (port 3001).

### Deployment
* **Vercel**: App hosting, serverless functions, and static assets delivery.

---

## 🏗️ System Architecture

The CRM uses an event-driven architecture to dispatch campaigns and process callbacks asynchronously, preventing server blocks.

```mermaid
graph TD
    %% Frontend Interaction
    A[Marketer UI - Next.js] -->|1. Request AI Segment/Draft| B[CRM Backend API]
    A -->|3. Launch Campaign| B
    
    %% Backend APIs & DB
    B -->|2. Query/Mutate| C[(Database)]
    B -->|4. Structure Constraints| D[OpenAI GPT Engine]
    
    %% Campaign Dispatch
    B -->|5. Dispatch HTTP POST| E[Channel Service Queue]
    
    %% Async Callback Event Loop
    E -.->|6. Acknowledge Receipt 202| B
    E -->|7. Async Status Callback| F[Receipt Webhook API /api/receipt]
    F -->|8. Update Status / Log Events| C
    
    %% UI Refresh
    C -.->|9. React Query Polling| A
```

1. **Campaign Launch**: Next.js backend processes the campaign's target segment, queries matching customers, compiles personalized templates, and pushes messages to the **Channel Service**.
2. **Immediate Acknowledgment**: The Channel Service returns an immediate HTTP `202 Accepted` status, preventing timeout issues.
3. **Simulated Lifecycle Queue**: The Channel Service simulates carriers and network pipelines, generating status logs (`sent` -> `delivered` -> `opened` -> `clicked` -> `converted`).
4. **Webhook Receipt ingestion**: The Channel Service makes HTTP POST requests to `/api/receipt`. The CRM updates log tables, feeding live dashboard metrics.

---

## 🗄️ Database Schema

The database structure is managed via Prisma. In production, Neon PostgreSQL is configured.

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER ||--o{ COMMUNICATION : receives
    CUSTOMER ||--o{ EVENT : triggers
    CAMPAIGN ||--o{ COMMUNICATION : dispatches
    CAMPAIGN ||--o{ EVENT : aggregates
    COMMUNICATION ||--o{ EVENT : tracks
    SEGMENT ||--o{ CAMPAIGN : filters

    CUSTOMER {
        String id PK
        String name
        String email UK
        String phone
        String city
        Int age
        String gender
        DateTime createdAt
    }

    ORDER {
        String id PK
        String customerId FK
        Float amount
        String category
        DateTime orderDate
    }

    SEGMENT {
        String id PK
        String name
        String description
        String nlpQuery
        String rules
        DateTime createdAt
    }

    CAMPAIGN {
        String id PK
        String name
        String segmentId FK
        String channel
        String message
        String status
        DateTime createdAt
    }

    COMMUNICATION {
        String id PK
        String campaignId FK
        String customerId FK
        String status
        String content
        DateTime sentAt
    }

    EVENT {
        String id PK
        String campaignId FK
        String customerId FK
        String communicationId FK
        String eventType
        DateTime timestamp
    }
```

### Table Definitions

#### 1. Customers
Stores the primary demographic and contact records of shoppers.
* **Primary Key**: `id` (UUID String)
* **Fields**:
  | Field Name | Data Type | Description | Key |
  | :--- | :--- | :--- | :--- |
  | `id` | `String` | Unique customer identifier | PK |
  | `name` | `String` | Full name of shopper | |
  | `email` | `String` | Unique email address | UK |
  | `phone` | `String` | Mobile number | |
  | `city` | `String` | Urban location | |
  | `age` | `Int` | Age value (18-70) | |
  | `gender` | `String` | Gender | |
  | `createdAt` | `DateTime` | Join date timestamp | |

#### 2. Orders
Stores the transaction records of purchases.
* **Primary Key**: `id` (UUID String)
* **Foreign Key**: `customerId` references `Customer(id)`
* **Fields**:
  | Field Name | Data Type | Description | Key |
  | :--- | :--- | :--- | :--- |
  | `id` | `String` | Unique transaction identifier | PK |
  | `customerId`| `String` | References parent shopper ID | FK |
  | `amount` | `Float` | Spent amount | |
  | `category` | `String` | Product vertical category | |
  | `orderDate` | `DateTime` | Transaction completion timestamp | |

#### 3. Segments
Defines the dynamic query filters translated from natural language queries.
* **Primary Key**: `id` (UUID String)
* **Fields**:
  | Field Name | Data Type | Description | Key |
  | :--- | :--- | :--- | :--- |
  | `id` | `String` | Unique segment identifier | PK |
  | `name` | `String` | Descriptive segment label | |
  | `description`| `String` | Summary of filters | |
  | `nlpQuery` | `String` | Natural language text typed by user | |
  | `rules` | `String` | Serialized JSON array of query filters | |
  | `createdAt` | `DateTime` | Creation date timestamp | |

#### 4. Campaigns
Tracks marketing broadcasts, templates, and statuses.
* **Primary Key**: `id` (UUID String)
* **Foreign Key**: `segmentId` references `Segment(id)` (Nullable)
* **Fields**:
  | Field Name | Data Type | Description | Key |
  | :--- | :--- | :--- | :--- |
  | `id` | `String` | Unique campaign identifier | PK |
  | `name` | `String` | Title of the campaign | |
  | `segmentId` | `String` | Targeted segment; null targets all | FK |
  | `channel` | `String` | Channel (WhatsApp, Email, SMS) | |
  | `message` | `String` | Text template containing variables | |
  | `status` | `String` | Campaign status (DRAFT, RUNNING, COMPLETED) | |
  | `createdAt` | `DateTime` | Creation date timestamp | |

#### 5. Communications
Tracks individual message dispatches sent to a customer during a campaign.
* **Primary Key**: `id` (UUID String)
* **Foreign Keys**: `campaignId` references `Campaign(id)`, `customerId` references `Customer(id)`
* **Fields**:
  | Field Name | Data Type | Description | Key |
  | :--- | :--- | :--- | :--- |
  | `id` | `String` | Unique communication identifier | PK |
  | `campaignId`| `String` | Campaign associated with this message | FK |
  | `customerId`| `String` | Targeted shopper | FK |
  | `status` | `String` | Latest status (SENT, DELIVERED, OPENED, etc.) | |
  | `content` | `String` | Rendered message text with personalized values | |
  | `sentAt` | `DateTime` | Dispatch timestamp | |

#### 6. Events
Logs granular callback milestones for funnel analysis.
* **Primary Key**: `id` (UUID String)
* **Foreign Keys**: `campaignId` references `Campaign(id)`, `customerId` references `Customer(id)`, `communicationId` references `Communication(id)`
* **Fields**:
  | Field Name | Data Type | Description | Key |
  | :--- | :--- | :--- | :--- |
  | `id` | `String` | Unique log entry identifier | PK |
  | `campaignId`| `String` | Campaign associated with this event | FK |
  | `customerId`| `String` | Shopper associated with this event | FK |
  | `communicationId` | `String` | Specific message receipt reference | FK |
  | `eventType` | `String` | Event type (sent, delivered, opened, etc.) | |
  | `timestamp` | `DateTime` | Callback arrival timestamp | |

---

## 💾 Data Storage Strategy

### Shopper Data Storage
Customers are indexed by `email` with a unique constraint. To prevent import bottlenecks, bulk customer imports use Prisma's `createMany` with duplicate filtering.

### Order Storage
Orders are logged with individual timestamps. Instead of storing pre-calculated aggregates on the customer table, metrics are calculated dynamically using SQL aggregation features (`sum`, `count`, `avg`) to keep data consistent.

### Campaign & Event Logs
Campaign launches generate a batch of `Communication` records, representing the outbox queue.
As events arrive from carrier gateways, they are logged as immutable records in the `Event` table. The parent `Communication` record's `status` field is then updated to reflect the latest status. This separation ensures we keep a full audit log of all events while allowing for fast status lookups.

### Analytics Aggregation
To keep pages responsive, the `/api/dashboard` endpoint uses prisma's group-by features to aggregate database records directly in SQL. This provides instant calculations for metrics like revenue, and average order value.

---

## 💰 Price and Quantity Storage Strategy

In financial systems, accuracy is critical. Floating-point numbers are avoided for monetary values due to precision issues.

```typescript
// Avoid floating point inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004)
// Use decimals or represent monetary values as integers (subunit scale)
```

* **Decimal Representation**: For SQLite databases, amounts are stored as `Float` values and rounded to two decimal places in code. For production PostgreSQL databases, values are stored as `DECIMAL(12, 2)` or `NUMERIC(12, 2)` to ensure absolute precision.
* **Precision and Rounding**: Calculations are performed using scale-up factors (shifting the decimal by two places, e.g. calculating values in cents) and rounded using half-up arithmetic:
  $$\text{Value} = \frac{\lfloor x \cdot 100 + 0.5 \rfloor}{100}$$
* **Revenue Calculation**: Revenue is calculated as the sum of all orders:
  $$\text{Gross Revenue} = \sum (\text{Order Amount})$$
* **Conversion Metrics**: Funnel rates are calculated as:
  $$\text{Open Rate} = \left( \frac{\text{Opened Events}}{\text{Delivered Events}} \right) \times 100$$
  $$\text{CTR} = \left( \frac{\text{Clicked Events}}{\text{Delivered Events}} \right) \times 100$$
  $$\text{Conversion Rate} = \left( \frac{\text{Converted Events}}{\text{Delivered Events}} \right) \times 100$$

---

## 🤖 AI Architecture

The platform's AI features are built on top of OpenAI's GPT models. If the API key is not configured, the system falls back to a regex-based natural language processing (NLP) engine, ensuring the app remains functional.

```
       [Natural Language Query]
                  |
        Is API Key Configured?
        /                  \
      (Yes)                (No)
      /                      \
[OpenAI API]          [Local Heuristics Engine]
- GPT-4o-mini         - Regex keyword extraction
- JSON Schema         - Fallback rules template
      \                      /
     [Serialized JSON Filters Array]
```

### 1. Audience Segmentation (`/api/ai/segment`)
Translates natural language inputs into a JSON filter array.
* **Workflow Example**:
  * **User Prompt**: *"Find customers in Delhi who have spent more than 15000 and are younger than 30"*
  * **GPT Schema Output**:
    ```json
    [
      { "field": "city", "op": "eq", "val": "Delhi" },
      { "field": "total_spend", "op": "gt", "val": 15000 },
      { "field": "age", "op": "lt", "val": 30 }
    ]
    ```

### 2. Campaign Generation (`/api/ai/copilot`)
Suggests campaign segments, channels, and message templates.
* **Workflow Example**:
  * **User Input**: *"We need a campaign for shoppers who haven't ordered in 2 months"*
  * **GPT Output**:
    ```json
    {
      "segmentName": "Inactive Shoppers (60+ Days)",
      "rules": [{ "field": "last_order_days", "op": "gt", "val": 60 }],
      "channel": "Email",
      "expectedOpenRate": 42,
      "generatedMessage": "Hi {{name}}, we miss you! Use COMEBACK10 for 10% off your next order."
    }
    ```

### 3. Personalization Engine
Replaces template placeholders in the campaign message with customer data before dispatching:
```
"Hello {{name}} from {{city}}, you spent {{total_spend}}!" 
   => "Hello Aarav from Mumbai, you spent ₹24,500!"
```

### 4. Performance Insights (`/api/ai/insights`)
Analyzes campaign results and generates actionable recommendations.
* **Workflow Example**:
  * **Input Statistics**: 1000 sent, 900 delivered, 80 opened, 10 clicked.
  * **AI Output Analysis**:
    ```json
    {
      "analysis": "This email campaign suffered from low engagement. The open rate of 8.8% indicates a potential issue with the subject line or delivery timing.",
      "recommendations": [
        "A/B test subject lines with personalization tags",
        "Switch to WhatsApp for urgent time-sensitive offers"
      ]
    }
    ```

---

## 📡 Channel Service Design

The Channel Service is an Express.js microservice running on port 3001 that simulates carrier networks and delivery lifecycles.

```mermaid
sequenceDiagram
    autonumber
    participant CRM as CRM Next.js App
    participant CS as Channel Service
    participant Webhook as Receipt Webhook (/api/receipt)

    CRM->>CS: POST /send { customerId, campaignId, channel, message }
    Note over CS: Queue message validation
    CS-->>CRM: 202 Accepted (Queued response)
    
    %% Async Loop
    opt Asynchronous Processing
        CS->>Webhook: POST /api/receipt { eventType: "sent" }
        Note over Webhook: Log event & set status to SENT
        
        CS->>Webhook: POST /api/receipt { eventType: "delivered" }
        Note over Webhook: Log event & set status to DELIVERED
        
        alt 60% chance
            CS->>Webhook: POST /api/receipt { eventType: "opened" }
            Note over Webhook: Log event & set status to OPENED
            
            alt 25% chance
                CS->>Webhook: POST /api/receipt { eventType: "clicked" }
                Note over Webhook: Log event & set status to CLICKED
                
                alt 10% chance
                    CS->>Webhook: POST /api/receipt { eventType: "converted" }
                    Note over Webhook: Log event & set status to CONVERTED
                end
            end
        end
    end
```

### 1. Delivery Pipeline simulation
* **POST `/send`**: Receives message details, validates parameters, and returns an HTTP `202 Accepted` status code.
* **Callback Execution**: Processes the delivery lifecycle asynchronously using a staggered delay:
  * **Sent** event is fired immediately.
  * **Delivered** event is fired after 500-2000ms (90% success rate, 10% fail rate).
  * **Opened** event is fired after 1000-3000ms (60% probability).
  * **Clicked** event is fired after 1000-3000ms (25% probability).
  * **Converted** event is fired after 1000-4000ms (10% probability).

### 2. Error Recovery and Retries
If the webhook receiver is unavailable, the service retries requests using an exponential backoff strategy:
$$\text{Delay} = \text{Backoff} \times 2^{\text{Attempt} - 1}$$
* **Default Attempts**: 3 retries.
* **Initial Backoff**: 1000ms.

---

## 📈 Scalability Considerations

The application is built for scalability. For high-volume production use, the following components are recommended:

* **Redis Queue Cache**: Use Redis as a message broker between Next.js APIs and the Channel Service. This allows the system to process incoming requests at high volume without overloading the database.
* **Kafka Event Stream**: Replace the webhook callback model with a Kafka topic queue. This prevents write block issues on the database when processing millions of carrier status updates.
* **Queue Workers**: Use background workers (like Celery, BullMQ, or Go daemons) to process message rendering, personalization, and webhooks asynchronously.
* **Database Scaling**: Scale PostgreSQL by separating read queries (sent to replica databases) and write queries (sent to the primary database).

---

## 🔒 Security

* **Authentication**: A secure demo session with pre-configured credentials prevents unauthorized API access.
* **Environment Isolation**: API tokens and database credentials are kept out of source code by loading them from environment variables (`.env`).
* **Input Validation**: API requests are validated using strict Zod schemas. Customer imports parse and sanitize email records.
* **SQL Injection Protection**: The application uses Prisma ORM's parameterized queries, which prevents SQL injection attacks.
* **Rate Limiting**: Protects API endpoints from brute force requests.

---

## 💻 Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/username/xeon-crm.git
cd xeon-crm
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./prisma/dev.db"
OPENAI_API_KEY="your-openai-api-key"
CHANNEL_SERVICE_URL="http://localhost:3001/send"
```

### 3. Database Migration & Seeding
Generate the local SQLite schema and seed mock customers and orders:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run Development Servers
Start both the Next.js dev server and the Express Channel service:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 🐘 Neon Database Setup

Follow these steps to migrate the database to Neon PostgreSQL for production:

1. Sign up at [Neon](https://neon.tech) and create a new serverless PostgreSQL project.
2. Copy the database connection string from the Neon dashboard.
3. Update the connection string in your `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@subdomain.neon.tech/neondb?sslmode=require"
   ```
4. Run the Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## ☁️ Vercel Deployment

1. Install the Vercel CLI: `npm i -g vercel`.
2. Run `vercel login` and authenticate.
3. Link your project by running `vercel` from the root directory.
4. Add the environment variables (`DATABASE_URL`, `OPENAI_API_KEY`, etc.) in the Vercel project settings.
5. Deploy the project:
   ```bash
   vercel --prod
   ```

To redeploy after making changes:
```bash
git add .
git commit -m "update code"
git push
```
If your project is connected to GitHub, pushing changes will trigger a redeploy automatically.

---

## 🔑 Demo Login Credentials

For reviewer testing, a mock login session is preconfigured:

* **Admin Email**: `admin@xeno-demo.com`
* **Password**: `Admin@123`

---

## 🧭 User Guide

### Step 1: Upload Customers
Navigate to `/customers`, click **CSV Import**, and upload a file. The system will parse the records and skip duplicate emails.

### Step 2: Upload Orders
Navigate to `/orders`, click **Log Order**, select a customer, enter the purchase amount and category, and click save.

### Step 3: Create AI Segment
Navigate to `/segments`. In the prompt box, enter *"High spenders from Mumbai"* and click **Build Segment**. Check the generated rules and click **Save**.

### Step 4: Generate Campaign
Navigate to `/campaigns`. In the Copilot panel, enter *"WhatsApp discount code for high spenders"* and click **Ask Copilot**. Review the generated segment, template copy, and expected open rate.

### Step 5: Launch Campaign
Review the campaign draft details and click **Launch**.

### Step 6: Track Analytics
Watch the campaign's status cards and delivery funnel update in real time as webhooks arrive from the Channel Service.

### Step 7: View AI Insights
Click **View Analytics** on a campaign, then click **Analyze Performance**. The AI will analyze the results and display performance insights and optimization recommendations.

---

## 📖 API Documentation

### Customers

#### `GET /api/customers`
Returns a paginated list of customers.
* **Query Parameters**: `search` (Search term), `page` (Page number), `limit` (Records per page)
* **Response Example**:
  ```json
  {
    "customers": [
      {
        "id": "c1a0110d-b10b-4655-b44d-f2e022cc22ff",
        "name": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "phone": "+91 9999999999",
        "city": "Delhi",
        "age": 29,
        "gender": "Male",
        "createdAt": "2026-06-09T18:55:27Z",
        "totalSpend": 25000,
        "orderCount": 4
      }
    ],
    "pagination": { "page": 1, "limit": 10, "totalCount": 1, "totalPages": 1 }
  }
  ```

#### `POST /api/customers/import`
Processes and imports a batch of customer profiles, ignoring duplicates.
* **Request Example**:
  ```json
  {
    "customers": [
      { "name": "Rajesh", "email": "rajesh@example.com", "phone": "+91 99", "city": "Delhi", "age": 29, "gender": "Male" }
    ]
  }
  ```
* **Response Example**:
  ```json
  { "success": true, "totalProcessed": 1, "insertedCount": 1, "skippedCount": 0 }
  ```

---

### AI Endpoints

#### `POST /api/ai/segment`
Translates a natural language query into database filters.
* **Request Example**: `{"query": "shoppers in Delhi under 30"}`
* **Response Example**:
  ```json
  {
    "query": "shoppers in Delhi under 30",
    "rules": [
      { "field": "city", "op": "eq", "val": "Delhi" },
      { "field": "age", "op": "lt", "val": 30 }
    ],
    "audienceSize": 18,
    "usedAi": true
  }
  ```

#### `POST /api/ai/copilot`
Generates campaign recommendations and templates.
* **Request Example**: `{"prompt": "discount for VIP shoppers"}`
* **Response Example**:
  ```json
  {
    "segmentName": "VIP Shoppers",
    "rules": [{ "field": "total_spend", "op": "gt", "val": 20000 }],
    "channel": "WhatsApp",
    "expectedOpenRate": 85,
    "generatedMessage": "Hi {{name}}, we have a special offer for you!",
    "audienceSize": 25,
    "usedAi": true
  }
  ```

---

### Campaign Dispatch & Webhooks

#### `POST /api/campaigns/launch`
Dispatches a campaign's personalized messages to the Channel Service.
* **Request Example**: `{"campaignId": "camp-1234-uuid"}`
* **Response Example**:
  ```json
  { "success": true, "message": "Dispatched to 25 shoppers.", "launchedCount": 25 }
  ```

#### `POST /api/receipt`
Callback webhook that updates communication statuses.
* **Request Example**:
  ```json
  {
    "campaignId": "camp-123",
    "customerId": "cust-456",
    "eventType": "opened",
    "timestamp": "2026-06-09T19:00:00Z"
  }
  ```
* **Response Example**:
  ```json
  { "success": true, "message": "Event logged successfully" }
  ```

---

## 📂 Folder Structure

```
├── channel-service/          # Express.js Channel Service simulator code
│   ├── server.js             # Async carrier queue and callback retry loops
│   └── package.json
├── prisma/                   # Prisma database schemas & migrations
│   ├── schema.prisma         # Main database schema definition
│   ├── seed.ts               # Database seed script
│   └── dev.db                # SQLite local developer database
├── src/
│   ├── app/                  # Next.js 15 App Router pages & APIs
│   │   ├── api/              # API router files
│   │   ├── analytics/        # Business analytics reporting page
│   │   ├── campaigns/        # Campaigns list, creator, and copilot
│   │   ├── customers/        # Customer directory and profile inspector
│   │   ├── dashboard/        # Main CRM visual dashboard
│   │   ├── orders/           # Order transaction management page
│   │   ├── segments/         # AI segment builder page
│   │   ├── settings/         # System design settings page
│   │   ├── layout.tsx        # Application shell component
│   │   └── globals.css       # Global styling configurations
│   ├── components/           # Shared React components (Sidebar, layout providers)
│   └── lib/                  # Core helpers
│       ├── aiFallback.ts     # Local heuristics NLP parser fallback
│       ├── prisma.ts         # Prisma client instance manager
│       ├── segmentEvaluator.ts # Translates segment rules into database queries
│       └── utils.ts          # Styling helper utilities
├── package.json
└── tsconfig.json
```

---

## 🧪 Testing

### Unit Testing
Prisma clients, template compilers, and rules evaluators are isolated in the `/src/lib` directory. You can test these components using tools like Jest:
```bash
npm run test:unit
```

### Integration Testing
Use the local sqlite database to test components together. You can run integration tests to verify that components interact correctly (e.g. creating segments, launching campaigns):
```bash
npm run test:integration
```

### API Testing
Validate endpoint responses (e.g. status codes, JSON formats, headers) using Postman or `curl` commands.

---

## 🚀 Future Enhancements

* **Official Carrier Integration**: Connect directly to official WhatsApp, Twilio, and SendGrid APIs instead of using a simulator.
* **Multi-Tenant Architecture**: Add support for organization workspace keys, so multiple brands can run their campaigns on the platform.
* **Predictive Segmentation**: Implement machine learning models (like Random Forests or K-Means clustering) to predict churn risk and group customers automatically.
* **Automated Campaign Optimization**: Automatically optimize campaigns by running A/B tests on templates and adjusting delivery times based on past open rates.

---

## ⚖️ Trade-offs and Engineering Decisions

### Local SQLite vs Production Postgres
* **Decision**: We use SQLite locally for simple developer setups, and migrate to Neon Postgres in production.
* **Trade-off**: SQLite doesn't natively support decimal values, so we round Float values in code to prevent precision issues. In production, Postgres's decimal types handle precision automatically.

### Asynchronous Simulations vs Event-Driven Queues
* **Decision**: We use an Express service to simulate message dispatch queues.
* **Trade-off**: In a production environment, you should use message brokers like Redis (BullMQ) or Kafka to queue dispatches and process webhooks at scale without overloading the database.

### OpenAI vs Local Heuristics
* **Decision**: The system uses local heuristic fallback engines if the OpenAI API is unavailable.
* **Trade-off**: Local heuristic engines cannot parse complex logic as well as LLMs, but they ensure key features remain functional if the API is offline.
