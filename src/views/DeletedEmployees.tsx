'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
    Box,
    Grid,
    Typography,
    TextField,
    Button,
    Dialog,
    DialogContent,
    Autocomplete,
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import {
    fetchEmployees,
    resetEmployees,
    deleteEmployees,
} from '../redux/features/employees/employeesSlice';
import { fetchDesignations } from '@/redux/features/designation/designationSlice';
import Loader from '../components/loader/loader';
import EmployeeForm from '@/components/employee/EmployeeForm';
import EmployeeCard from '@/components/employee/EmployeeCard';
import { utility } from '@/utility';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RootState } from '@/redux/store';
import useDebounce from '@/utility/debounce/useDebounce';

const { isTokenExpired } = utility();

export default function DeletedEmployeeGrid() {
    const dispatch = useDispatch();
    const { deletedEmployees, hasMore, loading, error } = useSelector(
        (state: RootState) => state.employees
    );
    const { designations } = useSelector((state: RootState) => state.designations);

    const [showForm, setShowForm] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchName, setSearchName] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState('');
    const [page, setPage] = useState(1);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const router = useRouter();

    const capitalizeWords = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    useEffect(() => {
        if (isTokenExpired(token)) {
            localStorage.removeItem('token');
            router.push('/login');
        } else {
            if (userRole === '') {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                setUserRole(user.role);
            }
        }
    }, [token, userRole, router]);

    useEffect(() => {
        dispatch(fetchDesignations({ page: 1, limit: 0, keyword: '' }));
        dispatch(deleteEmployees({ page: 1, limit: 12, search: '', designation: '' }));
    }, [dispatch]);

    const handleScroll = useCallback(() => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading && hasMore) {
            setPage((prevPage) => {
                const nextPage = prevPage + 1;
                dispatch(deleteEmployees({ page: nextPage, limit: 12, search: searchName, designation: selectedDesignation }));
                return nextPage;
            });
        }
    }, [loading, hasMore, searchName, selectedDesignation, dispatch]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleAddEmployeeClick = () => {
        setSelectedEmployee(null);
        setShowForm(true);
    };

    const handleEditEmployeeClick = (employee: any) => {
        setSelectedEmployee(employee.employee_data);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        const confirmDelete = confirm('Are you sure you want to restore this employee?');
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/restore/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer',
                },
            });

            if (response.ok) {
                dispatch(deleteEmployees({ page: 1, limit: 12, search: '', designation: '' }));
                toast.success('Employee deleted successfully.');
            } else {
                const errorResult = await response.json();
                toast.error(`Failed to delete employee: ${errorResult.message}`);
            }
        } catch (error) {
            toast.error('Error deleting employee. Please try again.');
        }
    };

    const handleClose = () => {
        setShowForm(false);
    };

    const debouncedSearchName = useDebounce(searchName, 500);
    const debouncedDesignation = useDebounce(selectedDesignation, 500);

    useEffect(() => {
        if (debouncedSearchName !== '' || debouncedDesignation !== '') {
            setPage(1);
            dispatch(resetEmployees());
            dispatch(
                deleteEmployees({
                    page: 1,
                    limit: 12,
                    search: debouncedSearchName,
                    designation: debouncedDesignation,
                })
            );
        } else {
            // Re-fetch default data when filters are cleared
            setPage(1);
            dispatch(resetEmployees());
            dispatch(deleteEmployees({ page: 1, limit: 12, search: '', designation: '' }));
        }
    }, [debouncedSearchName, debouncedDesignation, dispatch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;

        setSelectedDesignation('');
        setSearchName(searchValue);
        if (searchValue === '') {
            setPage(1);
            dispatch(resetEmployees());
            dispatch(deleteEmployees({ page: 1, limit: 12, search: '', designation: '' }));
        }
    };

    const handleDesignationChange = (e: any, newValue: string | null) => {
        const designationValue = newValue;

        setSearchName('');
        setSelectedDesignation(designationValue === null ? '' : designationValue);
        if (designationValue === '') {
            setPage(1);
            dispatch(resetEmployees());
            dispatch(deleteEmployees({ page: 1, limit: 12, search: '', designation: '' }));
        }
    };

    return (
        <>
            <ToastContainer position="top-center" autoClose={3000} />
            <Box sx={{ flexGrow: 1, padding: 2 }}>
                <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth="md">
                    <DialogContent>
                        <EmployeeForm
                            employee={selectedEmployee}
                            handleClose={handleClose}
                            employees={deletedEmployees}
                        />
                    </DialogContent>
                </Dialog>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography style={{ fontSize: '2em' }} variant="h5" gutterBottom>
                            Deleted Employees
                        </Typography>
                    </Box>
                </Box>
                <Grid container spacing={6} alignItems="center" mb={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Employee Name"
                            variant="outlined"
                            value={searchName}
                            onChange={handleInputChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <Autocomplete
                                id="designation-select"
                                options={designations.map((designation) => designation.title).sort()}
                                getOptionLabel={(option) => option}
                                renderInput={(params) => <TextField {...params} label="Select Designation" variant="outlined" />}
                                value={selectedDesignation}
                                onChange={handleDesignationChange}
                            />
                        </FormControl>
                    </Grid>
                </Grid>
                <Grid container spacing={6}>
                    {error ? (
                        <Typography>Error: {error}</Typography>
                    ) : (
                        deletedEmployees.map((employee: any) => (
                            <Grid item xs={12} sm={6} md={3} key={employee._id}>
                                <EmployeeCard
                                    employee={employee.employee_data}
                                    id={employee._id}
                                    capitalizeWords={capitalizeWords}
                                    handleEditEmployeeClick={() => handleEditEmployeeClick(employee)}
                                    handleDelete={handleDelete}
                                    deletedEmployee={true}
                                />
                            </Grid>
                        ))
                    )}
                </Grid>
                {loading && <Loader />}
            </Box>
        </>
    );
}
