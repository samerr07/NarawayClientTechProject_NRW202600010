import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, TrendingUp, CheckCircle, Clock, ChevronRight, Zap, Leaf, User, BarChart3 } from 'lucide-react';
import Navbar from '../Navbar';
import { API, useAuth } from '../../App';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const STATUS_STYLES = {
  submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [openRFQs, setOpenRFQs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/vendor/bids`, { withCredentials: true }),
      axios.get(`${API}/rfqs`, { withCredentials: true }),
      axios.get(`${API}/vendor/profile`, { withCredentials: true }),
      axios.get(`${API}/market/insights`, { withCredentials: true }),
    ]).then(([bRes, rRes, pRes, mRes]) => {
      setBids(bRes.data);
      setOpenRFQs(rRes.data.slice(0, 5));
      setProfile(pRes.data);
      setMarketData(mRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Profile completion
  const profileFields = ['company_name', 'description', 'energy_types', 'location', 'contact_email', 'contact_phone', 'certifications'];
  const completedFields = profile ? profileFields.filter(f => {
    const v = profile[f];
    return v && (Array.isArray(v) ? v.length > 0 : v !== '');
  }) : [];
  const completionPct = Math.round((completedFields.length / profileFields.length) * 100);

  const stats = {
    totalBids: bids.length,
    active: bids.filter(b => b.status === 'submitted').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Chivo'] font-bold text-2xl md:text-3xl text-white">
              Welcome, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{profile?.company_name || user?.company || 'Energy Vendor'}</p>
          </div>
          <button data-testid="browse-marketplace-btn" onClick={() => navigate('/vendor/marketplace')}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-sm font-semibold text-sm transition-colors glow-primary">
            <Search size={15} /> Browse RFQs
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Bids', value: stats.totalBids, icon: <TrendingUp size={17} strokeWidth={1.5} />, color: 'text-sky-400', bg: 'bg-sky-500/10' },
            { label: 'Pending', value: stats.active, icon: <Clock size={17} strokeWidth={1.5} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Accepted', value: stats.accepted, icon: <CheckCircle size={17} strokeWidth={1.5} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map(s => (
            <div key={s.label} data-testid={`vendor-stat-${s.label.toLowerCase()}`} className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4">
              <div className={`w-8 h-8 ${s.bg} rounded-sm flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
              <div className={`font-['Chivo'] font-black text-3xl ${s.color} mb-0.5`}>{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Profile Completion + Carbon Credits */}
          <div className="space-y-4">
            {/* Profile */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} strokeWidth={1.5} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Profile Completion</h3>
                <span className="ml-auto text-xs text-sky-400 font-bold">{completionPct}%</span>
              </div>
              <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden mb-3">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="text-xs text-slate-500 mb-3">{completedFields.length}/{profileFields.length} fields completed</div>
              {completionPct < 100 && (
                <button onClick={() => navigate('/vendor/profile')} className="w-full text-xs text-sky-400 hover:text-sky-300 border border-sky-500/20 hover:bg-sky-500/10 py-2 rounded-sm transition-colors font-medium">
                  Complete Profile
                </button>
              )}
            </div>

            {/* Carbon Credits */}
            {profile && (
              <div className="bg-[#0F172A] border border-emerald-500/20 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf size={14} strokeWidth={1.5} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Carbon Credits</h3>
                </div>
                <div className="font-['JetBrains_Mono',monospace] font-bold text-2xl text-emerald-400 mb-1">
                  {(profile.carbon_credits || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mb-3">tCO2e Balance</div>
                {marketData && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-sm p-2 text-xs text-center">
                    <span className="text-slate-500">Market Value: </span>
                    <span className="text-emerald-400 font-['JetBrains_Mono',monospace] font-semibold">
                      ₹{((profile.carbon_credits || 0) * marketData.carbon.ccts_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                <div className="mt-3">
                  <div className={`text-xs px-2 py-1 rounded-sm font-semibold capitalize text-center ${
                    profile.verification_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' :
                    profile.verification_status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>{profile.verification_status === 'verified' ? 'CCTS Verified' : profile.verification_status === 'pending' ? 'Verification Pending' : 'Not Verified'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Energy Price Chart */}
          {marketData && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} strokeWidth={1.5} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Carbon Price Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={marketData.price_history} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '2px', fontSize: 11 }} />
                  <Line type="monotone" dataKey="carbon" stroke="#10B981" strokeWidth={2} dot={false} name="₹/tCO2e" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                CCTS Carbon Price (₹/tCO2e)
              </div>
            </div>
          )}

          {/* Open RFQs */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm">
            <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Open RFQs</h3>
              <button onClick={() => navigate('/vendor/marketplace')} className="text-xs text-sky-400 hover:text-sky-300">View All</button>
            </div>
            {loading ? (
              <div className="py-8 flex justify-center"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : openRFQs.length === 0 ? (
              <div className="py-8 text-center"><Zap size={20} strokeWidth={1} className="text-slate-700 mx-auto mb-2" /><p className="text-xs text-slate-600">No open RFQs</p></div>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {openRFQs.map(rfq => (
                  <div key={rfq.rfq_id} data-testid={`open-rfq-${rfq.rfq_id}`}
                    onClick={() => navigate(`/vendor/rfqs/${rfq.rfq_id}`)}
                    className="px-4 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-[#1E293B]/30 transition-colors group">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{rfq.title}</div>
                      <div className="text-xs text-slate-600 mt-0.5 capitalize">{rfq.energy_type} · {rfq.quantity_mw} MW</div>
                    </div>
                    <ChevronRight size={13} className="text-slate-700 group-hover:text-slate-400 shrink-0 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Bids */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm">
          <div className="px-6 py-4 border-b border-[#1E293B]">
            <h2 className="font-['Chivo'] font-bold text-base text-white">My Recent Bids</h2>
          </div>
          {bids.length === 0 ? (
            <div className="py-10 text-center">
              <TrendingUp size={24} strokeWidth={1} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No bids submitted yet.</p>
              <button onClick={() => navigate('/vendor/marketplace')} className="mt-3 text-sky-400 text-xs hover:text-sky-300">Browse Marketplace</button>
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]">
              {bids.slice(0, 8).map(bid => (
                <div key={bid.bid_id} data-testid={`my-bid-${bid.bid_id}`} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{bid.rfq?.title || 'RFQ'}</div>
                    <div className="text-xs text-slate-500 mt-0.5 capitalize">
                      {bid.rfq?.energy_type} · {bid.rfq?.delivery_location}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden md:block">
                      <div className="font-['JetBrains_Mono',monospace] text-sm font-bold text-white">₹{bid.price_per_unit}/kWh</div>
                      <div className="text-xs text-slate-600">{bid.quantity_mw} MW</div>
                    </div>
                    {bid.ai_score !== null && bid.ai_score !== undefined && (
                      <div className="text-right hidden md:block">
                        <div className="font-['JetBrains_Mono',monospace] text-sm font-bold text-sky-400">{bid.ai_score}</div>
                        <div className="text-xs text-slate-600">AI Score</div>
                      </div>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-sm font-semibold capitalize ${STATUS_STYLES[bid.status] || STATUS_STYLES.submitted}`}>
                      {bid.status}
                    </span>
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
