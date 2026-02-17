import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Box,
  Grid,
  Alert,
  Tooltip
} from '@mui/material'
import WorkIcon from '@mui/icons-material/Work'
import PersonIcon from '@mui/icons-material/Person'
import StarIcon from '@mui/icons-material/Star'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech'

import { fetchWorkAnniversaries } from '@/redux/features/employees/employeesSlice'
import type { AppDispatch, RootState } from '@/redux/store'
import { utility } from '@/utility'
import useRouterWithMount from '@/utility/useRouterWithMount'
import { useSettings } from '@/@core/hooks/useSettings'

const IconLegend = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        p: 2,
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarIcon sx={{ color: '#9C27B0' }} />
        <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
          1–3 Years
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon sx={{ color: '#2196F3' }} />
        <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
          3–5 Years
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MilitaryTechIcon sx={{ color: '#FFD700' }} />
        <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
          5+ Years
        </Typography>
      </Box>
    </Box>
  )
}

const WorkAnniversary = ({
  companyDetails,
  loading
}: {
  companyDetails: any
  loading: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { capitalizeFirstLetter } = utility()
  const [error, setError] = useState<string | null>(null)

  const { navigateToProfile } = useRouterWithMount()
  const { settings } = useSettings()

  const { workAnniversaries, loadingAnniversaries, error: reduxError } =
    useSelector((state: RootState) => state.employees)

  useEffect(() => {
    dispatch(fetchWorkAnniversaries(5))
      .unwrap()
      .catch(err => setError(err?.message || 'Something went wrong'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const today = dayjs().startOf('day')

  const calculateYearsOfService = (joiningDate: string) => {
    const start = dayjs(joiningDate).startOf('day')
    if (!start.isValid()) return 0
    if (start.isAfter(today, 'day')) return 0
    return today.diff(start, 'year')
  }

  const getNextAnniversaryDate = (joiningDate: string) => {
    const start = dayjs(joiningDate).startOf('day')
    if (!start.isValid()) return null

    if (start.isAfter(today, 'day')) return null

    const yearsCompleted = today.diff(start, 'year')

    if (yearsCompleted < 1) return start.add(1, 'year')

    let next = start.year(today.year())
    if (next.isBefore(today, 'day')) next = next.add(1, 'year')
    return next
  }

  const daysUntilNextAnniversary = (joiningDate: string) => {
    const next = getNextAnniversaryDate(joiningDate)
    if (!next) return Number.POSITIVE_INFINITY
    return next.startOf('day').diff(today, 'day')
  }

  const getYearsCompleting = (joiningDate: string) => {
    const start = dayjs(joiningDate).startOf('day')
    if (!start.isValid()) return 0
    if (start.isAfter(today, 'day')) return 0
    const yearsCompleted = today.diff(start, 'year')
    return yearsCompleted + 1
  }

  const getCelebrationIcon = (years: number) => {
    if (years >= 5) return <MilitaryTechIcon sx={{ color: '#FFD700' }} />
    if (years >= 3) return <EmojiEventsIcon sx={{ color: '#2196F3' }} />
    if (years >= 1) return <StarIcon sx={{ color: '#9C27B0' }} />
    return null
  }

  const isTodayAnniversary = (joiningDate: string) => {
    const start = dayjs(joiningDate).startOf('day')
    if (!start.isValid()) return false
    if (start.isAfter(today, 'day')) return false

    const yearsCompleted = today.diff(start, 'year')
    return yearsCompleted >= 1 && start.format('MM-DD') === today.format('MM-DD')
  }

  const getTodayAnniversaryIcon = (joiningDate: string) => {
    if (!isTodayAnniversary(joiningDate)) return null
    const years = calculateYearsOfService(joiningDate)
    return getCelebrationIcon(years)
  }

  if (loadingAnniversaries) {
    return (
      <Card elevation={5}>
        <CardContent>
          <Typography variant='body1' align='center'>
            Loading...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (error || reduxError) {
    return <Alert severity='error'>{error || reduxError}</Alert>
  }

  // keep only valid dates (allow today joiners, but they won't be treated as anniversary today)
  const safeAnniversaries = (workAnniversaries || []).filter(emp => {
    if (!emp?.joining_date) return false
    return dayjs(emp.joining_date).isValid()
  })

  // TODAY
  const todayAnniversaries = safeAnniversaries.filter(emp =>
    isTodayAnniversary(emp.joining_date)
  )

  // UPCOMING: ONLY 2
  const upcomingAnniversariesSorted = safeAnniversaries
    .filter(emp => !isTodayAnniversary(emp.joining_date))
    .filter(emp => daysUntilNextAnniversary(emp.joining_date) > 0)
    .sort(
      (a, b) =>
        daysUntilNextAnniversary(a.joining_date) -
        daysUntilNextAnniversary(b.joining_date)
    )
    .slice(0, 2)

  // OTHER LIST: ONLY 3
  const otherWorkAnniversariesList = safeAnniversaries
    .filter(emp => !isTodayAnniversary(emp.joining_date))
    .sort(
      (a, b) =>
        daysUntilNextAnniversary(a.joining_date) -
        daysUntilNextAnniversary(b.joining_date)
    )
    .slice(0, 3)

  return (
    <Card
      elevation={5}
      sx={{
        margin: 'auto',
        borderRadius: 3,
        overflow: 'hidden',
        background:
          settings.mode === 'dark'
            ? '#333'
            : 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)'
      }}
    >
      <Box sx={{ pt: 3, px: 2 }}>
        <IconLegend />
      </Box>

      {todayAnniversaries.length > 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography
            variant='h3'
            sx={{
              fontSize: '1.5rem',
              color: '#64e0e2',
              fontWeight: 800,
              letterSpacing: 2,
              mb: 3
            }}
          >
            Today's Work Anniversary Celebration
          </Typography>

          <Typography variant='h6' sx={{ color: 'white', fontWeight: 'bold' }}>
            🌟 Your journey with{' '}
            <span style={{ color: 'yellow', fontWeight: 'bold' }}>
              {loading ? '...' : companyDetails?.name || 'Your Company'}
            </span>{' '}
            has been inspiring. Warm wishes on your work anniversary from all of
            us! 🌟
          </Typography>

          <Grid container spacing={3} justifyContent='center'>
            {todayAnniversaries.map((employee, index) => {
              const yearsCompleted = calculateYearsOfService(employee.joining_date)

              return (
                <Grid item key={employee._id || index} xs={12} sm={6} md={4}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Tooltip title='View Profile' arrow>
                      <Avatar
                        src={employee.image}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        sx={{
                          width: 80,
                          height: 80,
                          border: '3px solid #64e0e2',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                          cursor: 'pointer'
                        }}
                        onClick={() => navigateToProfile(employee?._id)}
                      >
                        {!employee.image && <PersonIcon />}
                      </Avatar>
                    </Tooltip>


                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        variant='h6'
                        sx={{ color: 'white', textAlign: 'center' }}
                      >
                        {capitalizeFirstLetter(employee.first_name)}{' '}
                        {capitalizeFirstLetter(employee.last_name)}
                      </Typography>
                      {getTodayAnniversaryIcon(employee.joining_date)}
                    </Box>

                    <Typography
                      variant='body1'
                      sx={{ color: '#64e0e2', textAlign: 'center' }}
                    >                      Completed {yearsCompleted}{' '}
                      {yearsCompleted === 1 ? 'year' : 'years'}
                    </Typography>
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      ) : (
        upcomingAnniversariesSorted.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography
              variant='h6'
              sx={{
                fontSize: '1.5rem',
                color: '#64e0e2',
                fontWeight: 800,
                letterSpacing: 2,
                mb: 3
              }}
            >
              Upcoming Work Anniversaries
            </Typography>

            <Typography
              variant='h6'
              sx={{
                color: 'rgb(255, 246, 218)',
                fontWeight: 'bold',
                mt: 3,
                mb: 3,
                textAlign: 'center',
                lineHeight: 1.5
              }}
            >
              🌟 A milestone is approaching as we prepare to celebrate a work
              anniversary at{' '}
              <span style={{ color: 'yellow', fontWeight: 'bold' }}>
                {loading ? '...' : companyDetails?.name || 'Your Company'}
              </span>
              . 🌟
            </Typography>

            <Grid container spacing={3} justifyContent='center'>
              {upcomingAnniversariesSorted.map((employee, index) => {
                const yearsCompleting = getYearsCompleting(employee.joining_date)
                const anniversaryDate = getNextAnniversaryDate(employee.joining_date)

                return (
                  <Grid item key={employee._id || index} xs={12} sm={6} md={4}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Tooltip title='View Profile' arrow>
                        <Avatar
                          src={employee.image}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          sx={{
                            width: 80,
                            height: 80,
                            border: '3px solid #64e0e2',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigateToProfile(employee?._id)}
                        >
                          {!employee.image && <PersonIcon />}
                        </Avatar>
                      </Tooltip>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant='h6' sx={{ color: 'white' }}>
                          {capitalizeFirstLetter(employee.first_name)}{' '}
                          {capitalizeFirstLetter(employee.last_name)}
                        </Typography>
                        {getCelebrationIcon(yearsCompleting)}
                      </Box>

                      <Typography variant='body1' sx={{ color: '#64e0e2' }}>
                        {(anniversaryDate
                          ? anniversaryDate.format('D MMM')
                          : '—')}{' '}
                        • Completing {yearsCompleting}{' '}
                        {yearsCompleting === 1 ? 'year' : 'years'}
                      </Typography>
                    </Box>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )
      )}

      {/* ============ OTHER WORK ANNIVERSARIES LIST ============ */}
      <Card
        sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 3,
          backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
          border: settings.mode === 'dark' ? '1px solid #444' : '1px solid #ddd'
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon color='primary' />
              <Typography
                variant='h6'
                sx={{
                  color: settings.mode === 'dark' ? 'white' : '#333',
                  fontWeight: 'bold'
                }}
              >
                Other Work Anniversaries
              </Typography>
            </Box>
          }
          sx={{
            backgroundColor: settings.mode === 'dark' ? '#333' : 'white',
            borderBottom: '1px solid #ddd',
            py: 2
          }}
        />

        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            {otherWorkAnniversariesList.map((employee, index) => {
              const joiningDate = dayjs(employee.joining_date).startOf('day')
              const yearsCompleting = getYearsCompleting(employee.joining_date)

              return (
                <React.Fragment key={employee._id || index}>
                  {index > 0 && <Divider variant='inset' component='li' />}

                  <ListItem
                    alignItems='center'
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor:
                          settings.mode === 'dark' ? '#444' : '#f9f9f9',
                        transition: 'background-color 0.3s ease'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Tooltip title='View Profile' arrow>
                        <Avatar
                          src={employee.image}
                          alt={`${employee.first_name} ${employee.last_name}`}
                          sx={{
                            width: 56,
                            height: 56,
                            border: '3px solid #ddd',
                            transition: 'transform 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': { transform: 'scale(1.1)' }
                          }}
                          onClick={() => navigateToProfile(employee?._id)}
                        >
                          {!employee.image && <PersonIcon />}
                        </Avatar>
                      </Tooltip>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              color: settings.mode === 'dark' ? 'white' : '#333',
                              fontWeight: 'bold'
                            }}
                            variant='subtitle1'
                          >
                            {capitalizeFirstLetter(employee.first_name)}{' '}
                            {capitalizeFirstLetter(employee.last_name)}
                          </Typography>

                          {getCelebrationIcon(yearsCompleting)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            component='span'
                            variant='body2'
                            sx={{
                              color: settings.mode === 'dark' ? '#fff' : '#666',
                              display: 'block'
                            }}
                          >
                             {joiningDate.format('D MMM YYYY')} 
                            • Completing {yearsCompleting}{' '}
                            {yearsCompleting === 1 ? 'year' : 'years'}
                          </Typography>

                          <Typography
                            component='span'
                            variant='body2'
                            sx={{ color: '#2196F3' }}
                          >
                            {employee.designation}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              )
            })}
          </List>
        </CardContent>
      </Card>
    </Card>
  )
}

export default WorkAnniversary
