'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Tooltip,
    Paper,
    Avatar
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import AwardForm from '../../components/performer/AwardForm';
import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import { utility } from '@/utility';
import { useRouter } from 'next/navigation';
import { useSettings } from '@core/hooks/useSettings';  // Importing useSettings hook for dark/light mode

const SixMonthAward = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [employeeName, setEmployeeName] = useState(null);
    const [amount, setAmount] = useState('');
    const [awardTitle, setAwardTitle] = useState('');
    const [approved, setApproved] = useState('');
    const [total, setTotal] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [awardData, setAwardData] = useState(null);
    const [userRole, setUserRole] = useState("");
    const [userId, setUserId] = useState(null);
    const [userDesg, setUserDesg] = useState(null);

    const { capitalizeFirstLetter } = utility();

    const [isMounted, setIsMounted] = useState(false);  // Track if the component is mounted
    const router = useRouter();
    const { settings } = useSettings();  // Accessing settings for dark/light mode

    useEffect(() => {
        setIsMounted(true);  // Set isMounted to true once the component is mounted
    }, []);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserId(user.id);
        setUserDesg(user.designation);
        setUserRole(user.role);

        const fetchEmployeesAndAwards = async () => {
            let token: string | null = null;
            const company_id = user?.company_id || '';

            if (typeof window !== "undefined") {
                token = localStorage?.getItem("token");
            }
            try {
                const employeesData = await apiResponse();
                setEmployees(employeesData)

                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/awards/sixmonthawards/get`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token} ${company_id}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch award');
                }

                const awardData = await response.json();

                if (Array.isArray(awardData) && awardData.length > 0) {
                    const award = awardData[0];
                    award.employee = employeesData.find(emp => emp._id === award.employee._id) || award.employee;
                    setAwardData(award);
                    setAwardTitle(award.awardTitle || 'Best seller of Last six months');
                } else {
                    setAwardData(awardData);
                }

                setIsEditMode(!!awardData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchEmployeesAndAwards();
    }, []);

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let token: string | null = null;
        const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

        if (typeof window !== "undefined") {
            token = localStorage?.getItem("token");
        }

        try {
            let url = `${process.env.NEXT_PUBLIC_APP_URL}/awards/sixmonthawards/performer/month`;
            const method = awardData && awardData._id ? 'PUT' : 'POST';

            if (method === 'PUT') {
                url = `${process.env.NEXT_PUBLIC_APP_URL}/awards/sixmonthawards/month/performer/${awardData._id}`;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employee: employeeName?._id,
                    amount,
                    awardTitle,
                    approved,
                    total,
                    company_id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save award');
            }

            const newAward = await response.json();
            const updatedEmployee = employees.find(emp => emp._id === newAward.employee);
            setAwardData({
                ...newAward,
                employee: updatedEmployee || newAward.employee
            });

            setEmployeeName(null);
            setIsFormOpen(false);
        } catch (error) {
            console.error('Error saving award:', error.message);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEditClick = () => {
        setIsEditMode(true);

        if (awardData) {
            setEmployeeName(awardData.employee);
            setAmount(awardData.amount?.toString());
            setAwardTitle(awardData.awardTitle || 'Best seller of Last six month');
            setApproved(awardData.approved?.toString() || '');
            setTotal(awardData.total?.toString() || '');
        }

        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setIsEditMode(false);
    };

    const handleProfileClick = (id: string) => {
        if (isMounted && router) {
            router.push(`/profile/${id}`);
        }
    };

    return (
        <Box>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card
                    key={awardData ? awardData._id : 'no-award'}
                    sx={{
                        height: "100%",
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: '15px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                        background: settings.mode === 'dark' ? '#333' : '#1a237e',  // Dark or light background
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                        }
                    }}
                >
                    <CardContent
                        sx={{
                            height: "100%",
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '2rem',
                            backgroundColor: settings.mode === 'dark' ? '#444' : '#ffffff', // Light/Dark mode for inner card
                            margin: '0px 5px 0px 5px',
                            borderTopLeftRadius: '80px',
                            borderBottomRightRadius: '80px',
                            borderBottomLeftRadius: '-10px',
                        }}
                    >
                        <Box>
                            <Paper
                                elevation={0}
                                sx={{
                                    background: settings.mode === 'dark' ? '#424242' : 'rgba(25, 118, 210, 0.05)',  // Dark/Light mode Paper background
                                    padding: '1.5rem',
                                    borderRadius: '1rem',
                                    marginBottom: '1.5rem',
                                    border: '1px solid rgba(25, 118, 210, 0.1)'
                                }}
                            >
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: settings.mode === 'dark' ? 'white' : '#1a237e', // Text color for dark/light mode
                                        fontWeight: 700,
                                        marginBottom: '0.5rem',
                                        letterSpacing: '-0.03125rem',
                                    }}
                                >
                                    {awardData && awardData.employee ? (
                                        <>
                                            {userId === awardData.employee._id ? 'Congratulations' : 'Congratulate'}{' '}
                                            <span
                                                style={{
                                                    background: 'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)',
                                                    WebkitBackgroundClip: 'text',
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {capitalizeFirstLetter(awardData.employee.first_name)}{' '}
                                                {capitalizeFirstLetter(awardData.employee.last_name)}
                                            </span>{' '}
                                            <Tooltip title="View Profile" arrow>
                                                <Avatar
                                                    src={awardData.employee.image}
                                                    alt={`${awardData.employee.first_name} ${awardData.employee.last_name}`}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        marginLeft: '0.5rem',
                                                        display: 'inline-block',
                                                        verticalAlign: 'middle',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleProfileClick(awardData.employee._id)} // On image click, navigate to profile page
                                                />
                                            </Tooltip>
                                        </>
                                    ) : (
                                        'No Award Data'
                                    )}
                                </Typography>

                                {awardData && awardData.employee && (
                                    <Typography
                                        variant='subtitle1'
                                        sx={{
                                            color: settings.mode === 'dark' ? '#fff' : '#5c6bc0', // Designation text color
                                            fontWeight: 500,
                                            letterSpacing: '0.03125rem'
                                        }}
                                    >
                                        {awardData.employee.designation}
                                    </Typography>
                                )}
                            </Paper>

                            <Box sx={{ marginTop: '1.5rem' }}>
                                <Typography
                                    variant='h6'
                                    sx={{
                                        color: settings.mode === 'dark' ? '#fff' : '#3949ab',  // Award Title color
                                        fontWeight: 600,
                                        marginBottom: '1rem',
                                        letterSpacing: '0.03125rem'
                                    }}
                                >
                                    {awardData?.awardTitle || 'Best seller of Last six month'}
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        background: settings.mode === 'dark' ? 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)' : 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                                        padding: '1rem 1.5rem',
                                        borderRadius: '0.75rem',
                                        display: 'inline-block'
                                    }}
                                >
                                    <Typography
                                        variant='h5'
                                        sx={{
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            letterSpacing: '0.0625rem'
                                        }}
                                    >
                                        ₹{awardData?.amount ? awardData.amount : 'N/A'}
                                    </Typography>
                                </Paper>
                            </Box>
                            {awardData?.approved && (
                                <Typography variant='h6' sx={{ color: '#5c6bc0', marginTop: '1rem' }}>
                                    Approved: ₹{awardData.approved}
                                </Typography>
                            )}

                            {awardData?.total && (
                                <Typography variant='h6' sx={{ color: '#5c6bc0', marginTop: '1rem' }}>
                                    Total: ₹{awardData.total}
                                </Typography>
                            )}
                        </Box>

                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '1.5rem',
                                right: '1.5rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <motion.img
                                src='/images/pages/trophy.png'
                                alt='trophy image'
                                style={{
                                    height: '5rem',
                                    filter: 'drop-shadow(0 0.25rem 0.5rem rgba(0,0,0,0.2))',
                                    width: 'auto'
                                }}
                                initial={{ rotate: -10 }}
                                animate={{
                                    rotate: [0, -5, 0, 5, 0],
                                    transition: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }
                                }}
                            />
                        </Box>

                        {(userDesg === 'Sr. Operation Manager' || userDesg === 'Asst. Ops Manager' || userDesg === 'Credit Executive' || userDesg === 'Assistant Growth Manager' || userRole === '1') && (
                            <Tooltip title='Add/Edit Award'>
                                <IconButton
                                    onClick={handleEditClick}
                                    sx={{
                                        position: 'absolute',
                                        top: '0.2rem',
                                        right: '0.2rem',
                                    }}
                                >
                                    <MoreVertIcon sx={{ color: settings.mode === 'dark' ? 'white' : '#1a237e' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {isFormOpen && (
                <AwardForm
                    employees={employees}
                    selectedEmployee={employeeName}
                    setSelectedEmployee={setEmployeeName}
                    amount={amount}
                    setAmount={setAmount}
                    awardTitle={awardTitle}
                    setAwardTitle={setAwardTitle}
                    approved={approved}
                    setApproved={setApproved}
                    total={total}
                    setTotal={setTotal}
                    isEditMode={isEditMode}
                    onSubmit={handleFormSubmit}
                    onClose={handleCloseForm}
                />
            )}
        </Box>
    );
};

export default SixMonthAward;
