"use client"
import React, { useState, useEffect } from 'react';
import {
    Schedule as Clock,
    CalendarToday as Calendar,
    Warning as AlertCircle,
    CheckCircle as UserCheck,
    Cancel as UserX,
    Timer as Timer,
    Check
} from '@mui/icons-material';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import { utility } from '@/utility';

interface Employee {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    image: string;
}

interface Punch {
    _id: string;
    punchIn: string;
    punchOut?: string;
    totalTime?: string;
    employee: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    company_id: string;
}

interface PunchWithEmployee extends Punch {
    employeeDetails: Employee;
}

const DateWisePunches = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [punches, setPunches] = useState<PunchWithEmployee[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'late' | 'absent' | 'half' | 'onhalf'>('late');
    const [onHalfEmployees, setOnHalfEmployees] = useState<Employee[]>([]);
    const { isTokenExpired } = utility();

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
        return { error: "Not in browser environment" };
    }

    const token = localStorage.getItem("token");

    // If token doesn't exist or is expired, redirect to login with page refresh
    if (!token || isTokenExpired(token)) {
        // Clean up localStorage if needed
        if (token) {
            localStorage.removeItem('token');
        }

        // Redirect to login with page refresh
        window.location.href = '/login';
        return { error: token ? "Token expired" : "No token found" };
    }

    // Get user data
    const userData = localStorage.getItem('user');
    if (!userData) {
        // Redirect to login with page refresh
        window.location.href = '/login';
        return { error: "User data not found" };
    }

    const { company_id } = JSON.parse(userData);

    useEffect(() => {
        const fetchOnHalfEmployees = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/attendence/on-half/${selectedDate}`, {
                    headers: {
                        'Authorization': `Bearer ${token} ${company_id}`,
                        'Content-Type': 'application/json'
                    },
                });
                const data = await response.json();
                setOnHalfEmployees(data);
            } catch (error) {
                console.error("Failed to fetch on-half employees:", error);
            }
        };

        fetchOnHalfEmployees();
    }, [selectedDate]);

    // Fix 1: Remove employees from dependency array to prevent infinite loop
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const data: Employee[] = await apiResponse();
                // console.log("employeedata>>>", data);
                setEmployees(data);
            } catch (error) {
                console.error('Failed to fetch employees', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []); // Empty dependency array - only run once on mount

    // Fix 2: Add employees to dependency array and check if employees are loaded
    useEffect(() => {
        const fetchData = async () => {
            // Don't fetch punches if employees haven't loaded yet
            if (employees.length === 0) return;

            setLoading(true);
            try {
                // Fetch punches for the selected date
                const punchesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/punch/punches/date/${selectedDate}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token} ${company_id}`,
                            'Content-Type': 'application/json'
                        },
                    }
                );
                const punchesData = await punchesResponse.json();

                // Combine punch data with employee details
                const punchesWithEmployees = punchesData.map(punch => ({
                    ...punch,
                    employeeDetails: employees.find(emp => emp._id === punch.employee)
                }));

                setPunches(punchesWithEmployees);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate, employees]); // Include employees in dependency array

    // console.log("employees", employees);

    const getLateEmployees = () => {
        return punches.filter(punch => {
            const punchInTime = punch.punchIn.split(':');
            const hour = parseInt(punchInTime[0]);
            const min = parseInt(punchInTime[1]);
            return hour >= 10 && min >= 1; // After 10:00 AM
        });
    };

    const getAbsentEmployees = () => {
        const presentEmployeeIds = punches.map(punch => punch.employee);
        const onHalfEmployeeIds = onHalfEmployees.map(emp => emp._id);

        return employees.filter(emp =>
            !presentEmployeeIds.includes(emp._id) &&
            !onHalfEmployeeIds.includes(emp._id)
        );
    };

    const getHalfDayEmployees = () => {
        return punches.filter(punch => {
            if (punch.totalTime === "00h 00m 00s") return false;

            const totalHours = parseInt(punch.totalTime.split('h')[0]);

            // Exclude employees who are marked as 'On Half'
            const isOnHalf = onHalfEmployees.some(emp => emp._id === punch.employee);

            return totalHours < 9 && !isOnHalf; // Only include if <9h and not on-half
        });
    };

    const getOnHalfPunches = () => {
        return onHalfEmployees.map((employee) => {
            const punch = punches.find(p => p.employee === employee._id);
            return {
                employee,
                punch
            };
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const EmployeeCard = ({ employee, punch, type }: { employee: Employee, punch?: PunchWithEmployee, type: 'late' | 'absent' | 'half' | 'onhalf' }) => (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${type === 'late' ? 'bg-red-500' : type === 'absent' ? 'bg-gray-500' : 'bg-yellow-500'
                        }`}>
                        <img src={employee?.image} alt={employee?.first_name} className='w-12 h-12 rounded-full flex items-center justify-center' />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">{employee?.first_name} {employee?.last_name}</h3>
                        {/* <p className="text-sm text-gray-600">{employee?._id}</p> */}
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${type === 'late' ? 'bg-red-100 text-red-800' :
                    type === 'absent' ? 'bg-gray-100 text-gray-800' : type === 'half' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                    }`}>
                    {type === 'late' ? 'Late Entry' : type === 'absent' ? 'Absent' : type === 'onhalf' ? 'On Half' : 'Incomplete 9h'}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{employee?.email}</span>
                </div>
                {punch && (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Punch In:</span>
                            <span className="font-medium">{formatTime(punch?.punchIn)}</span>
                        </div>
                        {punch?.punchOut && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Punch Out:</span>
                                <span className="font-medium">{formatTime(punch?.punchOut)}</span>
                            </div>
                        )}
                        {punch?.totalTime && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Time:</span>
                                <span className="font-medium">{punch?.totalTime}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    const lateEmployees = getLateEmployees();
    const absentEmployees = getAbsentEmployees();
    const halfDayEmployees = getHalfDayEmployees();

    // console.log("onHalfEmployees>>>", onHalfEmployees);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading employee data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-8 w-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Date-wise Punches</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-gray-500" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Late Entries (After 10 AM)</p>
                                <p className="text-3xl font-bold text-red-600">{lateEmployees.length}</p>
                            </div>
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Absent Employees</p>
                                <p className="text-3xl font-bold text-gray-600">{absentEmployees.length}</p>
                            </div>
                            <UserX className="h-12 w-12 text-gray-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Incomplete 9h</p>
                                <p className="text-3xl font-bold text-yellow-600">{halfDayEmployees.length}</p>
                            </div>
                            <Timer className="h-12 w-12 text-yellow-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Half-Day Marked</p>
                                <p className="text-3xl font-bold text-green-600">{onHalfEmployees.length}</p>
                            </div>
                            <Check className="h-12 w-12 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('late')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'late'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Late Entries ({lateEmployees.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('absent')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'absent'
                                    ? 'border-gray-500 text-gray-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Absent ({absentEmployees.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('half')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'half'
                                    ? 'border-yellow-500 text-yellow-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Incomplete 9h ({halfDayEmployees.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('onhalf')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'onhalf'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Marked Half-Day ({onHalfEmployees.length})
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'late' && (
                            <div className="space-y-4">
                                {lateEmployees.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {lateEmployees.map((punch) => (
                                            <EmployeeCard
                                                key={punch._id}
                                                employee={punch.employeeDetails}
                                                punch={punch}
                                                type="late"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No late entries found for this date.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'absent' && (
                            <div className="space-y-4">
                                {absentEmployees.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {absentEmployees.map((employee) => (
                                            <EmployeeCard
                                                key={employee._id}
                                                employee={employee}
                                                type="absent"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No absent employees found for this date.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'half' && (
                            <div className="space-y-4">
                                {halfDayEmployees.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {halfDayEmployees.map((punch) => (
                                            <EmployeeCard
                                                key={punch._id}
                                                employee={punch.employeeDetails}
                                                punch={punch}
                                                type="half"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No half-day employees found for this date.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'onhalf' && (
                            <div className="space-y-4">
                                {onHalfEmployees.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getOnHalfPunches().map(({ employee, punch }) => (
                                            <EmployeeCard
                                                key={employee._id}
                                                employee={employee}
                                                punch={punch} // may be undefined, handled in component
                                                type="onhalf"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Timer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No employees marked as half-day for this date.</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateWisePunches;
