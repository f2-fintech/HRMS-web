'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Grid,
    Stack,
    Divider,
    Paper,
    styled,
    CircularProgress
} from '@mui/material';
import { DateCalendar, PickersDayProps } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarToday, Warning } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import GrassIcon from '@mui/icons-material/Grass';
import ServerDay from '@/components/attendance/ServerDay';
import Legend from '@/components/attendance/Legend';

/* ─── Styled ─── */
const StyledCalendar = styled(DateCalendar)(({ theme }) => ({
    width: '100%',
    margin: '0 auto',
    '& .MuiPickersCalendarHeader-root': {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(2),
        '& .MuiPickersCalendarHeader-label': { fontWeight: 600 },
    },
    '& .MuiDayCalendar-weekDayLabel': {
        color: theme.palette.text.secondary,
        fontWeight: 600,
    },
    '& .MuiPickersDay-root': {
        width: 38,
        height: 38,
        fontSize: '0.85rem',
    },
}));

const AttendanceItem = styled(Box)(({ theme }) => ({
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    boxShadow: theme.shadows[3],
    transition: 'box-shadow 0.3s ease',
    '&:hover': { boxShadow: theme.shadows[6] },
}));

const AccentBar = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status: string }>(({ theme, status }) => {
    const colorMap: Record<string, string> = {
        present: theme.palette.success.main,
        absent: theme.palette.error.main,
        'on half': theme.palette.warning.main,
        'on field': theme.palette.info.main,
        'on wfh': theme.palette.secondary.main,
        'on leave': '#FFD65A',
    };
    return {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '80px',
        height: '4px',
        borderTopRightRadius: theme.shape.borderRadius,
        backgroundColor: colorMap[status.toLowerCase()] ?? theme.palette.grey[500],
    };
});

const StatusBadge = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status: string }>(({ theme, status }) => {
    const colorMap: Record<string, string> = {
        present: theme.palette.success.main,
        absent: theme.palette.error.main,
        'on half': theme.palette.warning.main,
        'on field': theme.palette.info.main,
        'on wfh': theme.palette.secondary.main,
        'on leave': '#FFD65A',
    };
    return {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        padding: theme.spacing(0.5, 1.5),
        borderRadius: '100px',
        color: colorMap[status.toLowerCase()] ?? theme.palette.grey[500],
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'capitalize',
    };
});

/* ─── Helper: status icon ─── */
function StatusIcon({ status }: { status: string }) {
    const s = status.toLowerCase();
    if (s === 'present') return <TaskAltIcon sx={{ fontSize: '1rem' }} />;
    if (s === 'on half') return <HourglassBottomIcon sx={{ fontSize: '1rem' }} />;
    if (s === 'absent') return <HolidayVillageIcon sx={{ fontSize: '1rem' }} />;
    if (s === 'on leave') return <HomeIcon sx={{ fontSize: '1rem' }} />;
    if (s === 'on wfh') return <ApartmentIcon sx={{ fontSize: '1rem' }} />;
    if (s === 'on field') return <GrassIcon sx={{ fontSize: '1rem' }} />;
    return <Warning sx={{ fontSize: '1rem' }} />;
}

/* ─── Main Component ─── */
interface ProfileAttendanceProps {
    profileId: string;
    employeeName?: string; // optional – will fetch from API if not provided
}

