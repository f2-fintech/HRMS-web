'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Dialog, DialogContent, Typography, TextField, InputAdornment, Grid, Avatar, TableCell, Accordion, AccordionSummary, AccordionDetails, Table, TableHead, TableRow, TableBody, Alert, DialogActions, FormControl, Select, MenuItem, InputLabel } from '@mui/material'
import type { GridColDef } from '@mui/x-data-grid'
import { DataGrid } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import { debounce } from 'lodash'
import { styled } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import 'react-toastify/dist/ReactToastify.css';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import type { RootState, AppDispatch } from '@/redux/store';
import { fetchFines } from '@/redux/features/fines/fineSlice';
import FineForm from '@/components/fine/FineForm';
import { format } from 'date-fns';
import Loader from '@/components/loader/loader'
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';


const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
}));

const FineListing = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { fines, total, loading } = useSelector((state: RootState) => state.fines);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [toasts, setToast] = useState('');

  const [openAlert, setOpenAlert] = useState(false); // For alert visibility
  const [fineToDelete, setFineToDelete] = useState<string | null>(null); // Store fine ID to delete
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [selectedDate, setSelectedDate] = React.useState(dayjs());

  const month = selectedDate.format('MM');
  const year = selectedDate.format('YYYY');

  const handleDateChange = (newValue: Dayjs | null) => {

    if (newValue) {
      setSelectedDate(newValue);
    }
  };

  console.log('fines', selectedDate,);


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)

    setUserId(user.id)
  }, [])

  useEffect(() => {
    if (toasts) {
      toast.success(`${toasts}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      })

      if (toasts === 'Something went wrong') {
        toast.error('Something went wrong', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined
        })
      }
    }
  }, [toasts])

  const debouncedFetchFines = useMemo(
    () =>
      debounce(() => {
        if (userRole === '1') {
          dispatch(fetchFines({ page, limit, month: month, year: year, keyword: selectedKeyword, }));
        } else {
          dispatch(fetchFines({ page, limit, month: '0', year: year, keyword: selectedKeyword, userId }));
        }
      }, 300),
    [dispatch, page, limit, selectedKeyword, userRole, userId, month, year]
  );


  useEffect(() => {
    debouncedFetchFines()

    return () => {
      debouncedFetchFines.cancel()
    }
  }, [debouncedFetchFines])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }

  const handlePageChange = (params: { page: number; pageSize: number }) => {
    setPage(params.page + 1)
    setLimit(params.pageSize)
  }

  const handleAddFine = () => {
    setSelectedFine(null)
    setShowForm(true)
  }

  const handleEditFine = (id: string) => {
    if (id) {
      const foundFines = fines.find(employee =>
        employee.assets.find(ass => ass._id === id)
      );
      const fine = foundFines.assets.find((asse) => asse._id === id);
      setSelectedFine(fine); // Edit mode
    }

    setShowForm(true);
  }

  const handleConfirmDelete = () => {
    if (fineToDelete) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/fines/delete/${fineToDelete}`, {
        method: 'DELETE',
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message) {
            toast.success(data.message, { position: 'top-center' });
            debouncedFetchFines();
          } else {
            toast.error('Error deleting fine', { position: 'top-center' });
          }
        })
        .catch((error) => {
          console.error('Error', error);
          toast.error('Unexpected error occurred', { position: 'top-center' });
        })
        .finally(() => {
          setOpenAlert(false);
          setFineToDelete(null); // Reset state
        });
    }
  };

  const confirmDeleteFine = (id: string) => {
    setFineToDelete(id);
    setOpenAlert(true); // Open alert dialog to confirm
  };


  const handleCloseForm = () => {
    setShowForm(false)
  }

  const generateColumns = () => {
    const columns = [
      ...(userRole === '1' ? [
        {
          field: 'fine',
          headerName: 'Fine Details',
          width: 1020,
          headerAlign: 'center',
          headerClassName: 'super-app-theme--header',
          renderCell: (params) => {
            console.log('params', params)
            return (
              <Box>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box
                      display="flex"
                      alignItems="center"
                      height="100%"
                      width="100%"
                      justifyContent="space-between"
                    >
                      {/* Employee Info Section */}
                      <Box display="flex" alignItems="center" width="33%">
                        <Avatar
                          src={params.row.employee.image}
                          sx={{ marginLeft: 2, width: 30, height: 30 }}
                        />
                        <Typography
                          sx={{
                            fontSize: '1em',
                            fontWeight: 'bold',
                            textTransform: 'capitalize',
                            marginLeft: 2
                          }}
                        >
                          {params.row.employee.first_name} {params.row.employee.last_name}
                        </Typography>
                      </Box>

                      {/* Total Section */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        width="33%"
                      >
                        <Typography sx={{ fontSize: '1em' }}>
                          Total: ₹{Array.isArray(params.row.assets)
                            ? params.row.assets.reduce((total, asset) => {
                              const fineAmount = asset.fineAmount ? parseFloat(asset.fineAmount) : 0;
                              return total + fineAmount;
                            }, 0).toLocaleString()
                            : '0'}
                        </Typography>
                      </Box>

                      {/* View All Section */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                        width="33%"
                      >
                        <Typography sx={{ fontSize: '1em' }}>
                          {`View all Fines (${Array.isArray(params.row.assets) ? params.row.assets.length : 0})`}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ marginTop: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Fine Type</StyledTableCell>
                          <StyledTableCell>Fine Amount</StyledTableCell>
                          <StyledTableCell>Fine Date</StyledTableCell>
                          <StyledTableCell>Edit</StyledTableCell>
                          <StyledTableCell>Delete</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(params.row.assets) && params.row.assets.map((fine, idx) => (
                          <TableRow key={`fine-${idx}`}>
                            <TableCell>{fine.fineType}</TableCell>
                            <TableCell>₹{fine.fineAmount?.toLocaleString()}</TableCell>
                            <TableCell>
                              {fine.fineDate ? format(new Date(fine.fineDate), 'dd-MMM-yyyy').toUpperCase() : ''}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                sx={{
                                  minWidth: '50px',
                                  backgroundColor: '#2c3ce3',
                                  '&:hover': { backgroundColor: '#1a237e' }
                                }}
                                onClick={() => handleEditFine(fine._id)}
                              >
                                <DriveFileRenameOutlineOutlined />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button
                                color='error'
                                variant='contained'
                                sx={{ minWidth: '50px' }}
                                onClick={() => confirmDeleteFine(fine._id)}
                              >
                                <DeleteIcon />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionDetails>
                </Accordion>
              </Box>
            );
          }
        }


      ] : [
        {
          field: 'fineType',
          headerName: 'Fine Type',
          flex: 1,
          minWidth: 150,
          headerClassName: 'super-app-theme--header',

        },
        {
          field: 'fineAmount',
          headerName: 'Fine Amount',
          flex: 1,
          minWidth: 100,
          headerClassName: 'super-app-theme--header',
        },
        {
          field: 'fineDate',
          headerName: 'Fine Date',
          flex: 1, minWidth: 100,
          headerClassName: 'super-app-theme--header',
        },
        // {
        //   field: 'total',
        //   headerName: 'Total',
        //   headerAlign: 'center',
        //   flex: 1,
        //   headerClassName: 'super-app-theme--header',
        //   align: "center",
        //   renderCell: (params) => {
        //     console.log('params', params)
        //     const amount = params.row.fineAmount
        //     const totalFineAmount = amount.reduce((total, asset) => {
        //       const fineAmount = asset.fineAmount ? parseFloat(asset.fineAmount) : 0;
        //       return total + fineAmount;
        //     }, 0);

        //     return (
        //       <Typography fontWeight={700}>
        //         {totalFineAmount}
        //       </Typography>
        //     );
        //   }
        // },
      ])
    ];
    return columns;
  };
  const columns = generateColumns()
  const userFines = useMemo(() => {
    return fines.map((fine) => ({
      _id: fine._id,
      employee: fine.employee,
      fineType: fine.fineType,
      fineAmount: fine.fineAmount,
      fineDate: fine.fineDate
    }));
  }, [fines])

  return (
    <>
      <Dialog open={openAlert} onClose={() => setOpenAlert(false)}>
        <DialogContent>
          <Alert variant='outlined' severity="warning">
            Are you sure you want to delete this fine? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlert(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Box>

        <ToastContainer position="top-center" />
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Fines
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Fine
            </Typography>
          </Box>
          {userRole === '1' && (
            <Button
              sx={{ backgroundColor: '#ff902f' }}
              variant='contained'
              color='primary'
              startIcon={<AddIcon />}
              onClick={handleAddFine}
            >
              Add Fine
            </Button>
          )}
        </Box>

        <Grid container spacing={3} alignItems="center" justifyContent="space-between" mb={2}>
          {userRole === '1' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                value={selectedKeyword}
                onChange={handleInputChange}
                InputProps={{
                  sx: {
                    borderRadius: '50px',
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
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
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>



        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            loading={loading}

            getRowHeight={() => 'auto'}
            sx={{
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

                align: 'center',
              },
              '& .MuiDataGrid-row': {
                '&:nth-of-type(odd)': {
                  backgroundColor: 'rgb(46 38 61 / 12%)',
                },
                '&:nth-of-type(even)': {
                  backgroundColor: '#fffff',
                },

                fontWeight: '600',
                fontSize: '14px',
                boxSizing: 'border-box'
              },
            }}
            slots={{
              loadingOverlay: Loader
            }}
            rows={userRole == '1' ? (fines) : (userFines)}
            columns={columns}
            pageSizeOptions={[10, 20, 30]}
            paginationMode='server'
            rowCount={total}
            getRowId={(row) => {
              if (userRole === "1") {
                return row._id && row._id._id ? row._id._id : row._id;
              }
              return row._id;
            }}
            paginationModel={{ page: page - 1, pageSize: limit }}
            onPaginationModelChange={handlePageChange}
          />
        </Box>

        <Dialog open={showForm} onClose={handleCloseForm} fullWidth maxWidth='md'>
          <DialogContent>
            <FineForm
              fine={selectedFine}
              onClose={handleCloseForm}
              setToast={setToast}
              month={month}
              year={year}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </>
  )
}

export default FineListing
