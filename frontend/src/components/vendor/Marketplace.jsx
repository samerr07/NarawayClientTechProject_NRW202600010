import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, Zap, ChevronRight } from 'lucide-react';
import Navbar from '../Navbar';
import { API } from '../../App';

const ENERGY_TYPES = ['All', 'solar', 'wind', 'hydro', 'thermal', 'green_hydrogen'];

const ENERGY_ICONS = {
  solar: '☀', wind: '💨', hydro: '💧', thermal: '🔥', green_hydrogen: '⚡',
};

export default function Marketplace() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const params = filterType !== 'All' ? `?energy_type=${filterType}` : '';
    axios.get(`${API}/rfqs${params}`, { withCredentials: true })
      .then(r => setRfqs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType]);

  const filtered = rfqs.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.delivery_location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-['Chivo'] font-bold text-2xl md:text-3xl text-white mb-1">Energy Marketplace</h1>
          <p className="text-slate-500 text-sm">Browse open RFQs and submit competitive bids</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              data-testid="marketplace-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or location..."
              className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 pl-9 pr-4 py-2.5 rounded-sm text-sm outline-none transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500 shrink-0" />
            <div className="flex gap-1 overflow-x-auto">
              {ENERGY_TYPES.map(t => (
                <button
                  key={t}
                  data-testid={`filter-${t}`}
                  onClick={() => setFilterType(t)}
                  className={`text-xs px-3 py-2 rounded-sm border font-medium shrink-0 transition-all duration-200 capitalize ${
                    filterType === t
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-[#1E293B] text-slate-400 hover:border-[#334155] hover:text-white'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RFQ Count */}
        <div className="text-xs text-slate-500 mb-4 font-medium">
          {loading ? 'Loading...' : `${filtered.length} open RFQ${filtered.length !== 1 ? 's' : ''} available`}
        </div>

        {/* RFQ Grid */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-[#0F172A] border border-[#1E293B] rounded-sm">
            <Zap size={28} strokeWidth={1} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No open RFQs found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(rfq => (
              <div
                key={rfq.rfq_id}
                data-testid={`marketplace-rfq-${rfq.rfq_id}`}
                onClick={() => navigate(`/vendor/rfqs/${rfq.rfq_id}`)}
                className="bg-[#0F172A] border border-[#1E293B] hover:border-sky-500/30 rounded-sm p-5 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 bg-[#1E293B] rounded-sm flex items-center justify-center text-lg shrink-0">
                      {ENERGY_ICONS[rfq.energy_type] || '⚡'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-['Chivo'] font-bold text-base text-white group-hover:text-sky-400 transition-colors truncate">{rfq.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 capitalize">{rfq.energy_type?.replace('_', ' ')}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-xs text-slate-500">{rfq.delivery_location}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-xs text-slate-500">{rfq.bid_count || 0} bids</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{rfq.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-['Chivo'] font-bold text-xl text-white">{rfq.quantity_mw}<span className="text-sm text-slate-500 font-normal"> MW</span></div>
                    {rfq.price_ceiling && (
                      <div className="text-xs text-slate-500 mt-1">Ceiling: ₹{rfq.price_ceiling}/kWh</div>
                    )}
                    <div className="flex items-center gap-1 justify-end mt-2">
                      <span className="text-xs text-sky-400 font-medium">Bid Now</span>
                      <ChevronRight size={12} className="text-sky-400" />
                    </div>
                  </div>
                </div>
                {rfq.add_on_services?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[#1E293B]">
                    {rfq.add_on_services.map(s => (
                      <span key={s} className="text-xs bg-sky-500/5 text-sky-400/70 border border-sky-500/10 px-2 py-0.5 rounded-sm">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
