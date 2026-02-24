import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import Navbar from '../Navbar';
import { API } from '../../App';

const ENERGY_TYPES = ['solar', 'wind', 'hydro', 'thermal', 'green_hydrogen'];
const CERTIFICATIONS = ['MNRE Approved', 'ISO 14001', 'ISO 50001', 'BEE 5-Star', 'GreenPro', 'IGBC', 'Carbon Neutral Certified'];

export default function VendorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    company_name: '', description: '', energy_types: [], capacity_mw: '',
    certifications: [], carbon_credits: '', contact_email: '',
    contact_phone: '', website: '', location: '', regulatory_docs: [],
  });

  useEffect(() => {
    axios.get(`${API}/vendor/profile`, { withCredentials: true })
      .then(r => {
        setProfile(r.data);
        setForm({
          company_name: r.data.company_name || '',
          description: r.data.description || '',
          energy_types: r.data.energy_types || [],
          capacity_mw: r.data.capacity_mw || '',
          certifications: r.data.certifications || [],
          carbon_credits: r.data.carbon_credits || '',
          contact_email: r.data.contact_email || '',
          contact_phone: r.data.contact_phone || '',
          website: r.data.website || '',
          location: r.data.location || '',
          regulatory_docs: r.data.regulatory_docs || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleList = (key, item) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(item) ? f[key].filter(x => x !== item) : [...f[key], item],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        capacity_mw: form.capacity_mw ? parseFloat(form.capacity_mw) : 0,
        carbon_credits: form.carbon_credits ? parseFloat(form.carbon_credits) : 0,
      };
      const res = await axios.put(`${API}/vendor/profile`, payload, { withCredentials: true });
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const verificationBadge = {
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/vendor/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-['Chivo'] font-bold text-2xl text-white">Company Profile</h1>
              {profile?.verification_status && (
                <span className={`text-xs px-2.5 py-1 rounded-sm font-semibold capitalize ${verificationBadge[profile.verification_status]}`}>
                  {profile.verification_status}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Complete your profile to appear in the vendor marketplace</p>
          </div>
          <button
            data-testid="save-profile-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white px-4 py-2.5 rounded-sm font-semibold text-sm transition-colors glow-primary"
          >
            {saved ? <><CheckCircle size={14} /> Saved</> : saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Save Profile</>}
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
            <h2 className="font-['Chivo'] font-bold text-base text-white mb-5">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Company Name *</label>
                <input
                  data-testid="company-name-input"
                  value={form.company_name}
                  onChange={e => upd('company_name', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="Your Company Pvt. Ltd."
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">About Company</label>
                <textarea
                  data-testid="company-description-input"
                  value={form.description}
                  onChange={e => upd('description', e.target.value)}
                  rows={3}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors resize-none"
                  placeholder="Brief description of your company and expertise..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Location</label>
                  <input
                    data-testid="company-location-input"
                    value={form.location}
                    onChange={e => upd('location', e.target.value)}
                    className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                    placeholder="Mumbai, Maharashtra"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Total Capacity (MW)</label>
                  <input
                    data-testid="capacity-input"
                    type="number"
                    value={form.capacity_mw}
                    onChange={e => upd('capacity_mw', e.target.value)}
                    className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Contact Email</label>
                  <input
                    data-testid="contact-email-input"
                    type="email"
                    value={form.contact_email}
                    onChange={e => upd('contact_email', e.target.value)}
                    className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Phone</label>
                  <input
                    data-testid="contact-phone-input"
                    value={form.contact_phone}
                    onChange={e => upd('contact_phone', e.target.value)}
                    className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Website</label>
                <input
                  data-testid="website-input"
                  value={form.website}
                  onChange={e => upd('website', e.target.value)}
                  className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
          </div>

          {/* Energy Types */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
            <h2 className="font-['Chivo'] font-bold text-base text-white mb-5">Energy Specialization</h2>
            <div className="flex flex-wrap gap-2">
              {ENERGY_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  data-testid={`energy-type-${t}`}
                  onClick={() => toggleList('energy_types', t)}
                  className={`text-sm px-4 py-2 rounded-sm border capitalize transition-all duration-200 ${
                    form.energy_types.includes(t)
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                      : 'border-[#1E293B] text-slate-400 hover:border-[#334155] hover:text-white'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-['Chivo'] font-bold text-base text-white">Certifications & Compliance</h2>
              <span className="text-xs text-slate-500">Used for vendor verification</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {CERTIFICATIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  data-testid={`cert-${c.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => toggleList('certifications', c)}
                  className={`text-xs px-3 py-1.5 rounded-sm border font-medium transition-all duration-200 ${
                    form.certifications.includes(c)
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#1E293B] text-slate-400 hover:border-[#334155]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">Carbon Credits Balance (tCO2e)</label>
              <input
                data-testid="carbon-credits-input"
                type="number"
                value={form.carbon_credits}
                onChange={e => upd('carbon_credits', e.target.value)}
                className="w-full bg-[#020617] border border-[#1E293B] focus:border-sky-500 text-white placeholder-slate-600 px-4 py-3 rounded-sm text-sm outline-none transition-colors"
                placeholder="1000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
