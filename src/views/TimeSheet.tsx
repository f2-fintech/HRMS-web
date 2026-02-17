'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Button,
  Typography,
  Box,
  TextField,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  IconButton,
  Pagination,
  Grid,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material'
import Tooltip from '@mui/material/Tooltip'

import { useDispatch, useSelector } from 'react-redux'
import { Add, Remove, ExpandLess, ExpandMore } from '@mui/icons-material'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchTimeSheet, filterTimesheet, resetFilter } from '@/redux/features/timesheet/timesheetSlice'
import { fetchAttendances, fetchEmployeeAttendances } from '@/redux/features/attendances/attendancesSlice'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'

export default function TimeSheetGrid() {
  const dispatch: AppDispatch = useDispatch()

  const { timesheets, attendances, filteredTimesheet } = useSelector((state: RootState) => ({
    timesheets: state.timesheets.timesheets,
    employees: state.employees.employees,
    attendances: state.attendances.attendances,
    filteredTimesheet: state.timesheets.filteredTimesheet
  }))

  const [editableRows, setEditableRows] = useState({})
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [dirty, setDirty] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [searchName, setSearchName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [employees, setEmployees] = useState([])
  const [expandedRows, setExpandedRows] = useState({})

  const ITEMS_PER_PAGE = useMemo(() => (Number(userRole) <= 2 ? 10 : 6), [userRole])

  const debouncedSearch = useCallback(
    debounce(() => {
      console.log('Debounced search triggered')
      dispatch(filterTimesheet({ name: searchName, status: selectedStatus, month }))
    }, 300),
    [searchName, selectedStatus, month]
  )

  useEffect(() => {
    debouncedSearch()

    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleInputChange = (e, field) => {
    if (field === 'searchName') {
      setSearchName(e.target.value)
    } else if (field === 'selectedStatus') {
      setSelectedStatus(e.target.value === 'All' ? '' : e.target.value)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (timesheets.length === 0) {
        dispatch(fetchTimeSheet())
      }

      const fetchEmployeesData = async () => {
        const data = await apiResponse()

        setEmployees(data)
      }

      fetchEmployeesData()

      if (Number(userRole) >= 3) {
        if (attendances.length === 0) {
          await dispatch(fetchEmployeeAttendances({ employeeId: userId, month: '' }))
        }
      } else {
        if (attendances.length === 0) {
          const response = await dispatch(fetchAttendances())
        }
      }
    }

    fetchData()
  }, [dispatch, userId, userRole, timesheets.length, attendances.length, employees.length])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
    setUserId(user.id)
  }, [])

  const toggleRow = employee_id => {
    setExpandedRows(prev => ({
      ...prev,
      [employee_id]: !prev[employee_id]
    }))
  }

  const handleEditClick = row => {
    const isAttendance =
      row.attendance_status === 'Present' ||
      row.attendance_status === 'On Half' ||
      row.attendance_status === 'On Wfh' ||
      row.attendance_status === 'On Field'
    const isTimeSheet = row._id !== null

    if (isAttendance || isTimeSheet) {
      setEditableRows(prev => ({
        ...prev,
        [row._id || row.attendance_id]: {
          time: row.time || '0',
          startShift: row.startShift || '09:00',
          endShift: row.endShift || '00:00',
          status: row.status || 'Pending',
          note: row.note || '',
          submission_date: row.submission_date || '',
          attendance: row.attendance_id,
          employee: row.employee_id
        }
      }))
    }

    setDirty(false)
  }

  const handleChange = (e, id) => {
    const { name, value } = e.target

    setEditableRows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [name]: value
      }
    }))
  }

  const handleIncrementTime = id => {
    setEditableRows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        time: (parseInt(prev[id].time, 10) + 1).toString()
      }
    }))
  }

  const handleDecrementTime = id => {
    setEditableRows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        time: Math.max(0, parseInt(prev[id].time, 10) - 1).toString()
      }
    }))
  }

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2)
    const minutes = i % 2 === 0 ? '00' : '30'

    return `${String(hours).padStart(2, '0')}:${minutes}`
  })

  const getNextTime = currentTime => {
    const index = timeOptions.indexOf(currentTime)

    return index < timeOptions.length - 1 ? timeOptions[index + 1] : timeOptions[0]
  }

  const getPreviousTime = currentTime => {
    const index = timeOptions.indexOf(currentTime)

    return index > 0 ? timeOptions[index - 1] : timeOptions[timeOptions.length - 1]
  }

  const handleIncrementShiftTime = (id, field) => {
    setEditableRows(prev => {
      const updatedRow = {
        ...prev[id],
        [field]: getNextTime(prev[id][field] || '09:00')
      }
      const hasValidShifts = updatedRow.startShift && updatedRow.endShift && updatedRow.endShift !== '00:00'
      const calculatedTime = hasValidShifts ? calculateTimeDifference(updatedRow.startShift, updatedRow.endShift) : '0'

      const totalMinutes = hasValidShifts ? timeToMinutes(calculatedTime) : 0

      let updatedStatus = updatedRow.status
      if (totalMinutes >= 540) {
        updatedStatus = 'Approved'
      } else if (updatedStatus === 'Approved') {
        updatedStatus = 'Pending'
      }

      return {
        ...prev,
        [id]: {
          ...updatedRow,
          time: calculatedTime,
          status: updatedStatus
        }
      }
    })
  }

  const handleDecrementShiftTime = (id, field) => {
    setEditableRows(prev => {
      const updatedRow = {
        ...prev[id],
        [field]: getPreviousTime(prev[id][field] || '09:00')
      }

      const hasValidShifts = updatedRow.startShift && updatedRow.endShift && updatedRow.endShift !== '00:00'
      const calculatedTime = hasValidShifts ? calculateTimeDifference(updatedRow.startShift, updatedRow.endShift) : '0'

      const totalMinutes = hasValidShifts ? timeToMinutes(calculatedTime) : 0
      let updatedStatus = updatedRow.status
      if (totalMinutes >= 540) {
        updatedStatus = 'Approved'
      } else if (updatedStatus === 'Approved') {
        updatedStatus = 'Pending'
      }

      return {
        ...prev,
        [id]: {
          ...updatedRow,
          time: calculatedTime,
          status: updatedStatus
        }
      }
    })
  }

  const calculateTimeDifference = (startShift, endShift) => {
    if (!startShift || !endShift || endShift === '00:00') return '0'

    const [startHours, startMinutes] = startShift.split(':').map(Number)
    const [endHours, endMinutes] = endShift.split(':').map(Number)

    const startDate = new Date(0, 0, 0, startHours, startMinutes, 0)
    const endDate = new Date(0, 0, 0, endHours, endMinutes, 0)

    let diff = endDate - startDate

    if (diff < 0) {
      diff += 24 * 60 * 60 * 1000
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  const timeToMinutes = time => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const handleShiftChange = (id, field, value) => {
    setEditableRows(prev => {
      const updatedRow = {
        ...prev[id],
        [field]: value
      }
      const hasValidShifts = updatedRow.startShift && updatedRow.endShift && updatedRow.endShift !== '00:00'
      const calculatedTime = hasValidShifts ? calculateTimeDifference(updatedRow.startShift, updatedRow.endShift) : '0'
      const totalMinutes = hasValidShifts ? timeToMinutes(calculatedTime) : 0
      let updatedStatus = updatedRow.status

      if (totalMinutes >= 540) {
        updatedStatus = 'Approved'
      } else if (totalMinutes < 540 && updatedStatus === 'Approved') {
        updatedStatus = 'Pending'
      }

      return {
        ...prev,
        [id]: {
          ...updatedRow,
          time: calculatedTime,
          status: updatedStatus
        }
      }
    })
  }

  const handleSaveAll = () => {
    const hasLessThanNineHours = Object.values(editableRows).some(row => parseInt(row.time, 10) < 9)

    if (hasLessThanNineHours) {
      const confirmation = window.confirm('Some entries have less than 9 hours marked. Are you sure you want to save?')

      if (!confirmation) {
        return
      }
    }

    const savePromises = Object.keys(editableRows).map(id => {
      const row = editableRows[id]
      let updatedStatus = row.status
      if (timeToMinutes(row.time) >= 540) {
        updatedStatus = 'Approved'
      } else if (timeToMinutes(row.time) < 540 && updatedStatus === 'Approved') {
        updatedStatus = 'Pending'
      }
      const method = id.toString() !== row.attendance ? 'PUT' : 'POST'
      const url =
        id.toString() !== row.attendance
          ? `${process.env.NEXT_PUBLIC_APP_URL}/timesheets/update/${id}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/timesheets/create`

      return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...row,
          status: updatedStatus
        })
      }).then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message)
          })
        }

        return response.json()
      })
    })

    Promise.all(savePromises)
      .then(results => {
        toast.success(results[0].message, {
          position: 'top-center'
        })
        setDirty(true)
        setEditableRows({})
        dispatch(fetchTimeSheet()).then(() => {
          dispatch(filterTimesheet({ name: searchName, status: selectedStatus, month }))
        })
      })
      .catch(error => {
        toast.error('Error: ' + error.message, {
          position: 'top-center'
        })
      })
  }

  const transformData = () => {
    const filteredAttendances = attendances.filter(att => new Date(att.date).getMonth() + 1 === month)

    const updatedData = filteredAttendances
      .filter(attendance => {
        return employees.some(emp => emp._id === attendance.employee?._id)
      })
      .map(attendance => {
        const timesheet = timesheets.find(ts => ts.attendance?._id === attendance._id)
        const employee = employees.find(emp => emp._id === attendance.employee?._id)

        const startShift = timesheet ? timesheet.startShift : '00:00'
        const endShift = timesheet ? timesheet.endShift : ''

        const calculatedTime = calculateTimeDifference(startShift, endShift)

        return {
          _id: timesheet ? timesheet._id : null,
          employee_id: employee ? employee._id : '',
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : '',
          employee_image: employee ? employee.image : '',
          attendance_id: attendance._id,
          attendance_date: attendance.date,
          attendance_status: attendance.status,
          time: calculatedTime,
          startShift: timesheet ? timesheet.startShift : '09:00',
          endShift: endShift,
          status: timesheet ? timesheet.status : 'Pending',
          note: timesheet ? timesheet.note : '',
          submission_date: timesheet ? timesheet.submission_date : ''
        }
      })

    updatedData.sort((a, b) => a.employee_name.localeCompare(b.employee_name))

    return updatedData
  }

  const rows = transformData()

  const userRows = Number(userRole) >= 3 ? rows.filter(row => row.employee_id === userId) : rows
  const paginatedUserRows = userRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const groupedRows = userRows.reduce((acc, row) => {
    const employeeId = row.employee_id

    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee_name: row.employee_name,
        employee_image: row.employee_image,
        timesheets: []
      }
    }

    acc[employeeId].timesheets.push(row)

    return acc
  }, {})

  const employeeIds = Object.keys(groupedRows)

  const filteredEmployeeIds = employeeIds.filter(employee_id => {
    const employee = groupedRows[employee_id]
    const fullName = `${employee.employee_name}`.toLowerCase()

    const statusMatches =
      !selectedStatus || employee.timesheets.some(row => row.status.toLowerCase() === selectedStatus.toLowerCase())

    const nameMatches = !searchName || fullName.includes(searchName.toLowerCase())

    return nameMatches && statusMatches
  })

  const employeeCount = filteredEmployeeIds.length

  const pageCount =
    userRole <= 2 ? Math.ceil(employeeCount / ITEMS_PER_PAGE) : Math.ceil(userRows.length / ITEMS_PER_PAGE)

  const paginatedRows =
    userRole <= 2
      ? filteredEmployeeIds.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(id => groupedRows[id])
      : userRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleCancelEdit = id => {
    setEditableRows(prev => {
      const { [id]: value, ...rest } = prev

      return rest
    })
  }

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Time Sheet
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Time Sheet
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'center',
              alignItems: 'center',
              mt: 2,
              gap: 2
            }}
          >
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel required id='demo-simple-select-label'>
                Month
              </InputLabel>
              <Select
                label='Select Month'
                labelId='demo-simple-select-label'
                id='demo-simple-select'
                value={month}
                onChange={e => setMonth(e.target.value)}
              >
                <MenuItem value={1}>January</MenuItem>
                <MenuItem value={2}>February</MenuItem>
                <MenuItem value={3}>March</MenuItem>
                <MenuItem value={4}>April</MenuItem>
                <MenuItem value={5}>May</MenuItem>
                <MenuItem value={6}>June</MenuItem>
                <MenuItem value={7}>July</MenuItem>
                <MenuItem value={8}>August</MenuItem>
                <MenuItem value={9}>September</MenuItem>
                <MenuItem value={10}>October</MenuItem>
                <MenuItem value={11}>November</MenuItem>
                <MenuItem value={12}>December</MenuItem>
              </Select>
            </FormControl>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(event, value) => setPage(value)}
              variant='outlined'
              shape='rounded'
              color='primary'
              sx={{ mt: { xs: 2, md: 0 } }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          <Button
            variant='contained'
            disabled={dirty}
            color='primary'
            onClick={handleSaveAll}
            sx={{ alignSelf: { xs: 'stretch', md: 'flex-start' }, mb: { xs: 2, md: 0 } }}
          >
            Save
          </Button>
          <Grid container spacing={2}>
            {Number(userRole) <= 2 && (
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Employee Name'
                  variant='outlined'
                  value={searchName}
                  onChange={e => handleInputChange(e, 'searchName')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id='status-select-label'>Status</InputLabel>
                <Select
                  labelId='status-select-label'
                  id='status-select'
                  value={selectedStatus === '' ? 'All' : selectedStatus}
                  label='Status'
                  onChange={e => handleInputChange(e, 'selectedStatus')}
                >
                  <MenuItem value='All'>All</MenuItem>
                  <MenuItem value='Pending'>Pending</MenuItem>
                  <MenuItem value='Approved'>Approved</MenuItem>
                  <MenuItem value='Rejected'>Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <TableContainer component={Paper}>
          <Table>
            {Number(userRole) >= 2 && (
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '1.1em', textAlign: 'center' }}>Attendance Date</TableCell>
                  <TableCell sx={{ fontSize: '1.1em', textAlign: 'center' }}>Attendance Status</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontSize: '1.1em' }}>Shift Start</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontSize: '1.1em' }}>Shift End</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontSize: '1.1em' }}>Time Hours</TableCell>
                  <TableCell sx={{ fontSize: '1.1em', textAlign: 'center' }}>TimeSheet Status</TableCell>
                  <TableCell sx={{ fontSize: '1.1em', textAlign: 'center' }}>Note</TableCell>
                  <TableCell sx={{ fontSize: '1.1em', textAlign: 'center' }}>Submission Date</TableCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {Number(userRole) <= 2
                ? paginatedRows.map(employee => (
                  <React.Fragment key={employee.employee_name}>
                    <TableRow>
                      <TableCell
                        sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}
                        onClick={() => toggleRow(employee.timesheets[0].employee_id)}
                      >
                        <Box display='flex' alignItems='center'>
                          <Avatar src={employee.employee_image} alt={employee.employee_name} sx={{ mr: 2 }} />
                          {employee.employee_name}
                          <IconButton>
                            {expandedRows[employee.timesheets[0].employee_id] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell colSpan={6}></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={expandedRows[employee.timesheets[0].employee_id]} timeout='auto' unmountOnExit>
                          <Box margin={1}>
                            <Table size='small' aria-label='purchases'>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontSize: '1em', textAlign: 'center' }}>Attendance Date</TableCell>
                                  <TableCell sx={{ fontSize: '1em', textAlign: 'center' }}>
                                    Attendance Status
                                  </TableCell>
                                  <TableCell sx={{ textAlign: 'center', fontSize: '1.1em' }}>Shift Start</TableCell>
                                  <TableCell sx={{ textAlign: 'center', fontSize: '1.1em' }}>Shift End</TableCell>
                                  <TableCell sx={{ fontSize: '1em', textAlign: 'center' }}>Time Hours</TableCell>
                                  <TableCell sx={{ fontSize: '1em', textAlign: 'center' }}>
                                    TimeSheet Status
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '1em', textAlign: 'center' }}>Note</TableCell>
                                  <TableCell sx={{ fontSize: '1em', textAlign: 'center' }}>Submission Date</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {employee.timesheets.map(row => (
                                  <TableRow key={row._id || row.attendance_id}>
                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em' }}>
                                      {row.attendance_date}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em' }}>
                                      {row.attendance_status}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <Box display='flex' alignItems='center'>
                                          <IconButton
                                            onClick={() =>
                                              handleDecrementShiftTime(row._id || row.attendance_id, 'startShift')
                                            }
                                          >
                                            <Remove />
                                          </IconButton>
                                          <TextField
                                            name='startShift'
                                            value={editableRows[row._id || row.attendance_id].startShift}
                                            onChange={e =>
                                              handleShiftChange(
                                                row._id || row.attendance_id,
                                                'startShift',
                                                e.target.value
                                              )
                                            }
                                            style={{ width: '70px' }}
                                          />
                                          <IconButton
                                            onClick={() =>
                                              handleIncrementShiftTime(row._id || row.attendance_id, 'startShift')
                                            }
                                          >
                                            <Add />
                                          </IconButton>
                                        </Box>
                                      ) : (
                                        <Tooltip title='Click to edit shift start'>
                                          <span
                                            style={{ border: '1px black solid', padding: '5px 10px 5px 10px' }}
                                            onClick={() => handleEditClick(row)}
                                          >
                                            {row.startShift || '09:00'}
                                          </span>
                                        </Tooltip>
                                      )}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <Box display='flex' alignItems='center'>
                                          <IconButton
                                            onClick={() =>
                                              handleDecrementShiftTime(row._id || row.attendance_id, 'endShift')
                                            }
                                          >
                                            <Remove />
                                          </IconButton>
                                          <TextField
                                            name='endShift'
                                            value={editableRows[row._id || row.attendance_id].endShift}
                                            onChange={e =>
                                              handleShiftChange(
                                                row._id || row.attendance_id,
                                                'endShift',
                                                e.target.value
                                              )
                                            }
                                            style={{ width: '70px' }}
                                          />
                                          <IconButton
                                            onClick={() =>
                                              handleIncrementShiftTime(row._id || row.attendance_id, 'endShift')
                                            }
                                          >
                                            <Add />
                                          </IconButton>
                                        </Box>
                                      ) : (
                                        <Tooltip title='Click to edit shift end'>
                                          <span
                                            style={{ border: '1px black solid', padding: '5px 10px 5px 10px' }}
                                            onClick={() => handleEditClick(row)}
                                          >
                                            {row.endShift || '00:00'}
                                          </span>
                                        </Tooltip>
                                      )}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <span>{editableRows[row._id || row.attendance_id].time} hours</span>
                                      ) : (
                                        <span>{row.time || '0'}</span>
                                      )}
                                    </TableCell>

                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <Select
                                          name='status'
                                          value={editableRows[row._id || row.attendance_id].status}
                                          onChange={e => handleChange(e, row._id || row.attendance_id)}
                                        >
                                          <MenuItem value='Pending'>PENDING</MenuItem>
                                          <MenuItem value='Approved'>APPROVED</MenuItem>
                                          <MenuItem value='Rejected'>REJECTED</MenuItem>
                                        </Select>
                                      ) : (
                                        <Tooltip title='Click to Edit & View status'>
                                          <span>{row.status || 'Pending'}</span>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <Tooltip title='Edit note'>
                                          <TextField
                                            name='note'
                                            value={editableRows[row._id || row.attendance_id].note}
                                            onChange={e => handleChange(e, row._id || row.attendance_id)}
                                            style={{ width: '100%' }}
                                          />
                                        </Tooltip>
                                      ) : (
                                        <Tooltip title='Click to view or edit note'>
                                          <span onClick={() => handleEditClick(row)}>{row.note || ''}</span>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <TextField
                                          name='submission_date'
                                          type='date'
                                          value={editableRows[row._id || row.attendance_id].submission_date}
                                          onChange={e => handleChange(e, row._id || row.attendance_id)}
                                          style={{ width: '100%' }}
                                        />
                                      ) : (
                                        <Tooltip title='Click to view or edit'>
                                          <span
                                            style={{
                                              whiteSpace: 'nowrap',
                                              border: '1px black solid',
                                              padding: '5px 10px 5px 10px'
                                            }}
                                            onClick={() => handleEditClick(row)}
                                          >
                                            {row.submission_date || ''}
                                          </span>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                                      {editableRows[row._id || row.attendance_id] ? (
                                        <Button
                                          variant='outlined'
                                          color='secondary'
                                          onClick={() => handleCancelEdit(row._id || row.attendance_id)}
                                        >
                                          Cancel
                                        </Button>
                                      ) : null}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <Box display='flex' justifyContent='flex-end' mt={2}>
                              <Button
                                variant='contained'
                                color='primary'
                                disabled={dirty}
                                onClick={() => handleSaveAll()}
                              >
                                Save
                              </Button>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
                : paginatedUserRows
                  .filter(row => {
                    const statusMatches = !selectedStatus || row.status.toLowerCase() === selectedStatus.toLowerCase()

                    return statusMatches
                  })
                  .map(row => (
                    <TableRow key={row._id || row.attendance_id}>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1em' }}>{row.attendance_date}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1em' }}>{row.attendance_status}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {editableRows[row._id || row.attendance_id] ? (
                          <Box display='flex' alignItems='center'>
                            <IconButton
                              onClick={() => handleDecrementShiftTime(row._id || row.attendance_id, 'startShift')}
                            >
                              <Remove />
                            </IconButton>
                            <TextField
                              name='startShift'
                              value={editableRows[row._id || row.attendance_id].startShift}
                              onChange={e =>
                                handleShiftChange(row._id || row.attendance_id, 'startShift', e.target.value)
                              }
                              style={{ width: '70px' }}
                            />
                            <IconButton
                              onClick={() => handleIncrementShiftTime(row._id || row.attendance_id, 'startShift')}
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        ) : (
                          <Tooltip title='Click to edit shift start'>
                            <span
                              style={{ border: '1px black solid', padding: '5px 10px 5px 10px' }}
                              onClick={() => handleEditClick(row)}
                            >
                              {row.startShift || '09:00'}
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {editableRows[row._id || row.attendance_id] ? (
                          <Box display='flex' alignItems='center'>
                            <IconButton
                              onClick={() => handleDecrementShiftTime(row._id || row.attendance_id, 'endShift')}
                            >
                              <Remove />
                            </IconButton>
                            <TextField
                              name='endShift'
                              value={editableRows[row._id || row.attendance_id].endShift}
                              onChange={e =>
                                handleShiftChange(row._id || row.attendance_id, 'endShift', e.target.value)
                              }
                              style={{ width: '70px' }}
                            />
                            <IconButton
                              onClick={() => handleIncrementShiftTime(row._id || row.attendance_id, 'endShift')}
                            >
                              <Add />
                            </IconButton>
                          </Box>
                        ) : (
                          <Tooltip title='Click to edit shift end'>
                            <span
                              style={{ border: '1px black solid', padding: '5px 10px 5px 10px' }}
                              onClick={() => handleEditClick(row)}
                            >
                              {row.endShift || '00:00'}
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {editableRows[row._id || row.attendance_id] ? (
                          <span>{editableRows[row._id || row.attendance_id].time}</span>
                        ) : (
                          <span>{row.time || '0'}</span>
                        )}
                      </TableCell>

                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {userRole >= 3 ? (
                          <span>{row.status || 'Pending'}</span>
                        ) : (
                          <Select
                            name='status'
                            value={editableRows[row._id || row.attendance_id].status}
                            onChange={e => handleChange(e, row._id || row.attendance_id)}
                          >
                            <MenuItem value='Pending'>PENDING</MenuItem>
                            <MenuItem value='Approved'>APPROVED</MenuItem>
                            <MenuItem value='Rejected'>REJECTED</MenuItem>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {editableRows[row._id || row.attendance_id] ? (
                          <TextField
                            name='note'
                            value={editableRows[row._id || row.attendance_id].note}
                            onChange={e => handleChange(e, row._id || row.attendance_id)}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          <span onClick={() => handleEditClick(row)}>{row.note || ''}</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {editableRows[row._id || row.attendance_id] ? (
                          <TextField
                            name='submission_date'
                            type='date'
                            value={editableRows[row._id || row.attendance_id].submission_date}
                            onChange={e => handleChange(e, row._id || row.attendance_id)}
                          />
                        ) : (
                          <span
                            style={{ whiteSpace: 'nowrap', border: '1px black solid', padding: '5px 10px 5px 10px' }}
                            onClick={() => handleEditClick(row)}
                          >
                            {row.submission_date || ''}
                          </span>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontSize: '1em', cursor: 'pointer' }}>
                        {editableRows[row._id || row.attendance_id] ? (
                          <Button
                            variant='outlined'
                            color='secondary'
                            onClick={() => handleCancelEdit(row._id || row.attendance_id)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {Number(userRole) >= 2 && (
            <Box display='flex' justifyContent='flex-end'>
              <Button variant='contained' color='primary' disabled={dirty} onClick={() => handleSaveAll()}>
                Save
              </Button>
            </Box>
          )}
        </TableContainer>
      </Box>
    </Box>
  )
}
