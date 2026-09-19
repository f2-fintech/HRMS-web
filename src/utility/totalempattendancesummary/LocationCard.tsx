import { Avatar, Box, createTheme, Divider, Grid, Paper, Typography, useTheme } from '@mui/material'

import {
    Person as PersonIcon,
    EventBusy as AbsentIcon,
    EventAvailable as PresentIcon,
    BeachAccess as LeaveIcon,
    AccessTime as HalfDayIcon,
    LocationOn as LocationIcon,
    DirectionsRun as OnFieldIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import HomeIcon from '@mui/icons-material/Home'

const theme = createTheme({
    palette: {
        primary: {
            main: '#3f51b5'
        },
        secondary: {
            main: '#f50057'
        },
        background: {
            default: '#f0f2f5',
            paper: '#ffffff'
        },
        text: {
            primary: '#333333',
            secondary: '#666666'
        }
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
            fontSize: '2rem'
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.5rem'
        },
        h6: {
            fontWeight: 500,
            fontSize: '1.25rem'
        }
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    borderRadius: '12px'
                }
            }
        }
    }
})

const StatusCard: React.FC<{ count: number; status: string; employees: string[]; onClick: () => void }> = ({
    count,
    status,
    employees,
    onClick
}) => {
    const theme = useTheme()

    const getStatusInfo = () => {
        switch (status) {
            case 'Present':
                return {
                    icon: <PresentIcon />,
                    color: theme.palette.success.main,
                    backgroundColor: theme.palette.success.light
                }
            case 'Absent':
                return { icon: <AbsentIcon />, color: theme.palette.error.main, backgroundColor: theme.palette.error.light }
            case 'On_Leave':
                return { icon: <LeaveIcon />, color: theme.palette.warning.main, backgroundColor: theme.palette.warning.light }
            case 'On_Half':
                return { icon: <HalfDayIcon />, color: theme.palette.info.main, backgroundColor: theme.palette.info.light }
            case 'On_Field':
                return {
                    icon: <OnFieldIcon />,
                    color: theme.palette.primary.main,
                    backgroundColor: theme.palette.primary.light
                }
            case 'On_Wfh': // New status
                return {
                    icon: <HomeIcon />,
                    color: theme.palette.secondary.main,
                    backgroundColor: theme.palette.secondary.light
                }
            default:
                return { icon: <PersonIcon />, color: theme.palette.grey[500], backgroundColor: theme.palette.grey[200] }
        }
    }

    const { icon, color, backgroundColor } = getStatusInfo()

    return (
        <Paper
            elevation={3}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor,
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 12px rgba(0,0,0,0.15)'
                },
                cursor: 'pointer'
            }}
            onClick={onClick}
        >
            <Avatar sx={{ bgcolor: color, width: 56, height: 56, mb: 2 }}>{icon}</Avatar>
            <Typography variant='h5' sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                {count}
            </Typography>
            <Typography variant='body2' sx={{ color: 'white', textAlign: 'center' }}>
                {status.replace('_', ' ').trim()}
            </Typography>
        </Paper>
    )
}

const LocationCard = ({ location, data, handleStatusClick }) => {
    return (
        <Grid item xs={12} key={location}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
                    <Box display='flex' alignItems='center'>
                        <LocationIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        <Typography
                            variant='h6'
                            color='primary'
                            sx={{
                                textTransform: 'uppercase',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '150px'
                            }}
                        >
                            {data._id}
                        </Typography>
                    </Box>
                    {/* Display Today's Total Employees Count */}
                    <Typography variant='subtitle1' color='text.secondary'>
                        Today's Count: {data.totalEmployeesToday}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    {/* Iterate over each status */}
                    {Object.entries(data).map(([status, count]) => {
                        if (status === 'totalEmployeesToday' || status === '_id') return null
                        return (
                            <Grid item xs={12} sm={2} key={status}>
                                <StatusCard
                                    count={count}
                                    status={status}
                                    employees={[]}
                                    onClick={() => handleStatusClick(status.replace('_', ' ').trim(), data._id)}
                                />
                            </Grid>
                        )
                    })}
                </Grid>
            </Paper>
        </Grid>
    )
}

export default LocationCard
