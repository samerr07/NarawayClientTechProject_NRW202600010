import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, BarChart3, Shield, Globe, ChevronRight, Menu, X, ArrowRight, TrendingUp, TrendingDown, Leaf, FileCheck, Bot, Award, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../App';

const TICKER_ITEMS = [
  { label: 'Solar', value: '₹2.85/kWh', change: '+1.79%', up: true },
  { label: 'Wind', value: '₹3.12/kWh', change: '-2.50%', up: false },
  { label: 'Hydro', value: '₹2.45/kWh', change: '+0.82%', up: true },
  { label: 'CCTS Carbon', value: '₹245.50/tCO2e', change: '+5.27%', up: true },
  { label: 'EU CBAM', value: '€68.50/tCO2e', change: '+1.75%', up: true },
  { label: 'Green H2', value: '₹5.80/kWh', change: '-3.65%', up: false },
  { label: 'Thermal', value: '₹4.20/kWh', change: '+3.70%', up: true },
];

const FEATURES = [
  { icon: <FileCheck size={20} strokeWidth={1.5} />, color: 'text-sky-400', bg: 'bg-sky-500/10', title: 'RFQ Tendering Engine', desc: 'Post structured energy requirements with full technical, logistics, and financial specifications. Get competitive bids within 48 hours.' },
  { icon: <Bot size={20} strokeWidth={1.5} />, color: 'text-violet-400', bg: 'bg-violet-500/10', title: 'AI Bid Ranking', desc: 'Gemini-powered analysis scores every bid against your requirements — price, compliance, capacity, timeline — and surfaces the best match.' },
  { icon: <Shield size={20} strokeWidth={1.5} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Vendor Verification', desc: 'Every vendor is verified for MNRE registration, CEA licensing, green certifications, and CCTS carbon credit compliance.' },
  { icon: <Leaf size={20} strokeWidth={1.5} />, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'Carbon Credit Tracking', desc: 'Integrated CCTS-compliant carbon credit verification. Track tCO2e balances, certifications, and offset capabilities for every vendor.' },
  { icon: <BarChart3 size={20} strokeWidth={1.5} />, color: 'text-rose-400', bg: 'bg-rose-500/10', title: 'Market Intelligence', desc: 'Real-time energy price indices, carbon market data, and bid gap analysis to help you make data-backed procurement decisions.' },
  { icon: <Globe size={20} strokeWidth={1.5} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'CBAM Compliance Ready', desc: 'Built for the EU Carbon Border Adjustment Mechanism era. Track embedded carbon in procured energy and maintain exportable audit trails.' },
];

const HOW_STEPS = [
  { n: '01', title: 'Post Your RFQ', sub: 'For Energy Buyers', desc: 'Define energy type, quantity (MW), delivery location, technical specs, financial terms, and any add-on services. Submit in under 10 minutes.' },
  { n: '02', title: 'Verified Vendors Bid', sub: 'Competitive Marketplace', desc: 'Our verified network of energy vendors — solar, wind, hydro, thermal, green hydrogen — submit competitive bids tailored to your requirements.' },
  { n: '03', title: 'AI Ranks & You Decide', sub: 'AI-Powered Decision Support', desc: 'The AI engine scores each bid, identifies strengths and gaps vs. your RFQ, and recommends the best match. You review and award.' },
];

const CLIENT_BENEFITS = [
  'Multi-energy type RFQ posting',
  'Real-time bid notifications',
  'AI-powered bid scoring & gap analysis',
  'Side-by-side vendor comparison',
  'Carbon credit balance per vendor',
  'Verified regulatory documents',
  'One-click bid acceptance & PO generation',
  'Audit trail for compliance',
];

const VENDOR_BENEFITS = [
  'Verified company profile & credentials',
  'MNRE / CEA license display',
  'CCTS carbon credit balance showcase',
  'Marketplace exposure to 500+ buyers',
  'AI-scored bid insights post-ranking',
  'Real-time RFQ alerts by energy type',
  'Bid history and win rate analytics',
  'Regulatory document management',
];

const NEWS_ITEMS = [
  {
    source: 'Finshots',
    date: 'Feb 2026',
    title: 'Can India get carbon credits right?',
    desc: 'India\'s ₹20,000 crore Carbon Credit Trading Scheme (CCTS) investment could transform energy procurement. Proper verification is key.',
    url: 'https://finshots.in/archive/can-india-get-carbon-credits-right/',
    tag: 'Carbon Markets',
    tagColor: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    source: 'LiveMint',
    date: 'Feb 2026',
    title: 'Nadir Godrej urges India to embrace carbon trading',
    desc: 'Godrej Industries MD emphasizes climate equity and urges Indian industry to leverage international carbon trading for competitive advantage.',
    url: 'https://www.livemint.com/news/climate-equity-is-crucial-says-nadir-godrej-urges-india-to-embrace-carbon-trading-11771402074173.html',
    tag: 'Industry',
    tagColor: 'text-sky-400 bg-sky-500/10',
  },
  {
    source: 'Renergizr',
    date: 'Jan 2026',
    title: 'EU CBAM now in force — what it means for Indian energy exporters',
    desc: 'The Carbon Border Adjustment Mechanism (CBAM) now affects Indian industrial exports to the EU. Carbon-intensive sectors face new cost pressures.',
    url: '#',
    tag: 'Regulation',
    tagColor: 'text-amber-400 bg-amber-500/10',
  },
];

const COMPLIANCE_ITEMS = [
  { label: 'CCTS Compliant', desc: 'India Carbon Credit Trading Scheme' },
  { label: 'MNRE Verified', desc: 'Ministry of New & Renewable Energy' },
  { label: 'CEA Licensed', desc: 'Central Electricity Authority' },
  { label: 'ISO 14001', desc: 'Environmental Management Systems' },
  { label: 'EU CBAM Ready', desc: 'Carbon Border Adjustment Mechanism' },
  { label: 'GreenPro Certified', desc: 'Green Product Certification' },
];

function Ticker() {
  const ref = useRef(null);
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="bg-[#020617] border-b border-[#1E293B] py-2 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#020617] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#020617] to-transparent z-10" />
      <div ref={ref} className="flex gap-8 animate-[ticker_35s_linear_infinite] whitespace-nowrap">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium font-['JetBrains_Mono',monospace]">{item.label}</span>
            <span className="text-xs text-white font-semibold font-['JetBrains_Mono',monospace]">{item.value}</span>
            <span className={`text-xs font-semibold font-['JetBrains_Mono',monospace] ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>{item.change}</span>
            <span className="w-px h-3 bg-[#1E293B]" />
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = () => {
    if (user) navigate(user.role === 'admin' ? '/admin' : `/${user.role}/dashboard`);
    else navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC]">
      {/* Ticker */}
      <Ticker />

      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#020617]/96 backdrop-blur-xl border-b border-[#1E293B]' : 'bg-[#020617]/80 backdrop-blur-sm border-b border-[#1E293B]/40'}`}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sky-500 rounded-sm flex items-center justify-center">
              <Zap size={13} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <div className="font-['Chivo'] font-black text-base tracking-tight text-white leading-tight">RENERGIZR</div>
              <div className="text-[9px] text-slate-500 tracking-widest leading-none">INDUSTRIES PVT. LTD.</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[['Platform', '#features'], ['How It Works', '#how'], ['Carbon & CCTS', '#carbon'], ['For Vendors', '#vendors'], ['Insights', '#news']].map(([l, h]) => (
              <a key={l} href={h} className="text-xs text-slate-400 hover:text-white transition-colors font-medium tracking-wide">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button data-testid="nav-signin-btn" onClick={() => navigate('/auth')} className="text-xs text-slate-300 hover:text-white px-3 py-2 transition-colors font-medium">Sign In</button>
            <button data-testid="nav-get-started-btn" onClick={go} className="text-xs bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-sm font-semibold transition-colors flex items-center gap-1.5">
              Launch Platform <ChevronRight size={12} />
            </button>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0F172A] border-t border-[#1E293B] px-6 py-4 flex flex-col gap-3">
            {[['Platform', '#features'], ['How It Works', '#how'], ['Carbon & CCTS', '#carbon'], ['For Vendors', '#vendors']].map(([l, h]) => (
              <a key={l} href={h} className="text-sm text-slate-300" onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <button onClick={go} className="text-sm bg-sky-500 text-white px-4 py-2.5 rounded-sm font-semibold text-left mt-1">Launch Platform</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1639422026989-c17351e8c71e?crop=entropy&cs=srgb&fm=jpg&q=80&w=1600)` }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 60%, rgba(14,165,233,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.05) 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-16 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-sm mb-6 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                India's First AI Energy Marketplace
              </div>
              <h1 className="font-['Chivo'] font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-6">
                Where India's<br />
                <span className="text-sky-400">Energy Deals</span><br />
                Get Done.
              </h1>
              <p className="text-base text-slate-300 leading-relaxed mb-8 max-w-lg">
                B2B marketplace for energy procurement. Post RFQs, receive bids from CCTS-verified vendors, and let our AI engine rank the best deal in seconds. CBAM-ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button data-testid="hero-get-started-btn" onClick={go} className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-7 py-3.5 rounded-sm font-bold text-sm transition-colors glow-primary">
                  Post Your First RFQ <ArrowRight size={15} />
                </button>
                <button data-testid="hero-vendor-btn" onClick={() => navigate('/auth')} className="flex items-center justify-center gap-2 border border-[#1E293B] hover:border-[#334155] text-slate-300 hover:text-white px-7 py-3.5 rounded-sm font-semibold text-sm transition-all">
                  Join as Vendor
                </button>
              </div>
              <div className="flex items-center gap-6 pt-6 border-t border-[#1E293B]">
                {[['CCTS Verified', 'emerald'], ['MNRE Approved', 'sky'], ['CBAM Ready', 'amber']].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${c}-400`} />
                    <span className="text-xs text-slate-500 font-medium">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live data widget */}
            <div className="hidden md:block">
              <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-[#1E293B] rounded-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Live Market</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Live</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {TICKER_ITEMS.slice(0, 5).map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#1E293B] last:border-0">
                      <span className="text-xs text-slate-400 font-medium w-24">{item.label}</span>
                      <span className="text-sm font-['JetBrains_Mono',monospace] font-semibold text-white">{item.value}</span>
                      <div className={`flex items-center gap-1 text-xs font-semibold font-['JetBrains_Mono',monospace] ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {item.change}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#1E293B] grid grid-cols-3 gap-3">
                  {[['142', 'Open RFQs'], ['523', 'Vendors'], ['8,540 MW', 'Traded']].map(([v, l]) => (
                    <div key={l} className="text-center">
                      <div className="font-['Chivo'] font-black text-lg text-sky-400">{v}</div>
                      <div className="text-xs text-slate-600">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020617]" />
      </section>

      {/* About */}
      <section className="py-20 bg-[#0F172A] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <div className="text-xs text-sky-400 font-semibold tracking-widest uppercase mb-3">About Renergizr</div>
              <h2 className="font-['Chivo'] font-bold text-4xl text-white mb-5 leading-tight">
                Built for India's<br />Energy Transition
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-5">
                Renergizr Industries Private Limited is building the infrastructure layer for India's ₹20+ lakh crore energy transition. Our platform connects energy buyers and verified vendors through an AI-powered RFQ marketplace — making procurement faster, cheaper, and fully compliant.
              </p>
              <p className="text-slate-400 text-base leading-relaxed mb-6">
                As India's Carbon Credit Trading Scheme (CCTS) scales and EU CBAM creates new compliance demands, Renergizr ensures every energy transaction is tracked, verified, and audit-ready.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[['2026', 'Founded'], ['INR 3.8L', 'Invested'], ['6 months', 'To Full Launch'], ['5G/6G', 'Architecture']].map(([v, l]) => (
                  <div key={l} className="bg-[#020617] border border-[#1E293B] rounded-sm p-3">
                    <div className="font-['Chivo'] font-black text-lg text-sky-400">{v}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: <Zap size={16} strokeWidth={1.5} />, title: 'Energy Trading Marketplace', desc: 'RFQ-based tendering for solar, wind, hydro, thermal & green hydrogen' },
                { icon: <Bot size={16} strokeWidth={1.5} />, title: 'AI Intelligence Layer', desc: 'Gemini-powered bid ranking, gap analysis, and procurement recommendations' },
                { icon: <Leaf size={16} strokeWidth={1.5} />, title: 'Carbon Markets Integration', desc: 'CCTS-compliant vendor verification with carbon credit balance tracking' },
                { icon: <Globe size={16} strokeWidth={1.5} />, title: 'Regulatory Compliance', desc: 'MNRE, CEA, ISO 14001, GreenPro, and EU CBAM compliance reporting' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 bg-[#020617] border border-[#1E293B] rounded-sm p-4">
                  <div className="w-8 h-8 bg-sky-500/10 rounded-sm flex items-center justify-center text-sky-400 shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-white mb-0.5">{item.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14">
          <div className="text-xs text-sky-400 font-semibold tracking-widest uppercase mb-3">Platform Capabilities</div>
          <h2 className="font-['Chivo'] font-bold text-4xl md:text-5xl text-white mb-4 leading-tight">
            Everything You Need for<br />Smarter Energy Procurement
          </h2>
          <p className="text-slate-400 leading-relaxed">Six core capabilities — designed around the real complexities of B2B energy trading in India.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} data-testid={`feature-${i}`} className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-5 hover:border-[#334155] transition-all duration-300 group">
              <div className={`w-9 h-9 ${f.bg} rounded-sm flex items-center justify-center ${f.color} mb-4`}>{f.icon}</div>
              <h3 className="font-['Chivo'] font-bold text-base text-white mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 bg-[#0F172A] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-xs text-amber-400 font-semibold tracking-widest uppercase mb-3">Process</div>
          <h2 className="font-['Chivo'] font-bold text-4xl text-white mb-14">From RFQ to Awarded Deal<br />in Three Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="font-['Chivo'] font-black text-7xl text-[#1E293B] mb-3 leading-none select-none">{s.n}</div>
                <div className="text-xs text-sky-400 font-semibold uppercase tracking-wide mb-2">{s.sub}</div>
                <h3 className="font-['Chivo'] font-bold text-xl text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carbon Credits & CCTS Section */}
      <section id="carbon" className="py-24 max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-start">
          <div>
            <div className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-3">Carbon Markets & CCTS</div>
            <h2 className="font-['Chivo'] font-bold text-4xl text-white mb-5 leading-tight">
              India's Energy Transition<br />Needs Carbon Intelligence
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-5">
              The Government of India has committed <strong className="text-white">₹20,000 crore</strong> to the Carbon Credit Trading Scheme (CCTS) over five years. The EU Carbon Border Adjustment Mechanism (CBAM) is already in force — affecting Indian steel, power, and industrial exports.
            </p>
            <p className="text-slate-400 text-base leading-relaxed mb-8">
              Renergizr integrates CCTS-compliance into every energy transaction. Vendors must verify carbon credit balances, green energy certifications, and regulatory documents before bidding. Every deal comes with a full compliance audit trail.
            </p>
            <div className="space-y-3">
              {[
                ['Carbon Credit Balance Verification', 'Track vendor tCO2e balance in real-time before awarding bids'],
                ['CCTS-Compliant Audit Trail', 'Every transaction documented for regulatory reporting'],
                ['EU CBAM Readiness Score', 'Understand embedded carbon in procured energy'],
                ['Afforestation Credit Integration', 'Support for rural carbon credit generation per CCTS framework'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-1 h-full bg-emerald-500 rounded-full mt-1.5 shrink-0" style={{ minHeight: '16px' }} />
                  <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[#0F172A] border border-emerald-500/20 rounded-sm p-5">
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-3">Carbon Market Snapshot</div>
              <div className="space-y-3">
                {[
                  { label: 'CCTS Carbon Price', value: '₹245.50/tCO2e', change: '+5.27%', up: true },
                  { label: 'EU CBAM Rate', value: '€68.50/tCO2e', change: '+1.75%', up: true },
                  { label: 'GOI CCTS Budget', value: '₹20,000 Cr', change: '5-year plan', up: true },
                  { label: 'Verified Vendors (CCTS)', value: '312 active', change: '+34 this month', up: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#1E293B] last:border-0">
                    <span className="text-xs text-slate-400">{item.label}</span>
                    <div className="text-right">
                      <div className="text-sm font-['JetBrains_Mono',monospace] font-semibold text-white">{item.value}</div>
                      <div className={`text-xs ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>{item.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0F172A] border border-amber-500/20 rounded-sm p-5">
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wide mb-3">EU CBAM Impact</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                The EU's Carbon Border Adjustment Mechanism, in force since January 2026, requires Indian exporters to document and offset embedded carbon. Renergizr provides the compliance infrastructure.
              </p>
              <div className="text-xs text-amber-400 font-semibold">Sectors affected: Power · Steel · Cement · Chemicals</div>
            </div>
          </div>
        </div>
      </section>

      {/* For Clients + Vendors */}
      <section className="py-24 bg-[#0F172A] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Clients */}
            <div className="bg-[#020617] border border-[#1E293B] rounded-sm p-7">
              <div className="text-xs text-sky-400 font-semibold tracking-widest uppercase mb-3">For Energy Buyers</div>
              <h3 className="font-['Chivo'] font-bold text-2xl text-white mb-4">Procure Energy Like a Pro</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">Post structured RFQs, receive competitive bids from verified vendors, and use AI analysis to make procurement decisions backed by data.</p>
              <ul className="space-y-2 mb-6">
                {CLIENT_BENEFITS.map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1 h-1 bg-sky-400 rounded-full shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <button data-testid="client-register-btn" onClick={() => navigate('/auth')} className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-sm font-bold text-sm transition-colors flex items-center justify-center gap-2">
                Start as Energy Buyer <ArrowRight size={14} />
              </button>
            </div>

            {/* For Vendors */}
            <div id="vendors" className="bg-[#020617] border border-[#1E293B] rounded-sm p-7">
              <div className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-3">For Energy Vendors</div>
              <h3 className="font-['Chivo'] font-bold text-2xl text-white mb-4">Reach 500+ Qualified Buyers</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">Get verified once. Access India's growing B2B energy buyer market. Showcase your CCTS carbon credits, certifications, and capacity.</p>
              <ul className="space-y-2 mb-6">
                {VENDOR_BENEFITS.map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <button data-testid="vendor-register-btn" onClick={() => navigate('/auth')} className="w-full border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 py-3 rounded-sm font-bold text-sm transition-colors flex items-center justify-center gap-2">
                Register as Vendor <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* News & Insights */}
      <section id="news" className="py-24 max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3">Market Intelligence</div>
            <h2 className="font-['Chivo'] font-bold text-4xl text-white">News & Insights</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {NEWS_ITEMS.map(item => (
            <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" data-testid={`news-${item.source.toLowerCase()}`}
              className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-5 hover:border-[#334155] transition-all duration-300 group block">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-sm font-semibold ${item.tagColor}`}>{item.tag}</span>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span>{item.source}</span>
                  <span>·</span>
                  <span>{item.date}</span>
                </div>
              </div>
              <h3 className="font-['Chivo'] font-bold text-base text-white mb-2 group-hover:text-sky-400 transition-colors leading-snug">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
              <div className="flex items-center gap-1 text-xs text-sky-400 font-medium">
                Read Article <ExternalLink size={10} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 bg-[#0F172A] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-xs text-slate-500 font-semibold tracking-widest uppercase text-center mb-8">Compliance & Certifications Supported</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {COMPLIANCE_ITEMS.map(item => (
              <div key={item.label} className="bg-[#020617] border border-[#1E293B] rounded-sm p-3 text-center">
                <Award size={16} strokeWidth={1.5} className="text-amber-400 mx-auto mb-2" />
                <div className="text-xs font-semibold text-white mb-0.5">{item.label}</div>
                <div className="text-[10px] text-slate-600 leading-tight">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-7xl mx-auto px-6 md:px-8">
        <div className="bg-[#0F172A] border border-sky-500/20 rounded-sm p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(14,165,233,0.06) 0%, transparent 60%)' }} />
          <div className="relative max-w-2xl">
            <div className="text-xs text-sky-400 font-semibold tracking-widest uppercase mb-4">Get Started Today</div>
            <h2 className="font-['Chivo'] font-bold text-4xl md:text-5xl text-white mb-4 leading-tight">
              Ready to Transform Your<br />Energy Procurement?
            </h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Join India's growing network of energy buyers and verified vendors. Post your first RFQ free. Our AI engine will rank bids within 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button data-testid="cta-post-rfq-btn" onClick={go} className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3.5 rounded-sm font-bold text-sm transition-colors flex items-center gap-2 glow-primary">
                Post Your First RFQ <ArrowRight size={14} />
              </button>
              <button data-testid="cta-contact-btn" onClick={() => document.getElementById('contact')?.scrollIntoView()} className="border border-[#1E293B] hover:border-[#334155] text-slate-300 hover:text-white px-8 py-3.5 rounded-sm font-semibold text-sm transition-all">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 bg-[#0F172A] border-t border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-['Chivo'] font-bold text-3xl text-white mb-3">Get in Touch</h2>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">Questions about the platform, enterprise pricing, or want a personalized demo for your procurement team?</p>
              <div className="space-y-3 text-sm text-slate-400">
                <div><span className="text-slate-600">Company:</span> Renergizr Industries Private Limited</div>
                <div><span className="text-slate-600">Email:</span> contact@renergizr.com</div>
                <div><span className="text-slate-600">Phone:</span> +91 98765 43210</div>
                <div><span className="text-slate-600">Location:</span> Mumbai, India</div>
              </div>
            </div>
            <div className="bg-[#020617] border border-[#1E293B] rounded-sm p-6">
              <div className="space-y-3">
                <input data-testid="contact-name" type="text" placeholder="Name" className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors" />
                <input data-testid="contact-email" type="email" placeholder="Work Email" className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors" />
                <select className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-sky-500 text-slate-400 px-4 py-3 rounded-sm text-sm outline-none transition-colors">
                  <option>Interested in...</option>
                  <option>Energy Buyer — Post RFQs</option>
                  <option>Energy Vendor — Bid on Projects</option>
                  <option>Platform Demo</option>
                  <option>Enterprise Plan</option>
                  <option>Carbon Credits Integration</option>
                </select>
                <textarea data-testid="contact-message" rows={3} placeholder="Message" className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors resize-none" />
                <button data-testid="contact-submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-sm font-bold text-sm transition-colors">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-[#1E293B] py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-sky-500 rounded-sm flex items-center justify-center"><Zap size={11} strokeWidth={2.5} className="text-white" /></div>
                <span className="font-['Chivo'] font-black text-sm text-white">RENERGIZR INDUSTRIES</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3 max-w-xs">India's first AI-powered B2B energy trading platform. CCTS-compliant. CBAM-ready. Built for India's energy transition.</p>
              <div className="text-xs text-slate-600">Renergizr Industries Private Limited · Mumbai, India</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">Platform</div>
              <div className="space-y-2">
                {['Energy Marketplace', 'AI Bid Ranking', 'Carbon Credits', 'Vendor Verification', 'Compliance Tools'].map(l => (
                  <div key={l} className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">{l}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-3">Company</div>
              <div className="space-y-2">
                {['About Us', 'How It Works', 'News & Insights', 'Contact', 'Privacy Policy', 'Terms of Service'].map(l => (
                  <div key={l} className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">{l}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[#1E293B] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-700">&copy; 2026 Renergizr Industries Pvt. Ltd. All rights reserved.</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700">Compliant with</span>
              {['CCTS', 'MNRE', 'CEA', 'CBAM'].map(b => (
                <span key={b} className="text-[10px] bg-[#0F172A] border border-[#1E293B] text-slate-500 px-2 py-0.5 rounded-sm">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
