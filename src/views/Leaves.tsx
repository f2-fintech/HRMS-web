/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable padding-line-between-statements */
'use client'
import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { DataGrid, GridOverlay } from '@mui/x-data-grid'
import {
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  TableCell,
  styled,
  Paper,
  useTheme,
  alpha
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import DialogTitle from '@mui/material/DialogTitle'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchLeaves } from '@/redux/features/leaves/leavesSlice'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import AddLeavesForm from '@/components/leave/LeaveForm'
import Loader from '@/components/loader/loader'
import dayjs, { Dayjs } from 'dayjs'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import AccordionLeaves from '@/components/leave/AccordionLeaves'
import useDebounce from '@/utility/debounce/useDebounce'
import { utility } from '@/utility'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  padding: theme.spacing(2),
  borderBottom: `2px solid ${theme.palette.divider}`,
  color: theme.palette.primary.main
}))

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2)
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1)
  }
}))

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3)
  }
}))

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 50,
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
  }
}))

const CustomNoRowsOverlay = () => {
  const theme = useTheme()
  return (
    <GridOverlay
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        '& .ant-empty-img-1': {
          fill: theme.palette.mode === 'light' ? '#aeb8c2' : '#262626'
        }
      }}
    >
      <Box sx={{ mt: 1 }}>
        <Typography variant='h6' color='text.secondary'>
          No row
        </Typography>
      </Box>
    </GridOverlay>
  )
}

