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
} from '@mui/material';
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import { format } from 'date-fns'

import type { AppDispatch, RootState } from '@/redux/store';
import 'react-toastify/dist/ReactToastify.css';
import AddCompanyForm from '@/components/company/CompanyForm';
import { fetchCompanies } from '@/redux/features/company/companyslice';

// Custom Theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#2c3ce3',
        },
        background: {
            default: '#f4f6f9',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    },
                },
            },
        },
    },
});

export default function CompanyListing() {
    const dispatch: AppDispatch = useDispatch();
    const { companies, loading, error, total } = useSelector((state: RootState) => state.companies);
    const [showForm, setShowForm] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [userRole, setUserRole] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [selectedKeyword, setSelectedKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isHalfDay, setIsHalfDay] = useState(false);

    const debouncedFetch = useCallback(
        debounce(() => {
            dispatch(fetchCompanies({ page, limit, keyword: selectedKeyword }));
        }, 300),
        [page, limit, selectedKeyword]
    );

    useEffect(() => {
        debouncedFetch();

        return debouncedFetch.cancel;
    }, [page, limit, selectedKeyword, debouncedFetch]);

    const handleInputChange = (e) => {
        setSelectedKeyword(e.target.value);
    };

    const handlePageChange = (newPage: number, newPageSize: number) => {
        setPage(newPage + 1);
        setLimit(newPageSize);
    };

    const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
        handlePageChange(params.page, params.pageSize);
        debouncedFetch();
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || '{}');

        setUserRole(user.role);
        setUserId(user.id);
    }, []);

    const handleCompanyAddClick = () => {
        setSelectedCompany(null);
        setShowForm(true);
    };

    const handleCompanyEditClick = (id) => {
        setSelectedCompany(id);
        setShowForm(true);
    };

    const handleClose = () => {
        setShowForm(false);
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Name', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 0.5 },
        { field: 'address', headerName: 'Address', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1 },
        { field: 'website', headerName: 'Web Site', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1 },
        { field: 'email', headerName: 'Email', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1 },
        { field: 'phone', headerName: 'Phone', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1 },
        { field: 'status', headerName: 'Status', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 0.5 },
        { field: 'subscriptionType', headerName: 'Subscription Type', headerClassName: 'super-app-theme--header', headerAlign: 'center', align: 'center', flex: 1 },
        ...(userRole === '0'
            ? [
                {
                    field: 'edit',
                    headerName: 'Edit',
                    sortable: false,
                    headerAlign: 'center',
                    flex: 0.5,
                    headerClassName: 'super-app-theme--header',
                    renderCell: ({ row: { _id } }) => (
                        <Box width="85%" m="0 auto" p="5px" display="flex" justifyContent="space-around">
                            <Button
                                color="info"
                                variant="contained"
                                sx={{
                                    minWidth: '50px',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                    }
                                }}
                                onClick={() => handleCompanyEditClick(_id)}
                            >
                                <DriveFileRenameOutlineOutlined />
                            </Button>
                        </Box>
                    ),
                },
            ]
            : []),
    ];


    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                backgroundColor: theme.palette.background.default,
                minHeight: '100vh',
                padding: 3
            }}>
                <ToastContainer />
                <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth="md">
                    <DialogContent sx={{
                        borderRadius: '16px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                        <AddCompanyForm
                            company={selectedCompany}
                            handleClose={handleClose}
                            companies={companies}
                            debouncedFetch={debouncedFetch}
                        />
                    </DialogContent>
                </Dialog>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                    sx={{
                        padding: 2,
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            gutterBottom
                            sx={{
                                color: theme.palette.primary.main,
                                fontWeight: 700,
                                marginBottom: 1
                            }}
                        >
                            Company Management
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 500
                            }}
                        >
                            Dashboard / Company List
                        </Typography>
                    </Box>
                    {userRole === '0' && (
                        <Box display="flex" alignItems="center">
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleCompanyAddClick}
                                sx={{
                                    padding: '10px 20px',
                                    fontSize: '1rem',
                                }}
                            >
                                Add New Company
                            </Button>
                        </Box>
                    )}
                </Box>
                <Grid container spacing={3} alignItems="center" mb={3}>
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            label="Search Companies"
                            variant="outlined"
                            value={selectedKeyword}
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
                </Grid>
                <Box
                    sx={{
                        height: 600,
                        width: '100%',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                        overflow: 'hidden'
                    }}
                >
                    <DataGrid
                        sx={{
                            '& .super-app-theme--header': {
                                fontSize: 16,
                                fontWeight: 700,
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                textTransform: 'uppercase',
                            },
                            '& .MuiDataGrid-cell': {
                                fontSize: 14,
                                fontWeight: 500,
                            },
                            '& .MuiDataGrid-row': {
                                '&:nth-of-type(odd)': {
                                    backgroundColor: 'rgba(44, 60, 227, 0.05)',
                                },
                                '&:nth-of-type(even)': {
                                    backgroundColor: 'white',
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(44, 60, 227, 0.1)',
                                },
                            },
                        }}
                        components={{
                            Toolbar: GridToolbar,
                        }}
                        rows={companies}
                        columns={columns}
                        getRowId={(row) => row._id}
                        paginationMode="server"
                        rowCount={total}
                        onPaginationModelChange={handlePaginationModelChange}
                        pageSizeOptions={[10, 20, 30]}
                        paginationModel={{ page: page - 1, pageSize: limit }}
                        disableRowSelectionOnClick
                    />
                </Box>
            </Box>
        </ThemeProvider>
    );
}


