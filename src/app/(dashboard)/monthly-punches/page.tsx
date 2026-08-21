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
    LinearProgress,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { FormControlLabel, Checkbox } from "@mui/material";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
} from "@mui/material";
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
import TeamPunches from '@/views/TeamPunches';
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
    totalDurationMinutes?: number;
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

const parseTimeToMinutes = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    if (parts.some((p) => isNaN(p))) return null;
    const [h, m, s] = parts;
    return h * 60 + (m || 0) + (s ? s / 60 : 0);
};
const formatMinutesToHM = (totalMinutes: number): string => {
    if (!totalMinutes || totalMinutes <= 0) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
};

const calculateDurationMinutes = (punchIn: string, punchOut: string): number => {
    const inMin = parseTimeToMinutes(punchIn);
    const outMin = parseTimeToMinutes(punchOut);
    if (inMin === null || outMin === null) return 0;
    let diff = outMin - inMin;
    if (diff < 0) diff += 24 * 60; // overnight shift edge-case
    return diff;
};

const formatDecimalHoursToHM = (decimalStr: string): string => {
    const decimal = parseFloat(decimalStr);
    if (isNaN(decimal)) return '-';
    return formatMinutesToHM(decimal * 60);
};

const parseExtraToMinutes = (extra: string): number => {
    if (!extra) return 0;
    const hmMatch = extra.match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
    if (hmMatch) {
        const h = parseInt(hmMatch[1], 10) || 0;
        const m = parseInt(hmMatch[2] || '0', 10) || 0;
        return h * 60 + m;
    }
    const colonMatch = extra.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
        return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
    }
    const decimal = parseFloat(extra);
    if (!isNaN(decimal)) return decimal * 60;
    return 0;
};

const groupPunchesByDate = (rawPunches: Punch[]): Punch[] => {
    const grouped: { [date: string]: Punch[] } = {};

    rawPunches.forEach((p) => {
        if (!grouped[p.date]) grouped[p.date] = [];
        grouped[p.date].push(p);
    });

    const merged: Punch[] = Object.keys(grouped).map((date) => {
        const dayPunches = grouped[date];

        // sabse pehla punch-in (time ke hisaab se sort karke)
        const sortedByIn = [...dayPunches].sort((a, b) => {
            const aMin = parseTimeToMinutes(a.punchIn) ?? Infinity;
            const bMin = parseTimeToMinutes(b.punchIn) ?? Infinity;
            return aMin - bMin;
        });
        const firstPunchIn = sortedByIn[0]?.punchIn || '';

        // sabse aakhri punch-out (empty punch-outs ko ignore karke)
        const withPunchOut = dayPunches.filter((p) => p.punchOut && p.punchOut !== '');
        let lastPunchOut = '';
        if (withPunchOut.length > 0) {
            const sortedByOut = [...withPunchOut].sort((a, b) => {
                const aMin = parseTimeToMinutes(a.punchOut) ?? -Infinity;
                const bMin = parseTimeToMinutes(b.punchOut) ?? -Infinity;
                return bMin - aMin;
            });
            lastPunchOut = sortedByOut[0].punchOut;
        }

        let totalDurationMinutes = 0;
        dayPunches.forEach((p) => {
            if (p.punchIn && p.punchOut) {
                totalDurationMinutes += calculateDurationMinutes(p.punchIn, p.punchOut);
            }
        });

        const totalTime = (totalDurationMinutes / 60).toFixed(2);

        return {
            _id: dayPunches[0]._id,
            date,
            punchIn: firstPunchIn,
            punchOut: lastPunchOut,
            totalTime,
            totalDurationMinutes,
        };
    });

    return merged.sort((a, b) => a.date.localeCompare(b.date));
};

