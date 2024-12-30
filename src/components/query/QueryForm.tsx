import React, { useState, useEffect } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Grid,
    TextField,
    Typography,
    Paper,
    Divider,
    Container,
    useTheme,
    InputAdornment
} from '@mui/material';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { apiResponse } from '../../utility/apiResponse/employeesResponse';

interface QueryFormProps {
    onSubmit: (queryData: QueryFormData) => void;
    query?: any;
    userRole: string;
    onClose: () => void;
    queryType: 'against' | 'own';
}

interface QueryFormData {
    toQuery: string;
    queryType: string;
    description: string;
    department: string;
    status?: string;
    company_id?: string;
}

const departments = [
    'IT Web Developer',
    'Marketing',
    'Relationship Executive',
    'IT & INFRA',
    'OPERATION',
    'CREDIT',
    'Sales',
    "HR"
];

const statuses = ['Pending', 'Resolved', 'On Process'];

const QueryForm: React.FC<QueryFormProps> = ({ onSubmit, query, userRole, onClose, queryType }) => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || '{}') : {};
    const company_id = user?.company_id;
    const theme = useTheme();
    const [formData, setFormData] = useState<QueryFormData>({
        toQuery: '',
        queryType: '',
        description: '',
        department: '',
        status: 'Pending',
        company_id: company_id
    });

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState<boolean>(false);

    const isEditMode = !!query;
    const isAgainstQuery = queryType === 'against';

    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const data = await apiResponse();
                setEmployees(data);
                if (query) {
                    setFormData({
                        toQuery: query.toQuery?._id || '',
                        queryType: query.queryType || '',
                        description: query.description || '',
                        department: query.department || '',
                        status: query.status || 'Pending',
                        company_id: query?.company_id
                    });
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [query]);

    const handleEmployeeChange = (event: any, value: any) => {
        setFormData((prev) => ({
            ...prev,
            toQuery: value ? value._id : '',
        }));
    };

    const handleDepartmentChange = (event: any, value: string) => {
        setFormData((prev) => ({
            ...prev,
            department: value,
        }));
    };

    const handleStatusChange = (event: any, value: string) => {
        setFormData((prev) => ({
            ...prev,
            status: value,
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        let tempErrors: { [key: string]: string } = {};
        if (!formData.toQuery) tempErrors.toQuery = 'Assigned to name is required';
        if (!formData.queryType) tempErrors.queryType = 'Query Type is required';
        if (!formData.department) tempErrors.department = 'Department is required';
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            setSubmitting(true);
            try {
                onSubmit(formData);
            } finally {
                setSubmitting(false);
            }
        }
    };

    const createdByEmployee = employees.find(emp => emp._id === (query?.employee?._id || query?.employee));
    const toQueryEmployee = employees.find(emp => emp._id === formData.toQuery);

    return (
        <Container maxWidth="md">
            <Paper
                elevation={6}
                sx={{
                    mt: 4,
                    mb: 4,
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: theme.shadows[4]
                }}
            >
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #4791db 100%)',
                        color: 'white',
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative'
                    }}
                >
                    <Box display="flex" alignItems="center">
                        <AssignmentIcon sx={{ mr: 2, fontSize: 32 }} />
                        <Typography variant="h5" component="h1" fontWeight="bold" sx={{ color: 'white' }}>
                            {query ? 'Edit Query' : 'Create a New Query'}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        aria-label="close"
                        sx={{
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.2)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 4,
                        '& .MuiTextField-root': { mb: 2 },
                        '& .MuiAutocomplete-root': { mb: 2 }
                    }}
                >
                    <Grid container spacing={3}>
                        {query && (
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={employees}
                                    getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                                    loading={loading}
                                    value={createdByEmployee || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Query By"
                                            placeholder="Employee"
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PersonIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <>
                                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    disabled
                                />
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Autocomplete
                                options={employees}
                                getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                                loading={loading}
                                onChange={handleEmployeeChange}
                                value={toQueryEmployee || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Query To"
                                        placeholder="Select Employee"
                                        error={Boolean(errors.toQuery)}
                                        helperText={errors.toQuery}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon color="action" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        disabled={isEditMode}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={departments}
                                onChange={handleDepartmentChange}
                                value={departments.find((dept) => dept === formData.department) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Department"
                                        placeholder="Select Department"
                                        error={Boolean(errors.department)}
                                        helperText={errors.department}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <WorkIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                        disabled={isEditMode && isAgainstQuery}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Query Type"
                                name="queryType"
                                value={formData.queryType}
                                onChange={handleChange}
                                required
                                error={Boolean(errors.queryType)}
                                helperText={errors.queryType}
                                disabled={isEditMode && isAgainstQuery}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DescriptionIcon color="action" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Autocomplete
                                options={statuses}
                                onChange={handleStatusChange}
                                value={statuses.find((status) => status === formData.status) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Status"
                                        placeholder="Select Status"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CheckCircleIcon color="action" />
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                )}
                                disabled={!query || !(userRole === '1' || isAgainstQuery)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                multiline
                                rows={4}
                                disabled={isEditMode && isAgainstQuery}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <DescriptionIcon color="action" />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: 2
                                        }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                startIcon={<AssignmentIcon />}
                                sx={{
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    background: 'linear-gradient(135deg, #1976d2 0%, #4791db 100%)',
                                    boxShadow: theme.shadows[3],
                                    '&:hover': {
                                        boxShadow: theme.shadows[5],
                                        background: 'linear-gradient(135deg, #1565c0 0%, #2196f3 100%)'
                                    }
                                }}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    query ? 'Update Query' : 'Submit Query'
                                )}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default QueryForm;
