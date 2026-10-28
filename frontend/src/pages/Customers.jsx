import { timestampMillis, formatTime, formatDate, dateKey } from '../services/time';
import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, RefreshCw, Download, ShieldAlert, Plus, ArrowUpDown, Clock } from 'lucide-react';
import CustomerDetailModal from '../components/modals/CustomerDetailModal';
import NewTransactionModal from '../components/modals/NewTransactionModal';
import api from '../services/api';

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [calculatingId, setCalculatingId] = useState(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const loadCustomersData = async () => {
        setLoading(true);
        try {
            const [scoresRes, txsRes] = await Promise.allSettled([
                api.getAllRiskScores(),
                api.getAllTransactions(),
            ]);

            const scores = scoresRes.status === 'fulfilled' ? (scoresRes.value || []) : [];
            const txs = txsRes.status === 'fulfilled' ? (txsRes.value || []) : [];

            // Group transactions by customer
            const txByCustomer = {};
            txs.forEach((tx) => {
                const cid = tx.customerId;
                if (!txByCustomer[cid]) {
                    txByCustomer[cid] = {
                        count: 0,
                        totalAmount: 0,
                        lastTxDate: null,
                    };
                }
                txByCustomer[cid].count += 1;
                txByCustomer[cid].totalAmount += parseFloat(tx.amount || 0);
                if (!txByCustomer[cid].lastTxDate || timestampMillis(tx.transactionDatetime) > timestampMillis(txByCustomer[cid].lastTxDate)) {
                    txByCustomer[cid].lastTxDate = tx.transactionDatetime;
                }
            });

            // Map all known customer IDs
            const scoreMap = {};
            scores.forEach(s => {
                scoreMap[s.customerId] = s;
            });

            const uniqueIds = Array.from(new Set([
                ...scores.map(s => s.customerId),
                ...txs.map(t => t.customerId),
            ])).filter(Boolean);

            const list = uniqueIds.map((id) => {
                const s = scoreMap[id];
                const tInfo = txByCustomer[id] || { count: 0, totalAmount: 0, lastTxDate: null };
                const score = s ? s.score : 20;
                const category = s ? s.category : 'Low';
                const updatedAt = s ? s.updatedAt : tInfo.lastTxDate;

                return {
                    id: String(id),
                    customerId: id,
                    name: `Customer #${id}`,
                    score: score,
                    level: (category || 'LOW').toUpperCase(),
                    category: category,
                    totalTransactions: tInfo.count,
                    totalSpend: tInfo.totalAmount,
                    lastActivity: updatedAt,
                };
            });

            // Default sort: highest risk first
            list.sort((a, b) => b.score - a.score);
            setCustomers(list);
        } catch (err) {
            console.error('Failed to load customers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomersData();
    }, []);

    const handleCalculateRisk = async (e, customerId) => {
        e.stopPropagation();
        setCalculatingId(customerId);
        try {
            const updated = await api.calculateRisk(customerId, 'MANUAL_TRIGGER');
            setCustomers(prev => prev.map(c => {
                if (c.customerId === customerId) {
                    return {
                        ...c,
                        score: updated.score,
                        level: (updated.category || 'LOW').toUpperCase(),
                        category: updated.category,
                        lastActivity: updated.calculatedAt,
                    };
                }
                return c;
            }));
        } catch (err) {
            alert('Failed to calculate risk for customer #' + customerId + ': ' + err.message);
        } finally {
            setCalculatingId(null);
        }
    };

    const handleOpenDetail = (customerId) => {
        setSelectedCustomerId(customerId);
        setIsDetailModalOpen(true);
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'HIGH': return 'bg-red-100 text-red-700 border-red-300';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'LOW': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'All' ||
            (filter === 'High Risk' && customer.level === 'HIGH') ||
            (filter === 'Medium Risk' && customer.level === 'MEDIUM') ||
            (filter === 'Low Risk' && customer.level === 'LOW');

        return matchesSearch && matchesFilter;
    });

    const handleExportCsv = () => {
        if (customers.length === 0) return;
        const headers = ['CustomerId', 'RiskScore', 'RiskLevel', 'TotalTransactions', 'TotalSpend', 'LastActivity'];
        const rows = customers.map(c => [
            c.customerId,
            c.score,
            c.level,
            c.totalTransactions,
            c.totalSpend.toFixed(2),
            c.lastActivity || '',
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `customer_risk_profiles_${dateKey()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Risk Profiles</h1>
                    <p className="text-gray-500 text-sm">Real-time risk scoring and behavioral profiling per customer</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadCustomersData}
                        disabled={loading}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-xs font-semibold shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        Sync Profiles
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-xs font-semibold shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => setIsTxModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-md shadow-blue-200"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Simulate Transaction
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search customer ID or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    {['All', 'High Risk', 'Medium Risk', 'Low Risk'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                                filter === tab
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-3.5">Customer ID</th>
                                <th className="px-5 py-3.5">Risk Score</th>
                                <th className="px-5 py-3.5">Risk Category</th>
                                <th className="px-5 py-3.5">Total Txns</th>
                                <th className="px-5 py-3.5">Total Spend</th>
                                <th className="px-5 py-3.5">Last Calculated</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <span>Loading real customer risk profiles from database...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-400">
                                        No customer records match your filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        onClick={() => handleOpenDetail(customer.customerId)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-4 font-bold text-gray-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                #{customer.customerId}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Customer #{customer.customerId}</div>
                                                <div className="text-[11px] text-gray-400">ID: {customer.customerId}</div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            customer.score >= 70 ? 'bg-red-500' :
                                                            customer.score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, customer.score)}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-sm text-gray-900">{customer.score}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRiskColor(customer.level)}`}>
                                                {customer.level}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-gray-900">
                                            {customer.totalTransactions} txns
                                        </td>
                                        <td className="px-5 py-4 font-bold text-gray-900">
                                            LKR {Number(customer.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-600">
                                            {customer.lastActivity ? (
                                                <div>
                                                    <div className="font-semibold text-gray-800 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-blue-600" />
                                                        {formatTime(customer.lastActivity)}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400">
                                                        {formatDate(customer.lastActivity)}
                                                    </div>
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleCalculateRisk(e, customer.customerId)}
                                                    disabled={calculatingId === customer.customerId}
                                                    title="Recalculate Risk via Engine"
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${calculatingId === customer.customerId ? 'animate-spin text-blue-600' : ''}`} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDetail(customer.customerId)}
                                                    className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-blue-700 font-semibold rounded-lg transition-colors border border-slate-200"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <CustomerDetailModal
                customerId={selectedCustomerId}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onRiskRecalculated={() => loadCustomersData()}
            />

            <NewTransactionModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                onTransactionCreated={() => loadCustomersData()}
            />
        </div>
    );
};

export default Customers;
