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
  AccordionDetails,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import DialogTitle from '@mui/material/DialogTitle';
import { styled } from '@mui/material/styles';
import ContrastIcon from '@mui/icons-material/Contrast';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InputAdornment from '@mui/material/InputAdornment';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'

import { Console } from 'console'
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchLeaves } from '@/redux/features/leaves/leavesSlice';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import AddLeavesForm from '@/components/leave/LeaveForm';
import Loader from '@/components/loader/loader'


const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold'
}))

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));
export default function LeavesGrid() {
  const dispatch = useDispatch<AppDispatch>()
  const { leaves, total, loading } = useSelector((state: RootState) => state.leaves)


  const [showForm, setShowForm] = useState(false)
  const [selectedLeaves, setSelectedLeaves] = useState(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [employees, setEmployees] = useState([])
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [quarter, setQuarter] = useState('Q');


  console.log('leaves', leaves)

  const debouncedFetch = useMemo(
    () =>
      debounce(() => {
        dispatch(fetchLeaves({ page, limit, quarter, keyword: selectedKeyword }))
      }, 300),
    [dispatch, page, limit, quarter, selectedKeyword]
  )
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }, [])

  const handleQuarterChange = useCallback((e) => {
    const newQuarter = e.target.value as string;
    setQuarter(newQuarter);
  }, []);


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
    const user = JSON.parse(localStorage.getItem("user") || '{}')
    setUserRole(user.role)
    setUserId(user.id);
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


  const handleLeavedelete = async (id) => {
    const confirmDelete = confirm('Are you sure you want to delete');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/leaves/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer',
        },
      });

      if (response.ok) {
        // dispatch(deleteLeaves(id));
        debouncedFetch()
        toast.success('leave deleted successfully.');
      } else {
        const errorResult = await response.json();
        toast.error(`Failed to delete leave: ${errorResult.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error deleting leave. Please try again.');
    }
  };

  const handleClose = useCallback(() => {
    setShowForm(false)
  }, [])

  const renderAccordion = params => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      setOpen(false);
    };

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
      <>
        <Accordion >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" height="100%" width="100%" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Avatar
                  src={params.row.employee.image}
                  sx={{ marginLeft: 10, width: 30, height: 30 }}
                />
                <Typography sx={{ fontSize: '1em', fontWeight: 'bold', textTransform: 'capitalize', marginLeft: 4 }}>
                  {params.row.employee.first_name} {params.row.employee.last_name}
                </Typography>
              </Box>
              <Box>
                <Typography >{`View all Leaves (${Array.isArray(params.row.leaves) ? params.row.leaves.length : 0})`}</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ marginTop: 5 }}>
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
                  <StyledTableCell>Edit</StyledTableCell>
                  <StyledTableCell>Delete</StyledTableCell>

                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(params.row.leaves) && params.row.leaves.length > 0 ? (
                  params.row.leaves.map((leave) => {
                    const dayValue = parseFloat(leave.day);
                    const halfPeriod = leave.half_day_period;

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
                                alignItems: 'center',
                              }}
                            >
                              <ContrastIcon
                                sx={{
                                  color: '#989c9a',
                                  fontSize: 40,
                                }}
                              />
                              <Typography
                                fontWeight="bold"
                                fontSize="0.9em"
                                color="black"
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
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
                          <Button variant="outlined" onClick={handleClickOpen}>
                            View
                          </Button>
                          <BootstrapDialog
                            onClose={handleClose}
                            aria-labelledby="customized-dialog-title"
                            open={open}
                          >
                            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                              Application
                            </DialogTitle>
                            <IconButton
                              aria-label="close"
                              onClick={handleClose}
                              sx={(theme) => ({
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: theme.palette.grey[500],
                              })}
                            >
                              <CloseIcon />
                            </IconButton><DialogContent >
                              <Typography>
                                {leave.application}
                              </Typography>
                            </DialogContent>
                          </BootstrapDialog>

                        </TableCell>

                        <TableCell>{leave.status}</TableCell>
                        <TableCell sx={{ minWidth: 100 }}>{leave.reason}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            sx={{ minWidth: '50px', backgroundColor: '#2c3ce3' }}
                            onClick={() => handleLeaveEditClick(leave._id)}
                          >
                            <DriveFileRenameOutlineOutlined />
                          </Button>

                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            sx={{ minWidth: '50px', backgroundColor: 'red' }}
                            onClick={() => handleLeavedelete(leave._id)}
                          >
                            <DeleteIcon />
                          </Button>

                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No leaves available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      </>
    );
  };

  const generateColumns = useMemo(() => {
    return [
      ...(userRole === '1'
        ? [
          {
            field: 'leave',
            headerName: 'Leave Details',
            width: 1024,
            headerAlign: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: renderAccordion
          },
        ]
        : [
          {
            field: 'day',
            headerName: 'Day',
            flex: 0.5,
            headerAlign: 'center',
            align: 'center',
            headerClassName: 'super-app-theme--header',
            renderCell: (params) => {
              console.log("param", params)
              const dayValue = parseFloat(params.value);
              const halfDayPeriod = params.row.half_day_period;

              if (dayValue === 0.5 && halfDayPeriod) {
                return (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <Typography fontWeight='bold'>{dayValue}</Typography>
                  </Box>
                )
              }
            },
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
            headerClassName: 'super-app-theme--header',
            renderCell: (params) => {
              const [open, setOpen] = useState(false);

              const handleClickOpen = () => {
                setOpen(true);
              };
              const handleClose = () => {
                setOpen(false);
              };
              return (
                <>
                  <Button variant="outlined" onClick={handleClickOpen}>
                    View
                  </Button>
                  <BootstrapDialog
                    onClose={handleClose}
                    aria-labelledby="customized-dialog-title"
                    open={open}
                  >
                    <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                      Application
                    </DialogTitle>
                    <IconButton
                      aria-label="close"
                      onClick={handleClose}
                      sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                      })}
                    >
                      <CloseIcon />
                    </IconButton><DialogContent >
                      <Typography>
                        {params.application}
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
      <ToastContainer position="top-center" />
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
              quarter={quarter}
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
      {userRole === '1' && (
        <FormControl fullWidth variant="outlined" margin="normal">
          <InputLabel id="select-quarter-label">Select Quarter</InputLabel>
          <Select
            labelId="select-quarter-label"
            value={quarter}
            onChange={handleQuarterChange}
            label="Select Quarter"
            disabled={loading}

          >
            <MenuItem value="Q">All</MenuItem>
            <MenuItem value="Q1">Q1 (Jan - Mar)</MenuItem>
            <MenuItem value="Q2">Q2 (Apr - Jun)</MenuItem>
            <MenuItem value="Q3">Q3 (Jul - Sep)</MenuItem>
            <MenuItem value="Q4">Q4 (Oct - Dec)</MenuItem>
          </Select>
        </FormControl>
      )}
      <Box sx={{ width: '100%', position: 'relative' }}>

        <DataGrid
          loading={loading}
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
              boxSizing: 'border-box',
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
          slots={{
            loadingOverlay: Loader
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
function useRef(arg0: boolean) {
  throw new Error('Function not implemented.')
}

