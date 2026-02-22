'use client'

import React, { useMemo, useState } from 'react'
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
} from '@mui/material'

type HighLeaveRow = {
  employeeId: string
  name: string
  code?: string
  location?: string
  leaveLike: number
}

export default function HighLeaveListButton({
  month,
  year,
  threshold = 1.5,
  title = 'High Leave & Absent',
}: {
  month?: number
  year?: number
  threshold?: number
  title?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<HighLeaveRow[]>([])
  const [error, setError] = useState('')

  const y = useMemo(() => Number(year ?? dayjs().year()), [year])
  const m = useMemo(() => Number(month ?? dayjs().month() + 1), [month])

  const fetchList = async () => {
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
        setError('Token / company missing')
        return
      }

      const url =
        `${process.env.NEXT_PUBLIC_APP_URL}` +
        `/attendence/high-leave-like?month=${m}&year=${y}&company_id=${company_id}&threshold=${threshold}`

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const raw = await res.json().catch(async () => await res.text())

      if (!res.ok) {
        const msg = typeof raw === 'string' ? raw : raw?.message
        throw new Error(msg || 'Failed to fetch')
      }

      const json = typeof raw === 'string' ? JSON.parse(raw) : raw
      const list = Array.isArray(json) ? json : json?.data || []
      setRows(list)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const onOpen = async () => {
    setOpen(true)
    await fetchList()
  }

  return (
    <>
      <Button
        variant="contained"
        onClick={onOpen}
        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
      >
        {title} (&gt; {threshold})
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {title} (Month {String(m).padStart(2, '0')}-{y})
        </DialogTitle>

        <DialogContent dividers>
          {loading && <LinearProgress />}

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {!loading && !error && (
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

                <TableBody>
                  {rows.length === 0 ? (
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
                    rows.map((r, idx) => (
                      <TableRow key={r.employeeId} hover>
                        <TableCell sx={{ fontWeight: 800 }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800 }}>
                            {r.name}
                          </Typography>
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
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
        
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
