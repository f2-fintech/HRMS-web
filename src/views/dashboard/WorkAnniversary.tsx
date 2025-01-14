import React, { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Box,
    Grid,
    Alert
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

import { fetchWorkAnniversaries } from '@/redux/features/employees/employeesSlice';
import type { AppDispatch, RootState } from '@/redux/store';
import { utility } from '@/utility';

const IconLegend = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: 2,
                mb: 3
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ color: '#9C27B0' }} />
                <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                    1-3 Years
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: '#2196F3' }} />
                <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                    3-5 Years
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MilitaryTechIcon sx={{ color: '#FFD700' }} />
                <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                    5+ Years
                </Typography>
            </Box>
        </Box>
    );
};

const WorkAnniversary = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { capitalizeFirstLetter } = utility();
    const [error, setError] = useState<string | null>(null);

    const { workAnniversaries, loadingAnniversaries, error: reduxError } = useSelector(
        (state: RootState) => state.employees
    );

    useEffect(() => {
        if (!loadingAnniversaries) {
            dispatch(fetchWorkAnniversaries(5))
                .unwrap()
                .catch((err) => setError(err.message));
        }
    }, [dispatch]);

    const calculateYearsOfService = (joiningDate: string) => {
        const start = dayjs(joiningDate);
        const now = dayjs();


        return now.diff(start, 'year');
    };

    const getCelebrationIcon = (years: number) => {
        if (years >= 5) return <MilitaryTechIcon sx={{ color: '#FFD700' }} />;
        if (years >= 3) return <EmojiEventsIcon sx={{ color: '#2196F3' }} />;
        if (years >= 1) return <StarIcon sx={{ color: '#9C27B0' }} />;

        return null;
    };

    const isTodayAnniversary = (joiningDate: string) => {
        const anniversaryDate = dayjs(joiningDate);
        const today = dayjs();


        return anniversaryDate.format('MM-DD') === today.format('MM-DD');
    };

    if (loadingAnniversaries) {
        return (
            <Card elevation={5}>
                <CardContent>
                    <Typography variant="body1" align="center">
                        Loading...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (error || reduxError) {
        return (
            <Alert severity="error">
                {error || reduxError}
            </Alert>
        );
    }

    const todayAnniversaries = workAnniversaries.filter(emp => isTodayAnniversary(emp.joining_date));
    const otherAnniversaries = workAnniversaries.filter(emp => !isTodayAnniversary(emp.joining_date));

    return (
        <Card
            elevation={5}
            sx={{
                margin: 'auto',
                borderRadius: 3,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)'
            }}
        >
            <Box sx={{ pt: 3, px: 2 }}>
                <IconLegend />
            </Box>

            {todayAnniversaries.length > 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontSize: '1.5rem',
                            color: '#64e0e2',
                            fontWeight: 800,
                            letterSpacing: 2,
                            mb: 3
                        }}
                    >
                        Today's Work Anniversary Celebration
                    </Typography>

                    <Grid container spacing={3} justifyContent="center">
                        {todayAnniversaries.map((employee, index) => {
                            const yearsCompleted = calculateYearsOfService(employee.joining_date);

                            return (
                                <Grid item key={employee._id || index} xs={12} sm={6} md={4}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <Avatar
                                            src={employee.image}
                                            alt={`${employee.first_name} ${employee.last_name}`}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                border: '3px solid #64e0e2',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                                            }}
                                        >
                                            {!employee.image && <PersonIcon />}
                                        </Avatar>
                                        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
                                            {capitalizeFirstLetter(employee.first_name)}{' '}
                                            {capitalizeFirstLetter(employee.last_name)}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#64e0e2', textAlign: 'center' }}>
                                            Completed {yearsCompleted} {yearsCompleted === 1 ? 'year' : 'years'}
                                        </Typography>
                                        {getCelebrationIcon(yearsCompleted)}
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            ) : otherAnniversaries.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontSize: '1.5rem',
                            color: '#64e0e2',
                            fontWeight: 800,
                            letterSpacing: 2,
                            mb: 3
                        }}
                    >
                        Upcoming Work Anniversaries
                    </Typography>

                    <Grid container spacing={3} justifyContent="center">
                        {otherAnniversaries.slice(0, 2).map((employee, index) => {
                            const yearsCompleting = calculateYearsOfService(employee.joining_date) + 1;
                            const anniversaryDate = dayjs(employee.joining_date);

                            return (
                                <Grid item key={employee._id || index} xs={12} sm={6} md={4}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <Avatar
                                            src={employee.image}
                                            alt={`${employee.first_name} ${employee.last_name}`}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                border: '3px solid #64e0e2',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                                            }}
                                        >
                                            {!employee.image && <PersonIcon />}
                                        </Avatar>
                                        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
                                            {capitalizeFirstLetter(employee.first_name)}{' '}
                                            {capitalizeFirstLetter(employee.last_name)}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#64e0e2', textAlign: 'center' }}>
                                            {anniversaryDate.format('D MMM')} • Completing {yearsCompleting} {yearsCompleting === 1 ? 'year' : 'years'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            )}

            <Card
                sx={{
                    borderRadius: "20px",
                    overflow: 'hidden',
                    boxShadow: 3,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                }}
            >
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WorkIcon color="primary" />
                            <Typography variant="h5" sx={{ color: '#333', fontWeight: 'bold' }}>
                                Other Work Anniversaries
                            </Typography>
                        </Box>
                    }
                    sx={{
                        backgroundColor: 'white',
                        borderBottom: '1px solid #ddd',
                        py: 2,
                    }}
                />
                <CardContent sx={{ p: 0 }}>
                    <List disablePadding>
                        {otherAnniversaries.slice(2).map((employee, index) => {
                            const joiningDate = dayjs(employee.joining_date);
                            const yearsCompleting = calculateYearsOfService(employee.joining_date) + 1;

                            return (
                                <React.Fragment key={employee._id || index}>
                                    {index > 0 && <Divider variant="inset" component="li" />}
                                    <ListItem
                                        alignItems="center"
                                        sx={{
                                            py: 1.5,
                                            px: 2,
                                            '&:hover': {
                                                backgroundColor: '#f9f9f9',
                                                transition: 'background-color 0.3s ease',
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={employee.image}
                                                alt={`${employee.first_name} ${employee.last_name}`}
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                    border: '3px solid #ddd',
                                                    transition: 'transform 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.1)',
                                                    },
                                                }}
                                            >
                                                {!employee.image && <PersonIcon />}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    sx={{ color: '#333', fontWeight: 'bold' }}
                                                    variant="subtitle1"
                                                >
                                                    {capitalizeFirstLetter(employee.first_name)}{' '}
                                                    {capitalizeFirstLetter(employee.last_name)}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        sx={{ color: '#666', display: 'block' }}
                                                    >
                                                        {joiningDate.format('D MMM YYYY')} • Completing {yearsCompleting} {yearsCompleting === 1 ? 'year' : 'years'}
                                                    </Typography>
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        sx={{ color: '#2196F3' }}
                                                    >
                                                        {employee.designation}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        {getCelebrationIcon(yearsCompleting)}
                                    </ListItem>
                                </React.Fragment>
                            );
                        })}
                    </List>
                </CardContent>
            </Card>
        </Card>
    );
};

export default WorkAnniversary;
