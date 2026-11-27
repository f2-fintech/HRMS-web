'use client'

import React, { useState, useEffect } from 'react'

// MUI Imports
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Alert
} from '@mui/material'

// MUI Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import PersonIcon from '@mui/icons-material/Person'
import GroupsIcon from '@mui/icons-material/Groups'
import BusinessIcon from '@mui/icons-material/Business'
import CalculateIcon from '@mui/icons-material/Calculate'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

interface RateConfig {
  mult: number
  addon: number
  step: number
  e0: number
  e1: number
  e2: number
  e3: number
  e4: number
  tl: number
  mt: number
  ms: number
  mi: number
  mc: number
  tlo: number
  mo: number
  mot: number
}

const D: RateConfig = {
  mult: 200,
  addon: 2000000,
  step: 25,
  e0: 0.25,
  e1: 0.30,
  e2: 0.35,
  e3: 0.40,
  e4: 0.50,
  tl: 0.12,
  mt: 0.09,
  ms: 0.10,
  mi: 0.05,
  mc: 0.50,
  tlo: 0.20,
  mo: 0.35,
  mot: 0.10
}

const LB: Record<keyof RateConfig, string> = {
  mult: 'Target = salary ×',
  addon: 'Add to target ₹',
  step: 'Slab step %',
  e0: 'Employee slab 1 %',
  e1: 'Employee slab 2 %',
  e2: 'Employee slab 3 %',
  e3: 'Employee slab 4 %',
  e4: 'Employee slab 5+ %',
  tl: 'TL on employee %',
  mt: 'Manager on employee under TL %',
  ms: 'Manager direct: first slab %',
  mi: 'Manager direct: rise per slab %',
  mc: 'Manager direct: maximum %',
  tlo: 'TL own case %',
  mo: 'Manager own case %',
  mot: 'Manager on TL own case %'
}

type Role = 'emp' | 'tl' | 'mg'
type Reporting = 'tl' | 'mg'

interface SlabRow {
  lo: number
  hi: number
  b: number
  r: number
  a: number
}

const rs = (v: number) => '₹' + Math.round(v).toLocaleString('en-IN')

const words = (v: number) => {
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Crore'
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(2) + ' Lakh'
  return v > 0 ? rs(v) : ''
}

