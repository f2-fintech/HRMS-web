'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

import { debounce } from 'lodash';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import CircleIcon from '@mui/icons-material/Circle';

import WeekendIcon from '@mui/icons-material/Weekend';
import {
  Button,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Avatar,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import HomeIcon from '@mui/icons-material/Home';

import ContrastIcon from '@mui/icons-material/Contrast';

import { useDispatch, useSelector } from 'react-redux';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import ClearIcon from '@mui/icons-material/Clear';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { AppDispatch, RootState } from '@/redux/store';
import { fetchAttendances, filterAttendance, addOrUpdateAttendance, resetAttendances } from '@/redux/features/attendances/attendancesSlice';
import AttendanceSummary from '@/utility/attendancesummry/AttendanceSummary';
import EmployeeStatsWithBlinkingStatus from '@/utility/totalempattendancesummary/EmployeeStatsWithBlinkingStatus';
import { AttendanceSummaryColumns } from '@/utility/attendancesummry/AttendanceSummaryColumns';

import Loader from "../components/loader/loader";
import AddAttendanceForm from '@/components/attendance/AttendanceForm';
import DateCalendarServerRequest from '@/components/attendance/DateCalendarServerRequest';
import Legend from '@/components/attendance/Legend';
import AttendanceStatusList from '@/components/attendance/AttendanceStatusList';

export default function AttendanceGrid() {
  const dispatch: AppDispatch = useDispatch();
  const { attendances, loading, error, filteredAttendance, count } = useSelector((state: RootState) => state.attendances);

  const [showForm, setShowForm] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [viewAttendanceData, setViewAttendanceData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [daysToShow, setDaysToShow] = useState(7);
  const [startDayIndex, setStartDayIndex] = useState(0);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchLocation, setSearchLocation] = useState('');

  const [prefillEmployee, setPrefillEmployee] = useState('');
  const [prefillEmployeeName, setPrefillEmployeeName] = useState('');
  const [prefillDate, setPrefillDate] = useState('');

  const debouncedSearch = useCallback(
    debounce(() => {
      dispatch(resetAttendances());
      dispatch(fetchAttendances({ month: month, weekIndex: startDayIndex, page: page, limit: limit, keyword: searchName, location: searchLocation }));
    }, 500),
    [dispatch, searchName, searchLocation]
  );

  useEffect(() => {
    if (searchName !== '' || searchLocation !== '') {
      debouncedSearch();
    }

    return debouncedSearch.cancel;
  }, [searchName, searchLocation, debouncedSearch]);

  const handleInputChange = (e) => {
    const newName = e.target.value
    setSearchName(newName);
    setSearchLocation('')
    if (newName === '') {
      dispatch(fetchAttendances({ month: month, weekIndex: startDayIndex, page: 1, limit: limit, keyword: newName, location: searchLocation }));
      dispatch(resetAttendances());
    }
  };

  const handleLocationInputChange = (e) => {
    const newLocation = e.target.value;
    setSearchLocation(newLocation);
    setSearchName('');
    if (newLocation === '') {
      dispatch(fetchAttendances({ month: month, weekIndex: startDayIndex, page: 1, limit: limit, keyword: searchName, location: newLocation }));
      dispatch(resetAttendances());
    }
  };

  useEffect(() => {
    if (userRole === '1') {
      dispatch(fetchAttendances({ month: month, weekIndex: startDayIndex, page: page, limit: limit, keyword: searchName, location: searchLocation }));
    }
  }, [dispatch, month, startDayIndex, page, limit, userRole]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setUserRole(user.role);
    setUserId(user.id);
  }, []);

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage + 1);
    setLimit(newPageSize);
  };

  const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
    handlePageChange(params.page, params.pageSize);
  };

  const handleAttendanceAddClick = (employeeId = '', employeeName = '', day) => {
    const date = dayjs(new Date(new Date().getFullYear(), month - 1, day)).format('YYYY-MM-DD');

    setSelectedAttendance(null);
    setShowForm(true);
    setPrefillEmployee(employeeId);
    setPrefillEmployeeName(employeeName);
    setPrefillDate(date);
  };


  const handleAttendanceEditClick = (id: React.SetStateAction<null>) => {
    setSelectedAttendance(id);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setViewAttendanceData(null);
  };

  const handleViewClick = (id: string) => {

    const employeeAttendances = attendances
      .filter(att => {
        return att.employee._id === id;
      })

      .reduce((acc, { date, status }) => {
        acc[date] = status;

        return acc;
      }, {} as Record<string, string>);



    if (Object.keys(employeeAttendances).length > 0) {
      setViewAttendanceData(employeeAttendances);
    } else {
      console.log('No attendance found for Employee ID:', id);
    }
  };

  const handleNextDaysClick = () => {
    setStartDayIndex((prev) => Math.min(prev + daysToShow, 31 - daysToShow));
  };

  const handlePreviousDaysClick = () => {
    setStartDayIndex((prev) => Math.max(prev - daysToShow, 0));
  };

  const attendanceData = attendances
    .filter(att => att.employee?._id === userId)
    .reduce((acc, { date, status }) => {
      acc[date] = status;

      return acc;
    }, {});

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getLastSundayOfMonth = (month: number, year: number) => {
    const lastDayOfMonth = new Date(year, month, 0);
    const dayOfWeek = lastDayOfMonth.getDay();
    const lastSunday = lastDayOfMonth.getDate() - dayOfWeek;

    return lastSunday;
  };

  const generateColumns = () => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(month, today.getFullYear());
    const visibleDays: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1).slice(startDayIndex, startDayIndex + daysToShow);
    const lastSunday = getLastSundayOfMonth(month, today.getFullYear());

    const columns: GridColDef[] = [
      {
        field: 'name',
        headerName: 'Employee',
        width: 170,
        headerClassName: 'super-app-theme--header',
        sortable: true,
        renderCell: (params) => (
          <Box display="flex" alignItems="center">
            <Avatar src={params.row.image} alt={params.row.name} sx={{ m: 2, mt: 8 }} />
            <Typography>{params.row.name}</Typography>
          </Box>
        ),
      },
      ...visibleDays.map(day => {
        const cellDate = new Date(today.getFullYear(), month - 1, day);
        const isFutureDate = cellDate > today;

        return {
          field: `day_${day}`,
          headerName: `${day}`,
          headerAlign: 'center',
          align: 'center',
          headerClassName: 'super-app-theme--header',
          renderCell: (params) => {
            const status = params.row[`day_${day}`];
            const attendanceId = params.row[`day_${day}_id`];
            const employeeId = params.row.employee_id;
            const employeeName = params.row.name;
            const isSunday = cellDate.getDay() === 0;


            if (!status && !isSunday && !isFutureDate) {
              return (
                <Button
                  style={{ color: 'blue', marginTop: '30%' }}
                  onClick={() => handleAttendanceAddClick(employeeId, employeeName, day)}
                >
                  Mark
                </Button>
              );
            }

            if (isSunday && !status) {

              return (
                <WeekendIcon
                  style={{ color: 'blue', marginTop: '35%', cursor: 'pointer' }}
                  onClick={() => handleAttendanceAddClick(employeeId, employeeName, day)}
                />
              );
            } else if (day === lastSunday) {

              if (status === 'Present') {
                return <CheckCircleIcon style={{ color: 'green', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'Absent') {
                return <CancelIcon style={{ color: 'red', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Leave') {
                return <PauseCircleOutlineIcon style={{ color: 'orange', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Half') {
                return <ContrastIcon style={{ color: 'green', fontSize: '1.5em', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Field') {
                return <DirectionsRunIcon style={{ color: '##673ab7', fontSize: '1.5em', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Wfh') {
                return <HomeIcon style={{ color: 'rgb(247, 51, 120)', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              }
              else if (!status && !isFutureDate) {
                return (
                  <Button
                    style={{ color: 'blue', marginTop: '35%' }}
                    onClick={() => handleAttendanceAddClick(employeeId, employeeName, day)}
                  >
                    Mark
                  </Button>
                );
              }
            } else {

              if (status === 'Present') {
                return <CheckCircleIcon style={{ color: 'green', marginTop: '35%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'Absent') {
                return <CancelIcon style={{ color: 'red', marginTop: '35%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Leave') {
                return <PauseCircleOutlineIcon style={{ color: 'orange', marginTop: '35%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Field') {
                return <DirectionsRunIcon style={{ color: '##673ab7', fontSize: '1.5em', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else if (status === 'On Wfh') {
                return <HomeIcon style={{ color: 'rgb(247, 51, 120)', marginTop: '30%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              }
              else if (status === 'On Half') {
                return <ContrastIcon style={{ color: 'green', fontSize: '1.5em', marginTop: '35%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else {
                return null;
              }
            }
          }
        };
      }),


      ...AttendanceSummaryColumns,
    ];

    return columns;
  };


  const transformData = () => {
    const attendanceSource = attendances;

    const groupedData = attendanceSource.reduce((acc, curr) => {
      const { employee, date, status, timeComplete, _id } = curr;

      if (!employee) {
        return acc;
      }

      const attendanceDate = new Date(date);
      const day = attendanceDate.getDate();
      const attendanceMonth = attendanceDate.getMonth() + 1;

      const uniqueKey = `${employee._id}-${day}-${attendanceMonth}`;

      if (attendanceMonth !== month) {
        return acc;
      }

      if (!acc[employee._id]) {
        acc[employee._id] = {
          employee_id: employee._id,
          name: `${employee.first_name} ${employee.last_name}`,
          image: employee.image,
          present: 0,
          presentNotCompleted: 0,
          absent: 0,
          onHalf: 0,
          onHalfNotCompleted: 0,
          onLeave: 0,
          onField: 0,
          onWfh: 0,
          _id,
        };
      }

      if (!acc[employee._id][uniqueKey]) {
        acc[employee._id][uniqueKey] = true;

        acc[employee._id][`day_${day}`] = status;
        acc[employee._id][`day_${day}_id`] = _id;
        acc[employee._id][`day_${day}_timeComplete`] = timeComplete;



        if (status === 'Present') {
          acc[employee._id].present += 1;

          if (timeComplete === 'Not Completed') {
            acc[employee._id].presentNotCompleted += 1;
          }
        } else if (status === 'Absent') {
          acc[employee._id].absent += 1;
        } else if (status === 'On Half') {
          acc[employee._id].onHalf += 1;

          if (timeComplete === 'Not Completed') {
            acc[employee._id].onHalfNotCompleted += 1;
          }
        } else if (status === 'On Leave') {
          acc[employee._id].onLeave += 1;
        } else if (status === 'On Field') {
          acc[employee._id].onField += 1;
        } else if (status === 'On Wfh') {
          acc[employee._id].onWfh += 1;
        }
      }

      return acc;
    }, {});

    const sortedData = Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));

    return sortedData;
  };

  const columns = generateColumns();
  const rows = transformData();

  const handleMonthChange = (date: Dayjs) => {
    const newMonth = date.month() + 1;

    setMonth(newMonth);
  };

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddAttendanceForm
              attendance={selectedAttendance}
              handleClose={handleClose}
              prefillEmployee={prefillEmployee}
              prefillEmployeeName={prefillEmployeeName}
              prefillDate={prefillDate}
              attendances={attendances}
            />

          </DialogContent>
        </Dialog>

        {/* Attendance Summary View */}
        <Dialog open={!!viewAttendanceData} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            {viewAttendanceData && (
              <AttendanceSummary
                attendanceData={viewAttendanceData}
                selectedMonth={month}
                onClose={handleClose}
              />
            )}
          </DialogContent>
        </Dialog>

        {userRole === '1' && <EmployeeStatsWithBlinkingStatus />}

        <Box mb={2}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={6}>
              <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
                Attendance
              </Typography>
              <Typography
                style={{ fontSize: '1em', fontWeight: 'bold' }}
                variant='subtitle1'
                gutterBottom
              >
                Dashboard / Attendance
              </Typography>
            </Grid>

            {userRole === "1" && (
              <Grid spacing={3} item xs={12} sm={6} md={6} container justifyContent="flex-end" alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel required id='demo-simple-select-label'>
                      Month
                    </InputLabel>
                    <Select
                      label='Select Month'
                      labelId='demo-simple-select-label'
                      id='demo-simple-select'
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
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
                </Grid>

                <Grid item xs={12} sm={6} md={4} container spacing={1} justifyContent="flex-end">
                  <Button
                    fullWidth
                    style={{ borderRadius: 50, backgroundColor: '#ff902f', padding: '15px' }}
                    variant='contained'
                    color='warning'
                    startIcon={<AddIcon />}
                    onClick={handleAttendanceAddClick}
                  >
                    Add Attendance
                  </Button>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Button
                    fullWidth
                    style={{ borderRadius: 50, backgroundColor: '#ff902f', padding: '15px' }}
                    variant='contained'
                    color='warning'
                    onClick={handlePreviousDaysClick}
                    disabled={startDayIndex === 0 || loading}
                  >
                    {'<'}
                  </Button>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <Button
                    fullWidth
                    style={{ borderRadius: 50, backgroundColor: '#ff902f', padding: '15px' }}
                    variant='contained'
                    color='warning'
                    onClick={handleNextDaysClick}
                    disabled={startDayIndex + daysToShow >= 30 || loading}
                  >
                    {'>'}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Box>
        {userRole === "1" && <Grid container spacing={6} alignItems='center' mb={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Employee Name'
              variant='outlined'
              value={searchName}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel required id='demo-simple-select-label'>
                Search Location
              </InputLabel>
              <Select
                label='Select Location'
                labelId='demo-simple-select-label'
                id='demo-simple-select'
                value={searchLocation}
                onChange={handleLocationInputChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="noida">Noida</MenuItem>
                <MenuItem value="bareilly">Bareilly</MenuItem>
                <MenuItem value="patel Nagar">Patel Nagar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>}
      </Box>
      <Box sx={{ display: 'flex' }}>
        {userRole === '1' ? (
          <DataGrid
            autoHeight
            getRowHeight={() => 'auto'}
            sx={{
              '& .MuiDataGrid-columnHeader .MuiDataGrid-sortIcon': {
                color: 'white',
              },
              '& .MuiDataGrid-columnHeader .MuiDataGrid-menuIconButton': {
                color: 'white',
              },
              '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
                background: 'linear-gradient(270deg, var(--mui-palette-primary-main), rgb(197, 171, 255) 100%) !important',
              },
              '& .mui-wop1k0-MuiDataGrid-footerContainer': {
                background: 'linear-gradient(270deg, var(--mui-palette-primary-main), rgb(197, 171, 255) 100%) !important',
              },
              '& .MuiDataGrid-cell': {
                fontSize: '1.2em',
                color: '#633030',
                align: 'center',
              }
            }}
            slots={{
              toolbar: GridToolbar,
              loadingOverlay: Loader,
            }}
            rows={searchName === '' ? rows.slice((page - 1) * limit, page * limit) : rows.slice(-count)}
            columns={columns}
            getRowId={(row) => row._id}
            initialState={{
              sorting: {
                sortModel: [{ field: 'employee_id', sort: 'asc' }],
              },
            }}
            pageSizeOptions={[10, 20, 30]}
            paginationMode="server"
            onPaginationModelChange={handlePaginationModelChange}
            paginationModel={{ page: page - 1, pageSize: limit }}
            checkboxSelection
            rowCount={count}
            disableRowSelectionOnClick
            loading={loading}
          />
        ) : (
          <Box display="flex">
            <Box display="flex" flexDirection="column" flexShrink={0}>
              <DateCalendarServerRequest
                attendanceData={attendanceData}
                month={month}
                onMonthChange={handleMonthChange}
              />
              <Legend />
            </Box>
            <AttendanceStatusList
              attendanceData={attendanceData}
              selectedMonth={month}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
