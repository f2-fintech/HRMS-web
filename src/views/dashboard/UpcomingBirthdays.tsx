import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'

// MUI Imports
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
  Chip,
  Grid
} from '@mui/material'

// MUI Icons
import CakeIcon from '@mui/icons-material/Cake'
import PersonIcon from '@mui/icons-material/Person'

import { fetchUpcomingBirthdays } from '@/redux/features/employees/employeesSlice'
import type { AppDispatch, RootState } from '@/redux/store'
import { utility } from '@/utility'

const UpcomingBirthdays = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [userId, setUserId] = useState<string | undefined>()

  const { upcomingBirthdays } = useSelector((state: RootState) => state.upcomingBirthdays)

  const { capitalizeFirstLetter } = utility()

  useEffect(() => {
    if (upcomingBirthdays.length === 0) {
      dispatch(fetchUpcomingBirthdays(30))
    }
  }, [dispatch, upcomingBirthdays])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserId(user.id)
  }, [])

  const today = dayjs().format('MM-DD')

  // Filter birthdays happening today
  const todayBirthdays = upcomingBirthdays.filter(row => dayjs(row._doc.dob).format('MM-DD') === today)

  // Filter out today's birthday persons from the upcoming birthdays list
  const upcomingWithoutToday = upcomingBirthdays.filter(row => dayjs(row._doc.dob).format('MM-DD') !== today)

  return (
    <Card
      elevation={5}
      sx={{
        maxWidth: 460,
        margin: 'auto',
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: 'white' //
        // boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
        // transition: "box-shadow 0.3s ease-in-out",
        // "&:hover": {
        //   boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)",
        // },
      }}
    >
      {/* Happy Birthday Section */}
      {todayBirthdays.length > 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            backgroundColor: 'white'
          }}
        >
          <Typography
            variant='h3'
            sx={{
              fontFamily: "'Pacifico', cursive",
              fontSize: '2.5rem',
              color: '#E91E63',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}
          >
            Happy Birthday
          </Typography>

          <Typography
            variant='h6'
            sx={{
              color: 'green',
              fontWeight: 'bold',
              marginTop: 2,
              fontStyle: 'italic'
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
                <Typography variant='body2' sx={{ color: '#333', mt: 1, textAlign: 'center' }}>
                  {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CakeIcon color='primary' />
            <Typography variant='h5' sx={{ color: '#333', fontWeight: 'bold' }}>
              Upcoming Birthdays
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
        {upcomingWithoutToday.length === 0 ? (
          <Typography variant='body2' sx={{ p: 2, textAlign: 'center', color: '#666' }}>
            No upcoming birthdays
          </Typography>
        ) : (
          <List disablePadding>
            {upcomingWithoutToday.map((row, index) => {
              const birthday = dayjs(row._doc.dob).format('MM-DD')
              const isToday = birthday === today

              return (
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
                      <Avatar
                        src={row._doc.image}
                        alt={`${row._doc.first_name} ${row._doc.last_name}`}
                        sx={{
                          width: 56,
                          height: 56,
                          border: '3px solid',
                          borderColor: isToday ? 'success.main' : '#ddd',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        {!row._doc.image && <PersonIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: '#333', fontWeight: 'bold' }} variant='subtitle1'>
                          {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography component='span' variant='body2' sx={{ color: '#666' }}>
                            {dayjs(row._doc.dob).format('D MMM')}
                          </Typography>
                          {isToday && (
                            <Chip
                              icon={<CakeIcon fontSize='small' />}
                              label={userId === row._id ? 'Happy Birthday to you!' : 'Wish happy birthday!'}
                              color='success'
                              size='small'
                              sx={{ ml: 2 }}
                            />
                          )}
                        </>
                      }
                    />
                    <CakeIcon color='primary' fontSize='small' sx={{ opacity: 0.7 }} />
                  </ListItem>
                </React.Fragment>
              )
            })}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingBirthdays
