'use client'

import React, { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import GroupsIcon from '@mui/icons-material/Groups'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CelebrationIcon from '@mui/icons-material/Celebration'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DateRangeIcon from '@mui/icons-material/DateRange'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'

type EmployeeSummaryRow = {
  employeeId: string
  name: string
  code: string
  email?: string
  department?: string
  designation?: string
  location?: string
  month: number
  year: number

  // Month-specific fields
  lastSundayDate: string
  lastSundayStatus: string
  lastSundayWorkedFull: boolean
  compOffAccrual: number
  compOffLapsed: number
  compOffPayable?: number
  opening: number
  monthlyAccrual: number
  totalAllowedThisMonth: number
  usedApproved: number
  usedPending: number
  usedRejected: number
  usedTotal: number
  extra: number
  closing: number

  // Full Year fields
  yearlyQuota: number
  totalCompOffAccruedYear: number
  totalCompOffLapsedYear: number
  totalCompOffPayableYear?: number
  totalAllowedYear: number
  totalUsedYear: number
  totalExtraYear: number
  closingBalanceYear: number

  // Festival Leaves fields
  festivalTotalQuota: number
  festivalUsed: number
  festivalRemaining: number
  festivalMonthUsed: number

  months?: any[]
}

type SummaryMetrics = {
  totalEmployees: number
  workedSundayCount?: number
  workedFullSundayCount: number
  halfDayOrAbsentSundayCount: number
  highLeaveCount: number
  extraLeaveCount: number
  totalCompOffsEarned: number
  totalCompOffsPayable?: number
  totalFestivalUsedAll: number
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmt(n: any) {
  const x = Number(n ?? 0)
  if (!Number.isFinite(x)) return '0'
  return Number.isInteger(x) ? String(x) : x.toFixed(1)
}

export default function AllEmployeesLeaveSummaryButton({
  month,
  year,
}: {
  month?: number
  year?: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<EmployeeSummaryRow[]>([])
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null)
  const [lastSundayDate, setLastSundayDate] = useState<string>('')
  const [festivalQuota, setFestivalQuota] = useState<number>(6)
  const [declaredHolidays, setDeclaredHolidays] = useState<number>(12)
  const [error, setError] = useState('')

  // View Controls
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState<number>(() => Number(month ?? dayjs().month() + 1))
  const [selectedYear, setSelectedYear] = useState<number>(() => Number(year ?? dayjs().year()))
  const [rulesOpen, setRulesOpen] = useState(false)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'earned_compoff' | 'festival_used' | 'high_leave' | 'extra'>('all')

  const fetchSummary = async (mVal = selectedMonth, yVal = selectedYear, vVal = viewMode) => {
    setError('')
    setLoading(true)
    try {
      const user =
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('user') || '{}')
          : {}
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const company_id = user?.company_id

      if (!token || !company_id) {
        setError('Token or company ID missing. Please log in again.')
        return
      }

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/leaves/all-summary?month=${mVal}&year=${yVal}&view=${vVal}`

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const raw = await res.json().catch(async () => await res.text())

      if (!res.ok) {
        const msg = typeof raw === 'string' ? raw : raw?.message
        throw new Error(msg || 'Failed to fetch all employees summary')
      }

      const json = typeof raw === 'string' ? JSON.parse(raw) : raw
      setRows(json?.data || [])
      setMetrics(json?.summary || null)
      setLastSundayDate(json?.lastSundayDate || '')
      setFestivalQuota(Number(json?.festivalQuota || 6))
      setDeclaredHolidays(Number(json?.declaredHolidays || 12))
    } catch (e: any) {
      setError(e?.message || 'Something went wrong fetching summary')
    } finally {
      setLoading(false)
    }
  }

  const onOpen = async () => {
    setOpen(true)
    await fetchSummary(selectedMonth, selectedYear, viewMode)
  }

  // Handle View Mode switch
  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: 'month' | 'year' | null,
  ) => {
    if (newView) {
      setViewMode(newView)
      fetchSummary(selectedMonth, selectedYear, newView)
    }
  }

  // Handle Month switch
  const handleMonthChange = (newMonth: number) => {
    setSelectedMonth(newMonth)
    fetchSummary(newMonth, selectedYear, viewMode)
  }

  // Filtered rows based on search and active filter chip
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // 1. Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.code && r.code.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q))

      if (!matchesSearch) return false

      // 2. Chip category filter
      if (filterType === 'earned_compoff') {
        return viewMode === 'year' ? r.totalCompOffAccruedYear > 0 : r.compOffAccrual > 0
      }
      if (filterType === 'festival_used') return r.festivalUsed > 0
      if (filterType === 'high_leave') {
        return viewMode === 'year' ? r.totalUsedYear > 18 : r.usedTotal > 1.5
      }
      if (filterType === 'extra') {
        return viewMode === 'year' ? r.totalExtraYear > 0 : r.extra > 0
      }

      return true
    })
  }, [rows, searchQuery, filterType, viewMode])

  // CSV Export handler
  const exportToCSV = () => {
    if (!rows.length) return

    let headers: string[] = []
    let csvRows: any[][] = []

    if (viewMode === 'month') {
      headers = [
        '#',
        'Employee Name',
        'Employee Code',
        'Department',
        'Location',
        'Month/Year',
        'Last Sunday Date',
        'Last Sunday Status',
        'Worked Full Day (Sunday)',
        'Comp-Off Earned (Days)',
        'Comp-Off Payable/Encashment (Days)',
        'Regular Quota (Days)',
        'Total Allowed (Days)',
        'Leaves Taken (Days)',
        'Extra/LOP (Days)',
        'Closing Balance (Days)',
        'Festival Leave Quota',
        'Festival Leaves Used',
        'Festival Leaves Remaining',
      ]

      csvRows = rows.map((r, i) => [
        i + 1,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.code || ''}"`,
        `"${r.department || ''}"`,
        `"${r.location || ''}"`,
        `"${monthNames[selectedMonth - 1]} ${selectedYear}"`,
        `"${r.lastSundayDate}"`,
        `"${r.lastSundayStatus}"`,
        r.lastSundayWorkedFull ? 'YES' : 'NO',
        r.compOffAccrual,
        r.compOffPayable ?? 0,
        r.monthlyAccrual,
        r.totalAllowedThisMonth,
        r.usedTotal,
        r.extra,
        r.closing,
        r.festivalTotalQuota,
        r.festivalUsed,
        r.festivalRemaining,
      ])
    } else {
      headers = [
        '#',
        'Employee Name',
        'Employee Code',
        'Department',
        'Location',
        'Year',
        'Yearly Regular Quota (Days)',
        'Comp-Offs Earned in Year (Days)',
        'Comp-Off Payable/Encashment in Year (Days)',
        'Total Allowed in Year (Days)',
        'Total Leaves Taken in Year (Days)',
        'Total Extra/LOP in Year (Days)',
        'Year Closing Balance (Days)',
        'Festival Leave Quota',
        'Festival Leaves Used in Year',
        'Festival Leaves Remaining',
      ]

      csvRows = rows.map((r, i) => [
        i + 1,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.code || ''}"`,
        `"${r.department || ''}"`,
        `"${r.location || ''}"`,
        selectedYear,
        r.yearlyQuota,
        r.totalCompOffAccruedYear,
        r.totalCompOffPayableYear ?? 0,
        r.totalAllowedYear,
        r.totalUsedYear,
        r.totalExtraYear,
        r.closingBalanceYear,
        r.festivalTotalQuota,
        r.festivalUsed,
        r.festivalRemaining,
      ])
    }

    const csvContent = [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Leave_CompOff_Festival_Summary_${viewMode === 'year' ? `Year_${selectedYear}` : `${monthNames[selectedMonth - 1]}_${selectedYear}`}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={onOpen}
        startIcon={<GroupsIcon />}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
          },
        }}
      >
        All Employees Leave & Comp-Off
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xl"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '94vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            pt: 2.5,
            px: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupsIcon color="primary" /> All Employees Leave, Comp-Off & Festival Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              {viewMode === 'month' ? (
                <>
                  Month View: <b>{monthNames[selectedMonth - 1]} {selectedYear}</b> • Month's Last Sunday: <b>{lastSundayDate}</b>
                </>
              ) : (
                <>
                  Full Year View: <b>Entire Year {selectedYear} (12 Months Aggregate)</b>
                </>
              )}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
              sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
            >
              <ToggleButton value="month" sx={{ textTransform: 'none', fontWeight: 700, px: 1.8 }}>
                <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} /> Month View
              </ToggleButton>
              <ToggleButton value="year" sx={{ textTransform: 'none', fontWeight: 700, px: 1.8 }}>
                <DateRangeIcon fontSize="small" sx={{ mr: 0.5 }} /> Pure Year View
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Month Dropdown (visible in Month mode) */}
            {viewMode === 'month' && (
              <TextField
                select
                size="small"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                {monthNames.map((name, idx) => (
                  <MenuItem key={idx + 1} value={idx + 1}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={exportToCSV}
              disabled={loading || rows.length === 0}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Export CSV
            </Button>

            <Tooltip title="Rules Overview" arrow>
              <IconButton
                onClick={() => setRulesOpen(true)}
                size="small"
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(2, 136, 209, 0.3)',
                  bgcolor: 'rgba(2, 136, 209, 0.08)',
                  color: '#0288d1',
                  p: 0.8,
                  '&:hover': { bgcolor: 'rgba(2, 136, 209, 0.18)' },
                }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* KPI Summary Cards */}
          {metrics && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      TOTAL EMPLOYEES
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#1d4ed8', mt: 0.5 }}>
                      {metrics.totalEmployees}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active employees in company
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {viewMode === 'year' ? 'COMP-OFF EARNED / PAYABLE' : 'EARNED SUNDAY COMP-OFF'}
                      </Typography>
                      <CheckCircleOutlineIcon color="success" fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#047857', mt: 0.5 }}>
                      {viewMode === 'year'
                        ? `${metrics.totalCompOffsEarned} Days`
                        : `${metrics.workedFullSundayCount ?? 0} Emp (+0.5)`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {viewMode === 'year'
                        ? `Payable: ${metrics.totalCompOffsPayable ?? 0} Days (Encashment)`
                        : `Payable: ${metrics.totalCompOffsPayable ?? 0} Days | Worked full day on Sunday`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        FESTIVAL LEAVE QUOTA
                      </Typography>
                      <CelebrationIcon sx={{ color: '#db2777' }} fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#be185d', mt: 0.5 }}>
                      {festivalQuota} <span style={{ fontSize: '13px', fontWeight: 600 }}>Days / Year</span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allowed <b>{festivalQuota}</b> of <b>{declaredHolidays}</b> Holidays<b></b>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        EXCESS / LOP LEAVES
                      </Typography>
                      <WarningAmberIcon color="error" fontSize="small" />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#b91c1c', mt: 0.5 }}>
                      {metrics.extraLeaveCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {viewMode === 'year' ? 'Exceeded annual allowed balance' : 'Exceeded monthly quota'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Search Bar + Filter Chips */}
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search by name, code, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, minWidth: { xs: '100%', sm: 300 } },
              }}
            />

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip
                label={`All (${rows.length})`}
                color={filterType === 'all' ? 'primary' : 'default'}
                variant={filterType === 'all' ? 'filled' : 'outlined'}
                onClick={() => setFilterType('all')}
                clickable
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Earned Comp-Off (${viewMode === 'year' ? (metrics?.totalCompOffsEarned ?? 0) : (metrics?.workedFullSundayCount ?? 0)})`}
                color={filterType === 'earned_compoff' ? 'success' : 'default'}
                variant={filterType === 'earned_compoff' ? 'filled' : 'outlined'}
                onClick={() => setFilterType('earned_compoff')}
                clickable
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Used Festival Leave"
                color={filterType === 'festival_used' ? 'secondary' : 'default'}
                variant={filterType === 'festival_used' ? 'filled' : 'outlined'}
                onClick={() => setFilterType('festival_used')}
                clickable
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`High Leave (${metrics?.highLeaveCount ?? 0})`}
                color={filterType === 'high_leave' ? 'warning' : 'default'}
                variant={filterType === 'high_leave' ? 'filled' : 'outlined'}
                onClick={() => setFilterType('high_leave')}
                clickable
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`Excess / LOP (${metrics?.extraLeaveCount ?? 0})`}
                color={filterType === 'extra' ? 'error' : 'default'}
                variant={filterType === 'extra' ? 'filled' : 'outlined'}
                onClick={() => setFilterType('extra')}
                clickable
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ my: 2 }} />}

          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          {/* Detailed Data Table */}
          {!loading && !error && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 800, fontSize: 13, py: 1.2 } }}>
                    <TableCell width={40}>#</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Dept / Loc</TableCell>

                    {/* Mode specific columns */}
                    {viewMode === 'month' ? (
                      <>
                        <TableCell align="center">Last Sunday Status ({lastSundayDate})</TableCell>
                        <TableCell align="center">Comp-Off Earned</TableCell>
                        <TableCell align="center">Regular Quota</TableCell>
                        <TableCell align="center">Total Allowed</TableCell>
                        <TableCell align="center">Leaves Taken</TableCell>
                        <TableCell align="center">Excess / LOP</TableCell>
                        <TableCell align="center">Festival Leaves (Used / Rem)</TableCell>
                        <TableCell align="center">Closing Bal</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">Yearly Quota</TableCell>
                        <TableCell align="center">Comp-Offs Earned (Year)</TableCell>
                        <TableCell align="center">Total Allowed (Year)</TableCell>
                        <TableCell align="center">Leaves Taken (Year)</TableCell>
                        <TableCell align="center">Excess / LOP (Year)</TableCell>
                        <TableCell align="center">Festival Leaves (Quota / Used / Rem)</TableCell>
                        <TableCell align="center">Year Closing Bal</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={viewMode === 'month' ? 11 : 10} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary" fontWeight={600}>
                          No employees match the selected criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, idx) => {
                      const isEarnedMonth = row.compOffAccrual > 0
                      const isExtraMonth = row.extra > 0
                      const isExtraYear = row.totalExtraYear > 0
                      const sundayStatus = row.lastSundayStatus || 'Not Marked'

                      return (
                        <TableRow
                          key={row.employeeId}
                          hover
                          sx={{
                            bgcolor:
                              (viewMode === 'month' && isExtraMonth) || (viewMode === 'year' && isExtraYear)
                                ? 'rgba(239, 68, 68, 0.03)'
                                : 'inherit',
                          }}
                        >
                          <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>

                          {/* Employee Name & Code */}
                          <TableCell>
                            <Typography fontWeight={700} fontSize={13.5} color="text.primary">
                              {row.name}
                            </Typography>
                            {/* {row.code && (
                              <Typography variant="caption" color="text.secondary">
                                Code: {row.code}
                              </Typography>
                            )} */}
                          </TableCell>

                          {/* Department & Location */}
                          <TableCell>
                            <Typography fontSize={12.5} color="text.primary">
                              {row.department || '—'}
                            </Typography>
                            {row.location && (
                              <Typography variant="caption" color="text.secondary">
                                {row.location}
                              </Typography>
                            )}
                          </TableCell>

                          {/* MONTH VIEW COLUMNS */}
                          {viewMode === 'month' && (
                            <>
                              {/* Last Sunday Status */}
                              <TableCell align="center">
                                {row.lastSundayWorkedFull ? (
                                  <Chip
                                    label="🟢 Full Day"
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(16, 185, 129, 0.12)',
                                      color: '#065f46',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                    }}
                                  />
                                ) : row.lastSundayWorked ? (
                                  <Chip
                                    label="🟢 Half Day"
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                                      color: '#1d4ed8',
                                      border: '1px solid rgba(59, 130, 246, 0.25)',
                                    }}
                                  />
                                ) : sundayStatus.toLowerCase().includes('leave') || sundayStatus.toLowerCase().includes('half') ? (
                                  <Chip
                                    label="🏖️ On Leave"
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(239, 68, 68, 0.08)',
                                      color: '#b91c1c',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                    }}
                                  />
                                ) : sundayStatus.toLowerCase().includes('absent') ? (
                                  <Chip
                                    label="🔴 Absent"
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(239, 68, 68, 0.08)',
                                      color: '#b91c1c',
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="⚪ Off"
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(100, 116, 139, 0.08)',
                                      color: '#475569',
                                    }}
                                  />
                                )}
                              </TableCell>

                              {/* Comp-Off Accrued in Month */}
                              <TableCell align="center">
                                {isEarnedMonth ? (
                                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                    <Chip
                                      icon={<CheckCircleOutlineIcon style={{ fontSize: 16, color: '#047857' }} />}
                                      label="+0.5 Day"
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: 12,
                                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                                        color: '#047857',
                                        border: '1px solid #10b981',
                                      }}
                                    />
                                    {row.compOffPayable && row.compOffPayable > 0 ? (
                                      <Chip
                                        label="💰 Payable"
                                        size="small"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: 10.5,
                                          height: 20,
                                          bgcolor: 'rgba(234, 179, 8, 0.15)',
                                          color: '#854d0e',
                                          border: '1px solid rgba(234, 179, 8, 0.4)',
                                        }}
                                      />
                                    ) : (
                                      <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>
                                        Used in Leaves
                                      </Typography>
                                    )}
                                  </Box>
                                ) : row.lastSundayWorked ? (
                                  <Tooltip title="Worked scheduled half-day shift (half-day off already availed on Sunday itself, 0 extra comp-off)">
                                    <Chip
                                      label="— (Regular)"
                                      size="small"
                                      sx={{
                                        fontWeight: 600,
                                        fontSize: 11,
                                        bgcolor: 'rgba(0,0,0,0.04)',
                                        color: 'text.secondary',
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Typography color="text.secondary" fontWeight={600} fontSize={13}>
                                    0
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Monthly Regular Quota */}
                              <TableCell align="center">
                                <Typography fontWeight={600} fontSize={13}>
                                  {fmt(row.monthlyAccrual)}
                                </Typography>
                              </TableCell>

                              {/* Total Allowed */}
                              <TableCell align="center">
                                <Typography fontWeight={700} fontSize={13} color="primary.main">
                                  {fmt(row.totalAllowedThisMonth)}
                                </Typography>
                              </TableCell>

                              {/* Leaves Taken in Month */}
                              <TableCell align="center">
                                <Typography
                                  fontWeight={row.usedTotal > 1.5 ? 800 : 600}
                                  fontSize={13}
                                  color={row.usedTotal > 1.5 ? 'error.main' : 'text.primary'}
                                >
                                  {fmt(row.usedTotal)}
                                </Typography>
                              </TableCell>

                              {/* Excess / LOP */}
                              <TableCell align="center">
                                {isExtraMonth ? (
                                  <Chip
                                    label={`+${fmt(row.extra)} LOP`}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(239, 68, 68, 0.15)',
                                      color: '#b91c1c',
                                      border: '1px solid #ef4444',
                                    }}
                                  />
                                ) : (
                                  <Typography color="text.secondary" fontSize={13}>
                                    0
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Festival Leaves (Month View) */}
                              <TableCell align="center">
                                <Tooltip
                                  title={`Total Festival Quota: ${row.festivalTotalQuota} | Used so far: ${row.festivalUsed} | Remaining: ${row.festivalRemaining}`}
                                >
                                  <Box display="inline-flex" alignItems="center" gap={0.5}>
                                    <Chip
                                      label={`Fest: ${fmt(row.festivalUsed)} / ${fmt(row.festivalTotalQuota)}`}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: 11,
                                        bgcolor: row.festivalUsed > 0 ? 'rgba(236, 72, 153, 0.12)' : 'rgba(0,0,0,0.04)',
                                        color: row.festivalUsed > 0 ? '#be185d' : 'text.secondary',
                                      }}
                                    />
                                  </Box>
                                </Tooltip>
                              </TableCell>

                              {/* Closing Balance */}
                              <TableCell align="center">
                                <Typography fontWeight={800} fontSize={13} color="text.primary">
                                  {fmt(row.closing)}
                                </Typography>
                              </TableCell>
                            </>
                          )}

                          {/* YEAR VIEW COLUMNS */}
                          {viewMode === 'year' && (
                            <>
                              {/* Yearly Regular Quota */}
                              <TableCell align="center">
                                <Typography fontWeight={600} fontSize={13}>
                                  {fmt(row.yearlyQuota)}
                                </Typography>
                              </TableCell>

                              {/* Comp-Offs Earned in Whole Year */}
                              <TableCell align="center">
                                {row.totalCompOffAccruedYear > 0 ? (
                                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                                    <Chip
                                      icon={<CheckCircleOutlineIcon style={{ fontSize: 16, color: '#047857' }} />}
                                      label={`+${fmt(row.totalCompOffAccruedYear)} Days`}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: 12,
                                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                                        color: '#047857',
                                        border: '1px solid #10b981',
                                      }}
                                    />
                                    {row.totalCompOffPayableYear && row.totalCompOffPayableYear > 0 ? (
                                      <Chip
                                        label={`💰 ${fmt(row.totalCompOffPayableYear)} Payable`}
                                        size="small"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: 10.5,
                                          height: 20,
                                          bgcolor: 'rgba(234, 179, 8, 0.15)',
                                          color: '#854d0e',
                                          border: '1px solid rgba(234, 179, 8, 0.4)',
                                        }}
                                      />
                                    ) : null}
                                  </Box>
                                ) : (
                                  <Typography color="text.secondary" fontWeight={600} fontSize={13}>
                                    0
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Total Allowed in Year (18 + Comp-Offs) */}
                              <TableCell align="center">
                                <Typography fontWeight={700} fontSize={13} color="primary.main">
                                  {fmt(row.totalAllowedYear)}
                                </Typography>
                              </TableCell>

                              {/* Total Taken in Year */}
                              <TableCell align="center">
                                <Typography
                                  fontWeight={row.totalUsedYear > 18 ? 800 : 600}
                                  fontSize={13}
                                  color={row.totalUsedYear > 18 ? 'error.main' : 'text.primary'}
                                >
                                  {fmt(row.totalUsedYear)}
                                </Typography>
                              </TableCell>

                              {/* Total Extra in Year */}
                              <TableCell align="center">
                                {isExtraYear ? (
                                  <Chip
                                    label={`+${fmt(row.totalExtraYear)} LOP`}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: 11.5,
                                      bgcolor: 'rgba(239, 68, 68, 0.15)',
                                      color: '#b91c1c',
                                      border: '1px solid #ef4444',
                                    }}
                                  />
                                ) : (
                                  <Typography color="text.secondary" fontSize={13}>
                                    0
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Festival Leaves (Year View: Quota / Used / Remaining) */}
                              <TableCell align="center">
                                <Tooltip
                                  title={`Festival Quota: ${row.festivalTotalQuota} Days | Used: ${row.festivalUsed} Days | Remaining: ${row.festivalRemaining} Days`}
                                >
                                  <Box display="inline-flex" alignItems="center" gap={0.5}>
                                    <Chip
                                      icon={<CelebrationIcon style={{ fontSize: 14, color: '#be185d' }} />}
                                      label={`Used: ${fmt(row.festivalUsed)} / ${fmt(row.festivalTotalQuota)} (Rem: ${fmt(row.festivalRemaining)})`}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: 11.5,
                                        bgcolor: 'rgba(236, 72, 153, 0.12)',
                                        color: '#be185d',
                                        border: '1px solid rgba(236, 72, 153, 0.3)',
                                      }}
                                    />
                                  </Box>
                                </Tooltip>
                              </TableCell>

                              {/* Year Closing Balance */}
                              <TableCell align="center">
                                <Typography fontWeight={800} fontSize={13.5} color="text.primary">
                                  {fmt(row.closingBalanceYear)}
                                </Typography>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            Showing {filteredRows.length} of {rows.length} employees • View: <b>{viewMode === 'year' ? `Pure Year (${selectedYear})` : `${monthNames[selectedMonth - 1]} ${selectedYear}`}</b>
          </Typography>
          <Button onClick={() => setOpen(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rules Overview Modal */}
      <Dialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 0.5 },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            pt: 2,
            px: 2.5,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <InfoOutlinedIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              Rules Overview
            </Typography>
          </Box>
          <IconButton onClick={() => setRulesOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Comp-Off Rule Card */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.8}>
              <AccountBalanceWalletIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} color="#7c3aed">
                Last Sunday Comp-Off & Encashment Rule
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              • Last Sunday Scheduled Shift is <b>Half-Day</b>. At least <b>4.0 hours</b> work is required to count as Half Day.<br />
              • Employee staying <b>Full Day (&ge; 7.0 hours)</b> earns <b>+0.5 Day Comp-Off</b>.<br />
              • Working Half Day (4.0 &ndash; 6.9 hours) gives <b>0 extra comp-off</b> (as half day off was already availed).<br />
              • Working &lt; 4 hours is considered incomplete (&lt; 4h) attendance.<br />
              • Regular leaves (1.5) are consumed first; extra leave beyond 1.5 is covered by the 0.5 Comp-Off.<br />
              • <b>Comp-Off does NOT lapse</b>: If not consumed for leaves, the 0.5 Day is <b>Payable (Encashment / Extra Day Pay)</b> in salary!
            </Typography>
          </Box>

          {/* Regular Leaves Rule Card */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(2, 136, 209, 0.06)', border: '1px solid rgba(2, 136, 209, 0.2)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.8}>
              <EventAvailableIcon sx={{ color: '#0288d1', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} color="#0288d1">
                Regular Leaves (1.5 Days/Month)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              • Every employee accrues <b>1.5 Days per month</b> (Total 18 Days per calendar year).<br />
              • Unused regular leaves carry forward across months within the year.<br />
              • Any leave taken beyond (Accumulated Regular + Comp-Off) is treated as <b>Extra / LOP</b>.
            </Typography>
          </Box>

          {/* Festival Leaves Rule Card */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.8}>
              <CelebrationIcon sx={{ color: '#be185d', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={800} color="#be185d">
                Festival Leaves ({festivalQuota} Days/Year)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              • Employees are eligible for <b>{festivalQuota} Days/Year</b> festival leaves out of <b>{declaredHolidays} declared annual holidays</b>.<br />
              • Festival leaves are tracked separately from the regular leave quota.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setRulesOpen(false)} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Got It
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
