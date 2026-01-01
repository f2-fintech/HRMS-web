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
    fetchQueriesByToQueryId,
    fetchAllQueries,
} from '@/redux/features/queries/queriesSlice';
import QueryForm from '@/components/query/QueryForm';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

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
    const [snackbarSeverity, setSnackbarSeverity] =
        useState<'success' | 'error'>('success');

    const [selectedDate, setSelectedDate] = React.useState(dayjs());

    // 🔹 teams + HR detection
    const [teams, setTeams] = useState<any[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [isHr, setIsHr] = useState(false); // <- HR team member?

    const month = selectedDate.format('MM');
    const year = selectedDate.format('YYYY');

    const handleDateChange = (newValue: Dayjs | null) => {
        if (newValue) {
            setSelectedDate(newValue);
        }
    };

    // Admin + HR ke liye same behaviour
    const isAdminLike = userRole === '1' || isHr;

    // ------------------------
    // Debounced fetch of queries (list reload)
    // ------------------------
    const debouncedFetch = useMemo(
        () =>
            debounce(() => {
                if (isAdminLike) {
                    // Admin ya HR → all queries with month + year filter
                    dispatch(
                        fetchAllQueries({
                            page,
                            limit,
                            keyword: selectedKeyword,
                            month: month,
                            year: year,
                        }),
                    );
                } else if (queryType === 'own') {
                    // Logged-in user → queries created by user
                    dispatch(
                        fetchUserQueries({
                            page,
                            limit,
                            keyword: selectedKeyword,
                            month: '0',
                            year: year,
                        }),
                    );
                } else {
                    // Logged-in user → queries assigned to this user (toQuery = userId)
                    dispatch(
                        fetchQueriesByToQueryId({
                            toQueryId: userId,
                            page,
                            limit,
                            keyword: selectedKeyword,
                            month: 0,
                            year: year,
                        }),
                    );
                }
            }, 300),
        [dispatch, page, limit, selectedKeyword, queryType, userId, isAdminLike, month, year],
    );

    // ------------------------
    // Autocomplete ke liye department search (backend endpoint)
    // ------------------------
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

    // Search input debounced keyword
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

    // ------------------------
    // Initial load: user details + teams + queries
    // ------------------------
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role);
        setUserId(user.id);

        // pehle teams load karo, usse HR detect karenge
        const fetchTeamsAndDetectHr = async () => {
            try {
                setTeamsLoading(true);
                const token = localStorage.getItem('token') || '';
                const cid =
                    localStorage.getItem('company_id') || user.company_id || '';

                const resp = await fetch(`${API_BASE_URL}/teams/get-all-teams`, {
                    headers: {
                        Authorization: `Bearer ${token} ${cid}`,
                    },
                });

                const json = await resp.json();
                const teamArr = Array.isArray(json) ? json : json.teams || [];
                setTeams(teamArr);

                // 🔍 Check: current user HR team me hai kya?
                if (user.id) {
                    const lowerUserId = String(user.id);

                    const memberOfHr = teamArr.some((team: any) => {
                        const name = String(team.name || team.code || '').toUpperCase();
                        const isHrTeam =
                        
                            name === 'HR TEAM' ||
                            name.includes('human resource') ||
                            name.includes('human resources');

                        if (!isHrTeam) return false;

                        let ids: string[] = [];

                        if (typeof team.employee_ids === 'string') {
                            ids = team.employee_ids
                                .split(',')
                                .map((s: string) => s.trim())
                                .filter(Boolean);
                        } else if (Array.isArray(team.employee_ids)) {
                            ids = team.employee_ids
                                .map((id: any) => (typeof id === 'string' ? id : id?._id))
                                .filter(Boolean);
                        }

                        return ids.some(id => String(id) === lowerUserId);
                    });

                    setIsHr(memberOfHr);
                }
            } catch (err) {
                console.error('Error loading teams in listing page', err);
            } finally {
                setTeamsLoading(false);
            }
        };

        fetchTeamsAndDetectHr();
    }, []);

    // teams / isAdminLike ready hone ke baad queries fetch
    useEffect(() => {
        debouncedFetch();
        return debouncedFetch.cancel;
    }, [debouncedFetch]);

    // ------------------------
    // Form open & close
    // ------------------------
    const handleQueryAddClick = useCallback(() => {
        setSelectedQuery(null);
        setShowForm(true);
    }, []);

    const toggleQueryView = useCallback(() => {
        setQueryType(prevType => (prevType === 'against' ? 'own' : 'against'));
    }, []);

    // ✅ Parent ka onSubmit sirf UI handle karega
    const handleFormSubmit = (savedQuery: any) => {
        setSnackbarMessage(
            selectedQuery ? 'Query updated successfully!' : 'Query created successfully!',
        );
        setSnackbarSeverity('success');
        setOpenSnackbar(true);

        setShowForm(false);
        setSelectedQuery(null);

        // list refresh
        debouncedFetch();
    };

    const handleClose = useCallback(() => {
        setShowForm(false);
        setSelectedQuery(null);
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

    // ------------------------
    // Columns config
    // ------------------------
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
                        renderCell: params => (
                            <Box display="flex" alignItems="center">
                                <Avatar
                                    src={params.row.employee?.image}
                                    sx={{ mr: 1, width: 32, height: 32 }}
                                />
                                <Typography variant="body2" noWrap>
                                    {params.row.employee?.first_name}{' '}
                                    {params.row.employee?.last_name}
                                </Typography>
                            </Box>
                        ),
                    },
                ]
                : []),
            ...(isAdminLike || (queryType !== 'against' && userRole)
                ? [
                    {
                        field: 'toQueryName',
                        headerName: 'Directed To',
                        minWidth: 200,
                        headerAlign: 'center',
                        align: 'center',
                        renderCell: params => (
                            <Box display="flex" alignItems="center">
                                <Avatar
                                    src={params.row.toQuery?.image}
                                    sx={{ mr: 1, width: 32, height: 32 }}
                                />
                                <Typography variant="body2" noWrap>
                                    {params.row.toQuery?.first_name}{' '}
                                    {params.row.toQuery?.last_name}
                                </Typography>
                            </Box>
                        ),
                    },
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
            // 🔹 Team column
            {
                field: 'team',
                headerName: 'Team',
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
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
    }, [queryType, userRole, isAdminLike]);

    // ------------------------
    // Rows mapping – Team name nikalna (toQuery employee se)
    // ------------------------
    const rows = useMemo(() => {
        const employeeToTeamMap = new Map<string, string>();

        teams.forEach(team => {
            let ids: string[] = [];

            if (typeof team.employee_ids === 'string') {
                ids = team.employee_ids
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean);
            } else if (Array.isArray(team.employee_ids)) {
                ids = team.employee_ids
                    .map((id: any) => (typeof id === 'string' ? id : id?._id))
                    .filter(Boolean);
            }

            const teamName = team.name || team.code || '';
            ids.forEach(id => {
                if (id && teamName) {
                    employeeToTeamMap.set(String(id), teamName);
                }
            });
        });

        return queries.map(query => {
            const toQuery = query.toQuery;
            const toQueryId =
                (toQuery && (toQuery._id || toQuery.id)) || query.toQuery;

            const teamName =
                (toQueryId && employeeToTeamMap.get(String(toQueryId))) || '';

            return {
                _id: query._id,
                queryType: query.queryType,
                description: query.description,
                team: teamName,
                status: query.status,
                assignedDate: query.assignedDate,
                updateDate: query.updateDate,
                employee: query.employee,
                toQuery: query.toQuery,
            };
        });
    }, [queries, teams]);

    // ------------------------
    // JSX
    // ------------------------
    return (
        <Box>
            <ToastContainer />
            <Box sx={{ flexGrow: 1, padding: 4 }}>
                {/* Dialog for Create / Edit Query */}
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

                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
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

                {/* Filters row: Search + Date */}
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
                    <Grid item xs={12} md={4} display="flex" justifyContent="flex-end">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                views={isAdminLike ? ['month', 'year'] : ['year']}
                                label={isAdminLike ? 'Select Month and Year' : 'Select Year'}
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

            {/* DataGrid */}
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
                        if (params.row.status === 'On Progress') return 'status-on-progress';
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
                        // Custom row color classes
                        '& .status-pending': { backgroundColor: 'rgba(255, 255, 0, 0.2)' },
                        '& .status-resolved': { backgroundColor: 'rgba(0, 255, 0, 0.2)' },
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
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Query;
