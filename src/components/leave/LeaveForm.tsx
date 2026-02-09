import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Container,
  Tooltip
} from '@mui/material'
import {
  Close as CloseIcon,
  EventNote as CalendarIcon,
  Person as EmployeeIcon,
  AssignmentTurnedIn as LeaveTypeIcon,
  CheckCircle as SubmitIcon,
  EmojiObjects as ReasonIcon
} from '@mui/icons-material'
import { AccessTime as HalfDayIcon, AccessTime } from '@mui/icons-material'

import { toast } from 'react-toastify'
import { useDispatch } from 'react-redux'
import { fetchLeaves } from '../../redux/features/leaves/leavesSlice'

type MonthRow = {
  month: number
  opening: number
  accrued: number
  used_approved?: number
  used_pending?: number
  used_rejected?: number
  used_total?: number
  extra?: number
  used?: number
  closing: number
}

type BalanceResponse = {
  employee: string
  year: number
  yearly_quota: number
  monthly_accrual: number
  total_used_approved?: number
  total_used_pending?: number
  total_used_rejected?: number
  total_used?: number
  total_extra?: number
  closing_balance: number
  months: MonthRow[]
}

const fmt = (n: any) => {
  const x = Number(n ?? 0)
  if (!Number.isFinite(x)) return '0'
  return Number.isInteger(x) ? String(x) : x.toFixed(1)
}

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      px: 1.2,
      py: 0.8,
      borderRadius: 2,
      bgcolor: 'white',
      border: '1px solid rgba(0,0,0,0.06)',
      minWidth: 120
    }}
  >
    <Typography fontSize={11} color='text.secondary'>
      {label}
    </Typography>
    <Typography fontSize={13} fontWeight={900}>
      {value}
    </Typography>
  </Box>
)

