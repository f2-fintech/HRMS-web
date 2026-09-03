/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable padding-line-between-statements */
'use client'

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
  useTheme,
  alpha,
  MenuItem,
  IconButton
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import DialogTitle from '@mui/material/DialogTitle'
import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import CloseIcon from '@mui/icons-material/Close'
import dayjs, { Dayjs } from 'dayjs'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchLeaves } from '@/redux/features/leaves/leavesSlice'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import AddLeavesForm from '@/components/leave/LeaveForm'
import Loader from '@/components/loader/loader'
import AccordionLeaves from '@/components/leave/AccordionLeaves'
import useDebounce from '@/utility/debounce/useDebounce'
import { utility } from '@/utility'
import LeaveBalancePanel from '@/components/leave/LeaveBalancePanel'
import HighLeaveListButton from '@/components/HighLeaveListButton'

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
  const gridRef = useRef<any>(null)

  const dispatch = useDispatch<AppDispatch>()
  const { leaves, total, loading } = useSelector((state: RootState) => state.leaves)

  const [showForm, setShowForm] = useState(false)
  const [selectedLeaves, setSelectedLeaves] = useState<string | null>(null)

  const [authUser] = useState<any>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })

  const userRole = String(authUser?.role ?? '')
  const userId = String(authUser?.id ?? '')

  const [employees, setEmployees] = useState<any[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedEmployeeForBalance, setSelectedEmployeeForBalance] = useState<string | null>(null)

  // ✅ button toggle state (default closed for everyone)
  const [showBalance, setShowBalance] = useState(false)

  const month = selectedDate.format('MM')
  const year = selectedDate.format('YYYY')