export default function LeavesGrid() {
  const theme = useTheme()
  const gridRef = useRef(null)

  const dispatch = useDispatch<AppDispatch>()
  const { leaves, total, loading } = useSelector((state: RootState) => state.leaves)

  const [showForm, setShowForm] = useState(false)
  const [selectedLeaves, setSelectedLeaves] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [employees, setEmployees] = useState([])
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedDate, setSelectedDate] = React.useState(dayjs())

  const month = selectedDate.format('MM')
  const year = selectedDate.format('YYYY')

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setSelectedDate(newValue)
    }
  }

  const debouncedKeyword = useDebounce(selectedKeyword, 500)

  useEffect(() => {
    if (userRole === '1') {
      dispatch(fetchLeaves({ page, limit, month, year, keyword: debouncedKeyword }))
    } else if (Number(userRole) > 1) {
      dispatch(fetchLeaves({ page, limit, month: '0', year, keyword: debouncedKeyword }))
    }
  }, [dispatch, page, limit, debouncedKeyword, userId, month, year, userRole])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }, [])


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserRole(user.role)
    setUserId(user.id)

    // For admins (role < 3), fetch employees if not already fetched
    if (Number(user.role) < 3 && employees.length === 0) {
      const fetchEmployeesData = async () => {
        const employeeData = await apiResponse()
        setEmployees(employeeData)
      }
      fetchEmployeesData()
    }
  }, [employees.length])

  const handleLeaveAddClick = useCallback(() => {
    setSelectedLeaves(null)
    setShowForm(true)
  }, [])

  const handleLeaveEditClick = useCallback((id: string) => {
    setSelectedLeaves(id)
    setShowForm(true)
  }, [])

  const handleLeavedelete = async (id: string) => {
    const { isTokenExpired } = utility();
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
      token = localStorage?.getItem('token');
    }

    if (!token || isTokenExpired(token)) {
      // Clean up localStorage if needed
      if (token) {
        localStorage.removeItem('token');
      }

      // Redirect to login with page refresh
      window.location.href = '/login';
      return { error: token ? "Token expired" : "No token found" };
    }

    const confirmDelete = confirm('Are you sure you want to delete this leave?')
    if (!confirmDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/leaves/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // Parse the response
        const data = await response.json()

        // Show success toast
        toast.success(data.message || 'Leave deleted successfully.')

        // Optimistically update UI
        dispatch(fetchLeaves({ page, limit, month, year, keyword: selectedKeyword }))
      } else {
        // Parse and display error message
        const errorResult = await response.json()
        toast.error(errorResult.message || 'Failed to delete leave.')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred while deleting leave.')
    }
  }

  const handleClose = useCallback(() => {
    setShowForm(false)
  }, [])

  // Performance optimization for accordion
  const handleScroll = useCallback(() => {
    if (gridRef.current) {
      const scrollEl = gridRef.current.querySelector('.MuiDataGrid-virtualScroller')
      if (scrollEl) {
        scrollEl.style.willChange = 'transform'
        scrollEl.style.transform = 'translateZ(0)'
      }
    }
  }, [])

  useEffect(() => {
    const gridElement = gridRef.current
    if (gridElement) {
      const scrollEl = gridElement.querySelector('.MuiDataGrid-virtualScroller')
      if (scrollEl) {
        scrollEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => scrollEl.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // Enhanced column definitions
  const generateColumns = useMemo(() => {
    const baseColumnStyles = {
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      sortable: false,
      flex: 1,
      renderCell: params => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 1
          }}
        >
          {params.value}
        </Box>
      )
    }

    return [
      ...(userRole === '1'
        ? [
          {
            field: 'leave',
            headerName: 'Leave Details',
            ...baseColumnStyles,
            renderCell: params => (
              <AccordionLeaves
                params={params}
                handleLeaveEditClick={handleLeaveEditClick}
                handleLeavedelete={handleLeavedelete}
                StyledTableCell={StyledTableCell}
                BootstrapDialog={StyledDialog}
              />
            )
          }
        ]
        : [
          {
            field: 'day',
            headerName: 'Day',
            flex: 0.5,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'super-app-theme--header',
            sortable: false,
            renderCell: params => {
              const dayValue = parseFloat(params.value)
              const halfDayPeriod = params.row.half_day_period

              if (dayValue === 0.5 && halfDayPeriod) {
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
              return <Typography fontWeight='bold'>{dayValue}</Typography>
            }
          },
          {
            field: 'start_date',
            headerName: 'Start Date',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            sortable: false,
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
            sortable: false,
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
            sortable: false,
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
            headerClassName: 'super-app-theme--header',
            sortable: false,
            renderCell: params => {
              const [open, setOpen] = useState(false)

              const handleClickOpen = () => {
                setOpen(true)
              }
              const handleDialogClose = () => {
                setOpen(false)
              }

              return (
                <>
                  <Button variant='outlined' onClick={handleClickOpen}>
                    View
                  </Button>
                  <BootstrapDialog onClose={handleDialogClose} aria-labelledby='customized-dialog-title' open={open}>
                    <DialogTitle
                      sx={{
                        m: 0,
                        p: 2,
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        color: 'primary.main',
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                      id='customized-dialog-title'
                    >
                      Application
                    </DialogTitle>
                    <IconButton
                      aria-label='close'
                      onClick={handleDialogClose}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme => theme.palette.grey[500],
                        '&:hover': {
                          color: theme => theme.palette.grey[700],
                          backgroundColor: theme => theme.palette.grey[100]
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <CloseIcon />
                    </IconButton>

                    <DialogContent
                      sx={{
                        p: 3,
                        minWidth: 400,
                        maxHeight: 500,
                        overflowY: 'auto'
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1rem',
                          lineHeight: 1.6,
                          color: 'text.primary'
                        }}
                      >
                        {params.row.application}
                      </Typography>
                    </DialogContent>
                  </BootstrapDialog>
                </>
              )
            }
          },
          {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            sortable: false,
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
            sortable: false,
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
  }, [userRole, handleLeaveEditClick, handleLeavedelete])

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <ToastContainer position='top-center' />

      <Box sx={{ flexGrow: 1, padding: 3 }}>
        <StyledDialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddLeavesForm
              handleClose={handleClose}
              leave={selectedLeaves}
              leaves={leaves}
              userRole={userRole}
              userId={userId}
              employees={employees}
              page={page}
              limit={limit}
              month={month}
              year={year}
              selectedKeyword={selectedKeyword}
            />
          </DialogContent>
        </StyledDialog>

        {/* Enhanced header section */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box>
              <Typography
                variant='h4'
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                Leave Management
              </Typography>
              <Typography
                variant='subtitle1'
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              >
                Dashboard / Leave
              </Typography>
            </Box>

            <StyledButton variant='contained' color='primary' startIcon={<AddIcon />} onClick={handleLeaveAddClick}>
              Apply Leave
            </StyledButton>
          </Box>

          {/* Enhanced search and date picker section */}
          <Grid container spacing={3} alignItems='center'>
            {userRole === '1' && (
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder='Search employees...'
                  variant='outlined'
                  value={selectedKeyword}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                    sx: {
                      borderRadius: '12px',
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      '&:hover': {
                        backgroundColor: theme.palette.background.paper
                      }
                    }
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  views={userRole === '1' ? ['month', 'year'] : ['year']}
                  label={userRole === '1' ? 'Select Month and Year' : 'Select Year'}
                  value={dayjs(selectedDate)}
                  onChange={handleDateChange}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px'
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Box>
        <DataGrid
          autoHeight
          loading={loading}
          getRowHeight={() => 'auto'}
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
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          onPaginationModelChange={params => {
            setPage(params.page + 1)
            setLimit(params.pageSize)
          }}
          slots={{
            loadingOverlay: Loader,
            noRowsOverlay: CustomNoRowsOverlay,
            noResultsOverlay: CustomNoRowsOverlay
          }}
          sx={{
            // height: 'auto',
            border: '0.5px solid #80808047',
            '& .super-app-theme--header': {
              backgroundColor: '#2c3ce3',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04)
              }
            },
            '& .row-approved': {
              backgroundColor: alpha(theme.palette.success.main, 0.12)
            },
            '& .row-rejected': {
              backgroundColor: alpha(theme.palette.error.main, 0.12)
            },
            '& .row-pending': {
              backgroundColor: alpha(theme.palette.warning.main, 0.12)
            }
          }}
        />
      </Box>
    </Box>
  )
}
