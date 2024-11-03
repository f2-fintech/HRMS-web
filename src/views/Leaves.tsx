/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable padding-line-between-statements */
'use client'
import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { debounce } from 'lodash'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'
import {
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  Avatar,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { styled } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import ContrastIcon from '@mui/icons-material/Contrast'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InputAdornment from '@mui/material/InputAdornment'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'

import { format } from 'date-fns'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchLeaves, filterLeave } from '@/redux/features/leaves/leavesSlice'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import AddLeavesForm from '@/components/leave/LeaveForm'
import { Console } from 'console'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold'
}))

export default function LeavesGrid() {
  const dispatch = useDispatch<AppDispatch>()
  const { leaves, total } = useSelector((state: RootState) => state.leaves)
  const [showForm, setShowForm] = useState(false)
  const [selectedLeaves, setSelectedLeaves] = useState(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [employees, setEmployees] = useState([])
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(false) // State to track loading

  const debouncedFetch = useMemo(
    () =>
      debounce(() => {
        dispatch(fetchLeaves({ page, limit, keyword: selectedKeyword }))
      }, 300),
    [dispatch, page, limit, selectedKeyword]
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }, [])

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage + 1)
    setLimit(newPageSize)
  }, [])

  const handlePaginationModelChange = useCallback((params: { page: number; pageSize: number }) => {
    setPage(params.page + 1) // Add +1 because MUI starts page index at 0
    setLimit(params.pageSize)
  }, [])

  useEffect(() => {
    debouncedFetch()

    if (leaves.length === 0) {
      dispatch(fetchLeaves({ page, limit, keyword: selectedKeyword }))
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
    setUserId(user.id)

    return debouncedFetch.cancel
  }, [debouncedFetch, dispatch, leaves.length, limit, page, selectedKeyword])

  useEffect(() => {
    if (Number(userRole) < 3 && employees.length === 0) {
      const fetchEmployees = async () => {
        const employeeData = await apiResponse()
        setEmployees(employeeData)
      }
      fetchEmployees()
    }
  }, [userRole, employees.length])

  const handleLeaveAddClick = useCallback(() => {
    setSelectedLeaves(null)
    setShowForm(true)
  }, [])

  const handleLeaveEditClick = useCallback(id => {
    setSelectedLeaves(id)
    setShowForm(true)
  }, [])

  const handleClose = useCallback(() => {
    setShowForm(false)
  }, [])

  const renderAccordion = params => {
    const getRowBackgroundColor = status => {
      if (status === 'Approved') {
        return 'rgba(76, 175, 80, 0.2)'
      } else if (status === 'Rejected') {
        return 'rgba(244, 67, 54, 0.2)'
      } else if (status === 'Pending') {
        return 'rgba(255, 193, 7, 0.2)'
      }
      return ''
    }

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{`View all Leaves (${Array.isArray(params.row.assets) ? params.row.assets.length : 0})`}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Days</StyledTableCell>
                <StyledTableCell>Start Date</StyledTableCell>
                <StyledTableCell>End Date</StyledTableCell>
                <StyledTableCell>Type</StyledTableCell>
                <StyledTableCell>Application</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Decision</StyledTableCell>
                {userRole === '1' ? <StyledTableCell>Edit</StyledTableCell> : ''}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(params.row.assets) && params.row.assets.length > 0 ? (
                params.row.assets.map(leave => {
                  const dayValue = parseFloat(leave.day)
                  const halfPeriod = leave.half_day_period
                  const [showFullText, setShowFullText] = useState(false)

                  const handleToggleText = () => {
                    setShowFullText(prev => !prev)
                  }

                  const maxChars = 15 // Set character limit for truncation

                  return (
                    <TableRow key={leave._id} style={{ backgroundColor: getRowBackgroundColor(leave.status) }}>
                      {dayValue === 0.5 && halfPeriod ? (
                        <TableCell>
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <ContrastIcon
                              sx={{
                                color: '#989c9a',
                                fontSize: 40
                              }}
                            />
                            <Typography
                              fontWeight='bold'
                              fontSize='0.9em'
                              color='black'
                              sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              {halfPeriod === 'First Half' ? 'FH' : 'SH'}
                            </Typography>
                          </Box>
                        </TableCell>
                      ) : (
                        <TableCell sx={{ paddingLeft: '25px' }}>{leave.day}</TableCell>
                      )}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {leave.start_date ? format(new Date(leave.start_date), 'dd-MMM-yyyy').toUpperCase() : ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {leave.end_date ? format(new Date(leave.end_date), 'dd-MMM-yyyy').toUpperCase() : ''}
                      </TableCell>
                      <TableCell>{leave.type}</TableCell>

                      {/* Application with 'Show More' functionality */}
                      <TableCell>
                        {showFullText || leave.application.length <= maxChars
                          ? leave.application
                          : `${leave.application.slice(0, maxChars)}...`}
                        {leave.application.length > maxChars && (
                          <Button variant='text' color='primary' onClick={handleToggleText}>
                            {showFullText ? 'Less' : 'More'}
                          </Button>
                        )}
                      </TableCell>

                      <TableCell>{leave.status}</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>{leave.reason}</TableCell>
                      {userRole === '1' ? (
                        <TableCell>
                          <Button
                            color='info'
                            variant='contained'
                            sx={{ minWidth: '50px' }}
                            onClick={() => handleLeaveEditClick(leave._id)}
                          >
                            <DriveFileRenameOutlineOutlined />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No leaves available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    )
  }

  const generateColumns = useMemo(() => {
    return [
      ...(userRole === '1'
        ? [
          {
            field: 'employee',
            headerName: 'Employee',
            minWidth: 220,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            sortable: true,
            align: 'center',
            renderCell: params => {
              return (
                <Box display='flex' alignItems='center' height='100%'>
                  <Avatar src={params.row.employee.image} sx={{ marginLeft: 10, width: 40, height: 40 }} />
                  <Typography sx={{ fontSize: '1em', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {params.row.employee.first_name} {params.row.employee.last_name}
                  </Typography>
                </Box>
              )
            }
          },
          {
            field: 'leave',
            headerName: 'Leave Details',
            width: 800,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: renderAccordion
          }
        ]
        : [
          {
            field: 'day',
            headerName: 'Day',
            flex: 0.5,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => {
              console.log('param', params)
              const dayValue = parseFloat(params.value)
              const halfDayPeriod = params.row.half_day_period

              return (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <Typography fontWeight='bold'>{dayValue}</Typography>
                </Box>
              )
            }
          },

          {
            field: 'start_date',
            headerName: 'Start Date',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => {
              const date = new Date(params.value)
              return !isNaN(date.getTime()) ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {format(date, 'dd-MMM-yyyy').toUpperCase()}
                </div>
              ) : (
                ''
              )
            }
          },
          {
            field: 'end_date',
            headerName: 'End Date',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => {
              const date = new Date(params.value)
              return !isNaN(date.getTime()) ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  {format(date, 'dd-MMM-yyyy').toUpperCase()}
                </div>
              ) : null
            }
          },
          {
            field: 'type',
            headerName: 'Type',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%'
                }}
              >
                {params.value}
              </div>
            )
          },
          {
            field: 'application',
            headerName: 'Application',
            flex: 2,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'super-app-theme--header'
            // renderCell: (params) => (
            //   <div style={{ alignItems: 'center' }}>
            //     {params.value}
            //   </div>
            // )
          },

          {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%'
                }}
              >
                {params.value}
              </div>
            )
          },
          {
            field: 'reason',
            headerName: 'Decision',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: params => (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%'
                }}
              >
                {params.value}
              </div>
            )
          }
        ])
    ]
  }, [userRole])

  const rows = useMemo(() => {
    return leaves
      .filter(leave => leave && leave.day && leave.start_date) // Filter out invalid leaves
      .map(leave => ({
        _id: leave._id,
        start_date: leave.start_date,
        end_date: leave.end_date,
        type: leave.type,
        status: leave.status,
        day: leave.day,
        application: leave.application,
        half_day_period: leave.half_day_period,
        reason: leave.reason || ''
      }))
  }, [leaves])

  console.log('leaves', leaves)

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            {/* <AddLeavesForm leave={selectedLeaves} handleClose={handleClose} /> */}
            <AddLeavesForm
              handleClose={handleClose}
              leave={selectedLeaves}
              leaves={leaves}
              userRole={userRole}
              userId={userId}
              employees={employees}
              page={page}
              limit={limit}
              selectedKeyword={selectedKeyword}
            />
          </DialogContent>
        </Dialog>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Leave
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Leave
            </Typography>
          </Box>
          <Box display='flex' alignItems='center'>
            {Number(userRole) >= 2 && (
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handleLeaveAddClick}
              >
                Apply Leave
              </Button>
            )}
          </Box>
        </Box>
        <Grid container spacing={6} alignItems='center' mb={2}>
          {userRole === '1' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='search'
                variant='outlined'
                value={selectedKeyword}
                onChange={handleInputChange}
                InputProps={{
                  sx: {
                    borderRadius: '50px'
                  },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          )}
        </Grid>
      </Box>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          getRowHeight={() => 'auto'}
          sx={{
            height: 600,
            '& .super-app-theme--header': {
              fontSize: 17,
              fontWeight: 600,
              alignItems: 'center'
            },
            '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
              background: '#2c3ce3 !important',
              color: 'white'
            },
            '& .MuiDataGrid-cell': {
              fontSize: '10',
              align: 'center'
            },
            '& .MuiDataGrid-row': {
              fontWeight: '600',
              fontSize: '14px',
              boxSizing: 'border-box'
            },
            '& .row-approved': {
              backgroundColor: 'rgba(76, 175, 80, 0.2)'
            },
            '& .row-rejected': {
              backgroundColor: 'rgba(244, 67, 54, 0.2)'
            },
            '& .row-pending': {
              backgroundColor: 'rgba(255, 193, 7, 0.2)'
            }
          }}
          rows={userRole === '1' ? leaves : rows}
          columns={generateColumns}
          getRowId={row => {
            if (userRole === '1') {
              return row._id && row._id._id ? row._id._id : row._id
            } else {
              return row._id
            }
          }}
          paginationMode='server'
          rowCount={total}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          getRowClassName={params => {
            if (params.row.status === 'Approved') {
              return 'row-approved'
            }
            if (params.row.status === 'Rejected') {
              return 'row-rejected'
            }
            if (params.row.status === 'Pending') {
              return 'row-pending'
            }
            return ''
          }}
        />
      </Box>
    </Box>
  )
}
