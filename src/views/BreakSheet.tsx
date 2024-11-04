'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    Button,
    Grid,
    TextField,
    MenuItem,
    Typography,
    Box,
    Autocomplete,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Paper,
    Stack
} from '@mui/material'
import {
    addBreak,
    Break,
    fetchBreaksById,
    updateBreak,
    updateLatestBreak
} from '@/redux/features/breaksheets/breaksSlice'
import { RootState, AppDispatch } from '@/redux/store'
import { apiResponse } from '../utility/apiResponse/employeesResponse'
import { AccessTime, Coffee, EventNote, Group, MoreVert, Person, Timer } from '@mui/icons-material'
import EditBreakForm from '@/components/breaksheet/BreakSheetForm'
import TeamBreakSheets from '@/utility/breaksheets/TeamBreakSheets'
import PunchInOut from './PunchInOut'
import { fetchTotalWorkingHours } from '@/redux/features/punches/punchesSlice'
import NotPunchedInToday from './NotPunchedInToday'

const BreakSheet: React.FC = () => {
    const dispatch: AppDispatch = useDispatch()
    const { breaks, loading, error } = useSelector((state: RootState) => state.breaks)

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
    const [employees, setEmployees] = useState([])
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const [openEditForm, setOpenEditForm] = useState(false)
    const [currentBreak, setCurrentBreak] = useState(null)
    const [specifyError, setSpecifyError] = useState<string>('')
    const [showNotPunchedIn, setShowNotPunchedIn] = useState(false);


    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const [showTeamBreakSheets, setShowTeamBreakSheets] = useState(false)
    const [isLargeScreen, setIsLargeScreen] = useState(false)

    const [selectedEmployeeWorkingHours, setSelectedEmployeeWorkingHours] = useState<string>('00h 00m 00s')

    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = employee?.id
    const userRole = employee?.role
    const userDesignation = employee?.desg;
    console.log('jdkjak', userDesignation)

    const breakOptions = ['Washroom', 'Lunch', 'Refreshment', 'Tea', 'Personal Call', 'On Field', 'Other']

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]
        setIsCurrentDate(selectedDate === today)
    }, [selectedDate])

    useEffect(() => {
        const handleResize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        return () => window.removeEventListener('resize', handleResize)
    }, [])

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

        // const savedBreakData = localStorage.getItem('runningBreak')
        // if (savedBreakData) {
        //     const { breakType, startTimestamp, otherBreakType } = JSON.parse(savedBreakData)
        //     setBreakType(breakType)
        //     setStartTimestamp(startTimestamp)
        //     setStartTime(new Date(startTimestamp).toLocaleTimeString())
        //     setTimerRunning(true)
        //     startBreakTimer(startTimestamp)
        //     if (breakType === 'Other') setOtherBreakType(otherBreakType)
        // }
    }, [userRole])

    useEffect(() => {
        const fetchWorkingHours = async () => {
            if (selectedEmployeeId && selectedDate) {
                const workingHoursResponse = await dispatch(
                    fetchTotalWorkingHours({ employeeId: selectedEmployeeId, date: selectedDate })
                )

                console.log('Working Hours Response:', workingHoursResponse.payload)

                const { hours = 0, minutes = 0, seconds = 0 } = workingHoursResponse.payload || {}

                setSelectedEmployeeWorkingHours(`${hours}h ${minutes}m ${seconds}s`)
            }
        }

        fetchWorkingHours()
    }, [selectedEmployeeId, selectedDate, dispatch])

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

    const formatTime = (milliseconds: number) => {
        const seconds = Math.floor((milliseconds / 1000) % 60)
        const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
        const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24)
        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
    }

    const convertToMilliseconds = (timeString: string) => {
        if (!timeString) return 0
        const [hours, minutes, seconds] = timeString.split(/[hms]/).map(Number)
        return hours * 3600000 + minutes * 60000 + seconds * 1000
    }

    const getTimestampFromTime = (timeString: string, dateString: string) => {
        const combinedString = `${dateString} ${timeString}`
        return new Date(combinedString).getTime()
    }

    useEffect(() => {
        const fetchRunningBreak = async () => {
            const runningBreakResponse = await dispatch(fetchBreaksById(employeeId))
            const runningBreak = runningBreakResponse.payload.find((b: Break) => !b.endTime)

            if (runningBreak) {
                setStartTime(runningBreak.startTime)

                const startTimestamp = getTimestampFromTime(runningBreak.startTime, runningBreak.date)
                setStartTimestamp(startTimestamp)
                setTimerRunning(true)
                startBreakTimer(startTimestamp)
            }
        }

        fetchRunningBreak()
    }, [dispatch, employeeId])

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
            employee: employeeId
        }

        dispatch(addBreak(breakData)).then(() => {
            setBreakType('')
            setOtherBreakType('')
        })

        startBreakTimer(timestamp)
    }
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

    useEffect(() => {
        if (Number(userRole) <= 2 && selectedEmployeeId) {
            dispatch(fetchBreaksById(selectedEmployeeId))
        } else {
            dispatch(fetchBreaksById(null))
        }
    }, [dispatch, selectedEmployeeId, userRole])

    useEffect(() => {
        const filtered = breaks.filter(b => b.date === selectedDate)
        const onField = filtered.filter(b => b.type === 'On Field')
        const nonOnFieldBreaks = filtered.filter(b => b.type !== 'On Field')

        setFilteredBreaks(nonOnFieldBreaks)
        setOnFieldBreaks(onField)
    }, [selectedDate, breaks])

    const totalDurationForDate = filteredBreaks.reduce((acc, b) => acc + convertToMilliseconds(b.duration), 0)
    const totalOnFieldDuration = onFieldBreaks.reduce((acc, b) => acc + convertToMilliseconds(b.duration), 0)

    const handleEditClick = breakToEdit => {
        const breakWithCorrectIds = {
            ...breakToEdit,
            _id: breakToEdit._id,
            employee: breakToEdit.employee
        }

        setCurrentBreak(breakWithCorrectIds)
        setOpenEditForm(true)
    }

    const handleEditSubmit = updatedBreak => {
        if (updatedBreak && updatedBreak._id) {
            const breakId = updatedBreak._id
            dispatch(updateBreak({ id: breakId, updatedBreak }))
            dispatch(fetchBreaksById(selectedEmployeeId || employeeId))
            setOpenEditForm(false)
        } else {
            console.error('Error: Break ID is undefined.')
        }
    }

    const handleEmployeeClick = (empId: string) => {
        setSelectedEmployeeId(empId)
        dispatch(fetchBreaksById(empId))
    }

    const handleTeamsBreakSheetClick = () => {
        setShowTeamBreakSheets(prev => !prev)
        setSelectedEmployeeId(null)
        console.log('selected emp by mangaer', showTeamBreakSheets)
    }

    const maxAllowedBreakTime = 3600000
    const breakProgress = (totalDurationForDate / maxAllowedBreakTime) * 100

    const toggleNotPunchedInToday = () => {
        setShowNotPunchedIn((prev) => !prev);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: 'background.default' }}>
            <Button
                variant="contained"
                onClick={toggleNotPunchedInToday}
                sx={{
                    borderRadius: 2,
                    py: 1.5,
                    boxShadow: 2,
                    ml: '1.5rem',
                    background: theme => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`
                }}
            >
                {showNotPunchedIn ? 'Hide Missing Punches' : 'Show Missing Punches'}
            </Button>

            {showNotPunchedIn && <NotPunchedInToday selectedDate={selectedDate} />}

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
                    <Grid item xs={12} display='flex' alignItems='center' gap={2}>
                        <Timer sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Typography variant='h4' fontWeight='bold' color='primary.main'>
                            Break Sheet
                        </Typography>
                    </Grid>

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

                    {showTeamBreakSheets && (
                        <Grid item xs={12}>
                            <TeamBreakSheets managerId={employeeId} onEmployeeClick={handleEmployeeClick} />
                        </Grid>
                    )}

                    {Number(userRole) <= 1 && (
                        <Grid item xs={12} md={6}>
                            <Card variant='outlined' sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                                        <Person color='primary' />
                                        <Typography variant='h6'>Employee Selection</Typography>
                                    </Stack>
                                    <Autocomplete
                                        options={employees}
                                        getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                                        renderInput={params => (
                                            <TextField
                                                {...params}
                                                label='Select Employee'
                                                variant='outlined'
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        )}
                                        value={selectedEmployeeId ? employees.find(emp => emp._id === selectedEmployeeId) : null}
                                        onChange={(e, value) => setSelectedEmployeeId(value ? value._id : null)}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Card variant='outlined' sx={{ borderRadius: 2, mb: 3 }}>
                            <CardContent>
                                <Stack spacing={3}>
                                    {userDesignation !== 'Assistant Manager Hr' && <Box>
                                        <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                                            <AccessTime color='primary' />
                                            <Typography variant='h6'>Time Summary</Typography>
                                        </Stack>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        background: theme =>
                                                            `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`
                                                    }}
                                                >
                                                    <Typography variant='subtitle2' color='white' gutterBottom>
                                                        On-Site Duration
                                                    </Typography>
                                                    <Typography variant='h5' color='white' fontWeight='bold'>
                                                        {formatTime(totalOnFieldDuration)}
                                                    </Typography>
                                                </Paper>
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <Paper
                                                    elevation={1}
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        background: theme =>
                                                            breakProgress > 100
                                                                ? `linear-gradient(45deg, ${theme.palette.error.light} 30%, ${theme.palette.error.main} 90%)`
                                                                : `linear-gradient(45deg, ${theme.palette.success.light} 30%, ${theme.palette.success.main} 90%)`
                                                    }}
                                                >
                                                    <Typography variant='subtitle2' color='white' gutterBottom>
                                                        Total Break Duration
                                                    </Typography>
                                                    <Typography variant='h5' color='white' fontWeight='bold'>
                                                        {formatTime(totalDurationForDate)}
                                                    </Typography>
                                                    <LinearProgress
                                                        variant='determinate'
                                                        value={Math.min(breakProgress, 100)}
                                                        sx={{
                                                            mt: 1,
                                                            height: 8,
                                                            borderRadius: 4,
                                                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                                            '& .MuiLinearProgress-bar': {
                                                                backgroundColor: 'white'
                                                            }
                                                        }}
                                                    />
                                                </Paper>
                                            </Grid>
                                        </Grid>
                                    </Box>}

                                    <Box>
                                        <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                                            <EventNote color='primary' />
                                            <Typography variant='h6'>Date Selection</Typography>
                                        </Stack>
                                        <TextField
                                            label='Select Date'
                                            type='date'
                                            value={selectedDate}
                                            onChange={e => setSelectedDate(e.target.value)}
                                            sx={{
                                                width: { xs: '100%', sm: 'auto' },
                                                '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {isLargeScreen && userDesignation !== 'Assistant Manager Hr' && (
                        <Grid item xs={12}>
                            <Card variant='outlined' sx={{ borderRadius: 2, mb: 3 }}>
                                <CardContent>
                                    <Stack direction='row' alignItems='center' spacing={2} mb={3}>
                                        <Coffee color='primary' />
                                        <Typography variant='h6'>Break Controls</Typography>
                                    </Stack>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                select
                                                label='Choose Break Type'
                                                value={breakType}
                                                onChange={e => setBreakType(e.target.value)}
                                                fullWidth
                                                variant='outlined'
                                                disabled={
                                                    !isCurrentDate ||
                                                    (selectedEmployeeId && selectedEmployeeId !== employeeId && userRole === '2')
                                                }
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            >
                                                {breakOptions.map(option => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {breakType === 'Other' && (
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label='Please specify'
                                                    value={otherBreakType}
                                                    onChange={e => {
                                                        setOtherBreakType(e.target.value)
                                                        setSpecifyError('')
                                                    }}
                                                    fullWidth
                                                    variant='outlined'
                                                    error={!!specifyError}
                                                    helperText={specifyError}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                            </Grid>
                                        )}

                                        <Grid item xs={12} md={6}>
                                            <Button
                                                variant='contained'
                                                startIcon={<Timer />}
                                                onClick={handleStartTime}
                                                disabled={
                                                    !isCurrentDate ||
                                                    timerRunning ||
                                                    (selectedEmployeeId && selectedEmployeeId !== employeeId && userRole === '2')
                                                }
                                                fullWidth
                                                sx={{
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    boxShadow: 2,
                                                    background: timerRunning
                                                        ? 'linear-gradient(45deg, #FFB74D 30%, #FF9800 90%)'
                                                        : 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
                                                }}
                                            >
                                                {timerRunning ? 'Break Running...' : 'Start Break'}
                                            </Button>
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label='Break Start'
                                                value={startTime}
                                                disabled
                                                fullWidth
                                                variant='outlined'
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                label='Duration'
                                                value={duration}
                                                disabled
                                                fullWidth
                                                variant='outlined'
                                                sx={{
                                                    display: { xs: 'none', sm: 'block' },
                                                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Button
                                                variant='contained'
                                                color='secondary'
                                                startIcon={<Timer />}
                                                onClick={handleEndTime}
                                                disabled={!isCurrentDate || !timerRunning}
                                                fullWidth
                                                sx={{
                                                    display: { xs: 'none', sm: 'block' },
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    boxShadow: 2,
                                                    background: 'linear-gradient(45deg, #F44336 30%, #EF5350 90%)'
                                                }}
                                            >
                                                End Break
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Card variant='outlined' sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Stack direction='row' alignItems='center' spacing={2} mb={3}>
                                    <EventNote color='primary' />
                                    <Typography variant='h6'>Breaks Taken on {selectedDate}</Typography>
                                </Stack>

                                <Grid container spacing={2}>
                                    {filteredBreaks.map((breakEntry, index) => (
                                        <Grid item xs={12} sm={6} md={3} key={index}>
                                            <Card
                                                elevation={2}
                                                sx={{
                                                    height: '100%',
                                                    borderRadius: 2,
                                                    position: 'relative',
                                                    transition: 'transform 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)'
                                                    },
                                                    ...(breakEntry.endTime === '' && {
                                                        animation: 'pulse 1.8s infinite',
                                                        '@keyframes pulse': {
                                                            '0%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.4)' },
                                                            '70%': { boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)' },
                                                            '100%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)' }
                                                        }
                                                    })
                                                }}
                                            >
                                                <CardContent>
                                                    <Stack spacing={2}>
                                                        <Chip label={breakEntry.type} color='primary' variant='outlined' sx={{ borderRadius: 2 }} />

                                                        <Stack spacing={1}>
                                                            <Typography variant='body2' color='text.secondary'>
                                                                Start: {breakEntry.startTime}
                                                            </Typography>
                                                            <Typography variant='body2' color='text.secondary'>
                                                                End: {breakEntry.endTime || 'In Progress'}
                                                            </Typography>
                                                            <Typography variant='body1' color='primary.main' fontWeight='bold'>
                                                                Duration: {breakEntry.duration}
                                                            </Typography>
                                                        </Stack>

                                                        {userRole === '1' && (
                                                            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                                                <Tooltip title='Edit Break'>
                                                                    <IconButton
                                                                        size='small'
                                                                        onClick={() => handleEditClick(breakEntry)}
                                                                        sx={{
                                                                            bgcolor: 'background.paper',
                                                                            boxShadow: 1,
                                                                            '&:hover': {
                                                                                bgcolor: 'primary.light',
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <MoreVert fontSize='small' />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

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
