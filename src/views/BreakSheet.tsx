'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
} from '@mui/material';

import { AccessTime, Coffee, Group, Timer } from '@mui/icons-material';

import {
    addBreak,
    Break,
    fetchBreaksById,
    updateBreak,
    updateLatestBreak,
} from '@/redux/features/breaksheets/breaksSlice';
import { RootState, AppDispatch } from '@/redux/store';

import { apiResponse } from '../utility/apiResponse/employeesResponse'; // Adjust the path if needed
import { fetchTotalWorkingHours } from '@/redux/features/punches/punchesSlice';

import PunchInOut from '@/views/PunchInOut';
import NotPunchedInToday from '@/views/NotPunchedInToday';
import TeamBreakSheets from '@/utility/breaksheets/TeamBreakSheets';
import EditBreakForm from '@components/breaksheet/BreakSheetForm';

// Split sub-components
import BreakControls from '@/components/breaksheet/BreakControls';
import BreakList from '@/components/breaksheet/BreakList';
import TimeSummary from '@/components/breaksheet/TimeSummary';
import DateSelection from '@/components/breaksheet/DateSelection';

// Utility functions
import { formatTime, convertToMilliseconds, getTimestampFromTime } from '@/utility/timeUtils';
import NotPunchedOutPage from './NotPunchedOutPage';

