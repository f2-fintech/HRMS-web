import { Box, Grid, Typography, Card, CardHeader, CardContent, styled } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import dayjs from 'dayjs';

interface AttendanceStatusListProps {
    attendanceData: any;
    selectedMonth: number;
}

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    maxWidth: '1000px',
    margin: '0 auto',
    boxShadow: theme.shadows[2]
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiCardHeader-title': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    }
}));

const AttendanceItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    }
}));

const StatusBadge = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status: string }>(({ theme, status }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return theme.palette.success.main;
            case 'absent':
                return theme.palette.error.main;
            case 'late':
                return theme.palette.warning.main;
            default:
                return theme.palette.grey[500];
        }
    };

    return {
        padding: theme.spacing(0.5, 1.5),
        borderRadius: theme.shape.borderRadius,
        backgroundColor: getStatusColor(status),
        color: theme.palette.common.white,
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'capitalize'
    };
});

export default function AttendanceStatusList({
    attendanceData,
    selectedMonth
}: AttendanceStatusListProps) {
    const filteredData = Object.entries(attendanceData).filter(([date]) => {
        const month = dayjs(date).month() + 1;
        return month === selectedMonth;
    });

    const formatDate = (dateStr: string) => {
        return dayjs(dateStr).format('MMM DD, YYYY');
    };

    return (
        <StyledCard>
            <StyledCardHeader
                title={
                    <Box>
                        <CalendarToday sx={{ mr: 1 }} />
                        <Typography variant="h6" component="span">
                            Attendance Status
                        </Typography>
                    </Box>
                }
            />
            <CardContent>
                <Grid container spacing={2}>
                    {filteredData.length > 0 ? (
                        filteredData.map(([date, status]) => (
                            <Grid item xs={12} md={6} key={date}>
                                <AttendanceItem>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatDate(date)}
                                    </Typography>
                                    <StatusBadge status={status as string}>
                                        {status}
                                    </StatusBadge>
                                </AttendanceItem>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                py={4}
                            >
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                >
                                    No attendance data available for this month.
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </StyledCard>
    );
}
