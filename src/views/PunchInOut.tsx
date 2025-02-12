'use client'

import React, { useState, useEffect, useRef } from 'react'

import { useMediaQuery, useTheme, Button, Typography, Box, Grid, Card, Tooltip, Container, Paper, Stack, Divider } from '@mui/material'
import Avatar from '@mui/material/Avatar'
import {
    AccessTime as AccessTimeIcon,
    Timer as TimerIcon,
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'

import { fetchConfiguration } from '@/utility/setting-configuration/settingConfig';

import {
    addPunch,
    fetchTotalWorkingHours,
    fetchPunchByEmployeeAndDate,
    updatePunch
} from '@/redux/features/punches/punchesSlice'
import type { RootState } from '@/redux/store'
import Company from '@/app/(dashboard)/company/page'

interface PunchInOutProps {
    selectedDate: string
    selectedEmployeeId?: string
    disablePunch?: boolean
}

const PunchInOut: React.FC<PunchInOutProps & { isMinimalView?: boolean }> = ({
    selectedDate,
    selectedEmployeeId,
    disablePunch,
    isMinimalView = false
}) => {
    const user = typeof window !== 'undefined' ? localStorage?.getItem('user') : null
    const { company_id } = user ? JSON.parse(user) : {}
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
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

    const [timer, setTimer] = useState('00h 00m 00s')
    const [currentPunchIndex, setCurrentPunchIndex] = useState(0)
    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    const [isLargeScreen, setIsLargeScreen] = useState(false)
    const [startTimestamp, setStartTimestamp] = useState<number | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [logoUrl, setLogoUrl] = useState('/images/logos/fintech.png');
    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = selectedEmployeeId || employee?.id
    const userRole = employee?.role
    const userDesg = employee?.designation
    const totalWorkingHours = useSelector((state: RootState) => state.punches.totalWorkingHours)
    const punch = useSelector((state: RootState) => state.punches.punches)
    const loading = useSelector((state: RootState) => state.punches.loading)
    const error = useSelector((state: RootState) => state.punches.error)
    const [userData, setUserData] = useState(null)

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

    //to get clock logo from account-settings
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
                            startPunchInTimer(punchInTimestamp)
                        } else {
                            setPunchState({
                                ...punchState,
                                isPunchIn: false,
                                startTime: latestPunch.punchIn,
                                endTime: latestPunch.punchOut,
                                isPunchInDisabled: false,
                                isPunchOutDisabled: true
                            })
                            stopPunchTimer()
                        }
                    }
                })

            dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
        }
    }, [dispatch, employeeId, selectedDate])

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

        // Immediately update local state
        setPunchState({
            ...punchState,
            isPunchIn: true,
            startTime,
            isPunchInDisabled: true,
            isPunchOutDisabled: false
        })

        // Dispatch the punch action
        await dispatch(addPunch(punchData)).unwrap()

        // Start the punch-in timer
        startPunchInTimer(now.getTime())
    }

    const handlePunchOut = async () => {
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

        // Stop the punch-in timer
        stopPunchTimer()

        // Immediately update local state
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

        // Dispatch the punch-out action
        await dispatch(updatePunch({ employeeId, punchData })).unwrap()

        // Fetch updated data from Redux
        dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }))
        dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
    }

    // Sync local state with Redux state
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
    }, [punch]) // Listen for changes in the Redux state

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
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    const currentPunch = punch.length > 0 ? punch[currentPunchIndex] : null

    //dashboard punchin_out
    if (isMinimalView) {
        const isButtonEnabledOnPhone =
            userDesg === 'Co-Founder & MD' || userDesg === 'Founder & CEO' || userDesg === 'Full Stack Developer';

        // Get current punch-in time
        const punchInTime = punchState.startTime ? new Date(`1970-01-01T${punchState.startTime}`) : null;
        const referenceTime9AM = new Date('1970-01-01T09:00:00');
        const referenceTime10_15AM = new Date('1970-01-01T10:15:00');

        let punchMessage = '';

        if (punchInTime) {
            if (punchInTime <= referenceTime10_15AM && punchInTime >= referenceTime9AM) {
                punchMessage = '✅ Great job! Being on time shows commitment and professionalism. Keep up the good work!';
            } else if (punchInTime > referenceTime10_15AM) {
                punchMessage = '⏰ Punctuality is not just about being on time; it’s about respecting your work, your team, and your commitments.';
            }
        }

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    p: 3,
                    borderRadius: 4,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                    maxWidth: 'auto',
                    mx: 'auto',
                    mt: 2
                }}
            >
                {/* Punch Message - Now Appears at the Top */}
                {punchMessage && (
                    <Typography
                        variant="body1"
                        sx={{
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: 'yellow',
                            background: 'rgba(0, 0, 0, 0.2)',
                            p: 1.5,
                            borderRadius: 2,
                            width: '100%',
                            mb: 2
                        }}
                    >
                        {punchMessage}
                    </Typography>
                )}

                {/* User Image */}
                <Avatar
                    alt={userData?.first_name || 'User'}
                    src={userData?.image}
                    sx={{
                        width: 64,
                        height: 64,
                        border: '2px solid white',
                        mb: 1
                    }}
                />

                {/* Display Current Day Instead of Punch In/Out Text */}
                <Typography
                    variant='h5'
                    sx={{
                        fontWeight: 'bold',
                        textAlign: 'center',
                        mb: 3,
                        color: 'white'
                    }}
                >
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        width: '100%',
                        gap: 2
                    }}
                >
                    {/* Punch In Section */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant='contained'
                            color='success'
                            onClick={handlePunchIn}
                            disabled={
                                (!isButtonEnabledOnPhone && isSmallScreen) ||
                                punchState.isPunchInDisabled ||
                                disablePunch
                            }
                            sx={{ mb: 1 }}
                        >
                            Punch In
                        </Button>
                        {punchState.startTime && (
                            <Typography variant='body2' sx={{ color: 'white' }}>
                                {punchState.startTime}
                            </Typography>
                        )}
                    </Box>

                    {/* Date Display - Moved Between Punch In and Punch Out */}
                    <Typography
                        variant='body2'
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}
                    >
                        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>

                    {/* Punch Out Section */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Button
                            variant='contained'
                            color='error'
                            onClick={handlePunchOut}
                            disabled={
                                (!isButtonEnabledOnPhone && isSmallScreen) ||
                                punchState.isPunchOutDisabled ||
                                disablePunch
                            }
                            sx={{ mb: 1 }}
                        >
                            Punch Out
                        </Button>
                        {punchState.endTime && (
                            <Typography variant='body2' sx={{ color: 'white' }}>
                                {punchState.endTime}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>



        );
    }


    return (
        <Container maxWidth='lg' sx={{ py: 4 }}>
            <Card
                elevation={4}
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    backgroundColor: '#f4f6f7'
                }}
            >
                <Grid container>
                    {/* Time and Current Date Section */}
                    <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                            backgroundColor: '#dfe6e9',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                border: '1px solid #66785F',
                                backgroundColor: '#fff'
                            }}
                        >
                            {/* Hour Hand */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: '4px',
                                    height: '25px', // Adjusted height to fit inside the clock box
                                    backgroundColor: 'black',
                                    top: '50%',
                                    left: '50%',
                                    transformOrigin: 'bottom',
                                    transform: `rotate(${(currentDateTime.getHours() % 12) * 30 + currentDateTime.getMinutes() / 2}deg)`,
                                    transition: 'transform 0.1s ease-in-out',
                                    marginLeft: '-2px', // Centering the hand properly
                                    marginTop: '-25px' // Adjusted to keep the hand inside the clock face
                                }}
                            />
                            {/* Minute Hand */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: '2px',
                                    height: '40px', // Adjusted height to fit inside the clock box
                                    backgroundColor: 'black',
                                    top: '50%',
                                    left: '50%',
                                    transformOrigin: 'bottom',
                                    transform: `rotate(${currentDateTime.getMinutes() * 6}deg)`,
                                    transition: 'transform 0.1s ease-in-out',
                                    marginLeft: '-1px', // Centering the hand properly
                                    marginTop: '-40px' // Adjusted to keep the hand inside the clock face
                                }}
                            />
                            {/* Second Hand */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: '1px',
                                    height: '50px', // Adjusted height to fit inside the clock box
                                    backgroundColor: 'red',
                                    top: '50%',
                                    left: '50%',
                                    transformOrigin: 'bottom',
                                    transform: `rotate(${currentDateTime.getSeconds() * 6}deg)`,
                                    transition: 'transform 0.1s ease-in-out',
                                    marginLeft: '-0.5px', // Centering the hand properly
                                    marginTop: '-50px' // Adjusted to keep the hand inside the clock face
                                }}
                            />

                            {/* Company logo inside Clock */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '39%',
                                    left: '50%',
                                    transform: 'translate(-50%, -30%)',
                                    width: '65px',
                                    height: '65px',
                                    overflow: 'hidden',
                                    opacity: '0.6',
                                    borderRadius: '50%',
                                    backgroundColor: 'transparent'
                                }}
                            >
                                <img
                                    src={logoUrl}
                                    alt='Company Logo'
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Box>
                            {/* Clock Numbers (1 to 12) */}
                            {Array.from({ length: 12 }).map((_, index) => {
                                const angle = (index + 1) * 30
                                const x = 50 + 35 * Math.cos((angle - 90) * (Math.PI / 180))
                                const y = 50 + 35 * Math.sin((angle - 90) * (Math.PI / 180))

                                return (
                                    <Typography
                                        key={index}
                                        variant='body1'
                                        sx={{
                                            position: 'absolute',
                                            top: `${y}%`,
                                            left: `${x}%`,
                                            color: 'black',
                                            transform: 'translate(-50%, -50%)',
                                            fontSize: 14,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {index + 1}
                                    </Typography>
                                )
                            })}
                        </Box>

                        <Typography
                            variant='h6'
                            sx={{
                                mt: 2,
                                color: 'black'
                            }}
                        >
                            {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })}
                        </Typography>
                        <Typography
                            variant='h6'
                            sx={{
                                mt: 1,
                                color: 'black'
                            }}
                        >
                            {currentDateTime.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Grid>

                    {/* <Divider orientation="vertical" flexItem /> */}

                    {/* Punch In/Out and Timer Section */}
                    <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{
                            backgroundColor: '#e8f4f8',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3
                        }}
                    >
                        <TimerIcon sx={{ fontSize: 48, mb: 2, color: 'black' }} />
                        <Typography variant='h5' sx={{ mb: 2, color: 'gray' }}>
                            Daily Check In/Out
                        </Typography>

                        {punchState.isPunchIn && (
                            <Typography variant='h4' sx={{ color: 'primary.main', mb: 2 }}>
                                {timer}
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Tooltip
                                title={
                                    disablePunch
                                        ? `Managers can't punch in for team members.`
                                        : !isCurrentDate
                                            ? 'Punch-In available for today only.'
                                            : ''
                                }
                            >
                                <Button
                                    variant='contained'
                                    color='success'
                                    startIcon={<PlayArrowIcon />}
                                    onClick={handlePunchIn}
                                    disabled={punchState.isPunchInDisabled || disablePunch || !isCurrentDate || !isLargeScreen}
                                >
                                    Punch In
                                </Button>
                            </Tooltip>

                            <Tooltip title={disablePunch ? `Managers can't punch out for team members.` : ''}>
                                <Button
                                    variant='contained'
                                    color='error'
                                    startIcon={<StopIcon />}
                                    onClick={handlePunchOut}
                                    disabled={punchState.isPunchOutDisabled || disablePunch || !isLargeScreen}
                                >
                                    Punch Out
                                </Button>
                            </Tooltip>
                        </Box>
                    </Grid>

                    {/* <Divider orientation="vertical" flexItem /> */}

                    {/* Punch Records and Total Working Hours Section */}
                    <Grid
                        item
                        xs={12}
                        md={12}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3
                        }}
                    >
                        <Typography
                            variant='h5'
                            sx={{
                                mb: 3,
                                color: 'black'
                            }}
                        >
                            Attendance Logs
                        </Typography>

                        <Grid container spacing={2} sx={{ textAlign: 'center', mb: 2 }}>
                            <Grid item xs={4}>
                                <Typography
                                    variant='subtitle1'
                                    fontWeight='bold'
                                    sx={{
                                        color: 'black'
                                    }}
                                >
                                    Punch In
                                </Typography>
                                <Typography
                                    color='text.secondary'
                                    sx={{
                                        color: 'black'
                                    }}
                                >
                                    {currentPunch?.punchIn || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography
                                    variant='subtitle1'
                                    fontWeight='bold'
                                    sx={{
                                        color: 'black'
                                    }}
                                >
                                    Punch Out
                                </Typography>
                                <Typography
                                    color='text.secondary'
                                    sx={{
                                        color: 'black'
                                    }}
                                >
                                    {currentPunch?.punchOut || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography
                                    variant='subtitle1'
                                    fontWeight='bold'
                                    sx={{
                                        color: 'black'
                                    }}
                                >
                                    Total Time
                                </Typography>
                                <Typography
                                    color='text.secondary'
                                    sx={{
                                        color: 'black'
                                    }}
                                >
                                    {currentPunch?.totalTime || '-'}
                                </Typography>
                            </Grid>
                        </Grid>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button variant='outlined' disabled={currentPunchIndex === 0} onClick={handlePreviousPunch}>
                                Previous
                            </Button>
                            <Button variant='outlined' disabled={currentPunchIndex === punch.length - 1} onClick={handleNextPunch}>
                                Next
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                {/* Total Working Hours Footer */}
                <Box
                    sx={{
                        backgroundColor: '#D4BEE4',
                        p: 2,
                        textAlign: 'center'
                    }}
                >
                    <Typography
                        variant='h6'
                        sx={{
                            color: 'black'
                        }}
                    >
                        Total Working Hours of {selectedDate}
                    </Typography>
                    <Typography variant='h4' color='primary'>
                        {`${totalWorkingHours?.hours || 0}h ${totalWorkingHours?.minutes || 0}m ${totalWorkingHours?.seconds || 0}s`}
                    </Typography>
                </Box>
            </Card>
        </Container>
    )
}

export default PunchInOut