export default function F2IncentiveCalculator() {
  const [role, setRole] = useState<Role>('emp')
  const [rep, setRep] = useState<Reporting>('tl')
  const [sal, setSal] = useState<string>('')
  const [dis, setDis] = useState<string>('')
  const [rates, setRates] = useState<RateConfig>(D)

  // Load saved rates from localStorage
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('f2s3') || 'null')
      if (a) {
        setRates({ ...D, ...a })
      }
    } catch {
      // ignore
    }
  }, [])

  const handleRateChange = (key: keyof RateConfig, val: string) => {
    const updated = { ...rates, [key]: parseFloat(val) || 0 }
    setRates(updated)
    try {
      localStorage.setItem('f2s3', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  const handleResetRates = () => {
    setRates({ ...D })
    try {
      localStorage.setItem('f2s3', JSON.stringify(D))
    } catch {
      // ignore
    }
  }

  function slabs(d: number, s: number, rateFn: (i: number) => number, n: number) {
    const j = s * rates.mult
    const p = j + rates.addon
    let tot = 0
    const rows: SlabRow[] = []
    for (let i = 0; i < n; i++) {
      const lo = i ? p * (1 + (rates.step / 100) * (i - 1)) : j
      const hi = i === n - 1 ? Infinity : p * (1 + (rates.step / 100) * i)
      const b = Math.max(0, Math.min(d, hi) - lo)
      const r = rateFn(i)
      const a = (b * r) / 100
      tot += a
      rows.push({ lo, hi, b, r, a })
    }
    return { tot, rows }
  }

  function mgrN() {
    let n = 1
    while (n < 60 && rates.ms + rates.mi * (n - 1) < rates.mc) {
      n++
    }
    return n + 1
  }

  const s = parseFloat(sal) || 0
  const d = parseFloat(dis) || 0
  const isEmp = role === 'emp'

  const hasInputs = d > 0 && (!isEmp || s > 0)
  const R: Array<{ title: string; amount: number; color: string }> = []
  const N: string[] = []
  let empTableRows: SlabRow[] | null = null
  let mgrTableRows: SlabRow[] | null = null

  if (hasInputs) {
    if (isEmp) {
      const j = s * rates.mult
      const ex = Math.max(0, d - j)
      const e = slabs(d, s, (i) => (rates as any)['e' + i], 5)
      R.push({ title: 'Employee', amount: e.tot, color: '#2563eb' })

      if (d <= j) {
        N.push(
          `Employee: no incentive until disbursed passes the target of ${rs(j)}. This amount is below the target, so the incentive is ₹0.`
        )
      } else {
        N.push(
          `Employee: no incentive until disbursed passes the target of ${rs(j)}. Above the target, each slab pays its own rate on the business inside it:`
        )
        empTableRows = e.rows
      }

      if (rep === 'tl') {
        R.push(
          { title: 'TL', amount: (ex * rates.tl) / 100, color: '#0891b2' },
          { title: 'Manager', amount: (ex * rates.mt) / 100, color: '#7c3aed' }
        )
        N.push(`TL: ${rates.tl}% of the amount above target (${rs(ex)}).`)
        N.push(`Manager: ${rates.mt}% of the amount above target (${rs(ex)}).`)
      } else {
        const m = slabs(d, s, (i) => Math.min(rates.mc, rates.ms + rates.mi * i), mgrN())
        R.push({ title: 'Manager', amount: m.tot, color: '#7c3aed' })
        N.push(
          `Manager (employee reports directly): rate starts at ${rates.ms}% and rises by ${rates.mi}% each slab up to ${rates.mc}%.`
        )
        if (d > j) {
          mgrTableRows = m.rows
        }
      }
    } else if (role === 'tl') {
      R.push({ title: 'TL', amount: (d * rates.tlo) / 100, color: '#0891b2' })
      N.push(`TL: ${rates.tlo}% of ${rs(d)}.`)
    } else {
      R.push({ title: 'Manager', amount: (d * rates.mo) / 100, color: '#7c3aed' })
      N.push(`Manager: ${rates.mo}% of ${rs(d)}.`)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        pb: 6,
        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
          WebkitAppearance: 'none',
          margin: 0
        },
        '& input[type=number]': {
          MozAppearance: 'textfield'
        }
      }}
    >
      {/* Top Header Card */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #06b6d4 100%)',
          color: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)'
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalculateIcon sx={{ fontSize: 30, color: '#ffffff' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                F2 Incentive Calculator
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', mt: 0.5 }}>
                Calculate employee, team leader, and manager loan disbursement incentives
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Main Grid: Inputs on Left, Results on Right */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: INPUTS */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* 1. Who disbursed the loan? */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="1" size="small" color="primary" sx={{ fontWeight: 800, height: 22, width: 22 }} />
                  Who disbursed the loan?
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={4}>
                    <Button
                      fullWidth
                      variant={role === 'emp' ? 'contained' : 'outlined'}
                      onClick={() => setRole('emp')}
                      startIcon={<PersonIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        flexDirection: 'column',
                        gap: 0.5,
                        '& .MuiButton-startIcon': { m: 0 }
                      }}
                    >
                      Employee
                    </Button>
                  </Grid>

                  <Grid item xs={4}>
                    <Button
                      fullWidth
                      variant={role === 'tl' ? 'contained' : 'outlined'}
                      onClick={() => setRole('tl')}
                      startIcon={<GroupsIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        flexDirection: 'column',
                        gap: 0.5,
                        '& .MuiButton-startIcon': { m: 0 }
                      }}
                    >
                      TL
                    </Button>
                  </Grid>

                  <Grid item xs={4}>
                    <Button
                      fullWidth
                      variant={role === 'mg' ? 'contained' : 'outlined'}
                      onClick={() => setRole('mg')}
                      startIcon={<BusinessIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        flexDirection: 'column',
                        gap: 0.5,
                        '& .MuiButton-startIcon': { m: 0 }
                      }}
                    >
                      Manager
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* 2. Who does this employee report to? (only if Employee) */}
            {isEmp && (
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="2" size="small" color="primary" sx={{ fontWeight: 800, height: 22, width: 22 }} />
                    Who does this employee report to?
                  </Typography>

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant={rep === 'tl' ? 'contained' : 'outlined'}
                        onClick={() => setRep('tl')}
                        sx={{
                          py: 1.5,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        A TL (TL is in between)
                      </Button>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant={rep === 'mg' ? 'contained' : 'outlined'}
                        onClick={() => setRep('mg')}
                        sx={{
                          py: 1.5,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        Directly TL/Manager
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* 3. Employee's monthly salary (only if Employee) */}
            {isEmp && (
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="3" size="small" color="primary" sx={{ fontWeight: 800, height: 22, width: 22 }} />
                    Employee’s monthly salary (₹)
                  </Typography>

                  <TextField
                    fullWidth
                    type="number"
                    value={sal}
                    onChange={(e) => setSal(e.target.value)}
                    placeholder="e.g. 18000"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }
                    }}
                  />

                  {s > 0 && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid #bfdbfe'
                      }}
                    >
                      Target (justification) = salary × {rates.mult} = <strong>{rs(s * rates.mult)}</strong>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 4. Total amount disbursed */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={isEmp ? '4' : '2'} size="small" color="primary" sx={{ fontWeight: 800, height: 22, width: 22 }} />
                  Total amount disbursed (₹)
                </Typography>

                <TextField
                  fullWidth
                  type="number"
                  value={dis}
                  onChange={(e) => setDis(e.target.value)}
                  placeholder="e.g. 9000000"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }
                  }}
                />

                {d > 0 && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#ecfdf5',
                      color: '#065f46',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: '1px solid #a7f3d0'
                    }}
                  >
                    = {words(d)} ({rs(d)})
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* RIGHT COLUMN: RESULTS & EXPLANATIONS */}
        <Grid item xs={12} lg={7}>
          {!hasInputs ? (
            <Card
              sx={{
                borderRadius: 3,
                p: 5,
                textAlign: 'center',
                border: '2px dashed #93c5fd',
                backgroundColor: '#f8faff',
                boxShadow: 'none'
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                Fill in the amounts above
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                Enter the monthly salary and total disbursed loan amount to calculate incentives.
              </Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Payout Cards */}
              <Grid container spacing={2}>
                {R.map((item, idx) => (
                  <Grid item xs={12} sm={R.length === 1 ? 12 : R.length === 2 ? 6 : 4} key={idx}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        p: 2.5,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          backgroundColor: item.color
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                        {item.title} gets
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f766e', mt: 0.5 }}>
                        {rs(item.amount)}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* How it was worked out */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <CardHeader
                  title="How it was worked out"
                  titleTypographyProps={{ variant: 'h6', fontWeight: 700 }}
                  sx={{ pb: 1 }}
                />
                <Divider />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    {N.map((line, idx) => {
                      const sepIdx = line.indexOf(':')
                      const boldPart = sepIdx >= 0 ? line.slice(0, sepIdx) : ''
                      const restPart = sepIdx >= 0 ? line.slice(sepIdx + 1) : line
                      return (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.875rem',
                            color: '#334155',
                            lineHeight: 1.6
                          }}
                        >
                          {boldPart ? <strong>{boldPart}:</strong> : null} {restPart}
                        </Box>
                      )
                    })}
                  </Box>

                  {/* Employee Slab Table */}
                  {empTableRows && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
                        Employee Slab Breakdown
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Slab (disbursed between)</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Business in slab</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Incentive</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {empTableRows.map((row, i) => (
                              <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ fontWeight: 500 }}>
                                  {rs(row.lo)} to {isFinite(row.hi) ? rs(row.hi) : 'above'}
                                </TableCell>
                                <TableCell align="right">{rs(row.b)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#2563eb' }}>
                                  {+row.r.toFixed(2)}%
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#0f766e' }}>
                                  {rs(row.a)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Manager Slab Table (if Direct reporting) */}
                  {mgrTableRows && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
                        Manager (Direct Reporting) Slab Breakdown
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Slab (disbursed between)</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Business in slab</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Rate</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>Incentive</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mgrTableRows.map((row, i) => (
                              <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ fontWeight: 500 }}>
                                  {rs(row.lo)} to {isFinite(row.hi) ? rs(row.hi) : 'above'}
                                </TableCell>
                                <TableCell align="right">{rs(row.b)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                                  {+row.r.toFixed(2)}%
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#0f766e' }}>
                                  {rs(row.a)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>

        {/* BOTTOM ACCORDION: CHANGE RATES (OPTIONAL) */}
        <Grid item xs={12}>
          <Accordion
            sx={{
              borderRadius: '12px !important',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              '&::before': { display: 'none' }
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 700, color: '#334155' }}>
                Change rates (optional)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1, pb: 3 }}>
              <Grid container spacing={2}>
                {(Object.keys(D) as Array<keyof RateConfig>).map((key) => (
                  <Grid item xs={12} sm={6} md={3} key={key}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={LB[key]}
                      value={rates[key]}
                      onChange={(e) => handleRateChange(key, e.target.value)}
                      inputProps={{ step: 'any' }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2 }}>
                TL own, manager own and manager-on-TL-own rates are flat % of the amount disbursed, taken from the sheet and not from policy.
              </Alert>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={handleResetRates}
                  startIcon={<RestartAltIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Reset rates
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  )
}