const BreakSheet: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const { breaks } = useSelector((state: RootState) => state.breaks);

    const [breakType, setBreakType] = useState<string>('');
    const [otherBreakType, setOtherBreakType] = useState<string>('');
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [duration, setDuration] = useState<string>('');

    const [filteredBreaks, setFilteredBreaks] = useState<Break[]>([]);
    const [onFieldBreaks, setOnFieldBreaks] = useState<Break[]>([]);

    const [timerRunning, setTimerRunning] = useState<boolean>(false);
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isCurrentDate, setIsCurrentDate] = useState<boolean>(true);

    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const [openEditForm, setOpenEditForm] = useState(false);
    const [currentBreak, setCurrentBreak] = useState<Break | null>(null);
    const [specifyError, setSpecifyError] = useState<string>('');
    const [showNotPunchedIn, setShowNotPunchedIn] = useState(false);
    const [showNotPunchedOut, setShowNotPunchedOut] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [showTeamBreakSheets, setShowTeamBreakSheets] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    const [selectedEmployeeWorkingHours, setSelectedEmployeeWorkingHours] = useState<string>('00h 00m 00s');

    // Retrieve employee from localStorage (if available)
    const employee = JSON.parse(localStorage.getItem('user') || '{}');
    const employeeId = employee?.id;
    const userRole = employee?.role;
    const userDesignation = employee?.desg;
    console.log("employee", employee)

    const breakOptions = ['Washroom', 'Lunch', 'Refreshment', 'Tea', 'Personal Call', 'On Field', 'Other'];

    // Check if the selected date is the current date
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setIsCurrentDate(selectedDate === today);
    }, [selectedDate]);

    // Handle screen resizing
    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // If user is Admin or Manager, fetch employees
    useEffect(() => {
        if (Number(userRole) <= 2) {
            const fetchEmployees = async () => {
                try {
                    const employeeData = await apiResponse();
                    setEmployees(employeeData);
                } catch (error) {
                    console.error('Error fetching employees:', error);
                }
            };
            fetchEmployees();
        }
    }, [userRole]);

    // Fetch total working hours for the selectedEmployeeId and date
    useEffect(() => {
        const fetchWorkingHours = async () => {
            if (selectedEmployeeId && selectedDate) {
                const workingHoursResponse = await dispatch(
                    fetchTotalWorkingHours({ employeeId: selectedEmployeeId, date: selectedDate })
                );

                const { hours = 0, minutes = 0, seconds = 0 } = workingHoursResponse.payload || {};
                setSelectedEmployeeWorkingHours(`${hours}h ${minutes}m ${seconds}s`);
            }
        };
        fetchWorkingHours();
    }, [selectedEmployeeId, selectedDate, dispatch]);

    // Timer start
    const startBreakTimer = (timestamp: number) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            const currentTime = Date.now();
            const diff = currentTime - timestamp;
            setDuration(formatTime(diff));
        }, 1000);
    };

    // Timer stop
    const stopBreakTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setDuration('00h 00m 00s');
        setTimerRunning(false);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Check if there's a running break
    useEffect(() => {
        const fetchRunningBreak = async () => {
            const runningBreakResponse = await dispatch(fetchBreaksById(employeeId));
            const runningBreak = runningBreakResponse?.payload?.find((b: Break) => !b.endTime);

            if (runningBreak) {
                setStartTime(runningBreak.startTime);
                const startTS = getTimestampFromTime(runningBreak.startTime, runningBreak.date);
                setStartTimestamp(startTS);
                setTimerRunning(true);
                startBreakTimer(startTS);
            }
        };
        dispatch(fetchBreaksById(employeeId)).then(() => {
            // After fetching all breaks, check if there's a running break
            fetchRunningBreak();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, employeeId]);

    // Handle Start Break
    const handleStartTime = () => {
        if (!breakType) {
            alert('Please select a break type before starting your break.');
            return;
        }
        if (breakType === 'Other' && !otherBreakType.trim()) {
            alert('Please specify the break type');
            return;
        }
        const now = new Date();
        const formattedStartTime = now.toLocaleTimeString('en-US');
        const timestamp = now.getTime();

        setStartTime(formattedStartTime);
        setStartTimestamp(timestamp);
        setTimerRunning(true);

        const breakData = {
            type: breakType === 'Other' ? otherBreakType : breakType,
            startTime: formattedStartTime,
            endTime: '',
            date: new Date().toISOString().split('T')[0],
            employee: employeeId,
            company_id: employee.company_id
        };

        dispatch(addBreak(breakData)).then(() => {
            setBreakType('');
            setOtherBreakType('');
        });
        startBreakTimer(timestamp);
    };

    // Handle End Break
    const handleEndTime = () => {
        if (startTime) {
            const now = new Date();
            const formattedEndTime = now.toLocaleTimeString('en-US');

            setEndTime(formattedEndTime);
            setTimerRunning(false);

            const breakData = {
                endTime: formattedEndTime,
            };

            dispatch(updateLatestBreak({ employeeId, breakData }))
                .then(() => {
                    stopBreakTimer();
                    setStartTime('');
                    setEndTime('');
                    return dispatch(fetchBreaksById(employeeId));
                })
                .catch(error => {
                    console.error('Error updating the latest break:', error);
                });
        }
    };

    // Fetch breaks for either the selected employee if manager/admin or for self
    useEffect(() => {
        if (Number(userRole) <= 2 && selectedEmployeeId) {
            dispatch(fetchBreaksById(selectedEmployeeId));
        } else {
            dispatch(fetchBreaksById(employeeId));
        }
    }, [dispatch, selectedEmployeeId, userRole, employeeId]);

    // Filter breaks for the selected date
    useEffect(() => {
        const filtered = breaks.filter(b => b.date === selectedDate);
        const onField = filtered.filter(b => b.type === 'On Field');
        const nonOnFieldBreaks = filtered.filter(b => b.type !== 'On Field');

        setFilteredBreaks(filtered);
        setOnFieldBreaks(onField);
    }, [selectedDate, breaks]);

    // Calculate total durations
    const totalDurationForDate = filteredBreaks
        .filter(b => b.type !== 'On Field')
        .reduce((acc, b) => acc + convertToMilliseconds(b.duration), 0);

    const totalOnFieldDuration = onFieldBreaks.reduce((acc, b) => acc + convertToMilliseconds(b.duration), 0);

    // Edit Break Handlers
    const handleEditClick = (breakToEdit: Break) => {
        setCurrentBreak(breakToEdit);
        setOpenEditForm(true);
    };

    const handleEditSubmit = (updatedBreak: Break) => {
        if (updatedBreak && updatedBreak._id) {
            const breakId = updatedBreak._id;
            dispatch(updateBreak({ id: breakId, updatedBreak }));
            dispatch(fetchBreaksById(selectedEmployeeId || employeeId));
            setOpenEditForm(false);
        } else {
            console.error('Error: Break ID is undefined.');
        }
    };

    // Handler for manager to see employee’s breaks
    const handleEmployeeClick = (empId: string) => {
        setSelectedEmployeeId(empId);
        dispatch(fetchBreaksById(empId));
    };

    // Toggle Team Break Sheets
    const handleTeamsBreakSheetClick = () => {
        setShowTeamBreakSheets(prev => !prev);
        setSelectedEmployeeId(null);
    };

    // Calculate break progress
    const maxAllowedBreakTime = 3600000; // 1 hour in ms
    const breakProgress = (totalDurationForDate / maxAllowedBreakTime) * 100;

    // Toggle Not Punched In Today
    const toggleNotPunchedInToday = () => {
        setShowNotPunchedIn(prev => !prev);
    };

    const toggleNotPunchedOut = () => {
        setShowNotPunchedOut(prev => !prev);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: 'background.default' }}>
            {/* Row with two buttons */}
            <Stack direction="row" spacing={2} mb={2}>
                <Button
                    variant="contained"
                    onClick={toggleNotPunchedInToday}
                    sx={{
                        borderRadius: 2,
                        py: 1.5,
                        boxShadow: 2,
                        background: theme =>
                            `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                    }}
                >
                    {showNotPunchedIn ? 'Hide Missing Punches & Absent' : 'Show Missing Punches & Absent'}
                </Button>

                <Button
                    variant="contained"
                    onClick={toggleNotPunchedOut}
                    sx={{
                        borderRadius: 2,
                        py: 1.5,
                        boxShadow: 2,
                        background: theme =>
                            `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`,
                    }}
                >
                    {showNotPunchedOut ? 'Hide Not Punched Out' : 'Show Not Punched Out'}
                </Button>
            </Stack>

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
                    mb: 4,
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
                                        `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
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
                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                                        <Typography variant="h6">Employee Selection</Typography>
                                    </Stack>
                                    {/* React Autocomplete for Search */}
                                    <Autocomplete
                                        options={employees} // List of employees
                                        getOptionLabel={(option) =>
                                            `${option.first_name} ${option.last_name}`
                                        } // How each option is displayed
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Search Employee"
                                                variant="outlined"
                                            />
                                        )} // Input field with Material-UI TextField
                                        value={selectedEmployeeId ? employees.find(emp => emp._id === selectedEmployeeId) : null}
                                        onChange={(event, newValue) => {
                                            setSelectedEmployeeId(newValue ? newValue._id : '');
                                        }} // Handle selection
                                        isOptionEqualToValue={(option, value) =>
                                            option._id === value._id
                                        } // Avoid warnings
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
                                    <DateSelection
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                    />
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
                                    <Typography variant='h6'>
                                        Breaks Taken on {selectedDate}
                                    </Typography>
                                </Stack>

                                <BreakList
                                    filteredBreaks={filteredBreaks}
                                    userRole={userRole}
                                    handleEditClick={handleEditClick}
                                />
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
    );
};

export default BreakSheet;
