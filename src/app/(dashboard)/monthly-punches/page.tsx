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
    Box,
    LinearProgress
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
    ArrowBack,
    Clear,
    WarningAmberRounded,
    ReportProblemOutlined,
    TrendingUp,
    CheckCircle,
    StarHalf,
    ExitToApp,
    EventBusy
} from '@mui/icons-material';
import axios from 'axios';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import { useRouter } from 'next/navigation';

interface Employee {
    _id: string;
    first_name: string;
    last_name: string;
}

interface Punch {
    _id: string;
    punchIn: string;
    punchOut: string;
    totalTime: string;
    date: string;
}

interface OvertimeDay {
    date: string;
    extra: string;
}

interface IncompleteDay {
    date: string;
    percentage: number;
    short: string;
}

interface EarlyLeaveDay {
    date: string;
    shortfall: string;
}


interface DailyBreakdown {
    date: string;
    percentage: number; 
    isLate: boolean; 
    isHardLate: boolean; 
    attendanceValue: number; 
    isEarlyLeave: boolean; 
}

interface MonthlyAnalytics {
    employeeId: string;
    employeeName: string;
    totalDaysPresent: number;
    totalLateDays: number; 
    totalHardLateDays: number; 
    totalAbsentDays: number;
    totalLeaveDays: number;
    totalWorkedTime: string;
    totalRequiredTime: string;
    monthCompletionPercentage: number;
    totalAttendanceCredit: number; 
    penalizedDays: string[]; 
    overtimeDays: OvertimeDay[];
    incompleteDays: IncompleteDay[];

    earlyLeaveDays: EarlyLeaveDay[]; 
    earlyLeaveBalanceRequired: boolean;
    earlyLeaveBalanceMet: boolean; 
    earlyLeaveWarning: boolean; 
    compOffUsed: boolean; 
    compOffRemaining: number; 

    dailyBreakdown: DailyBreakdown[];
}

const getCompanyId = (): string => {
    if (typeof window === 'undefined') return '';
    try {
        const userData = localStorage.getItem('user');
        if (!userData) return '';
        const { company_id } = JSON.parse(userData);
        return company_id || '';
    } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
        return '';
    }
};

