'use client'

import React, { useEffect, useState, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
    Button,
    Grid,
    Typography,
    Box,
    Paper,
    Card,
    CardContent,
    Stack,
    Autocomplete,
    TextField,
    Alert,
    Snackbar
} from '@mui/material'

import { AccessTime, Coffee, Group, Timer } from '@mui/icons-material'

import type { Break } from '@/redux/features/breaksheets/breaksSlice'
import { addBreak, fetchBreaksById, updateBreak, updateLatestBreak } from '@/redux/features/breaksheets/breaksSlice'
import type { RootState, AppDispatch } from '@/redux/store'

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

const BreakSheet: React.FC = () => {
    const dispatch: AppDispatch = useDispatch()
    const { breaks } = useSelector((state: RootState) => state.breaks)

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
    const [isLargeScreen, setIsLargeScreen] = useState(false)
    const [showBreakReminder, setShowBreakReminder] = useState(false)

    const [allEmployees, setAllEmployees] = useState<any[]>([])

    const [selectedEmployeeWorkingHours, setSelectedEmployeeWorkingHours] = useState<string>('00h 00m 00s')

    // Retrieve employee from localStorage (if available)
    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = employee?.id
    const userRole = employee?.role
    const userDesignation = employee?.desg
    const companyId = employee?.company_id

    const breakOptions = ['Washroom', 'Lunch', 'Refreshment', 'Tea', 'Personal Call', 'On Field', 'Other']

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

    // Handle screen resizing
    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
            try {
                const employeesData = await fetchTotalShiftTime(selectedDate)

                setAllEmployees(employeesData.employees)
            } catch (error: any) {
                error.message || 'Failed to fetch employee data'
            } finally {
            }
        }

        fetchEmployees()
    }, [selectedDate])

    const handleExportShiftTime = () => {
        // Month names array
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ]

        // Get the selected month and year
        const formattedMonth = monthNames[parseInt(selectedDate.split('-')[1], 10) - 1] // Convert month number to name
        const formattedYear = selectedDate.split('-')[0]
        const formattedDay = selectedDate.split('-')[2] // Extract the day from selectedDate

        // Create the file name with selected date (e.g., shift_summary_12_January_2025.csv)
        const fileName = `shift_summary_${formattedDay}_${formattedMonth}_${formattedYear}.csv`

        // Prepare data for export with employee details (first_name, last_name, location, totalShiftTime)
        const csvContent = [
            ['Employee Name', 'Location', 'Total Shift Time'],
            ...allEmployees.map(emp => [
                `${emp.first_name} ${emp.last_name}`,
                emp.location,
                emp.totalShiftTime // Assuming you have totalShiftTime in the employee object
            ])
        ]
            .map(e => e.join(',')) // Join each row by commas
            .join('\n') // Join rows with newline characters

        // Create a blob from the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')

        if (link.download !== undefined) {
            // Create a download link
            const url = URL.createObjectURL(blob)

            link.setAttribute('href', url)
            link.setAttribute('download', fileName) // Set the dynamic file name
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

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
            <Stack direction='row' spacing={2} mb={2}>
                <Button
                    variant='contained'
                    onClick={toggleNotPunchedInToday}
                    sx={{
                        borderRadius: '10px',
                        py: 1.5,
                        px: 4.5,
                        boxShadow: '#5E5DF0 0 10px 20px -10px',
                        background: '#5E5DF0',
                        color: '#FFFFFF',
                        fontFamily:
                            'Inter, Helvetica, "Apple Color Emoji", "Segoe UI Emoji", "NotoColorEmoji", "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols, -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", sans-serif',
                        fontSize: '16px',
                        fontWeight: 700,
                        lineHeight: '24px',
                        opacity: 1,
                        outline: '0 solid transparent',
                        userSelect: 'none',
                        '-webkit-user-select': 'none',
                        touchAction: 'manipulation',
                        width: 'fit-content',
                        wordBreak: 'break-word',
                        border: 0,
                        cursor: 'pointer'
                    }}
                >
                    {showNotPunchedIn ? 'Hide' : 'Missing Punches & Absent'}
                </Button>

                <Button
                    variant='contained'
                    onClick={toggleNotPunchedOut}
                    sx={{
                        borderRadius: '10px',
                        py: 1.5,
                        px: 4.5,
                        boxShadow: '#808080 0 10px 20px -10px',
                        background: '#808080',
                        color: '#FFFFFF',
                        fontFamily:
                            'Inter, Helvetica, "Apple Color Emoji", "Segoe UI Emoji", "NotoColorEmoji", "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols, -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", sans-serif',
                        fontSize: '16px',
                        fontWeight: 700,
                        lineHeight: '24px',
                        opacity: 1,
                        outline: '0 solid transparent',
                        userSelect: 'none',
                        '-webkit-user-select': 'none',
                        touchAction: 'manipulation',
                        width: 'fit-content',
                        wordBreak: 'break-word',
                        border: 0,
                        cursor: 'pointer'
                    }}
                >
                    {showNotPunchedOut ? 'Hide' : '❌ Punched Out'}
                </Button>

                {userRole === '1' && (
                    <Button
                        variant='contained'
                        onClick={fetchExceedBreakEmployees}
                        sx={{
                            borderRadius: '10px',
                            // py: 0.5,
                            px: 4.5,
                            boxShadow: '#d32f2f 0 10px 20px -10px',
                            background: '#d32f2f',
                            color: '#FFFFFF',
                            fontWeight: 400,
                            cursor: 'pointer'
                        }}
                    >
                        {showExceedBreaks ? 'Collapse Long Breaks' : '📊 Monitor Long Breaks'}
                    </Button>
                )}

                {userRole === '1' && (
                    <Button
                        variant='contained'
                        onClick={fetchEmpNotCompleteShift}
                        sx={{
                            borderRadius: '100',
                            py: 1.5,
                            px: 4.5,
                            boxShadow: '#d32f2f 0 10px 20px -10px',
                            background: 'yellow',
                            color: 'black',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        {showNotcompleteShift ? 'Collapse' : '📊 Monitor Shif Not Complete'}
                    </Button>
                )}
                {userRole === '1' && (
                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            sx={{
                                margin: '10px',
                                padding: '15px 30px',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                transition: '0.5s',
                                backgroundSize: '200% auto',
                                color: 'white',
                                borderRadius: '10px',
                                border: 0,
                                fontWeight: 500,
                                boxShadow: '0px 0px 14px -7px #F09819',

                                cursor: 'pointer'
                            }}
                            variant='contained'
                            color='primary'
                            // startIcon={<DownloadIcon />}
                            onClick={handleExportShiftTime}
                        >
                            Export Shift Time
                        </Button>
                    </Grid>
                )}
            </Stack>
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

            {/* Punch In / Out Component */}
            <PunchInOut
                selectedDate={selectedDate}
                selectedEmployeeId={selectedEmployeeId}
                disablePunch={showTeamBreakSheets}
            />
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    mb: 4
                }}
            >
                <Grid container spacing={3}>
                    {/* BreakSheet Title */}
                    <Grid item xs={12} display='flex' alignItems='center' gap={2}>
                        <Timer sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Typography variant='h4' fontWeight='bold' color='primary.main'>
                            Break Sheet
                        </Typography>
                    </Grid>

                    {/* Button for Manager to View Team Break Sheets */}
                    {userRole === '2' && (
                        <Grid item xs={12}>
                            <Button
                                variant='contained'
                                startIcon={<Group />}
                                onClick={handleTeamsBreakSheetClick}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    boxShadow: 2,
                                    background: theme =>
                                        `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`
                                }}
                            >
                                {showTeamBreakSheets ? 'Hide Team Break Sheets' : 'View Team Break Sheets'}
                            </Button>
                        </Grid>
                    )}

                    {/* Team BreakSheets Display */}
                    {showTeamBreakSheets && (
                        <Grid item xs={12}>
                            <TeamBreakSheets managerId={employeeId} onEmployeeClick={handleEmployeeClick} />
                        </Grid>
                    )}

                    {/* Employee Selection (Admin only) */}
                    {Number(userRole) <= 1 && (
                        <Grid item xs={12} md={6}>
                            <Card variant='outlined' sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                                        <Typography variant='h6'>Employee Selection</Typography>
                                    </Stack>
                                    {/* React Autocomplete for Search */}
                                    <Autocomplete
                                        options={employees} // List of employees
                                        getOptionLabel={option => `${option.first_name} ${option.last_name}`} // How each option is displayed
                                        renderInput={params => <TextField {...params} label='Search Employee' variant='outlined' />} // Input field with Material-UI TextField
                                        value={selectedEmployeeId ? employees.find(emp => emp._id === selectedEmployeeId) : null}
                                        onChange={(event, newValue) => {
                                            setSelectedEmployeeId(newValue ? newValue._id : '')
                                        }} // Handle selection
                                        isOptionEqualToValue={(option, value) => option._id === value._id} // Avoid warnings
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Time Summary and Date Selection */}
                    <Grid item xs={12}>
                        <Card variant='outlined' sx={{ borderRadius: 2, mb: 3 }}>
                            <CardContent>
                                <Stack spacing={3}>
                                    {/* Time Summary (skipped if userDesignation === 'Assistant Manager Hr') */}
                                    <TimeSummary
                                        totalOnFieldDuration={totalOnFieldDuration}
                                        totalDurationForDate={totalDurationForDate}
                                        breakProgress={breakProgress}
                                        userDesignation={userDesignation}
                                    />

                                    {/* Date Selection */}
                                    <DateSelection selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Break Controls (only if large screen and not Assistant Manager Hr) */}
                    {isLargeScreen && userDesignation !== 'Assistant Manager Hr' && (
                        <Grid item xs={12}>
                            <Card variant='outlined' sx={{ borderRadius: 2, mb: 3 }}>
                                <CardContent>
                                    <Stack direction='row' alignItems='center' spacing={2} mb={3}>
                                        <Coffee color='primary' />
                                        <Typography variant='h6'>Break Controls</Typography>
                                    </Stack>

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
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Break List */}
                    <Grid item xs={12}>
                        <Card variant='outlined' sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Stack direction='row' alignItems='center' spacing={2} mb={3}>
                                    <AccessTime color='primary' />
                                    <Typography variant='h6'>Breaks Taken on {selectedDate}</Typography>
                                </Stack>

                                <BreakList filteredBreaks={filteredBreaks} userRole={userRole} handleEditClick={handleEditClick} />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

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
