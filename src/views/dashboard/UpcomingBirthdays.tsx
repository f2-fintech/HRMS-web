import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "@/redux/store";
import { fetchUpcomingBirthdays } from '@/redux/features/employees/employeesSlice';
import dayjs from 'dayjs';

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
  Chip
} from '@mui/material';

// MUI Icons
import CakeIcon from '@mui/icons-material/Cake';
import PersonIcon from '@mui/icons-material/Person';
import { utility } from '@/utility';

const UpcomingBirthdays = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState<string | undefined>();
  const { upcomingBirthdays } = useSelector((state: RootState) => state.upcomingBirthdays);
  const { capitalizeFirstLetter } = utility();

  useEffect(() => {
    if (upcomingBirthdays.length === 0) {
      dispatch(fetchUpcomingBirthdays(30));
    }
  }, [dispatch, upcomingBirthdays]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user.id);
  }, []);

  const today = dayjs().format('MM-DD');

  return (
    <Card
      elevation={3}
      sx={{
        maxWidth: 400,
        margin: 'auto',
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CakeIcon color="primary" />
            <Typography variant="h6" color="primary">
              Upcoming Birthdays
            </Typography>
          </Box>
        }
        sx={{
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      />
      <CardContent sx={{ p: 0, pb: '0 !important' }}>
        {upcomingBirthdays.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: 'center' }}
          >
            No upcoming birthdays
          </Typography>
        ) : (
          <List disablePadding>
            {upcomingBirthdays.map((row, index) => {
              const birthday = dayjs(row._doc.dob).format('MM-DD');
              const isToday = birthday === today;

              return (
                <React.Fragment key={index}>
                  {index > 0 && <Divider variant="inset" component="li" />}
                  <ListItem
                    alignItems="center"
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'action.hover'
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
                          border: '2px solid',
                          borderColor: isToday ? 'success.main' : 'divider'
                        }}
                      >
                        {!row._doc.image && <PersonIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {capitalizeFirstLetter(row._doc.first_name)} {capitalizeFirstLetter(row._doc.last_name)}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {dayjs(row._doc.dob).format('D MMM')}
                          </Typography>
                          {isToday && (
                            <Chip
                              icon={<CakeIcon fontSize="small" />}
                              label={
                                userId === row._id
                                  ? "Happy Birthday to you!"
                                  : "Wish happy birthday!"
                              }
                              color="success"
                              size="small"
                              sx={{ ml: 2, verticalAlign: 'middle' }}
                            />
                          )}
                        </>
                      }
                    />
                    <CakeIcon
                      color="primary"
                      fontSize="small"
                      sx={{ opacity: 0.7 }}
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingBirthdays;
