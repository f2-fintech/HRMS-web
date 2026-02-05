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
  IconButton
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

  total_used_approved?: number
  total_used_pending?: number
  total_used_rejected?: number

  total_used?: number
  total_extra?: number
  closing_balance: number
  months: MonthRow[]
}

type MonthRowDisplay = MonthRow & {
  _openingAvailable?: number
  _credited?: number
  _closingDisplay?: number
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
    if (m) out.push(m)
    else {
      out.push({
        month: i,
        opening: 0,
        accrued: 0,
        used_approved: 0,
        used_pending: 0,
        used_rejected: 0,
        used_total: 0,
        extra: 0,
        used: 0,
        closing: 0
      })
    }
  }
  return out
}

const IconUp = () => <ArrowUpwardIcon fontSize='small' sx={{ color: 'error.main', ml: 0.5 }} />
const IconDown = () => <ArrowDownwardIcon fontSize='small' sx={{ color: 'text.secondary', ml: 0.5 }} />

const UsedVsCreditIndicator = ({ used, credited }: { used: number; credited: number }) => {
  const u = Number(used ?? 0)
  const c = Number(credited ?? 0)
  if (u > c) return <IconUp />
  if (u < c) return <IconDown />
  return null
}

function buildPolicyDisplay(months12: MonthRow[], expected: number): MonthRowDisplay[] {
  let prevClosing = 0

  return (months12 || []).map(m => {
    const usedApproved = Number(m.used_approved ?? 0)
    const usedPending = Number(m.used_pending ?? 0)

    const usedTotal =
      m.used_total !== undefined && m.used_total !== null
        ? Number(m.used_total)
        : usedApproved + usedPending > 0
          ? usedApproved + usedPending
          : Number(m.used ?? 0)

    const extra = Number(m.extra ?? 0)
    const credited = expected

    const openingAvailable = prevClosing + credited
    const closingDisplay = openingAvailable - usedTotal + extra

    prevClosing = closingDisplay

    return {
      ...m,
      _credited: credited,
      _openingAvailable: openingAvailable,
      _closingDisplay: closingDisplay
    }
  })
}

export default function LeaveBalancePanel({
  employeeId,
  year,
  selectedMonth,
  title = 'Leave Balance',
  onClose
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

  const y = useMemo(() => Number(year || dayjs().format('YYYY')), [year])
  const sm = useMemo(() => Number(selectedMonth || dayjs().format('MM')), [selectedMonth])

  useEffect(() => {
    const run = async () => {
      setError('')
      setData(null)
      if (!employeeId) return

      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {}
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const company_id = user?.company_id

      if (!token || !company_id) {
        setError('Token / company missing')
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/leaves/balance/${employeeId}?year=${y}`, {
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json'
          }
        })

        const contentType = res.headers.get('content-type') || ''
        const raw = contentType.includes('application/json') ? await res.json() : await res.text()

        if (!res.ok) {
          const msg = typeof raw === 'string' ? raw : (raw as any)?.message
          throw new Error(msg || 'Failed to fetch balance')
        }

        const json = typeof raw === 'string' ? JSON.parse(raw) : raw
        setData(json)
      } catch (e: any) {
        setError(e?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [employeeId, y])

  const getUsedApproved = (m: MonthRow) => Number(m.used_approved ?? 0)
  const getUsedPending = (m: MonthRow) => Number(m.used_pending ?? 0)
  const getUsedRejected = (m: MonthRow) => Number(m.used_rejected ?? 0)

  const getUsedTotal = (m: MonthRow) => {
    if (m.used_total !== undefined && m.used_total !== null) return Number(m.used_total)
    const ap = getUsedApproved(m)
    const pe = getUsedPending(m)
    if (ap + pe > 0) return ap + pe
    return Number(m.used ?? 0)
  }

  const getExtra = (m: MonthRow) => Number(m.extra ?? 0)

  const expectedAccrual = Number(data?.monthly_accrual ?? 1.5)

  const monthsDisplay = useMemo<MonthRowDisplay[]>(() => {
    if (!data?.months?.length) return []
    const months12 = normalizeTo12Months(data.months)
    const sorted = [...months12].sort((a, b) => Number(a.month) - Number(b.month))
    return buildPolicyDisplay(sorted, expectedAccrual)
  }, [data, expectedAccrual])

  const selectedRow = useMemo<MonthRowDisplay | null>(() => {
    if (!monthsDisplay.length) return null
    return monthsDisplay.find(m => Number(m.month) === sm) || null
  }, [monthsDisplay, sm])

  if (!employeeId) {
    return null
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      {loading && <LinearProgress />}
      <CardContent>
        {/* Header with Close */}
        <Box display='flex' alignItems='center' justifyContent='space-between' gap={2} flexWrap='wrap'>
          <Box>
            <Typography variant='subtitle1' fontWeight={900}>
              {title} • {y}
            </Typography>
          </Box>

          {onClose && (
            <IconButton onClick={onClose} size='small'>
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {error && (
          <Typography color='error' sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {!error && data && (
          <>
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                p: 1.25,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.03)'
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                Opening (Available) {fmt(selectedRow?._openingAvailable ?? 0)} • Credit {fmt(selectedRow?._credited ?? expectedAccrual)} •
                Rejected {fmt(selectedRow ? getUsedRejected(selectedRow) : 0)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                    {['Month', 'Opening', 'Credit', 'Approved', 'Pending', 'Rejected', 'Taken', 'Extra', 'Closing'].map(h => (
                      <TableCell key={h} align={h === 'Month' ? 'left' : 'center'}>
                        <Typography fontWeight={900} fontSize={13}>
                          {h}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(monthsDisplay || []).map(m => {
                    const isSel = Number(m.month) === sm

                    const approved = getUsedApproved(m)
                    const pending = getUsedPending(m)
                    const rejected = getUsedRejected(m)

                    const total = getUsedTotal(m)
                    const extra = getExtra(m)

                    const openingAvail = Number(m._openingAvailable ?? 0)
                    const credited = Number(m._credited ?? expectedAccrual)
                    const closing = Number(m._closingDisplay ?? 0)

                    return (
                      <TableRow key={m.month} hover selected={isSel}>
                        <TableCell>
                          <Typography fontWeight={isSel ? 900 : 600}>{monthNames[m.month - 1] ?? `M${m.month}`}</Typography>
                        </TableCell>

                        <TableCell align='center'>
                          <Typography fontWeight={isSel ? 900 : 600}>{fmt(openingAvail)}</Typography>
                        </TableCell>

                        <TableCell align='center'>{fmt(credited)}</TableCell>
                        <TableCell align='center'>{fmt(approved)}</TableCell>
                        <TableCell align='center'>{fmt(pending)}</TableCell>
                        <TableCell align='center'>{fmt(rejected)}</TableCell>

                        <TableCell align='center'>
                          <Box display='inline-flex' alignItems='center' justifyContent='center'>
                            <Typography fontWeight={isSel ? 900 : 600}>{fmt(total)}</Typography>
                            <UsedVsCreditIndicator used={total} credited={credited} />
                          </Box>
                        </TableCell>

                        <TableCell align='center'>
                          <Typography fontWeight={isSel ? 900 : 600}>{fmt(extra)}</Typography>
                        </TableCell>

                        <TableCell align='center'>
                          <Typography fontWeight={900}>{fmt(closing)}</Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
