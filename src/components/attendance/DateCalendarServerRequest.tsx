import { Box } from '@mui/material';
import { DateCalendar, PickersDayProps } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { useEffect, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import ServerDay from './ServerDay';

import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchEmployeeAttendances } from '@/redux/features/attendances/attendancesSlice';
import AttendanceStatusList from './AttendanceStatusList';

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

interface DateCalendarServerRequestProps {
    attendanceData: any;
    onMonthChange: (date: Dayjs) => void;
    month: number
}

export default function DateCalendarServerRequest({ attendanceData, month, onMonthChange }: DateCalendarServerRequestProps) {
    const requestAbortController = useRef<AbortController | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
    // const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [userId, setUserId] = useState<string>('');

    const dispatch: AppDispatch = useDispatch();

    console.log("userId", userId);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')

        // setUserRole(user.role)
        setUserId(user.id)
    }, [userId]);

    useEffect(() => {
        if (userId) {
            dispatch(fetchEmployeeAttendances({ employeeId: userId, month: month.toString() }))
        }
    }, [dispatch, month, userId])

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
        <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                    defaultValue={dayjs()}
                    loading={isLoading}
                    onMonthChange={handleMonthChange}
                    renderLoading={() => <DayCalendarSkeleton />}
                    slots={{
                        day: (props) => <ServerDay {...props} attendanceData={attendanceData} />,
                    }}
                    slotProps={{
                        day: { highlightedDays } as PickersDayProps<Dayjs>,
                    }}
                />
            </LocalizationProvider>
        </Box>
    );
}
