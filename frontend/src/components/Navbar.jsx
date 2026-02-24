import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, FileText, Search, User, Settings, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useAuth, API } from '../App';
import axios from 'axios';

const clientLinks = [
  { href: '/client/dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.5} />, label: 'Dashboard' },
  { href: '/client/rfqs/new', icon: <FileText size={16} strokeWidth={1.5} />, label: 'New RFQ' },
];
const vendorLinks = [
  { href: '/vendor/dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.5} />, label: 'Dashboard' },
  { href: '/vendor/marketplace', icon: <Search size={16} strokeWidth={1.5} />, label: 'Marketplace' },
  { href: '/vendor/profile', icon: <User size={16} strokeWidth={1.5} />, label: 'My Profile' },
];
const adminLinks = [
  { href: '/admin', icon: <Settings size={16} strokeWidth={1.5} />, label: 'Admin Panel' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = React.useState(false);

  if (!user) return null;

  const links = user.role === 'client' ? clientLinks : user.role === 'vendor' ? vendorLinks : adminLinks;
  const roleColor = user.role === 'client' ? 'text-sky-400' : user.role === 'vendor' ? 'text-emerald-400' : 'text-amber-400';
  const roleBg = user.role === 'client' ? 'bg-sky-500/10' : user.role === 'vendor' ? 'bg-emerald-500/10' : 'bg-amber-500/10';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav data-testid="app-navbar" className="bg-[#0F172A]/95 backdrop-blur-xl border-b border-[#1E293B] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to={user.role === 'admin' ? '/admin' : `/${user.role}/dashboard`} className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 bg-sky-500 rounded-sm flex items-center justify-center">
            <Zap size={12} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-['Chivo'] font-black text-base text-white hidden sm:block">RENERGIZR</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              to={l.href}
              data-testid={`nav-${l.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors duration-200 ${
                location.pathname === l.href
                  ? 'bg-[#1E293B] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#1E293B]/50'
              }`}
            >
              {l.icon}
              <span className="hidden sm:block">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="relative ml-auto">
          <button
            data-testid="user-menu-btn"
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] px-3 py-1.5 rounded-sm transition-colors duration-200"
          >
            <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">{user.name}</div>
              <div className={`text-xs ${roleColor} capitalize`}>{user.role}</div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#0F172A] border border-[#1E293B] rounded-sm shadow-xl z-50">
              <div className="px-4 py-3 border-b border-[#1E293B]">
                <div className="text-xs text-white font-semibold truncate">{user.email}</div>
                <div className={`text-xs ${roleColor} ${roleBg} inline-block px-1.5 py-0.5 rounded-sm mt-1 capitalize font-semibold`}>
                  {user.role}
                </div>
              </div>
              <button
                data-testid="logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
