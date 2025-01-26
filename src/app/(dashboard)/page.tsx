'use client'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/redux/store'

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
import PunchInOut from '@/views/PunchInOut'

import { fetchConfiguration } from '@/redux/features/configuration/configurationSlice'

const DashboardAnalytics = () => {
  const [userRole, setUserRole] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const dispatch = useDispatch<AppDispatch>()

  const { data: companyDetails, loading: companyLoading } = useSelector((state: RootState) => state.configuration)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const employeeId = user.id || ''

  // Fetch user role from localStorage
  useEffect(() => {
    if (!userRole) {
      setUserRole(user.role || '')
    }
  }, [userRole, user.role])

  // Fetch company details once
  useEffect(() => {
    if (!companyDetails) {
      dispatch(fetchConfiguration())
    }
  }, [dispatch, companyDetails])

  return (
    <Grid container spacing={6}>
      {/* Common New Year Dashboard */}
      <Grid item xs={12} md={12} lg={12}>
        <NewYearDashboard companyDetails={companyDetails} loading={companyLoading} />
      </Grid>

      {/* Punch In/Out Component */}
      <Grid item xs={12} md={12} lg={12}>
        <PunchInOut selectedDate={selectedDate} selectedEmployeeId={employeeId} isMinimalView={true} />
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
            <UpcomingBirthdays companyDetails={companyDetails} loading={companyLoading} />
          </Grid>
          <Grid item xs={12} md={6}>
            {userRole !== '' && <WorkAnniversary companyDetails={companyDetails} loading={companyLoading} />}
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
        </>
      )}
    </Grid>
  )
}

export default DashboardAnalytics
