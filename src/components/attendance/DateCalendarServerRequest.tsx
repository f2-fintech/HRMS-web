import { Box, Card, CardContent, CardHeader, styled } from '@mui/material';
import { DateCalendar, PickersDayProps } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import ServerDay from './ServerDay';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchEmployeeAttendances } from '@/redux/features/attendances/attendancesSlice';
import { fetchHolidays } from '@/redux/features/holidays/holidaysSlice';
import { CalendarToday } from '@mui/icons-material';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    '& .MuiCardHeader-root': {
        borderBottom: `1px solid ${theme.palette.divider}`,
        paddingBottom: theme.spacing(2),
    },
    '& .MuiCardContent-root': {
        padding: theme.spacing(2),
        '&:last-child': {
            paddingBottom: theme.spacing(2),
        }
    }
}));

const StyledCalendar = styled(DateCalendar)(({ theme }) => ({
    width: '100%',
    // maxWidth: '360px',
    margin: '0 auto',
    '& .MuiPickersCalendarHeader-root': {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(2),
        '& .MuiPickersCalendarHeader-label': {
            fontWeight: 600,
        },
    },
    '& .MuiDayCalendar-weekDayLabel': {
        color: theme.palette.text.secondary,
        fontWeight: 600,
    },
    '& .MuiPickersDay-root': {
        width: 40,
        height: 40,
        fontSize: '0.875rem',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
        '&.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
            },
        },
    },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    '& .MuiDayCalendarSkeleton-root': {
        backgroundColor: 'transparent',
    },
}));

interface DateCalendarServerRequestProps {
    attendanceData: any;
    onMonthChange: (date: Dayjs) => void;
    month: number;
    year: number;
}


function getRandomNumber(min: number, max: number) {
    return Math.round(Math.random() * (max - min) + min);
}

function fakeFetch(date: Dayjs, { signal }: { signal: AbortSignal }) {
    return new Promise<{ daysToHighlight: number[] }>((resolve, reject) => {
        const timeout = setTimeout(() => {
            const daysInMonth = date.daysInMonth();
            const daysToHighlight = [1, 2, 3].map(() => getRandomNumber(1, daysInMonth));
            resolve({ daysToHighlight });
        }, 500);

        signal.onabort = () => {
            clearTimeout(timeout);
            reject(new DOMException('aborted', 'AbortError'));
        };
    });
}

export default function DateCalendarServerRequest({
    month,
    year,
    onMonthChange
}: DateCalendarServerRequestProps) {
    const requestAbortController = useRef<AbortController | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
    const [userId, setUserId] = useState<string>('');

    const dispatch: AppDispatch = useDispatch();

    const { filteredAttendance, loading } = useSelector((state: RootState) => state.attendances);

    const { holidays } = useSelector((state: RootState) => state.holidays);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserId(user.id);
    }, []);

    useEffect(() => {
        if (userId) {
            dispatch(fetchEmployeeAttendances({
                employeeId: userId,
                year: year.toString(),
                month: month.toString(),
            }));
        }
    }, [dispatch, month, year, userId]);

    useEffect(() => {
        dispatch(fetchHolidays({ page: 1, limit: 500, keyword: '' }));
    }, [dispatch, year]);

    const holidayDatesSet = useMemo(() => {
        const set = new Set<string>();

        (holidays || []).forEach((h: any) => {
            if (!h?.start_date) return;

            const start = new Date(h.start_date);
            const end = h.end_date ? new Date(h.end_date) : new Date(h.start_date);

            if (isNaN(start.getTime())) return;

            const cur = new Date(start);
            const safeEnd = isNaN(end.getTime()) ? start : end;

            while (cur <= safeEnd) {
                const y = cur.getFullYear();
                const m = String(cur.getMonth() + 1).padStart(2, '0');
                const d = String(cur.getDate()).padStart(2, '0');

                set.add(`${y}-${m}-${d}`);
                cur.setDate(cur.getDate() + 1);
            }
        });

        return set;
    }, [holidays]);

 
    const attendanceData = useMemo(() => {
        return filteredAttendance.reduce((acc, { date, status }) => {
            const isFestival = status === 'On Leave' && holidayDatesSet.has(date);

            acc[date] = {
                status,
                type: isFestival ? 'Festival' : undefined
            };

            return acc;
        }, {} as Record<string, { status: string; type?: string }>);
    }, [filteredAttendance, holidayDatesSet]);

    const fetchHighlightedDays = (date: Dayjs) => {
        const controller = new AbortController();
        fakeFetch(date, { signal: controller.signal })
            .then(({ daysToHighlight }) => {
                setHighlightedDays(daysToHighlight);
                setIsLoading(false);
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    throw error;
                }
            });

        requestAbortController.current = controller;
    };

    useEffect(() => {
        fetchHighlightedDays(dayjs());
        return () => requestAbortController.current?.abort();
    }, []);

    const handleMonthChange = (date: Dayjs) => {
        if (requestAbortController.current) {
            requestAbortController.current.abort();
        }

        setIsLoading(true);
        setHighlightedDays([]);
        fetchHighlightedDays(date);
        onMonthChange(date);
    };

    return (
        <StyledCard elevation={1}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="primary" />
                        <Box component="span">Attendance Calendar</Box>
                    </Box>
                }
            />
            <CardContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <StyledCalendar
                        defaultValue={dayjs()}
                        loading={isLoading}
                        onMonthChange={handleMonthChange}
                        renderLoading={() => (
                            <LoadingContainer>
                                <DayCalendarSkeleton />
                            </LoadingContainer>
                        )}
                        slots={{
                            day: (props) => (
                                <ServerDay
                                    {...props}
                                    attendanceData={attendanceData}
                                />
                            ),
                        }}
                        slotProps={{
                            day: {
                                highlightedDays
                            } as PickersDayProps<Dayjs>,
                        }}
                    />
                </LocalizationProvider>
            </CardContent>
        </StyledCard>
    );
}
