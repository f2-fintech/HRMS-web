import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import WorkIcon from '@mui/icons-material/Work'
import SchoolIcon from '@mui/icons-material/School'
import HandshakeIcon from '@mui/icons-material/Handshake'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Loader from '@/components/loader/loader'
import LocationCard from './LocationCard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LocationItem {
  _id: string
  Present: number
  Absent: number
  On_Leave: number
  On_Half: number
  On_Field: number
  On_Wfh: number
  totalEmployeesToday: number
}

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
`

// ─── Styled Components ────────────────────────────────────────────────────────

const DashboardWrapper = styled(Box)({
  fontFamily: `'DM Sans', 'Segoe UI', sans-serif`,
  padding: '24px',
})

const HeaderCard = styled(Paper)({
  borderRadius: '20px',
  padding: '28px 32px',
  marginBottom: '20px',
  background: '#ffffff',
  border: '1px solid #e8eaf0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  animation: `${fadeUp} 0.4s ease both`,
})

const TotalBadge = styled(Box)({
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  borderRadius: '16px',
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  minWidth: '200px',
})

const CategoryChip = styled(Paper)<{ chipcolor: string }>(({ chipcolor }) => ({
  borderRadius: '16px',
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  background: chipcolor,
  cursor: 'pointer',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
  },
}))

const IconCircle = styled(Box)({
  width: 42,
  height: 42,
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

const StatusCard = styled(Paper)<{ cardcolor: string; delay?: number }>(({ cardcolor, delay = 0 }) => ({
  borderRadius: '18px',
  padding: '20px 22px',
  background: cardcolor,
  cursor: 'pointer',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  animation: `${fadeUp} 0.4s ease ${delay}ms both`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
}))

const StatusNumber = styled(Typography)({
  fontSize: '2.2rem',
  fontWeight: 700,
  color: 'white',
  lineHeight: 1.1,
  letterSpacing: '-0.5px',
})

const ExpandButton = styled(IconButton)<{ expanded: boolean }>(({ expanded }) => ({
  background: '#f1f3f9',
  borderRadius: '10px',
  padding: '8px',
  transition: 'background 0.2s ease',
  '& .MuiSvgIcon-root': {
    transition: 'transform 0.3s ease',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  },
  '&:hover': {
    background: '#e2e6f3',
  },
}))

const EmployeeRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '10px 0',
  borderBottom: '1px solid #f1f3f9',
  '&:last-child': {
    borderBottom: 'none',
  },
})

const Avatar = styled(Box)<{ bgcolor: string }>(({ bgcolor }) => ({
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: bgcolor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '15px',
  fontWeight: 600,
  color: 'white',
  flexShrink: 0,
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}))

const avatarColors = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

const getInitials = (first: string, last: string) =>
  `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()

const getAvatarColor = (name: string) =>
  avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length]

// ─── Component ───────────────────────────────────────────────────────────────

