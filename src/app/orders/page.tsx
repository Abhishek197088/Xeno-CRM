'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Filter,
  DollarSign,
  Calendar,
  X,
  Loader2
} from 'lucide-react';

interface OrderItem {
  id: string;
  customerId: string;
  amount: number;
  category: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
  };
}

interface OrdersResponse {
  orders: OrderItem[];
  totalRevenue: number;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

const CATEGORIES = ['Electronics', 'Fashion', 'Grocery', 'Home Decor', 'Beauty', 'Fitness', 'Books'];

export default function Orders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    amount: '',
    category: 'Electronics',
    orderDate: new Date().toISOString().substring(0, 10),
  });

  // Query paginated orders
  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['orders', search, category, page],
    queryFn: async () => {
      const categoryParam = category ? `&category=${category}` : '';
      const res = await fetch(`/api/orders?search=${encodeURIComponent(search)}${categoryParam}&page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });

  // Query customers list for order assignment dropdown
  const { data: customersData } = useQuery<{ customers: CustomerOption[] }>({
    queryKey: ['customerOptions'],
    queryFn: async () => {
      const res = await fetch('/api/customers?limit=100'); // Fetch top 100 to populate dropdown
      if (!res.ok) throw new Error('Failed to fetch customers list');
      return res.json();
    },
  });

  // Mutation to create order
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: typeof newOrder) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          amount: parseFloat(orderData.amount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create order');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      setIsAddOpen(false);
      setNewOrder({
        customerId: '',
        amount: '',
        category: 'Electronics',
        orderDate: new Date().toISOString().substring(0, 10),
      });
    },
    onError: (error: any) => {
      alert(error.message);
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerId) {
      alert('Please select a customer for this order');
      return;
    }
    if (!newOrder.amount || isNaN(parseFloat(newOrder.amount))) {
      alert('Please enter a valid amount');
      return;
    }
    createOrderMutation.mutate(newOrder);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">Order History</h1>
          <p className="text-sm text-zinc-400 mt-1">Review store receipts, log custom purchases, and analyze spending patterns.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          Log Order
        </button>
      </div>

      {/* Stats Summary & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* GMV summary card */}
        <div className="glass-card rounded-xl p-5 border border-zinc-800 bg-zinc-950/40 md:col-span-1 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">Filtered GMV</span>
            <div className="text-xl font-bold text-purple-400 mt-1">
              ₹{data ? data.totalRevenue.toLocaleString() : '0'}
            </div>
            <p className="text-xxs text-zinc-500 mt-0.5">Sum of filtered order list</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Filter inputs */}
        <div className="glass-card rounded-xl p-4 md:col-span-3 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
            <select
              value={category}
              onChange={handleCategoryChange}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-3.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 w-full md:w-48"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="glass-card rounded-xl border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center gap-2 text-zinc-500">
            <ShoppingCart className="h-10 w-10 text-zinc-600" />
            <span>No orders logged in history</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-900/80 text-zinc-300 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Purchase Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-300 truncate max-w-[150px]">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">{order.customer?.name}</span>
                        <span className="text-zinc-500 text-xs mt-0.5">{order.customer?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {order.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                        {new Date(order.orderDate).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-purple-400 font-bold">
                      ₹{order.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/20 border-t border-zinc-800 text-zinc-400 text-xs font-semibold">
            <span>
              Showing Page <span className="text-white">{page}</span> of{' '}
              <span className="text-white">{data.pagination.totalPages}</span> ({data.pagination.totalCount} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="p-1.5 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Order Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-xl border border-zinc-800 bg-zinc-950 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-lg text-white font-outfit">Log Customer Order</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Customer</label>
                <select
                  required
                  value={newOrder.customerId}
                  onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customersData?.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Order Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newOrder.amount}
                  onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  placeholder="e.g. 5499"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Product Category</label>
                <select
                  value={newOrder.category}
                  onChange={(e) => setNewOrder({ ...newOrder, category: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Order Date</label>
                <input
                  type="date"
                  required
                  value={newOrder.orderDate}
                  onChange={(e) => setNewOrder({ ...newOrder, orderDate: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {createOrderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
