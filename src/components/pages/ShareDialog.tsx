'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Autocomplete,
    TextField,
    Checkbox,
    Box,
    Typography,
    Avatar,
    Chip,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import type { AppDispatch, RootState } from '@/redux/store';
import { sharePage } from '@/redux/features/pages/pagesSlice';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

interface Employee {
    _id: string;
    first_name: string;
    last_name: string;
    image?: string;
    designation?: string;
}

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    pageId: string;
    currentSharedWith: string[];
}

export default function ShareDialog({
    open,
    onClose,
    pageId,
    currentSharedWith,
}: ShareDialogProps) {
    const dispatch: AppDispatch = useDispatch();
    const { employees } = useSelector((state: RootState) => state.employees);
    const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Preselect already shared employees
        if (employees.length > 0 && currentSharedWith.length > 0) {
            const preselected = employees.filter((emp) =>
                currentSharedWith.includes(emp._id)
            );
            setSelectedEmployees(preselected);
        }
    }, [employees, currentSharedWith]);

    useEffect(() => {
        if (employees.length === 0) {
            dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }))
        }
    }, [dispatch, employees.length])

    const handleShare = async () => {
        setLoading(true);
        try {
            const employeeIds = selectedEmployees.map((emp) => emp._id);
            await dispatch(sharePage({ id: pageId, employee_ids: employeeIds })).unwrap();
            toast.success('Page shared successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to share page');
        } finally {
            setLoading(false);
        }
    };

    console.log('Rendering ShareDialog with selectedEmployees:', employees);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon />
                    <Typography variant="h6">Share Page with Employees</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Autocomplete
                        multiple
                        id="employee-autocomplete"
                        options={employees}
                        value={selectedEmployees}
                        onChange={(event, newValue) => {
                            setSelectedEmployees(newValue);
                        }}
                        getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        disableCloseOnSelect
                        renderOption={(props, option, { selected }) => (
                            <li {...props}>
                                <Checkbox checked={selected} sx={{ mr: 1 }} />
                                <Avatar
                                    src={option.image}
                                    alt={option.first_name}
                                    sx={{ width: 32, height: 32, mr: 2 }}
                                />
                                <Box>
                                    <Typography variant="body1">
                                        {option.first_name} {option.last_name}
                                    </Typography>
                                    {option.designation && (
                                        <Typography variant="caption" color="text.secondary">
                                            {option.designation}
                                        </Typography>
                                    )}
                                </Box>
                            </li>
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    {...getTagProps({ index })}
                                    key={option._id}
                                    avatar={<Avatar src={option.image} alt={option.first_name} />}
                                    label={`${option.first_name} ${option.last_name}`}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Select Employees"
                                placeholder="Search employees..."
                                variant="outlined"
                                helperText={
                                    selectedEmployees.length > 0
                                        ? `${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''
                                        } selected`
                                        : 'Select employees to share this page with'
                                }
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#fff',
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        )}
                    />
                </Box>

                {selectedEmployees.length === 0 && (
                    <Box
                        sx={{
                            mt: 3,
                            p: 2,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 2,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            💡 No employees selected. The page will be private (admin only).
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleShare}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                >
                    {loading ? 'Sharing...' : 'Share Page'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
