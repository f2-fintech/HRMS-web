'use client'

import { useEffect, useState } from 'react'
import SettingsIcon from '@mui/icons-material/Settings'
import TuneIcon from '@mui/icons-material/Tune'
import { useDispatch, useSelector } from 'react-redux'
import Grid from '@mui/material/Grid'
import type { AppDispatch, RootState } from '@/redux/store'

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
import Achievement from '@/views/Achievement'
import IndianNewsViewer from '@/views/dashboard/IndianNewsViewer'

import { fetchConfiguration } from '@/redux/features/configuration/configurationSlice'

import {
  Button,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Tooltip,
  Typography
} from '@mui/material'
import { fetchPreferences, updatePreferences } from '@/redux/features/dashboardPreferences/dashboardPreferencesSlice'

const DashboardAnalytics = () => {
  const [userRole, setUserRole] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [open, setOpen] = useState(false)
  const [isCustomizationEnabled, setIsCustomizationEnabled] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const { data: companyDetails, loading: companyLoading } = useSelector((state: RootState) => state.configuration)
  const { hiddenCards = [] } = useSelector((state: RootState) => state.dashboardPreferences || { hiddenCards: [] })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const companyId = user?.company_id || ''
  const employeeId = user?.id

  useEffect(() => {
    if (!userRole) {
      setUserRole(user.role || '')
    }
  }, [userRole, user.role])

  useEffect(() => {
    if (!companyDetails) {
      dispatch(fetchConfiguration())
    }
    if (companyId) {
      dispatch(fetchPreferences({ companyId }))
    }
  }, [dispatch, companyDetails, companyId])

  const dashboardCards = [
    { key: 'Award', component: <Award /> },
    { key: 'Transactions', component: <Transactions /> },
    {
      key: 'UpcomingBirthdays',
      component: <UpcomingBirthdays companyDetails={companyDetails} loading={companyLoading} />
    },
    { key: 'Company Holidays', component: <TotalHolidays /> },
    { key: 'LocationWisePerformer', component: <LocationWisePerformer /> },
    { key: 'TradingViewWidget', component: <TradingViewWidget /> },
    { key: 'WorkAnniversary', component: <WorkAnniversary companyDetails={companyDetails} loading={companyLoading} /> },
    { key: 'Company Achievement', component: <Achievement /> }
  ]

  const handleToggle = (card: string) => {
    const newHiddenCards = hiddenCards.includes(card) ? hiddenCards.filter(c => c !== card) : [...hiddenCards, card]

    dispatch(updatePreferences({ companyId, hiddenCards: newHiddenCards }))
  }

  return (
    <Grid container spacing={6}>
      {/* Common New Year Dashboard */}
      <Grid item xs={12} md={12} lg={12}>
        <NewYearDashboard companyDetails={companyDetails} loading={companyLoading} />
      </Grid>

      {/* Button to Customize Dashboard */}
      {userRole === '1' && <Grid
        item
        xs={12}
        sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '16px' }}
      >
        {/* Toggle Switch for Customization Mode */}
        <Tooltip title='Customize Dashboard' arrow>
          <FormControlLabel
            control={
              <Switch
                checked={isCustomizationEnabled}
                onChange={() => {
                  setIsCustomizationEnabled(!isCustomizationEnabled)
                  setOpen(!isCustomizationEnabled) // ✅ Ensure modal opens/closes based on toggle
                }}
                color='primary'
              />
            }
            label={
              <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'purple' }}>
                <TuneIcon sx={{ marginRight: '8px' }} />
              </span>
            }
          />
        </Tooltip>
      </Grid>}

      {/* Customization Modal */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          setIsCustomizationEnabled(false) // ✅ Ensure toggle is OFF when modal closes
        }}
      >
        <DialogTitle>Customize Your Dashboard</DialogTitle>

        {/* ✅ Note Message */}
        <DialogContent dividers>
          <Typography
            variant='body2'
            sx={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '10px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#333'
            }}
          >
            You can select or deselect widgets according to your requirements in the dashboard.
          </Typography>

          {dashboardCards.map(card => (
            <FormControlLabel
              key={card.key}
              control={<Checkbox checked={!hiddenCards.includes(card.key)} onChange={() => handleToggle(card.key)} />}
              label={card.key}
            />
          ))}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false)
              setIsCustomizationEnabled(false) // ✅ Ensure toggle is OFF when closing
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <>
        {/* Punch In/Out Component */}
        <Grid item xs={12} md={6}>
          <PunchInOut selectedDate={selectedDate} selectedEmployeeId={employeeId} isMinimalView={true} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Transactions />
        </Grid>
      </>

      {/* Conditional Rendering Based on Role */}
      {userRole === '0' ? (
        <Grid item xs={12}>
          <SuperAdminDashboard />
        </Grid>
      ) : (
        <>
          {/* Awards and Achievements */}
          {!hiddenCards.includes('Award') && (
            <Grid item xs={12} md={6}>
              <Award />
            </Grid>
          )}

          {!hiddenCards.includes('Achievement') && (
            <Grid item xs={12} md={6}>
              <Achievement />
            </Grid>
          )}

          {/* Upcoming Birthdays and Work Anniversary */}
          {!hiddenCards.includes('UpcomingBirthdays') && (
            <Grid item xs={12} md={6}>
              <UpcomingBirthdays companyDetails={companyDetails} loading={companyLoading} />
            </Grid>
          )}

          {!hiddenCards.includes('WorkAnniversary') && (
            <Grid item xs={12} md={6}>
              <WorkAnniversary companyDetails={companyDetails} loading={companyLoading} />
            </Grid>
          )}

          {/* Location Wise Performer and Total Holidays */}
          {!hiddenCards.includes('LocationWisePerformer') && (
            <Grid item xs={12} md={6}>
              <LocationWisePerformer />
            </Grid>
          )}

          {!hiddenCards.includes('TotalHolidays') && (
            <Grid item xs={12} md={6}>
              <TotalHolidays />
            </Grid>
          )}

          {/* Trading View Widget */}
          {!hiddenCards.includes('TradingViewWidget') && (
            <Grid item xs={12} md={6}>
              <TradingViewWidget />
            </Grid>
          )}
        </>
      )}
    </Grid>
  )
}

export default DashboardAnalytics
