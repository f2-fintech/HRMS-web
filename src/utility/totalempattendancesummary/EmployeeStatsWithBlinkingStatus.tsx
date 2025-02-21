import React, { useEffect, useState } from 'react'

import dayjs from 'dayjs'
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  ThemeProvider,
  createTheme,
  Avatar,
  Tooltip,
  Divider,
  DialogContent,
  ListItem,
  Dialog,
  List,
  DialogTitle,
  IconButton,
  Collapse
} from '@mui/material'
import {
  Person as PersonIcon,
  EventBusy as AbsentIcon,
  EventAvailable as PresentIcon,
  BeachAccess as LeaveIcon,
  AccessTime as HalfDayIcon,
  LocationOn as LocationIcon,
  DirectionsRun as OnFieldIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'

import HomeIcon from '@mui/icons-material/Home'
import Loader from '@/components/loader/loader'

import { employeesCountResponse } from '@/utility/apiResponse/employeesResponse'
import LocationCard from './LocationCard'

interface AttendanceCounts {
  Present: number
  Absent: number
  OnLeave: number
  OnHalf: number
  OnField: number
  OnWfh: number
}

interface LocationAttendanceCounts {
  [location: string]: {
    counts: AttendanceCounts
    totalEmployeesToday: number
    employeesByStatus: {
      Present: string[]
      Absent: string[]
      OnLeave: string[]
      OnHalf: string[]
      OnField: string[]
      OnWfh: string[]
    }
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5'
    },
    secondary: {
      main: '#f50057'
    },
    background: {
      default: '#f0f2f5',
      paper: '#ffffff'
    },
    text: {
      primary: '#333333',
      secondary: '#666666'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2rem'
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          borderRadius: '12px'
        }
      }
    }
  }
})

const StatusCard: React.FC<{ count: number; status: string; employees: string[]; onClick: () => void }> = ({
  count,
  status,
  employees,
  onClick
}) => {
  const theme = useTheme()

  const getStatusInfo = () => {
    switch (status) {
      case 'Present':
        return {
          icon: <PresentIcon />,
          color: theme.palette.success.main,
          backgroundColor: theme.palette.success.light
        }
      case 'Absent':
        return { icon: <AbsentIcon />, color: theme.palette.error.main, backgroundColor: theme.palette.error.light }
      case 'On_Leave':
        return { icon: <LeaveIcon />, color: theme.palette.warning.main, backgroundColor: theme.palette.warning.light }
      case 'On_Half':
        return { icon: <HalfDayIcon />, color: theme.palette.info.main, backgroundColor: theme.palette.info.light }
      case 'On_Field':
        return {
          icon: <OnFieldIcon />,
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light
        }
      case 'On_Wfh': // New status
        return {
          icon: <HomeIcon />,
          color: theme.palette.secondary.main,
          backgroundColor: theme.palette.secondary.light
        }
      default:
        return { icon: <PersonIcon />, color: theme.palette.grey[500], backgroundColor: theme.palette.grey[200] }
    }
  }

  const { icon, color, backgroundColor } = getStatusInfo()

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        borderRadius: '12px',
        backgroundColor,
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 12px rgba(0,0,0,0.15)'
        },
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <Avatar sx={{ bgcolor: color, width: 56, height: 56, mb: 2 }}>{icon}</Avatar>
      <Typography variant='h5' sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
        {count}
      </Typography>
      <Typography variant='body2' sx={{ color: 'white', textAlign: 'center' }}>
        {status.replace('_', ' ').trim()}
      </Typography>
    </Paper>
  )
}

