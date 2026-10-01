import React from 'react'

import { Box, Typography, Grid, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import dayjs from 'dayjs'

interface AttendanceSummaryProps {
  attendanceData: any
  selectedMonth: number
  onClose: () => void // Add onClose prop for handling close action
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ attendanceData, selectedMonth, onClose }) => {
  const counts = {
    present: 0,
    absent: 0,
    onHalf: 0,
    onLeave: 0
  }

  const filteredAttendanceData = Object.entries(attendanceData).filter(([date]) => {
    return dayjs(date).month() + 1 === selectedMonth
  })

  filteredAttendanceData.forEach(([, status]) => {
    if (status === 'Present') {
      counts.present += 1
    } else if (status === 'Absent') {
      counts.absent += 1
    } else if (status === 'On Half') {
      counts.onHalf += 0.5
    } else if (status === 'On Leave') {
      counts.onLeave += 1
    }
  })

  const totalPresentAndOnHalf = counts.present + counts.onHalf

  return (
    <Box sx={{ padding: 2 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
        <Typography variant='h4' gutterBottom>
          Attendance Summary for{' '}
          {dayjs()
            .month(selectedMonth - 1)
            .format('MMMM')}
        </Typography>
        <Typography variant='h5'>NOTE : ON HALF COUNT BY 0.5 </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant='h6'>Present: {counts.present}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant='h6'>Absent: {counts.absent}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant='h6'>On Half: {counts.onHalf}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant='h6'>On Leave: {counts.onLeave}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant='h6'>Total Present = Present + On Half: {totalPresentAndOnHalf}</Typography>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AttendanceSummary
