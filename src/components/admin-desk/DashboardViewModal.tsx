'use client'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Typography,
  Box
} from '@mui/material'

import VisibilityIcon from '@mui/icons-material/Visibility'

interface DashboardViewModalProps {
  open: boolean
  title: string
  rows: any[]
  onClose: () => void
}

export default function DashboardViewModal({
  open,
  title,
  rows,
  onClose
}: DashboardViewModalProps) {

  return (

    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >

      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 700,
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E5E7EB'
        }}
      >
        <VisibilityIcon color="primary" />
        {title}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>

        {rows.length === 0 ? (

          <Box py={6} textAlign="center">
            <Typography>No Records Found</Typography>
          </Box>

        ) : (

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 0
            }}
          >

            <Table>

              <TableHead>

                <TableRow
                  sx={{
                    bgcolor: '#5B3CC4',

                    '& .MuiTableCell-head': {
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14
                    }
                  }}
                >

                  <TableCell>S.No.</TableCell>

                  <TableCell>Employee</TableCell>

                  <TableCell>Department</TableCell>

                  <TableCell>Designation</TableCell>

                  <TableCell>Date</TableCell>

                  <TableCell>Punch In</TableCell>

                  <TableCell>Punch Out</TableCell>

                  <TableCell>Status</TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {rows.map((row: any, index: number) => (

                  <TableRow
                    key={index}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: '#F8FAFC'
                      }
                    }}
                  >

                    <TableCell>{index + 1}</TableCell>

                    <TableCell>
                {row.employeeName ||

                    (row.employee
                    ? `${row.employee.first_name || ''} ${row.employee.last_name || ''}`
                    : row.first_name
                    ? `${row.first_name} ${row.last_name || ''}`
                    : '-')}

                </TableCell>

                    <TableCell>
                      {row.department || '-'}
                    </TableCell>

                    <TableCell>
                      {row.designation || '-'}
                    </TableCell>

                    <TableCell>
                      {row.date || '-'}
                    </TableCell>

                    <TableCell>
                      {row.punchIn || '-'}
                    </TableCell>

                    <TableCell>
                      {row.punchOut || '-'}
                    </TableCell>

                    <TableCell>
                      {row.status || '-'}
                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </TableContainer>

        )}

      </DialogContent>

      <DialogActions>

        <Button
          variant="contained"
          onClick={onClose}
        >
          Close
        </Button>

      </DialogActions>

    </Dialog>

  )

}
