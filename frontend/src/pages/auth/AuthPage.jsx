import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { saveSession } from '../../services/session';

export default function AuthPage({ signup = false }) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(event) {
        event.preventDefault(); setBusy(true); setError('');
        try {
            const result = signup ? await api.register(name, email, password) : await api.login(email, password);
            saveSession(result, remember); navigate('/', { replace: true });
        } catch (e) { setError(e.message); } finally { setBusy(false); }
    }
    return <main className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6"><img src="/ceylonbank-icon.svg" alt="" className="w-10 h-10" /><span className="font-bold text-xl">CeylonBank RiskGuard AI</span></div>
            <h1 className="text-2xl font-bold">{signup ? 'Create your account' : 'Sign in'}</h1>
            <p className="text-slate-400 text-sm mt-2 mb-6">Customer risk profiling and fraud monitoring</p>
            <form onSubmit={submit} className="space-y-4">
                {signup && <label className="block text-sm">Full name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={80} required className="block w-full mt-1 p-3 rounded-lg bg-slate-950 border border-slate-600" /></label>}
                <label className="block text-sm">Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required className="block w-full mt-1 p-3 rounded-lg bg-slate-950 border border-slate-600" /></label>
                <label className="block text-sm">Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={signup ? 12 : undefined} maxLength={128} required className="block w-full mt-1 p-3 rounded-lg bg-slate-950 border border-slate-600" /></label>
                {signup && <p className="text-xs text-slate-400">Use at least 12 characters.</p>}
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Remember me on this device</label>
                {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
                <button disabled={busy} type="submit" className="w-full rounded-lg bg-blue-600 p-3 font-semibold disabled:opacity-50">{busy ? 'Connecting…' : signup ? 'Create account' : 'Sign in'}</button>
            </form>
            <p className="text-sm text-slate-400 mt-6">{signup ? 'Already registered?' : 'New here?'} <Link className="text-blue-300 underline" to={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link></p>
        </div>
    </main>;
}
