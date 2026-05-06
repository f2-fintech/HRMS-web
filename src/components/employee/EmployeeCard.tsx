import React, { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Chip,
  styled,
  Tooltip
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PermIdentityIcon from '@mui/icons-material/PermIdentity'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import EmailIcon from '@mui/icons-material/Email'
import RestoreIcon from '@mui/icons-material/Restore';

import Loader from '../loader/loader'
import { useSettings } from '@core/hooks/useSettings'
import 'react-toastify/dist/ReactToastify.css'

const StyledCard = styled(Card)(({ theme, mode }) => ({
  height: '100%',
  borderRadius: '16px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  background: mode === 'dark' ? '#444' : '#fff',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px 0 rgba(0,0,0,0.16)',
    cursor: 'pointer'
  }
}))

const StyledAvatar = styled(Avatar)(({ theme, mode }) => ({
  width: 100,
  height: 100,
  margin: '0 auto',
  border: `4px solid ${mode === 'dark' ? theme.palette.background.paper : theme.palette.background.default}`,
  boxShadow: '0 2px 10px 0 rgba(0,0,0,0.12)'
}))

const StyledChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  textTransform: 'uppercase',
  margin: theme.spacing(2, 0)
}))

const EmailContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  wordBreak: 'break-all'
}))

const EmailTypography = styled(Typography)(({ theme, mode }) => ({
  fontSize: '0.875rem',
  textAlign: 'center',
  color: mode === 'dark' ? theme.palette.text.primary : theme.palette.text.secondary,
  backgroundColor: mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
  padding: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius,
  wordBreak: 'break-all',
  '&:hover': {
    color: theme.palette.primary.main
  }
}))

const EmployeeCard = ({ employee, id, status, handleEditEmployeeClick, handleDelete, capitalizeWords, deletedEmployee }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { settings } = useSettings()

  // 1. Get Designation (Checks nested object first for new data, falls back to old string)
  const designationDisplay = employee.designation_id?.title || employee.designation || 'N/A';

  const handleMenuOpen = event => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  useEffect(() => {
    if (userRole === '') {
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      setUserRole(user.role)
    }
  }, [userRole])

  const getEmployeeStatusColor = status => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'inactive':
        return 'error'
      default:
        return 'success'
    }
  }

  const getAttendanceDotColor = status => {

    switch (status) {

      case 'PRESENT':
        return '#22c55e'

      case 'LEAVE':
        return '#ef4444'

      case 'HALF_DAY':
        return '#facc15'

      default:
        return '#d1d5db'
    }
  }
  const getAttendanceTooltip = (status: string) => {

    switch (status) {

      case 'PRESENT':
        return 'Active'

      case 'LEAVE':
        return 'On Leave'

      case 'HALF_DAY':
        return 'Half Day'

      default:
        return 'No Information'
    }
  }
  const handleCardClick = () => {
    setLoading(true)
    setTimeout(() => {
      router.push(`/profile/${deletedEmployee ? employee._id : id}`)
    }, 500)
  }

  const handleEmailClick = e => {
    e.stopPropagation()
    window.location.href = `mailto:${employee.email}`
  }

  return (
    <StyledCard
      mode={settings.mode}
      sx={{ position: 'relative' }}
    >
      {loading ? (
        <Box display='flex' justifyContent='center' alignItems='center' height='100%'>
          <Loader />
        </Box>
      ) : (
        <CardContent>
          <Box display='flex' justifyContent='flex-end'>
            <IconButton style={{ color: settings.mode === 'dark' ? 'white' : 'blue' }} aria-label='settings' onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              {userRole === '1' && (
                <>
                  {!deletedEmployee &&
                    <MenuItem
                      onClick={e => {
                        e.stopPropagation()
                        handleMenuClose()
                        handleEditEmployeeClick(deletedEmployee ? employee._id : id)
                      }}
                    >
                      <EditIcon fontSize='small' style={{ marginRight: 8 }} />
                      Edit
                    </MenuItem>
                  }
                  <MenuItem
                    onClick={e => {
                      e.stopPropagation()
                      handleMenuClose()
                      handleDelete(id)
                    }}
                  >
                    {deletedEmployee ? <RestoreIcon fontSize='small' style={{ marginRight: 8 }} /> : <DeleteIcon fontSize='small' style={{ marginRight: 8 }} />}
                    {deletedEmployee ? "Restore" : "Delete"}
                  </MenuItem>
                </>
              )}
              {!deletedEmployee &&
                <MenuItem
                  onClick={e => {
                    e.stopPropagation()
                    handleMenuClose()
                    handleCardClick()
                  }}
                >
                  <PermIdentityIcon fontSize='small' style={{ marginRight: 8 }} />
                  Profile
                </MenuItem>
              }
            </Menu>
          </Box>
          {/* <Box
            sx={{
              position: 'absolute',
              top: 15,
              left: 15,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: getAttendanceDotColor(status),
              border: '2px solid white',
              zIndex: 10
            }}
          /> */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <Tooltip
              title={getAttendanceTooltip(status)}
              arrow
            >
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 4,
                  right: '28%',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: getAttendanceDotColor(status),
                  border: '2px solid white',
                  zIndex: 9999,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                }}
              />
            </Tooltip>

            <Tooltip title="View Profile" arrow>
              <StyledAvatar
                alt={employee.first_name}
                src={employee?.image}
                mode={settings.mode}
                onClick={() => handleCardClick()}
              />
            </Tooltip>
          </Box>
          {/* <Tooltip title="View Profile" arrow>
            <StyledAvatar alt={employee.first_name} src={employee?.image} mode={settings.mode} onClick={() => handleCardClick()} />
          </Tooltip> */}

          <Typography
            variant='h5'
            component='div'
            align='center'
            sx={{ mt: 2, fontWeight: 'bold', color: settings.mode === 'dark' ? 'white' : 'black' }}
          >
            {capitalizeWords(employee.first_name)} {capitalizeWords(employee.last_name)}
          </Typography>

          {/* DESIGNATION DISPLAY - Cleaned up to show only title */}
          <Typography
            variant='subtitle1'
            color={settings.mode === 'dark' ? 'white' : 'black'}
            align='center'
            sx={{ mt: 1, fontWeight: 500 }}
          >
            {designationDisplay}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <StyledChip label={employee.status} color={getEmployeeStatusColor(employee.status)} size='small' />
          </Box>

          <EmailContainer>
            <Tooltip title='Click to send email' arrow>
              <EmailTypography mode={settings.mode} onClick={handleEmailClick}>
                <EmailIcon fontSize='small' sx={{ mr: 1, verticalAlign: 'middle' }} />
                {employee.email}
              </EmailTypography>
            </Tooltip>
          </EmailContainer>

          <Typography
            variant='subtitle1'
            color={settings.mode === 'dark' ? 'white' : 'black'}
            align='center'
            sx={{ mt: 2, opacity: 0.8 }}
          >
            {employee.code}
          </Typography>
        </CardContent>
      )}
    </StyledCard>
  )
}

export default EmployeeCard
