
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Ban, 
  Printer, 
  ArrowLeft,
  Sparkles,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Order, Stats, WorkStatus } from './types';
import { GoogleGenAI } from '@google/genai';

// Mock Initial Data
const INITIAL_ORDERS: Order[] = [
  { id: '1', inv: 'NV-8291', name: 'James Wilson', phone: '+1 555 0101', service: 'UI/UX Design', paid: 1200, due: 300, total: 1500, workStatus: 'Success', date: '2023-10-25' },
  { id: '2', inv: 'NV-4921', name: 'Sophia Chen', phone: '+1 555 0202', service: 'Cloud Migration', paid: 2500, due: 0, total: 2500, workStatus: 'Confirmed', date: '2023-10-26' },
  { id: '3', inv: 'NV-1029', name: 'Marcus Brown', phone: '+1 555 0303', service: 'SEO Audit', paid: 500, due: 500, total: 1000, workStatus: 'Pending', date: '2023-10-27' },
];

const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // New Order Form State
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    name: '', phone: '', service: '', paid: 0, due: 0
  });

  const stats = useMemo(() => {
    return orders.reduce((acc, o) => {
      if (o.workStatus !== 'Cancelled') {
        acc.income += o.paid;
        acc.dueTotal += o.due;
        if (o.workStatus === 'Success') acc.successCount++;
        if (o.workStatus === 'Pending' || o.workStatus === 'Confirmed') acc.pendingCount++;
      }
      return acc;
    }, { income: 0, dueTotal: 0, successCount: 0, pendingCount: 0 } as Stats);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.inv.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    return last7Days.map(day => ({ name: day, value: Math.floor(Math.random() * 50) + 10 }));
  }, []);

  const handleAddOrder = () => {
    if (!newOrder.name || !newOrder.service) return alert("Fill Name and Service");
    const id = Math.random().toString(36).substr(2, 9);
    const order: Order = {
      id,
      inv: 'NV-' + Math.floor(1000 + Math.random() * 9000),
      name: newOrder.name!,
      phone: newOrder.phone || 'N/A',
      service: newOrder.service!,
      paid: Number(newOrder.paid) || 0,
      due: Number(newOrder.due) || 0,
      total: (Number(newOrder.paid) || 0) + (Number(newOrder.due) || 0),
      workStatus: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    setOrders([order, ...orders]);
    setNewOrder({ name: '', phone: '', service: '', paid: 0, due: 0 });
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setOrders(orders.map(o => {
      if (o.id === id) {
        const flow: WorkStatus[] = ['Pending', 'Confirmed', 'Success'];
        const currentIdx = flow.indexOf(o.workStatus);
        if (currentIdx === -1) return o;
        return { ...o, workStatus: flow[(currentIdx + 1) % flow.length] };
      }
      return o;
    }));
  };

  const cancelOrder = (id: string) => {
    if (confirm("Cancel this order? Payments will be adjusted.")) {
      setOrders(orders.map(o => o.id === id ? { ...o, workStatus: 'Cancelled' } : o));
    }
  };

  const deleteOrder = (id: string) => {
    if (confirm("Delete this permanent record?")) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const settleDue = (id: string) => {
    setOrders(orders.map(o => {
      if (o.id === id && o.due > 0) {
        return { ...o, paid: o.total, due: 0 };
      }
      return o;
    }));
  };

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Act as a senior business consultant. Analyze these POS stats: Total Income: $${stats.income}, Outstanding Due: $${stats.dueTotal}, Successful Orders: ${stats.successCount}, Pending: ${stats.pendingCount}. Provide a short (max 3 sentence) high-level strategic insight for this business. Focus on cash flow and conversion.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setInsights(response.text || "Unable to generate insights at this time.");
    } catch (error) {
      console.error(error);
      setInsights("Strategy: Focus on collecting the $"+stats.dueTotal+" outstanding due to improve liquid cash flow immediately.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-72 fixed h-full bg-[#0f172a] text-white hidden lg:flex flex-col p-8 z-50 no-print">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold tracking-tighter italic">TI NOVA <span className="text-indigo-400">POS</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-2">Enterprise Hub</p>
        </div>
        <nav className="space-y-3 flex-1">
          <button className="flex w-full items-center gap-4 p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-white font-bold shadow-lg">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="flex w-full items-center gap-4 p-4 text-slate-400 hover:bg-white/5 rounded-2xl transition">
            <Users size={20} /> Clients
          </button>
          <button className="flex w-full items-center gap-4 p-4 text-slate-400 hover:bg-white/5 rounded-2xl transition">
            <FileText size={20} /> Billing
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase italic">Master Build v7.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 flex-1 p-6 md:p-12 relative">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 no-print">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Management Hub</h1>
            <p className="text-slate-500 text-sm font-semibold italic">Intelligence at your fingertips • <span className="text-indigo-600 font-bold">Trexivo IT</span></p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Quick Search Ledger..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 glass-panel rounded-3xl border-none outline-none focus:ring-2 ring-indigo-400 font-medium"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl active:scale-95 transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        {/* AI Insight Box */}
        <div className="mb-12 no-print">
          <div className="glass-panel p-6 rounded-[2.5rem] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[11px]">
                <Sparkles size={16} /> Gemini AI Insights
              </div>
              <button 
                onClick={generateAIInsights}
                disabled={isGeneratingInsights}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition disabled:opacity-50"
              >
                {isGeneratingInsights ? <Loader2 className="animate-spin" size={16} /> : "REGENERATE"}
              </button>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium italic">
              {insights || "Tap generate for an AI-powered business strategy based on your current ledger stats."}
            </p>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={80} className="text-indigo-900" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 no-print">
          <StatCard label="Total Income" value={`$${stats.income.toLocaleString()}`} color="bg-emerald-500" />
          <StatCard label="Due Amount" value={`$${stats.dueTotal.toLocaleString()}`} color="bg-amber-500" />
          <StatCard label="Order Success" value={stats.successCount} color="bg-indigo-600" />
          <StatCard label="Order Pending" value={stats.pendingCount} color="bg-rose-500" />
        </div>

        {/* Chart */}
        <div className="glass-panel rounded-[3rem] p-10 mb-12 no-print">
          <h3 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-widest italic">Performance Trend (Weekly Activity)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-[3rem] overflow-hidden no-print shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-10 py-6">Inv Code</th>
                  <th className="px-10 py-6">Client</th>
                  <th className="px-10 py-6">Total Bill</th>
                  <th className="px-10 py-6">Payment</th>
                  <th className="px-10 py-6 text-center">Status</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/50 transition-colors group">
                    <td className="px-10 py-6 font-bold text-indigo-600">{order.inv}</td>
                    <td className="px-10 py-6 font-bold text-slate-800">
                      <div>{order.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{order.service}</div>
                    </td>
                    <td className="px-10 py-6 font-black text-slate-900">${order.total.toLocaleString()}</td>
                    <td className="px-10 py-6">
                      <button 
                        onClick={() => settleDue(order.id)}
                        disabled={order.due === 0 || order.workStatus === 'Cancelled'}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition ${order.due > 0 && order.workStatus !== 'Cancelled' ? 'bg-rose-100 text-rose-500 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-600 opacity-60'}`}
                      >
                        {order.due > 0 && order.workStatus !== 'Cancelled' ? `Pay: $${order.due}` : 'Settled'}
                      </button>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <button 
                        onClick={() => toggleStatus(order.id)}
                        className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase text-white transition-all transform active:scale-95 ${getStatusStyles(order.workStatus)}`}
                      >
                        {order.workStatus}
                      </button>
                    </td>
                    <td className="px-10 py-6 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedOrder(order); setIsInvoiceOpen(true); }}
                        className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => cancelOrder(order.id)}
                        className="text-slate-400 hover:text-amber-600 p-2 hover:bg-amber-50 rounded-xl transition"
                      >
                        <Ban size={18} />
                      </button>
                      <button 
                        onClick={() => deleteOrder(order.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: New Order */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 no-print animate-in fade-in duration-300">
          <div className="bg-white/95 w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl">
            <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tighter">New TI NOVA Entry</h2>
            <div className="grid grid-cols-2 gap-5">
              <input 
                type="text" 
                placeholder="Client Name" 
                className="col-span-2 p-5 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-400"
                value={newOrder.name}
                onChange={(e) => setNewOrder({...newOrder, name: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Phone" 
                className="p-5 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-400"
                value={newOrder.phone}
                onChange={(e) => setNewOrder({...newOrder, phone: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Service" 
                className="p-5 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-400"
                value={newOrder.service}
                onChange={(e) => setNewOrder({...newOrder, service: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Paid Amount" 
                className="p-5 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-400"
                value={newOrder.paid || ''}
                onChange={(e) => setNewOrder({...newOrder, paid: Number(e.target.value)})}
              />
              <input 
                type="number" 
                placeholder="Initial Due" 
                className="p-5 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-400"
                value={newOrder.due || ''}
                onChange={(e) => setNewOrder({...newOrder, due: Number(e.target.value)})}
              />
            </div>
            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-5 text-slate-400 font-bold hover:text-slate-600"
              >
                Discard
              </button>
              <button 
                onClick={handleAddOrder}
                className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-transform"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {isInvoiceOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl flex items-center justify-center z-[110] p-4 animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-indigo-600 p-10 text-white flex justify-between items-end no-print relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-4xl font-extrabold uppercase italic tracking-tight relative">Official Receipt</h2>
                    <p className="text-[10px] font-bold opacity-80 mt-2 tracking-[0.3em] uppercase">{selectedOrder.date}</p>
                </div>
                <div className="text-right relative z-10">
                    <p className="text-2xl font-black italic tracking-tighter">TI NOVA <span className="text-indigo-200">POS</span></p>
                </div>
            </div>

            <div className="p-12 bg-white relative" id="printArea">
                <div className="flex justify-between items-start mb-12 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Billed To</p>
                        <h4 className="text-3xl font-black text-slate-800 tracking-tight">{selectedOrder.name}</h4>
                        <p className="text-slate-500 font-semibold text-sm mt-1">{selectedOrder.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Invoice Number</p>
                        <h4 className="text-xl font-black text-indigo-600 tracking-widest">{selectedOrder.inv}</h4>
                    </div>
                </div>

                <div className="border-y-2 border-slate-50 py-8 mb-10 relative z-10">
                    <div className="flex justify-between items-center px-4">
                        <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Description</p>
                            <span className="font-bold text-slate-700 text-lg uppercase tracking-tight">{selectedOrder.service}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                            <span className="font-black text-3xl text-slate-900">${selectedOrder.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end relative z-10">
                    <div className="w-72 space-y-4">
                        <div className="flex justify-between items-center px-4 py-3 bg-rose-50 rounded-xl">
                            <span className="text-[11px] font-black text-rose-500 uppercase">Outstanding Due</span>
                            <span className="font-black text-rose-600">${selectedOrder.due.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center px-4 pt-6 border-t-4 border-double border-indigo-100">
                            <span className="text-sm font-black text-slate-800 uppercase italic">Grand Total</span>
                            <span className="text-4xl font-black text-indigo-600 tracking-tighter">${selectedOrder.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-50 flex justify-between items-center no-print border-t border-slate-100">
                <button 
                  onClick={() => setIsInvoiceOpen(false)}
                  className="px-8 py-4 font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> BACK TO HUB
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
                >
                    <Printer size={18} /> PRINT NOW
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className={`p-7 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-2 ${color}`}>
    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">{label}</p>
    <h3 className="text-3xl font-black mt-2 tracking-tighter">{value}</h3>
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
      <LayoutDashboard size={40} />
    </div>
  </div>
);

const getStatusStyles = (status: WorkStatus) => {
  switch (status) {
    case 'Pending': return 'bg-rose-500 shadow-rose-200 shadow-lg';
    case 'Confirmed': return 'bg-indigo-600 shadow-indigo-200 shadow-lg';
    case 'Success': return 'bg-emerald-500 shadow-emerald-200 shadow-lg';
    case 'Cancelled': return 'bg-slate-400 opacity-50 cursor-not-allowed';
    default: return 'bg-slate-500';
  }
};

export default App;
