import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ServiceHealth() {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function refresh() {
        setBusy(true); setError('');
        try {
            const [health, info, model] = await Promise.allSettled([api.getGatewayHealth(), api.getSystemInfo(), api.getModelStatus()]);
            setData({ services: health.status === 'fulfilled' ? health.value.services : [], database: info.status === 'fulfilled' ? info.value : null, model: model.status === 'fulfilled' ? model.value : null });
        } catch (e) { setError(e.message); } finally { setBusy(false); }
    }
    useEffect(() => { refresh(); }, []);
    return <section aria-label="Service connections" className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Service connections</h3><button type="button" disabled={busy} className="text-sm text-blue-700 underline disabled:opacity-50" onClick={refresh}>{busy ? 'Checking…' : 'Check connections'}</button></div>
        {error && <p role="alert">{error}</p>}
        {data?.services.map(service => <div key={service.name} className="flex justify-between gap-2 text-sm"><span>{service.name}</span><span className={service.status === 'UP' ? 'text-green-700' : 'text-red-700'}>{service.status}</span></div>)}
        <div className="flex justify-between gap-2 text-sm"><span>ML model</span><span>{!data ? 'Checking…' : data.model?.model_loaded ? 'Loaded' : 'Unavailable'}</span></div>
        <div className="text-sm"><span>Database: </span>{!data ? 'Checking…' : data.database ? `${data.database.database} ${data.database.databaseVersion}` : 'Unavailable'}</div>
    </section>;
}
