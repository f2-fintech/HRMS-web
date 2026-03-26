'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConfiguration } from '@/utility/setting-configuration/settingConfig';
import {
    addPunch,
    fetchTotalWorkingHours,
    fetchPunchByEmployeeAndDate,
    updatePunch
} from '@/redux/features/punches/punchesSlice'
import type { RootState } from '@/redux/store'
import useRouterWithMount from '@/utility/useRouterWithMount';
import { useSettings } from '@/@core/hooks/useSettings';

interface PunchInOutProps {
    selectedDate: string
    selectedEmployeeId?: string
    disablePunch?: boolean
}

const WHITELIST_EMPLOYEE_IDS = [
    '66bca8d72f1270380b77ab12',
    '66c881fe269ecefff3411649',
    '66bca6192f1270380b77aac5',
    '66bc8bfe2f1270380b77a920',
     // '66bca3782f1270380b77aaa3',
     // '66c6e8a6258826c691d89299',
      //'67ed14bb93ea9c1052f942b5'
];

const PunchInOut: React.FC<PunchInOutProps & { isMinimalView?: boolean }> = ({
    selectedDate,
    selectedEmployeeId,
    disablePunch,
    isMinimalView = false
}) => {
    const user = typeof window !== 'undefined' ? localStorage?.getItem('user') : null
    const { company_id } = user ? JSON.parse(user) : {}
    const dispatch = useDispatch()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const [punchState, setPunchState] = useState({
        isPunchIn: false,
        startTime: '',
        endTime: '',
        totalTime: '00h 00m 00s',
        isPunchOutDisabled: false,
        isPunchInDisabled: false
    })

    const { navigateToProfile } = useRouterWithMount()

    const [timer, setTimer] = useState('00h 00m 00s')
    const [currentPunchIndex, setCurrentPunchIndex] = useState(0)
    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    const [isLargeScreen, setIsLargeScreen] = useState(false)
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [logoUrl, setLogoUrl] = useState('/images/logos/fintech.png');
    const [isSmallScreen, setIsSmallScreen] = useState(false)
    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = selectedEmployeeId || employee?.id;
    const userRole = employee?.role
    const userDesg = employee?.designation
    const totalWorkingHours = useSelector((state: RootState) => state.punches.totalWorkingHours)
    const punch = useSelector((state: RootState) => state.punches.punches)
    const loading = useSelector((state: RootState) => state.punches.loading)
    const error = useSelector((state: RootState) => state.punches.error)
    const [userData, setUserData] = useState(null)
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    const { settings } = useSettings()

    // Check if user is whitelisted
    const isWhitelistedUser = WHITELIST_EMPLOYEE_IDS.includes(employeeId);

    // Enhanced mobile detection function - detects even with Desktop Mode enabled
    const detectMobileDevice = () => {
        if (typeof navigator === "undefined" || typeof window === "undefined") return false;

        // Whitelist users can use any device
        if (isWhitelistedUser) return false;

        const ua = navigator.userAgent.toLowerCase();

        // Check for mobile user agents (including when desktop mode is on)
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);

        // Check for tablet specifically
        const isTablet = /ipad|tablet|playbook|silk/i.test(ua) ||
            (ua.includes('android') && !ua.includes('mobile'));

        // Check for touch device (most reliable for mobile even in desktop mode)
        const isTouchDevice = ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);

        // Check for mobile platform
        const isMobilePlatform = /android|iphone|ipad|ipod|windows phone/i.test(navigator.platform || '');

        // Check vendor for iOS devices
        const isAppleDevice = /apple/i.test(navigator.vendor || '');
        const isIOSDevice = isAppleDevice && isTouchDevice;

        // Screen characteristics (physical screen, not viewport)
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const smallPhysicalScreen = Math.min(screenWidth, screenHeight) <= 768;

        // Device memory (mobile devices typically have less memory)
        const lowMemoryDevice = (navigator as any).deviceMemory ? (navigator as any).deviceMemory <= 4 : false;

        // Check for mobile network connection
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        const isMobileConnection = connection?.type ? /cellular|wimax/i.test(connection.type) : false;

        // CRITICAL: If it's a touch device with small physical screen, it's definitely mobile
        // This catches desktop mode on mobile browsers
        if (isTouchDevice && smallPhysicalScreen) {
            return true;
        }

        // If iOS device detected, always consider it mobile
        if (isIOSDevice) {
            return true;
        }

        // If Android or mobile UA detected
        if (isMobileUA || isTablet) {
            return true;
        }

        // If mobile platform detected
        if (isMobilePlatform) {
            return true;
        }

        // Additional checks: touch device + (low memory OR mobile connection)
        if (isTouchDevice && (lowMemoryDevice || isMobileConnection)) {
            return true;
        }

        return false;
    };

    // Detect mobile device on mount and when employeeId changes
    useEffect(() => {
        const checkDevice = () => {
            const isMobile = detectMobileDevice();
            setIsMobileDevice(isMobile);
            console.log('Device Detection:', {
                isMobile,
                isWhitelisted: isWhitelistedUser,
                userAgent: navigator.userAgent,
                screenWidth: window.innerWidth
            });
        };

        checkDevice();

        // Re-check on window resize
        window.addEventListener('resize', checkDevice);

        return () => window.removeEventListener('resize', checkDevice);
    }, [isWhitelistedUser, employeeId]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')

        const fetchUserData = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${user.id}`
                )

                const data = await response.json()

                setUserData(data)
            } catch (error) {
                console.error('Error fetching user data:', error)
            }
        }

        if (user.id) {
            fetchUserData()
        }
    }, [])

    const currentDate = new Date().toISOString().split('T')[0]
    const isCurrentDate = selectedDate === currentDate

    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
            setIsSmallScreen(window.innerWidth < 640)
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const timerInterval = setInterval(() => {
            setCurrentDateTime(new Date())
        }, 1000)

        return () => clearInterval(timerInterval)
    }, [])

    useEffect(() => {
        const getConfiguration = async () => {
            try {
                const config = await fetchConfiguration();

                if (config.image) {
                    setLogoUrl(config.image);
                }
            } catch (error) {
                console.error('Error fetching configuration:', error);
            }
        };

        getConfiguration();
    }, []);

    useEffect(() => {
        if (employeeId && selectedDate) {
            dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }))
                .unwrap()
                .then(punchData => {
                    if (punchData.length > 0) {
                        const latestPunch = punchData[punchData.length - 1]

                        stopPunchTimer()

                        if (!latestPunch.punchOut) {
                            const punchInTimestamp = new Date(`${selectedDate} ${latestPunch.punchIn}`).getTime()

                            setPunchState({
                                ...punchState,
                                isPunchIn: true,
                                startTime: latestPunch.punchIn,
                                isPunchInDisabled: true,
                                isPunchOutDisabled: false
                            })
                            setStartTimestamp(punchInTimestamp)

                            if (!selectedEmployeeId || isCurrentDate) {
                                startPunchInTimer(punchInTimestamp)
                            } else {
                                setTimer(latestPunch.totalTime || '00h 00m 00s')
                            }
                        } else {
                            setPunchState({
                                ...punchState,
                                isPunchIn: false,
                                startTime: latestPunch.punchIn,
                                endTime: latestPunch.punchOut,
                                isPunchInDisabled: false,
                                isPunchOutDisabled: true
                            })
                        }
                    } else {
                        setPunchState({
                            isPunchIn: false,
                            startTime: '',
                            endTime: '',
                            totalTime: '00h 00m 00s',
                            isPunchInDisabled: false,
                            isPunchOutDisabled: true
                        })
                        setTimer('00h 00m 00s')
                        setStartTimestamp(null)
                    }
                })

            dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
        }
    }, [dispatch, employeeId, selectedDate, isCurrentDate])

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [employeeId])

    const startPunchInTimer = (timestamp: number) => {
        intervalRef.current = setInterval(() => {
            const currentTime = Date.now()
            const diff = currentTime - timestamp
            const totalSeconds = Math.floor(diff / 1000)
            const hours = Math.floor(totalSeconds / 3600)
            const minutes = Math.floor((totalSeconds % 3600) / 60)
            const seconds = totalSeconds % 60

            setTimer(
                `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
            )
        }, 1000)
    }

    const stopPunchTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    const handlePunchIn = async () => {
        // Mobile device check - block if not whitelisted
        if (isMobileDevice && !isWhitelistedUser) {
            alert('🚫 PUNCH IN BLOCKED\n\n❌ Mobile/Tablet devices are not allowed for Punch In.\n✅ Please use a Laptop or Desktop computer.\n\n📱 If you believe this is an error, contact your administrator.');
            return;
        }

        const now = new Date()
        const startTime = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        const punchData = {
            punchIn: startTime,
            punchOut: '',
            totalTime: '00h 00m 00s',
            date: currentDate,
            employee: employeeId,
            company_id: company_id
        }

        setPunchState({
            ...punchState,
            isPunchIn: true,
            startTime,
            isPunchInDisabled: true,
            isPunchOutDisabled: false
        })

        await dispatch(addPunch(punchData)).unwrap();

        startPunchInTimer(now.getTime())
    }

    const handlePunchOut = async () => {
        // Mobile device check - block if not whitelisted
        if (isMobileDevice && !isWhitelistedUser) {
            alert('🚫 PUNCH OUT BLOCKED\n\n❌ Mobile/Tablet devices are not allowed for Punch Out.\n✅ Please use a Laptop or Desktop computer.\n\n📱 If you believe this is an error, contact your administrator.');
            return;
        }

        const now = new Date()

        const endTime = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        const confirmation = window.confirm('Are you sure you want to punch out?')

        if (!confirmation) {
            return
        }

        stopPunchTimer()

        setPunchState({
            isPunchIn: false,
            startTime: '',
            endTime,
            totalTime: timer,
            isPunchInDisabled: false,
            isPunchOutDisabled: true
        })

        const punchData = {
            punchOut: endTime,
            totalTime: timer
        }

        await dispatch(updatePunch({ employeeId, punchData })).unwrap()

        dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }))
        dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
    }

    useEffect(() => {
        if (punch.length > 0) {
            const latestPunch = punch[punch.length - 1]

            if (!latestPunch.punchOut) {
                setPunchState({
                    ...punchState,
                    isPunchIn: true,
                    startTime: latestPunch.punchIn,
                    isPunchInDisabled: true,
                    isPunchOutDisabled: false
                })
            } else {
                setPunchState({
                    ...punchState,
                    isPunchIn: false,
                    startTime: latestPunch.punchIn,
                    endTime: latestPunch.punchOut,
                    isPunchInDisabled: false,
                    isPunchOutDisabled: true
                })
            }
        }
    }, [punch, employeeId])

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    const handlePreviousPunch = () => {
        if (currentPunchIndex > 0) {
            setCurrentPunchIndex(currentPunchIndex - 1)
        }
    }

    const handleNextPunch = () => {
        if (currentPunchIndex < punch.length - 1) {
            setCurrentPunchIndex(currentPunchIndex + 1)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">Error: {error}</div>
    }

    const currentPunch = punch.length > 0 ? punch[currentPunchIndex] : null

    // Check if punch buttons should be disabled due to mobile device
    const isPunchDisabledDueToMobile = isMobileDevice && !isWhitelistedUser;

    if (isMinimalView) {
        const punchInTime = punchState.startTime ? new Date(`1970-01-01T${punchState.startTime}`) : null;
        const referenceTime9AM = new Date('1970-01-01T09:00:00');
        const referenceTime10_15AM = new Date('1970-01-01T10:15:00');

        let punchMessage = '';

        if (punchInTime) {
            if (punchInTime <= referenceTime10_15AM && punchInTime >= referenceTime9AM) {
                punchMessage = '✅ Great job! Being on time shows commitment and professionalism. Keep up the good work!';
            } else if (punchInTime > referenceTime10_15AM) {
                punchMessage = `⏰ Punctuality is not just about being on time; it's about respecting your work, your team, and your commitments.`;
            }
        }

        return (
            <div className={`flex flex-col items-center justify-center gap-4 p-6 rounded-xl shadow-lg mt-4 mx-auto ${settings.mode === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-indigo-900 to-blue-700'}`}>
                {/* Mobile Warning Message */}
                {isPunchDisabledDueToMobile && (
                    <div className="text-center font-bold text-red-300 bg-red-900/40 p-3 rounded-lg w-full mb-2 border border-red-500">
                        🚫 Mobile devices cannot Punch In/Out. Please use Desktop/Laptop.
                    </div>
                )}

                {punchMessage && (
                    <div className="text-center font-bold text-yellow-300 bg-black/20 p-3 rounded-lg w-full mb-4">
                        {punchMessage}
                    </div>
                )}

                <div className="relative group cursor-pointer" onClick={() => navigateToProfile(userData?._id)}>
                    <img
                        alt={userData?.first_name || 'User'}
                        src={userData?.image || '/images/avatars/default.png'}
                        className="w-16 h-16 rounded-full border-2 border-white mb-2 transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-blue-500 text-white text-xs py-0.5 px-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View Profile
                    </div>
                </div>

                <h2 className="font-bold text-center mb-6 text-white text-xl">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </h2>

                <div className="flex justify-around items-center w-full gap-4">
                    <div className="text-center">
                        <button
                            onClick={handlePunchIn}
                            disabled={punchState.isPunchInDisabled || disablePunch || isPunchDisabledDueToMobile}
                            className={`mb-2 px-4 py-2 rounded-lg ${punchState.isPunchInDisabled || disablePunch || isPunchDisabledDueToMobile
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                            title={isPunchDisabledDueToMobile ? "Mobile devices not allowed. Use Desktop/Laptop." : ""}
                        >
                            Punch In
                        </button>

                        {punchState.startTime && (
                            <div className="text-sm text-white">
                                {punchState.startTime}
                            </div>
                        )}
                    </div>

                    <div className="text-white font-bold text-sm text-center">
                        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handlePunchOut}
                            disabled={punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile}
                            className={`mb-2 px-4 py-2 rounded-lg ${punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                            title={isPunchDisabledDueToMobile ? "Mobile devices not allowed. Use Desktop/Laptop." : ""}
                        >
                            Punch Out
                        </button>

                        {punchState.endTime && (
                            <div className="text-sm text-white">
                                {punchState.endTime}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-4">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                {/* Mobile Warning Banner for Desktop View */}
                {isPunchDisabledDueToMobile && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-center">
                        <p className="font-bold">🚫 Mobile Device Detected</p>
                        <p className="text-sm">Punch In/Out is only allowed from Desktop or Laptop computers. Please switch to a computer to continue.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="bg-gray-100 flex flex-col items-center justify-center p-8">
                        <div className="relative w-32 h-32 rounded-full border border-gray-300 bg-white shadow-md">
                            <div
                                className="absolute w-1 h-10 bg-black top-1/2 left-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-100"
                                style={{ transform: `translateY(-100%) rotate(${(currentDateTime.getHours() % 12) * 30 + currentDateTime.getMinutes() / 2}deg)` }}
                            ></div>

                            <div
                                className="absolute w-0.5 h-14 bg-black top-1/2 left-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-100"
                                style={{ transform: `translateY(-100%) rotate(${currentDateTime.getMinutes() * 6}deg)` }}
                            ></div>

                            <div
                                className="absolute w-0.5 h-16 bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 origin-bottom transition-transform duration-100"
                                style={{ transform: `translateY(-100%) rotate(${currentDateTime.getSeconds() * 6}deg)` }}
                            ></div>

                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full overflow-hidden opacity-60">
                                <img
                                    src={logoUrl}
                                    alt="Company Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {Array.from({ length: 12 }).map((_, index) => {
                                const angle = (index + 1) * 30
                                const x = 50 + 38 * Math.cos((angle - 90) * (Math.PI / 180))
                                const y = 50 + 38 * Math.sin((angle - 90) * (Math.PI / 180))

                                return (
                                    <div
                                        key={index}
                                        className="absolute font-bold text-sm"
                                        style={{
                                            top: `${y}%`,
                                            left: `${x}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                )
                            })}
                        </div>

                        <h3 className="mt-4 text-xl font-semibold text-gray-800">
                            {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })}
                        </h3>
                        <h3 className="mt-2 text-xl font-semibold text-gray-800">
                            {currentDateTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                    </div>

                    <div className="bg-blue-50 flex flex-col items-center justify-center p-8">
                        <div className="text-blue-600 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-600 mb-4">Daily Check In/Out</h2>

                        {punchState.isPunchIn && (
                            <div className="text-3xl font-bold text-blue-600 mb-4">
                                {timer}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={handlePunchIn}
                                disabled={punchState.isPunchInDisabled || disablePunch || !isCurrentDate || isPunchDisabledDueToMobile}
                                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${punchState.isPunchInDisabled || disablePunch || !isCurrentDate || isPunchDisabledDueToMobile
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                                title={
                                    isPunchDisabledDueToMobile
                                        ? "Mobile devices not allowed. Use Desktop/Laptop."
                                        : disablePunch
                                            ? "Managers can't punch in for team members."
                                            : !isCurrentDate
                                                ? "Punch-In available for today only."
                                                : ''
                                }
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Punch In
                            </button>

                            <button
                                onClick={handlePunchOut}
                                disabled={punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile}
                                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${punchState.isPunchOutDisabled || disablePunch || isPunchDisabledDueToMobile
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                                title={
                                    isPunchDisabledDueToMobile
                                        ? "Mobile devices not allowed. Use Desktop/Laptop."
                                        : disablePunch
                                            ? "Managers can't punch out for team members."
                                            : ''
                                }
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                </svg>
                                Punch Out
                            </button>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-8 border-t border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">
                            Attendance Logs
                        </h2>

                        <div className="grid grid-cols-3 gap-4 w-full mb-6 text-center">
                            <div className="flex flex-col">
                                <h4 className="font-semibold text-gray-700 mb-2">
                                    Punch In
                                </h4>
                                <div className="text-gray-600">
                                    {currentPunch?.punchIn || '-'}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="font-semibold text-gray-700 mb-2">
                                    Punch Out
                                </h4>
                                <div className="text-gray-600">
                                    {currentPunch?.punchOut || '-'}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="font-semibold text-gray-700 mb-2">
                                    Total Time
                                </h4>
                                <div className="text-gray-600">
                                    {currentPunch?.totalTime || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handlePreviousPunch}
                                disabled={currentPunchIndex === 0}
                                className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${currentPunchIndex === 0
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'border-blue-500 text-blue-500 hover:bg-blue-50'
                                    }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={handleNextPunch}
                                disabled={currentPunchIndex === punch.length - 1}
                                className={`px-4 py-2 rounded-lg border transition-colors duration-300 ${currentPunchIndex === punch.length - 1
                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                    : 'border-blue-500 text-blue-500 hover:bg-blue-50'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a237e]  p-6 text-center">
                    <h3 className="text-gray-200 text-lg font-semibold mb-2">
                        Total Working Hours of {selectedDate}
                    </h3>
                    <div className="text-2xl font-bold text-blue-400">
                        {`${totalWorkingHours?.hours || 0}h ${totalWorkingHours?.minutes || 0}m ${totalWorkingHours?.seconds || 0}s`}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PunchInOut
