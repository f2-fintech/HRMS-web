
'use client';

import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';

import WeekendIcon from '@mui/icons-material/Weekend';
import {
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Avatar,
  useTheme,
  useMediaQuery,
  Backdrop,

} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import HomeIcon from '@mui/icons-material/Home';
import { Download as DownloadIcon } from '@mui/icons-material';
import ContrastIcon from '@mui/icons-material/Contrast';

import { useDispatch, useSelector } from 'react-redux';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import type { AppDispatch, RootState } from '@/redux/store';
import { fetchAttendances } from '@/redux/features/attendances/attendancesSlice';
import AttendanceSummary from '@/utility/attendancesummry/AttendanceSummary';
import EmployeeStatsWithBlinkingStatus from '@/utility/totalempattendancesummary/EmployeeStatsWithBlinkingStatus';
import { AttendanceSummaryColumns } from '@/utility/attendancesummry/AttendanceSummaryColumns';

import Loader from "../components/loader/loader";
import AddAttendanceForm from '@/components/attendance/AttendanceForm';
import DateCalendarServerRequest from '@/components/attendance/DateCalendarServerRequest';
import Legend from '@/components/attendance/Legend';
import AttendanceStatusList from '@/components/attendance/AttendanceStatusList';
import LocationDropdown from '@/utility/locationdropdown/LocationDropdown';
import { fetchMonthlyAttendanceSummary } from '@/utility/apiResponse/employeesResponse';

