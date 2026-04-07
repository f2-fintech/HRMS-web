'use client'

import React from 'react'
import { Box, TextField, InputAdornment } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import type { Dayjs } from 'dayjs'

interface PayrollHeaderProps {
    keyword: string
    onKeywordChange: (value: string) => void
    selectedDate: Dayjs
    onDateChange: (date: Dayjs | null) => void
}

const PayrollHeader: React.FC<PayrollHeaderProps> = ({
    keyword,
    onKeywordChange,
    selectedDate,
    onDateChange,
}) => {
    return (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <TextField
                placeholder="Search by employee name or code..."
                value={keyword}
                onChange={(e) => onKeywordChange(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    views={['month', 'year']}
                    label="Select Month"
                    value={selectedDate}
                    onChange={onDateChange}
                    slotProps={{
                        textField: { size: 'small', sx: { minWidth: 180 } },
                    }}
                />
            </LocalizationProvider>
        </Box>
    )
}

export default PayrollHeader
