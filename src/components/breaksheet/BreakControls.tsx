'use client';

import React from 'react';
import { Timer } from '@mui/icons-material';

interface BreakControlsProps {
    breakType: string;
    setBreakType: (val: string) => void;
    otherBreakType: string;
    setOtherBreakType: (val: string) => void;
    specifyError: string;
    setSpecifyError: (val: string) => void;
    breakOptions: string[];
    isCurrentDate: boolean;
    timerRunning: boolean;
    handleStartTime: () => void;
    handleEndTime: () => void;
    startTime: string;
    duration: string;
    userRole: string | number;
    selectedEmployeeId: string | null;
    employeeId: string | null;
}

const BreakControls: React.FC<BreakControlsProps> = ({
    breakType,
    setBreakType,
    otherBreakType,
    setOtherBreakType,
    specifyError,
    setSpecifyError,
    breakOptions,
    isCurrentDate,
    timerRunning,
    handleStartTime,
    handleEndTime,
    startTime,
    duration,
    userRole,
    selectedEmployeeId,
    employeeId,
}) => {
    const isDisabled = !isCurrentDate || (selectedEmployeeId && selectedEmployeeId !== employeeId && userRole === '2');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Break Type Selection */}
            <div className="col-span-1">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Choose Break Type
                    </label>
                    <select
                        value={breakType}
                        onChange={e => setBreakType(e.target.value)}
                        disabled={isDisabled}
                        className={`w-full py-3 px-4 border ${isDisabled ? 'bg-gray-100 border-gray-300' : 'border-gray-300'} 
                                   rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                   appearance-none text-gray-700`}
                    >
                        {breakOptions.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Other (Specify) Break Type Input */}
            {breakType === 'Other' && (
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Please specify
                    </label>
                    <input
                        type="text"
                        value={otherBreakType}
                        onChange={e => {
                            setOtherBreakType(e.target.value);
                            setSpecifyError('');
                        }}
                        className={`w-full py-3 px-4 border ${specifyError ? 'border-red-500' : 'border-gray-300'} 
                                  rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                  ${specifyError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {specifyError && (
                        <p className="mt-1 text-sm text-red-600">{specifyError}</p>
                    )}
                </div>
            )}

            {/* Start Break Button */}
            <div className="col-span-1">
                <button
                    onClick={handleStartTime}
                    disabled={isDisabled || timerRunning}
                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-center shadow-md transition-all duration-300
                                ${timerRunning
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                            : isDisabled
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white h-[100%]'
                        }`}
                >
                    <Timer className="mr-2" />
                    <span className="font-medium">{timerRunning ? 'Break Running...' : 'Start Break'}</span>
                </button>
            </div>

            {/* Break Start Time Display */}
            <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Break Start
                </label>
                <input
                    type="text"
                    value={startTime}
                    disabled
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
            </div>

            {/* Duration Display */}
            <div className="col-span-1 hidden sm:block">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                </label>
                <input
                    type="text"
                    value={duration}
                    disabled
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
            </div>

            {/* End Break Button */}
            <div className="col-span-1 hidden sm:block">
                <button
                    onClick={handleEndTime}
                    disabled={!isCurrentDate || !timerRunning}
                    className={`w-full py-3 px-4 rounded-lg flex items-center justify-center shadow-md transition-all duration-300
                              ${!isCurrentDate || !timerRunning
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white'
                        }`}
                >
                    <Timer className="mr-2" />
                    <span className="font-medium">End Break</span>
                </button>
            </div>
        </div>
    );
};

export default BreakControls;
