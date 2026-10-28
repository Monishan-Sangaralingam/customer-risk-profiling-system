import React, { useState, useEffect } from 'react';
import { ShieldCheck, Brain, Database, Activity, Lock, TrendingUp, Search, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import api from '../services/api';

const RiskAnalysis = () => {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [settings, setSettings] = useState({ mediumThreshold: 40, highThreshold: 70 });
    const [knownCustomers, setKnownCustomers] = useState([]);
    const [riskResult, setRiskResult] = useState(null);
    const [features, setFeatures] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    // Live portfolio summary stats
    const [riskSummary, setRiskSummary] = useState({
        low: 0,
        medium: 0,
        high: 0,
        total: 0,
    });

    useEffect(() => {
        loadPortfolioSummary();
        api.getSettings().then(setSettings).catch(e => setError(e.message));
    }, []);

    const loadPortfolioSummary = async () => {
        try {
            const list = await api.getAllRiskScores();
            if (Array.isArray(list)) {
                setKnownCustomers(list.map(item => item.customerId));
                const low = list.filter(r => (r.category || '').toLowerCase() === 'low').length;
                const medium = list.filter(r => (r.category || '').toLowerCase() === 'medium').length;
                const high = list.filter(r => (r.category || '').toLowerCase() === 'high').length;
                setRiskSummary({
                    low,
                    medium,
                    high,
                    total: list.length,
                });
            }
        } catch (err) {
            console.error('Failed to load risk summary:', err);
        }
    };

    const runAnalysis = async (customerIdToRun) => {
        const cid = customerIdToRun || selectedCustomerId;
        if (!cid) return;

        setAnalyzing(true);
        setError(null);
        try {
            const result = await api.calculateRisk(cid, 'ANALYST_WORKBENCH');
            const [snapshot, entries] = await Promise.all([api.getCustomerFeatures(cid), api.getCustomerRiskHistory(cid)]);
            setRiskResult(result); setFeatures(snapshot); setHistory(entries);
            await loadPortfolioSummary();
        } catch (err) {
            setError(err.message || 'Error executing risk profiling');
        } finally {
            setAnalyzing(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= settings.highThreshold) return 'text-red-600';
        if (score >= settings.mediumThreshold) return 'text-amber-500';
        return 'text-emerald-600';
    };

    const getScoreBg = (score) => {
        if (score >= settings.highThreshold) return 'bg-red-500';
        if (score >= settings.mediumThreshold) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Risk Profiling & Analytics Workbench</h1>
                    <p className="text-gray-500 text-sm">
                        Execute live behavioral risk scoring, feature analysis, and ML inference
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                        Microservice Engine v2.0
                    </span>
                </div>
            </div>

            {/* Interactive Live Risk Profiler Workbench */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs uppercase tracking-wider font-bold text-blue-400">Live Profiler</span>
                            <h2 className="text-xl font-bold mt-1">On-Demand Behavioral Risk Calculation</h2>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Enter any customer ID to trigger real-time 30-day velocity calculation and risk band assignment.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Customer ID..."
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                className="px-3.5 py-2 text-sm text-gray-900 bg-white rounded-xl focus:ring-2 focus:ring-blue-400 w-36 outline-none font-semibold"
                            />
                            <button
                                onClick={() => runAnalysis()}
                                disabled={analyzing}
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-md disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                                {analyzing ? 'Profiling...' : 'Calculate Risk'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {riskResult && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Score Dial & Result Card */}
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dynamic Risk Result</span>
                                    <h3 className="text-base font-bold text-gray-800 mt-1">Customer #{riskResult.customerId}</h3>

                                    <div className="my-6">
                                        <div className={`text-6xl font-black ${getScoreColor(riskResult.score)}`}>
                                            {riskResult.score}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Risk Index (0 - 100)</div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-4">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ${getScoreBg(riskResult.score)}`}
                                            style={{ width: `${Math.min(100, riskResult.score)}%` }}
                                        />
                                    </div>

                                    <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border">
                                        Band: <span className={getScoreColor(riskResult.score)}>{riskResult.category} RISK</span>
                                    </div>
                                </div>

                                <div className="text-[11px] text-gray-400 border-t pt-3 mt-4">
                                    Calculated: {new Date(riskResult.calculatedAt).toLocaleString()}
                                </div>
                            </div>

                            {/* Behavioral Signals */}
                            <div className="lg:col-span-2 space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">Triggered Risk Reasons & Signals</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {riskResult.reasons && riskResult.reasons.length > 0 ? (
                                            riskResult.reasons.map((r, i) => (
                                                <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-1.5">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {r}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Normal transaction behavior, no anomaly triggers tripped.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h4 className="text-sm font-bold text-gray-900 pt-2">Behavioral Feature Snapshot (30-Day Aggregation)</h4>
                                {features ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">Spend Velocity</span>
                                            <span className={`font-bold text-sm ${features.spendVelocity7dVsPrev7d > 2.0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {features.spendVelocity7dVsPrev7d ? `${features.spendVelocity7dVsPrev7d.toFixed(2)}x` : '1.00x'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">30d Volume</span>
                                            <span className="font-bold text-sm text-gray-900">
                                                LKR {features.totalAmount30d ? Number(features.totalAmount30d).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">30d Transactions</span>
                                            <span className="font-bold text-sm text-gray-900">
                                                {features.txCount30d || 0}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">Risky Merchants</span>
                                            <span className={`font-bold text-sm ${features.riskyMerchantCount30d > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                {features.riskyMerchantCount30d || 0}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">New Device Flag</span>
                                            <span className={`font-bold text-xs ${features.newDeviceFlagRecent ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {features.newDeviceFlagRecent ? 'FLAGGED' : 'NORMAL'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">New Country Flag</span>
                                            <span className={`font-bold text-xs ${features.newCountryFlagRecent ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {features.newCountryFlagRecent ? 'FLAGGED' : 'NORMAL'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">Max Single Tx</span>
                                            <span className="font-bold text-sm text-gray-900">
                                                LKR {features.maxTxnAmount30d ? Number(features.maxTxnAmount30d).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white border rounded-xl shadow-2xs">
                                            <span className="text-gray-400 block text-[11px]">eCommerce Ratio</span>
                                            <span className="font-bold text-sm text-gray-900">
                                                {features.ecomRatio30d ? `${(features.ecomRatio30d * 100).toFixed(0)}%` : '0%'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">Loading features...</p>
                                )}

                                {/* Quick Switch to Other Real Customers */}
                                <div className="pt-3 border-t">
                                    <span className="text-xs font-semibold text-gray-500 mr-2">Try Customer:</span>
                                    {knownCustomers.slice(0, 6).map((id) => (
                                        <button
                                            key={id}
                                            onClick={() => {
                                                setSelectedCustomerId(id);
                                                runAnalysis(id);
                                            }}
                                            className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg mr-1.5 transition-colors"
                                        >
                                            #{id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Risk Distribution Section */}
            <section>
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Live Portfolio Risk Segmentation</h2>
                    {riskResult && <p className="text-xs text-slate-500">{history.length} recent calculations recorded for customer #{riskResult.customerId}</p>}
                    <p className="text-xs text-gray-500">Current risk bands from the application database</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-base font-bold text-gray-900">Low Risk</h3>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Score 0 – {settings.mediumThreshold - 1}</span>
                        </div>
                        <h4 className="text-4xl font-extrabold text-emerald-600 mb-1">{riskSummary.low}</h4>
                        <p className="text-xs text-gray-400">Normal processing / No intervention</p>
                        <div className="text-xs font-bold text-emerald-700 mt-2">
                            {riskSummary.total ? `${((riskSummary.low / riskSummary.total) * 100).toFixed(0)}% of total` : '0%'}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-base font-bold text-gray-900">Medium Risk</h3>
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Score {settings.mediumThreshold} – {settings.highThreshold - 1}</span>
                        </div>
                        <h4 className="text-4xl font-extrabold text-amber-500 mb-1">{riskSummary.medium}</h4>
                        <p className="text-xs text-gray-400">Step-up Authentication / Watchlist</p>
                        <div className="text-xs font-bold text-amber-700 mt-2">
                            {riskSummary.total ? `${((riskSummary.medium / riskSummary.total) * 100).toFixed(0)}% of total` : '0%'}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-base font-bold text-gray-900">High Risk</h3>
                            <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Score {settings.highThreshold} – 100</span>
                        </div>
                        <h4 className="text-4xl font-extrabold text-red-600 mb-1">{riskSummary.high}</h4>
                        <p className="text-xs text-gray-400">Decline / Fraud Analyst Review</p>
                        <div className="text-xs font-bold text-red-700 mt-2">
                            {riskSummary.total ? `${((riskSummary.high / riskSummary.total) * 100).toFixed(0)}% of total` : '0%'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture Highlights */}
            <section>
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Core Microservices Engine</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-blue-600" />
                            Machine Learning & Heuristics
                        </h3>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Continuous evaluation combining trained behavioral anomaly detection models with custom fraud heuristics.
                        </p>
                        <ul className="space-y-1.5 text-xs text-emerald-700 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Dynamic Velocity Tracking
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Automated Fallback Engine
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            Daily / Weekly Aggregation
                        </h3>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Pre-aggregates customer transaction metrics (spend velocity, night transactions, peak counts) to enable sub-second scoring.
                        </p>
                        <ul className="space-y-1.5 text-xs text-emerald-700 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Real-Time Rolling Windows
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Multi-Channel Distribution
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Dynamic Score & Transitions
                        </h3>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Maintains historical transition logs whenever a customer moves between Low, Medium, and High risk tiers.
                        </p>
                        <ul className="space-y-1.5 text-xs text-emerald-700 font-medium">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Escalation Alert Triggers
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                Persisted risk calculation history
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RiskAnalysis;
