'use client';

import React, { useState, useEffect } from 'react';
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
    const [isMobileDevice, setIsMobileDevice] = useState(false);

const detectMobileDevice = () => {
  if (typeof window === 'undefined') return false;

  const uaDataMobile = (navigator as any).userAgentData?.mobile;
  if (typeof uaDataMobile === 'boolean') return uaDataMobile;

  const ua = navigator.userAgent || '';

  const isPhoneUA =
    /Android.*Mobile|iPhone|iPod|IEMobile|Opera Mini|webOS/i.test(ua);

  const isTabletUA =
    /iPad|Android(?!.*Mobile)/i.test(ua);

  return isPhoneUA;


};

    useEffect(() => {
        const checkDevice = () => {
            setIsMobileDevice(detectMobileDevice());
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);

        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    const handleStartBreak = () => {
        if (isMobileDevice) {
            alert('🚫 START BREAK BLOCKED\n\nBreak controls are ONLY allowed from laptop or desktop computer.\n\nMobile devices are not permitted, even with "Desktop Site" enabled.\n\nPlease use a proper computer to start break.');
            return;
        }
        handleStartTime();
    };

    const handleEndBreak = () => {
        if (isMobileDevice) {
            alert('🚫 END BREAK BLOCKED\n\nBreak controls are ONLY allowed from laptop or desktop computer.\n\nMobile devices are not permitted, even with "Desktop Site" enabled.\n\nPlease use a proper computer to end break.');
            return;
        }
        handleEndTime();
    };

    const isDisabled = !isCurrentDate || (selectedEmployeeId && selectedEmployeeId !== employeeId && userRole === '2');
    const isStartDisabled = isMobileDevice || isDisabled || timerRunning || breakType === 'Select break type' || breakType === '';
    const isEndDisabled = isMobileDevice || !isCurrentDate || !timerRunning;

    return (
        <div>
            {/* Mobile Device Warning */}
            {isMobileDevice && (
                <div className="mb-4 bg-red-500 text-white text-center py-3 px-4 rounded-lg font-semibold">
                    🚫 Break controls are only available on laptop/desktop devices
                </div>
            )}

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
                            disabled={isDisabled || isMobileDevice}
                            className={`w-full py-3 px-4 border ${isDisabled || isMobileDevice ? 'bg-gray-100 border-gray-300' : 'border-gray-300'} 
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
                            disabled={isMobileDevice}
                            className={`w-full py-3 px-4 border ${specifyError ? 'border-red-500' : 'border-gray-300'} 
                                      rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                      ${specifyError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}
                                      ${isMobileDevice ? 'bg-gray-100' : ''}`}
                        />
                        {specifyError && (
                            <p className="mt-1 text-sm text-red-600">{specifyError}</p>
                        )}
                    </div>
                )}

                {/* Start Break Button */}
                <div className="col-span-1">
                    <button
                        onClick={handleStartBreak}
                        disabled={isStartDisabled}
                        title={isMobileDevice ? "Only available on laptop/desktop" : ""}
                        className={`w-full py-3 px-4 rounded-lg flex items-center justify-center shadow-md transition-all duration-300
                                    ${timerRunning
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                                : isStartDisabled
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white h-[100%]'
                            }`}
                    >
                        <Timer className="mr-2" />
                        <span className="font-medium">
                            {isMobileDevice ? '🚫 Laptop Only' : timerRunning ? 'Break Running...' : 'Start Break'}
                        </span>
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
                        onClick={handleEndBreak}
                        disabled={isEndDisabled}
                        title={isMobileDevice ? "Only available on laptop/desktop" : ""}
                        className={`w-full py-3 px-4 rounded-lg flex items-center justify-center shadow-md transition-all duration-300
                                  ${isEndDisabled
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white'
                            }`}
                    >
                        <Timer className="mr-2" />
                        <span className="font-medium">
                            {isMobileDevice ? '🚫 Laptop Only' : 'End Break'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BreakControls;
