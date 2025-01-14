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
  Grid
} from '@mui/material'
import CakeIcon from '@mui/icons-material/Cake'
import PersonIcon from '@mui/icons-material/Person'

import { fetchUpcomingBirthdays } from '@/redux/features/employees/employeesSlice'
import type { AppDispatch, RootState } from '@/redux/store'
import { utility } from '@/utility'

const UpcomingBirthdays = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState<string | undefined>();
  const { upcomingBirthdays, loadingBirthdays } = useSelector((state: RootState) => state.upcomingBirthdays);
  const { capitalizeFirstLetter } = utility();

  useEffect(() => {
    if (!loadingBirthdays && upcomingBirthdays.length === 0) {
      dispatch(fetchUpcomingBirthdays(30));
    }
  }, [dispatch, upcomingBirthdays.length]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserId(user.id)
  }, [])

  const today = dayjs().format('MM-DD')
  const todayBirthdays = upcomingBirthdays.filter(row => dayjs(row._doc.dob).format('MM-DD') === today)
  const upcomingWithoutToday = upcomingBirthdays.filter(row => dayjs(row._doc.dob).format('MM-DD') !== today)

  const groupedUpcomingBirthdays = upcomingWithoutToday.reduce((acc, curr) => {
    const birthDate = dayjs(curr._doc.dob).format('MM-DD')

    if (!acc[birthDate]) {
      acc[birthDate] = []
    }

    acc[birthDate].push(curr)

    return acc
  }, {})

  const nextBirthdayDate = Object.keys(groupedUpcomingBirthdays).sort()[0]
  const nextBirthdayEmployees = groupedUpcomingBirthdays[nextBirthdayDate] || []

  const remainingUpcoming = upcomingWithoutToday.filter(employee =>
    dayjs(employee._doc.dob).format('MM-DD') !== nextBirthdayDate
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
      {todayBirthdays.length > 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
          }}
        >
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
              color: 'white',
              fontWeight: 'bold',
              marginTop: 2,
            }}
          >
            Wish them today!
          </Typography>

          <Grid container spacing={2} justifyContent='center'>
            {todayBirthdays.map((row, index) => (
              <Grid item key={index} xs={4}>
                <Avatar
                  src={row._doc.image}
                  alt={`${row._doc.first_name} ${row._doc.last_name}`}
                  sx={{
                    width: 64,
                    height: 64,
                    margin: 'auto',
                    border: '2px solid #ddd',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {!row._doc.image && <PersonIcon />}
                </Avatar>
                <Typography variant='h6' sx={{ color: 'white', mt: 1, textAlign: 'center' }}>
                  {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : nextBirthdayEmployees.length > 0 && (
        <Box
          sx={{
            textAlign: 'center',
            pb: 3  // Added padding bottom for more space
          }}
        >
          <Typography
            variant='h3'
            sx={{
              margin: "10px",
              fontSize: '2rem',
              color: '#64e0e2',
              fontWeight: 800,
              letterSpacing: 2
            }}
          >
            Upcoming Birthday {nextBirthdayEmployees.length > 1 ? 's' : ''}
          </Typography>

          <Typography
            variant='h6'
            sx={{
              color: 'white',
              fontWeight: 'bold',
              marginTop: 5,
              marginBottom: 5,  // Added margin bottom for more space
            }}
          >
            Coming up on {dayjs(nextBirthdayEmployees[0]._doc.dob).format('D MMM')}!
          </Typography>

          <Grid container spacing={2} justifyContent='center' sx={{ mt: 1 }}>
            {nextBirthdayEmployees.map((employee, index) => (
              <Grid item key={index} xs={4}>
                <Avatar
                  src={employee._doc.image}
                  alt={`${employee._doc.first_name} ${employee._doc.last_name}`}
                  sx={{
                    width: 87,
                    height: 87,
                    margin: 'auto',
                    border: '2px solid #ddd',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {!employee._doc.image && <PersonIcon />}
                </Avatar>
                <Typography variant="h6" sx={{ color: 'white', mt: 1, textAlign: 'center' }}>
                  {capitalizeFirstLetter(employee._doc.first_name)} {capitalizeFirstLetter(employee._doc.last_name)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64e0e2', textAlign: 'center', mt: 2 }}>  {/* Increased margin top */}
                  {employee._doc.designation}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Card
        sx={{
          borderRadius: "20px",
          overflow: 'hidden',
          boxShadow: 3,
          backgroundColor: 'white',
          border: '1px solid #ddd',
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CakeIcon color="primary" />
              <Typography variant="h5" sx={{ color: '#333', fontWeight: 'bold' }}>
                Other Upcoming Birthday's
              </Typography>
            </Box>
          }
          sx={{
            backgroundColor: 'white',
            borderBottom: '1px solid #ddd',
            py: 2,
          }}
        />
        <CardContent sx={{ p: 0 }}>
          {remainingUpcoming.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ p: 2, textAlign: 'center', color: '#666' }}
            >
              No more upcoming birthdays
            </Typography>
          ) : (
            <List disablePadding>
              {remainingUpcoming.map((row, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider variant="inset" component="li" />}
                  <ListItem
                    alignItems="center"
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: '#f9f9f9',
                        transition: 'background-color 0.3s ease',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={row._doc.image}
                        alt={`${row._doc.first_name} ${row._doc.last_name}`}
                        sx={{
                          width: 56,
                          height: 56,
                          border: '3px solid #ddd',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        {!row._doc.image && <PersonIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{ color: '#333', fontWeight: 'bold' }}
                          variant="subtitle1"
                        >
                          {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: '#666', display: 'block' }}
                          >
                            {dayjs(row._doc.dob).format('D MMM')}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{ color: '#2196F3' }}
                          >
                            {row._doc.designation}
                          </Typography>
                        </Box>
                      }
                    />
                    <CakeIcon
                      color="primary"
                      fontSize="small"
                      sx={{ opacity: 0.7 }}
                    />
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