const EmployeeAttendanceStatus: React.FC = () => {
  const [totalEmployees, setTotalEmployees] = useState<number>(0)
  const [attendanceCountsByLocation, setAttendanceCountsByLocation] = useState<LocationAttendanceCounts>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [dialogTitle, setDialogTitle] = useState<string>('')
  const [accClicked, setAccClicked] = useState<boolean>(false)

  const [expandedLocations, setExpandedLocations] = useState<{ [key: string]: boolean }>({})

  let token: string | null = null
  let company_id: string | null = null

  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user')
    if (user) {
      const parsedUser = JSON.parse(user)
      company_id = parsedUser?.company_id || null
    }
    token = localStorage.getItem('token')
  }

  if (!company_id) {
    console.error('Company ID is missing in localStorage')
  }

  const handleLocationExpand = (location: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [location]: !prev[location]
    }))
    setAccClicked(true)
  }

  const handleStatusClick = async (status: string, location: string) => {
    try {
      // Fetch attendance data based on status
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/attendence/attendenceByStatus?status=${status}&location=${location}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json'
          }
        }
      ) // Call your backend API
      const employeesData = await response.json() // Get the employee data

      // Sort employees based on their names
      const sortedEmployees = employeesData.sort((a: any, b: any) =>
        a.employee.first_name.localeCompare(b.employee.first_name)
      )

      setSelectedEmployees(sortedEmployees) // Set sorted employees
      setDialogTitle(status) // Set dialog title to the status
      setDialogOpen(true) // Open the dialog
    } catch (error) {
      console.error('Error fetching employees by status:', error)
    }
  }

  useEffect(() => {
    const fetchEmployeesCount = async () => {
      try {
        const employees: number = await employeesCountResponse()
        setTotalEmployees(employees)
        setLoading(false)
      } catch (error: any) {
        setError(error.message || 'An unexpected error occurred.')
        setLoading(false)
      }
    }

    fetchEmployeesCount()
  }, [])

  useEffect(() => {
    if (!attendanceCountsByLocation.length && accClicked) {
      const fetchAttendanceCounts = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/attendence/location-counts`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token} ${company_id}`,
              'Content-Type': 'application/json'
            }
          })
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          const data = await response.json()
          setAttendanceCountsByLocation(data)
        } catch (error) {
          console.error('Error fetching attendance counts:', error)
        }
      }
      fetchAttendanceCounts()
    }
  }, [accClicked])

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default' }}>
        <Paper elevation={3} sx={{ p: 3, mb: 1 }}>
          <Grid container spacing={2} alignItems='center' justifyContent='space-between'>
            <Grid item>
              <Typography variant='h4' color='primary' gutterBottom>
                Employee Attendance Dashboard
              </Typography>
              <Typography variant='subtitle1' color='text.secondary'>
                Date: {dayjs().format('MMMM D, YYYY')}
              </Typography>
            </Grid>
            <Box display='flex'>
              <Grid item>
                <Tooltip title='Total Employees' placement='left'>
                  <Paper
                    elevation={2}
                    sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: theme.palette.primary.light }}
                  >
                    <PersonIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                    <Typography variant='h5' color='white'>
                      {totalEmployees}
                    </Typography>
                  </Paper>
                </Tooltip>
              </Grid>
              <IconButton onClick={() => handleLocationExpand(location)}>
                <ExpandMoreIcon
                  sx={{
                    transform: expandedLocations[location] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }}
                />
              </IconButton>
            </Box>
          </Grid>
        </Paper>

        <Collapse in={expandedLocations[location]}>
          {loading ? (
            <Loader />
          ) : (
            <Grid container spacing={1}>
              {Object.entries(attendanceCountsByLocation).map(([location, data]) => (
                <LocationCard location={location} data={data} handleStatusClick={handleStatusClick} />
              ))}
            </Grid>
          )}
        </Collapse>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>{dialogTitle} Employees</DialogTitle>
          <DialogContent>
            <ul className='divide-y divide-gray-200'>
              {Array.from(new Set(selectedEmployees.map(employee => employee.employee._id)))
                .map(id => selectedEmployees.find(employee => employee.employee._id === id))
                .map(employee => (
                  <li key={employee.employee._id} className='flex items-center py-4 px-2 hover:bg-gray-50'>
                    <div className='h-10 w-10 rounded-full overflow-hidden bg-gray-200'>
                      <img
                        src={employee.employee.image || '/api/placeholder/40/40'}
                        alt={employee.employee.first_name}
                        className='h-full w-full object-cover'
                      />
                    </div>

                    <div className='ml-4 flex-1'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <span className='font-medium text-gray-900'>
                            {employee.employee.first_name} {employee.employee.last_name}
                          </span>
                          <span className='ml-2 text-sm text-gray-500'>{employee.employee.code}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default EmployeeAttendanceStatus
