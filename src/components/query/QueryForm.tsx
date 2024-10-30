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
    useTheme
} from '@mui/material';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
    const theme = useTheme();
    const [formData, setFormData] = useState<QueryFormData>({
        toQuery: '',
        queryType: '',
        description: '',
        department: '',
        status: 'Pending',
    });

    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [submitting, setSubmitting] = useState<boolean>(false);

    const isEditMode = !!query; // Check if we are editing an existing query
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
                await onSubmit(formData);
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
                elevation={3}
                sx={{
                    mt: 4,
                    mb: 4,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >

                <Box
                    sx={{
                        bgcolor: 'blue',
                        color: 'white',
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}
                >
                    <Typography variant="h5" component="h1" fontWeight="bold" sx={{ color: 'white' }}>
                        {query ? 'Edit Query' : 'Create a New Query'}
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        aria-label="close"
                        sx={{ color: 'white', position: 'absolute', right: 16 }}
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
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                disabled={isEditMode || isAgainstQuery} // Disable if editing an "against" query
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
                                    />
                                )}
                                disabled={isEditMode && isAgainstQuery} // Disable if editing an "against" query
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
                                disabled={isEditMode && isAgainstQuery} // Disable if editing an "against" query
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
                                    />
                                )}
                                disabled={!query || !(userRole === '1' || isAgainstQuery)} // Enable if "against" query or role "1"
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
                                disabled={isEditMode && isAgainstQuery} // Disable if editing an "against" query
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused': {
                                            boxShadow: `0 0 0 2px ${theme.palette.primary.light}`
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
                                sx={{
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    boxShadow: theme.shadows[3],
                                    '&:hover': {
                                        boxShadow: theme.shadows[5]
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

