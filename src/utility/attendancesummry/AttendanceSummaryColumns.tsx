import React from 'react';

import { Box, Typography, Tooltip } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import ContrastIcon from '@mui/icons-material/Contrast';
import type { GridColDef } from '@mui/x-data-grid';

export const AttendanceSummaryColumns: GridColDef[] = [
  {
    field: 'status',
    headerName: 'Status Count',
    headerAlign: 'center',
    align: 'center',
    width: 200,
    renderCell: (params) => {
      return (
        <Box
          display="grid"
          gridTemplateColumns="repeat(4, 1fr)" // 4 columns
          gridTemplateRows="repeat(2, 1fr)"  // 2 rows
          gap={1}
          justifyContent="center"
          alignItems="center"
          position="relative"
        >
          {/* Row 1 - Present, Present Not Completed, Absent */}
          <Tooltip title="Present with shift completed">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <CircleIcon sx={{ color: 'green', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {params.row.statusCount.Present}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Present but shift Not Completed">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <CircleIcon sx={{ color: 'lightgreen', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {params.row.statusCount.presentNotCompleted ?? 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Absent">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <CircleIcon sx={{ color: 'red', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {params.row.statusCount.Absent}
              </Typography>
            </Box>
          </Tooltip>

          {/* Row 2 - On Half, On Half Not Completed, On Leave */}
          <Tooltip title="On Half with shift completed">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <ContrastIcon
                sx={{
                  color: '#6fbf73',
                  fontSize: 30,
                  marginTop: '20%',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: '#191919',
                  fontWeight: 'bold',
                  fontSize: 16,
                  mt: 2,
                }}
              >
                {params.row.statusCount[`On Half`]}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="On Half but shift Not Completed">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <ContrastIcon
                sx={{
                  color: '#d0f0c0',
                  fontSize: 30,
                  marginTop: '20%',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: '#191919',
                  fontWeight: 'bold',
                  fontSize: 16,
                  mt: 2,
                }}
              >
                {params.row.statusCount.onHalfNotCompleted ?? 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="On Leave">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <CircleIcon sx={{ color: 'orange', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {params.row.statusCount[`On Leave`]}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="On Field">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <CircleIcon sx={{ color: '#673ab7', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {params.row.statusCount[`On Field`]}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Work From Home (WFH)">
            <Box display="flex" justifyContent="center" alignItems="center" position="relative" sx={{ cursor: 'pointer' }}>
              <CircleIcon sx={{ color: 'rgb(247, 51, 120)', fontSize: 30 }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                {params.row.statusCount[`On Wfh`]}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      )
    }
  },
];
