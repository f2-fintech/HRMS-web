'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import dayjs from 'dayjs'

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
  total_used?: number
  total_extra?: number
  closing_balance: number
  months: MonthRow[]
}

type HighLeaveRow = {
  employeeId: string
  name: string
  code?: string
  location?: string
  leaveLike: number
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n: any) {
  const x = Number(n ?? 0)
  if (!Number.isFinite(x)) return '0'
  return Number.isInteger(x) ? String(x) : x.toFixed(1)
}

function normalizeTo12Months(months: MonthRow[]): MonthRow[] {
  const map = new Map<number, MonthRow>()
  ;(months || []).forEach(m => map.set(Number(m.month), { ...m, month: Number(m.month) }))

  const out: MonthRow[] = []
  for (let i = 1; i <= 12; i++) {
    const m = map.get(i)
    out.push(
      m ?? {
        month: i,
        opening: 0,
        accrued: 0,
        used_approved: 0,
        used_pending: 0,
        used_rejected: 0,
        used_total: 0,
        extra: 0,
        used: 0,
        closing: 0,
      },
    )
  }
  return out
}

const IconUp = () => <ArrowUpwardIcon fontSize="small" sx={{ color: 'error.main', ml: 0.5 }} />
const IconDown = () => <ArrowDownwardIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />

const UsedVsCreditIndicator = ({ used, credited }: { used: number; credited: number }) => {
  const u = Number(used ?? 0)
  const c = Number(credited ?? 0)
  if (u > c) return <IconUp />
  if (u < c) return <IconDown />
  return null
}

