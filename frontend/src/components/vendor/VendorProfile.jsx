import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, CheckCircle, Upload, FileText, Leaf, Shield, Loader2, X } from 'lucide-react';
import Navbar from '../Navbar';
import { API } from '../../App';

const ENERGY_TYPES = ['solar', 'wind', 'hydro', 'thermal', 'green_hydrogen'];
const CERTIFICATIONS = ['MNRE Approved', 'ISO 14001', 'ISO 50001', 'BEE 5-Star', 'GreenPro', 'IGBC', 'Carbon Neutral Certified'];
const REG_DOCS = ['CEA License', 'CERC Registration', 'SECI PPA', 'DISCOM Agreement', 'MNRE Registration', 'GST Certificate', 'Company Incorporation'];

export default function VendorProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  const [form, setForm] = useState({
    company_name: '', description: '', energy_types: [], capacity_mw: '',
    certifications: [], carbon_credits: '', contact_email: '',
    contact_phone: '', website: '', location: '', regulatory_docs: [],
  });
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/vendor/profile`, { withCredentials: true }),
      axios.get(`${API}/vendor/documents`, { withCredentials: true }),
    ]).then(([profileRes, docsRes]) => {
      const r = profileRes.data;
      setVerificationStatus(r.verification_status);
      setForm({
        company_name: r.company_name || '',
        description: r.description || '',
        energy_types: r.energy_types || [],
        capacity_mw: r.capacity_mw || '',
        certifications: r.certifications || [],
        carbon_credits: r.carbon_credits || '',
        contact_email: r.contact_email || '',
        contact_phone: r.contact_phone || '',
        website: r.website || '',
        location: r.location || '',
        regulatory_docs: r.regulatory_docs || [],
      });
      setUploadedDocs(docsRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (key, item) => setForm(f => ({
    ...f, [key]: f[key].includes(item) ? f[key].filter(x => x !== item) : [...f[key], item],
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/vendor/profile`, {
        ...form,
        capacity_mw: form.capacity_mw ? parseFloat(form.capacity_mw) : 0,
        carbon_credits: form.carbon_credits ? parseFloat(form.carbon_credits) : 0,
      }, { withCredentials: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const vBadge = {
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const TABS = [
    { id: 'company', label: 'Company Info', icon: <Shield size={14} /> },
    { id: 'energy', label: 'Energy & Capacity', icon: <Leaf size={14} /> },
    { id: 'compliance', label: 'Compliance & Docs', icon: <FileText size={14} /> },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/vendor/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['Chivo'] font-bold text-2xl text-white">Company Profile</h1>
              <span className={`text-xs px-2.5 py-1 rounded-sm font-semibold capitalize ${vBadge[verificationStatus]}`}>
                {verificationStatus === 'verified' ? 'CCTS Verified' : verificationStatus === 'pending' ? 'Verification Pending' : 'Not Verified'}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Complete all sections to maximize visibility in the marketplace</p>
          </div>
          <button data-testid="save-profile-btn" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white px-4 py-2.5 rounded-sm font-semibold text-sm transition-colors glow-primary">
            {saved ? <><CheckCircle size={14} /> Saved!</> : saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Save</>}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0F172A] border border-[#1E293B] rounded-sm p-1 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-sm transition-colors duration-200 ${activeTab === t.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Company Info Tab */}
        {activeTab === 'company' && (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6 space-y-5">
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Company Name *</label>
              <input data-testid="company-name-input" value={form.company_name} onChange={e => upd('company_name', e.target.value)}
                className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                placeholder="Your Company Pvt. Ltd." />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">About Company</label>
              <textarea data-testid="company-description-input" value={form.description} onChange={e => upd('description', e.target.value)}
                rows={4} className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors resize-none"
                placeholder="Describe your company, expertise, installed capacity, and key projects..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Location</label>
                <input data-testid="company-location-input" value={form.location} onChange={e => upd('location', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="Mumbai, Maharashtra" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Website</label>
                <input data-testid="website-input" value={form.website} onChange={e => upd('website', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="https://yourcompany.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Contact Email</label>
                <input data-testid="contact-email-input" type="email" value={form.contact_email} onChange={e => upd('contact_email', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="contact@company.com" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Phone</label>
                <input data-testid="contact-phone-input" value={form.contact_phone} onChange={e => upd('contact_phone', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>
        )}

        {/* Energy & Capacity Tab */}
        {activeTab === 'energy' && (
          <div className="space-y-5">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
              <h3 className="font-['Chivo'] font-bold text-base text-white mb-4">Energy Specialization</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {ENERGY_TYPES.map(t => (
                  <button key={t} type="button" data-testid={`energy-type-${t}`} onClick={() => toggle('energy_types', t)}
                    className={`text-sm px-4 py-2 rounded-sm border capitalize transition-all duration-200 ${form.energy_types.includes(t) ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-[#1E293B] text-slate-400 hover:border-[#334155] hover:text-white'}`}>
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Total Installed Capacity (MW)</label>
                <input data-testid="capacity-input" type="number" value={form.capacity_mw} onChange={e => upd('capacity_mw', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="500" />
              </div>
            </div>

            {/* Carbon Credits */}
            <div className="bg-[#0F172A] border border-emerald-500/20 rounded-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={16} strokeWidth={1.5} className="text-emerald-400" />
                <h3 className="font-['Chivo'] font-bold text-base text-white">Carbon Credits (CCTS)</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                India's Carbon Credit Trading Scheme (CCTS) allows vendors to showcase verified carbon credit balances. This is checked during vendor verification and displayed to buyers in the marketplace.
              </p>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Carbon Credits Balance (tCO2e)</label>
                <input data-testid="carbon-credits-input" type="number" value={form.carbon_credits} onChange={e => upd('carbon_credits', e.target.value)}
                  className="w-full bg-[#020617] border border-emerald-500/20 focus:border-emerald-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="1000" />
                <p className="text-xs text-slate-600 mt-2">Current CCTS price: ₹245.50/tCO2e · EU CBAM: €68.50/tCO2e</p>
              </div>
              {form.carbon_credits && (
                <div className="mt-4 bg-emerald-500/5 border border-emerald-500/10 rounded-sm p-3">
                  <div className="text-xs text-slate-500">Estimated portfolio value</div>
                  <div className="font-['Chivo'] font-bold text-xl text-emerald-400">
                    ₹{(parseFloat(form.carbon_credits || 0) * 245.50).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-slate-600">at current CCTS rate of ₹245.50/tCO2e</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance & Docs Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-5">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
              <h3 className="font-['Chivo'] font-bold text-base text-white mb-2">Green Certifications</h3>
              <p className="text-xs text-slate-500 mb-4">Select certifications your company holds. These are verified by the Renergizr admin team.</p>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map(c => (
                  <button key={c} type="button" data-testid={`cert-${c.replace(/\s+/g, '-').toLowerCase()}`} onClick={() => toggle('certifications', c)}
                    className={`text-xs px-3 py-1.5 rounded-sm border font-medium transition-all duration-200 ${form.certifications.includes(c) ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-[#1E293B] text-slate-400 hover:border-[#334155]'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
              <h3 className="font-['Chivo'] font-bold text-base text-white mb-2">Regulatory Documents</h3>
              <p className="text-xs text-slate-500 mb-4">Select documents you hold. Upload functionality coming in next release — admin will contact you for physical verification.</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {REG_DOCS.map(d => (
                  <button key={d} type="button" data-testid={`reg-doc-${d.replace(/\s+/g, '-').toLowerCase()}`} onClick={() => toggle('regulatory_docs', d)}
                    className={`text-xs px-3 py-1.5 rounded-sm border font-medium transition-all duration-200 ${form.regulatory_docs.includes(d) ? 'border-sky-500/40 bg-sky-500/10 text-sky-400' : 'border-[#1E293B] text-slate-400 hover:border-[#334155]'}`}>
                    {d}
                  </button>
                ))}
              </div>

              {/* Document Upload Placeholder */}
              <div className="border-2 border-dashed border-[#1E293B] hover:border-sky-500/30 rounded-sm p-6 text-center transition-colors cursor-pointer group">
                <Upload size={24} strokeWidth={1} className="text-slate-700 group-hover:text-sky-400 mx-auto mb-3 transition-colors" />
                <div className="text-sm text-slate-500 mb-1">Document Upload</div>
                <div className="text-xs text-slate-600">PDF, JPG, PNG · Max 10MB per file</div>
                <div className="text-xs text-amber-400 mt-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-sm inline-block">
                  Coming Soon — Admin verification via email for now
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className={`rounded-sm p-4 border ${vBadge[verificationStatus]}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} />
                <span className="text-sm font-semibold capitalize">
                  {verificationStatus === 'verified' ? 'Profile Verified by Renergizr' : verificationStatus === 'pending' ? 'Verification In Progress' : 'Verification Required'}
                </span>
              </div>
              <p className="text-xs opacity-70 leading-relaxed">
                {verificationStatus === 'verified'
                  ? 'Your profile has been verified. You are visible in the marketplace and can bid on all open RFQs.'
                  : verificationStatus === 'pending'
                  ? 'Our team is reviewing your profile. You can still bid while verification is pending.'
                  : 'Please complete your profile and submit regulatory documents for verification.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
