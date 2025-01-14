'use client'
import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'

import Award from '@views/dashboard/Award'
import Transactions from '@views/dashboard/Transactions'
import UpcomingBirthdays from '@/views/dashboard/UpcomingBirthdays'
import TotalHolidays from '@/views/dashboard/TotolHolidays'
import LocationWisePerformer from '@/views/dashboard/LocationWisePerformer'
import TradingViewWidget from '@views/dashboard/TotalEarning'
import NewYearDashboard from '@/views/dashboard/NewYearDashboard'
import SuperAdminDashboard from '@/views/dashboard/SuperAdmin'

const DashboardAnalytics = () => {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    if (userRole === "") {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      setUserRole(user.role);
    }
  }, [userRole]);

  return (
    <Grid container spacing={6}>
      {/* Common New Year Dashboard */}
      <Grid item xs={12} md={12} lg={12}>
        <NewYearDashboard />
      </Grid>

      {/* Conditional Rendering Based on Role */}
      {userRole === '0' ? (
        // AdminDashboard for role '0'
        <Grid item xs={12}>
          <SuperAdminDashboard />
        </Grid>
      ) : (
        // Regular Dashboard for other roles
        <>
          <Grid item xs={12} md={6}>
            <Award />
          </Grid>
          <Grid item xs={12} md={6} lg={6}>
            <Transactions />
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <UpcomingBirthdays />
          </Grid>
          <Grid item xs={12} md={7} lg={7}>
            <TradingViewWidget />
          </Grid>
          <Grid item xs={12} md={6}>
            {userRole !== '' && <LocationWisePerformer />}
          </Grid>
          <Grid item xs={12} md={6}>
            {userRole !== '' && <TotalHolidays />}
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default DashboardAnalytics;