export default function AttendanceGrid() {
  const dispatch: AppDispatch = useDispatch();
  const theme = useTheme();
  const { attendances, loading, count, filteredAttendance } = useSelector((state: RootState) => state.attendances);

  const [showForm, setShowForm] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [viewAttendanceData, setViewAttendanceData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
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

  const [statusCounts, setStatusCounts] = useState([]);

  const [allEmployees, setAllEmployees] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)


  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const fetchEmployees = async () => {
      setError(null)
      try {
        const employeesData = await fetchMonthlyAttendanceSummary(month, year)
        console.log('emp dataaaaaaaaaaaaa', employeesData);

        setAllEmployees(employeesData)
      } catch (error: any) {
        setError(error.message || 'Failed to fetch employee data')
      } finally {
      }
    }

    fetchEmployees()
  }, [month, year])

  const handleExportAttendance = () => {
    // Month names array
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get the selected month and year
    const formattedMonth = monthNames[month - 1]; // Convert month number to name
    const fileName = `${formattedMonth} ${year} attendance_summary.csv`;

    // Define the CSV header
    const csvContent = [
      ['Employee Name', 'Present', 'Absent', 'On Half', 'On Leave', 'On WFH', 'On Field'],
      // Map attendance data to rows
      ...allEmployees.map(emp => [
        emp.employeeName,
        emp.statuses.Present,
        emp.statuses.Absent,
        emp.statuses['On Half'],
        emp.statuses['On Leave'],
        emp.statuses['On Wfh'],
        emp.statuses['On Field']
      ])
    ]
      .map(e => e.join(',')) // Join each row by commas
      .join('\n'); // Join rows with newline characters

    // Create a blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Create a download link
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName); // Set the dynamic file name
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchStatusCounts = async () => {
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/attendence/employee-status-counts?month=${month}&year=${year}&page=${page}&limit=${limit}&keyword=${searchName}&location=${searchLocation}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json',
          },
        });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setStatusCounts(data.statusCounts);
    } catch (error) {
      console.error("Error fetching status counts:", error);
      // toast.error("Failed to load attendance counts.");
    }
  };

  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  const debouncedSearchName = useDebounce(searchName, 500);
  const debouncedSearchLocation = useDebounce(searchLocation, 500);

  useEffect(() => {
    if (debouncedSearchName.trim() === '' && debouncedSearchLocation.trim() === '') {
      dispatch(fetchAttendances({
        month,
        year, // Added year
        weekIndex: startDayIndex,
        page: 1,  // Reset to first page
        limit,
        keyword: '',
        location: ''
      }));
    } else {
      dispatch(fetchAttendances({
        month,
        year, // Added year
        weekIndex: startDayIndex,
        page,  // Reset to first page when searching
        limit,
        keyword: debouncedSearchName.trim(),
        location: debouncedSearchLocation.trim()
      }));
      fetchStatusCounts();
    }
  }, [page, limit, month, year, startDayIndex, debouncedSearchName, debouncedSearchLocation]);

  const handleInputChange = (e) => {
    const newName = e.target.value
    setSearchName(newName);
  };

  useEffect(() => {
    if (userRole === '1' && searchName === '' && searchLocation === '') {
      fetchStatusCounts();
      dispatch(fetchAttendances({
        month: month,
        year, // Added year
        weekIndex: startDayIndex,
        page: page,
        limit: limit,
        keyword: searchName,
        location: searchLocation
      }));
    }
  }, [dispatch, month, year, startDayIndex, page, limit, userRole]);

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

  const handleNextDaysClick = () => {
    setStartDayIndex((prev) => Math.min(prev + daysToShow, 31 - daysToShow));
  };

  const handlePreviousDaysClick = () => {
    setStartDayIndex((prev) => Math.max(prev - daysToShow, 0));
  };

  const attendanceData = filteredAttendance.reduce((acc, { date, status }) => {
    acc[date] = status;
    return acc;
  }, {} as Record<string, string>);

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
    const daysInMonth = getDaysInMonth(month, year);
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
      // Dynamically generate columns for each day of the month
      ...visibleDays.map(day => {
        const cellDate = new Date(year, month - 1, day);
        const isFutureDate = cellDate > today;

        return {
          field: `day_${day}`,
          headerName: `${day}`,
          headerAlign: 'center',
          align: 'center',
          headerClassName: 'super-app-theme--header',
          renderCell: (params) => {
            const status = params.row.days ? params.row.days[`day_${day}`]?.status : null;
            const attendanceId = params.row.days ? params.row.days[`day_${day}`]?._id : null;
            const employeeId = params.row.employee_id;
            const employeeName = params.row.name;
            const isSunday = cellDate.getDay() === 0; // Check if the day is Sunday

            // Render 'Mark' button for empty cells (except Sundays and future dates)
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

            // If it's a Sunday and the status is missing, show the Weekend icon
            if (isSunday && !status) {
              return (
                <WeekendIcon
                  style={{ color: 'blue', marginTop: '35%', cursor: 'pointer' }}
                  onClick={() => handleAttendanceAddClick(employeeId, employeeName, day)}
                />
              );
            }

            // Render different icons based on the status
            if (day === lastSunday) {
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
              // If no status and not a future date, show the 'Mark' button
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
              // Similar render logic for other days in the month
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
              // Render 'On Half' status if applicable
              else if (status === 'On Half') {
                return <ContrastIcon style={{ color: 'green', fontSize: '1.5em', marginTop: '35%' }} onClick={() => handleAttendanceEditClick(attendanceId)} />;
              } else {
                return null;
              }
            }
          }
        };
      }),

      ...AttendanceSummaryColumns, // Assuming you have additional columns for summary
    ];

    return columns;
  };


  const transformData = () => {
    const statusCountsMap = statusCounts.reduce((acc, count) => {
      acc[count.employeeId] = count.statuses || {};
      return acc;
    }, {});

    const groupedData = attendances.reduce((acc, curr) => {
      const { employee, date, status, timeComplete, _id } = curr;

      if (!employee || !employee._id) return acc;

      const attendanceDate = new Date(date);
      const day = attendanceDate.getDate();
      const attendanceMonth = attendanceDate.getMonth() + 1;
      const attendanceYear = attendanceDate.getFullYear(); // Added year

      if (attendanceMonth !== month || attendanceYear !== year) return acc; // Consider year

      if (!acc[employee._id]) {
        acc[employee._id] = {
          _id: employee._id,
          employee_id: employee._id,
          name: `${employee.first_name} ${employee.last_name}`,
          image: employee.image || '',
          statusCount: {
            Present: 0,
            Absent: 0,
            [`On Leave`]: 0,
            [`On Field`]: 0,
            [`On Wfh`]: 0,
            [`On Half`]: 0,
          },
          days: {},
        };

        const cumulativeCounts = statusCountsMap[employee._id] || {};
        acc[employee._id].statusCount = { ...acc[employee._id].statusCount, ...cumulativeCounts };
      }

      acc[employee._id].days[`day_${day}`] = { status, _id, timeComplete };

      return acc;
    }, {});

    const sortedData = Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));

    return sortedData;
  };


  const columns = React.useMemo(() => generateColumns(), [month, startDayIndex, daysToShow]);
  const rows = React.useMemo(() => transformData(), [attendances, statusCounts, month]);

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
            <Grid item xs={12} sm={6} md={4}>
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
              <>
                <Grid item xs={12} sm={6} md={2}>
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
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel required id='year-select-label'>
                      Year
                    </InputLabel>
                    <Select
                      label='Select Year'
                      labelId='year-select-label'
                      id='year-select'
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      {/* Generate a range of years, e.g., current year ±5 */}
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                        <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    fullWidth
                    style={{ borderRadius: 100, backgroundImage: 'linear-gradient(45deg,rgb(39, 142, 23) 0%,rgb(219, 182, 131) 51%, #FF512F 100%)', padding: '10px' }}
                    variant='contained'
                    color='warning'
                    startIcon={<AddIcon />}
                    onClick={handleAttendanceAddClick}
                  >
                    Add Attendance
                  </Button>
                </Grid>

                <Grid item xs={6} sm={3} md={1}>
                  <Button
                    fullWidth
                    style={{ borderRadius: 50, backgroundImage: 'linear-gradient(45deg,rgb(84, 92, 114) 0%, #F09819 51%, #FF512F 100%)', padding: '15px' }}
                    variant='contained'
                    color='warning'
                    onClick={handlePreviousDaysClick}
                    disabled={startDayIndex === 0 || loading}
                  >
                    {'<'}
                  </Button>
                </Grid>

                <Grid item xs={6} sm={3} md={1}>
                  <Button
                    fullWidth
                    style={{ borderRadius: 50, backgroundImage: 'linear-gradient(45deg,rgb(196, 196, 5) 0%,rgb(168, 174, 133) 51%, #FF512F 100%)', padding: '15px' }}
                    variant='contained'
                    color='warning'
                    onClick={handleNextDaysClick}
                    disabled={startDayIndex + daysToShow >= 30 || loading}
                  >
                    {'>'}
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
        {userRole === "1" && (
          <Grid container spacing={6} alignItems="center" mb={2}>
            {/* Employee Name Text Field */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Employee Name"
                variant="outlined"
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

            {/* Location Dropdown */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <LocationDropdown
                  selectedLocation={searchLocation}
                  setSelectedLocation={setSearchLocation}
                />
              </FormControl>
            </Grid>

            {/* Export Button */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                sx={{
                  margin: '10px',
                  padding: '15px 30px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  transition: '0.5s',
                  backgroundSize: '200% auto',
                  color: 'white',
                  borderRadius: '10px',
                  border: 0,
                  fontWeight: 700,
                  boxShadow: '0px 0px 14px -7px #F09819',
                  backgroundImage: 'linear-gradient(45deg,rgb(30, 51, 104) 0%, #F09819 51%, #FF512F 100%)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  '-webkit-user-select': 'none',
                  touchAction: 'manipulation',
                  height: '80%',
                  minHeight: '50px',
                  fontSize: '14px',
                  '&:hover': {
                    backgroundPosition: 'right center',
                    color: '#fff',
                    textDecoration: 'none',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleExportAttendance}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        )}

      </Box>
      <Box sx={{ display: 'flex' }}>
        {loading && (
          <Backdrop
            sx={{
              color: '#fff',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
            open={loading}
          >
            <Loader />
          </Backdrop>
        )}
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
              // loadingOverlay: Loader,
            }}
            rows={rows}
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
          // loading={loading}
          />
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} lg={3}>
              <Grid container direction="column" spacing={2}>
                <Grid item>
                  <DateCalendarServerRequest
                    attendanceData={attendanceData}
                    month={month}
                    onMonthChange={handleMonthChange}
                  />
                </Grid>
                <Grid item>
                  <Legend />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={8} lg={9} style={{ minWidth: isMediumScreen ? "100%" : "auto" }}>
              <AttendanceStatusList
                attendanceData={attendanceData}
                selectedMonth={month}
              />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
