import { Box, Grid, Typography, Card, CardHeader, CardContent, styled } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    maxWidth: '1000px',
    margin: '0 auto',
    marginLeft: '4rem',
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
            case 'on half':
                return theme.palette.warning.main;
            case 'on field':
                return theme.palette.info.main;
            case 'on wfh':
                return theme.palette.secondary.main;
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

interface AttendanceStatusListProps {
    attendanceData: Record<string, string>;
    selectedMonth: number;
}

export default function AttendanceStatusList({
    attendanceData,
    selectedMonth
}: AttendanceStatusListProps) {
    const filteredData = Object.entries(attendanceData).filter(([date]) => {
        const month = new Date(date).getMonth() + 1;
        return month === selectedMonth;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <StyledCard>
            <StyledCardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                            <Grid item xs={12} md={4} key={date}>
                                <AttendanceItem>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatDate(date)}
                                    </Typography>
                                    <StatusBadge status={status}>
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