const sm = Number(month)
const y = Number(year)
  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue) setSelectedDate(newValue)
  }

  const debouncedKeyword = useDebounce(selectedKeyword, 500)

  // ✅ Fetch leaves (Admin month wise, others yearly)
  useEffect(() => {
    if (!userRole) return

    if (userRole === '1') {
      dispatch(fetchLeaves({ page, limit, month, year, keyword: debouncedKeyword }))
    } else if (Number(userRole) > 1) {
      dispatch(fetchLeaves({ page, limit, month: '0', year, keyword: debouncedKeyword }))
    }
  }, [dispatch, page, limit, debouncedKeyword, month, year, userRole])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }, [])

  // ✅ Admin/HR -> employees list fetch (for dropdown)
  useEffect(() => {
    if (Number(userRole) < 3 && employees.length === 0) {
      const fetchEmployeesData = async () => {
        const employeeData = await apiResponse()
        setEmployees(employeeData || [])
      }
      fetchEmployeesData()
    }
  }, [userRole, employees.length])

  const balanceEmployeeId = useMemo(() => {
    if (Number(userRole) === 1) return selectedEmployeeForBalance
    return userId 
  }, [userRole, userId, selectedEmployeeForBalance])

  const canShowBalance = useMemo(() => {
    if (Number(userRole) === 1) return !!selectedEmployeeForBalance
    return !!userId
  }, [userRole, selectedEmployeeForBalance, userId])

  const handleLeaveAddClick = useCallback(() => {
    setSelectedLeaves(null)
    setShowForm(true)
  }, [])

  const handleLeaveEditClick = useCallback((id: string) => {
    setSelectedLeaves(id)
    setShowForm(true)
  }, [])

  const handleLeavedelete = async (id: string) => {
    const { isTokenExpired } = utility()
    let token: string | null = null
    const { company_id } = typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user') as any) : {}

    if (typeof window !== 'undefined') token = localStorage?.getItem('token')

    if (!token || isTokenExpired(token)) {
      if (token) localStorage.removeItem('token')
      window.location.href = '/login'
      return
    }

    const confirmDelete = confirm('Are you sure you want to delete this leave?')
    if (!confirmDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/leaves/delete/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Leave deleted successfully.')
        dispatch(fetchLeaves({ page, limit, month, year, keyword: selectedKeyword }))
      } else {
        const errorResult = await response.json()
        toast.error(errorResult.message || 'Failed to delete leave.')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred while deleting leave.')
    }
  }

  const handleClose = useCallback(() => setShowForm(false), [])

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

  const generateColumns = useMemo(() => {
    const baseColumnStyles: any = {
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      sortable: false,
      flex: 1,
      renderCell: (params: any) => (
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
              renderCell: (params: any) => (
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
              renderCell: params => <Typography fontWeight='bold'>{parseFloat(params.value)}</Typography>
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
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
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
              sortable: false
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
                return (
                  <>
                    <Button variant='outlined' onClick={() => setOpen(true)}>
                      View
                    </Button>
                    <BootstrapDialog onClose={() => setOpen(false)} open={open}>
                      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 600, fontSize: '1.25rem', color: 'primary.main' }}>
                        Application
                      </DialogTitle>
                      <IconButton
                        aria-label='close'
                        onClick={() => setOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8, color: theme => theme.palette.grey[500] }}
                      >
                        <CloseIcon />
                      </IconButton>
                      <DialogContent sx={{ p: 3, minWidth: 400, maxHeight: 500, overflowY: 'auto' }}>
                        <Typography sx={{ fontSize: '1rem', lineHeight: 1.6, color: 'text.primary' }}>
                          {params.row.application}
                        </Typography>
                      </DialogContent>
                    </BootstrapDialog>
                  </>
                )
              }
            },
            { field: 'status', headerName: 'Status', flex: 1, headerAlign: 'center', headerClassName: 'super-app-theme--header', sortable: false },
            { field: 'reason', headerName: 'Decision', flex: 1, headerAlign: 'center', headerClassName: 'super-app-theme--header', sortable: false }
          ])
    ]
  }, [userRole, handleLeaveEditClick, handleLeavedelete])

  const rows = useMemo(() => {
    return (leaves || [])
      .filter((leave: any) => leave && leave.day && leave.start_date)
      .map((leave: any) => ({
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

        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
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
              <Typography variant='subtitle1' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Dashboard / Leave
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                width: { xs: '100%', md: 'auto' }
              }}
            >
              {/* ✅ Admin dropdown */}
              {userRole === '1' && (
                <TextField
                  select
                  size='small'
                  label='Employee (Leave Balance)'
                  value={selectedEmployeeForBalance || ''}
                  onChange={e => {
                    setSelectedEmployeeForBalance(e.target.value)
                    setShowBalance(true)
                  }}
                  sx={{ minWidth: { xs: '100%', sm: 260, md: 300 } }}
                >
                  {(employees || []).map((emp: any) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      {emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.name || emp.email || emp._id}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {/* ✅ Employee/User button */}
              {userRole !== '1' && (
                <StyledButton
                  variant='outlined'
                  color='primary'
                  onClick={() => setShowBalance(prev => !prev)}
                >
                  {showBalance ? 'Hide Leave Balance' : 'View Leave Balance'}
                </StyledButton>
              )}

              {/* ✅ Admin also can toggle if selected */}
              {userRole === '1' && !!selectedEmployeeForBalance && (
                <StyledButton
                  variant='outlined'
                  color='primary'
                  onClick={() => setShowBalance(prev => !prev)}
                >
                  {showBalance ? 'Hide Leave Balance' : 'View Leave Balance'}
                </StyledButton>
              )}

              {userRole === '1' && (
  <HighLeaveListButton month={sm} year={y} threshold={1.5} title='High Leave + Absent' />
)}

              <StyledButton variant='contained' color='primary' startIcon={<AddIcon />} onClick={handleLeaveAddClick}>
                Apply Leave
              </StyledButton>
            </Box>
          </Box>

          {/* Search + Date */}
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
                      '&:hover': { backgroundColor: theme.palette.background.paper }
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
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Box>

        {canShowBalance && showBalance && !!balanceEmployeeId && (
          <Box sx={{ mb: 3 }}>
            <LeaveBalancePanel
              employeeId={balanceEmployeeId}
              year={year}
              selectedMonth={month}
              title='Leave Balance (18/year • 1.5/month)'
              onClose={() => setShowBalance(false)}
            />
          </Box>
        )}

        <DataGrid
          autoHeight
          loading={loading}
          getRowHeight={() => 'auto'}
          rows={userRole === '1' ? leaves : rows}
          columns={generateColumns}
          getRowId={row => {
            if (userRole === '1') return row._id && row._id._id ? row._id._id : row._id
            return row._id
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
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) }
            }
          }}
        />
      </Box>
    </Box>
  )
}
