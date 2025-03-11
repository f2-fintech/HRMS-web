'use client'
import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Autocomplete,
    InputAdornment,
    Paper,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Divider,
    Box
} from '@mui/material';
import {
    Person,
    CalendarMonth,
    Search,
    AccessTime,
    AccessTimeFilledOutlined,
    DateRange,
    Refresh,
    Download,
    NoAccounts,
    ArrowBack
} from '@mui/icons-material';
import axios from 'axios';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import { useRouter } from 'next/navigation';

interface Employee {
    _id: string;
    first_name: string;
    last_name: string;
    // add other employee properties if needed
}

interface Punch {
    _id: string;
    punchIn: string;
    punchOut: string;
    totalTime: string;
    date: string;
}

const PunchesPage: React.FC = () => {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [month, setMonth] = useState<string>('');
    const [punches, setPunches] = useState<Punch[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Set default month to the current month in "YYYY-MM" format
    useEffect(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        setMonth(currentMonth);
    }, []);

    // Fetch the list of employees on mount
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const data: Employee[] = await apiResponse();
                setEmployees(data);
                setError(null);
            } catch (error) {
                console.error('Failed to fetch employees', error);
                setError('Failed to load employee data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    // Fetch punches for the selected employee and month
    const handleFetchPunches = async () => {
        if (!selectedEmployee) {
            setError("Please select an employee first");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await axios.get<Punch[]>(
                `${process.env.NEXT_PUBLIC_APP_URL}/punch/employee/${selectedEmployee._id}/${month}`
            );
            setPunches(response.data);
            if (response.data.length === 0) {
                setError(`No punch records found for ${selectedEmployee.first_name} ${selectedEmployee.last_name} in ${formatMonthDisplay(month)}`);
            }
        } catch (error) {
            console.error('Error fetching punches:', error);
            setError('Failed to fetch punch data. Please try again.');
            setPunches([]);
        } finally {
            setLoading(false);
        }
    };

    // Format month for display (e.g., "2025-03" to "March 2025")
    const formatMonthDisplay = (monthStr: string): string => {
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } catch (e) {
            return monthStr;
        }
    };

    // Format time for better display with AM/PM
    const formatTime = (timeStr: string): string => {
        try {
            if (timeStr === "") {
                return "Not Punch-Out"
            } else {
                const time = new Date(`2000-01-01T${timeStr}`);
                return time.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        } catch (e) {
            return timeStr;
        }
    };

    // Calculate total hours from punch data
    const calculateTotalHours = (): string => {
        if (!punches || punches.length === 0) return "0.0";

        let totalHours = 0;

        punches.forEach(punch => {
            // Check if totalTime exists and is a valid format (like "8.5" or "10.0")
            if (punch.totalTime) {
                const hours = parseFloat(punch.totalTime);
                if (!isNaN(hours)) {
                    totalHours += hours;
                }
            }
        });

        return totalHours.toFixed(1); // Format to 1 decimal place
    };

    // Navigate back to previous page
    const handleBack = () => {
        router.back();
    };

    return (
        <Paper elevation={3} className="p-6 m-4 bg-white rounded-lg">
            <Box className="flex items-center mb-4">
                <Tooltip title="Back to Previous Page">
                    <IconButton
                        color="primary"
                        onClick={handleBack}
                        className="mr-2"
                        aria-label="back"
                    >
                        <ArrowBack />
                    </IconButton>
                </Tooltip>
                <Typography variant="h4" component="h1" className="font-bold text-gray-800 flex items-center">
                    <AccessTimeFilledOutlined className="mr-2" />
                    Employee Time Punches
                </Typography>
            </Box>

            <Divider className="mb-6" />

            {error && (
                <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box className="flex flex-col md:flex-row items-start gap-4 mb-6">
                <Autocomplete
                    options={employees}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                    value={selectedEmployee}
                    onChange={(event, newValue) => {
                        setSelectedEmployee(newValue);
                    }}
                    className="w-full md:w-2/5"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Select Employee"
                            variant="outlined"
                            fullWidth
                            required
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />

                <TextField
                    label="Month"
                    type="month"
                    variant="outlined"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full md:w-1/4"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <CalendarMonth color="primary" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button
                    variant="contained"
                    onClick={handleFetchPunches}
                    className="w-full md:w-auto h-14"
                    disabled={loading || !selectedEmployee}
                    startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                    color="primary"
                >
                    {loading ? 'Loading...' : 'Fetch Punches'}
                </Button>

                <Tooltip title="Refresh Data">
                    <IconButton
                        color="primary"
                        onClick={handleFetchPunches}
                        disabled={loading || !selectedEmployee}
                        className="ml-auto"
                    >
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {selectedEmployee && punches.length > 0 && (
                <Box className="bg-blue-50 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center">
                    <Typography variant="h6" className="font-medium text-blue-800 flex items-center">
                        <Person className="mr-2" />
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </Typography>

                    <Chip
                        icon={<DateRange />}
                        label={formatMonthDisplay(month)}
                        color="primary"
                        variant="outlined"
                        className="my-2 md:my-0"
                    />

                    <Chip
                        icon={<AccessTime />}
                        label={`Total Hours: ${calculateTotalHours()}`}
                        color="success"
                        className="font-medium"
                    />

                    {/* <Tooltip title="Export Data">
                        <IconButton color="primary">
                            <Download />
                        </IconButton>
                    </Tooltip> */}
                </Box>
            )}

            {punches.length > 0 ? (
                <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border-b p-3 text-left text-gray-700">Date</th>
                                <th className="border-b p-3 text-left text-gray-700">Punch In</th>
                                <th className="border-b p-3 text-left text-gray-700">Punch Out</th>
                                <th className="border-b p-3 text-left text-gray-700">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {punches.map((punch) => (
                                <tr key={punch._id} className="hover:bg-blue-50 transition-colors">
                                    <td className="border-b p-3 text-gray-800">{punch.date}</td>
                                    <td className="border-b p-3 text-green-600 font-medium">
                                        {formatTime(punch.punchIn)}
                                    </td>
                                    <td className="border-b p-3 text-red-600 font-medium">
                                        {formatTime(punch.punchOut)}
                                    </td>
                                    <td className="border-b p-3 text-blue-700 font-medium">
                                        {punch.totalTime}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !loading && (
                    <Box className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <NoAccounts style={{ fontSize: 60 }} className="text-gray-400 mb-2" />
                        <Typography variant="h6">No Punch Records</Typography>
                        <Typography variant="body2">
                            {selectedEmployee
                                ? `Select a different month or employee to view punch records.`
                                : `Please select an employee and month to view punch records.`}
                        </Typography>
                    </Box>
                )
            )}
        </Paper>
    );
};

export default PunchesPage;
