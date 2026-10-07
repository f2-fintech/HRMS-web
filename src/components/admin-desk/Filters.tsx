'use client'

import { Box, TextField, MenuItem } from '@mui/material'

export default function Filters() {
  return (
    <Box
      display="flex"
      gap={2}
      flexWrap="wrap"
      alignItems="center"
    >
      <TextField
        size="small"
        type="date"
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        select
        size="small"
        label="Department"
        sx={{ minWidth: 180 }}
        defaultValue=""
      >
        <MenuItem value="">All Departments</MenuItem>
        <MenuItem value="HR">HR</MenuItem>
        <MenuItem value="Sales">Sales</MenuItem>
        <MenuItem value="IT">IT</MenuItem>
      </TextField>

      <TextField
        label="Employee Name"
        size="small"
      />

      <TextField
        select
        size="small"
        label="Punch Status"
        sx={{ minWidth: 180 }}
        defaultValue=""
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="before10">Before 10 AM</MenuItem>
        <MenuItem value="grace">10:00 - 10:15</MenuItem>
        <MenuItem value="late">After 10:15</MenuItem>
      </TextField>
    </Box>
  )
}
