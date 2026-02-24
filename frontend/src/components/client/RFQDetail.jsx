import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Zap, Bot, TrendingUp, CheckCircle, XCircle, Star, AlertTriangle, BarChart3 } from 'lucide-react';
import Navbar from '../Navbar';
import { API } from '../../App';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const STATUS_STYLES = {
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  closed: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  awarded: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

function ScoreBar({ score }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="font-['JetBrains_Mono',monospace] text-sm font-medium" style={{ color }}>{score}</span>
    </div>
  );
}

export default function RFQDetail() {
  const { rfq_id } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);

  const fetchData = async () => {
    try {
      const [rfqRes, bidsRes] = await Promise.all([
        axios.get(`${API}/rfqs/${rfq_id}`, { withCredentials: true }),
        axios.get(`${API}/rfqs/${rfq_id}/bids`, { withCredentials: true }),
      ]);
      setRfq(rfqRes.data);
      setBids(bidsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [rfq_id]);

  const runAIRanking = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/rfqs/${rfq_id}/bids/ai-rank`, {}, { withCredentials: true });
      setAiResult(res.data);
      fetchData(); // Refresh bids with AI scores
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const updateBidStatus = async (bid_id, status) => {
    try {
      await axios.patch(`${API}/rfqs/${rfq_id}/bids/${bid_id}/status`, { status }, { withCredentials: true });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const updateRFQStatus = async (status) => {
    try {
      await axios.patch(`${API}/rfqs/${rfq_id}/status`, { status }, { withCredentials: true });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!rfq) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400">RFQ not found</div>;

  const bestBid = bids.find(b => b.bid_id === rfq.best_bid_id);
  const rankedBids = [...bids].sort((a, b) => (b.ai_score || -1) - (a.ai_score || -1));

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <button onClick={() => navigate('/client/dashboard')} className="text-slate-400 hover:text-white mt-1 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-sm font-semibold capitalize ${STATUS_STYLES[rfq.status]}`}>{rfq.status}</span>
              <span className="text-xs text-slate-500 capitalize">{rfq.energy_type}</span>
            </div>
            <h1 className="font-['Chivo'] font-bold text-2xl md:text-3xl text-white mb-1">{rfq.title}</h1>
            <p className="text-slate-500 text-sm">{rfq.delivery_location} · {rfq.quantity_mw} MW · {rfq.start_date} to {rfq.end_date}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {rfq.status === 'open' && (
              <button
                data-testid="close-rfq-btn"
                onClick={() => updateRFQStatus('closed')}
                className="text-xs border border-[#1E293B] hover:border-red-500/30 text-slate-400 hover:text-red-400 px-3 py-2 rounded-sm transition-colors"
              >
                Close RFQ
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left - RFQ Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-4">
              <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">RFQ Details</h3>
              <div className="space-y-3 text-sm">
                <div><div className="text-slate-500 text-xs mb-0.5">Description</div><div className="text-slate-300 leading-relaxed">{rfq.description}</div></div>
                <div className="border-t border-[#1E293B] pt-3">
                  <div className="flex justify-between mb-2"><span className="text-slate-500 text-xs">Quantity</span><span className="text-white font-medium font-['JetBrains_Mono',monospace]">{rfq.quantity_mw} MW</span></div>
                  {rfq.price_ceiling && <div className="flex justify-between mb-2"><span className="text-slate-500 text-xs">Price Ceiling</span><span className="text-white font-medium font-['JetBrains_Mono',monospace]">₹{rfq.price_ceiling}/kWh</span></div>}
                  <div className="flex justify-between mb-2"><span className="text-slate-500 text-xs">Bids Received</span><span className="text-white font-medium">{rfq.bid_count || 0}</span></div>
                </div>
                {rfq.add_on_services?.length > 0 && (
                  <div>
                    <div className="text-slate-500 text-xs mb-2">Add-on Services</div>
                    <div className="flex flex-wrap gap-1">
                      {rfq.add_on_services.map(s => (
                        <span key={s} className="text-xs bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {rfq.ai_analysis_summary && (
              <div className="bg-[#0F172A] border border-sky-500/20 rounded-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={14} className="text-sky-400" />
                  <h3 className="text-xs text-sky-400 font-semibold uppercase tracking-wide">AI Summary</h3>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{rfq.ai_analysis_summary}</p>
              </div>
            )}
          </div>

          {/* Right - Bids */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-['Chivo'] font-bold text-lg text-white">
                Bids ({bids.length})
              </h2>
              {bids.length > 0 && (
                <button
                  data-testid="ai-rank-btn"
                  onClick={runAIRanking}
                  disabled={aiLoading}
                  className="flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 px-4 py-2 rounded-sm text-xs font-semibold transition-colors"
                >
                  {aiLoading ? (
                    <div className="w-3 h-3 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                  ) : <Bot size={14} />}
                  {aiLoading ? 'Analyzing...' : 'Run AI Ranking'}
                </button>
              )}
            </div>

            {bids.length === 0 ? (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm py-12 text-center">
                <TrendingUp size={28} strokeWidth={1} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No bids received yet.</p>
                <p className="text-slate-600 text-xs mt-1">Vendors can find and bid on your RFQ in the Marketplace.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedBids.map((bid, idx) => (
                  <div
                    key={bid.bid_id}
                    data-testid={`bid-card-${bid.bid_id}`}
                    className={`bg-[#0F172A] border rounded-sm p-4 cursor-pointer transition-all duration-200 ${
                      selectedBid === bid.bid_id ? 'border-sky-500/50' : bid.bid_id === rfq.best_bid_id ? 'border-amber-500/30' : 'border-[#1E293B] hover:border-[#334155]'
                    }`}
                    onClick={() => setSelectedBid(selectedBid === bid.bid_id ? null : bid.bid_id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {bid.bid_id === rfq.best_bid_id && (
                          <Star size={14} className="text-amber-400 shrink-0" fill="currentColor" />
                        )}
                        {bids.length > 1 && bid.ai_score !== null && (
                          <span className="text-xs text-slate-600 font-mono">#{idx + 1}</span>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-white">{bid.vendor_company}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{bid.vendor_location || 'Location not set'}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-['JetBrains_Mono',monospace] text-lg font-bold text-white">₹{bid.price_per_unit}<span className="text-xs text-slate-500 font-normal">/kWh</span></div>
                        <div className="text-xs text-slate-500">{bid.quantity_mw} MW</div>
                      </div>
                    </div>

                    {bid.ai_score !== null && (
                      <div className="mt-3 pt-3 border-t border-[#1E293B]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">AI Score</span>
                        </div>
                        <ScoreBar score={bid.ai_score} />
                      </div>
                    )}

                    {selectedBid === bid.bid_id && (
                      <div className="mt-4 pt-4 border-t border-[#1E293B] space-y-3">
                        <div className="text-xs text-slate-400"><span className="text-slate-500">Timeline:</span> {bid.delivery_timeline}</div>
                        {bid.notes && <div className="text-xs text-slate-400"><span className="text-slate-500">Notes:</span> {bid.notes}</div>}

                        {bid.ai_analysis && (
                          <div className="space-y-3">
                            {bid.ai_analysis.strengths?.length > 0 && (
                              <div>
                                <div className="text-xs text-emerald-400 font-semibold mb-1.5 flex items-center gap-1"><CheckCircle size={10} /> Strengths</div>
                                <ul className="space-y-1">
                                  {bid.ai_analysis.strengths.map((s, i) => <li key={i} className="text-xs text-slate-400">• {s}</li>)}
                                </ul>
                              </div>
                            )}
                            {bid.ai_analysis.gaps?.length > 0 && (
                              <div>
                                <div className="text-xs text-amber-400 font-semibold mb-1.5 flex items-center gap-1"><AlertTriangle size={10} /> Gaps</div>
                                <ul className="space-y-1">
                                  {bid.ai_analysis.gaps.map((g, i) => <li key={i} className="text-xs text-slate-400">• {g}</li>)}
                                </ul>
                              </div>
                            )}
                            {bid.ai_analysis.recommendation && (
                              <div className="bg-sky-500/5 border border-sky-500/10 rounded-sm p-3">
                                <div className="text-xs text-sky-400 font-semibold mb-1 flex items-center gap-1"><Bot size={10} /> Recommendation</div>
                                <p className="text-xs text-slate-300">{bid.ai_analysis.recommendation}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {rfq.status === 'open' && bid.status !== 'accepted' && (
                          <div className="flex gap-2 pt-2">
                            <button
                              data-testid={`accept-bid-${bid.bid_id}`}
                              onClick={(e) => { e.stopPropagation(); updateBidStatus(bid.bid_id, 'accepted'); }}
                              className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-sm font-semibold transition-colors"
                            >
                              <CheckCircle size={12} /> Accept Bid
                            </button>
                            <button
                              data-testid={`reject-bid-${bid.bid_id}`}
                              onClick={(e) => { e.stopPropagation(); updateBidStatus(bid.bid_id, 'rejected'); }}
                              className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-sm font-semibold transition-colors"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        )}
                        {bid.status === 'accepted' && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-2">
                            <CheckCircle size={12} /> This bid has been accepted
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