const AddLeavesForm = ({
  handleClose,
  leave,
  leaves,
  userRole,
  userId,
  employees,
  page,
  limit,
  month,
  year,
  selectedKeyword
}: any) => {
  const dispatch = useDispatch()

  const userObj = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const company_id = userObj?.company_id

  const [formData, setFormData] = useState<any>({
    employee: '',
    start_date: '',
    end_date: '',
    status: 'Pending',
    application: '',
    reason: '',
    type: '',
    day: '',
    half_day_period: null,
    company_id: company_id
  })

  const [errors, setErrors] = useState<any>({
    employee: '',
    start_date: '',
    end_date: '',
    status: '',
    application: '',
    reason: '',
    type: '',
    day: '',
    half_day_period: ''
  })

  const [isHalfDay, setIsHalfDay] = useState(false)
  const [loading, setLoading] = useState(false)

  // ✅ Leave Balance state
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balance, setBalance] = useState<BalanceResponse | null>(null)
  const [balanceErr, setBalanceErr] = useState('')

  const isAdmin = Number(userRole) === 1
  const isEmployee = Number(userRole) === 3
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' })

  const effectiveEmployeeId = useMemo(() => {
    if (isEmployee) return userId
    return formData.employee || ''
  }, [isEmployee, userId, formData.employee])

  useEffect(() => {
    const run = async () => {
      setBalanceErr('')
      setBalance(null)
      if (!effectiveEmployeeId || !token || !company_id) return

      setBalanceLoading(true)
      try {
        const url = isAdmin
          ? `${process.env.NEXT_PUBLIC_APP_URL}/leaves/balance/${effectiveEmployeeId}?year=${year}&force=1`
          : `${process.env.NEXT_PUBLIC_APP_URL}/leaves/balance/${effectiveEmployeeId}?year=${year}`

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json'
          }
        })

        const contentType = res.headers.get('content-type') || ''
        const raw = contentType.includes('application/json') ? await res.json() : await res.text()

        if (!res.ok) {
          const msg = typeof raw === 'string' ? raw : raw?.message
          throw new Error(msg || 'Failed to fetch balance')
        }

        const json = typeof raw === 'string' ? JSON.parse(raw) : raw
        setBalance(json)
      } catch (e: any) {
        setBalanceErr(e?.message || 'Failed to load leave balance')
      } finally {
        setBalanceLoading(false)
      }
    }

    run()
  }, [effectiveEmployeeId, year, isAdmin])

  useEffect(() => {
    if (leave) {
      const foundLeave = leaves.find((employee: any) => employee.leaves.find((ass: any) => ass._id === leave))
      const selected = foundLeave?.leaves?.find((l: any) => l._id === leave)

      if (selected) {
        const calcDays = selected.day ? selected.day : calculateDaysDifference(selected.start_date, selected.end_date)

        setFormData({
          employee: selected.employee._id,
          start_date: selected.start_date,
          end_date: selected.end_date,
          status: selected.status,
          application: selected.application,
          reason: selected.reason || '',
          type: selected.type,
          day: String(calcDays),
          half_day_period: String(selected.day) === '0.5' ? selected.half_day_period : null,
          company_id: selected.company_id
        })

        if (String(selected.day) === '0.5') setIsHalfDay(true)
      }
    } else if (userRole) {
      setFormData((prev: any) => ({ ...prev, employee: userId }))
    }
  }, [leave, leaves, userRole, userId])

  const validateForm = () => {
    let isValid = true
    const newErrors: any = {}

    const requiredFields = ['employee', 'start_date', 'status', 'application', 'type', 'day']
    requiredFields.forEach(field => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        newErrors[field] = `${field.replace('_', ' ').toUpperCase()} is required`
        isValid = false
      }
    })

    if (isHalfDay && (!formData.half_day_period || String(formData.half_day_period).trim() === '')) {
      newErrors.half_day_period = 'Half-day period is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  function calculateDaysDifference(start: string, end: string) {
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const differenceInTime = endDate.getTime() - startDate.getTime()
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1
      return differenceInDays === 0 ? 1 : differenceInDays
    }
    return 0
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target

    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value }

      if (name === 'start_date' || name === 'end_date') {
        const days = calculateDaysDifference(updated.start_date, updated.end_date)
        updated.day = isHalfDay ? '0.5' : String(days || 0)
      }

      return updated
    })
  }

  const handleHalfDayChange = (e: any) => {
    const checked = e.target.checked
    setIsHalfDay(checked)

    if (checked) {
      setFormData((prev: any) => ({ ...prev, day: '0.5', half_day_period: '' }))
    } else {
      setFormData((prev: any) => {
        const days = calculateDaysDifference(prev.start_date, prev.end_date)
        return { ...prev, day: String(days || 0), half_day_period: null }
      })
    }
  }

  // ✅ leave days (0.5 allowed)
  const leaveDaysNum = useMemo(() => {
    const n = Number(formData.day ?? 0)
    return Number.isFinite(n) ? n : 0
  }, [formData.day])

  // ✅ which month user applying (from start_date)
  const applyMonth = useMemo(() => {
    if (!formData.start_date) return null
    const d = new Date(formData.start_date)
    if (isNaN(d.getTime())) return null
    return d.getMonth() + 1 // 1..12
  }, [formData.start_date])

  const applyMonthRow = useMemo(() => {
    if (!balance?.months?.length || !applyMonth) return null
    return balance.months.find(m => Number(m.month) === Number(applyMonth)) || null
  }, [balance, applyMonth])

  // ✅ correct month used calc (approved+pending+rejected fallback)
  const monthUsedNow = useMemo(() => {
    if (!applyMonthRow) return 0
    if (applyMonthRow.used_total != null) return Number(applyMonthRow.used_total)

    const ap = Number(applyMonthRow.used_approved ?? 0)
    const pe = Number(applyMonthRow.used_pending ?? 0)
    const re = Number(applyMonthRow.used_rejected ?? 0)

    if (ap + pe + re > 0) return ap + pe + re
    return Number(applyMonthRow.used ?? 0)
  }, [applyMonthRow])

  // ✅ projection (extra + closing)
  const projected = useMemo(() => {
    if (!applyMonthRow) return null

    const opening = Number(applyMonthRow.opening ?? 0)
    const credit = Number(applyMonthRow.accrued ?? balance?.monthly_accrual ?? 1.5)

    const available = opening + credit
    const usedAfter = monthUsedNow + leaveDaysNum

    const extraAfter = Math.max(0, usedAfter - available)
    const closingAfter = available - Math.min(usedAfter, available)

    return {
      month: applyMonthRow.month,
      credit,
      available,
      usedNow: monthUsedNow,
      usedAfter,
      closingAfter,
      extraAfter
    }
  }, [applyMonthRow, balance?.monthly_accrual, monthUsedNow, leaveDaysNum])

  const handleSubmit = () => {
    if (!validateForm()) return
    setLoading(true)

    const leaveData: any = { ...formData }
    if (!isHalfDay) delete leaveData.half_day_period

    const method = leave ? 'PUT' : 'POST'
    const url = leave
      ? `${process.env.NEXT_PUBLIC_APP_URL}/leaves/update/${leave}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/leaves/create`

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaveData)
    })
      .then(r => r.json())
      .then(data => {
        if (data.message) {
          toast[data.message.includes('success') ? 'success' : 'error'](data.message, { position: 'top-center' })
        } else {
          toast.error('Unexpected error occurred', { position: 'top-center' })
        }

        dispatch(
          fetchLeaves({
            page,
            limit,
            month: userRole === '1' ? month : '0',
            year,
            keyword: selectedKeyword
          }) as any
        )

          // ✅ refresh balance after submit
          ; (async () => {
            if (!effectiveEmployeeId || !token || !company_id) return
            try {
              const refreshUrl = isAdmin
                ? `${process.env.NEXT_PUBLIC_APP_URL}/leaves/balance/${effectiveEmployeeId}?year=${year}&force=1`
                : `${process.env.NEXT_PUBLIC_APP_URL}/leaves/balance/${effectiveEmployeeId}?year=${year}`

              const res = await fetch(refreshUrl, {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token} ${company_id}`,
                  'Content-Type': 'application/json'
                }
              })
              const json = await res.json()
              if (res.ok) setBalance(json)
            } catch { }
          })()

        handleClose()
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }

  // ✅ Admin sees all employees
  // ✅ Role 2 & 3 -> only self
  const filteredEmployees = useMemo(() => {
    if (Number(userRole) === 1) return employees || []
    return (employees || []).filter((emp: any) => String(emp._id) === String(userId))
  }, [userRole, employees, userId])

  return (
    <Container maxWidth='md'>
      <Paper elevation={3} sx={{ padding: 3, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
      <Box
  display="flex"
  justifyContent="space-between"
  alignItems="center"
  mb={3}
  gap={2}
>
  {/* LEFT: Heading */}
  <Typography
    variant="h4"
    color="primary"
    sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
  >
    <LeaveTypeIcon />
    {leave ? 'Edit Leave' : 'Add Leave'}
  </Typography>

  {/* RIGHT: Balance + Half Day + Close */}
  <Box display="flex" alignItems="center" gap={2}>
    {/* Leave Balance */}
    {balanceLoading ? (
      <Typography fontSize={12} color="text.secondary">
        Loading leave balance...
      </Typography>
    ) : balanceErr ? (
      <Typography fontSize={12} color="error">
        {balanceErr}
      </Typography>
    ) : balance ? (
      <Box
        sx={{
          px: 1.5,
          py: 0.6,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
         
        }}
      >
        <Typography fontSize={12} color="text.secondary">
          {currentMonthName} Allowed Leaves:
          <b style={{ marginLeft: 2 }}>{fmt(balance.monthly_accrual)}</b>
        </Typography>
      </Box>
    ) : null}

    <Tooltip title="Click here to apply for half-day leave" arrow>
      <FormControlLabel
        control={
          <Checkbox
            checked={isHalfDay}
            onChange={handleHalfDayChange}
            name="halfDay"
            color="primary"
            icon={<HalfDayIcon />}
            checkedIcon={<HalfDayIcon color="primary" />}
          />
        }
        label="Half-day"
      />
    </Tooltip>

    {/* Close */}
    <IconButton onClick={handleClose} color="error">
      <CloseIcon />
    </IconButton>
  </Box>
</Box>


        {/* ✅ Small balance info */}
   

        <Grid container spacing={3}>
          {Number(userRole) < 3 && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required variant='outlined'>
                <InputLabel required>Employee</InputLabel>
                <Select
                  label='Select Employee'
                  name='employee'
                  value={formData.employee}
                  onChange={handleChange}
                  required
                  error={!!errors.employee}
                  disabled={Number(userRole) !== 1}
                  startAdornment={<EmployeeIcon color='action' />}
                >
                  {filteredEmployees.map((employee: any) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.first_name} {employee.last_name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.employee && <FormHelperText error>{errors.employee}</FormHelperText>}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Start Date'
              name='start_date'
              value={formData.start_date}
              type='date'
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.start_date}
              helperText={errors.start_date}
              variant='outlined'
              InputProps={{ startAdornment: <CalendarIcon color='action' /> }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
          </Grid>

          {!isHalfDay && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='End Date'
                name='end_date'
                type='date'
                value={formData.end_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                variant='outlined'
                InputProps={{ startAdornment: <CalendarIcon color='action' /> }}
                inputProps={{ min: formData.start_date || new Date().toISOString().split('T')[0] }}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Day'
              name='day'
              value={formData.day}
              type='text'
              InputProps={{ readOnly: true, startAdornment: <AccessTime color='action' /> }}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.day}
              helperText={errors.day}
              variant='outlined'
            />
          </Grid>

          {/* ✅ CLEAN PREVIEW (extra included) */}
          {projected && leaveDaysNum > 0 && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 1.6,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(44,60,227,0.05)',
                  border: '1px solid rgba(44,60,227,0.18)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography fontWeight={900} fontSize={13}>
                    Leave Summary
                  </Typography>

                  <Box
                    sx={{
                      px: 1,
                      py: 0.3,
                      borderRadius: 999,
                      bgcolor: 'rgba(44,60,227,0.10)',
                      border: '1px solid rgba(44,60,227,0.20)'
                    }}
                  >
                    <Typography fontSize={11} fontWeight={800} color='primary'>
                      Preview
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 1.2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <MiniStat label='Monthly Allowed Leaves(MAL)' value={fmt(projected.credit)} />
                  <MiniStat label='Total Accumulated Leaves(TAL)
' value={fmt(projected.available)} />
                  <MiniStat label='Total Leaves Taken(TLT)' value={fmt(projected.usedNow)} />
                  <MiniStat label='New Leave(NL)' value={fmt(leaveDaysNum)} />
                  {/* <MiniStat label='Balance Accumulated Leaves(BAL)' value={fmt(projected.usedAfter)} /> */}
                </Box>

                <Box
                  sx={{
                    mt: 1.3,
                    p: 1.2,
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'rgba(0,0,0,0.035)',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}
                >
                  <Box>
                    <Typography fontSize={11} color='text.secondary'>
                     Balance Accumulated Leaves(BAL)          </Typography>
                    <Typography fontSize={15} fontWeight={900}>
                      {fmt(projected.closingAfter)}
                    </Typography>
                  </Box>

                  {projected.extraAfter > 0 ? (
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.6,
                        borderRadius: 999,
                        bgcolor: 'rgba(211,47,47,0.12)',
                        border: '1px solid rgba(211,47,47,0.30)'
                      }}
                    >
                      <Typography fontSize={12} fontWeight={900} sx={{ color: 'error.main' }}>
                        Extra Leave {fmt(projected.extraAfter)}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.6,
                        borderRadius: 999,
                        bgcolor: 'rgba(46,125,50,0.12)',
                        border: '1px solid rgba(46,125,50,0.30)'
                      }}
                    >
                      <Typography fontSize={12} fontWeight={900} sx={{ color: 'success.main' }}>
                        ✓ Within Balance
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          )}

          {isHalfDay && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.half_day_period} variant='outlined'>
                <InputLabel required>Half-day Period</InputLabel>
                <Select
                  label='Select Half-day Period'
                  name='half_day_period'
                  value={formData.half_day_period}
                  onChange={handleChange}
                  startAdornment={<HalfDayIcon color='action' />}
                >
                  <MenuItem value='First Half'>First Half</MenuItem>
                  <MenuItem value='Second Half'>Second Half</MenuItem>
                </Select>
                {errors.half_day_period && <Typography color='error'>{errors.half_day_period}</Typography>}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={!!errors.type} variant='outlined'>
              <InputLabel required>Type</InputLabel>
              <Select
                label='Select Type'
                name='type'
                value={formData.type}
                onChange={handleChange}
                startAdornment={<LeaveTypeIcon color='action' />}
              >
                {/* <MenuItem value='Annual'>ANNUAL</MenuItem> */}
                <MenuItem value='Sick'>SICK LEAVE</MenuItem>
                {/* <MenuItem value='Unpaid'>UNPAID</MenuItem> */}
                <MenuItem value='Casual'>CASUAL LEAVE</MenuItem>
                <MenuItem value='Privilege'>PRIVILEGE/EARNED LEAVE</MenuItem>

                {/* <MenuItem value='Complimentary'>COMPLIMENTARY</MenuItem> */}
                <MenuItem value='Maternity'>MATERNITY LEAVE</MenuItem>

                <MenuItem value='Others'>OTHERS</MenuItem>
              </Select>
              {errors.type && <Typography color='error'>{errors.type}</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.application}>
              <InputLabel shrink>Application</InputLabel>
              <Box
                component='textarea'
                name='application'
                value={formData.application}
                onChange={handleChange}
                rows={4}
                placeholder='Enter your application here'
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              {errors.application && <FormHelperText>{errors.application}</FormHelperText>}
            </FormControl>
          </Grid>

          {leave && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Reason for Approval/Rejection'
                name='reason'
                value={formData.reason}
                onChange={handleChange}
                required
                error={!!errors.reason}
                helperText={errors.reason}
                variant='outlined'
                InputProps={{ startAdornment: <ReasonIcon color='action' /> }}
              />
            </Grid>
          )}

          {leave && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.status} variant='outlined'>
                <InputLabel required>Status</InputLabel>
                <Select
                  label='Select Status'
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                  disabled={Number(userRole) !== 1}
                >
                  <MenuItem value='Pending'>Pending</MenuItem>
                  <MenuItem value='Approved'>Approved</MenuItem>
                  <MenuItem value='Rejected'>Rejected</MenuItem>
                </Select>
                {errors.status && <Typography color='error'>{errors.status}</Typography>}
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} display='flex' justifyContent='center'>
            <Button
              variant='contained'
              color='primary'
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={24} color='inherit' /> : <SubmitIcon />}
              sx={{ fontSize: '16px', fontWeight: 600, padding: '12px 24px', borderRadius: 2 }}
            >
              {loading ? 'Processing...' : leave ? 'UPDATE LEAVE' : 'ADD LEAVE'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default AddLeavesForm
