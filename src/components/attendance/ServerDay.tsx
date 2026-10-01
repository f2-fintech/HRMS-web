import { PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { Box } from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import dayjs, { Dayjs } from 'dayjs';

interface ServerDayProps extends PickersDayProps<Dayjs> {
    highlightedDays?: number[];
    attendanceData?: any;
}

function getLastSundayOfMonth(month: number, year: number): number {
    const lastDayOfMonth = new Date(year, month, 0);
    const dayOfWeek = lastDayOfMonth.getDay();
    return lastDayOfMonth.getDate() - dayOfWeek;
}

export default function ServerDay(props: ServerDayProps) {
    const { highlightedDays = [], day, outsideCurrentMonth, attendanceData, ...other } = props;

   
    const entry = attendanceData?.[day.format('YYYY-MM-DD')] || {};
    const attendanceStatus = typeof entry === 'string' ? entry : entry.status || '';
    const leaveType = typeof entry === 'string' ? '' : entry.type || '';

    const isSunday = day.day() === 0;
    const lastSunday = getLastSundayOfMonth(day.month() + 1, day.year());
    const isLastSunday = day.date() === lastSunday && isSunday;

    const isFestival = attendanceStatus === 'On Leave' && leaveType === 'Festival';

    let backgroundColor;
    let color;

    if (attendanceStatus === 'Present') {
        backgroundColor = 'green';
        color = 'white';
    } else if (attendanceStatus === 'Absent') {
        backgroundColor = 'red';
        color = 'white';
    } else if (isFestival) {
       
        backgroundColor = '#e65100';
        color = 'white';
    } else if (attendanceStatus === 'On Leave') {
        backgroundColor = 'yellow';
        color = 'black';
    } else if (attendanceStatus === 'On Half') {
        backgroundColor = '#b7a53a';
        color = 'white';
    } else if (attendanceStatus === 'On Field') {
        backgroundColor = '#110720';
        color = 'white';
    } else if (attendanceStatus === 'On Wfh') {
        backgroundColor = 'rgb(247, 51, 120)';
        color = 'white';
    } else if (isSunday && !isLastSunday) {
        backgroundColor = 'purple';
        color = 'white';
    }

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <PickersDay
                {...other}
                outsideCurrentMonth={outsideCurrentMonth}
                day={day}
                sx={{
                    backgroundColor: backgroundColor ? `${backgroundColor} !important` : 'inherit',
                    color: color ? `${color} !important` : 'inherit',
                    fontSize: '1em'
                }}
            />
            {isFestival && (
                <CelebrationIcon
                    sx={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        fontSize: '0.9rem',
                        color: '#fff',
                        backgroundColor: '#e65100',
                        borderRadius: '50%',
                        padding: '2px',
                        pointerEvents: 'none'
                    }}
                />
            )}
        </Box>
    );
}
