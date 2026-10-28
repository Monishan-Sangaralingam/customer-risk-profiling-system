import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function Header({ menuOpen, menuButton, onToggleMenu }) {
    const [status, setStatus] = useState('CHECKING');
    useEffect(() => {
        let active = true;
        async function check() {
            const result = await api.getGatewayHealth();
            if (active) setStatus(result.status === 'UP' ? 'ONLINE' : 'UNAVAILABLE');
        }
        check(); const timer = setInterval(check, 30000);
        return () => { active = false; clearInterval(timer); };
    }, []);
    return <header className="min-h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between gap-2 px-3 sm:px-6 py-3">
        <div className="flex items-center gap-2 min-w-0">
            <button ref={menuButton} type="button" aria-label="Open navigation" aria-expanded={menuOpen} className="lg:hidden p-2 rounded-lg border border-slate-200" onClick={onToggleMenu}><Menu className="w-5 h-5" /></button>
            <img src="/ceylonbank-icon.svg" alt="" className="w-6 h-6" />
            <span className="hidden sm:inline text-sm font-semibold">CeylonBank RiskGuard AI</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
            <span role="status" className={`text-xs font-semibold rounded-full px-2.5 py-1.5 ${status === 'ONLINE' ? 'bg-green-50 text-green-800' : status === 'CHECKING' ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-800'}`}>APIs: {status}</span>
            <Link to="/alerts" aria-label="Fraud alerts" className="p-2"><Bell className="w-5 h-5" /></Link>
        </div>
    </header>;
}
