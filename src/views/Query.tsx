'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { debounce } from 'lodash';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  InputAdornment,
  Avatar,
  Snackbar,
  Alert,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import type { AppDispatch, RootState } from '@/redux/store';
import {
  fetchUserQueries,
  createQuery,
  fetchQueriesByToQueryId,
  fetchAllQueries,
  updateQueryById,
} from '@/redux/features/queries/queriesSlice';
import QueryForm from '@/components/query/QueryForm';

const Query = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { queries, total } = useSelector((state: RootState) => state.queries);

  const [showForm, setShowForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [queryType, setQueryType] = useState<'against' | 'own'>('against');
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success',
  );

  const [selectedDate, setSelectedDate] = React.useState<Dayjs>(dayjs());

  const month = selectedDate.format('MM');
  const year = selectedDate.format('YYYY');

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setSelectedDate(newValue);
    }
  };

  const debouncedFetch = useMemo(
    () =>
      debounce(() => {
        if (userRole === '1') {
          dispatch(
            fetchAllQueries({
              page,
              limit,
              keyword: selectedKeyword,
              month,
              year,
            }),
          );
        } else if (queryType === 'own') {
          dispatch(
            fetchUserQueries({
              page,
              limit,
              keyword: selectedKeyword,
              month: '0',
              year,
            }),
          );
        } else {
          dispatch(
            fetchQueriesByToQueryId({
              toQueryId: userId,
              page,
              limit,
              keyword: selectedKeyword,
              month: 0,
              year,
            }),
          );
        }
      }, 300),
    [dispatch, page, limit, selectedKeyword, queryType, userId, userRole, month, year],
  );

  const fetchAutocompleteOptions = useCallback(
    debounce(async (input: string) => {
      if (input) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/queries/autocomplete-departments?keyword=${input}`,
          );
          if (response.ok) {
            const data = await response.json();
            setAutocompleteOptions(data);
          } else {
            console.error(
              'Error fetching autocomplete options:',
              response.statusText,
            );
          }
        } catch (error) {
          console.error('Error fetching autocomplete options:', error);
        }
      } else {
        setAutocompleteOptions([]);
      }
    }, 300),
    [],
  );

  const handleInputChange = useCallback(
    debounce((event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedKeyword(event.target.value);
    }, 3000),
    [],
  );

  const handlePaginationModelChange = useCallback(
    (params: { page: number; pageSize: number }) => {
      setPage(params.page + 1);
      setLimit(params.pageSize);
    },
    [],
  );

  useEffect(() => {
    debouncedFetch();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setUserRole(user.role);
    setUserId(user.id);

    return debouncedFetch.cancel;
  }, [debouncedFetch, dispatch, limit, page, selectedKeyword]);

  const handleQueryAddClick = useCallback(() => {
    setSelectedQuery(null);
    setShowForm(true);
  }, []);

  const toggleQueryView = useCallback(() => {
    setQueryType(prevType => (prevType === 'against' ? 'own' : 'against'));
  }, []);

  const handleFormSubmit = async (formData: any) => {
    try {
      if (selectedQuery) {
        await dispatch(
          updateQueryById({ id: selectedQuery._id, data: formData }),
        ).unwrap();
        setSnackbarMessage('Query updated successfully!');
      } else {
        await dispatch(createQuery(formData)).unwrap();
        setSnackbarMessage('Query created successfully!');
      }
      setSnackbarSeverity('success');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating/updating query:', error);
      setSnackbarMessage('Error creating/updating query.');
      setSnackbarSeverity('error');
    } finally {
      setOpenSnackbar(true);
    }
  };

  const handleClose = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleEditClick = (query: any) => {
    setSelectedQuery(query);
    setShowForm(true);
  };

  useEffect(() => {
    return () => {
      handleInputChange.cancel();
    };
  }, [handleInputChange]);

  // ----------------- COLUMNS -----------------
  const generateColumns = useMemo(() => {
    const columns: GridColDef[] = [
      ...(queryType !== 'own'
        ? [
            {
              field: 'employeeName',
              headerName: 'Assigned By',
              minWidth: 200,
              headerAlign: 'center',
              align: 'center',
              renderCell: params => {
                const emp = params.row.employee || {};
                const fullName =
                  `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                  'N/A';

                return (
                  <Box display="flex" alignItems="center">
                    <Avatar
                      src={emp.image || ''}
                      sx={{ mr: 1, width: 32, height: 32 }}
                    />
                    <Typography variant="body2" noWrap>
                      {fullName}
                    </Typography>
                  </Box>
                );
              },
            } as GridColDef,
          ]
        : []),
      ...(userRole === '1' || (queryType !== 'against' && userRole)
        ? [
            {
              field: 'toQueryName',
              headerName: 'Directed To',
              minWidth: 200,
              headerAlign: 'center',
              align: 'center',
              renderCell: params => {
                const emp = params.row.toQuery || {};
                const fullName =
                  `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                  'N/A';

                return (
                  <Box display="flex" alignItems="center">
                    <Avatar
                      src={emp.image || ''}
                      sx={{ mr: 1, width: 32, height: 32 }}
                    />
                    <Typography variant="body2" noWrap>
                      {fullName}
                    </Typography>
                  </Box>
                );
              },
            } as GridColDef,
          ]
        : []),
      {
        field: 'assignedDate',
        headerName: 'Date Assigned',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'status',
        headerName: 'Current Status',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'updateDate',
        headerName: 'Last Update',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'department',
        headerName: 'Department',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'queryType',
        headerName: 'Type of Query',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Query Details',
        minWidth: 250,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Typography variant="body2" noWrap>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        renderCell: params => (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              sx={{
                minWidth: '50px',
                backgroundColor: '#2c3ce3',
                '&:hover': { backgroundColor: '#1a237e' },
              }}
              onClick={() => handleEditClick(params.row)}
            >
              <DriveFileRenameOutlineOutlined />
            </Button>
          </Box>
        ),
      },
    ];

    return columns;
  }, [queryType, userRole]);

  // ----------------- ROWS -----------------
  const rows = useMemo(() => {
    return queries.map((query: any) => {
      const employee =
        query.employee && typeof query.employee === 'object'
          ? query.employee
          : null;

      const toQuery =
        query.toQuery && typeof query.toQuery === 'object'
          ? query.toQuery
          : null;

      return {
        _id: query._id,
        queryType: query.queryType,
        description: query.description,
        department: query.department,
        status: query.status,
        assignedDate: query.assignedDate,
        updateDate: query.updateDate,
        employee,
        toQuery,
      };
    });
  }, [queries]);

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 4 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth="md">
          <DialogContent>
            <QueryForm
              onSubmit={handleFormSubmit}
              query={selectedQuery}
              userRole={userRole}
              onClose={handleClose}
              queryType={queryType}
            />
          </DialogContent>
        </Dialog>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Queries
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Dashboard / Queries
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {Number(userRole) >= 1 && (
              <>
                <Button
                  style={{ borderRadius: 8 }}
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleQueryAddClick}
                  sx={{ textTransform: 'none', px: 3, py: 1 }}
                >
                  New Query
                </Button>
                {userRole !== '1' && (
                  <Tooltip
                    title={
                      queryType === 'against'
                        ? 'Click to view your own queries'
                        : 'Click to view queries assigned to you'
                    }
                  >
                    <Button
                      style={{ borderRadius: 8 }}
                      variant="contained"
                      color={queryType === 'against' ? 'secondary' : 'info'}
                      onClick={toggleQueryView}
                      sx={{ textTransform: 'none', px: 3, py: 1 }}
                    >
                      {queryType === 'against' ? 'Your Queries' : 'Against You'}
                    </Button>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </Box>

        <Grid container spacing={3} mb={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={8}>
            <Autocomplete
              freeSolo
              options={autocompleteOptions}
              inputValue={selectedKeyword}
              onInputChange={(event, newInputValue) => {
                setSelectedKeyword(newInputValue);
                fetchAutocompleteOptions(newInputValue);
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  fullWidth
                  label="Search"
                  variant="outlined"
                  onChange={handleInputChange}
                  InputProps={{
                    ...params.InputProps,
                    sx: { borderRadius: '3rem' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Date Picker */}
          <Grid
            item
            xs={12}
            md={4}
            display="flex"
            justifyContent="flex-end"
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                views={userRole === '1' ? ['month', 'year'] : ['year']}
                label={
                  userRole === '1'
                    ? 'Select Month and Year'
                    : 'Select Year'
                }
                value={dayjs(selectedDate)}
                onChange={handleDateChange}
                sx={{
                  width: '80%',
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={generateColumns}
          getRowId={row => row._id}
          paginationMode="server"
          rowCount={total}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          getRowClassName={params => {
            if (params.row.status === 'Pending') return 'status-pending';
            if (params.row.status === 'Resolved') return 'status-resolved';
            if (params.row.status === 'On Progress')
              return 'status-on-progress';
            return '';
          }}
          sx={{
            height: 'calc(140vh - 200px)',
            '& .super-app-theme--header': {
              fontSize: 17,
              fontWeight: 600,
              alignItems: 'center',
            },
            '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
              background: '#2c3ce3 !important',
              color: 'white',
            },
            '& .MuiDataGrid-cell': {
              fontSize: '10px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px',
            },
            '& .MuiDataGrid-row': {
              fontWeight: '600',
              fontSize: '14px',
              boxSizing: 'border-box',
            },
            '& .status-pending': {
              backgroundColor: 'rgba(255, 255, 0, 0.2)',
            },
            '& .status-resolved': {
              backgroundColor: 'rgba(0, 255, 0, 0.2)',
            },
            '& .status-on-progress': {
              backgroundColor: 'rgba(255, 165, 0, 0.2)',
            },
          }}
          slots={{
            toolbar: GridToolbar,
          }}
        />
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Query;
