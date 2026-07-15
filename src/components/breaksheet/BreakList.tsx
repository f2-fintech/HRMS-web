'use client';

import React from 'react';
import { Grid, Card, CardContent, Chip, Typography, Stack, Box, Tooltip, IconButton } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { Break } from '@/redux/features/breaksheets/breaksSlice';

interface BreakListProps {
    filteredBreaks: Break[];
    userRole: string | number;
    handleEditClick: (breakToEdit: Break) => void;
    updateRemarks: (breakId: string, remarks: string) => void;
}

const BreakList: React.FC<BreakListProps> = ({ filteredBreaks, userRole, handleEditClick, updateRemarks }) => {
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [remarks, setRemarks] = React.useState('');

    return (
        <Grid container spacing={2}>
            {filteredBreaks.map((breakEntry, index) => (
                <Grid item xs={12} sm={6} md={3} key={breakEntry._id}>
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
                                {breakEntry.remarks && (
                                    <Typography variant='body2' color='text.secondary'>
                                        Remarks: {breakEntry.remarks}
                                    </Typography>
                                )}

                                <Box>
                                    <button
                                        onClick={() => {
                                            setEditingId(breakEntry._id);
                                            setRemarks(breakEntry.remarks || '');
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            borderRadius: '20px',
                                            border: '1px solid #1976d2',
                                            background: breakEntry.remarks ? '#e3f2fd' : '#f5f5f5',
                                            color: '#1976d2',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        {breakEntry.remarks ? '✏️ Edit Remarks' : '+ Add Remarks'}
                                    </button>
                                </Box>

                                {/* ✅ Inline Input */}
                                {editingId === breakEntry._id && (
                                    <Box sx={{ mt: 1 }}>
                                        <input
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="Add remarks"
                                            style={{
                                                width: '100%',
                                                padding: '6px',
                                                borderRadius: '6px',
                                                border: '1px solid #ccc'
                                            }}
                                        />

                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <button
                                                onClick={() => {
                                                    updateRemarks(breakEntry._id, remarks);
                                                    setEditingId(null);
                                                }}
                                                style={{
                                                    padding: '4px 10px',
                                                    background: '#1976d2',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Save
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setRemarks('');
                                                }}
                                                style={{
                                                    padding: '4px 10px',
                                                    background: '#e0e0e0',
                                                    color: '#333',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </Box>
                                    </Box>
                                )}
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
