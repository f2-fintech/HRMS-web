'use client';

import React from 'react';
import { Grid, Card, CardContent, Chip, Typography, Stack, Box, Tooltip, IconButton } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { Break } from '@/redux/features/breaksheets/breaksSlice';

interface BreakListProps {
    filteredBreaks: Break[];
    userRole: string | number;
    handleEditClick: (breakToEdit: Break) => void;
}

const BreakList: React.FC<BreakListProps> = ({ filteredBreaks, userRole, handleEditClick }) => {
    return (
        <Grid container spacing={2}>
            {filteredBreaks.map((breakEntry, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                        elevation={2}
                        sx={{
                            height: '100%',
                            borderRadius: 2,
                            position: 'relative',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                            },
                            ...(breakEntry.endTime === '' && {
                                animation: 'pulse 1.8s infinite',
                                '@keyframes pulse': {
                                    '0%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.4)' },
                                    '70%': { boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)' },
                                    '100%': { boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)' },
                                },
                            }),
                        }}
                    >
                        <CardContent>
                            <Stack spacing={2}>
                                <Chip
                                    label={breakEntry.type}
                                    color='primary'
                                    variant='outlined'
                                    sx={{ borderRadius: 2 }}
                                />

                                <Stack spacing={1}>
                                    <Typography variant='body2' color='text.secondary'>
                                        Start: {breakEntry.startTime}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        End: {breakEntry.endTime || 'In Progress'}
                                    </Typography>
                                    <Typography variant='body1' color='primary.main' fontWeight='bold'>
                                        Duration: {breakEntry.duration}
                                    </Typography>
                                </Stack>

                                {userRole === '1' && (
                                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                        <Tooltip title='Edit Break'>
                                            <IconButton
                                                size='small'
                                                onClick={() => handleEditClick(breakEntry)}
                                                sx={{
                                                    bgcolor: 'background.paper',
                                                    boxShadow: 1,
                                                    '&:hover': {
                                                        bgcolor: 'primary.light',
                                                        color: 'white',
                                                    },
                                                }}
                                            >
                                                <MoreVert fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default BreakList;
