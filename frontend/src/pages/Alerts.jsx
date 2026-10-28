import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight, Filter, Bell, CheckCircle2, ShieldAlert, RefreshCw, Eye } from 'lucide-react';
import CustomerDetailModal from '../components/modals/CustomerDetailModal';
import api from '../services/api';
import { buildAlerts } from '../services/alerts';

const Alerts = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const loadAlerts = async () => {
        setLoading(true); setError('');
        try {
            const [scores, txs, settings, statuses] = await Promise.all([api.getAllRiskScores(), api.getAllTransactions(), api.getSettings(), api.getAlertStatuses()]);
            setAlerts(buildAlerts(scores, txs, settings, statuses));
        } catch (e) { setError(e.message); } finally { setLoading(false); }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    const updateStatus = async (alertId, newStatus) => {
        setSavingId(alertId); setError('');
        try {
            const selected = alerts.find(item => item.id === alertId);
            await api.updateAlertStatus(alertId, newStatus, selected.eventKey);
            setAlerts(previous => previous.map(item => item.id === alertId ? { ...item, status: newStatus } : item));
        } catch (e) { setError(e.message); } finally { setSavingId(null); }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'Critical': return 'bg-red-600 text-white';
            case 'High': return 'bg-amber-600 text-white';
            default: return 'bg-blue-600 text-white';
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (activeTab === 'All') return true;
        if (activeTab === 'New') return a.status === 'New';
        if (activeTab === 'Investigating') return a.status === 'Investigating';
        if (activeTab === 'Resolved') return a.status === 'Resolved';
        return true;
    });

    const handleOpenCustomer = (customerId) => {
        setSelectedCustomerId(customerId);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</p>}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fraud Risk Alerts</h1>
                    <p className="text-gray-500 text-sm">Real-time alerts triggered by customer risk escalations & declines</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadAlerts}
                        disabled={loading}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        Refresh Alerts
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-semibold">
                {['All', 'New', 'Investigating', 'Resolved'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-xl transition-colors ${
                            activeTab === tab
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {tab} {tab === 'All' ? `(${alerts.length})` : `(${alerts.filter(a => a.status === tab).length})`}
                    </button>
                ))}
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Aggregating active fraud alerts from microservices...</span>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <h4 className="font-bold text-gray-700 text-sm">No Alerts in this Category</h4>
                        <p className="text-xs text-gray-400 mt-1">All profiles in this state have been addressed.</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${getPriorityBadge(alert.priority)}`}>
                                        {alert.priority.toUpperCase()}
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-sm">{alert.title}</h3>
                                </div>
                                <span className="text-xs text-gray-400">{alert.time}</span>
                            </div>

                            <div className="py-3">
                                <p className="text-xs text-gray-600 leading-relaxed">{alert.desc}</p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {alert.tags.map((tag, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-800">{alert.customer}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className={`font-bold ${alert.riskScore >= 70 ? 'text-red-600' : 'text-amber-600'}`}>
                                        Risk Score: {alert.riskScore == null ? 'Unavailable' : `${alert.riskScore}/100`}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenCustomer(alert.customerId)}
                                        className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg font-semibold transition-colors border border-slate-200"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View Profile
                                    </button>

                                    {alert.status !== 'Resolved' ? (
                                        <button
                                            disabled={savingId === alert.id}
                                            onClick={() => updateStatus(alert.id, 'Resolved')}
                                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-500 font-semibold rounded-lg">
                                            Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Customer Detail Modal */}
            <CustomerDetailModal
                customerId={selectedCustomerId}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onRiskRecalculated={() => loadAlerts()}
            />
        </div>
    );
};

export default Alerts;
