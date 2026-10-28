import { formatTime, formatDate, dateKey, TIME_ZONE_LABEL } from '../services/time';
import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Activity, AlertOctagon, ArrowUpRight, Clock, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import RiskChart from '../components/dashboard/RiskChart';
import RecentAlerts from '../components/dashboard/RecentAlerts';
import QuickActions from '../components/dashboard/QuickActions';
import NewTransactionModal from '../components/modals/NewTransactionModal';
import CustomerDetailModal from '../components/modals/CustomerDetailModal';
import api from '../services/api';
import { buildAlerts } from '../services/alerts';
import ServiceHealth from '../components/layout/ServiceHealth';

const Dashboard = () => {
    const [riskScores, setRiskScores] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [error, setError] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [isCustModalOpen, setIsCustModalOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const [scores, txs, settings, statuses] = await Promise.all([api.getAllRiskScores(), api.getAllTransactions(), api.getSettings(), api.getAlertStatuses()]);
            setAlerts(buildAlerts(scores, txs, settings, statuses).filter(item => item.status !== 'Resolved').map(item => ({ ...item, message: item.title, status: item.priority })));
            setRiskScores(scores);
            setTransactions(txs);
            setLastRefreshed(new Date());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Derived Statistics
    const allCustomerIds = new Set([
        ...riskScores.map(r => r.customerId),
        ...transactions.map(t => t.customerId),
    ]);
    const totalCustomersCount = allCustomerIds.size;

    const highRiskProfiles = riskScores.filter(r => (r.category || '').toLowerCase() === 'high');
    const mediumRiskProfiles = riskScores.filter(r => (r.category || '').toLowerCase() === 'medium');
    const lowRiskProfiles = riskScores.filter(r => (r.category || '').toLowerCase() === 'low');

    const declinedTransactions = transactions.filter(t => t.transactionStatus === 'DECLINED');

    // Risk distribution chart data
    const riskDistribution = [
        { name: 'Low', count: lowRiskProfiles.length },
        { name: 'Medium', count: mediumRiskProfiles.length },
        { name: 'High', count: highRiskProfiles.length },
    ];

    // Compute real timeline from transactions
    const timelineByDate = {};
    transactions.forEach(t => {
        if (!t.transactionDatetime) return;
        const dayLabel = dateKey(t.transactionDatetime);
        if (!timelineByDate[dayLabel]) {
            timelineByDate[dayLabel] = { name: formatDate(t.transactionDatetime, { year: undefined }), low: 0, medium: 0, high: 0, total: 0 };
        }
        if (t.transactionStatus === 'DECLINED') {
            timelineByDate[dayLabel].high += 1;
        } else if (t.riskLevel === 'Medium' || (t.amount && Number(t.amount) > 100000)) {
            timelineByDate[dayLabel].medium += 1;
        } else {
            timelineByDate[dayLabel].low += 1;
        }
        timelineByDate[dayLabel].total += 1;
    });
    const timelineData = Object.entries(timelineByDate).sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);

    const stats = [
        {
            title: 'Monitored Customers',
            value: totalCustomersCount ? totalCustomersCount.toLocaleString() : '0',
            change: 'Current portfolio',
            changeType: 'increase',
            icon: Users
        },
        {
            title: 'High Risk Profiles',
            value: highRiskProfiles.length.toString(),
            change: `${highRiskProfiles.length > 0 ? 'Requires Action' : 'Stable'}`,
            changeType: highRiskProfiles.length > 0 ? 'increase' : 'decrease',
            icon: ShieldCheck
        },
        {
            title: 'Active Alerts',
            value: alerts.length.toString(),
            change: `${declinedTransactions.length} declines`,
            changeType: 'increase',
            icon: AlertOctagon
        },
        {
            title: 'Total Transactions',
            value: transactions.length.toLocaleString(),
            change: `${transactions.length} processed`,
            changeType: 'increase',
            icon: Activity
        },
    ];

    const handleSelectCustomer = (id) => {
        setSelectedCustomerId(id);
        setIsCustModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {error && <p role="alert" className="p-3 text-red-700 bg-red-50 rounded-lg">{error}</p>}
            <p className="text-xs text-slate-500">Last refreshed: {formatTime(lastRefreshed)} · {TIME_ZONE_LABEL}</p>
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CeylonBank Fraud Risk Monitoring Dashboard</h1>
                    <p className="text-gray-500 text-sm">
                        Live connection to CeylonBank RiskGuard AI & Behavioral Profiling Engine
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        Sync APIs
                    </button>
                    <button
                        onClick={() => setIsTxModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-200"
                    >
                        <Plus className="w-4 h-4" />
                        New Transaction
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts & Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Section */}
                <div className="lg:col-span-2 space-y-6">
                    <RiskChart riskDistribution={riskDistribution} timelineData={timelineData} />
                    <RecentAlerts
                        alerts={alerts}
                        onSelectCustomer={handleSelectCustomer}
                    />
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                    <QuickActions
                        onOpenTransactionModal={() => setIsTxModalOpen(true)}
                        onRefreshData={loadDashboardData}
                        highRiskCount={highRiskProfiles.length}
                        customerCount={totalCustomersCount}
                    />

                    <ServiceHealth />
                </div>
            </div>

            {/* Live Transactions Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Recent Ingested Transactions</h3>
                        <p className="text-xs text-gray-500">Live stream processed by the Transaction Microservice</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                        Total {transactions.length} records
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Tx ID</th>
                                <th className="px-4 py-3">Customer ID</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Channel</th>
                                <th className="px-4 py-3">Device</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-8 text-gray-400">
                                        No transactions loaded yet. Click "New Transaction" to simulate one!
                                    </td>
                                </tr>
                            ) : (
                                transactions.slice(0, 10).map((tx) => (
                                    <tr key={tx.transactionId} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-gray-900">#{tx.transactionId}</td>
                                        <td className="px-4 py-3 font-semibold text-blue-600">
                                            <button
                                                onClick={() => handleSelectCustomer(tx.customerId)}
                                                className="hover:underline flex items-center gap-1"
                                            >
                                                #{tx.customerId}
                                                <ArrowUpRight className="w-3 h-3 opacity-60" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 font-bold">{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency || 'LKR'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                                {tx.channel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{tx.deviceCode}</td>
                                        <td className="px-4 py-3 text-gray-500">{tx.location}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                                                tx.transactionStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                tx.transactionStatus === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {tx.transactionStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {tx.transactionDatetime ? (
                                                <div>
                                                    <div className="font-semibold text-gray-800 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-blue-600" />
                                                        {formatTime(tx.transactionDatetime)}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400">
                                                        {formatDate(tx.transactionDatetime)}
                                                    </div>
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleSelectCustomer(tx.customerId)}
                                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                Profile →
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <NewTransactionModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                onTransactionCreated={() => {
                    loadDashboardData();
                }}
            />

            <CustomerDetailModal
                customerId={selectedCustomerId}
                isOpen={isCustModalOpen}
                onClose={() => setIsCustModalOpen(false)}
                onRiskRecalculated={() => {
                    loadDashboardData();
                }}
            />
        </div>
    );
};

export default Dashboard;
