import { Box, Grid, Typography, Card, CardHeader, CardContent, styled } from '@mui/material';
import { CalendarToday, Warning } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import GrassIcon from '@mui/icons-material/Grass';

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
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    boxShadow: theme.shadows[4],
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
        boxShadow: theme.shadows[8],
    }
}));

const AccentBar = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status: string }>(({ theme, status }) => {
    const getAccentColor = (status: string) => {
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
            case 'on leave':
                return '#FFD65A';
            default:
                return theme.palette.grey[500];
        }
    };

    return {
        position: 'absolute',
        top: 0,
        right: 0,
        width: '96px',
        height: '4px',
        borderTopRightRadius: theme.shape.borderRadius,
        backgroundColor: getAccentColor(status),
    };
}
)

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
            case 'on leave':
                return '#FFD65A';
            default:
                return theme.palette.grey[500];
        }
    };

    return {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        padding: theme.spacing(0.5, 1.5),
        borderRadius: '100px',
        backgroundColor: 'transparent',
        color: getStatusColor(status),
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'capitalize'
    };
});

const ContentContainer = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
}));

const InfoContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1)
}));

interface AttendanceStatusListProps {
    attendanceData: Record<string, string>;
    selectedMonth: number;
}

export default function AttendanceStatusList({
    attendanceData,
    selectedMonth
}: AttendanceStatusListProps) {
    const filteredData = Object.entries(attendanceData)
        .filter(([date]) => {
            const month = new Date(date).getMonth() + 1;


            return month === selectedMonth;
        })
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());

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
                <Grid container spacing={3}>
                    {filteredData.length > 0 ? (
                        filteredData.map(([date, status]) => (
                            <Grid item xs={12} md={4} key={date}>
                                <AttendanceItem>
                                    <AccentBar status={status} />
                                    <ContentContainer>
                                        <InfoContainer>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                                {formatDate(date)}
                                            </Typography>
                                        </InfoContainer>
                                        <StatusBadge status={status}>
                                            {status.toLowerCase() === 'present' ? (
                                                <TaskAltIcon sx={{ fontSize: '1rem' }} />
                                            ) : status.toLowerCase() === 'on half' ? (
                                                <HourglassBottomIcon sx={{ fontSize: '1rem' }} />
                                            ) : status.toLowerCase() === 'absent' ? (
                                                <HolidayVillageIcon sx={{ fontSize: '1rem' }} />
                                            ) : status.toLowerCase() === 'on leave' ? (
                                                <HomeIcon sx={{ fontSize: '1rem' }} />
                                            ) : status.toLowerCase() === 'on wfh' ? (
                                                <ApartmentIcon sx={{ fontSize: '1rem' }} />
                                            ) : status.toLowerCase() === 'on field' ? (
                                                <GrassIcon sx={{ fontSize: '1rem' }} />
                                            ) : (
                                                <Warning sx={{ fontSize: '1rem' }} />
                                            )}
                                            {status}
                                        </StatusBadge>


                                    </ContentContainer>
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

