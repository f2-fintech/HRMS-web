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
  comp_off_accrual?: number
  comp_off_lapsed?: number
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
  comp_off_monthly?: number
  total_used_approved?: number
  total_used_pending?: number
  total_used_rejected?: number
  total_used?: number
  total_extra?: number
  total_comp_off_lapsed?: number
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

type ApprovalColor = 'success' | 'warning' | 'error'

const APPROVAL_BG: Record<ApprovalColor, string> = {
  success: 'rgba(46,125,50,0.10)',
  warning: 'rgba(237,108,2,0.10)',
  error: 'rgba(211,47,47,0.10)'
}

const APPROVAL_BORDER: Record<ApprovalColor, string> = {
  success: 'rgba(46,125,50,0.3)',
  warning: 'rgba(237,108,2,0.3)',
  error: 'rgba(211,47,47,0.3)'
}

const ApprovalBadge = ({
  label,
  desc,
  color
}: {
  label: string
  desc: string
  color: ApprovalColor
}) => (
  <Box
    sx={{
      mt: 1,
      px: 1.2,
      py: 0.6,
      borderRadius: 2,
      bgcolor: APPROVAL_BG[color],
      border: `1px solid ${APPROVAL_BORDER[color]}`
    }}
  >
    <Typography fontSize={12} fontWeight={800} sx={{ color: `${color}.main` }}>
      {label}
    </Typography>
    <Typography fontSize={11} color='text.secondary'>
      {desc}
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

  const leaveDaysNum = useMemo(() => {
    const n = Number(formData.day ?? 0)
    return Number.isFinite(n) ? n : 0
  }, [formData.day])

  const applyMonth = useMemo(() => {
    if (!formData.start_date) return null
    const d = new Date(formData.start_date)
    if (isNaN(d.getTime())) return null
    return d.getMonth() + 1
  }, [formData.start_date])

  const applyMonthRow = useMemo(() => {
    if (!balance?.months?.length || !applyMonth) return null
    return balance.months.find(m => Number(m.month) === Number(applyMonth)) || null
  }, [balance, applyMonth])

  const monthUsedNow = useMemo(() => {
    if (!applyMonthRow) return 0
    if (applyMonthRow.used_total != null) return Number(applyMonthRow.used_total)

    const ap = Number(applyMonthRow.used_approved ?? 0)
    const pe = Number(applyMonthRow.used_pending ?? 0)
    const re = Number(applyMonthRow.used_rejected ?? 0)

    if (ap + pe + re > 0) return ap + pe + re
    return Number(applyMonthRow.used ?? 0)
  }, [applyMonthRow])


  const approvalInfo = useMemo(() => {
    if (!leaveDaysNum || leaveDaysNum <= 0) return null

    const projectedTotal = Math.round((monthUsedNow + leaveDaysNum) * 10) / 10

    if (projectedTotal <= 1.5) {
      return {
        label: 'Auto-Approved',
        desc: `This leave will be automatically approved upon submission. (Monthly total: ${projectedTotal} days, up to 1.5 days)`,
        color: 'success' as ApprovalColor
      }
    } else if (projectedTotal > 1.5 && projectedTotal <= 3) {
      return {
        label: 'Needs HR/Admin Approval',
        desc: `This leave requires HR/Admin approval before it is confirmed. (Monthly total: ${projectedTotal} days)`,
        color: 'warning' as ApprovalColor
      }
    } else {
      return {
        label: 'Needs Director Approval',
        desc: `The monthly total has exceeded 3 days (${projectedTotal} days). This leave requires Director approval.`,
        color: 'error' as ApprovalColor
      }
    }
  }, [monthUsedNow, leaveDaysNum])

  const projected = useMemo(() => {
    if (!applyMonthRow) return null

    const opening = Number(applyMonthRow.opening ?? 0)
    const regular = Number(applyMonthRow.accrued ?? balance?.monthly_accrual ?? 1.5)
    const compOff = Number(applyMonthRow.comp_off_accrual ?? balance?.comp_off_monthly ?? 0.5)

    const regularAvailable = opening + regular
    const compOffAvailable = compOff // 0.5, no carry

    const usedAfter = monthUsedNow + leaveDaysNum

    // comp off pehle consume hoga, baaki regular se
    const fromCompOff = Math.min(usedAfter, compOffAvailable)
    const compOffLapsed = Math.max(0, compOffAvailable - fromCompOff)
    const fromRegular = Math.max(0, usedAfter - fromCompOff)

    const extraAfter = Math.max(0, fromRegular - regularAvailable)
    const closingAfter = regularAvailable - Math.min(fromRegular, regularAvailable)

    return {
      month: applyMonthRow.month,
      credit: regular,
      compOff,
      compOffLapsed,
      available: regularAvailable + compOffAvailable, // 1.5 + 0.5 = 2
      usedNow: monthUsedNow,
      usedAfter,
      closingAfter,
      extraAfter
    }
  }, [applyMonthRow, balance, monthUsedNow, leaveDaysNum])

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
          const isSuccess = data.message.includes('success')

          let toastMsg = data.message
          if (isSuccess && !leave && data.data?.status === 'Approved') {
            toastMsg = 'Leave submitted and Auto-Approved ✅'
          } else if (isSuccess && !leave && data.data?.status === 'Pending') {
            toastMsg = 'Leave submitted — Pending Approval ⏳'
          }

          toast[isSuccess ? 'success' : 'error'](toastMsg, { position: 'top-center' })
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

  const filteredEmployees = useMemo(() => {
    if (Number(userRole) === 1) return employees || []
    return (employees || []).filter((emp: any) => String(emp._id) === String(userId))
  }, [userRole, employees, userId])

  return (
    <Container maxWidth='md'>
      <Paper elevation={3} sx={{ padding: 3, borderRadius: 2, backgroundColor: '#f5f5f5' }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={3} gap={2}>
          {/* LEFT: Heading */}
          <Typography
            variant='h4'
            color='primary'
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LeaveTypeIcon />
            {leave ? 'Edit Leave' : 'Add Leave'}
          </Typography>

          {/* RIGHT: Balance + Half Day + Close */}
          <Box display='flex' alignItems='center' gap={2}>
            {balanceLoading ? (
              <Typography fontSize={12} color='text.secondary'>
                Loading leave balance...
              </Typography>
            ) : balanceErr ? (
              <Typography fontSize={12} color='error'>
                {balanceErr}
              </Typography>
            ) : balance ? (
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                <Typography fontSize={12} color='text.secondary'>
                  {currentMonthName} Allowed Leaves:
                  <b style={{ marginLeft: 2 }}>
                    {fmt((balance.monthly_accrual ?? 1.5) + (balance.comp_off_monthly ?? 0.5))}
                  </b>
                  <span style={{ marginLeft: 6, color: '#888' }}>
                    ({fmt(balance.monthly_accrual)} regular + {fmt(balance.comp_off_monthly ?? 0.5)} comp off)
                  </span>
                </Typography>
              </Box>
            ) : null}

            <Tooltip title='Click here to apply for half-day leave' arrow>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isHalfDay}
                    onChange={handleHalfDayChange}
                    name='halfDay'
                    color='primary'
                    icon={<HalfDayIcon />}
                    checkedIcon={<HalfDayIcon color='primary' />}
                  />
                }
                label='Half-day'
              />
            </Tooltip>

            <IconButton onClick={handleClose} color='error'>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

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

          {/* Leave Summary Preview */}
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
                  <MiniStat label='Monthly Allowed Leaves (MAL)' value={fmt(projected.credit)} />
                  <MiniStat label='Comp Off (same month)' value={fmt(projected.compOff)} />
                  <MiniStat label='Total Accumulated Leaves (TAL)' value={fmt(projected.available)} />
                  <MiniStat label='Total Leaves Taken (TLT)' value={fmt(projected.usedNow)} />
                  <MiniStat label='New Leave (NL)' value={fmt(leaveDaysNum)} />
                </Box>

                {/* Comp off lapse warning */}
                {projected.compOffLapsed > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      px: 1.2,
                      py: 0.6,
                      borderRadius: 2,
                      bgcolor: 'rgba(237,108,2,0.10)',
                      border: '1px solid rgba(237,108,2,0.30)'
                    }}
                  >
                    <Typography fontSize={12} fontWeight={700} sx={{ color: 'warning.main' }}>
                      ⚠ {fmt(projected.compOffLapsed)} comp off lapse hoga this month (use same month only)
                    </Typography>
                  </Box>
                )}

                {approvalInfo && (
                  <ApprovalBadge label={approvalInfo.label} desc={approvalInfo.desc} color={approvalInfo.color} />
                )}

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
                      Balance Accumulated Leaves (BAL)
                    </Typography>
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
                <MenuItem value='Sick'>SICK LEAVE</MenuItem>
                <MenuItem value='Compensatory'>Compensatory LEAVE</MenuItem>

                <MenuItem value='Casual'>CASUAL LEAVE</MenuItem>
                <MenuItem value='Privilege'>PRIVILEGE/EARNED LEAVE</MenuItem>
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
