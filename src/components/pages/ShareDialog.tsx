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
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Alert,
    Stack,
    Paper,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import {
    People as PeopleIcon,
    Close as CloseIcon,
    Link as LinkIcon,
    CheckCircle as CheckIcon,
    PersonAdd as PersonAddIcon,
    ContentCopy as CopyIcon,
} from '@mui/icons-material';
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
    const [copySuccess, setCopySuccess] = useState(false);

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

    const handleCopyLink = () => {
        const pageUrl = `${window.location.origin}/pages/${pageId}`;
        navigator.clipboard.writeText(pageUrl).then(() => {
            setCopySuccess(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const handleRemoveEmployee = (employeeId: string) => {
        setSelectedEmployees(selectedEmployees.filter((emp) => emp._id !== employeeId));
    };

    const handleSelectAll = () => {
        setSelectedEmployees([...employees]);
    };

    const handleClearAll = () => {
        setSelectedEmployees([]);
    };

    console.log('Rendering ShareDialog with selectedEmployees:', employees);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Share Page
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {/* Copy Link Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.default',
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <LinkIcon color="action" />
                        <Box flexGrow={1}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Share Link
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Anyone with the link and access can view this page
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={copySuccess ? <CheckIcon /> : <CopyIcon />}
                            onClick={handleCopyLink}
                            sx={{ borderRadius: 2 }}
                        >
                            {copySuccess ? 'Copied!' : 'Copy Link'}
                        </Button>
                    </Stack>
                </Paper>

                <Divider sx={{ mb: 3 }}>
                    <Chip label="OR" size="small" />
                </Divider>

                {/* Employee Selection */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                            Share with Specific Employees
                        </Typography>
                        {employees.length > 0 && (
                            <Stack direction="row" spacing={1}>
                                <Button
                                    size="small"
                                    onClick={handleSelectAll}
                                    disabled={selectedEmployees.length === employees.length}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="small"
                                    onClick={handleClearAll}
                                    disabled={selectedEmployees.length === 0}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Clear All
                                </Button>
                            </Stack>
                        )}
                    </Stack>

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
                                    <Typography variant="body2">
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
                        renderTags={() => null} // Hide tags in input, show in list below
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search employees by name..."
                                variant="outlined"
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <>
                                            <PersonAddIcon sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />
                                            {params.InputProps.startAdornment}
                                        </>
                                    ),
                                }}
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

                {/* Selected Employees List */}
                {selectedEmployees.length > 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            maxHeight: 300,
                            overflow: 'auto',
                        }}
                    >
                        <List dense>
                            {selectedEmployees.map((employee, index) => (
                                <React.Fragment key={employee._id}>
                                    {index > 0 && <Divider />}
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar src={employee.image} alt={employee.first_name} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={500}>
                                                    {employee.first_name} {employee.last_name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {employee.designation || 'No designation'}
                                                </Typography>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Remove">
                                                <IconButton
                                                    edge="end"
                                                    size="small"
                                                    onClick={() => handleRemoveEmployee(employee._id)}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                ) : (
                    <Alert severity="info" icon={<PeopleIcon />} sx={{ borderRadius: 2 }}>
                        No employees selected. Select employees to share this page with them.
                    </Alert>
                )}

                {/* Summary */}
                {selectedEmployees.length > 0 && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: 'success.lighter',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'success.light',
                        }}
                    >
                        <Typography variant="body2" color="success.dark">
                            <strong>{selectedEmployees.length}</strong> {selectedEmployees.length === 1 ? 'employee' : 'employees'} will have read-only access to this page
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleShare}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ minWidth: 120, borderRadius: 2 }}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PeopleIcon />}
                >
                    {loading ? 'Sharing...' : 'Share Page'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