const PunchesPage: React.FC = () => {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string>('');
    const [loggedInUserId, setLoggedInUserId] = useState<string>('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showTeamPunches, setShowTeamPunches] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [month, setMonth] = useState<string>('');
    const [punches, setPunches] = useState<Punch[]>([]);
    const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [openRegularization, setOpenRegularization] = useState(false);
    const [regularizationDate, setRegularizationDate] = useState("");
    const [regularizationType, setRegularizationType] = useState("");
    const [reason, setReason] = useState("");
    const [applyToAll, setApplyToAll] = useState(false);

    const [coverageMode, setCoverageMode] = useState<'duration' | 'time'>('duration');
    const [regularizedHours, setRegularizedHours] = useState<string>("");
    const [regularizedMinutes, setRegularizedMinutes] = useState<string>("");
    const [regularizedFromTime, setRegularizedFromTime] = useState<string>("");

    useEffect(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        setMonth(currentMonth);
    }, []);
    useEffect(() => {
        const userDataStr = localStorage.getItem('user');
        let currentRole = '';
        let currentUserId = '';
        if (userDataStr) {
            try {
                const user = JSON.parse(userDataStr);
                currentRole = user.role || '';
                currentUserId = user.id || '';
                setUserRole(currentRole);
                setLoggedInUserId(currentUserId);
            } catch (e) {
                console.error('Error parsing user data', e);
            }
        }

        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const data: Employee[] = await apiResponse();
                setEmployees(data);

                if (currentRole !== '0' && currentRole !== '1') {
                    const emp = data.find((e: Employee) => e._id === currentUserId);
                    if (emp) {
                        setSelectedEmployee(emp);
                    } else if (userDataStr) {
                        const user = JSON.parse(userDataStr);
                        setSelectedEmployee({
                            _id: currentUserId,
                            first_name: user.first_name || 'My',
                            last_name: user.last_name || 'Profile'
                        });
                    }
                }

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

            // Same date ke multiple punch records ko merge karke first-in/last-out banaya
            const mergedPunches = groupPunchesByDate(punchesRes.data);

            setPunches(mergedPunches);
            setAnalytics(analyticsRes.data);
            if (mergedPunches.length === 0) {
                setError(`No punch records found for ${selectedEmployee?.first_name} ${selectedEmployee?.last_name} in ${formatMonthDisplay(selectedMonth)}`);
            }
        } catch (error: any) {
    setError(
        error?.response?.data?.message ||
        `API Error: ${error?.response?.status || 'Unknown'}`
    );

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
        if (userRole !== '0' && userRole !== '1') return;
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
    const getAuthData = () => {
        if (typeof window === 'undefined') {
            return { token: null, company_id: null };
        }

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');


        return { token, company_id: user?.company_id };
    };
    const handleRegularization = async () => {
        try {
            const { token, company_id } = getAuthData();

            if (!token || !company_id) {
                throw new Error("Authentication data missing");
            }

            if (!regularizationDate || !regularizationType) {
                setError("Please select date and regularization type");
                return;
            }

            // Coverage mode ke hisaab se payload banao:
            //  - "duration" mode: "Xh Ym" string (jaise baaki duration fields)
            //  - "time" mode: clock time string "HH:MM:SS" jisse pehle tak
            //    early-leave allowed tha
            let coveragePayload: Record<string, any> = {};
            if (regularizationType === "Early Leave") {
                if (coverageMode === "duration") {
                    const hasCoverageInput = regularizedHours !== "" || regularizedMinutes !== "";
                    if (hasCoverageInput) {
                        const h = parseInt(regularizedHours || "0", 10) || 0;
                        const m = parseInt(regularizedMinutes || "0", 10) || 0;
                        coveragePayload = { regularizedTime: `${h}h ${m}m` };
                    }
                } else if (coverageMode === "time" && regularizedFromTime) {
                    // <input type="time"> deta hai "HH:MM" — seconds add kar diya
                    coveragePayload = { regularizedFromTime: `${regularizedFromTime}:00` };
                }
            }

            const payload = {
                company_id,
                date: regularizationDate,
                type: regularizationType,
                reason,
                applyTo: applyToAll ? "All" : "SELECTED",
                ...coveragePayload,
                ...(applyToAll ? {} : { employee: selectedEmployee?._id }),
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/attendence/regularization`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`, // company_id header se hataya — sirf token
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to create regularization");
            }

            setOpenRegularization(false);
            setRegularizationDate("");
            setRegularizationType("");
            setReason("");
            setApplyToAll(false);
            setCoverageMode('duration');
            setRegularizedHours("");
            setRegularizedMinutes("");
            setRegularizedFromTime("");
            setError(null);

            handleRefresh();
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Something went wrong while saving regularization");
        }
    };

    const handleDownloadAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [year, monthNum] = month.split('-');

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_APP_URL}/punch-analytics/company-monthly/export`,
                {
                    params: {
                        month: parseInt(monthNum, 10),
                        year: parseInt(year, 10),
                        company_id: getCompanyId(),
                    },
                    responseType: 'blob',
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-report-${month}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download report', err);
            setError('Failed to download the report. Please try again.');
        } finally {
            setLoading(false);
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

    // Total minutes seedha har din ke punchIn/punchOut se sum karta hai — rounded
    // per-day decimals ko sum karne se compounding error aata hai, isliye yeh precise hai
    const calculateTotalMinutes = (): number => {
        if (!punches || punches.length === 0) return 0;
        return punches.reduce(
            (sum, punch) => sum + (punch.totalDurationMinutes ?? calculateDurationMinutes(punch.punchIn, punch.punchOut)),
            0
        );
    };

    const calculateTotalHours = (): string => {
        if (!punches || punches.length === 0) return "0.0";
        return (calculateTotalMinutes() / 60).toFixed(1);
    };

    // Total overtime hours (formatted as Xh Ym) — added
    const calculateTotalOvertime = (): string => {
        if (!analytics?.overtimeDays || analytics.overtimeDays.length === 0) return '0h 0m';
        const totalMinutes = analytics.overtimeDays.reduce(
            (sum, day) => sum + parseExtraToMinutes(day.extra),
            0
        );
        return formatMinutesToHM(totalMinutes);
    };

    const getValidIncompleteDays = (): IncompleteDay[] => {
    if (!analytics?.incompleteDays) return [];

    return analytics.incompleteDays.filter((incompleteDay) => {
        const punch = punches.find(
            (punch) => punch.date === incompleteDay.date
        );

        // Punch-Out nahi hua hai = current/active day
        // Isko abhi incomplete count nahi karna
        if (!punch?.punchOut) {
            return false;
        }

        return true;
    });
};

const calculateTotalIncompleteTime = (): string => {
    const validIncompleteDays = getValidIncompleteDays();

    if (validIncompleteDays.length === 0) {
        return '0h 0m';
    }

    const totalMinutes = validIncompleteDays.reduce(
        (sum, day) => sum + parseExtraToMinutes(day.short),
        0
    );

    return formatMinutesToHM(totalMinutes);
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
        <>
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

                {userRole === '2' && (
                    <Box className="mb-4">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setShowTeamPunches(prev => !prev)}
                        >
                            {showTeamPunches ? 'Hide Team Punches' : 'View Team Punches'}
                        </Button>
                    </Box>
                )}

                {userRole === '2' && showTeamPunches && (
                    <TeamPunches
                    managerId={loggedInUserId}
                    onEmployeeClick={(employee) => {
                        const matchedEmployee = employees.find(
                            (emp) =>
                                emp.first_name.trim().toLowerCase() ===
                                    employee.first_name.trim().toLowerCase() &&
                                emp.last_name.trim().toLowerCase() ===
                                    employee.last_name.trim().toLowerCase()
                        );

                        if (matchedEmployee) {
                            setSelectedEmployee(matchedEmployee);
                            setShowTeamPunches(false);
                        } else {
                            console.error('Employee not found:', employee);
                        }
                    }}
                />
                )}
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
                                    endAdornment: (userRole === '0' || userRole === '1') ? (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleClearEmployee} size="small">
                                                <Clear />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
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
                {(userRole === '0' || userRole === '1') && (
                    <Box className="flex gap-4 mb-4">
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<Download />}
                            onClick={handleDownloadAll}
                            disabled={loading || !month}
                        >
                            Download All Employees (Excel)
                        </Button>

                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => setOpenRegularization(true)}
                        >
                            Attendance Regularization
                        </Button>
                    </Box>
                )}

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
                            label={`Total Hours: ${calculateTotalHours()} (${formatMinutesToHM(calculateTotalMinutes())})`}
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
                            {/* Total overtime hours — added */}
                            <Typography variant="caption" className="text-green-600 block">
                                Total: {calculateTotalOvertime()}
                            </Typography>
                        </Box>

                        <Box className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center shadow-sm">
                            <Typography
                                variant="caption"
                                className="text-orange-600 uppercase tracking-wide flex items-center justify-center gap-1"
                            >
                                <EventBusy fontSize="small" /> Incomplete Days
                            </Typography>

                            <Typography variant="h5" className="font-bold text-orange-700">
                                {getValidIncompleteDays().length}
                            </Typography>

                            <Typography variant="caption" className="text-orange-600 block">
                                Short: {calculateTotalIncompleteTime()}
                            </Typography>
                        </Box>

                        <Box
                            className={`border rounded-lg p-4 text-center shadow-sm ${analytics.earlyLeaveWarning
                                ? 'bg-amber-50 border-amber-300'
                                : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <Typography
                                variant="caption"
                                className={`uppercase tracking-wide flex items-center justify-center gap-1 ${analytics.earlyLeaveWarning ? 'text-amber-700' : 'text-gray-500'
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

                        {/* <Box className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-center shadow-sm">
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
                        </Box> */}

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
                                                {formatMinutesToHM(
                                                    punch.totalDurationMinutes ?? calculateDurationMinutes(punch.punchIn, punch.punchOut)
                                                )}
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
            <Dialog
                open={openRegularization}
                onClose={() => setOpenRegularization(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    className: "rounded-xl",
                }}
            >
                <DialogTitle className="!p-0">
                    <Box className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 flex items-center gap-3 text-white">
                        <Box className="bg-white/15 rounded-full p-2 flex items-center justify-center">
                            <EventBusy fontSize="small" />
                        </Box>
                        <Box>
                            <Typography variant="h6" className="font-semibold leading-tight text-white">
                                Attendance Regularization
                            </Typography>
                            <Typography variant="caption" className="text-blue-100">
                                Manually correct or approve an exception for a specific day
                            </Typography>
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent className="!px-6 !pt-6 !pb-2">
                    {selectedEmployee && (
                        <Box className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 mb-5">
                            <Box className="flex items-center gap-2">
                                <Person fontSize="small" className="text-gray-500" />
                                <Typography variant="body2" className="font-medium text-gray-700">
                                    {applyToAll ? "Applies to all employees" : `${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                                </Typography>
                            </Box>
                            <FormControlLabel
                                className="!m-0"
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={applyToAll}
                                        onChange={(e) => setApplyToAll(e.target.checked)}
                                    />
                                }
                                label={
                                    <Typography variant="caption" className="text-gray-600">
                                        Apply to All
                                    </Typography>
                                }
                            />
                        </Box>
                    )}

                    <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
                        <TextField
                            fullWidth
                            size="small"
                            label="Date"
                            type="date"
                            value={regularizationDate}
                            onChange={(e) => setRegularizationDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonth fontSize="small" className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            select
                            size="small"
                            label="Regularization Type"
                            value={regularizationType}
                            onChange={(e) => setRegularizationType(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTime fontSize="small" className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            <MenuItem value="Early Leave">Early Leave</MenuItem>
                            <MenuItem value="Late Coming">Late Coming</MenuItem>
                            <MenuItem value="Half Day">Half Day</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                        </TextField>
                    </Box>

                    {regularizationType === "Early Leave" && (
                        <Box className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4">
                            <Box className="flex items-center justify-between mb-2.5">
                                <Box className="flex items-center gap-2">
                                    <ExitToApp fontSize="small" className="text-amber-700" />
                                    <Typography variant="body2" className="font-medium text-amber-800">
                                        Early Leave Coverage
                                    </Typography>
                                </Box>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={coverageMode}
                                    onChange={(e, val) => val && setCoverageMode(val)}
                                    className="bg-white"
                                >
                                    <ToggleButton value="duration" className="!px-3 !py-0.5 !text-xs !normal-case">
                                        By Duration
                                    </ToggleButton>
                                    <ToggleButton value="time" className="!px-3 !py-0.5 !text-xs !normal-case">
                                        By Clock Time
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            {coverageMode === 'duration' ? (
                                <>
                                    <Box className="grid grid-cols-2 gap-3">
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            label="Hours"
                                            placeholder="0"
                                            value={regularizedHours}
                                            onChange={(e) => setRegularizedHours(e.target.value)}
                                            inputProps={{ step: 1, min: 0 }}
                                            className="bg-white"
                                        />
                                        <TextField
                                            fullWidth
                                            size="small"
                                            type="number"
                                            label="Minutes"
                                            placeholder="0"
                                            value={regularizedMinutes}
                                            onChange={(e) => setRegularizedMinutes(e.target.value)}
                                            inputProps={{ step: 1, min: 0, max: 59 }}
                                            className="bg-white"
                                        />
                                    </Box>
                                    <Typography variant="caption" className="text-amber-700 block mt-1.5 leading-snug">
                                        Only the specified hours/minutes will be excused. Any early-leave
                                        time beyond this will still reduce the day's completion %. Leave
                                        both blank to fully excuse the day (100%).
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="time"
                                        label="Allowed to leave from"
                                        value={regularizedFromTime}
                                        onChange={(e) => setRegularizedFromTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        className="bg-white"
                                    />
                                    <Typography variant="caption" className="text-amber-700 block mt-1.5 leading-snug">
                                        If the employee punched out at or after this time, the day is
                                        fully excused (100%). If they left earlier than this, the
                                        remaining gap will still reduce the day's completion %. Leave
                                        blank to fully excuse the day (100%).
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        margin="normal"
                        label="Reason"
                        placeholder="Add a short note for this regularization..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="!mt-4"
                    />
                </DialogContent>

                <Divider className="mt-2" />

                <DialogActions className="!px-6 !py-4">
                    <Button
                        onClick={() => setOpenRegularization(false)}
                        color="inherit"
                        className="!text-gray-600"
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleRegularization}
                        disabled={!regularizationDate || !regularizationType}
                        disableElevation
                        className="!px-5"
                    >
                        Save Regularization
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );

};

export default PunchesPage;
