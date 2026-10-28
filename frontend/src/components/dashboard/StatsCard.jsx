import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsCard = ({ title, value, change, changeType, icon }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
            </div>
            <div className="mt-4 flex items-center">
                {changeType === 'increase' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span
                    className={`text-sm font-medium ml-1 ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                        }`}
                >
                    {change}
                </span>
            </div>
        </div>
    );
};

export default StatsCard;
