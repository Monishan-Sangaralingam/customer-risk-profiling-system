import { timestampMillis, formatTime, formatDate, formatDateTime } from '../../services/time';
import React, { useCallback, useEffect, useState } from 'react';
import { X, ShieldAlert, Activity, RefreshCw, AlertCircle, Clock, Smartphone, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const CustomerDetailModal = ({ customerId, isOpen, onClose, onRiskRecalculated }) => {
    const [riskData, setRiskData] = useState(null);
    const [history, setHistory] = useState([]);
    const [features, setFeatures] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const loadCustomerData = useCallback(async () => {
        setLoading(true);
        try {
            const [riskRes, historyRes, featureRes, txRes] = await Promise.allSettled([
                api.getCustomerRisk(customerId),
                api.getCustomerRiskHistory(customerId),
                api.getCustomerFeatures(customerId),
                api.getCustomerTransactions(customerId),
            ]);

            if (riskRes.status === 'fulfilled') setRiskData(riskRes.value);
            if (historyRes.status === 'fulfilled') setHistory(historyRes.value || []);
            if (featureRes.status === 'fulfilled') setFeatures(featureRes.value);
            if (txRes.status === 'fulfilled') setTransactions([...(txRes.value || [])].sort((a, b) => timestampMillis(b.transactionDatetime) - timestampMillis(a.transactionDatetime)));
        } catch (err) {
            console.error('Failed to load customer details:', err);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        if (isOpen && customerId) loadCustomerData();
    }, [isOpen, customerId, loadCustomerData]);

    const handleCalculateRisk = async () => {
        setCalculating(true);
        try {
            const updated = await api.calculateRisk(customerId, 'MANUAL_TRIGGER');
            setRiskData(updated);
            // Refresh history
            const hist = await api.getCustomerRiskHistory(customerId);
            setHistory(hist || []);
            if (onRiskRecalculated) onRiskRecalculated(updated);
        } catch (err) {
            alert('Failed to calculate risk: ' + err.message);
        } finally {
            setCalculating(false);
        }
    };

    if (!isOpen) return null;

    const getRiskBadge = (cat) => {
        const category = (cat || 'LOW').toUpperCase();
        if (category === 'HIGH') return 'bg-red-100 text-red-700 border-red-300';
        if (category === 'MEDIUM') return 'bg-amber-100 text-amber-700 border-amber-300';
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-slate-900 to-blue-950 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/30">
                            <ShieldAlert className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-lg">Customer Risk Profile #{customerId}</h2>
                                {riskData?.category && (
                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getRiskBadge(riskData.category)}`}>
                                        {riskData.category.toUpperCase()} RISK
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-300">Detailed behavioral fingerprint & transaction history</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCalculateRisk}
                            disabled={calculating}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${calculating ? 'animate-spin' : ''}`} />
                            {calculating ? 'Profiling...' : 'Recalculate Risk'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                            activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Behavioral Features
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                            activeTab === 'transactions'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Transactions ({transactions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                            activeTab === 'history'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Risk Score History ({history.length})
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm">Loading profile data from microservices...</p>
                        </div>
                    ) : (
                        <>
                            {/* Score Card Banner */}
                            <div className="p-4 rounded-xl bg-linear-to-r from-slate-50 to-blue-50/30 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-extrabold text-gray-900">
                                            {riskData?.score !== undefined ? riskData.score : 'N/A'}
                                            <span className="text-sm font-normal text-gray-400">/100</span>
                                        </div>
                                        <span className="text-xs text-gray-500">Dynamic Risk Score</span>
                                    </div>
                                    <div className="h-10 w-px bg-gray-200" />
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">
                                            Category: <span className={riskData?.category === 'High' ? 'text-red-600' : riskData?.category === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}>{riskData?.category || 'Low'}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Last Updated: {riskData?.calculatedAt ? formatDateTime(riskData.calculatedAt) : 'Recent'}
                                        </div>
                                    </div>
                                </div>
                                {riskData?.reasons && riskData.reasons.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {riskData.reasons.map((r, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium border border-red-200">
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tab 1: Behavioral Features */}
                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-800">Behavioral Anomaly Signals (30-Day Window)</h3>
                                    {features ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">30d Total Amount</span>
                                                <span className="text-base font-bold text-gray-900">LKR {features.totalAmount30d ? Number(features.totalAmount30d).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">30d Transactions</span>
                                                <span className="text-base font-bold text-gray-900">{features.txCount30d || 0}</span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">Max Transaction</span>
                                                <span className="text-base font-bold text-gray-900">LKR {features.maxTxnAmount30d ? Number(features.maxTxnAmount30d).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">Spend Velocity (7d / Prev 7d)</span>
                                                <span className={`text-base font-bold ${features.spendVelocity7dVsPrev7d > 2.0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {features.spendVelocity7dVsPrev7d ? `${features.spendVelocity7dVsPrev7d.toFixed(2)}x` : '1.0x'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">New Device Detected</span>
                                                <span className={`text-base font-bold ${features.newDeviceFlagRecent ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {features.newDeviceFlagRecent ? 'YES (Flagged)' : 'NO (Normal)'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">New Country Flag</span>
                                                <span className={`text-base font-bold ${features.newCountryFlagRecent ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {features.newCountryFlagRecent ? 'YES (Flagged)' : 'NO (Normal)'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">Risky Merchants</span>
                                                <span className={`text-base font-bold ${features.riskyMerchantCount30d > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {features.riskyMerchantCount30d || 0}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">Unique Merchants</span>
                                                <span className="text-base font-bold text-gray-900">{features.uniqueMerchantCount30d || 0}</span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl">
                                                <span className="text-xs text-gray-500 block">eCommerce Ratio</span>
                                                <span className="text-base font-bold text-gray-900">
                                                    {features.ecomRatio30d ? `${(features.ecomRatio30d * 100).toFixed(0)}%` : '0%'}
                                                </span>
                                            </div>
                                            <div className="p-3 bg-white border rounded-xl sm:col-span-2">
                                                <span className="text-xs text-gray-500 block">Latest Transaction Timestamp</span>
                                                <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                                                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                                                    {transactions && transactions.length > 0 && transactions[0].transactionDatetime
                                                        ? `${formatTime(transactions[0].transactionDatetime)} • ${formatDate(transactions[0].transactionDatetime)}`
                                                        : 'No recorded transactions'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 p-4 border border-dashed rounded-xl text-center">
                                            No behavioral feature snapshot found for this customer.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Transactions */}
                            {activeTab === 'transactions' && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-gray-800">Customer Transactions</h3>
                                        <span className="text-xs text-gray-500">{transactions.length} records found</span>
                                    </div>
                                    {transactions.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No recorded transactions for this customer.</p>
                                    ) : (
                                        <div className="border rounded-xl overflow-hidden divide-y text-xs">
                                            {transactions.map((tx) => (
                                                <div key={tx.transactionId} className="p-3 hover:bg-gray-50 flex items-center justify-between gap-4">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">#{tx.transactionId} • {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency || 'LKR'}</div>
                                                        <div className="text-gray-500 flex items-center gap-2 mt-0.5">
                                                            <span>Channel: {tx.channel}</span>
                                                            <span>•</span>
                                                            <span>Device: {tx.deviceCode}</span>
                                                            <span>•</span>
                                                            <span>Loc: {tx.location}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className={`px-2 py-0.5 font-bold rounded-full ${
                                                            tx.transactionStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                            tx.transactionStatus === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {tx.transactionStatus}
                                                        </span>
                                                        <div className="mt-1.5 flex items-center justify-end gap-1 text-xs font-semibold text-gray-800">
                                                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>{tx.transactionDatetime ? formatTime(tx.transactionDatetime) : 'N/A'}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-400">
                                                            {tx.transactionDatetime ? formatDate(tx.transactionDatetime) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Risk Score History */}
                            {activeTab === 'history' && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-800">Historical Risk Transitions</h3>
                                    {history.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">No historical score adjustments logged.</p>
                                    ) : (
                                        <div className="border rounded-xl overflow-hidden divide-y text-xs">
                                            {history.map((h, i) => (
                                                <div key={i} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
                                                            {h.score}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                Category: <span className={h.category === 'High' ? 'text-red-600' : h.category === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}>{h.category}</span>
                                                            </div>
                                                            <div className="text-gray-400">Trigger: {h.triggerType || 'Not recorded'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-gray-400">
                                                        {formatDateTime(h.calculatedAt)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailModal;
