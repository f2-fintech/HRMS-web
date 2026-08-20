'use client'

import React, { useEffect, useState, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
    Grid,
    Box,
    Autocomplete,
    TextField,
    Alert,
    Snackbar
} from '@mui/material'

import type { Break } from '@/redux/features/breaksheets/breaksSlice'
import { addBreak, fetchBreaksById, updateBreak, updateLatestBreak } from '@/redux/features/breaksheets/breaksSlice'
import type { RootState, AppDispatch } from '@/redux/store'
import * as XLSX from "xlsx";

import { apiResponse, fetchTotalShiftTime } from '../utility/apiResponse/employeesResponse' // Adjust the path if needed
import { fetchTotalWorkingHours } from '@/redux/features/punches/punchesSlice'

import PunchInOut from '@/views/PunchInOut'
import NotPunchedInToday from '@/views/NotPunchedInToday'
import TeamBreakSheets from '@/utility/breaksheets/TeamBreakSheets'
import EditBreakForm from '@components/breaksheet/BreakSheetForm'

// Split sub-components
import BreakControls from '@/components/breaksheet/BreakControls'
import BreakList from '@/components/breaksheet/BreakList'
import TimeSummary from '@/components/breaksheet/TimeSummary'
import DateSelection from '@/components/breaksheet/DateSelection'

// Utility functions
import { formatTime, convertToMilliseconds, getTimestampFromTime } from '@/utility/timeUtils'
import NotPunchedOutPage from './NotPunchedOutPage'
import ExceedOneHourBreak from '@/components/attendance/ExceedOneHourBreak'
import Link from 'next/link'
import { updateRemarks } from '@/redux/features/breaksheets/breaksSlice';

