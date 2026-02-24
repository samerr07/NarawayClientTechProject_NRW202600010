import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FileText, TrendingUp, CheckCircle, Clock, ChevronRight, Zap, BarChart3, TrendingDown } from 'lucide-react';
import Navbar from '../Navbar';
import { API, useAuth } from '../../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';

const STATUS_STYLES = {
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  awarded: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  draft: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

const ENERGY_ICONS = {
  solar: '☀', wind: '💨', hydro: '💧', thermal: '🔥', green_hydrogen: '⚡',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm px-3 py-2 text-xs">
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.color }} className="font-['JetBrains_Mono',monospace] font-medium">
            {p.name}: ₹{p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/rfqs`, { withCredentials: true }),
      axios.get(`${API}/market/insights`, { withCredentials: true }),
    ]).then(([rfqRes, mktRes]) => {
      setRfqs(rfqRes.data);
      setMarketData(mktRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: rfqs.length,
    open: rfqs.filter(r => r.status === 'open').length,
    bids: rfqs.reduce((sum, r) => sum + (r.bid_count || 0), 0),
    awarded: rfqs.filter(r => r.status === 'awarded').length,
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Chivo'] font-bold text-2xl md:text-3xl text-white">
              {user?.name?.split(' ')[0]}'s Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{user?.company || 'Energy Buyer'} · Procurement Overview</p>
          </div>
          <button
            data-testid="create-rfq-btn"
            onClick={() => navigate('/client/rfqs/new')}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-sm font-semibold text-sm transition-colors glow-primary"
          >
            <Plus size={15} /> New RFQ
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total RFQs', value: stats.total, icon: <FileText size={17} strokeWidth={1.5} />, color: 'text-sky-400', bg: 'bg-sky-500/10' },
            { label: 'Open RFQs', value: stats.open, icon: <Clock size={17} strokeWidth={1.5} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Bids Received', value: stats.bids, icon: <TrendingUp size={17} strokeWidth={1.5} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Awarded', value: stats.awarded, icon: <CheckCircle size={17} strokeWidth={1.5} />, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map((s) => (
            <div key={s.label} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`} className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4 hover:border-[#334155] transition-colors">
              <div className={`w-8 h-8 ${s.bg} rounded-sm flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
              <div className={`font-['Chivo'] font-black text-3xl ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Energy Price Chart */}
          {marketData && (
            <div className="md:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} strokeWidth={1.5} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Energy Price Trends (6M)</h3>
                <span className="ml-auto text-xs text-slate-600">₹/kWh</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={marketData.price_history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} domain={[2, 4]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="solar" stroke="#F59E0B" strokeWidth={2} dot={false} name="Solar" />
                  <Line type="monotone" dataKey="wind" stroke="#0EA5E9" strokeWidth={2} dot={false} name="Wind" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500 rounded" /><span className="text-xs text-slate-500">Solar</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-sky-500 rounded" /><span className="text-xs text-slate-500">Wind</span></div>
              </div>
            </div>
          )}

          {/* Carbon Credits widget */}
          {marketData && (
            <div className="bg-[#0F172A] border border-emerald-500/20 rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <h3 className="text-sm font-semibold text-white">Carbon Market</h3>
              </div>
              <div className="space-y-3">
                <div className="text-center py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                  <div className="font-['JetBrains_Mono',monospace] font-bold text-2xl text-emerald-400">₹{marketData.carbon.ccts_price}</div>
                  <div className="text-xs text-slate-500 mt-0.5">CCTS / tCO2e</div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <TrendingUp size={10} /> +{marketData.carbon.ccts_change_pct}%
                  </div>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-[#1E293B]">
                  <span className="text-slate-500">EU CBAM</span>
                  <span className="text-white font-['JetBrains_Mono',monospace]">€{marketData.carbon.eu_cbam}/tCO2e</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">GOI Budget</span>
                  <span className="text-amber-400 font-semibold">₹20,000 Cr</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RFQs Table */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm">
          <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
            <h2 className="font-['Chivo'] font-bold text-base text-white">My RFQs</h2>
            <span className="text-xs text-slate-500">{rfqs.length} total</span>
          </div>
          {loading ? (
            <div className="py-16 flex justify-center"><div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : rfqs.length === 0 ? (
            <div className="py-14 text-center">
              <Zap size={28} strokeWidth={1} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-sm mb-4">No RFQs posted yet.</p>
              <button data-testid="first-rfq-btn" onClick={() => navigate('/client/rfqs/new')} className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-sm font-semibold text-sm transition-colors">
                Post Your First RFQ
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]">
              {rfqs.map(rfq => (
                <div
                  key={rfq.rfq_id}
                  data-testid={`rfq-row-${rfq.rfq_id}`}
                  onClick={() => navigate(`/client/rfqs/${rfq.rfq_id}`)}
                  className="px-6 py-4 hover:bg-[#1E293B]/30 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 bg-[#1E293B] rounded-sm flex items-center justify-center text-sm shrink-0">
                      {ENERGY_ICONS[rfq.energy_type] || <Zap size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{rfq.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 capitalize">{rfq.energy_type?.replace('_', ' ')} · {rfq.quantity_mw} MW · {rfq.delivery_location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-center hidden md:block">
                      <div className="font-['JetBrains_Mono',monospace] font-bold text-white text-sm">{rfq.bid_count || 0}</div>
                      <div className="text-xs text-slate-600">Bids</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-sm font-semibold capitalize ${STATUS_STYLES[rfq.status] || STATUS_STYLES.open}`}>{rfq.status}</span>
                    <ChevronRight size={15} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
