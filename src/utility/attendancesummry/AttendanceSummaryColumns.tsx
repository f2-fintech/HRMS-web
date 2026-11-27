import React from 'react'

import { Box, Typography, Tooltip } from '@mui/material'
import CircleIcon from '@mui/icons-material/Circle'
import ContrastIcon from '@mui/icons-material/Contrast'
import type { GridColDef } from '@mui/x-data-grid'

export const AttendanceSummaryColumns: GridColDef[] = [
  {
    field: 'location',
    headerName: 'Location',
    headerAlign: 'center',
    align: 'center',
    width: 180,
    renderCell: (params) => {
      return (
        <Tooltip title={params.row.location || 'No Location'}>
          <Typography variant="body2">
            {params.row.location || '-'}
          </Typography>
        </Tooltip>
      )
    }
  },

  {
    field: 'status',
    headerName: 'Status Count',
    headerAlign: 'center',
    align: 'center',
    width: 280,

    renderCell: (params) => {
      return (
        <Box
          display="grid"
          gridTemplateColumns="repeat(5,1fr)"
          gridTemplateRows="repeat(2,1fr)"
          gap={1}
          justifyContent="center"
          alignItems="center"
        >
          {/* Present */}
          <Tooltip title="Present with shift completed">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: 'green', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount.Present || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* Present Not Completed */}
          <Tooltip title="Present but shift Not Completed">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: 'lightgreen', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount.presentNotCompleted || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* Absent */}
          <Tooltip title="Absent">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: 'red', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount.Absent || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* Half */}
          <Tooltip title="On Half">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <ContrastIcon sx={{ color: '#6fbf73', fontSize: 30, mt: 1 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: '#191919', fontWeight: 'bold', fontSize: 14, mt: 2 }}
              >
                {params.row.statusCount['On Half'] || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* Leave */}
          <Tooltip title="On Leave">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: 'orange', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount['On Leave'] || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* Field */}
          <Tooltip title="On Field">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: '#673ab7', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount['On Field'] || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* WFH */}
          <Tooltip title="Work From Home">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: 'rgb(247, 51, 120)', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount['On Wfh'] || 0}
              </Typography>
            </Box>
          </Tooltip>

          {/* Total Leave */}
          <Tooltip title="Total Leave (Absent + Leave + Half×0.5)">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative">
              <CircleIcon sx={{ color: '#1976d2', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{ position: 'absolute', color: 'white', fontWeight: 'bold' }}
              >
                {params.row.statusCount.TotalLeave || 0}
              </Typography>
            </Box>
          </Tooltip>

        </Box>
      )
    }
  }
]
