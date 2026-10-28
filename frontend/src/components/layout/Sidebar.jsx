import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldAlert, Bell, Settings, LogOut, Landmark } from 'lucide-react';
import clsx from 'clsx';
import api from '../../services/api';
import { getSession, clearSession } from '../../services/session';

const Sidebar = ({ onNavigate }) => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Customer Profiles', path: '/customers', icon: Users },
        { name: 'Risk Analysis', path: '/risk-analysis', icon: ShieldAlert },
        { name: 'Fraud Alerts', path: '/alerts', icon: Bell },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    // Read active user session
    let currentUser = {
        name: 'Risk Analyst',
        role: 'Lead Fraud Analyst',
        email: '',
        bankCode: 'CEYLONBANK',
        bankName: 'CeylonBank PLC',
    };

    try {
        const stored = getSession()?.user;
        if (stored) {
            currentUser = { ...currentUser, ...stored };
        }
    } catch {
        // use fallback defaults
    }

    const handleSignOut = async () => {
        try { await api.logout(); }
        catch { alert('Unable to sign out on the server. Check your connection and try again.'); return; }
        clearSession();
        window.location.assign('/login');
    };

    return (
        <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200">
            {/* CeylonBank Branding */}
            <div className="p-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0 p-1.5 border border-amber-400/30">
                        <img src="/ceylonbank-icon.svg" alt="CeylonBank" className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg font-black text-white tracking-tight">
                                Ceylon<span className="text-amber-400">Bank</span>
                            </span>
                        </div>
                        <p className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase">
                            RiskGuard AI System
                        </p>
                    </div>
                </div>

                <div className="mt-3 px-2.5 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-medium text-amber-300/90 truncate">Fraud Intelligence Division</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1 shadow-xs shadow-emerald-400/50"></span>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-4 space-y-1.5">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                            )
                        }
                    >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile Card and Sign Out */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60">
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            CB
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                                {currentUser.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                                {currentUser.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                        title="Sign Out to Terminal"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
