import { Box, Grid, Typography } from '@mui/material';
import dayjs from 'dayjs';

interface AttendanceStatusListProps {
    attendanceData: any;
    selectedMonth: number;
}

export default function AttendanceStatusList({ attendanceData, selectedMonth }: AttendanceStatusListProps) {
    const filteredData = Object.entries(attendanceData).filter(([date]) => {
        const month = dayjs(date).month() + 1;
        return month === selectedMonth;
    });

    return (
        <Box sx={{ ml: 20 }}>
            <Typography variant="h5" gutterBottom>
                Attendance Status
            </Typography>
            <Grid container spacing={2}>
                {filteredData.length > 0 ? (
                    filteredData.map(([date, status]) => (
                        <Grid item xs={12} sm={6} key={date}>
                            <Box display="flex" justifyContent="flex-start" alignItems="center">
                                <Typography sx={{ width: '50%' }}>{date}</Typography>
                                <Typography>{status}</Typography>
                            </Box>
                        </Grid>
                    ))
                ) : (
                    <Grid item xs={12}>
                        <Typography>No attendance data available for this month.</Typography>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}
