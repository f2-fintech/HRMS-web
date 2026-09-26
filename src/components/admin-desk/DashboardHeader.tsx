'use client'

import { Dispatch, SetStateAction } from 'react'

import {
  Box,
  Typography,
  Button,
  TextField
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'

interface DashboardHeaderProps {
  selectedDate: string
  setSelectedDate: Dispatch<SetStateAction<string>>
}

const DashboardHeader = ({
  selectedDate,
  setSelectedDate
}: DashboardHeaderProps) => {

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleExport = () => {
    console.log('Export Excel')
  }

  return (
    <Box>

      {/* Heading */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={3}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight={700}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <AdminPanelSettingsIcon
              color="primary"
              fontSize="large"
            />

            Admin Desk

          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
          >
            Employee Attendance Monitoring Dashboard
          </Typography>

        </Box>

        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
        >

          <TextField
            type="date"
            size="small"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            InputLabelProps={{
              shrink: true
            }}
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Excel
          </Button>

        </Box>

      </Box>

    </Box>
  )
}

export default DashboardHeader
