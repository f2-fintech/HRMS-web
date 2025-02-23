import React, { useState } from 'react';

import {
    Box,
    Card,
    CardContent,
    Avatar,
    Typography,
    Grid,
    Paper,
    Button,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    PauseCircleOutline as PauseCircleOutlineIcon,
    DirectionsRun as DirectionsRunIcon,
    Home as HomeIcon,
    Contrast as ContrastIcon,
    CalendarMonth as CalendarMonthIcon,
    Weekend as WeekendIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import useRouterWithMount from '@/utility/useRouterWithMount';

const AttendanceCard = ({
    employeeData,
    handleAttendanceAddClick,
    handleAttendanceEditClick,
    selectedMonth,
    selectedYear
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const totalCounts = employeeData.statusCount || {};
    const daysData = employeeData.days || {};

    // Get current date info if not provided through props
    const currentDate = new Date();
    const month = selectedMonth || currentDate.getMonth() + 1;
    const year = selectedYear || currentDate.getFullYear();

    const { navigateToProfile } = useRouterWithMount()

    // Helper function to get days in month
    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };

    // Helper function to check if a date is in the future
    const isFutureDate = (day) => {
        const dateToCheck = new Date(year, month - 1, day);
        const today = new Date();


        // Reset time part for accurate date comparison
        today.setHours(0, 0, 0, 0);
        dateToCheck.setHours(0, 0, 0, 0);

        return dateToCheck > today;
    };

    // Get actual number of days in the selected month
    const daysInMonth = getDaysInMonth(month, year);


    const getStatusColor = (status) => {
        switch (status) {
            case 'Present':
                return {
                    bg: '#e8f5e9',
                    text: '#2e7d32',
                    icon: <CheckCircleIcon color="success" />
                };
            case 'Absent':
                return {
                    bg: '#ffebee',
                    text: '#c62828',
                    icon: <CancelIcon color="error" />
                };
            case 'On Leave':
                return {
                    bg: '#fff3e0',
                    text: '#ef6c00',
                    icon: <PauseCircleOutlineIcon sx={{ color: '#ef6c00' }} />
                };
            case 'On Field':
                return {
                    bg: '#ede7f6',
                    text: '#4527a0',
                    icon: <DirectionsRunIcon sx={{ color: '#4527a0' }} />
                };
            case 'On Wfh':
                return {
                    bg: '#fce4ec',
                    text: '#c2185b',
                    icon: <HomeIcon sx={{ color: '#c2185b' }} />
                };
            case 'On Half':
                return {
                    bg: '#e3f2fd',
                    text: '#1565c0',
                    icon: <ContrastIcon sx={{ color: '#1565c0' }} />
                };
            default:
                return {
                    bg: '#f5f5f5',
                    text: '#9e9e9e',
                    icon: null
                };
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthName = monthNames[month - 1];

    const statusCounts = {
        Present: totalCounts.Present || 0,
        Absent: totalCounts.Absent || 0,
        'On Leave': totalCounts['On Leave'] || 0,
        'On Field': totalCounts['On Field'] || 0,
        'On Wfh': totalCounts['On Wfh'] || 0,
        'On Half': totalCounts['On Half'] || 0
    };

    return (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
                {/* Employee Header with Status Button */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Tooltip title="View Profile" arrow>
                        <Avatar
                            src={employeeData.image || ''}
                            sx={{ width: 56, height: 56, mr: 2, cursor: 'pointer' }} // Added cursor pointer
                            onClick={() => navigateToProfile(employeeData?._id)} // Navigate to the profile when clicked
                        />
                    </Tooltip>


                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h5" component="div">
                            {employeeData.name}
                        </Typography>
                    </Box>

                    <Box sx={{ ml: 3, display: 'flex', gap: 5 }}>
                        <Tooltip title="Present">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckCircleIcon color="success" sx={{ mr: 0.5 }} />
                                <Typography variant="body2">Present</Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="Absent">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CancelIcon color="error" sx={{ mr: 0.5 }} />
                                <Typography variant="body2">Absent</Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="On Leave">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PauseCircleOutlineIcon sx={{ color: '#ef6c00', mr: 0.5 }} />
                                <Typography variant="body2">On Leave</Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="On Field">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <DirectionsRunIcon sx={{ color: '#4527a0', mr: 0.5 }} />
                                <Typography variant="body2">On Field</Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="Work from Home">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <HomeIcon sx={{ color: '#c2185b', mr: 0.5 }} />
                                <Typography variant="body2">Wfh</Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="On Half">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ContrastIcon sx={{ color: '#1565c0', mr: 0.5 }} />
                                <Typography variant="body2">Half</Typography>
                            </Box>
                        </Tooltip>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleClick}
                        startIcon={<AssessmentIcon />}
                        sx={{ ml: 2 }}
                    >
                        View  Monthly Status
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        PaperProps={{
                            sx: {
                                width: '250px',
                                p: 1
                            }
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 'bold' }}>
                            Attendance Summary
                        </Typography>
                        {Object.entries(statusCounts).map(([status, count]) => {
                            const statusStyle = getStatusColor(status);


                            return (
                                <MenuItem
                                    key={status}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        my: 0.5,
                                        borderRadius: 1,
                                        '&:hover': {
                                            bgcolor: statusStyle.bg
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {statusStyle.icon}
                                        <Typography sx={{ color: statusStyle.text }}>
                                            {status}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        sx={{
                                            color: statusStyle.text,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {count}
                                    </Typography>
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </Box>

                {/* Calendar Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarMonthIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                        {monthName} {year} Attendance
                    </Typography>
                </Box>

                {/* Calendar Grid */}
                <Grid container spacing={1}>
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Grid item xs={12 / 7} key={day}>
                            <Typography align="center" variant="body2" sx={{ fontWeight: 'bold' }}>
                                {day}
                            </Typography>
                        </Grid>
                    ))}

                    {/* Empty cells for proper day alignment */}
                    {Array.from({ length: new Date(year, month - 1, 1).getDay() }, (_, index) => (
                        <Grid item xs={12 / 7} key={`empty-${index}`}>
                            <Paper sx={{ bgcolor: '#f5f5f5', p: 1, minHeight: '50px' }} />
                        </Grid>
                    ))}

                    {/* Calendar days */}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dayKey = `day_${day}`;
                        const dayData = daysData[dayKey];
                        const specificDate = new Date(year, month - 1, day);
                        const isSunday = specificDate.getDay() === 0;
                        const isInFuture = isFutureDate(day);

                        let content;
                        let bgColor = '#fff';

                        if (dayData) {
                            const statusStyle = getStatusColor(dayData.status);

                            content = statusStyle.icon;
                            bgColor = statusStyle.bg;
                        } else if (isSunday) {
                            content = <WeekendIcon color="primary" />;
                            bgColor = '#f5f5f5';
                        } else if (isInFuture) {
                            content = <Typography variant="body2" color="text.disabled">-</Typography>;
                            bgColor = '#f5f5f5';
                        } else {
                            content = (
                                <Typography variant="body2" color="primary">
                                    Mark
                                </Typography>
                            );
                        }

                        return (
                            <Grid item xs={12 / 7} key={day}>
                                <Paper
                                    sx={{
                                        bgcolor: bgColor,
                                        p: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        cursor: isInFuture ? 'default' : 'pointer',
                                        '&:hover': { opacity: isInFuture ? 1 : 0.8 },
                                        minHeight: '50px',
                                        justifyContent: 'center'
                                    }}
                                    onClick={() => {
                                        if (!isInFuture) {
                                            if (dayData) {
                                                handleAttendanceEditClick(dayData._id);
                                            } else {
                                                handleAttendanceAddClick(
                                                    employeeData.employee_id,
                                                    employeeData.name,
                                                    day
                                                );
                                            }
                                        }
                                    }}
                                >
                                    <Typography variant="caption" display="block" sx={{ color: 'black' }}>
                                        {day}
                                    </Typography>
                                    {content}
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default AttendanceCard;
