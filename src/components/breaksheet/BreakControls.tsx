'use client';

import React, { useState } from 'react';
import { Button, Grid, MenuItem, TextField, Stack } from '@mui/material';
import { Timer } from '@mui/icons-material';

interface BreakControlsProps {
    breakType: string;
    setBreakType: (val: string) => void;
    otherBreakType: string;
    setOtherBreakType: (val: string) => void;
    specifyError: string;
    setSpecifyError: (val: string) => void;
    breakOptions: string[];
    isCurrentDate: boolean;
    timerRunning: boolean;
    handleStartTime: () => void;
    handleEndTime: () => void;
    startTime: string;
    duration: string;
    userRole: string | number;
    selectedEmployeeId: string | null;
    employeeId: string | null;
}

const BreakControls: React.FC<BreakControlsProps> = ({
    breakType,
    setBreakType,
    otherBreakType,
    setOtherBreakType,
    specifyError,
    setSpecifyError,
    breakOptions,
    isCurrentDate,
    timerRunning,
    handleStartTime,
    handleEndTime,
    startTime,
    duration,
    userRole,
    selectedEmployeeId,
    employeeId,
}) => {
    return (
        <Grid container spacing={3}>
            {/* Break Type Selection */}
            <Grid item xs={12} md={6}>
                <TextField
                    select
                    label='Choose Break Type'
                    value={breakType}
                    onChange={e => setBreakType(e.target.value)}
                    fullWidth
                    variant='outlined'
                    disabled={
                        !isCurrentDate ||
                        (selectedEmployeeId && selectedEmployeeId !== employeeId && userRole === '2')
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                    {breakOptions.map(option => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            {/* Other (Specify) Break Type Input */}
            {breakType === 'Other' && (
                <Grid item xs={12} md={6}>
                    <TextField
                        label='Please specify'
                        value={otherBreakType}
                        onChange={e => {
                            setOtherBreakType(e.target.value);
                            setSpecifyError('');
                        }}
                        fullWidth
                        variant='outlined'
                        error={!!specifyError}
                        helperText={specifyError}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Grid>
            )}

            {/* Start Break Button */}
            <Grid item xs={12} md={6}>
                <Button
                    variant='contained'
                    startIcon={<Timer />}
                    onClick={handleStartTime}
                    disabled={
                        !isCurrentDate ||
                        timerRunning ||
                        (selectedEmployeeId && selectedEmployeeId !== employeeId && userRole === '2')
                    }
                    fullWidth
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: 2,
                        background: timerRunning
                            ? 'linear-gradient(45deg, #FFB74D 30%, #FF9800 90%)'
                            : 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
                    }}
                >
                    {timerRunning ? 'Break Running...' : 'Start Break'}
                </Button>
            </Grid>

            {/* Break Start Time Display */}
            <Grid item xs={12} md={6}>
                <TextField
                    label='Break Start'
                    value={startTime}
                    disabled
                    fullWidth
                    variant='outlined'
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </Grid>

            {/* Duration Display */}
            <Grid item xs={12} md={6}>
                <TextField
                    label='Duration'
                    value={duration}
                    disabled
                    fullWidth
                    variant='outlined'
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                    }}
                />
            </Grid>

            {/* End Break Button */}
            <Grid item xs={12} md={6}>
                <Button
                    variant='contained'
                    color='secondary'
                    startIcon={<Timer />}
                    onClick={handleEndTime}
                    disabled={!isCurrentDate || !timerRunning}
                    fullWidth
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: 2,
                        background: 'linear-gradient(45deg, #F44336 30%, #EF5350 90%)'
                    }}
                >
                    End Break
                </Button>
            </Grid>
        </Grid>
    );
};

export default BreakControls;
