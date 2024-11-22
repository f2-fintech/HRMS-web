'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'
import Link from 'next/link';
import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Typography,
    TextField,
    IconButton,
    Avatar,
    Alert,
    Snackbar,
    DialogActions,
    Grid,
    Tooltip
} from '@mui/material'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import DeleteIcon from '@mui/icons-material/Delete'
import { useDispatch, useSelector } from 'react-redux'
import {
    fetchSeatingArrangements,
    fetchSeatingByEmployeeId
} from '@/redux/features/sittingArrangment/seatingArrangementSlice'
import type { AppDispatch, RootState } from '@/redux/store'
import AddSeatingArrangementForm from '../components/sitting-arrangment/AddSeatingArrangementForm'

export default function SeatingArrangementList() {
    const dispatch = useDispatch<AppDispatch>()
    const { seatingArrangements, loading, total } = useSelector((state: RootState) => state.sittingArrangment)
    const [showForm, setShowForm] = useState(false)
    const [selectedSeatingArrangement, setSelectedSeatingArrangement] = useState<string | null>(null)
    const [selectedKeyword, setSelectedKeyword] = useState('')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)

    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    const userRole = userData.role
    const userId = userData.id

    const fetchData = useCallback(() => {
        if (userRole === '1') {
            dispatch(fetchSeatingArrangements({ page, limit, keyword: selectedKeyword }))
        } else {
            dispatch(fetchSeatingByEmployeeId({ employeeId: userId, page, limit }))
        }
    }, [userRole, userId, page, limit, selectedKeyword, dispatch])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedKeyword(e.target.value)
    }

    const handleFormSubmitSuccess = (message: string) => {
        setSnackbarMessage(message)
        setSnackbarOpen(true)
    }

    const handleFormSubmitError = (message: string) => {
        setSnackbarMessage(message)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
    }

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false)
    }

    const handlePageChange = (params: { page: number; pageSize: number }) => {
        setPage(params.page + 1)
        setLimit(params.pageSize)
    }

    const handleAddSeatingArrangement = () => {
        setSelectedSeatingArrangement(null)
        setShowForm(true)
    }

    const handleEditSeatingArrangement = (seatingArrangement: any) => {
        setSelectedSeatingArrangement(seatingArrangement)
        setShowForm(true)
    }

    const handleDeleteConfirmation = (id: string) => {
        setDeleteId(id)
        setConfirmDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!deleteId) return

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/delete/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                setSnackbarMessage('Seating arrangement deleted successfully.')
                setSnackbarSeverity('success')
                fetchData();
            } else {
                const errorResult = await response.json()
                setSnackbarMessage(`Failed to delete seating arrangement: ${errorResult.message}`)
                setSnackbarSeverity('error')
            }
        } catch (error) {
            setSnackbarMessage('Error deleting seating arrangement. Please try again.')
            setSnackbarSeverity('error')
        } finally {
            setSnackbarOpen(true)
            setConfirmDialogOpen(false)
        }
    }

    const handleCancelDelete = () => {
        setConfirmDialogOpen(false)
        setDeleteId(null)
    }

    const generateColumns = useMemo(() => {
        const columns: GridColDef[] = [
            {
                field: 'employeeName',
                headerName: 'Employee',
                minWidth: 200,
                headerAlign: 'center',
                renderCell: params => (
                    <Box display='flex' alignItems='center'>
                        <Avatar src={params.row.employeeImage} sx={{ mr: 1, width: 32, height: 32 }} />
                        <Typography variant='body2' noWrap>
                            {params.row.employeeName}
                        </Typography>
                    </Box>
                )
            },
            {
                field: 'code',
                headerName: 'Emp ID',
                minWidth: 100,
                headerAlign: 'center',
                align: 'center'
            },
            {
                field: 'seatNo',
                headerName: 'Seat No',
                minWidth: 100,
                headerAlign: 'center',
                align: 'center'
            },
            {
                field: 'updatedAt',
                headerName: 'Assigned Date',
                minWidth: 150,
                headerAlign: 'center',
                align: 'center',
                renderCell: params => (
                    <Typography variant='body2' noWrap>
                        {new Date(params.value).toLocaleDateString()}
                    </Typography>
                )
            },
            {
                field: 'designation',
                headerName: 'Designation',
                minWidth: 150,
                headerAlign: 'center',
                align: 'center'
            },
            {
                field: 'location',
                headerName: 'Location',
                minWidth: 150,
                headerAlign: 'center',
                align: 'center'
            }
        ]

        if (userRole === '1') {
            columns.push({
                field: 'actions',
                headerName: 'Actions',
                minWidth: 150,
                headerAlign: 'center',
                align: 'center',
                renderCell: params => (
                    <Box display='flex' gap={1} justifyContent='center'>
                        <Button
                            variant='contained'
                            color='info'
                            startIcon={<EditIcon />}
                            onClick={() => handleEditSeatingArrangement(params.row)}
                        >
                            Edit
                        </Button>
                        <IconButton color='error' onClick={() => handleDeleteConfirmation(params.row._id)}>
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                )
            })
        }

        return columns
    }, [userRole, handleEditSeatingArrangement, handleDeleteConfirmation])

    const rows = useMemo(() => {
        return seatingArrangements.map(seating => ({
            _id: seating._id,
            seatNo: seating.seatNo,
            createdAt: seating.createdAt,
            updatedAt: seating.updatedAt,
            employeeName: `${seating.employee?.first_name || ''} ${seating.employee?.last_name || ''}`,
            employeeImage: seating.employee?.image || '',  // Add this line for employee image
            code: seating.employee?.code || '',
            designation: seating.employee?.designation || 'N/A',
            location: seating.employee?.location.toLocaleUpperCase() || 'N/A'
        }))
    }, [seatingArrangements])

    return (
        <Box sx={{ flexGrow: 1, padding: 2 }}>
            <ToastContainer position='top-center' />
            <Dialog open={showForm} onClose={() => setShowForm(false)} fullWidth maxWidth='md'>
                <DialogContent>
                    <AddSeatingArrangementForm
                        seatingArrangementId={selectedSeatingArrangement?._id}
                        handleClose={() => setShowForm(false)}
                        onFormSubmitSuccess={handleFormSubmitSuccess}
                        onFormSubmitError={handleFormSubmitError}
                    />
                </DialogContent>
            </Dialog>

            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleCloseSnackbar}>
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarSeverity}
                    sx={{
                        width: '100%',
                        color: 'white',
                        backgroundColor: snackbarSeverity === 'success' ? 'green' : 'red'
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>


            <Dialog open={confirmDialogOpen} onClose={handleCancelDelete}>
                <DialogContent>
                    <Alert severity='warning'>Are you sure you want to delete this seating arrangement?</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color='inherit'>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color='error'>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
                <div>
                    <Typography style={{ fontSize: '2em' }} variant="h5" gutterBottom>
                        Seat Layout
                    </Typography>
                    <Typography style={{ fontSize: '1em', fontWeight: 'bold', marginBottom: 2 }} variant="subtitle1" gutterBottom>
                        Dashboard / Seating
                    </Typography>
                </div>

                <Box display="flex" flexDirection="column" alignItems="flex-end">
                    {userRole === '1' && (
                        <Tooltip title="Add Spot" arrow>
                            <Button
                                style={{ borderRadius: '10rem', marginBottom: '0.5rem' }} // Adds spacing between button and link
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddSeatingArrangement}
                            >
                                Add Spot
                            </Button>
                        </Tooltip>
                    )}

                    <Link href="/seat-layout" passHref>
                        <Tooltip title="View Seating Layout" arrow>
                            <Typography
                                color="primary"
                                sx={{
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    display: 'inline-block',
                                    padding: '0.4rem 0.6rem'
                                }}
                            >
                                Seating Chart
                            </Typography>
                        </Tooltip>
                    </Link>
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

            <Box sx={{ height: 600, width: '100%', marginTop: 2 }}>
                <DataGrid
                    rows={rows}
                    columns={generateColumns}
                    getRowId={row => row._id}
                    loading={loading}
                    paginationMode='server'
                    rowCount={total}
                    pageSizeOptions={[10, 20, 30]}
                    paginationModel={{ page: page - 1, pageSize: limit }}
                    onPaginationModelChange={handlePageChange}
                    disableRowSelectionOnClick
                    sx={{
                        height: 600,
                        '& .super-app-theme--header': {
                            fontSize: 18,
                            fontWeight: 600,
                            alignItems: 'center'
                        },
                        '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
                            background: '#2c3ce3 !important',
                            color: 'white'
                        },
                        '& .MuiDataGrid-cell': {
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px'
                        },
                        '& .MuiDataGrid-row': {
                            fontWeight: '600',
                            fontSize: '12px',
                            boxSizing: 'border-box'
                        }
                    }}
                    {...(userRole === '1' && { slots: { toolbar: GridToolbar } })}
                />
            </Box>
        </Box>
    )
}
