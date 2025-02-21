'use client'

import React, { useEffect, useState } from 'react'
import {
    Card,
    CardHeader,
    CardContent,
    Avatar,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    Grid,
    MenuItem,
    Select,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText
} from '@mui/material'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun'
import HomeIcon from '@mui/icons-material/Home'
import WeekendIcon from '@mui/icons-material/Weekend'
import { CalendarToday, ChevronLeft, ChevronRight, Check, Close, Home, Coffee, AccessTime } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker' // Import DatePicker component
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AppDispatch, RootState } from '@/redux/store'
import { useDispatch, useSelector } from 'react-redux'

import {
    fetchAttendanceSummary,
    fetchNotInYetToday,
    fetchTeamsMemberMonthlyAttendence,
    fetchWhoIsOffToday
} from '@/redux/features/teams/teamsSlice'

const TeamDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>()

    const [teamId, setTeamId] = useState<string | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [loadingTeam, setLoadingTeam] = useState<boolean>(true)
    const { offToday, notInYet, attendanceSummary, teamsMemberMonthlyAttendence, loading, error } = useSelector(
        (state: RootState) => state.teams
    )

    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [openDatePicker, setOpenDatePicker] = useState(false)
    const [openModal, setOpenModal] = useState(false)
    const [selectedEmployees, setSelectedEmployees] = useState<
        { first_name: string; last_name: string; image: string }[]
    >([])

    const legendItems = [
        { status: 'Present', icon: <Check color='success' /> },
        { status: 'Absent', icon: <Close color='error' /> },
        { status: 'On Leave', icon: <PauseCircleOutlineIcon color='info' /> },
        { status: 'On Half', icon: <AccessTimeIcon color='warning' /> },
        { status: 'On Wfh', icon: <HomeIcon color='secondary' /> },
        { status: 'On Field', icon: <DirectionsRunIcon color='primary' /> },
        { status: 'Weekend (SA/SU)', icon: <WeekendIcon color='secondary' /> }
    ]

    const handleViewEmployees = (employees: { first_name: string; last_name: string; image: string }[]) => {
        setSelectedEmployees(employees)
        setOpenModal(true)
    }

    useEffect(() => {
        // Get company_id from localStorage
        const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
        setCompanyId(userData?.company_id)

        // Debug: Ensure `userData.id` exists
        if (!userData.id) {
            console.warn("⚠️ userData.id is undefined, API won't be called!")
            return
        }

        // Fetch team_id for logged-in employee
        const fetchTeamId = async () => {
            try {
                const token = localStorage.getItem('token')

                // Debug: Ensure token exists
                if (!token) {
                    console.warn('⚠️ Token is missing, API call aborted.')
                    return
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_APP_URL}/teams/find-teams-by-employee?employee_id=${userData.id}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )

                if (response.ok) {
                    const data = await response.json()

                    if (data.length > 0) {
                        setTeamId(data[0])
                    } else {
                        console.warn('⚠️ No teams found for this employee.')
                    }
                } else {
                    console.error('❌ Failed to fetch team ID. Response not OK.')
                }
            } catch (error) {
                console.error('🚨 Error fetching team ID:', error)
            } finally {
                setLoadingTeam(false)
            }
        }

        fetchTeamId()
    }, [])

    const getDaysInMonth = (year: number, month: number): Date[] => {
        const date = new Date(year, month, 1)
        const days: Date[] = []
        while (date.getMonth() === month) {
            days.push(new Date(date)) // No need to adjust for 1-indexed days here
            date.setDate(date.getDate() + 1)
        }
        return days
    }

    const calendarDays = getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth())

    // Helper function to format date to "YYYY-MM-DD" (ensure two digits for month and day)
    const formatDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0') // Ensure two-digit month
        const day = date.getDate().toString().padStart(2, '0') // Ensure two-digit day
        return `${year}-${month}-${day}` // Returns "YYYY-MM-DD"
    }

    useEffect(() => {
        if (teamId && companyId) {
            dispatch(fetchWhoIsOffToday({ team_id: teamId, company_id: companyId }))
            dispatch(fetchNotInYetToday({ team_id: teamId, company_id: companyId }))
            dispatch(fetchAttendanceSummary({ team_id: teamId, company_id: companyId }))
            dispatch(
                fetchTeamsMemberMonthlyAttendence({
                    team_id: teamId,
                    company_id: companyId,
                    month: selectedDate.getMonth() + 1,
                    year: selectedDate.getFullYear()
                })
            )
        }
    }, [teamId, companyId, selectedDate, dispatch])

    const handleDateChange = (date: Date | null) => {
        if (date) {
            setSelectedDate(date)
            setOpenDatePicker(false) // Close date picker after selecting the date
        }
    }

    const metrics = [
        {
            title: 'Employees On Time today',
            value: attendanceSummary?.totalOnTime ?? 0,
            employees: attendanceSummary?.onTime ?? [],
            bgColor: '#E8F5E9', // Light Green
            textColor: '#2E7D32' // Dark Green
        },
        {
            title: 'Late Arrivals today',
            value: attendanceSummary?.totalLate ?? 0,
            employees: attendanceSummary?.lateArrivals ?? [],
            bgColor: '#FFF3E0', // Light Orange
            textColor: '#E65100' // Dark Orange
        },
        {
            title: 'Work from Home',
            value: attendanceSummary?.totalWFH ?? 0,
            employees: attendanceSummary?.workFromHome ?? [],
            bgColor: '#E3F2FD', // Light Blue
            textColor: '#0277BD' // Dark Blue
        }
    ]

    const getAttendanceStatusIcon = (status: string): JSX.Element => {
        switch (status) {
            case 'Present':
                return <CheckIcon color='success' /> // Green for "Present"
            case 'Absent':
                return <CloseIcon color='error' /> // Red for "Absent"
            case 'On Leave':
                return <PauseCircleOutlineIcon color='info' /> // Blue for "On Leave"
            case 'On Half':
                return <AccessTimeIcon color='warning' /> // Orange for "On Half"
            case 'On Wfh':
                return <HomeIcon color='secondary' /> // Purple for "On Wfh"
            case 'On Field':
                return <DirectionsRunIcon color='primary' /> // Blue for "On Field"
            default:
                return <Typography>No Data</Typography>
        }
    }

    return (
        <div style={{ padding: '16px', background: '#f9fafb', minHeight: '100vh' }}>
            <Typography
                style={{
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    color: 'black'
                }}
            >
                🚀 Welcome to Your 🏆 Team Members Dashboard! 🎯
            </Typography>
            <Grid container spacing={2}>
                {/* Who is off today */}
                <Grid item xs={12} sm={6}>
                    <Card style={{ backgroundColor: '#FFEBEE' }}>
                        <CardContent>
                            <Typography variant='h6' style={{ color: '#D32F2F' }}>
                                Who is off today
                            </Typography>
                            {loading ? (
                                <Typography>Loading...</Typography>
                            ) : error ? (
                                <Typography color='error'>{error}</Typography>
                            ) : offToday.length === 0 ? (
                                <Typography
                                    style={{
                                        textAlign: 'center',
                                        padding: '10px',
                                        color: '#4CAF50',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🎉 No one team members is off today. Everyone is present!
                                </Typography>
                            ) : (
                                <Grid container spacing={1}>
                                    {offToday.map(person => (
                                        <Grid item xs={4} key={person._id}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar src={person.image} style={{ marginRight: '8px' }} />
                                                <Typography>
                                                    {person.first_name} {person.last_name}
                                                </Typography>
                                            </div>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Not in yet today */}
                <Grid item xs={12} sm={6}>
                    <Card style={{ backgroundColor: '#FFF8E1' }}>
                        <CardContent>
                            <Typography variant='h6' style={{ color: '#FF9800' }}>
                                Not in yet today
                            </Typography>
                            {loading ? (
                                <Typography>Loading...</Typography>
                            ) : error ? (
                                <Typography color='error'>{error}</Typography>
                            ) : notInYet.length === 0 ? (
                                <Typography
                                    style={{
                                        textAlign: 'center',
                                        padding: '10px',
                                        color: '#4CAF50',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🎉 Your All team members have arrived today! No one is missing.
                                </Typography>
                            ) : (
                                <Grid container spacing={1}>
                                    {notInYet.map(person => (
                                        <Grid item xs={4} key={person._id}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar src={person.image} style={{ marginRight: '8px' }} />
                                                <Typography>
                                                    {person.first_name} {person.last_name}
                                                </Typography>
                                            </div>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Metrics */}
                {metrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card style={{ backgroundColor: metric.bgColor, borderRadius: '8px' }}>
                            <CardContent>
                                <Typography variant='h4' style={{ color: metric.textColor, fontWeight: 'bold' }}>
                                    {metric.value}
                                </Typography>
                                <Typography variant='subtitle2' style={{ color: metric.textColor, fontSize: '14px' }}>
                                    {metric.title}
                                </Typography>
                                <Button
                                    variant='contained'
                                    size='small'
                                    style={{ marginTop: '10px', backgroundColor: metric.textColor, color: '#fff' }}
                                    onClick={() => handleViewEmployees(metric.employees)}
                                >
                                    View Employees
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                <Dialog open={openModal} onClose={() => setOpenModal(false)}>
                    <DialogTitle>Employees List</DialogTitle>
                    <DialogContent>
                        {selectedEmployees.length > 0 ? (
                            <List>
                                {selectedEmployees.map((employee, index) => (
                                    <ListItem key={index}>
                                        <ListItemAvatar>
                                            <Avatar src={employee.image} />
                                        </ListItemAvatar>
                                        <ListItemText primary={`${employee.first_name} ${employee.last_name}`} />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>No data available</Typography>
                        )}
                    </DialogContent>
                </Dialog>
            </Grid>

            {/* Team Calendar */}
            <Card style={{ marginTop: '16px', padding: '12px' }}>
                <CardHeader
                    sx={{ backgroundColor: '#F8F0E5' }}
                    title={`Team Attendance - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                    titleTypographyProps={{ sx: { color: 'black' } }}
                    action={
                        <div>
                            <Tooltip title='Previous Month' arrow>
                                <IconButton
                                    onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                                >
                                    <ChevronLeft style={{ color: 'black', fontWeight: 'bolder', fontSize: '1.5rem' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title='Next Month' arrow>
                                <IconButton
                                    onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                                >
                                    <ChevronRight style={{ color: 'black', fontWeight: 'bolder', fontSize: '1.5rem' }} />
                                </IconButton>
                            </Tooltip>
                            <IconButton
                                onClick={() => setOpenDatePicker(true)} // Open DatePicker dialog on title click
                            >
                                <Typography style={{ fontWeight: 'bold' }} variant='body2' color='primary'>
                                    Change Date
                                </Typography>
                            </IconButton>
                        </div>
                    }
                />
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        style={{
                                            position: 'sticky',
                                            left: 0,
                                            background: '#fff',
                                            color: 'black',
                                            zIndex: 1,
                                            boxShadow: '2px 0px 5px rgba(0, 0, 0, 0.1)' // Optional: add shadow for separation
                                        }}
                                        align='center'
                                    >
                                        Team Member
                                    </TableCell>

                                    {calendarDays.map(date => (
                                        <TableCell key={date.getDate()} align='center'>
                                            <Typography variant='body2' color='textSecondary'>
                                                {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()]}
                                            </Typography>
                                            {date.getDate()}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {teamsMemberMonthlyAttendence?.map((employee, index) => (
                                    <TableRow key={index}>
                                        <TableCell
                                            style={{
                                                position: 'sticky',
                                                left: 0,
                                                background: '#fff',
                                                zIndex: 1,
                                                color: 'black',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start'
                                            }}
                                            align='center'
                                        >
                                            <Avatar style={{ width: '24px', height: '24px', marginRight: '8px' }} src={employee.image} />
                                            {employee.first_name} {employee.last_name}
                                        </TableCell>

                                        {calendarDays.map(date => {
                                            const formattedDate = formatDate(date) // Get the "YYYY-MM-DD" portion
                                            const today = new Date()
                                            today.setHours(0, 0, 0, 0) // Set time to 00:00:00 for comparison
                                            const isFutureDate = date > today // Check if the date is in the future

                                            // If it's a future date, don't show any attendance data
                                            if (isFutureDate) {
                                                return <TableCell key={`${index}-${date.getDate()}`} align='center'></TableCell>
                                            }

                                            // Get attendance data for this specific date
                                            const attendance = employee.attendance.find(att => att.date === formattedDate)

                                            // Get the day abbreviation to handle weekend logic (SA/SU)
                                            const dayAbbr = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()]

                                            return (
                                                <TableCell key={`${index}-${date.getDate()}`} align='center'>
                                                    {attendance ? (
                                                        getAttendanceStatusIcon(attendance.status)
                                                    ) : // If no attendance data for this day, show default icon for weekends (SA/SU)
                                                        dayAbbr === 'SA' || dayAbbr === 'SU' ? (
                                                            <WeekendIcon color='secondary' />
                                                        ) : (
                                                            'No Data'
                                                        )}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
            <Grid item xs={12}>
                <Card style={{ padding: '16px' }}>
                    <CardHeader title='Attendance Legend' />
                    <CardContent>
                        <Grid container spacing={2}>
                            {legendItems.map((item, index) => (
                                <Grid item xs={6} sm={3} key={index}>
                                    <Grid container alignItems='center'>
                                        <Grid item>{item.icon}</Grid>
                                        <Grid item>
                                            <Typography variant='body2' style={{ color: '#757575', marginLeft: '8px' }}>
                                                {item.status}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
            <Dialog open={openDatePicker} onClose={() => setOpenDatePicker(false)}>
                <DialogTitle>Select Date</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label='Select Month'
                            value={selectedDate}
                            onChange={handleDateChange}
                            views={['year', 'month']}
                            renderInput={params => <TextField {...params} fullWidth />}
                        />
                    </LocalizationProvider>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TeamDashboard
