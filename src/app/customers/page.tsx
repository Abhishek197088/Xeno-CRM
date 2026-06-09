'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  UserPlus,
  Upload,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Mail,
  Phone,
  Calendar,
  X,
  CreditCard,
  History,
  Info,
  BadgeAlert,
  Loader2,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  age: number;
  gender: string;
  createdAt: string;
  totalSpend: number;
  orderCount: number;
}

interface CustomersResponse {
  customers: CustomerSummary[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

interface CustomerDetail extends CustomerSummary {
  orders: Array<{ id: string; amount: number; category: string; orderDate: string }>;
  communications: Array<{
    id: string;
    status: string;
    sentAt: string;
    content: string;
    campaign: { name: string; channel: string };
  }>;
  stats: {
    totalSpend: number;
    orderCount: number;
    averageOrderValue: number;
  };
}

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    age: 28,
    gender: 'Female',
  });

  // Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Query paginated customers
  const { data, isLoading } = useQuery<CustomersResponse>({
    queryKey: ['customers', search, page],
    queryFn: async () => {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
  });

  // Query individual customer details
  const { data: customerDetail, isLoading: isLoadingDetail } = useQuery<CustomerDetail>({
    queryKey: ['customerDetail', selectedCustomerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${selectedCustomerId}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      return res.json();
    },
    enabled: !!selectedCustomerId,
  });

  // Mutation to create customer
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: typeof newCustomer) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create customer');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
      setNewCustomer({ name: '', email: '', phone: '', city: '', age: 28, gender: 'Female' });
    },
    onError: (error: any) => {
      alert(error.message);
    },
  });

  // Mutation to import CSV
  const importCustomersMutation = useMutation({
    mutationFn: async (parsedCustomers: any[]) => {
      const res = await fetch('/api/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: parsedCustomers }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to import customers');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setImportStatus({
        type: 'success',
        message: `Import complete! Processed ${data.totalProcessed} records. Inserted ${data.insertedCount} new customers, skipped ${data.skippedCount} duplicates.`,
      });
      setCsvFile(null);
    },
    onError: (error: any) => {
      setImportStatus({ type: 'error', message: error.message });
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomerMutation.mutate(newCustomer);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setImportStatus({ type: '', message: '' });
    }
  };

  const handleCSVSubmit = () => {
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error('CSV is empty or missing headers');

        // Parse headers
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        const customersToImport = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV splitter handling potential double quotes
          const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = cols[index];
          });

          if (row.name && row.email) {
            customersToImport.push({
              name: row.name,
              email: row.email,
              phone: row.phone || '+91 9999999999',
              city: row.city || 'Delhi',
              age: row.age ? parseInt(row.age, 10) : 30,
              gender: row.gender || 'Female',
            });
          }
        }

        if (customersToImport.length === 0) {
          throw new Error('No valid customer records found. Ensure headers include "name" and "email".');
        }

        importCustomersMutation.mutate(customersToImport);
      } catch (err: any) {
        setImportStatus({ type: 'error', message: err.message });
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-outfit">Customer Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage, search, filter shopper profiles and upload customer lists.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition-all cursor-pointer btn-interactive"
          >
            <Upload className="h-4 w-4" />
            CSV Import
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/30 transition-all cursor-pointer btn-interactive"
          >
            <UserPlus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search Bar & Controls */}
      <div className="flex items-center gap-3 glass-card rounded-lg p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search customers by name, email, phone, or city..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="glass-card rounded-xl border border-zinc-800/80 overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : !data || data.customers.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center gap-2 text-zinc-500">
            <User className="h-10 w-10 text-zinc-600" />
            <span>No customers found matching search filter</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-900/80 text-zinc-300 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Age / Gender</th>
                  <th className="px-6 py-4 text-right">Orders</th>
                  <th className="px-6 py-4 text-right">Total Spend</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {data.customers.map((customer) => {
                  const avatarColorHash = customer.name.charCodeAt(0) % 3;
                  const avatarGradient = 
                    avatarColorHash === 0 ? 'from-purple-500 to-indigo-500' :
                    avatarColorHash === 1 ? 'from-blue-500 to-cyan-500' :
                    'from-pink-500 to-rose-500';

                  const badgeClass =
                    customer.orderCount >= 5 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    customer.orderCount >= 2 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                    'bg-zinc-500/10 border-zinc-500/20 text-zinc-400';

                  const badgeText =
                    customer.orderCount >= 5 ? 'VIP Shopper' :
                    customer.orderCount >= 2 ? 'Active' :
                    'New';

                  return (
                    <tr key={customer.id} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${avatarGradient} p-[1px] shrink-0`}>
                            <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-xs uppercase text-zinc-200">
                              {customer.name.substring(0, 2)}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-200 group-hover:text-purple-400 transition-colors">{customer.name}</span>
                            <span className={`text-[10px] border px-1.5 py-0.5 rounded font-bold uppercase tracking-wider max-w-fit mt-1 ${badgeClass}`}>
                              {badgeText}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="text-zinc-300 font-medium">{customer.email}</span>
                          <span className="text-zinc-500 mt-0.5">{customer.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300 font-medium">{customer.city}</td>
                      <td className="px-6 py-4 text-zinc-400 text-xs font-semibold">
                        {customer.age} yrs • {customer.gender}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-300 font-bold">{customer.orderCount}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1 text-right">
                          <span className="text-purple-400 font-extrabold text-sm">₹{customer.totalSpend.toLocaleString()}</span>
                          {/* Spend capacity indicator */}
                          <div className="w-20 h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
                              style={{ width: `${Math.min(100, (customer.totalSpend / 40000) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs font-semibold">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomerId(customer.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer btn-interactive"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/20 border-t border-zinc-800 text-zinc-400 text-xs font-semibold">
            <span>
              Showing Page <span className="text-white">{page}</span> of{' '}
              <span className="text-white">{data.pagination.totalPages}</span> ({data.pagination.totalCount} total customers)
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

      {/* Manual Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-xl border border-zinc-800 bg-zinc-950 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-lg text-white font-outfit">Add New Customer</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Bangalore"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Age</label>
                  <input
                    type="number"
                    required
                    value={newCustomer.age}
                    onChange={(e) => setNewCustomer({ ...newCustomer, age: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Gender</label>
                  <select
                    value={newCustomer.gender}
                    onChange={(e) => setNewCustomer({ ...newCustomer, gender: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
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
                  disabled={createCustomerMutation.isPending}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {createCustomerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-xl border border-zinc-800 bg-zinc-950 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-bold text-lg text-white font-outfit">CSV Customer Import</h3>
              <button onClick={() => { setIsImportOpen(false); setImportStatus({ type: '', message: '' }); }} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="rounded-lg border-2 border-dashed border-zinc-850 p-6 flex flex-col items-center justify-center text-center gap-2 bg-zinc-900/20">
                <Upload className="h-8 w-8 text-zinc-500" />
                <span className="text-sm font-semibold text-zinc-300">Choose CSV File</span>
                <span className="text-xs text-zinc-500">Headers required: "name", "email" (optionals: "phone", "city", "age", "gender")</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="mt-2 block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                />
              </div>

              {csvFile && (
                <div className="text-xs text-zinc-400 flex items-center justify-between bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                  <span className="truncate font-semibold">{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
                  <button onClick={() => setCsvFile(null)} className="text-zinc-500 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {importStatus.message && (
                <div className={`rounded-lg border p-3.5 flex items-start gap-3 text-xs ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                    : 'bg-red-950/20 border-red-900/30 text-red-400'
                }`}>
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsImportOpen(false); setImportStatus({ type: '', message: '' }); }}
                  className="px-4 py-2 rounded border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!csvFile || importCustomersMutation.isPending}
                  onClick={handleCSVSubmit}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {importCustomersMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Execute Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail slide-out Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="h-screen w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 flex flex-col justify-between shadow-2xl relative">
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {isLoadingDetail || !customerDetail ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-8 space-y-8 text-sm">
                {/* Profile Header */}
                <div className="flex items-start gap-4 pb-6 border-b border-zinc-800/80">
                  <div className="h-16 w-16 rounded-full bg-gradient-purple-blue text-white flex items-center justify-center font-extrabold text-2xl uppercase">
                    {customerDetail.name.substring(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white font-outfit">{customerDetail.name}</h2>
                    <p className="text-xs text-zinc-400">ID: {customerDetail.id}</p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded max-w-fit mt-2">
                      <Calendar className="h-3.5 w-3.5 text-purple-400" />
                      Joined {new Date(customerDetail.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Profile Grid Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3.5 bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shopper Demographics</h4>
                    <div className="space-y-2 text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-zinc-500" />
                        <span className="truncate">{customerDetail.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-zinc-500" />
                        <span>{customerDetail.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-zinc-500" />
                        <span>{customerDetail.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-zinc-500" />
                        <span>{customerDetail.age} years old • {customerDetail.gender}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Purchase Summary</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-zinc-500" /> Total Spend:</span>
                        <span className="font-bold text-white">₹{customerDetail.stats.totalSpend.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5 text-zinc-500" /> Total Orders:</span>
                        <span className="font-bold text-white">{customerDetail.stats.orderCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-zinc-500" /> Average Value:</span>
                        <span className="font-bold text-purple-400">₹{Math.round(customerDetail.stats.averageOrderValue).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Orders History Tab */}
                <div className="space-y-4">
                  <h3 className="font-bold text-md text-white font-outfit flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-zinc-400" />
                    Transaction Logs ({customerDetail.orders.length})
                  </h3>
                  {customerDetail.orders.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 bg-zinc-900/20 rounded-lg border border-zinc-900">
                      No order transactions logged for this customer.
                    </div>
                  ) : (
                    <div className="border border-zinc-900 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs text-zinc-400">
                        <thead className="bg-zinc-900/60 text-zinc-300">
                          <tr>
                            <th className="px-4 py-2.5">Order ID</th>
                            <th className="px-4 py-2.5">Category</th>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {customerDetail.orders.map((order) => (
                            <tr key={order.id} className="hover:bg-zinc-900/20">
                              <td className="px-4 py-2.5 font-semibold text-zinc-300 truncate max-w-[120px]">{order.id}</td>
                              <td className="px-4 py-2.5 text-zinc-400">{order.category}</td>
                              <td className="px-4 py-2.5 text-zinc-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                              <td className="px-4 py-2.5 text-right text-purple-400 font-semibold">₹{order.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Campaigns Logs */}
                <div className="space-y-4">
                  <h3 className="font-bold text-md text-white font-outfit flex items-center gap-2">
                    <History className="h-5 w-5 text-zinc-400" />
                    Campaign Dispatch Logs ({customerDetail.communications.length})
                  </h3>
                  {customerDetail.communications.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 bg-zinc-900/20 rounded-lg border border-zinc-900">
                      No campaign logs.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                      {customerDetail.communications.map((comm) => (
                        <div key={comm.id} className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200">{comm.campaign.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xxs px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
                                {comm.campaign.channel}
                              </span>
                              <span className={`text-xxs px-2 py-0.5 rounded-full border uppercase ${
                                comm.status === 'CONVERTED'
                                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                                  : comm.status === 'FAILED'
                                  ? 'bg-red-950/20 border-red-900/30 text-red-400'
                                  : comm.status === 'OPENED' || comm.status === 'CLICKED'
                                  ? 'bg-purple-950/20 border-purple-900/30 text-purple-400'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                              }`}>
                                {comm.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 italic bg-zinc-950/40 p-2.5 rounded border border-zinc-900 font-serif">"{comm.content}"</p>
                          <div className="text-xxs text-zinc-500 font-semibold">
                            Dispatched on {new Date(comm.sentAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex justify-end">
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="px-5 py-2 text-sm font-semibold rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-200 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
