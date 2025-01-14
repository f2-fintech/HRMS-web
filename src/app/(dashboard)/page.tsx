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
import WorkAnniversary from '@/views/dashboard/WorkAnniversary'

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
          <Grid item xs={12} md={6}>
            <Transactions />
          </Grid>

          {/* Upcoming Birthdays and Work Anniversary in one row */}
          <Grid item xs={12} md={6}>
            <UpcomingBirthdays />
          </Grid>
          <Grid item xs={12} md={6}>
            {userRole !== '' && <WorkAnniversary />}
          </Grid>

          {/* LocationWise Performer and Total Holidays in one row */}
          <Grid item xs={12} md={6}>
            {userRole !== '' && <LocationWisePerformer />}
          </Grid>
          <Grid item xs={12} md={6}>
            {userRole !== '' && <TotalHolidays />}
            <div style={{ marginTop: '16px' }}>
              <TradingViewWidget />
            </div>
          </Grid>


          {/* TradingView Widget - this will be alone on the next row */}
          {/* <Grid item xs={12} md={7} lg={7}>
        <TradingViewWidget />
      </Grid> */}

          {/* Additional components (like Table) can go here */}
          <Grid item xs={12}>
            {/* <Table /> */}
          </Grid>

        </>
      )}
    </Grid>
  );
};

export default DashboardAnalytics;