const ProfileAttendance = ({ profileId, employeeName }: ProfileAttendanceProps) => {
    const today = new Date().toISOString().split('T')[0];

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
    const [attLoading, setAttLoading] = useState(false);
    const [breaksToday, setBreaksToday] = useState<any[]>([]);
    const [breaksLoading, setBreaksLoading] = useState(false);
    const [empName, setEmpName] = useState<string>(employeeName || '');

    /* fetch employee name if not provided */
    useEffect(() => {
        if (employeeName || !profileId) return;
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${profileId}`)
            .then(r => r.json())
            .then(d => {
                if (d?.first_name) setEmpName(`${d.first_name} ${d.last_name || ''}`.trim());
            })
            .catch(() => {});
    }, [profileId, employeeName]);

    /* fetch monthly attendance for calendar */
    useEffect(() => {
        if (!profileId) return;
        setAttLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/attendence/employee/${profileId}/${year}/${month}`,
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        )
            .then(r => r.json())
            .then((list: any[]) => {
                if (!Array.isArray(list)) { setAttendanceData({}); return; }
                const map: Record<string, string> = {};
                list.forEach(({ date, status }) => { if (date && status) map[date] = status; });
                setAttendanceData(map);
            })
            .catch(() => setAttendanceData({}))
            .finally(() => setAttLoading(false));
    }, [profileId, month, year]);

    /* fetch all breaks for this employee and filter today */
    useEffect(() => {
        if (!profileId) return;
        setBreaksLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
        const company_id = user?.company_id || '';
        fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/breaksheet/employee?employeeId=${profileId}`,
            { headers: { Authorization: `Bearer ${token} ${company_id}`, 'Content-Type': 'application/json' } }
        )
            .then(r => r.json())
            .then((data: any[]) => {
                if (!Array.isArray(data)) { setBreaksToday([]); return; }
                setBreaksToday(data.filter(b => b.date === today));
            })
            .catch(() => setBreaksToday([]))
            .finally(() => setBreaksLoading(false));
    }, [profileId, today]);

    /* attendance status list filtered to selected month */
    const filteredAttList = useMemo(() => {
        return Object.entries(attendanceData)
            .filter(([date]) => {
                const m = new Date(date).getMonth() + 1;
                return m === month;
            })
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    }, [attendanceData, month]);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const handleMonthChange = (date: Dayjs) => {
        setMonth(date.month() + 1);
        setYear(date.year());
    };

    return (
        <Box>
            <Typography variant="h5" mb={1} color="primary" fontWeight="bold">
                Attendance &amp; Breaks
            </Typography>
            {empName && (
                <Typography variant="subtitle1" color="text.secondary" mb={2}>
                    Employee: <strong>{empName}</strong>
                </Typography>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* ── Calendar + Status List ── */}
            <Grid container spacing={3}>
                {/* Left: Calendar + Legend */}
                <Grid item xs={12} md={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarToday fontSize="small" color="primary" />
                                    <Box component="span">Attendance Calendar</Box>
                                </Box>
                            }
                        />
                        <CardContent sx={{ p: 1 }}>
                            {attLoading ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <StyledCalendar
                                        defaultValue={dayjs()}
                                        onMonthChange={handleMonthChange}
                                        slots={{
                                            day: (props) => (
                                                <ServerDay {...props} attendanceData={attendanceData} />
                                            ),
                                        }}
                                        slotProps={{
                                            day: {} as PickersDayProps<Dayjs>,
                                        }}
                                    />
                                </LocalizationProvider>
                            )}
                        </CardContent>
                    </Card>
                    <Box mt={2}>
                        <Legend />
                    </Box>
                </Grid>

                {/* Right: Day-wise status list */}
                <Grid item xs={12} md={8}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardHeader
                            title={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarToday sx={{ mr: 1 }} fontSize="small" />
                                    <Typography variant="h6" component="span">
                                        Attendance Status — {dayjs(new Date(year, month - 1)).format('MMMM YYYY')}
                                    </Typography>
                                </Box>
                            }
                        />
                        <CardContent>
                            {attLoading ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : filteredAttList.length > 0 ? (
                                <Grid container spacing={2}>
                                    {filteredAttList.map(([date, status]) => (
                                        <Grid item xs={12} sm={6} md={4} key={date}>
                                            <AttendanceItem>
                                                <AccentBar status={status} />
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {formatDate(date)}
                                                    </Typography>
                                                    <StatusBadge status={status}>
                                                        <StatusIcon status={status} />
                                                        {status}
                                                    </StatusBadge>
                                                </Box>
                                            </AttendanceItem>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <Typography variant="body1" color="text.secondary">
                                        No attendance data for this month.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Today's Breaks ── */}
            <Box mt={4}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary">
                    Today's Breaks — {today}
                </Typography>

                {breaksLoading ? (
                    <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress />
                    </Box>
                ) : breaksToday.length > 0 ? (
                    <Grid container spacing={2}>
                        {breaksToday.map((b, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Card
                                    elevation={2}
                                    sx={{
                                        borderRadius: 2,
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)' },
                                        ...(b.endTime === '' && {
                                            animation: 'pulse 1.8s infinite',
                                            '@keyframes pulse': {
                                                '0%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.4)' },
                                                '70%': { boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)' },
                                                '100%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)' },
                                            },
                                        }),
                                    }}
                                >
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Chip
                                                label={b.type || 'Break'}
                                                color="primary"
                                                variant="outlined"
                                                sx={{ borderRadius: 2 }}
                                            />
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Start: {b.startTime}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    End: {b.endTime || 'In Progress'}
                                                </Typography>
                                                <Typography variant="body1" color="primary.main" fontWeight="bold">
                                                    Duration: {b.duration || '—'}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="body1" color="text.secondary">
                            No breaks recorded for today.
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default ProfileAttendance;
