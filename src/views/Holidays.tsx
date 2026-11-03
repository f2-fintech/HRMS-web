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
  Chip,
  createTheme,
  ThemeProvider,
  DialogActions,
  DialogTitle,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Paper,
  Container,
  CircularProgress,
} from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { format } from 'date-fns';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchHolidays, fetchPastHolidays } from '@/redux/features/holidays/holidaysSlice';
import 'react-toastify/dist/ReactToastify.css';
import AddHolidayForm from '@/components/holiday/HolidayForm';
import { useSettings } from '@/@core/hooks/useSettings';
import HolidayPolicyInfo from '@/components/holiday/HolidayPolicyInfo';

export default function HolidayGrid() {
  const dispatch: AppDispatch = useDispatch();
  const {
    holidays, total, filteredHoliday,
    pastHolidays, pastTotal, filteredPastHoliday,
    loading, error
  } = useSelector((state: RootState) => state.holidays);

  // Theme and responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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

  // Responsive columns configuration
  const getColumns = (): GridColDef[] => {
    const baseColumns: GridColDef[] = [
      {
        field: 'day',
        headerName: 'Day',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        flex: isMobile ? 0.7 : 0.5,
        minWidth: 80,
      },
      {
        field: 'title',
        headerName: 'Title',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        flex: isMobile ? 1.2 : 1,
        minWidth: 120,
      },
    ];

    // Add date columns if not on mobile or based on screen size
    if (true) {
      baseColumns.push(
        {
          field: 'start_date',
          headerName: 'From',
          headerClassName: 'super-app-theme--header',
          headerAlign: 'center',
          align: 'center',
          flex: 1,
          minWidth: 110,
          renderCell: (params) => {
            const dateValue = params.value ? new Date(params.value) : null;
            return dateValue && !isNaN(dateValue.getTime())
              ? format(dateValue, isMobile ? 'dd-MMM' : 'dd-MMM-yyyy').toUpperCase()
              : 'Invalid Date';
          },
        },
        {
          field: 'end_date',
          headerName: 'To',
          headerClassName: 'super-app-theme--header',
          headerAlign: 'center',
          align: 'center',
          flex: 1,
          minWidth: 110,
          renderCell: (params) => {
            const dateValue = params.value ? new Date(params.value) : null;
            return dateValue && !isNaN(dateValue.getTime())
              ? format(dateValue, isMobile ? 'dd-MMM' : 'dd-MMM-yyyy').toUpperCase()
              : 'Invalid Date';
          },
        }
      );
    }

    // Add note column if space allows
    if (true) {
      baseColumns.push({
        field: 'note',
        headerName: 'Note',
        headerClassName: 'super-app-theme--header',
        headerAlign: 'center',
        align: 'center',
        flex: isMobile ? 1 : 1.5,
        minWidth: 100,
      });
    }

    // Add action column if user has permission
    if (userRole === '1') {
      baseColumns.push({
        field: 'edit',
        headerName: 'Action',
        sortable: false,
        headerAlign: 'center',
        flex: isMobile ? 0.8 : 1,
        minWidth: 120,
        headerClassName: 'super-app-theme--header',
        renderCell: ({ row: { _id } }) => (
          <Box width={isMobile ? "100%" : "85%"} m="0 auto" p={isMobile ? "2px" : "5px"} display="flex" justifyContent="space-around">
            <Button
              color="info"
              variant="contained"
              onClick={() => handleHolidayEditClick(_id)}
              sx={{
                minWidth: isMobile ? '40px' : '50px',
                padding: isMobile ? '4px 8px' : '6px 16px',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <DriveFileRenameOutlineOutlined fontSize={isMobile ? "small" : "medium"} />
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => handleHolidayDeleteClick(_id)}
              sx={{
                minWidth: isMobile ? '40px' : '50px',
                padding: isMobile ? '4px 8px' : '6px 16px',
                marginLeft: 1,
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
            </Button>
          </Box>
        ),
      });
    }

    return baseColumns;
  };

  // Get responsive theme based on settings and device
  const responsiveTheme = createTheme({
    palette: {
      mode: settings.mode === 'dark' ? 'dark' : 'light',
      primary: { main: '#2c3ce3' },
      background: { default: settings.mode === 'dark' ? '#121212' : '#f4f6f9' },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h4: {
        fontSize: isMobile ? '1.4rem' : '2rem',
      },
      subtitle1: {
        fontSize: isMobile ? '0.85rem' : '1rem',
      },
      button: {
        fontSize: isMobile ? '0.8rem' : '1rem',
      }
    },
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
      MuiDataGrid: {
        styleOverrides: {
          root: {
            fontSize: isMobile ? '0.75rem' : '0.875rem',
          },
          columnHeaders: {
            fontSize: isMobile ? '0.8rem' : '1rem',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            minWidth: isMobile ? 'auto' : '90px',
            padding: isMobile ? '6px 8px' : '12px 16px',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            width: isMobile ? '90%' : '80%',
            maxWidth: isMobile ? '100%' : '1200px',
            margin: isMobile ? '10px' : 'auto',
          },
        },
      },
    },
  });

      // Custom empty overlay for DataGrid
      const NoRowsOverlay = () => (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ color: settings.mode === 'dark' ? '#ddd' : '#555' }}>
            No holidays found
          </Typography>
        </Box>
      );

      return (
    <ThemeProvider theme={responsiveTheme}>
      <Container maxWidth={false} disableGutters sx={{
        backgroundColor: settings.mode === 'dark' ? '#121212' : '#f4f6f9',
        minHeight: '100vh',
        padding: isMobile ? 1 : 3,
        overflowX: 'hidden'
      }}>
        <ToastContainer />

        {/* Form Dialog */}
        <Dialog
          open={showForm}
          onClose={handleCloseForm}
          fullWidth
          maxWidth="md"
          fullScreen={isMobile}
        >
          <DialogContent>
            <AddHolidayForm
              holiday={selectedHoliday}
              handleClose={handleCloseForm}
              holidays={activeTab === 'upcoming' ? holidays : pastHolidays}
              debouncedFetch={activeTab === 'upcoming' ? debouncedFetchUpcoming : debouncedFetchPast}
              isHalfDay={undefined}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCancelDelete}
          fullWidth
          maxWidth="xs"
        >
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
          anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
        >
          <Alert onClose={() => setOpenAlert(false)} severity={alertSeverity} sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>

        {/* Header */}
        <Paper elevation={2} sx={{
          padding: isMobile ? 1.5 : 2,
          backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          marginBottom: 3,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 2 : 0
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
            <Box mt={1} display="flex" gap={1} alignItems="center">
              <Chip label={`Total: ${activeTab === 'upcoming' ? total : pastTotal}`} color="primary" />
              <Chip label={`Showing: ${activeTab === 'upcoming' ? (filteredHoliday.length > 0 ? filteredHoliday.length : holidays.length) : (filteredPastHoliday.length > 0 ? filteredPastHoliday.length : pastHolidays.length)}`} />
            </Box>
          </Box>
          {userRole === '1' && activeTab === 'upcoming' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleHolidayAddClick} sx={{
              padding: isMobile ? '8px 12px' : '10px 20px',
              fontSize: isMobile ? '0.85rem' : '1rem',
              alignSelf: isMobile ? 'stretch' : 'auto',
              background: 'linear-gradient(90deg, #2c3ce3 0%, #64e0e2 100%)',
              color: 'white',
              boxShadow: '0 6px 18px rgba(44,60,227,0.18)',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 22px rgba(44,60,227,0.22)' }
            }}>
              Add New Holiday
            </Button>
          )}
        </Paper>

        {/* Holiday Policy Info Card */}
        <HolidayPolicyInfo />

        {/* Tabs for Upcoming vs Past Holidays */}
        <Paper elevation={1} sx={{
          marginBottom: 2,
          backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#2c3ce3',
                height: 3
              },
              '& .MuiTab-root.Mui-selected': {
                color: settings.mode === 'dark' ? 'white' : '#2c3ce3',
                fontWeight: 'bold'
              }
            }}
          >
            <Tab label="Upcoming Holidays" value="upcoming" />
            <Tab label="Past Holidays" value="past" />
          </Tabs>
        </Paper>

        {/* Search Bar */}
        <Paper elevation={1} sx={{
          marginBottom: 3,
          padding: isMobile ? 2 : 3,
          backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
          borderRadius: '16px',
        }}>
          <Grid container spacing={isMobile ? 2 : 3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label={activeTab === 'upcoming' ? "Search Upcoming Holidays" : "Search Past Holidays"}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
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
        </Paper>

        {/* Data Grid */}
        <Paper elevation={3} sx={{
          height: isMobile ? 400 : 600,
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
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 700,
                  backgroundColor: settings.mode === 'dark' ? '#444' : '#2c3ce3',
                  color: 'white',
                  textTransform: 'uppercase',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 500,
                  backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                  padding: isMobile ? '8px 4px' : '16px 8px',
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
                '& .MuiDataGrid-columnHeaders': {
                  fontSize: isMobile ? 14 : 16,
                },
                '& .MuiDataGrid-footerContainer': {
                  fontSize: isMobile ? 12 : 14,
                }
              }}
              components={{
                Toolbar: isMobile ? undefined : GridToolbar,
                NoRowsOverlay
              }}
              loading={loading}
              rows={filteredHoliday.length > 0 ? filteredHoliday : holidays}
              columns={getColumns()}
              getRowId={(row) => row._id}
              paginationMode="server"
              rowCount={total}
              onPaginationModelChange={handleUpPaginationChange}
              pageSizeOptions={[5, 10, 20, 30]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: isMobile ? 5 : 10 },
                },
              }}
              paginationModel={{ page: upPage - 1, pageSize: upLimit }}
              disableRowSelectionOnClick
              autoHeight={false}
              disableColumnMenu={isMobile}
            />
          ) : (
            <DataGrid
              sx={{
                '& .super-app-theme--header': {
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 700,
                  backgroundColor: settings.mode === 'dark' ? '#444' : '#2c3ce3',
                  color: 'white',
                  textTransform: 'uppercase',
                },
                '& .MuiDataGrid-cell': {
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 500,
                  backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
                  padding: isMobile ? '8px 4px' : '16px 8px',
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
                '& .MuiDataGrid-columnHeaders': {
                  fontSize: isMobile ? 14 : 16,
                },
                '& .MuiDataGrid-footerContainer': {
                  fontSize: isMobile ? 12 : 14,
                }
              }}
              components={{
                Toolbar: isMobile ? undefined : GridToolbar,
                NoRowsOverlay
              }}
              loading={loading}
              rows={filteredPastHoliday.length > 0 ? filteredPastHoliday : pastHolidays}
              columns={getColumns()}
              getRowId={(row) => row._id}
              paginationMode="server"
              rowCount={pastTotal}
              onPaginationModelChange={handlePastPaginationChange}
              pageSizeOptions={[5, 10, 20, 30]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: isMobile ? 5 : 10 },
                },
              }}
              paginationModel={{ page: pastPage - 1, pageSize: pastLimit }}
              disableRowSelectionOnClick
              autoHeight={false}
              disableColumnMenu={isMobile}
            />
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
}