const EmployeeAttendanceStatus: React.FC = () => {

  const [employeeCounts, setEmployeeCounts] = useState<any>({
    totalEmployees: 0,
    totalInterns: 0,
    totalChannelPartners: 0,
    employeeList: [],
    internList: [],
    channelPartnerList: [],
  })

  const [attendanceCountsByLocation, setAttendanceCountsByLocation] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [dialogLoading, setDialogLoading] = useState<boolean>(false)
  const [dialogTitle, setDialogTitle] = useState<string>('')
  const [accClicked, setAccClicked] = useState<boolean>(false)

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

  const handleOpenList = (title: string, list: any[]) => {
    setDialogTitle(title)
    setSelectedEmployees(Array.isArray(list) ? list : [])
    setDialogOpen(true)
  }

  const handleStatusClickGlobal = async (status: string, label: string) => {
    try {
      setDialogTitle(label)
      setDialogLoading(true)
      setDialogOpen(true)
      setSelectedEmployees([])
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/attendence/byStatusOnly?status=${encodeURIComponent(status)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await response.json()
      setSelectedEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
    } finally {
      setDialogLoading(false)
    }
  }

  const handleNotMarkedClick = async () => {
    try {
      setDialogTitle("Not Marked Employees")
      setDialogLoading(true)
      setDialogOpen(true)
      setSelectedEmployees([])
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/attendence/not-marked-today`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            "Content-Type": "application/json",
          },
        }
      )
      const data = await response.json()
      setSelectedEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
    } finally {
      setDialogLoading(false)
    }
  }

  const handleStatusClick = async (status: string, location: string) => {
    try {
      setDialogTitle(`${status} — ${location}`)
      setDialogLoading(true)
      setDialogOpen(true)
      setSelectedEmployees([])
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/attendence/attendenceByStatus?status=${encodeURIComponent(status)}&location=${encodeURIComponent(location)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const employeesData = await response.json()
      setSelectedEmployees(Array.isArray(employeesData) ? employeesData : [])
    } catch (error) {
      console.error(error)
    } finally {
      setDialogLoading(false)
    }
  }

  useEffect(() => {
    const fetchEmployeeCategoryCounts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/employees/employee-category-count`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token} ${company_id}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const data = await response.json()
        setEmployeeCounts(data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchEmployeeCategoryCounts()
  }, [])

  useEffect(() => {
    const fetchAttendanceCounts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/attendence/location-counts`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token} ${company_id}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const data = await response.json()
        setAttendanceCountsByLocation(Array.isArray(data) ? data : [])
        setLoading(false)
      } catch (error) {
        console.error(error)
        setLoading(false)
      }
    }
    fetchAttendanceCounts()
  }, [])

  // ─── Totals ────────────────────────────────────────────────────────────────

  let totalPresent = 0
  let totalAbsent = 0
  let totalLeave = 0
  let totalHalfDay = 0
  let totalWorkforce = 0

  for (const item of attendanceCountsByLocation) {
    totalPresent   += Number(item?.Present   || 0)
    totalAbsent    += Number(item?.Absent    || 0)
    totalLeave     += Number(item?.On_Leave  || 0)
    totalHalfDay   += Number(item?.On_Half   || 0)
    totalWorkforce += Number(item?.totalEmployeesToday || 0)
  }

  const totalAll =
    Number(employeeCounts.totalEmployees || 0) +
    Number(employeeCounts.totalInterns || 0) +
    Number(employeeCounts.totalChannelPartners || 0)

  const totalMarked = totalPresent + totalAbsent + totalLeave + totalHalfDay
  const totalNotMarked = Math.max(0, totalAll - totalMarked)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardWrapper>

      {/* ── Header Card ── */}
      <HeaderCard elevation={0}>

        {/* Top row: title + total + toggle */}
        <Box display='flex' alignItems='flex-start' justifyContent='space-between' flexWrap='wrap' gap={2} mb={3}>
          <Box>
            <Typography
              variant='h5'
              fontWeight={700}
              color='#0f172a'
              letterSpacing='-0.4px'
              gutterBottom
            >
              Attendance Dashboard
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {dayjs().format('dddd, MMMM D, YYYY')}
            </Typography>
          </Box>

          <Box display='flex' alignItems='center' gap={1.5}>
            <TotalBadge>
              <IconCircle>
                <PeopleAltIcon sx={{ fontSize: 22, color: 'white' }} />
              </IconCircle>
              <Box>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.65)', display: 'block' }}>
                  Total employees
                </Typography>
                <Typography variant='h6' fontWeight={700} color='white' lineHeight={1}>
                  {totalAll}
                </Typography>
              </Box>
            </TotalBadge>

            <ExpandButton
              expanded={accClicked}
              onClick={() => setAccClicked(!accClicked)}
              size='small'
              aria-label='Toggle location cards'
            >
              <ExpandMoreIcon sx={{ color: '#475569' }} />
            </ExpandButton>
          </Box>
        </Box>

        {/* Category cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <CategoryChip
              elevation={0}
              chipcolor='#10b981'
              onClick={() => handleOpenList('Employees', employeeCounts.employeeList)}
            >
              <IconCircle><WorkIcon sx={{ fontSize: 22, color: 'white' }} /></IconCircle>
              <Box>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.75)', display: 'block' }}>
                  Employees
                </Typography>
                <Typography variant='h6' fontWeight={700} color='white' lineHeight={1}>
                  {Number(employeeCounts.totalEmployees || 0)}
                </Typography>
              </Box>
            </CategoryChip>
          </Grid>

          <Grid item xs={12} sm={4}>
            <CategoryChip
              elevation={0}
              chipcolor='#f59e0b'
              onClick={() => handleOpenList('Interns', employeeCounts.internList)}
            >
              <IconCircle><SchoolIcon sx={{ fontSize: 22, color: 'white' }} /></IconCircle>
              <Box>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.75)', display: 'block' }}>
                  Interns
                </Typography>
                <Typography variant='h6' fontWeight={700} color='white' lineHeight={1}>
                  {Number(employeeCounts.totalInterns || 0)}
                </Typography>
              </Box>
            </CategoryChip>
          </Grid>

          <Grid item xs={12} sm={4}>
            <CategoryChip
              elevation={0}
              chipcolor='#6366f1'
              onClick={() => handleOpenList('Channel Partners', employeeCounts.channelPartnerList)}
            >
              <IconCircle><HandshakeIcon sx={{ fontSize: 22, color: 'white' }} /></IconCircle>
              <Box>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.75)', display: 'block' }}>
                  Channel partners
                </Typography>
                <Typography variant='h6' fontWeight={700} color='white' lineHeight={1}>
                  {Number(employeeCounts.totalChannelPartners || 0)}
                </Typography>
              </Box>
            </CategoryChip>
          </Grid>
        </Grid>

        {/* Attendance status cards */}
        <Grid container spacing={2}>
          {[
            { label: 'Present',  value: `${totalPresent}/${totalAll}`, color: '#22c55e', status: 'Present',  title: 'Present Employees',  delay: 0   },
            { label: 'Absent',   value: `${totalAbsent}/${totalAll}`,  color: '#ef4444', status: 'Absent',   title: 'Absent Employees',   delay: 60  },
            { label: 'On leave', value: `${totalLeave}/${totalAll}`,   color: '#f59e0b', status: 'On Leave', title: 'On Leave Employees', delay: 120 },
            { label: 'Half day', value: `${totalHalfDay}/${totalAll}`, color: '#3b82f6', status: 'On Half',  title: 'Half Day Employees', delay: 180 },
            { label: 'Not marked', value: `${totalNotMarked}/${totalAll}`, color: '#94a3b8', status: 'Not Marked', title: 'Not Marked Employees', delay: 240 },
          ].map((s) => (
            <Grid item xs={6} sm={2.4} key={s.label}>
              <StatusCard
                elevation={0}
                cardcolor={s.color}
                delay={s.delay}
                onClick={() => s.status === 'Not Marked' ? handleNotMarkedClick() : handleStatusClickGlobal(s.status, s.title)}
              >
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.78)', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase', fontSize: '11px' }}>
                  {s.label}
                </Typography>
                <StatusNumber>{s.value}</StatusNumber>
                <Typography variant='caption' sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', mt: 0.5, display: 'block' }}>
                  Tap to view list
                </Typography>
              </StatusCard>
            </Grid>
          ))}
        </Grid>

      </HeaderCard>

      {/* ── Location Cards ── */}
      <Collapse in={accClicked}>
        {loading ? (
          <Box display='flex' justifyContent='center' py={4}>
            <Loader />
          </Box>
        ) : (
          <>
            <Box display='flex' alignItems='center' gap={1} mb={1.5} px={0.5}>
              <LocationOnIcon sx={{ fontSize: 18, color: '#6366f1' }} />
              <Typography variant='body2' fontWeight={600} color='#475569'>
                By location
              </Typography>
            </Box>
            <Grid container spacing={1.5}>
              {attendanceCountsByLocation.map((item) => (
                <LocationCard
                  key={item._id}
                  location={item._id}
                  data={item}
                  handleStatusClick={handleStatusClick}
                />
              ))}
            </Grid>
          </>
        )}
      </Collapse>

      {/* ── Employee List Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            border: '1px solid #e8eaf0',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            pt: 2.5,
            px: 3,
            fontWeight: 700,
            fontSize: '1rem',
            color: '#0f172a',
          }}
        >
          {dialogTitle}
          <IconButton
            size='small'
            onClick={() => setDialogOpen(false)}
            sx={{ background: '#f1f3f9', borderRadius: '8px', '&:hover': { background: '#e2e6f3' } }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 3 }}>

          {dialogLoading && (
            <Box display='flex' justifyContent='center' alignItems='center' py={4} gap={2}>
              <CircularProgress size={20} sx={{ color: '#6366f1' }} />
              <Typography variant='body2' color='text.secondary'>Loading...</Typography>
            </Box>
          )}

          {!dialogLoading && selectedEmployees.length === 0 && (
            <Box textAlign='center' py={4}>
              <PeopleAltIcon sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
              <Typography color='text.secondary' variant='body2'>
                No employees found.
              </Typography>
            </Box>
          )}

          {!dialogLoading &&
            selectedEmployees.map((item: any, index: number) => {
              const employee = item?.employee || item
              if (!employee || typeof employee !== 'object' || Array.isArray(employee)) return null

              const name = `${employee?.first_name || ''} ${employee?.last_name || ''}`
              const initials = getInitials(employee?.first_name || '', employee?.last_name || '')
              const bgColor = getAvatarColor(employee?.first_name || '')

              return (
                <EmployeeRow key={employee?._id || index}>
                  <Avatar bgcolor={bgColor}>
                    {employee?.image ? (
                      <img src={employee.image} alt={name} />
                    ) : (
                      initials
                    )}
                  </Avatar>
                  <Box>
                    <Typography fontSize='14px' fontWeight={600} color='#0f172a' lineHeight={1.3}>
                      {name.trim() || '—'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {employee?.designation || employee?.code || ''}
                    </Typography>
                  </Box>
                </EmployeeRow>
              )
            })}

        </DialogContent>
      </Dialog>

    </DashboardWrapper>
  )
}

export default EmployeeAttendanceStatus
