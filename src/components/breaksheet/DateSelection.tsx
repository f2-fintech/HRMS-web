'use client';

import React from 'react';
import { TextField, Stack, Typography, Box } from '@mui/material';
import { EventNote } from '@mui/icons-material';

interface DateSelectionProps {
    selectedDate: string;
    setSelectedDate: (date: string) => void;
}

const DateSelection: React.FC<DateSelectionProps> = ({ selectedDate, setSelectedDate }) => {
    return (
        <Box>
            <Stack direction='row' alignItems='center' spacing={2} mb={2}>
                <EventNote color='primary' />
                <Typography variant='h6'>Date Selection</Typography>
            </Stack>
            <TextField
                label='Select Date'
                type='date'
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                sx={{
                    width: { xs: '100%', sm: 'auto' },
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
                InputLabelProps={{ shrink: true }}
            />
        </Box>
    );
};

export default DateSelection;
