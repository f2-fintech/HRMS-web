import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Grid,
    Box,
    Paper,
    alpha,
} from '@mui/material';
import {
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Business as BusinessIcon,
    People as PeopleIcon,
    AttachMoney as AttachMoneyIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
}));

const StatCard = styled(Card)(({ theme, bgcolor }) => ({
    backgroundColor: bgcolor,
    color: theme.palette.common.white,
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
        backgroundColor: alpha(bgcolor, 0.9),
    },
}));

const CompanyCard = styled(Card)(({ theme }) => ({
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
        '& .company-details': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
        },
    },
}));

const SuperAdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        totalCompanies: 0,
        activeCompanies: 0,
        totalUsers: 0,
        companies: [],
    });
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = {
        active: '#10B981',
        inactive: '#EF4444',
        enterprise: '#2196F3',
        professional: '#00C853',
        standard: '#FFB300',
        primary: '#3f51b5',
        secondary: '#f50057',
        success: '#2e7d32',
        info: '#0288d1',
    };

    const getCurrentTime = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/company/dashboard-stats`);
                const data = await response.json();

                setDashboardData(data);
                setRevenueData([
                    { month: 'Jan', Enterprise: 2500, Professional: 1800, Standard: 1200 },
                    { month: 'Feb', Enterprise: 2700, Professional: 1900, Standard: 1300 },
                    { month: 'Mar', Enterprise: 2900, Professional: 2000, Standard: 1400 },
                    { month: 'Apr', Enterprise: 3100, Professional: 2200, Standard: 1500 },
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Typography variant="h4" color="textSecondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    const { totalCompanies, activeCompanies, totalUsers, companies } = dashboardData;

    return (
        <Box >
            <Grid container spacing={4}>
                {/* Welcome Section */}
                <Grid item xs={12}>
                    <StyledCard>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
                                {getCurrentTime()}, Admin Hub
                            </Typography>
                            <Typography variant="h6" color="textSecondary">
                                Welcome to your company management dashboard. You have{' '}
                                <Box component="span" color="success.main" fontWeight="bold">
                                    {activeCompanies}
                                </Box>{' '}
                                active companies.
                            </Typography>
                        </CardContent>
                    </StyledCard>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} md={6} lg={4}>
                    <StatCard bgcolor={COLORS.primary}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography style={{ color: 'white' }} variant="subtitle1" sx={{ opacity: 0.8 }}>
                                        Total Companies
                                    </Typography>
                                    <Typography style={{ color: 'white' }} variant="h3" fontWeight="bold">
                                        {totalCompanies}
                                    </Typography>
                                </Box>
                                <BusinessIcon sx={{ fontSize: 48, opacity: 0.8, color: 'white' }} />
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <StatCard bgcolor={COLORS.success}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography style={{ color: 'white' }} variant="subtitle1" sx={{ opacity: 0.8 }}>
                                        Active Companies
                                    </Typography>
                                    <Typography style={{ color: 'white' }} variant="h3" fontWeight="bold">
                                        {activeCompanies}
                                    </Typography>
                                </Box>
                                <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.8, color: 'white' }} />
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <StatCard bgcolor={COLORS.info}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography style={{ color: 'white' }} variant="subtitle1" sx={{ opacity: 0.8 }}>
                                        Total Users
                                    </Typography>
                                    <Typography style={{ color: 'white' }} variant="h3" fontWeight="bold">
                                        {totalUsers}
                                    </Typography>
                                </Box>
                                <PeopleIcon sx={{ fontSize: 48, opacity: 0.8, color: 'white' }} />
                            </Box>
                        </CardContent>
                    </StatCard>
                </Grid>

                {/* Company Cards */}
                {companies.map((company) => (
                    <Grid item xs={12} lg={6} key={company._id}>
                        <CompanyCard>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Box>
                                        <Typography variant="h5" fontWeight="bold" color="primary">
                                            {company.name}
                                        </Typography>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                color: company.status === 'Active' ? COLORS.active : COLORS.inactive,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {company.status || 'Inactive'}
                                        </Typography>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="body2" color="textSecondary">
                                            Subscription
                                        </Typography>
                                        <Typography variant="h6" color="secondary" fontWeight="bold">
                                            {company.subscriptionType || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box
                                    className="company-details"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        transition: 'background-color 0.3s',
                                    }}
                                >
                                    <Grid container spacing={3}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Employees
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {company.employeeCount}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Address
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {company.address}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Phone
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {company.phone || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Email
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {company.email || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Joining Date
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                {new Date(company.date).toLocaleDateString() || 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </CardContent>
                        </CompanyCard>
                    </Grid>
                ))}

                {/* Charts Section */}
                <Grid item xs={12}>
                    <StyledCard>
                        <CardHeader
                            title={
                                <Typography variant="h5" color="primary" fontWeight="bold">
                                    Revenue by Subscription Type
                                </Typography>
                            }
                        />
                        <CardContent>
                            <Box height={400}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: 8,
                                                border: 'none',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Bar dataKey="Enterprise" fill={COLORS.enterprise} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Professional" fill={COLORS.professional} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Standard" fill={COLORS.standard} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </StyledCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SuperAdminDashboard;
