'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Button,
  Typography,
  Box,
  Grid,
  InputAdornment,
  TextField,
  Dialog,
  DialogContent,
  createTheme,
  ThemeProvider,
  DialogActions,
  DialogTitle,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { format } from 'date-fns';

import type { AppDispatch, RootState } from '@/redux/store';
// Assume you have two thunk actions:
// - fetchUpcomingHolidays for upcoming holidays
// - fetchPastHolidays for past holidays (from your provided function)
import { fetchHolidays, fetchPastHolidays } from '@/redux/features/holidays/holidaysSlice';
import 'react-toastify/dist/ReactToastify.css';
import AddHolidayForm from '@/components/holiday/HolidayForm';
import { useSettings } from '@/@core/hooks/useSettings';

export default function HolidayGrid() {
  const dispatch: AppDispatch = useDispatch();
  const {
    holidays, total, filteredHoliday,
    pastHolidays, pastTotal, filteredPastHoliday,
    loading, error
  } = useSelector((state: RootState) => state.holidays);

  // Tab state: "upcoming" or "past"
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Shared states for dialog, user info, etc.
  const [showForm, setShowForm] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'success'>('success');
  const { settings } = useSettings();

  // Pagination and search states for upcoming holidays
  const [upPage, setUpPage] = useState(1);
  const [upLimit, setUpLimit] = useState(10);
  const [upKeyword, setUpKeyword] = useState('');

  // Pagination and search states for past holidays
  const [pastPage, setPastPage] = useState(1);
  const [pastLimit, setPastLimit] = useState(10);
  const [pastKeyword, setPastKeyword] = useState('');

  // Debounced fetch for upcoming holidays
  const debouncedFetchUpcoming = useCallback(
    debounce(() => {
      dispatch(fetchHolidays({ page: upPage, limit: upLimit, keyword: upKeyword }));
    }, 300),
    [upPage, upLimit, upKeyword]
  );

  // Debounced fetch for past holidays
  const debouncedFetchPast = useCallback(
    debounce(() => {
      dispatch(fetchPastHolidays({ page: pastPage, limit: pastLimit, keyword: pastKeyword }));
    }, 300),
    [pastPage, pastLimit, pastKeyword]
  );

  // Fetch data when active tab or related states change
  useEffect(() => {
    if (activeTab === 'upcoming') {
      debouncedFetchUpcoming();
    } else {
      debouncedFetchPast();
    }
    return () => {
      if (activeTab === 'upcoming') {
        debouncedFetchUpcoming.cancel();
      } else {
        debouncedFetchPast.cancel();
      }
    };
  }, [activeTab, upPage, upLimit, upKeyword, pastPage, pastLimit, pastKeyword, debouncedFetchUpcoming, debouncedFetchPast]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'upcoming' | 'past') => {
    setActiveTab(newValue);
  };

  // Input change handlers for search fields
  const handleUpSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpKeyword(e.target.value);
  };

  const handlePastSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPastKeyword(e.target.value);
  };

  // Pagination handlers for upcoming and past separately
  const handleUpPaginationChange = (params: { page: number; pageSize: number }) => {
    setUpPage(params.page + 1);
    setUpLimit(params.pageSize);
    debouncedFetchUpcoming();
  };

  const handlePastPaginationChange = (params: { page: number; pageSize: number }) => {
    setPastPage(params.page + 1);
    setPastLimit(params.pageSize);
    debouncedFetchPast();
  };

  // Load user role from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    setUserRole(user.role);
    setUserId(user.id);
  }, []);

  // Other handlers for add, edit, delete remain unchanged
  const handleHolidayAddClick = () => {
    setSelectedHoliday(null);
    setShowForm(true);
  };

  const handleHolidayEditClick = (id: string) => {
    setSelectedHoliday(id);
    setShowForm(true);
  };

  const handleHolidayDeleteClick = (id: string) => {
    setHolidayToDelete(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (holidayToDelete) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/holidays/delete/${holidayToDelete}`, { method: 'DELETE' });
        const data = await response.json();

        if (response.ok) {
          setAlertMessage('Holiday deleted successfully');
          setAlertSeverity('success');
          // Re-fetch data based on the active tab
          activeTab === 'upcoming' ? debouncedFetchUpcoming() : debouncedFetchPast();
        } else {
          setAlertMessage(data.message || 'Failed to delete holiday');
          setAlertSeverity('error');
        }
        setOpenAlert(true);
      } catch (error) {
        setAlertMessage('An error occurred while deleting the holiday');
        setAlertSeverity('error');
        setOpenAlert(true);
      }
      setOpenDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setOpenDialog(false);
    setHolidayToDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  // Columns for the DataGrid remain similar for both tabs.
  const columns: GridColDef[] = [
    { field: 'day', headerName: 'Day', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 0.5 },
    { field: 'title', headerName: 'Title', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1 },
    {
      field: 'start_date',
      headerName: 'Opening Date',
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
      renderCell: (params) => {
        const dateValue = params.value ? new Date(params.value) : null;
        return dateValue && !isNaN(dateValue.getTime())
          ? format(dateValue, 'dd-MMM-yyyy').toUpperCase()
          : 'Invalid Date';
      },
    },
    {
      field: 'end_date',
      headerName: 'Closing Date',
      headerClassName: 'super-app-theme--header',
      headerAlign: 'center',
      align: 'center',
      flex: 1,
      renderCell: (params) => {
        const dateValue = params.value ? new Date(params.value) : null;
        return dateValue && !isNaN(dateValue.getTime())
          ? format(dateValue, 'dd-MMM-yyyy').toUpperCase()
          : 'Invalid Date';
      },
    },
    { field: 'note', headerName: 'Note', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1.5 },
    ...(userRole === '1'
      ? [
        {
          field: 'edit',
          headerName: 'Action',
          sortable: false,
          headerAlign: 'center',
          flex: 1,
          headerClassName: 'super-app-theme--header',
          renderCell: ({ row: { _id } }) => (
            <Box width="85%" m="0 auto" p="5px" display="flex" justifyContent="space-around">
              <Button
                color="info"
                variant="contained"
                onClick={() => handleHolidayEditClick(_id)}
                sx={{
                  minWidth: '50px',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                <DriveFileRenameOutlineOutlined />
              </Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => handleHolidayDeleteClick(_id)}
                sx={{
                  minWidth: '50px',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                <DeleteIcon />
              </Button>
            </Box>
          ),
        },
      ]
      : []),
  ];

  return (
    <ThemeProvider theme={createTheme({
      palette: {
        primary: { main: '#2c3ce3' },
        background: { default: settings.mode === 'dark' ? '#121212' : '#f4f6f9' },
      },
      typography: { fontFamily: 'Roboto, Arial, sans-serif' },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 8px rgba(0,0,0,0.15)' },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              },
            },
          },
        },
      },
    })}>
      <Box sx={{ backgroundColor: settings.mode === 'dark' ? '#121212' : '#f4f6f9', minHeight: '100vh', padding: 3 }}>
        <ToastContainer />

        {/* Form Dialog */}
        <Dialog open={showForm} onClose={handleCloseForm} fullWidth maxWidth="md">
          <DialogContent>
            <AddHolidayForm
              holiday={selectedHoliday}
              handleClose={handleCloseForm}
              // Passing appropriate holiday data based on active tab if needed
              holidays={activeTab === 'upcoming' ? holidays : pastHolidays}
              debouncedFetch={activeTab === 'upcoming' ? debouncedFetchUpcoming : debouncedFetchPast}
              isHalfDay={undefined}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDialog} onClose={handleCancelDelete}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Alert severity="warning">Are you sure you want to delete this holiday?</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for alerts */}
        <Snackbar
          open={openAlert}
          autoHideDuration={6000}
          onClose={() => setOpenAlert(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setOpenAlert(false)} severity={alertSeverity} sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{
          padding: 2,
          backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{
              color: settings.mode === 'dark' ? 'white' : '#2c3ce3',
              fontWeight: 700,
              marginBottom: 1
            }}>
              Holiday Management
            </Typography>
            <Typography variant="subtitle1" sx={{
              color: settings.mode === 'dark' ? 'white' : '#64e0e2',
              fontWeight: 'bolder',
            }}>
              Dashboard / {activeTab === 'upcoming' ? 'Upcoming Holidays' : 'Past Holidays'}
            </Typography>
          </Box>
          {userRole === '1' && activeTab === 'upcoming' && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleHolidayAddClick} sx={{
              padding: '10px 20px',
              fontSize: '1rem',
            }}>
              Add New Holiday
            </Button>
          )}
        </Box>

        {/* Tabs for Upcoming vs Past Holidays */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ marginBottom: 2 }}>
          <Tab label="Upcoming Holidays" value="upcoming" />
          <Tab label="Past Holidays" value="past" />
        </Tabs>

        {/* Search Bar */}
        <Grid container spacing={3} alignItems="center" mb={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label={activeTab === 'upcoming' ? "Search Upcoming Holidays" : "Search Past Holidays"}
              variant="outlined"
              value={activeTab === 'upcoming' ? upKeyword : pastKeyword}
              onChange={activeTab === 'upcoming' ? handleUpSearchChange : handlePastSearchChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Data Grid */}
        <Box sx={{
          height: 600,
          width: '100%',
          backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {activeTab === 'upcoming' ? (
            <DataGrid
              sx={{
                '& .super-app-theme--header': {
                  fontSize: 16,
                  fontWeight: 700,
                  backgroundColor: settings.mode === 'dark' ? '#444' : '#2c3ce3',
                  color: 'white',
                  textTransform: 'uppercase',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(odd)': {
                    backgroundColor: settings.mode === 'dark' ? '#444' : 'rgba(44, 60, 227, 0.05)',
                    color: settings.mode === 'dark' ? 'white' : 'black',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                    color: settings.mode === 'dark' ? 'white' : 'black',
                  },
                  '&:hover': {
                    backgroundColor: settings.mode === 'dark' ? '#555' : 'rgba(44, 60, 227, 0.1)',
                    color: 'black',
                  },
                },
              }}
              components={{ Toolbar: GridToolbar }}
              rows={filteredHoliday.length > 0 ? filteredHoliday : holidays}
              columns={columns}
              getRowId={(row) => row._id}
              paginationMode="server"
              rowCount={total}
              onPaginationModelChange={handleUpPaginationChange}
              pageSizeOptions={[10, 20, 30]}
              paginationModel={{ page: upPage - 1, pageSize: upLimit }}
              disableRowSelectionOnClick
            />
          ) : (
            <DataGrid
              sx={{
                '& .super-app-theme--header': {
                  fontSize: 16,
                  fontWeight: 700,
                  backgroundColor: settings.mode === 'dark' ? '#444' : '#2c3ce3',
                  color: 'white',
                  textTransform: 'uppercase',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                },
                '& .MuiDataGrid-row': {
                  '&:nth-of-type(odd)': {
                    backgroundColor: settings.mode === 'dark' ? '#444' : 'rgba(44, 60, 227, 0.05)',
                    color: settings.mode === 'dark' ? 'white' : 'black',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                    color: settings.mode === 'dark' ? 'white' : 'black',
                  },
                  '&:hover': {
                    backgroundColor: settings.mode === 'dark' ? '#555' : 'rgba(44, 60, 227, 0.1)',
                    color: 'black',
                  },
                },
              }}
              components={{ Toolbar: GridToolbar }}
              rows={filteredPastHoliday.length > 0 ? filteredPastHoliday : pastHolidays}
              columns={columns}
              getRowId={(row) => row._id}
              paginationMode="server"
              rowCount={pastTotal}
              onPaginationModelChange={handlePastPaginationChange}
              pageSizeOptions={[10, 20, 30]}
              paginationModel={{ page: pastPage - 1, pageSize: pastLimit }}
              disableRowSelectionOnClick
            />
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