export default function LeaveBalancePanel({
  employeeId,
  year,
  selectedMonth,
  title = 'Leave Balance',
  onClose,
}: {
  employeeId?: string | null
  year: string | number
  selectedMonth?: string | number
  title?: string
  onClose?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [error, setError] = useState<string>('')

  // ✅ high leave list states
  const [highLoading, setHighLoading] = useState(false)
  const [highRows, setHighRows] = useState<HighLeaveRow[]>([])
  const [highError, setHighError] = useState('')
  const [highOpen, setHighOpen] = useState(false)
  const threshold = 1.5

  const y = useMemo(() => Number(year || dayjs().format('YYYY')), [year])
  const sm = useMemo(() => Number(selectedMonth || dayjs().format('MM')), [selectedMonth])

  useEffect(() => {
    const run = async () => {
      setError('')
      setHighError('')
      setData(null)
      setHighRows([])

      if (!employeeId) return

      const user =
        typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const company_id = user?.company_id

      if (!token || !company_id) {
        setError('Token / company missing')
        return
      }

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/attendence/leave-balance/${employeeId}?year=${y}&force=1`

      setLoading(true)
      try {
        // ✅ 1) leave-balance
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
          throw new Error(msg || 'Failed to fetch balance')
        }

        const json = typeof raw === 'string' ? JSON.parse(raw) : raw
        setData(json)

        // ✅ 2) high-leave-like list (same month/year as panel)
        setHighLoading(true)
        try {
          const url2 =
            `${process.env.NEXT_PUBLIC_APP_URL}` +
            `/attendence/high-leave-like?month=${sm}&year=${y}&threshold=${threshold}`

          const res2 = await fetch(url2, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token} ${company_id}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          })

          const raw2 = await res2.json().catch(async () => await res2.text())

          if (!res2.ok) {
            const msg2 = typeof raw2 === 'string' ? raw2 : raw2?.message
            throw new Error(msg2 || 'Failed to fetch high leave list')
          }

          const json2 = typeof raw2 === 'string' ? JSON.parse(raw2) : raw2
          const list2 = Array.isArray(json2) ? json2 : json2?.data || []
          setHighRows(list2)
        } catch (e2: any) {
          setHighError(e2?.message || 'High leave list error')
        } finally {
          setHighLoading(false)
        }
      } catch (e: any) {
        setError(e?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [employeeId, y, sm])

  const getUsed = (m: MonthRow) => {
    if (m.used_total != null) return Number(m.used_total)
    if (m.used_approved != null) return Number(m.used_approved)
    return Number(m.used ?? 0)
  }

  const getExtra = (m: MonthRow) => Number(m.extra ?? 0)
  const getCredit = (m: MonthRow) => Number(m.accrued ?? data?.monthly_accrual ?? 1.5)
  const getOpeningAvailable = (m: MonthRow) => Number(m.opening ?? 0) + getCredit(m)

  const monthsDisplay = useMemo<MonthRow[]>(() => {
    if (!data?.months?.length) return []
    return normalizeTo12Months(data.months).sort((a, b) => Number(a.month) - Number(b.month))
  }, [data])

  // ✅ Total Taken upto selectedMonth
  const totalTaken = useMemo(() => {
    return (monthsDisplay || [])
      .filter(m => Number(m.month) <= sm)
      .reduce((sum, m) => sum + getUsed(m), 0)
  }, [monthsDisplay, sm])

  if (!employeeId) return null

  return (
    <Card sx={{ borderRadius: 3 }}>
      {(loading || highLoading) && <LinearProgress />}

      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} sx={{ mt: 0.5 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, fontSize: '16px' }}>
            Total Taken Leaves: <b>{fmt(totalTaken)}</b>
          </Typography>

          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {!error && data && (
          <>
            {/* ✅ High Leave section */}
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
                {/* <Typography sx={{ fontWeight: 900 }}>
                  High Leave + Absent (Month {String(sm).padStart(2, '0')}-{y}) &gt; {threshold}
                </Typography> */}

                {/* <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setHighOpen(true)}
                  disabled={!!highError || highRows.length === 0}
                  sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                >
                  View All
                </Button> */}
              </Box>
{/* 
              {highError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {highError}
                </Typography>
              )} */}
{/* 
              {!highLoading && !highError && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {highRows.length === 0 ? (
                    <Typography color="text.secondary">No employee crossed {threshold} ✅</Typography>
                  ) : (
                    highRows.slice(0, 10).map(r => (
                      <Box
                        key={r.employeeId}
                        sx={{
                          px: 1.2,
                          py: 0.6,
                          borderRadius: 999,
                          border: '1px solid rgba(0,0,0,0.12)',
                          display: 'inline-flex',
                          gap: 0.8,
                          alignItems: 'center',
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{r.name}</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                          {Number(r.leaveLike ?? 0).toFixed(1)}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              )} */}
            </Box>

            {/* ✅ Leave Balance Table */}
            {/* <Divider sx={{ my: 2 }} /> */}

            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                    {['Month', 'Allowed', 'Accumulated', 'Actual', 'Extra', 'Balance'].map(h => (
                      <TableCell key={h} align={h === 'Month' ? 'left' : 'center'}>
                        <Typography fontWeight={900} fontSize={13}>
                          {h}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {monthsDisplay.map(m => {
                    const isSel = Number(m.month) === sm

                    const credit = getCredit(m)
                    const available = getOpeningAvailable(m)
                    const taken = getUsed(m)
                    const extra = getExtra(m)
                    const closing = Number(m.closing ?? 0)

                    return (
                      <TableRow key={m.month} hover selected={isSel}>
                        <TableCell>
                          <Typography fontWeight={isSel ? 900 : 600}>
                            {monthNames[m.month - 1] ?? `M${m.month}`}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">{fmt(credit)}</TableCell>

                        <TableCell align="center">
                          <Typography fontWeight={isSel ? 900 : 600}>{fmt(available)}</Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Box display="inline-flex" alignItems="center" justifyContent="center">
                            <Typography fontWeight={isSel ? 900 : 600}>{fmt(taken)}</Typography>
                            <UsedVsCreditIndicator used={taken} credited={credit} />
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Typography fontWeight={isSel ? 900 : 600}>{fmt(extra)}</Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography fontWeight={900}>{fmt(closing)}</Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ✅ View All dialog */}
            <Dialog open={highOpen} onClose={() => setHighOpen(false)} fullWidth maxWidth="md">
              <DialogTitle sx={{ fontWeight: 900 }}>
                High Leave + Absent &gt; {threshold} (Month {String(sm).padStart(2, '0')}-{y})
              </DialogTitle>

              <DialogContent dividers>
                {highLoading && <LinearProgress />}

                {highError && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {highError}
                  </Typography>
                )}

                {!highLoading && !highError && (
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                          <TableCell sx={{ fontWeight: 900 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Employee</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Code</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Location</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900 }}>
                            Leave+Absent
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      {/* <TableBody>
                        {highRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Box sx={{ py: 3, textAlign: 'center' }}>
                                <Typography color="text.secondary">
                                  No employee crossed {threshold} ✅
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          highRows.map((r, idx) => (
                            <TableRow key={r.employeeId} hover>
                              <TableCell sx={{ fontWeight: 800 }}>{idx + 1}</TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 800 }}>{r.name}</Typography>
                              </TableCell>
                              <TableCell>{r.code || '—'}</TableCell>
                              <TableCell>{r.location || '—'}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={Number(r.leaveLike ?? 0).toFixed(1)}
                                  sx={{ fontWeight: 900 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody> */}
                    </Table>
                  </TableContainer>
                )}
              </DialogContent>

              <DialogActions>
                <Button onClick={() => setHighOpen(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
