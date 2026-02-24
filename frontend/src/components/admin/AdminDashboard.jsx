import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileText, TrendingUp, Shield, CheckCircle, XCircle, Clock, BarChart3, Leaf, Globe } from 'lucide-react';
import Navbar from '../Navbar';
import { API } from '../../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const TABS = ['Overview', 'Users', 'Vendors', 'RFQs'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, uRes, vRes, rRes, mRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`, { withCredentials: true }),
        axios.get(`${API}/admin/users`, { withCredentials: true }),
        axios.get(`${API}/admin/vendors`, { withCredentials: true }),
        axios.get(`${API}/admin/rfqs`, { withCredentials: true }),
        axios.get(`${API}/market/insights`, { withCredentials: true }),
      ]);
      setAnalytics(aRes.data);
      setUsers(uRes.data);
      setVendors(vRes.data);
      setRfqs(rRes.data);
      setMarketData(mRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateUser = async (userId, data) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}`, data, { withCredentials: true });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = analytics ? [
    { name: 'Clients', count: analytics.total_clients },
    { name: 'Vendors', count: analytics.total_vendors },
    { name: 'Open RFQs', count: analytics.open_rfqs },
    { name: 'Awarded', count: analytics.awarded_rfqs },
    { name: 'Total Bids', count: analytics.total_bids },
  ] : [];

  const ROLE_STYLES = {
    client: 'bg-sky-500/10 text-sky-400',
    vendor: 'bg-emerald-500/10 text-emerald-400',
    admin: 'bg-amber-500/10 text-amber-400',
  };

  const VERIFY_STYLES = {
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-['Chivo'] font-bold text-2xl md:text-3xl text-white">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Platform management and oversight</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0F172A] border border-[#1E293B] rounded-sm p-1 mb-6 w-fit">
          {TABS.map(t => (
            <button
              key={t}
              data-testid={`admin-tab-${t.toLowerCase()}`}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors duration-200 ${t === tab ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {tab === 'Overview' && analytics && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: analytics.total_users, icon: <Users size={18} strokeWidth={1.5} />, color: 'text-sky-400' },
                    { label: 'Open RFQs', value: analytics.open_rfqs, icon: <FileText size={18} strokeWidth={1.5} />, color: 'text-emerald-400' },
                    { label: 'Total Bids', value: analytics.total_bids, icon: <TrendingUp size={18} strokeWidth={1.5} />, color: 'text-amber-400' },
                    { label: 'Pending Verify', value: analytics.pending_vendors, icon: <Clock size={18} strokeWidth={1.5} />, color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} data-testid={`admin-stat-${s.label.toLowerCase().replace(' ', '-')}`} className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4">
                      <div className={`${s.color} mb-2`}>{s.icon}</div>
                      <div className={`font-['Chivo'] font-black text-3xl ${s.color} mb-1`}>{s.value}</div>
                      <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 size={16} strokeWidth={1.5} className="text-sky-400" />
                    <h3 className="font-['Chivo'] font-bold text-base text-white">Platform Overview</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '2px', color: '#F8FAFC', fontSize: 12 }} cursor={{ fill: 'rgba(14,165,233,0.05)' }} />
                      <Bar dataKey="count" fill="#0EA5E9" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Market Data */}
                {marketData && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe size={14} className="text-sky-400" />
                        <h3 className="text-sm font-semibold text-white">Energy Price Index (6M)</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={marketData.price_history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} domain={[2, 4]} />
                          <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '2px', fontSize: 11 }} />
                          <Line type="monotone" dataKey="solar" stroke="#F59E0B" strokeWidth={2} dot={false} name="Solar ₹/kWh" />
                          <Line type="monotone" dataKey="wind" stroke="#0EA5E9" strokeWidth={2} dot={false} name="Wind ₹/kWh" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-[#0F172A] border border-emerald-500/20 rounded-sm p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Leaf size={14} className="text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">Carbon Market (CCTS)</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={marketData.price_history} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '2px', fontSize: 11 }} formatter={(v) => [`₹${v}`, 'CCTS/tCO2e']} />
                          <Line type="monotone" dataKey="carbon" stroke="#10B981" strokeWidth={2.5} dot={false} name="₹/tCO2e" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {/* Quick breakdown */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Vendor Verification Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Pending Review</span><span className="text-amber-400 font-semibold">{analytics.pending_vendors}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Verified</span><span className="text-emerald-400 font-semibold">{analytics.verified_vendors}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Total Vendors</span><span className="text-white font-semibold">{analytics.total_vendors}</span></div>
                    </div>
                  </div>
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">RFQ Status Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Open</span><span className="text-emerald-400 font-semibold">{analytics.open_rfqs}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Awarded</span><span className="text-amber-400 font-semibold">{analytics.awarded_rfqs}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-400">Total RFQs</span><span className="text-white font-semibold">{analytics.total_rfqs}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'Users' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm">
                <div className="px-6 py-4 border-b border-[#1E293B]">
                  <h2 className="font-['Chivo'] font-bold text-base text-white">All Users ({users.length})</h2>
                </div>
                <div className="divide-y divide-[#1E293B]">
                  {users.map(u => (
                    <div key={u.user_id} data-testid={`admin-user-${u.user_id}`} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{u.name}</div>
                          <div className="text-xs text-slate-500 truncate">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold capitalize ${ROLE_STYLES[u.role] || 'text-slate-400'}`}>{u.role}</span>
                        <span className={`text-xs ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <select
                          data-testid={`change-role-${u.user_id}`}
                          value={u.role}
                          onChange={e => updateUser(u.user_id, { role: e.target.value })}
                          className="text-xs bg-[#1E293B] border border-[#334155] text-slate-300 px-2 py-1 rounded-sm outline-none"
                        >
                          <option value="client">Client</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          data-testid={`toggle-active-${u.user_id}`}
                          onClick={() => updateUser(u.user_id, { is_active: !u.is_active })}
                          className={`text-xs px-2 py-1 rounded-sm border font-medium transition-colors ${u.is_active ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'}`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'Vendors' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm">
                <div className="px-6 py-4 border-b border-[#1E293B]">
                  <h2 className="font-['Chivo'] font-bold text-base text-white">Vendor Verification ({vendors.length})</h2>
                </div>
                <div className="divide-y divide-[#1E293B]">
                  {vendors.map(v => (
                    <div key={v.vendor_id} data-testid={`admin-vendor-${v.vendor_id}`} className="px-6 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="text-sm font-semibold text-white">{v.company_name}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold capitalize ${VERIFY_STYLES[v.verification_status]}`}>
                            {v.verification_status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{v.user?.email} · {v.location || 'Location not set'}</div>
                        {v.energy_types?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {v.energy_types.map(t => (
                              <span key={t} className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-sm capitalize">{t.replace('_', ' ')}</span>
                            ))}
                          </div>
                        )}
                        {v.certifications?.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">Certifications: {v.certifications.join(', ')}</div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          data-testid={`verify-vendor-${v.vendor_id}`}
                          onClick={() => updateUser(v.user_id, { verification_status: 'verified' })}
                          className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 px-3 py-1.5 rounded-sm transition-colors font-medium"
                          disabled={v.verification_status === 'verified'}
                        >
                          <CheckCircle size={12} /> Verify
                        </button>
                        <button
                          data-testid={`reject-vendor-${v.vendor_id}`}
                          onClick={() => updateUser(v.user_id, { verification_status: 'rejected' })}
                          className="flex items-center gap-1 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 px-3 py-1.5 rounded-sm transition-colors font-medium"
                          disabled={v.verification_status === 'rejected'}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {vendors.length === 0 && (
                    <div className="py-12 text-center">
                      <Shield size={24} strokeWidth={1} className="text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No vendors registered yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'RFQs' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm">
                <div className="px-6 py-4 border-b border-[#1E293B]">
                  <h2 className="font-['Chivo'] font-bold text-base text-white">All RFQs ({rfqs.length})</h2>
                </div>
                <div className="divide-y divide-[#1E293B]">
                  {rfqs.map(rfq => (
                    <div key={rfq.rfq_id} data-testid={`admin-rfq-${rfq.rfq_id}`} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{rfq.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          By {rfq.client_name} · {rfq.energy_type} · {rfq.quantity_mw} MW · {rfq.delivery_location}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center hidden md:block">
                          <div className="text-sm font-semibold text-white">{rfq.bid_count || 0}</div>
                          <div className="text-xs text-slate-500">Bids</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-sm font-semibold capitalize ${
                          rfq.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          rfq.status === 'awarded' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {rfq.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {rfqs.length === 0 && (
                    <div className="py-12 text-center">
                      <FileText size={24} strokeWidth={1} className="text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No RFQs created yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
