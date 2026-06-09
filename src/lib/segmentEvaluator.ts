import { prisma } from './prisma';

export interface Rule {
  field: string; // 'city' | 'age' | 'gender' | 'total_spend' | 'order_count' | 'last_order_days' | 'category'
  op: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  val: any;
}

export interface CustomerStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  age: number;
  gender: string;
  createdAt: Date;
  totalSpend: number;
  orderCount: number;
  lastOrderDate: Date | null;
  lastOrderDays: number;
  purchasedCategories: string[];
}

// Fetch all customers with their orders and transform them into stats profiles
export async function getCustomerStats(): Promise<CustomerStats[]> {
  const customers = await prisma.customer.findMany({
    include: {
      orders: true,
    },
  });

  const now = new Date();

  return customers.map((customer) => {
    const totalSpend = customer.orders.reduce((sum, order) => sum + order.amount, 0);
    const orderCount = customer.orders.length;
    
    let lastOrderDate: Date | null = null;
    let lastOrderDays = 9999; // Default representing no orders

    if (orderCount > 0) {
      const dates = customer.orders.map((o) => new Date(o.orderDate).getTime());
      lastOrderDate = new Date(Math.max(...dates));
      const diffTime = Math.abs(now.getTime() - lastOrderDate.getTime());
      lastOrderDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const purchasedCategories = Array.from(
      new Set(customer.orders.map((order) => order.category))
    );

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      age: customer.age,
      gender: customer.gender,
      createdAt: customer.createdAt,
      totalSpend,
      orderCount,
      lastOrderDate,
      lastOrderDays,
      purchasedCategories,
    };
  });
}

// Evaluate a customer profile against a set of rules
export function evaluateRules(customer: CustomerStats, rules: Rule[]): boolean {
  if (!rules || rules.length === 0) return true;

  return rules.every((rule) => {
    let customerValue: any;

    switch (rule.field) {
      case 'city':
        customerValue = customer.city;
        break;
      case 'age':
        customerValue = customer.age;
        break;
      case 'gender':
        customerValue = customer.gender;
        break;
      case 'total_spend':
        customerValue = customer.totalSpend;
        break;
      case 'order_count':
        customerValue = customer.orderCount;
        break;
      case 'last_order_days':
        customerValue = customer.lastOrderDays;
        break;
      case 'category':
        customerValue = customer.purchasedCategories;
        break;
      default:
        return false;
    }

    const ruleValue = rule.val;

    switch (rule.op) {
      case 'eq':
        if (Array.isArray(customerValue)) {
          return customerValue.includes(ruleValue);
        }
        return String(customerValue).toLowerCase() === String(ruleValue).toLowerCase();
      case 'ne':
        if (Array.isArray(customerValue)) {
          return !customerValue.includes(ruleValue);
        }
        return String(customerValue).toLowerCase() !== String(ruleValue).toLowerCase();
      case 'gt':
        return Number(customerValue) > Number(ruleValue);
      case 'lt':
        return Number(customerValue) < Number(ruleValue);
      case 'gte':
        return Number(customerValue) >= Number(ruleValue);
      case 'lte':
        return Number(customerValue) <= Number(ruleValue);
      case 'in':
        if (Array.isArray(ruleValue)) {
          const lowerRuleVals = ruleValue.map((v) => String(v).toLowerCase());
          return lowerRuleVals.includes(String(customerValue).toLowerCase());
        }
        return false;
      case 'contains':
        return String(customerValue).toLowerCase().includes(String(ruleValue).toLowerCase());
      default:
        return false;
    }
  });
}

// Main function to get matching customers
export async function getMatchingCustomers(rules: Rule[]): Promise<CustomerStats[]> {
  const allStats = await getCustomerStats();
  return allStats.filter((c) => evaluateRules(c, rules));
}