const BreakSheet: React.FC = () => {
    const dispatch: AppDispatch = useDispatch()
    const { breaks } = useSelector((state: RootState) => state.breaks)

    // const [isMobile, setIsMobile] = useState<boolean>(false)
    const [breakType, setBreakType] = useState<string>('')
    const [otherBreakType, setOtherBreakType] = useState<string>('')
    const [startTime, setStartTime] = useState<string>('')
    const [endTime, setEndTime] = useState<string>('')
    const [duration, setDuration] = useState<string>('')

    const [filteredBreaks, setFilteredBreaks] = useState<Break[]>([])
    const [onFieldBreaks, setOnFieldBreaks] = useState<Break[]>([])

    const [timerRunning, setTimerRunning] = useState<boolean>(false)
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null)

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])


    const [isCurrentDate, setIsCurrentDate] = useState<boolean>(true)

    const [employees, setEmployees] = useState<any[]>([])
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const [exceedBreakEmployees, setExceedBreakEmployees] = useState<Employee[]>([])
    const [showExceedBreaks, setShowExceedBreaks] = useState(false)

    const [notCompleteShiftEmployees, setNotCompleteShiftEmployees] = useState<Employee[]>([])
    const [showNotcompleteShift, setShowNotcompleteShift] = useState(false)

    const [openEditForm, setOpenEditForm] = useState(false)
    const [currentBreak, setCurrentBreak] = useState<Break | null>(null)
    const [specifyError, setSpecifyError] = useState<string>('')
    const [showNotPunchedIn, setShowNotPunchedIn] = useState(false)
    const [showNotPunchedOut, setShowNotPunchedOut] = useState(false)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const [showTeamBreakSheets, setShowTeamBreakSheets] = useState(false)
    const [showBreakReminder, setShowBreakReminder] = useState(false)

    const [allEmployees, setAllEmployees] = useState<any[]>([])
    const [breakCountData, setBreakCountData] = useState<any[]>([]);
    const [showBreakCount, setShowBreakCount] = useState(false);

    const [selectedEmployeeWorkingHours, setSelectedEmployeeWorkingHours] = useState<string>('00h 00m 00s')
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().slice(0, 7)
    );
    // Retrieve employee from localStorage (if available)
    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = employee?.id
    const userRole = employee?.role
    const userDesignation = employee?.desg
    const companyId = employee?.company_id

    const breakOptions = ['Select break type', 'Washroom', 'Breakfast', 'Lunch', 'Refreshment', 'Tea', 'Personal Call', 'Other']

    // Hybrid mobile detection (Option 4)
    // useEffect(() => {
    //     const checkDevice = () => {
    //         // Check 1: Touch capability
    //         const hasTouch = ('ontouchstart' in window) ||
    //             (navigator.maxTouchPoints > 0) ||
    //             ((navigator as any).msMaxTouchPoints > 0)

    //         // Check 2: User Agent
    //         const ua = navigator.userAgent.toLowerCase()
    //         const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)

    //         // Check 3: Pointer type (coarse = touch device)
    //         const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches

    //         // Check 4: Screen width
    //         const smallScreen = window.innerWidth < 768

    //         // Debug logging
    //         console.log('🔍 Mobile Detection Debug:', {
    //             hasTouch,
    //             isMobileUA,
    //             hasCoarsePointer,
    //             smallScreen,
    //             userAgent: ua,
    //             screenWidth: window.innerWidth,
    //             maxTouchPoints: navigator.maxTouchPoints
    //         })

    //         // Return true if at least 2 conditions match for better accuracy
    //         const conditions = [
    //             hasTouch && smallScreen,
    //             isMobileUA,
    //             hasCoarsePointer
    //         ]
    //         const matchCount = conditions.filter(Boolean).length
    //         const isMobileDevice = matchCount >= 2 || (isMobileUA && hasTouch)

    //         console.log('📱 Is Mobile Device:', isMobileDevice, '| Match Count:', matchCount)

    //         setIsMobile(isMobileDevice)
    //     }
    //     checkDevice()
    //     window.addEventListener('resize', checkDevice)

    //     return () => window.removeEventListener('resize', checkDevice)
    // }, [])


    const fetchExceedBreakEmployees = async () => {
        if (showExceedBreaks) {
            // If currently visible, hide the section
            setShowExceedBreaks(false)
            return
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/breaksheet/long-breaks?companyId=${companyId}&date=${selectedDate}`
            )
            const data = await response.json()


            setExceedBreakEmployees(data)
            setShowExceedBreaks(true) // Show the exceed break list
        } catch (error) {
            console.error('Error fetching exceed break employees:', error)
        }
    }

    const fetchEmpNotCompleteShift = async () => {
        if (showNotcompleteShift) {
            // If currently visible, hide the section
            setShowNotcompleteShift(false)
            return
        }

        try {
            // Update the URL to include date and company_id
            const url = `${process.env.NEXT_PUBLIC_APP_URL}/punch/working-less-than-8-hours?date=${selectedDate}&company_id=${companyId}`

            const response = await fetch(url)
            const data = await response.json()
            setNotCompleteShiftEmployees(data.employees)
            setShowNotcompleteShift(true) // Show the shift completion list
            setShowNotPunchedIn(false) // Hide missing punches & absent data
        } catch (error) {
            console.error('Error fetching not work on 8 hr break employees:', error)
        }
    }

    useEffect(() => {
        if (showNotcompleteShift) {
            fetchEmpNotCompleteShift()
        }
    }, [selectedDate]) // Run when selectedDate changes

    useEffect(() => {
        if (showExceedBreaks) {
            fetchExceedBreakEmployees()
        }
    }, [selectedDate]) // Run when selectedDate changes

    // Check if the selected date is the current date
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]

        setIsCurrentDate(selectedDate === today)
    }, [selectedDate])

    // If user is Admin or Manager, fetch employees
    useEffect(() => {
        if (Number(userRole) <= 2) {
            const fetchEmployees = async () => {
                try {
                    const employeeData = await apiResponse()

                    setEmployees(employeeData)
                } catch (error) {
                    console.error('Error fetching employees:', error)
                }
            }

            fetchEmployees()
        }
    }, [userRole])

    // Fetch total working hours for the selectedEmployeeId and date
    useEffect(() => {
        const fetchWorkingHours = async () => {
            if (selectedEmployeeId && selectedDate) {
                const workingHoursResponse = await dispatch(
                    fetchTotalWorkingHours({ employeeId: selectedEmployeeId, date: selectedDate })
                )

                const { hours = 0, minutes = 0, seconds = 0 } = workingHoursResponse.payload || {}

                setSelectedEmployeeWorkingHours(`${hours}h ${minutes}m ${seconds}s`)
            }
        }

        fetchWorkingHours()
    }, [selectedEmployeeId, selectedDate, dispatch])

    // Timer start
    const startBreakTimer = (timestamp: number) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {
            const currentTime = Date.now()
            const diff = currentTime - timestamp

            setDuration(formatTime(diff))
        }, 1000)
    }

    // Timer stop
    const stopBreakTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        setDuration('00h 00m 00s')
        setTimerRunning(false)
    }

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && timerRunning) {
                setShowBreakReminder(true)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleVisibilityChange)
        }
    }, [timerRunning])


    // Check if there's a running break
    useEffect(() => {
        const fetchRunningBreak = async () => {
            const runningBreakResponse = await dispatch(fetchBreaksById(employeeId))
            const runningBreak = runningBreakResponse?.payload?.find((b: Break) => !b.endTime)

            if (runningBreak) {
                setStartTime(runningBreak.startTime)
                const startTS = getTimestampFromTime(runningBreak.startTime, runningBreak.date)

                setStartTimestamp(startTS)
                setTimerRunning(true)
                startBreakTimer(startTS)
            }
        }

        dispatch(fetchBreaksById(employeeId)).then(() => {
            // After fetching all breaks, check if there's a running break
            fetchRunningBreak()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, employeeId])

    // Handle Start Break
    const handleStartTime = () => {
        if (!breakType) {
            alert('Please select a break type before starting your break.')

            return
        }

        if (breakType === 'Other' && !otherBreakType.trim()) {
            alert('Please specify the break type')

            return
        }

        const now = new Date()
        const formattedStartTime = now.toLocaleTimeString('en-US')
        const timestamp = now.getTime()

        setStartTime(formattedStartTime)
        setStartTimestamp(timestamp)
        setTimerRunning(true)

        const breakData = {
            type: breakType === 'Other' ? otherBreakType : breakType,
            startTime: formattedStartTime,
            endTime: '',
            date: new Date().toISOString().split('T')[0],
            employee: employeeId,
            company_id: employee.company_id
        }

        dispatch(addBreak(breakData)).then(() => {
            setBreakType('')
            setOtherBreakType('')
        })
        startBreakTimer(timestamp)
    }

    // Handle End Break
    const handleEndTime = () => {
        if (startTime) {
            const now = new Date()
            const formattedEndTime = now.toLocaleTimeString('en-US')

            setEndTime(formattedEndTime)
            setTimerRunning(false)

            const breakData = {
                endTime: formattedEndTime
            }

            dispatch(updateLatestBreak({ employeeId, breakData }))
                .then(() => {
                    stopBreakTimer()
                    setStartTime('')
                    setEndTime('')

                    return dispatch(fetchBreaksById(employeeId))
                })
                .catch(error => {
                    console.error('Error updating the latest break:', error)
                })
        }
    }

    // Fetch breaks for either the selected employee if manager/admin or for self
    useEffect(() => {
        if (Number(userRole) <= 2 && selectedEmployeeId) {
            dispatch(fetchBreaksById(selectedEmployeeId))
        } else {
            dispatch(fetchBreaksById(employeeId))
        }
    }, [dispatch, selectedEmployeeId, userRole, employeeId])

    // Filter breaks for the selected date
    useEffect(() => {
        const filtered = breaks.filter(b => b.date === selectedDate)
        const onField = filtered.filter(b => b.type === 'On Field')
        const nonOnFieldBreaks = filtered.filter(b => b.type !== 'On Field')

        setFilteredBreaks(filtered)
        setOnFieldBreaks(onField)
    }, [selectedDate, breaks])

    // Calculate total durations
    const totalDurationForDate = filteredBreaks
        .filter(b => b.type !== 'On Field')
        .reduce((acc, b) => acc + convertToMilliseconds(b.duration), 0)

    const totalOnFieldDuration = onFieldBreaks.reduce((acc, b) => acc + convertToMilliseconds(b.duration), 0)

    // Edit Break Handlers
    const handleEditClick = (breakToEdit: Break) => {
        setCurrentBreak(breakToEdit)
        setOpenEditForm(true)
    }

    const handleEditSubmit = (updatedBreak: Break) => {
        if (updatedBreak && updatedBreak._id) {
            const breakId = updatedBreak._id

            dispatch(updateBreak({ id: breakId, updatedBreak }))
            dispatch(fetchBreaksById(selectedEmployeeId || employeeId))
            setOpenEditForm(false)
        } else {
            console.error('Error: Break ID is undefined.')
        }
    }

    // Handler for manager to see employee’s breaks
    const handleEmployeeClick = (empId: string) => {
        setSelectedEmployeeId(empId)
        dispatch(fetchBreaksById(empId))
    }

    // Toggle Team Break Sheets
    const handleTeamsBreakSheetClick = () => {
        setShowTeamBreakSheets(prev => !prev)
        setSelectedEmployeeId(null)
    }

    // Calculate break progress
    const maxAllowedBreakTime = 3600000 // 1 hour in ms
    const breakProgress = (totalDurationForDate / maxAllowedBreakTime) * 100

    // Toggle Not Punched In Today
    const toggleNotPunchedInToday = () => {
        setShowNotPunchedIn(prev => !prev)
    }

    const toggleNotPunchedOut = () => {
        setShowNotPunchedOut(prev => !prev)
    }

    useEffect(() => {
        const fetchEmployees = async () => {
            const url = `${process.env.NEXT_PUBLIC_APP_URL}/punch/shift-summary?date=${selectedDate}&company_id=${companyId}`;
            const res = await fetch(url);
            const data = await res.json();

            setAllEmployees(data.employees || []);
        };

        fetchEmployees();
    }, [selectedDate, companyId]);

    const csvEscape = (val: any) => `"${String(val ?? '').replaceAll('"', '""')}"`;

    const handleExportShiftTime = () => {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const formattedMonth = monthNames[parseInt(selectedDate.split('-')[1], 10) - 1];
        const formattedYear = selectedDate.split('-')[0];
        const formattedDay = selectedDate.split('-')[2];

        const fileName = `shift_summary_${formattedDay}_${formattedMonth}_${formattedYear}.csv`;

        const csvRows = [
            ['Employee Name', 'Designation', 'Location', 'Punch In', 'Punch Out', 'Total Shift Time', 'Break Time', 'Net Working Time', 'Shift Required',
                'Shift Status', 'Status'],
            ...allEmployees.map(emp => [
                `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim(),
                emp.designation ?? '',
                emp.location ?? '',
                emp.punchIn ?? '',
                emp.punchOut ?? '',
                emp.totalShiftTime ?? '',
                emp.totalBreakTime ?? '',
                emp.netWorkingTime ?? '',

                emp.shiftRequired ?? '',
                emp.shiftStatus ?? '',
                emp.status ?? ''
            ])
        ];

        const csvContent = csvRows
            .map(row => row.map(csvEscape).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleMonthlyExportShiftTime = async () => {

        try {

            const [year, month] = selectedMonth.split('-');

            const url =
                `${process.env.NEXT_PUBLIC_APP_URL}/punch/monthly-shift-summary?month=${month}&year=${year}&company_id=${companyId}`;

            const res = await fetch(url);

            const data = await res.json();

            const employees = data.employees || [];

            if (!employees.length) {

                alert('No monthly data found');

                return;
            }

            const csvRows = [
                [
                    'Date',
                    'Employee Name',
                    'Location',
                    'Designation',
                    'Punch In',
                    'Punch Out',
                    'Total Shift Time',
                    'Break Time',
                    'Net Working Time',
                    'Shift Required',
                    'Shift Status',
                    'Status'
                ],
                ...Object.values(

                    employees.reduce((acc: any, emp: any) => {

                        const employeeName =
                            `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();

                        if (!acc[employeeName]) {

                            acc[employeeName] = {
                                rows: [],
                                totalShift: 0,
                                totalBreak: 0,
                                totalNet: 0
                            };
                        }

                        // ---- DAILY ROW ----
                        acc[employeeName].rows.push([

                            emp.date ?? '',

                            employeeName,

                            emp.location ?? '',
                            emp.designation ?? '',

                            emp.punchIn ?? '',
                            emp.punchOut ?? '',

                            emp.totalShiftTime ?? '',
                            emp.totalBreakTime ?? '',
                            emp.netWorkingTime ?? '',

                            emp.shiftRequired ?? '',
                            emp.shiftStatus ?? '',

                            emp.status ?? ''
                        ]);

                        // ---- TIME CONVERTER ----
                        const convertToMinutes = (time: string) => {

                            if (!time) return 0;

                            const hourMatch =
                                time.match(/(\d+)h/);

                            const minuteMatch =
                                time.match(/(\d+)m/);

                            const hours = hourMatch
                                ? Number(hourMatch[1])
                                : 0;

                            const minutes = minuteMatch
                                ? Number(minuteMatch[1])
                                : 0;

                            return (hours * 60) + minutes;
                        };

                        // ---- TOTALS ----
                        acc[employeeName].totalShift +=
                            convertToMinutes(emp.totalShiftTime);

                        acc[employeeName].totalBreak +=
                            convertToMinutes(emp.totalBreakTime);

                        acc[employeeName].totalNet +=
                            convertToMinutes(emp.netWorkingTime);

                        return acc;

                    }, {})

                ).flatMap((group: any) => {

                    const formatMinutes = (minutes: number) => {

                        const hrs = Math.floor(minutes / 60);
                        const mins = minutes % 60;

                        return `${hrs}h ${mins}m`;
                    };

                    return [

                        // ---- DAILY ROWS ----
                        ...group.rows,

                        // ---- EMPLOYEE TOTAL ROW ----
                        [
                            'TOTAL',
                            '',
                            '',
                            '',
                            '',
                            '',

                            formatMinutes(group.totalShift),

                            formatMinutes(group.totalBreak),

                            formatMinutes(group.totalNet),

                            '',
                            '',
                            ''
                        ],

                        // ---- SPACE ----
                        []
                    ];
                })
            ];

            const csvContent = csvRows
                .map(row => row.map(csvEscape).join(','))
                .join('\n');

            const blob = new Blob(
                [csvContent],
                { type: 'text/csv;charset=utf-8;' }
            );

            const link = document.createElement('a');

            const fileName =
                `monthly_shift_summary_${selectedMonth}.csv`;

            const downloadUrl =
                URL.createObjectURL(blob);

            link.setAttribute('href', downloadUrl);

            link.setAttribute('download', fileName);

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            URL.revokeObjectURL(downloadUrl);

        } catch (error) {

            console.error(
                'Monthly Export Error:',
                error
            );
        }
    };



    const handleExportBreakCount = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/breaksheet/break-count?date=${selectedDate}`,
                {
                    headers: {
                        Authorization: `Bearer ${token} ${companyId}`
                    }
                }
            );

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                alert("No data found");
                return;
            }
            const getMinutes = (time) => {
                const [h, m] = time.split(" h ");
                return Number(h) * 60 + Number(m.replace(" m", ""));
            };

            const sortedData = [...data].sort(
                (a, b) => getMinutes(b.totalBreakTime) - getMinutes(a.totalBreakTime)
            );

            const formattedData = sortedData.map(emp => ({
                "Employee Name": `${emp.first_name} ${emp.last_name}`,
                "Location": emp.location,
                "Designation": emp.designation,
                "Break Count": emp.totalBreaks,
                "Total Break Time": emp.totalBreakTime
            }));
            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, "Break Count");

            XLSX.writeFile(workbook, `break_count_${selectedDate}.xlsx`);
        } catch (err) {
            console.error("Export error:", err);
        }
    };


    // if (isMobile && Number(userRole) > 2) {
    //     return (
    //         <Box
    //             sx={{
    //                 display: 'flex',
    //                 justifyContent: 'center',
    //                 alignItems: 'center',
    //                 minHeight: '80vh',
    //                 p: 4,
    //                 backgroundColor: 'background.default'
    //             }}
    //         >
    //             <div className="text-center max-w-md">
    //                 <div className="text-6xl mb-6">💻</div>
    //                 <h2 className="text-3xl font-bold text-gray-800 mb-4">
    //                     Desktop Only Feature
    //                 </h2>
    //                 <p className="text-lg text-gray-600 mb-6">
    //                     Break Sheet is only accessible on desktop devices.
    //                 </p>
    //                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    //                     <p className="text-blue-800">
    //                         📌 Please use a laptop or desktop computer to access this feature.
    //                     </p>
    //                 </div>
    //             </div>
    //         </Box>
    //     )
    // }

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: 'background.default' }}>
            {/* Break Reminder Notification */}
            <Snackbar
                open={showBreakReminder}
                autoHideDuration={null} // Keep it open until user dismisses it
                onClose={() => setShowBreakReminder(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Centered on the screen
                sx={{
                    '& .MuiSnackbarContent-root': {
                        backgroundColor: '#d32f2f', // Highlighted red color
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        textAlign: 'center',
                        padding: '16px',
                        borderRadius: '8px',
                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)'
                    }
                }}
            >
                <Alert
                    severity='error'
                    sx={{
                        width: '100%',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        backgroundColor: '#ffebee',
                        color: '#d32f2f',
                        border: '2px solid #d32f2f'
                    }}
                    onClose={() => setShowBreakReminder(false)}
                >
                    🚨 **Your break is still running!** ⏳ <br />
                    Please end it before resuming work.
                </Alert>
            </Snackbar>

            {/* Row with two buttons */}
            <div className="flex flex-wrap gap-2 mb-2">
                {/* Missing Punches & Absent Button */}
                <button
                    onClick={toggleNotPunchedInToday}
                    className="group relative px-4 py-2 font-semibold text-white rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <span className="text-lg">🔍</span>
                        {showNotPunchedIn ? 'Hide' : 'Missing Punches'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>

                {/* Punched Out Button */}
                <button
                    onClick={toggleNotPunchedOut}
                    className="group relative px-4 py-3 font-semibold text-white rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 focus:ring-4 focus:ring-slate-200 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <span className="text-lg">❌</span>
                        {showNotPunchedOut ? 'Hide' : 'Punched Out'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
                {userRole === '1' && (
                    <button
                        onClick={handleExportBreakCount}
                        className="px-4 py-3 rounded-xl bg-green-600 text-white"
                    >
                        📥 Download Break Excel
                    </button>
                )}

                {/* Admin Buttons - Only shown if userRole is '1' */}
                {userRole === '1' && (
                    <>
                        {/* Monitor Long Breaks Button */}
                        <button
                            onClick={fetchExceedBreakEmployees}
                            className="group relative px-4 py-3 font-semibold text-white rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 focus:ring-4 focus:ring-rose-200 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-lg">📊</span>
                                {showExceedBreaks ? 'Collapse Long Breaks' : 'Monitor Long Breaks'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-rose-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                        <button
                            onClick={handleExportShiftTime}
                            className="group relative px-4 py-3 font-semibold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:ring-4 focus:ring-emerald-200 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-lg">📤</span>
                                Export Shift Time
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                        <button
                            onClick={handleMonthlyExportShiftTime}
                            className="group relative px-4 py-3 font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:ring-4 focus:ring-purple-200 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                Monthly Shift Report
                            </span>
                        </button>
                        {/* Monitor Shift Not Complete Button */}
                        <button
                            onClick={fetchEmpNotCompleteShift}
                            className="group relative px-4 py-3 font-semibold text-slate-800 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 focus:ring-4 focus:ring-amber-200 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                {showNotcompleteShift ? 'Collapse' : 'Monitor Shift Not Complete'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-400 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </button>



                        {/* Monthly Employee Punches Link */}
                        <a
                            href="/monthly-punches"
                            className="group relative px-4 py-3 font-semibold text-blue-700 bg-white rounded-xl border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                Monthly Employee Punches
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                        </a>

                        {/* Today's Employees Punches Link */}
                        <a
                            href="/date-wise-status"
                            className="group relative px-4 py-3 font-semibold text-indigo-700 bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 focus:ring-4 focus:ring-indigo-100 focus:outline-none shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 ease-out"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-lg">📊</span>
                                Employees Punches
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                        </a>
                    </>
                )}
            </div>
            {showExceedBreaks && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {exceedBreakEmployees.map(employee => (
                        <Grid item xs={12} sm={6} md={3} key={employee._id}>
                            <ExceedOneHourBreak employee={employee} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {showNotcompleteShift && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {notCompleteShiftEmployees.map(employee => (
                        <Grid item xs={12} sm={6} md={3} key={employee._id}>
                            <ExceedOneHourBreak employee={employee} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Render the NotPunchedInToday component if toggled */}
            {showNotPunchedIn && <NotPunchedInToday selectedDate={selectedDate} />}

            {/* Conditionally render the NotPunchedOutPage component */}
            {showNotPunchedOut && <NotPunchedOutPage selectedDate={selectedDate} />}


            <PunchInOut
                selectedDate={selectedDate}
                selectedEmployeeId={selectedEmployeeId}
                disablePunch={showTeamBreakSheets}
            />

            <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h1 className="text-2xl font-bold text-blue-600">Break Sheet</h1>
                </div>

                {/* Button for Manager to View Team Break Sheets */}
                {userRole === '2' && (
                    <div className="mb-6">
                        <button
                            onClick={handleTeamsBreakSheetClick}
                            className="flex items-center px-4 py-3 font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 transition-all shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {showTeamBreakSheets ? 'Hide Team Break Sheets' : 'View Team Break Sheets'}
                        </button>
                    </div>
                )}

                {/* Team BreakSheets Display */}
                {showTeamBreakSheets && (
                    <div className="mb-6">
                        <TeamBreakSheets managerId={employeeId} onEmployeeClick={handleEmployeeClick} />
                    </div>
                )}

                {/* Employee Selection (Admin only) */}
                {(Number(userRole) <= 1 || userRole === '6') && (<div className="mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                            <h2 className="text-lg font-semibold">Employee Selection</h2>
                        </div>
                        {/* React Autocomplete for Search */}
                        <Autocomplete
                            options={employees}
                            getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                            renderInput={params => <TextField {...params} label='Search Employee' variant='outlined' />}
                            value={selectedEmployeeId ? employees.find(emp => emp._id === selectedEmployeeId) : null}
                            onChange={(event, newValue) => {
                                setSelectedEmployeeId(newValue ? newValue._id : '')
                            }}
                            isOptionEqualToValue={(option, value) => option._id === value._id}
                        />
                    </div>
                </div>
                )}

                {/* Time Summary and Date Selection */}
                <div className="mb-6">
                    <div className="border border-gray-200 rounded-lg p-5">
                        <div className="space-y-6">
                            {/* Time Summary */}
                            <TimeSummary
                                totalOnFieldDuration={totalOnFieldDuration}
                                totalDurationForDate={totalDurationForDate}
                                breakProgress={breakProgress}
                                userDesignation={userDesignation}
                            />

                            {/* Date Selection */}
                            <DateSelection
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}

                                selectedMonth={selectedMonth}
                                setSelectedMonth={setSelectedMonth}
                            />                        </div>
                    </div>
                </div>

                {/* Break Controls */}
                {userDesignation !== 'Assistant Manager Hr' && (
                    <div className="mb-6">
                        <div className="border border-gray-200 rounded-lg p-5">
                            <div className="flex items-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <h2 className="text-lg font-semibold">Break Controls</h2>
                            </div>

                            <BreakControls
                                breakType={breakType}
                                setBreakType={setBreakType}
                                otherBreakType={otherBreakType}
                                setOtherBreakType={setOtherBreakType}
                                specifyError={specifyError}
                                setSpecifyError={setSpecifyError}
                                breakOptions={breakOptions}
                                isCurrentDate={isCurrentDate}
                                timerRunning={timerRunning}
                                handleStartTime={handleStartTime}
                                handleEndTime={handleEndTime}
                                startTime={startTime}
                                duration={duration}
                                userRole={userRole}
                                selectedEmployeeId={selectedEmployeeId}
                                employeeId={employeeId}
                            />
                        </div>
                    </div>
                )}

                {/* Break List */}
                <div>
                    <div className="border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h2 className="text-lg font-semibold">Breaks Taken on {selectedDate}</h2>
                        </div>

                        <BreakList
                            filteredBreaks={filteredBreaks}
                            userRole={userRole}
                            handleEditClick={handleEditClick}
                            updateRemarks={(breakId: string, remarks: string) => {
                                dispatch(updateRemarks({ breakId, remarks }));
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Break Form Dialog */}
            {currentBreak && (
                <EditBreakForm
                    open={openEditForm}
                    onClose={() => setOpenEditForm(false)}
                    onSubmit={handleEditSubmit}
                    breakToEdit={currentBreak}
                />
            )}
        </Box>
    )
}

export default BreakSheet
