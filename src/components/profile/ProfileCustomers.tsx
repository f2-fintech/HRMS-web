import React from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';

// ProfileCustomers wrapper for displaying loan customer status tabs
const ProfileCustomers = ({ profileId }) => {
    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCustomerClick = (customerId) => {
        if (process.env.NEXT_PUBLIC_OMS_URL) {
            window.location.href = `${process.env.NEXT_PUBLIC_OMS_URL}/customers/${customerId}`;
        } else {
            console.log('OMS URL missing, redirect logic to customer:', customerId);
        }
    };

    return (
        <Box>
            <Typography variant="h5" mb={2} color="primary" fontWeight="bold">Loan Customers</Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer tabs">
                    <Tab label="In Progress Files" />
                    <Tab label="Disbursed" />
                    <Tab label="Rejected/Hold" />
                </Tabs>
            </Box>

            <Paper sx={{ p: 3, minHeight: '200px' }}>
                {tabValue === 0 && (
                    <Box>
                        <Typography variant="subtitle1">Currently in-progress loan files for this user.</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Integration with OMS backend is required to pull the customer list.</Typography>
                        {/* Mock Customer */}
                        <Box onClick={() => handleCustomerClick('12345')} sx={{ cursor: 'pointer', color: 'blue', mt: 2 }}>
                            Mock Customer John Doe (#12345)
                        </Box>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box>
                        <Typography variant="subtitle1">Disbursed loan files handled by this user.</Typography>
                    </Box>
                )}
                {tabValue === 2 && (
                    <Box>
                        <Typography variant="subtitle1">Rejected or Hold files handled by this user.</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default ProfileCustomers;
