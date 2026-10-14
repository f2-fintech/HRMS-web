import React from 'react'
import { Grid, TextField, InputAdornment } from '@mui/material'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import SearchIcon from '@mui/icons-material/Search'
import type { Dayjs } from 'dayjs'

interface FineListingHeaderProps {
    userRole: string
    selectedKeyword: string
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    selectedDate: Dayjs
    handleDateChange: (newValue: Dayjs | null) => void
}

const FineListingHeader: React.FC<FineListingHeaderProps> = ({
    userRole,
    selectedKeyword,
    handleInputChange,
    selectedDate,
    handleDateChange,
}) => {
    return (
        <Grid
            container
            spacing={3}
            alignItems="center"
            justifyContent="space-between"
            mb={2}
        >
            {userRole === '1' && (
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Search"
                        variant="outlined"
                        value={selectedKeyword}
                        onChange={handleInputChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            )}

            <Grid item xs={12} md={userRole === '1' ? 4 : 6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        views={userRole === '1' ? ['month', 'year'] : ['year']}
                        label={userRole === '1' ? 'Select Month and Year' : 'Select Year'}
                        value={selectedDate}
                        onChange={handleDateChange}
                        sx={{
                            width: '100%',
                        }}
                    />
                </LocalizationProvider>
            </Grid>
        </Grid>
    )
}

export default FineListingHeader
