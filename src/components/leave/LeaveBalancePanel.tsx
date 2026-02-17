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
  total_used?: number
  total_extra?: number
  closing_balance: number
  months: MonthRow[]
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
        closing: 0
      }
    )
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

      const user =
        typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('user') || '{}')
          : {}

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const company_id = user?.company_id

      if (!token || !company_id) {
        setError('Token / company missing')
        return
      }

      const url = `${process.env.NEXT_PUBLIC_APP_URL}/attendence/leave-balance/${employeeId}?year=${y}&force=1`

      setLoading(true)
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token} ${company_id}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        })

        const raw = await res.json().catch(async () => await res.text())

        if (!res.ok) {
          const msg = typeof raw === 'string' ? raw : raw?.message
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

  // ✅ FIX: Total Taken = sum of "Actual" only upto selectedMonth (sm)
  const totalTaken = useMemo(() => {
    return (monthsDisplay || [])
      .filter(m => Number(m.month) <= sm)
      .reduce((sum, m) => sum + getUsed(m), 0)
  }, [monthsDisplay, sm])

  if (!employeeId) return null

  return (
    <Card sx={{ borderRadius: 3 }}>
      {loading && <LinearProgress />}

      <CardContent>
        <Box
          display='flex'
          alignItems='center'
          justifyContent='space-between'
          gap={2}
          sx={{ mt: 0.5 }}
        >
          <Typography
            variant='body1'
            color='text.secondary'
            sx={{ fontWeight: 600, fontSize: '16px' }}
          >
            Total Taken Leaves: <b>{fmt(totalTaken)}</b>
          </Typography>

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
            <Divider sx={{ my: 2 }} />

            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size='small'>
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

                        <TableCell align='center'>{fmt(credit)}</TableCell>

                        <TableCell align='center'>
                          <Typography fontWeight={isSel ? 900 : 600}>{fmt(available)}</Typography>
                        </TableCell>

                        <TableCell align='center'>
                          <Box display='inline-flex' alignItems='center' justifyContent='center'>
                            <Typography fontWeight={isSel ? 900 : 600}>{fmt(taken)}</Typography>
                            <UsedVsCreditIndicator used={taken} credited={credit} />
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
