import { formatDateTime } from '../services/time';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { clearSession, getSession } from '../services/session';
import ServiceHealth from '../components/layout/ServiceHealth';

export default function Settings() {
    const [tab, setTab] = useState('Data Sources');
    const [settings, setSettings] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const session = getSession();
    useEffect(() => { api.getSettings().then(setSettings).catch(e => setError(e.message)); }, []);
    async function save(event) {
        event.preventDefault(); setBusy(true); setError(''); setMessage('');
        try { setSettings(await api.saveSettings(settings)); setMessage('Settings saved. Risk thresholds apply to future calculations.'); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    }
    async function changePassword(event) {
        event.preventDefault(); setBusy(true); setError('');
        try { await api.changePassword(currentPassword, newPassword); clearSession(); window.location.assign('/login'); }
        catch (e) { setError(e.message); } finally { setBusy(false); }
    }
    const set = (key, value) => setSettings(old => ({ ...old, [key]: value }));
    return <div className="space-y-5 max-w-4xl">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-600">Manage risk thresholds, alert visibility, and your account.</p>
        <div role="tablist" className="flex gap-2 overflow-x-auto border-b pb-2">
            {['Model Configuration', 'Alert Settings', 'Data Sources', 'Security'].map(name => <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => { setTab(name); setMessage(''); setError(''); }} className={`shrink-0 px-3 py-2 text-sm rounded-lg ${tab === name ? 'bg-blue-600 text-white' : 'bg-white border'}`}>{name}</button>)}
        </div>
        {error && <p role="alert" className="text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
        {message && <p role="status" className="text-green-800 bg-green-50 p-3 rounded-lg">{message}</p>}
        {tab === 'Data Sources' && <div className="space-y-5">
            <ServiceHealth />
            <section className="bg-white border rounded-xl p-5 space-y-3 text-sm">
                <h2 className="font-semibold">Application endpoints</h2>
                <p className="break-all">Transactions: {api.serviceUrls.transactions}</p>
                <p className="break-all">Risk scoring: {api.serviceUrls.risk}</p>
                <p className="text-slate-600">These connections are managed by the application deployment.</p>
            </section>
        </div>}
        {['Model Configuration', 'Alert Settings'].includes(tab) && (!settings ? <p>Loading settings…</p> : <form onSubmit={save} className="bg-white border rounded-xl p-5 space-y-5">
            {tab === 'Model Configuration' ? <>
                <h2 className="font-semibold">Risk bands</h2>
                <p className="text-sm text-slate-600">Scores below the medium threshold are Low. Scores at or above the high threshold are High.</p>
                <label className="block text-sm">Medium risk starts at<input type="number" min="1" max="98" required value={settings.mediumThreshold} onChange={e => set('mediumThreshold', Number(e.target.value))} className="block mt-1 border rounded-lg p-2 w-32" /></label>
                <label className="block text-sm">High risk starts at<input type="number" min={settings.mediumThreshold + 1} max="100" required value={settings.highThreshold} onChange={e => set('highThreshold', Number(e.target.value))} className="block mt-1 border rounded-lg p-2 w-32" /></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.fallbackEnabled} onChange={e => set('fallbackEnabled', e.target.checked)} />Allow rule-based fallback when the ML model is unavailable</label>
                <p className="text-xs text-slate-600">Existing scores keep their current band until recalculated. High-risk transactions are declined automatically.</p>
            </> : <>
                <h2 className="font-semibold">Alerts shown to analysts</h2>
                {[['showHighRisk', 'High-risk profiles'], ['showMediumRisk', 'Medium-risk profiles'], ['showDeclined', 'Declined transactions']].map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings[key]} onChange={e => set(key, e.target.checked)} />{label}</label>)}
                <p className="text-xs text-slate-600">These preferences apply to the dashboard and Fraud Alerts page. Transaction decisions are unchanged.</p>
            </>}
            <button disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{busy ? 'Saving…' : 'Save settings'}</button>
        </form>)}
        {tab === 'Security' && <section className="bg-white border rounded-xl p-5 space-y-5">
            <div className="text-sm space-y-2"><h2 className="font-semibold">Your account</h2><p>{session?.user.name}</p><p>{session?.user.email}</p><p>Session expires: {session ? formatDateTime(session.expiresAt) : 'Signed out'}</p></div>
            <form onSubmit={changePassword} className="space-y-4 max-w-sm">
                <h3 className="font-semibold">Change password</h3>
                <label className="block text-sm">Current password<input type="password" autoComplete="current-password" value={currentPassword} required maxLength={128} onChange={e => setCurrentPassword(e.target.value)} className="block w-full border rounded-lg p-2 mt-1" /></label>
                <label className="block text-sm">New password<input type="password" autoComplete="new-password" value={newPassword} required minLength={12} maxLength={128} onChange={e => setNewPassword(e.target.value)} className="block w-full border rounded-lg p-2 mt-1" /></label>
                <p className="text-xs text-slate-600">Use at least 12 characters. Changing your password signs out all sessions.</p>
                <button disabled={busy} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">{busy ? 'Updating…' : 'Change password and sign out'}</button>
            </form>
        </section>}
    </div>;
}
