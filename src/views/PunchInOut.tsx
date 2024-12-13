'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button, Typography, Box, Grid, Card, Tooltip, Container, Paper, Stack, Divider } from '@mui/material'
import {
    AccessTime as AccessTimeIcon,
    Timer as TimerIcon,
    PlayArrow as PlayArrowIcon,
    Stop as StopIcon
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import {
    addPunch,
    fetchTotalWorkingHours,
    fetchPunchByEmployeeAndDate,
    updatePunch
} from '@/redux/features/punches/punchesSlice'
import { RootState } from '@/redux/store'

interface PunchInOutProps {
    selectedDate: string
    selectedEmployeeId?: string
    disablePunch?: boolean
}

const PunchInOut: React.FC<PunchInOutProps> = ({ selectedDate, selectedEmployeeId, disablePunch }) => {
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

    const employee = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = selectedEmployeeId || employee?.id
    const userRole = employee?.role
    const userDesg = employee?.designation
    const totalWorkingHours = useSelector((state: RootState) => state.punches.totalWorkingHours)
    const punch = useSelector((state: RootState) => state.punches.punches)
    const loading = useSelector((state: RootState) => state.punches.loading)
    const error = useSelector((state: RootState) => state.punches.error)

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
            employee: employeeId
        }

        await dispatch(addPunch(punchData)).unwrap()

        setPunchState({
            ...punchState,
            isPunchIn: true,
            startTime,
            isPunchInDisabled: true,
            isPunchOutDisabled: false
        })

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
        stopPunchTimer()

        const punchData = {
            punchOut: endTime,
            totalTime: timer
        }

        await dispatch(updatePunch({ employeeId, punchData }))

        setPunchState({
            isPunchIn: false,
            startTime: '',
            endTime: '',
            totalTime: '00h 00m 00s',
            isPunchInDisabled: false,
            isPunchOutDisabled: true
        })

        // localStorage.removeItem('punchState')

        await dispatch(fetchPunchByEmployeeAndDate({ employeeId, date: selectedDate }))
        dispatch(fetchTotalWorkingHours({ employeeId, date: selectedDate }))
    }

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

                            {/* F2 Text in the center */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '35%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '80px', // Adjust width and height as needed
                                    height: '100px',
                                    overflow: 'hidden',
                                    opacity: '0.6'
                                }}
                            >
                                <img
                                    src='/images/logos/fintech.png' // Path to your logo image
                                    alt='F2 Fintech'
                                    style={{
                                        width: '100%',
                                        height: '120%',
                                        objectFit: 'contain' // Adjust to maintain aspect ratio
                                    }}
                                />
                            </Box>

                            {/* Clock Numbers (1 to 12) */}
                            {Array.from({ length: 12 }).map((_, index) => {
                                const angle = (index + 1) * 30 // Each number is 30 degrees apart
                                const x = 50 + 35 * Math.cos((angle - 90) * (Math.PI / 180)) // X coordinate
                                const y = 50 + 35 * Math.sin((angle - 90) * (Math.PI / 180)) // Y coordinate

                                return (
                                    <Typography
                                        key={index}
                                        variant='body1'
                                        sx={{
                                            position: 'absolute',
                                            top: `${y}%`,
                                            left: `${x}%`,
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

                        <Typography variant='h6' sx={{ mt: 2 }}>
                            {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' })}
                        </Typography>
                        <Typography variant='h6' sx={{ mt: 1 }}>
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
                                    disabled={punchState.isPunchInDisabled || disablePunch || !isCurrentDate ||
                                        (isLargeScreen === false && !(userDesg === 'Purchase Manager' || userDesg === 'Field Executive'))
                                    }
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
                                    disabled={punchState.isPunchOutDisabled || disablePunch ||
                                        (isLargeScreen === false && !(userDesg === 'Purchase Manager' || userDesg === 'Field Executive'))
                                    }
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
                        <Typography variant='h5' sx={{ mb: 3 }}>
                            Attendance Logs
                        </Typography>

                        <Grid container spacing={2} sx={{ textAlign: 'center', mb: 2 }}>
                            <Grid item xs={4}>
                                <Typography variant='subtitle1' fontWeight='bold'>
                                    Punch In
                                </Typography>
                                <Typography color='text.secondary'>{currentPunch?.punchIn || '-'}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant='subtitle1' fontWeight='bold'>
                                    Punch Out
                                </Typography>
                                <Typography color='text.secondary'>{currentPunch?.punchOut || '-'}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant='subtitle1' fontWeight='bold'>
                                    Total Time
                                </Typography>
                                <Typography color='text.secondary'>{currentPunch?.totalTime || '-'}</Typography>
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
                    <Typography variant='h6'>Total Working Hours of {selectedDate}</Typography>
                    <Typography variant='h4' color='primary'>
                        {`${totalWorkingHours?.hours || 0}h ${totalWorkingHours?.minutes || 0}m ${totalWorkingHours?.seconds || 0}s`}
                    </Typography>
                </Box>
            </Card>
        </Container>
    )
}
export default PunchInOut
