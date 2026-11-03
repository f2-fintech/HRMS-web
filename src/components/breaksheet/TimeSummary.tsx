'use client';

import React from 'react';
import { AccessTime, Coffee } from '@mui/icons-material';
import { formatTime } from '@/utility/timeUtils';

interface TimeSummaryProps {
    totalOnFieldDuration: number;
    totalDurationForDate: number;
    breakProgress: number;
    userDesignation?: string;
}

const TimeSummary: React.FC<TimeSummaryProps> = ({
    totalOnFieldDuration,
    totalDurationForDate,
    breakProgress,
    userDesignation,
}) => {
    // If the userDesignation is 'Assistant Manager Hr' we skip the summary
    if (userDesignation === 'Assistant Manager Hr') {
        return null;
    }

    return (
        <div className="w-full">
            <div className="flex items-center space-x-2 mb-4">
                <AccessTime className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Time Summary</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* On-Site Duration Card */}
                <div className="rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">On-Site Duration</p>
                                <h3 className="text-white text-2xl font-bold">{formatTime(totalOnFieldDuration)}</h3>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <AccessTime className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                        <div className="text-xs text-blue-700">
                            <span className="font-semibold">Today's Status:</span>
                            {totalOnFieldDuration > 28800 ? " Overtime" : " Regular Hours"}
                        </div>
                    </div>
                </div>

                {/* Break Duration Card */}
                <div className="rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105">
                    <div className={`p-6 ${breakProgress > 100
                        ? 'bg-gradient-to-r from-red-500 to-pink-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-100 text-sm font-medium mb-1">Break Duration</p>
                                <h3 className="text-white text-2xl font-bold">{formatTime(totalDurationForDate)}</h3>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Coffee className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 h-2 w-full bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full"
                                style={{ width: `${Math.min(breakProgress, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className={`px-6 py-4 ${breakProgress > 100
                        ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700'
                        }`}>
                        <div className="text-xs">
                            <span className="font-semibold">Break Limit:</span>
                            {breakProgress > 100 ? " Exceeded" : ` ${breakProgress}% Used`}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeSummary;
