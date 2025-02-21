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
  Tooltip
} from '@mui/material'
import CakeIcon from '@mui/icons-material/Cake'
import PersonIcon from '@mui/icons-material/Person'

import { fetchUpcomingBirthdays } from '@/redux/features/employees/employeesSlice'
import type { AppDispatch, RootState } from '@/redux/store'
import { utility } from '@/utility'
import useRouterWithMount from '@/utility/useRouterWithMount'



const UpcomingBirthdays = ({ companyDetails, loading }: { companyDetails: any; loading: boolean }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [userId, setUserId] = useState<string | undefined>()
  const { upcomingBirthdays, loadingBirthdays } = useSelector((state: RootState) => state.upcomingBirthdays)

  const { navigateToProfile } = useRouterWithMount()

  const { capitalizeFirstLetter } = utility()

  useEffect(() => {
    if (!loadingBirthdays) {
      dispatch(fetchUpcomingBirthdays(30))
    }
  }, [dispatch])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserId(user.id)
  }, [])

  // Get today's date in MM-DD format
  const today = dayjs().format('MM-DD')

  // Filter birthdays into today and upcoming
  const todayBirthdays = upcomingBirthdays.filter(row => dayjs(row._doc.dob).format('MM-DD') === today)

  // Get all upcoming birthdays (excluding today)
  const upcomingWithoutToday = upcomingBirthdays.filter(row => dayjs(row._doc.dob).format('MM-DD') !== today)

  // If there are birthdays today, all other birthdays go to the remaining list
  const allUpcoming = todayBirthdays.length > 0 ? upcomingWithoutToday : upcomingWithoutToday

  // Only show next birthday section if there are no birthdays today
  const nextBirthdayEmployees =
    todayBirthdays.length === 0
      ? (() => {
        const groupedUpcoming = allUpcoming.reduce((acc, curr) => {
          const birthDate = dayjs(curr._doc.dob).format('MM-DD')

          if (!acc[birthDate]) {
            acc[birthDate] = []
          }

          acc[birthDate].push(curr)

          return acc
        }, {})

        const nextDate = Object.keys(groupedUpcoming).sort()[0]

        return groupedUpcoming[nextDate] || []
      })()
      : []

  // Get remaining upcoming birthdays (excluding next birthday employees if no today birthdays)
  const remainingUpcoming =
    todayBirthdays.length > 0
      ? allUpcoming
      : allUpcoming.filter(
        employee =>
          dayjs(employee._doc.dob).format('MM-DD') !== dayjs(nextBirthdayEmployees[0]?._doc.dob).format('MM-DD')
      )

  return (
    <Card
      elevation={5}
      sx={{
        margin: 'auto',
        borderRadius: 3,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)'
      }}
    >
      {/* Today's Birthdays Section */}
      {todayBirthdays.length > 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography
            variant='h3'
            sx={{
              fontSize: '2rem',
              color: '#64e0e2',
              fontWeight: 800,
              letterSpacing: 2
            }}
          >
            Happy Birthday
          </Typography>
          <Typography
            variant='h6'
            sx={{
              color: 'rgb(255, 246, 218)', // Default text color
              fontWeight: 'bold',
              marginTop: 2,
              marginBottom: 2
            }}
          >
            🌟 Cheers to you on your special day! Warm wishes from your{' '}
            <span style={{ color: 'yellow', fontWeight: 'bold' }}>
              {loading ? '...' : companyDetails?.name || 'Your Company'}
            </span>{' '}
            family. 🌟
          </Typography>

          <Grid container spacing={2} justifyContent='center'>
            {todayBirthdays.map((row, index) => (
              <Grid item key={index} xs={4}>
                <Tooltip title="View Profile" arrow>
                  <Avatar
                    src={row._doc.image}
                    alt={`${row._doc.first_name} ${row._doc.last_name}`}
                    sx={{
                      width: 85,
                      height: 85,
                      margin: 'auto',
                      border: '2px solid #ddd',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={() => navigateToProfile(row._doc?._id)}
                  >
                    {!row._doc.image && <PersonIcon />}
                  </Avatar>
                </Tooltip>
                <Typography variant='h6' sx={{ color: 'white', mt: 1, textAlign: 'center' }}>
                  {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                </Typography>
                <Typography variant='h6' sx={{ color: 'white', mt: 1, textAlign: 'center' }}>
                  {row._doc.designation}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Next Upcoming Birthdays Section - Only shown if no birthdays today */}
      {todayBirthdays.length === 0 && nextBirthdayEmployees.length > 0 && (
        <Box sx={{ textAlign: 'center', pb: 3, pt: 3 }}>
          <Typography
            variant='h3'
            sx={{
              margin: '10px',
              fontSize: '2rem',
              color: '#64e0e2',
              fontWeight: 800,
              letterSpacing: 2
            }}
          >
            <div>Upcoming Birthday{nextBirthdayEmployees.length > 1 ? 's' : ''}</div>
          </Typography>

          <Typography
            variant='h6'
            sx={{
              color: 'rgb(255, 246, 218)',
              fontWeight: 'bold',
              marginTop: 1,
              marginBottom: 1
            }}
          >
            Coming up on {dayjs(nextBirthdayEmployees[0]._doc.dob).format('D MMM')}!
          </Typography>

          <Grid container spacing={2} justifyContent='center' sx={{ mt: 1 }}>
            {nextBirthdayEmployees.map((employee, index) => (
              <Grid item key={index} xs={4}>
                <Tooltip title="View profile" arrow>
                  <Avatar
                    src={employee._doc.image}
                    alt={`${employee._doc.first_name} ${employee._doc.last_name}`}
                    sx={{
                      width: 87,
                      height: 87,
                      margin: 'auto',
                      border: '2px solid #ddd',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                    }}
                    onClick={() => navigateToProfile(employee._doc?._id)}
                  >
                    {!employee._doc.image && <PersonIcon />}
                  </Avatar>
                </Tooltip>
                <Typography variant='h6' sx={{ color: 'white', mt: 1, textAlign: 'center' }}>
                  {capitalizeFirstLetter(employee._doc.first_name)} {capitalizeFirstLetter(employee._doc.last_name)}
                </Typography>
                <Typography variant='body2' sx={{ color: '#64e0e2', textAlign: 'center', mt: 2 }}>
                  {employee._doc.designation}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Other Upcoming Birthdays Section */}
      <Card
        sx={{
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 3,
          backgroundColor: 'white',
          border: '1px solid #ddd'
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CakeIcon color='primary' />
              <Typography variant='h5' sx={{ color: '#333', fontWeight: 'bold' }}>
                Other Upcoming Birthday's
              </Typography>
            </Box>
          }
          sx={{
            backgroundColor: 'white',
            borderBottom: '1px solid #ddd',
            py: 2
          }}
        />
        <CardContent sx={{ p: 0 }}>
          {remainingUpcoming.length === 0 ? (
            <Typography variant='body2' sx={{ p: 2, textAlign: 'center', color: '#666' }}>
              No more upcoming birthdays
            </Typography>
          ) : (
            <List disablePadding>
              {remainingUpcoming.map((row, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider variant='inset' component='li' />}
                  <ListItem
                    alignItems='center'
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: '#f9f9f9',
                        transition: 'background-color 0.3s ease'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Tooltip title="View Profile" arrow>
                        <Avatar
                          src={row._doc.image}
                          alt={`${row._doc.first_name} ${row._doc.last_name}`}
                          sx={{
                            width: 56,
                            height: 56,
                            border: '3px solid #ddd',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                          onClick={() => navigateToProfile(row._doc?._id)}
                        >
                          {!row._doc.image && <PersonIcon />}
                        </Avatar>
                      </Tooltip>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#333', fontWeight: 'bold' }} variant='subtitle1'>
                          {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography component='span' variant='body2' sx={{ color: '#666', display: 'block' }}>
                            {dayjs(row._doc.dob).format('D MMM')}
                          </Typography>
                          <Typography component='span' variant='body2' sx={{ color: '#2196F3' }}>
                            {row._doc.designation}
                          </Typography>
                        </Box>
                      }
                    />
                    <CakeIcon color='primary' fontSize='small' sx={{ opacity: 0.7 }} />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Card>
  )
}

export default UpcomingBirthdays
