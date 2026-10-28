import React from 'react';
import { AlertTriangle, ChevronRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentAlerts = ({ alerts = [], onSelectCustomer }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Recent Fraud Alerts</h3>
                    <p className="text-xs text-gray-500">Triggered by sudden velocity, unusual channels, or risk threshold breach</p>
                </div>
                <Link to="/alerts" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                    View All Alerts →
                </Link>
            </div>
            <div className="divide-y divide-gray-100">
                {alerts.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                        No unresolved alerts match your alert settings.
                    </div>
                ) : (
                    alerts.slice(0, 5).map((alert) => (
                        <div
                            key={alert.id}
                            onClick={() => onSelectCustomer && onSelectCustomer(alert.customerId)}
                            className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-gray-900">{alert.customerName || `Customer #${alert.customerId}`}</span>
                                        <span className="text-xs text-gray-400">ID: {alert.customerId}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            alert.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            Risk: {alert.riskScore ?? 'Unavailable'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{alert.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        alert.status === 'CRITICAL' || alert.status === 'High'
                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                >
                                    {alert.status || 'Active'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentAlerts;
