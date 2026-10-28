import React, { useState } from 'react';
import { ArrowRight, PlusCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const QuickActions = ({ onOpenTransactionModal, onRefreshData, highRiskCount = 0, customerCount = 0 }) => {
    const [runningBatch, setRunningBatch] = useState(false);
    const [scanMessage, setScanMessage] = useState(null);

    const handleRunBatchAnalysis = async () => {
        setRunningBatch(true);
        setScanMessage(null);
        try {
            const riskScores = await api.getAllRiskScores();
            // Trigger recalculation for all known customers
            for (const item of riskScores) {
                if (item.customerId) {
                    await api.calculateRisk(item.customerId, 'SYSTEM_SCHEDULED');
                }
            }
            setScanMessage('Profile scan completed!');
            if (onRefreshData) onRefreshData();
            setTimeout(() => setScanMessage(null), 4000);
        } catch (err) {
            setScanMessage('Scan failed: ' + err.message);
        } finally {
            setRunningBatch(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>

            <div className="space-y-5">
                <div className="flex items-center gap-4 p-3 bg-red-50/60 rounded-xl border border-red-100">
                    <div className="w-11 h-11 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
                        {highRiskCount}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">High Risk Profiles</p>
                        <p className="text-xs text-gray-500">Requires enhanced auth or review</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                        {customerCount}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Customer profiles</p>
                        <p className="text-xs text-gray-500">Available for analysis</p>
                    </div>
                </div>

                {scanMessage && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{scanMessage}</span>
                    </div>
                )}

                <button
                    onClick={onOpenTransactionModal}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                >
                    <PlusCircle className="w-4 h-4" />
                    Simulate Transaction
                </button>

                <button
                    onClick={handleRunBatchAnalysis}
                    disabled={runningBatch}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-slate-300 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${runningBatch ? 'animate-spin text-blue-600' : ''}`} />
                    {runningBatch ? 'Scanning Customers...' : 'Scan All Profiles'}
                </button>
            </div>
        </div>
    );
};

export default QuickActions;
