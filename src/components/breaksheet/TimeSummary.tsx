'use client';

import React from 'react';
import { Grid, Paper, Typography, LinearProgress, Stack, Box } from '@mui/material';
import { AccessTime, Coffee } from '@mui/icons-material';
import { formatTime } from '@/utility/timeUtils';

interface TimeSummaryProps {
    totalOnFieldDuration: number;
    totalDurationForDate: number;
    breakProgress: number;
    userDesignation?: string;
}

const TimeSummary: React.FC<TimeSummaryProps> = ({
    totalOnFieldDuration,
    totalDurationForDate,
    breakProgress,
    userDesignation,
}) => {
    // If the userDesignation is 'Assistant Manager Hr' we skip the summary (based on your original code).
    if (userDesignation === 'Assistant Manager Hr') {
        return null;
    }

    return (
        <Box>
            <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                <AccessTime color='primary' />
                <Typography variant='h6'>Time Summary</Typography>
            </Stack>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            background: theme =>
                                `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`
                        }}
                    >
                        <Typography variant='subtitle2' color='white' gutterBottom>
                            On-Site Duration
                        </Typography>
                        <Typography variant='h5' color='white' fontWeight='bold'>
                            {formatTime(totalOnFieldDuration)}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            background: theme =>
                                breakProgress > 100
                                    ? `linear-gradient(45deg, ${theme.palette.error.light} 30%, ${theme.palette.error.main} 90%)`
                                    : `linear-gradient(45deg, ${theme.palette.success.light} 30%, ${theme.palette.success.main} 90%)`
                        }}
                    >
                        <Typography variant='subtitle2' color='white' gutterBottom>
                            Total Break Duration
                        </Typography>
                        <Typography variant='h5' color='white' fontWeight='bold'>
                            {formatTime(totalDurationForDate)}
                        </Typography>
                        <LinearProgress
                            variant='determinate'
                            value={Math.min(breakProgress, 100)}
                            sx={{
                                mt: 1,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'white',
                                },
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TimeSummary;