const PunchesPage: React.FC = () => {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [month, setMonth] = useState<string>('');
    const [punches, setPunches] = useState<Punch[]>([]);
    const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        setMonth(currentMonth);
    }, []);
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

    const fetchPunches = async (employeeId: string, selectedMonth: string) => {
        try {
            setLoading(true);
            setError(null);

            const [year, monthNum] = selectedMonth.split('-');

            const [punchesRes, analyticsRes] = await Promise.all([
                axios.get<Punch[]>(
                    `${process.env.NEXT_PUBLIC_APP_URL}/punch/employee/${employeeId}/${selectedMonth}`
                ),
                axios.get<MonthlyAnalytics>(
                    `${process.env.NEXT_PUBLIC_APP_URL}/punch-analytics/monthly`,
                    {
                        params: {
                            employeeId,
                            month: parseInt(monthNum, 10),
                            year: parseInt(year, 10),
                            company_id: getCompanyId(),
                        },
                    }
                ),
            ]);
            setPunches(punchesRes.data);
            setAnalytics(analyticsRes.data);
            if (punchesRes.data.length === 0) {
                setError(`No punch records found for ${selectedEmployee?.first_name} ${selectedEmployee?.last_name} in ${formatMonthDisplay(selectedMonth)}`);
            }
        } catch (error) {
            console.error('Error fetching punches:', error);
            setError('Failed to fetch punch data. Please try again.');
            setPunches([]);
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch punches when employee or month changes
    useEffect(() => {
        if (selectedEmployee && month) {
            fetchPunches(selectedEmployee._id, month);
        }
    }, [selectedEmployee, month]);

    // Handle employee selection change
    const handleEmployeeChange = (event: any, newValue: Employee | null) => {
        setSelectedEmployee(newValue);
        if (!newValue) {
            setPunches([]);
            setAnalytics(null);
            setError(null);
        }
    };

    // Handle month change
    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMonth(e.target.value);
    };

    const handleClearEmployee = () => {
        setSelectedEmployee(null);
        setPunches([]);
        setAnalytics(null);
        setError(null);
    };

    const handleRefresh = () => {
        if (selectedEmployee && month) {
            fetchPunches(selectedEmployee._id, month);
        }
    };

    const formatMonthDisplay = (monthStr: string): string => {
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        } catch (e) {
            return monthStr;
        }
    };

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

    const getOvertimeForDate = (date: string): OvertimeDay | undefined => {
        return analytics?.overtimeDays.find((d) => d.date === date);
    };

    const getIncompleteForDate = (date: string): IncompleteDay | undefined => {
        return analytics?.incompleteDays.find((d) => d.date === date);
    };

    const getEarlyLeaveForDate = (date: string): EarlyLeaveDay | undefined => {
        return analytics?.earlyLeaveDays.find((d) => d.date === date);
    };

   
    const getBreakdownForDate = (date: string): DailyBreakdown | undefined => {
        return analytics?.dailyBreakdown.find((d) => d.date === date);
    };

    const isPenalizedDate = (date: string): boolean => {
        return !!analytics?.penalizedDays.includes(date);
    };

   
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
                {selectedEmployee ? (
                    <div className="w-full md:w-2/5 relative">
                        <TextField
                            label="Selected Employee"
                            variant="outlined"
                            fullWidth
                            value={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                            InputProps={{
                                readOnly: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person color="primary" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleClearEmployee} size="small">
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </div>
                ) : (
                    <Autocomplete
                        options={employees}
                        getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                        value={selectedEmployee}
                        onChange={handleEmployeeChange}
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
                )}

                <TextField
                    label="Month"
                    type="month"
                    variant="outlined"
                    value={month}
                    onChange={handleMonthChange}
                    className="w-full md:w-1/4"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <CalendarMonth color="primary" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Tooltip title="Refresh Data">
                    <IconButton
                        color="primary"
                        onClick={handleRefresh}
                        disabled={loading || !selectedEmployee}
                        className="ml-auto"
                    >
                        {loading ? <CircularProgress size={20} /> : <Refresh />}
                    </IconButton>
                </Tooltip>
            </Box>

            {loading && (
                <Box className="text-center py-4">
                    <CircularProgress size={40} />
                    <Typography variant="body2" className="mt-2 text-gray-600">
                        Loading punch data...
                    </Typography>
                </Box>
            )}

            {selectedEmployee && punches.length > 0 && !loading && (
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
                </Box>
            )}

            {/* ---- Early-leave balance warning banner ----
                 Sirf informational — koi penalty/credit-cut nahi hota isse. */}
            {selectedEmployee && analytics && !loading && analytics.earlyLeaveWarning && (
                <Alert severity="warning" className="mb-6" icon={<EventBusy />}>
                    <strong>{analytics.earlyLeaveDays.length} early-leave day(s)</strong> this month (2hr+ before required
                    punch-out) — not yet balanced with overtime or a comp-off.
                    {analytics.compOffRemaining > 0
                        ? ` ${analytics.compOffRemaining} comp-off still available this month.`
                        : ` Comp-off quota for this month is used up.`}
                </Alert>
            )}

            {/* ---- Monthly Analytics Summary Cards ---- */}
            {selectedEmployee && analytics && !loading && (
                <Box className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Box className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-gray-500 uppercase tracking-wide">
                            Days Present
                        </Typography>
                        <Typography variant="h5" className="font-bold text-gray-800">
                            {analytics.totalDaysPresent}
                        </Typography>
                    </Box>

                    <Box className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-yellow-700 uppercase tracking-wide flex items-center justify-center gap-1">
                            <WarningAmberRounded fontSize="small" /> Late Days (10:15+)
                        </Typography>
                        <Typography variant="h5" className="font-bold text-yellow-700">
                            {analytics.totalLateDays}
                        </Typography>
                    </Box>

                    <Box className="bg-red-50 border border-red-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-red-600 uppercase tracking-wide flex items-center justify-center gap-1">
                            <ReportProblemOutlined fontSize="small" /> Hard Late (10:20+)
                        </Typography>
                        <Typography variant="h5" className="font-bold text-red-700">
                            {analytics.totalHardLateDays}
                        </Typography>
                    </Box>

                    <Box className="bg-green-50 border border-green-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-green-600 uppercase tracking-wide flex items-center justify-center gap-1">
                            <TrendingUp fontSize="small" /> Overtime Days
                        </Typography>
                        <Typography variant="h5" className="font-bold text-green-700">
                            {analytics.overtimeDays.length}
                        </Typography>
                    </Box>

                    <Box
                        className={`border rounded-lg p-4 text-center shadow-sm ${
                            analytics.earlyLeaveWarning
                                ? 'bg-amber-50 border-amber-300'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <Typography
                            variant="caption"
                            className={`uppercase tracking-wide flex items-center justify-center gap-1 ${
                                analytics.earlyLeaveWarning ? 'text-amber-700' : 'text-gray-500'
                            }`}
                        >
                            <ExitToApp fontSize="small" /> Early Leave Days
                        </Typography>
                        <Typography
                            variant="h5"
                            className={`font-bold ${analytics.earlyLeaveWarning ? 'text-amber-700' : 'text-gray-800'}`}
                        >
                            {analytics.earlyLeaveDays.length}
                        </Typography>
                        {analytics.earlyLeaveBalanceRequired && (
                            <Typography
                                variant="caption"
                                className={analytics.earlyLeaveBalanceMet ? 'text-green-600' : 'text-amber-600'}
                            >
                                {analytics.earlyLeaveBalanceMet ? 'Balanced' : 'Not balanced yet'}
                            </Typography>
                        )}
                    </Box>

                    <Box className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-purple-600 uppercase tracking-wide flex items-center justify-center gap-1">
                            <StarHalf fontSize="small" /> Attendance Credit
                        </Typography>
                        <Typography variant="h5" className="font-bold text-purple-700">
                            {analytics.totalAttendanceCredit}
                        </Typography>
                        {analytics.penalizedDays.length > 0 && (
                            <Typography variant="caption" className="text-purple-500">
                                {analytics.penalizedDays.length} day(s) penalized
                            </Typography>
                        )}
                    </Box>

                    <Box className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-teal-600 uppercase tracking-wide">
                            Comp-Off Remaining
                        </Typography>
                        <Typography variant="h5" className="font-bold text-teal-700">
                            {analytics.compOffRemaining}
                        </Typography>
                        {analytics.compOffUsed && (
                            <Typography variant="caption" className="text-teal-500">
                                Used this month
                            </Typography>
                        )}
                    </Box>

                    <Box className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center shadow-sm">
                        <Typography variant="caption" className="text-blue-600 uppercase tracking-wide flex items-center justify-center gap-1">
                            <CheckCircle fontSize="small" /> Month Completion
                        </Typography>
                        <Typography variant="h5" className="font-bold text-blue-700">
                            {analytics.monthCompletionPercentage}%
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(100, analytics.monthCompletionPercentage)}
                            className="mt-2 rounded-full"
                            color={analytics.monthCompletionPercentage >= 100 ? 'success' : 'warning'}
                        />
                    </Box>
                </Box>
            )}

            {punches.length > 0 && !loading ? (
                <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border-b p-3 text-left text-gray-700">Date</th>
                                <th className="border-b p-3 text-left text-gray-700">Punch In</th>
                                <th className="border-b p-3 text-left text-gray-700">Punch Out</th>
                                <th className="border-b p-3 text-left text-gray-700">Total Hours</th>
                                <th className="border-b p-3 text-left text-gray-700">Completion %</th>
                                <th className="border-b p-3 text-left text-gray-700">Attendance</th>
                                <th className="border-b p-3 text-left text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {punches.map((punch) => {
                                const overtime = getOvertimeForDate(punch.date);
                                const incomplete = getIncompleteForDate(punch.date);
                                const breakdown = getBreakdownForDate(punch.date);
                                const earlyLeave = getEarlyLeaveForDate(punch.date);
                                const penalized = isPenalizedDate(punch.date);

                                return (
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
                                        <td className="border-b p-3">
                                            {breakdown ? (
                                                <Typography
                                                    variant="body2"
                                                    className={`font-semibold ${breakdown.percentage >= 100 ? 'text-green-700' : breakdown.percentage >= 60 ? 'text-orange-600' : 'text-red-600'}`}
                                                >
                                                    {breakdown.percentage}%
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" className="text-gray-400">—</Typography>
                                            )}
                                        </td>
                                        <td className="border-b p-3">
                                            {breakdown ? (
                                                <Tooltip
                                                    title={
                                                        penalized
                                                            ? 'Late penalty applied — attendance counted as 0.75 for this day'
                                                            : 'Full attendance credited for this day'
                                                    }
                                                >
                                                    <Chip
                                                        size="small"
                                                        label={breakdown.attendanceValue}
                                                        color={penalized ? 'error' : 'default'}
                                                        variant={penalized ? 'filled' : 'outlined'}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" className="text-gray-400">—</Typography>
                                            )}
                                        </td>
                                        <td className="border-b p-3">
                                            <Box className="flex flex-wrap gap-1">
                                                {breakdown?.isHardLate ? (
                                                    <Tooltip title="Punched in after the hard-late threshold — counts toward penalty">
                                                        <Chip
                                                            size="small"
                                                            label="Hard Late"
                                                            color="error"
                                                            icon={<ReportProblemOutlined />}
                                                        />
                                                    </Tooltip>
                                                ) : breakdown?.isLate ? (
                                                    <Tooltip title="Punched in after the soft-late threshold — allowed, no penalty">
                                                        <Chip
                                                            size="small"
                                                            label="Late"
                                                            color="warning"
                                                            icon={<WarningAmberRounded />}
                                                        />
                                                    </Tooltip>
                                                ) : null}
                                                {overtime && (
                                                    <Tooltip title={`Extra worked: ${overtime.extra}`}>
                                                        <Chip
                                                            size="small"
                                                            label={`+${overtime.extra}`}
                                                            color="success"
                                                            icon={<TrendingUp />}
                                                        />
                                                    </Tooltip>
                                                )}
                                                {earlyLeave && (
                                                    <Tooltip title={`Punched out ${earlyLeave.shortfall} before required time — needs overtime or comp-off balance`}>
                                                        <Chip
                                                            size="small"
                                                            label={`-${earlyLeave.shortfall}`}
                                                            color="warning"
                                                            variant="outlined"
                                                            icon={<ExitToApp />}
                                                        />
                                                    </Tooltip>
                                                )}
                                                {incomplete && (
                                                    <Tooltip title={`Short by: ${incomplete.short}`}>
                                                        <Chip
                                                            size="small"
                                                            label={`${incomplete.percentage}%`}
                                                            color="error"
                                                            variant="outlined"
                                                        />
                                                    </Tooltip>
                                                )}
                                                {!breakdown?.isLate && !breakdown?.isHardLate && !overtime && !earlyLeave && !incomplete && (
                                                    <Chip size="small" label="On Track" variant="outlined" />
                                                )}
                                            </Box>
                                        </td>
                                    </tr>
                                );
                            })}
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
