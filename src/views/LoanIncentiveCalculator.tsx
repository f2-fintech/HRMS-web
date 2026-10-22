'use client'

import React, { useState, useEffect, useMemo } from 'react'

// MUI Imports
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  useTheme,
  alpha
} from '@mui/material'

// Icons
import CalculateIcon from '@mui/icons-material/Calculate'
import SettingsIcon from '@mui/icons-material/Settings'
import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'

// Rank hierarchy definitions
const RATE_BPS = 60 // 0.6%
const RANK = ['RE', 'Individual TL', 'TL', 'Individual Manager', 'Manager', 'ASM']
const TEAM = ['TL', 'Manager']

interface DisbursalItem {
  amt: string
  con: string
  hier: string[]
}

interface CommissionConfig {
  c: number
  h: number
}

interface RuleHistoryItem {
  t: string
  before: CommissionConfig
  after: CommissionConfig
}

interface SavedLoanRecord {
  t: string
  loan: number
  extra: number
  target: number
  pool: number
  scn: string
  cfg: CommissionConfig
  rows: Array<{ r: string; resp: string; a: number }>
  per: any[]
}

interface AppState {
  cfg: CommissionConfig
  hist: RuleHistoryItem[]
  loans: SavedLoanRecord[]
}

const formatInr = (paisa: number) => {
  return (
    '₹' +
    (paisa / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  )
}

const above = (role: string) => {
  const idx = RANK.indexOf(role)
  return idx >= 0 ? RANK.slice(idx + 1) : []
}

const rk = (role: string) => {
  const idx = RANK.indexOf(role)
  return idx < 0 ? 99 : idx
}

const cfgTxt = (c: CommissionConfig) =>
  `Contributor ${c.c}% · Hierarchy ${c.h}% (split equally) · Originator gets the rest`

export default function LoanIncentiveCalculator() {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<number>(0)
  const [mounted, setMounted] = useState<boolean>(false)

  // App persistent state
  const [appState, setAppState] = useState<AppState>({
    cfg: { c: 20, h: 10 },
    hist: [],
    loans: []
  })

  // Calculator inputs
  const [sal, setSal] = useState<string>('')
  const [team, setTeam] = useState<string>('')
  const [orig, setOrig] = useState<string>('RE')
  const [list, setList] = useState<DisbursalItem[]>([{ amt: '', con: '', hier: [] }])

  // Commission settings inputs
  const [cfgC, setCfgC] = useState<string>('20')
  const [cfgH, setCfgH] = useState<string>('10')
  const [settingsFeedback, setSettingsFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [saveLoanSuccess, setSaveLoanSuccess] = useState<string>('')

  const [currentUser, setCurrentUser] = useState<any>(null)

  // Load from localStorage on client mount (scoped to logged-in user)
  useEffect(() => {
    setMounted(true)
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setCurrentUser(userData)
      const userId = userData?.id || userData?._id || userData?.employee_id || userData?.email || 'guest'
      const userKey = `lic_v2_${userId}`

      const stored = localStorage.getItem(userKey) || localStorage.getItem('lic_v2')
      if (stored) {
        const parsed = JSON.parse(stored)
        setAppState({
          cfg: parsed.cfg || { c: 20, h: 10 },
          hist: parsed.hist || [],
          loans: parsed.loans || []
        })
        if (parsed.cfg) {
          setCfgC(String(parsed.cfg.c ?? 20))
          setCfgH(String(parsed.cfg.h ?? 10))
        }
      }
    } catch (e) {
      console.error('Failed reading lic_v2 from localStorage', e)
    }
  }, [])

  // Helper to persist state for current user
  const persistState = (newState: AppState) => {
    setAppState(newState)
    try {
      const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}')
      const userId = userData?.id || userData?._id || userData?.employee_id || userData?.email || 'guest'
      const userKey = `lic_v2_${userId}`
      localStorage.setItem(userKey, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to save to localStorage', e)
    }
  }

  // Available contributor options
  const conOpts = useMemo(() => {
    return [...above(orig), 'Director']
  }, [orig])

  // Hierarchy options for a specific item (all roles above Originator excluding the Contributor itself)
  const getHopts = (item: DisbursalItem) => {
    const allAbove = [...above(orig), 'Director']
    return allAbove.filter(r => r !== item.con)
  }

  // Split calculation for a single disbursal
  const splitDisbursal = (item: DisbursalItem, pool: number) => {
    const cb = Math.round(appState.cfg.c * 100) // 20%
    const hb = Math.round(appState.cfg.h * 100) // 10%
    const n = item.hier.length

    // Rules from notebook:
    // 1) Only RE (no contributor, no hierarchy selected) -> RE gets 100%
    // 2) RE + Contributor (TL, Manager, ASM, Director) -> RE 70% + Contributor 20% + Hierarchy 10%
    // 3) Only RE + Hierarchy selected -> RE 90% + Hierarchy 10%
    const hs = Boolean(item.con || n > 0)

    const cAmt = item.con ? Math.floor((pool * cb) / 10000) : 0
    const hAmt = hs ? Math.floor((pool * hb) / 10000) : 0
    const each = n ? Math.floor(hAmt / n) : 0

    const rows: Array<{ r: string; resp: string; a: number }> = [
      { r: orig, resp: 'Loan Originator', a: 0 }
    ]

    if (item.con) {
      rows.push({ r: item.con, resp: 'Contributor', a: cAmt })
    }

    item.hier.forEach((r, i) => {
      rows.push({
        r,
        resp: 'Hierarchy',
        a: each + (i === 0 ? hAmt - each * n : 0)
      })
    })

    if (!n && hs) {
      rows.push({
        r: 'Hierarchy',
        resp: 'Hierarchy',
        a: hAmt
      })
    }

    // Originator receives whatever is left after Contributor and Hierarchy
    // (If only RE with no contributor & no hierarchy, rows[0].a = pool, i.e. 100%)
    rows[0].a = pool - rows.slice(1).reduce((s, x) => s + x.a, 0)
    return rows
  }

  // Full calculation
  const calcResult = useMemo(() => {
    const isT = TEAM.includes(orig)
    const ownSalNum = parseFloat(sal) || 0
    const teamSalNum = isT ? parseFloat(team) || 0 : 0
    const tg = Math.round((ownSalNum + teamSalNum) * 200 * 100)
    const cb = Math.round(appState.cfg.c * 100)
    const hb = Math.round(appState.cfg.h * 100)

    const out: any = { target: tg, isT }

    if (!(parseFloat(sal) > 0)) {
      out.err = 'Enter the salary first.'
      return out
    }

    if (isT && !(parseFloat(team) > 0)) {
      out.err = `Enter the total salary of the employees under this ${orig}.`
      return out
    }

    if (cb < 0 || hb < 0 || cb + hb > 10000) {
      out.err =
        'Commission settings are invalid (Contributor % + Hierarchy % must not exceed 100). Fix them in Commission Settings.'
      return out
    }

    const ents = list
      .map((e, i) => ({ e, i, lp: Math.round((parseFloat(e.amt) || 0) * 100) }))
      .filter(x => x.lp > 0)

    if (!ents.length) {
      out.err = 'Add at least one disbursal amount.'
      return out
    }

    const total = ents.reduce((s, x) => s + x.lp, 0)
    out.total = total

    if (total <= tg) {
      out.inel = true
      return out
    }

    let cum = 0
    let pool = 0
    let extra = 0
    const per: any[] = []
    const tot: Record<string, { r: string; resp: string; a: number }> = {}

    ents.forEach(x => {
      cum += x.lp
      const el = Math.max(0, Math.min(x.lp, cum - tg))
      const p = Math.round((el * RATE_BPS) / 10000)
      const rows = splitDisbursal(x.e, p)

      per.push({
        n: x.i + 1,
        lp: x.lp,
        el,
        p,
        con: x.e.con,
        hier: x.e.hier,
        o: rows[0].a,
        orig: rows[0].r,
        cr: rows.filter(q => q.resp === 'Contributor'),
        hr: rows.filter(q => q.resp === 'Hierarchy')
      })

      pool += p
      extra += el

      rows.forEach(r => {
        const k = r.resp + '|' + r.r
        tot[k] = tot[k] || { r: r.r, resp: r.resp, a: 0 }
        tot[k].a += r.a
      })
    })

    const od = ['Loan Originator', 'Contributor', 'Hierarchy']
    const ri = (r: string) => (RANK.indexOf(r) < 0 ? 99 : RANK.indexOf(r))

    out.rows = Object.values(tot)
      .filter(x => x.a > 0 || x.resp === 'Loan Originator')
      .sort((a, b) => od.indexOf(a.resp) - od.indexOf(b.resp) || ri(a.r) - ri(b.r))

    out.per = per
    out.pool = pool
    out.extra = extra

    return out
  }, [sal, team, orig, list, appState.cfg])

  // Handle Originator change
  const handleOrigChange = (newOrig: string) => {
    setOrig(newOrig)
    const validContributors = [...above(newOrig), 'Director']
    setList(prev =>
      prev.map(item => {
        const conValid = validContributors.includes(item.con) ? item.con : ''
        const allowedHierarchy = [...above(newOrig), 'Director'].filter(r => r !== conValid)
        return {
          ...item,
          con: conValid,
          hier: item.hier.filter(r => allowedHierarchy.includes(r))
        }
      })
    )
  }

  // Disbursal list actions
  const handleAmtChange = (idx: number, val: string) => {
    const clean = val.replace(/[^0-9.]/g, '')
    setList(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], amt: clean }
      return copy
    })
  }

  const handleConChange = (idx: number, newCon: string) => {
    setList(prev => {
      const copy = [...prev]
      const allowedHierarchy = [...above(orig), 'Director'].filter(r => r !== newCon)
      copy[idx] = {
        ...copy[idx],
        con: newCon,
        hier: copy[idx].hier.filter(r => allowedHierarchy.includes(r))
      }
      return copy
    })
  }

  const handleToggleHier = (idx: number, role: string) => {
    setList(prev => {
      const copy = [...prev]
      const current = copy[idx].hier
      const updated = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role].sort((a, b) => rk(a) - rk(b))
      copy[idx] = { ...copy[idx], hier: updated }
      return copy
    })
  }

  const handleAddDisbursal = () => {
    setList(prev => [...prev, { amt: '', con: '', hier: [] }])
  }

  const handleRemoveDisbursal = (idx: number) => {
    if (list.length <= 1) return
    setList(prev => prev.filter((_, i) => i !== idx))
  }

  // Save Loan Record
  const handleSaveLoanRecord = () => {
    if (!calcResult || calcResult.err || calcResult.inel) return
    const newRecord: SavedLoanRecord = {
      t: new Date().toISOString(),
      loan: calcResult.total,
      extra: calcResult.extra,
      target: calcResult.target,
      pool: calcResult.pool,
      scn: `Originator ${orig} · ${calcResult.per.length} disbursal(s)`,
      cfg: { ...appState.cfg },
      rows: calcResult.rows,
      per: calcResult.per
    }
    const updated = {
      ...appState,
      loans: [newRecord, ...appState.loans]
    }
    persistState(updated)
    setSaveLoanSuccess('Saved — rule snapshot stored with this record.')
    setTimeout(() => setSaveLoanSuccess(''), 5000)
  }

  // Commission Settings Save
  const handleSaveCommission = () => {
    const cNum = parseFloat(cfgC) || 0
    const hNum = parseFloat(cfgH) || 0

    if (cNum < 0 || hNum < 0 || cNum + hNum > 100) {
      setSettingsFeedback({
        text: 'Cannot save: values must be 0 or more and Contributor + Hierarchy must not exceed 100%.',
        ok: false
      })
      return
    }

    const updatedCfg: CommissionConfig = { c: cNum, h: hNum }
    const historyItem: RuleHistoryItem = {
      t: new Date().toISOString(),
      before: { ...appState.cfg },
      after: updatedCfg
    }

    const newState: AppState = {
      ...appState,
      cfg: updatedCfg,
      hist: [historyItem, ...appState.hist]
    }

    persistState(newState)
    setSettingsFeedback({
      text: `Saved ✓ at ${new Date().toLocaleTimeString('en-IN')}`,
      ok: true
    })
  }

  const cNum = parseFloat(cfgC) || 0
  const hNum = parseFloat(cfgH) || 0
  const originatorRemainder = Math.round((100 - cNum - hNum) * 100) / 100

  if (!mounted) {
    return (
      <Box p={6} textAlign='center'>
        <Typography color='text.secondary'>Loading Calculator...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Page Header matching HRMS style */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant='h5' fontWeight={700} color='text.primary' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalculateIcon color='primary' sx={{ fontSize: 28 }} />
            Loan Incentive Calculator
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Calculate loan originator and hierarchy incentives based on salary target thresholds
          </Typography>
        </Box>
        {/* <Chip
          icon={<MonetizationOnIcon />}
          label='Incentive Rate: 0.60%'
          color='primary'
          variant='outlined'
          sx={{ fontWeight: 600 }}
        /> */}
      </Box>

      {/* Tabs navigation in HRMS Materio style */}
      <Paper sx={{ mb: 4, borderRadius: 2 }} elevation={0} variant='outlined'>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor='primary'
          textColor='primary'
          variant='scrollable'
          scrollButtons='auto'
          sx={{ px: 2 }}
        >
          <Tab
            icon={<CalculateIcon />}
            iconPosition='start'
            label='Calculator'
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
          />
          <Tab
            icon={<SettingsIcon />}
            iconPosition='start'
            label='Commission Settings'
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition='start'
            label='History'
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
          />
        </Tabs>
      </Paper>

      {/* ============================================================== */}
      {/* TAB 0: CALCULATOR */}
      {/* ============================================================== */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* Section 1: Loan Originator & Salary */}
          <Grid item xs={12}>
            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <CardHeader
                title='1. Loan Originator & Salary'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={4} alignItems='center'>
                  <Grid item xs={12} sm={6} md={TEAM.includes(orig) ? 4 : 6}>
                    <FormControl fullWidth size='small'>
                      <InputLabel id='orig-label'>Loan Originator</InputLabel>
                      <Select
                        labelId='orig-label'
                        label='Loan Originator'
                        value={orig}
                        onChange={e => handleOrigChange(e.target.value)}
                      >
                        {RANK.map(r => (
                          <MenuItem key={r} value={r}>
                            {r}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={TEAM.includes(orig) ? 4 : 6}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Salary of Loan Originator'
                      placeholder='e.g. 15000'
                      value={sal}
                      onChange={e => setSal(e.target.value.replace(/[^0-9.]/g, ''))}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>₹</InputAdornment>
                      }}
                    />
                  </Grid>

                  {TEAM.includes(orig) && (
                    <Grid item xs={12} sm={12} md={4}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Total Team Salary Under Originator'
                        placeholder='e.g. 120000'
                        value={team}
                        onChange={e => setTeam(e.target.value.replace(/[^0-9.]/g, ''))}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>₹</InputAdornment>
                        }}
                      />
                    </Grid>
                  )}
                </Grid>

                {calcResult.target > 0 && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 1.5, border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}` }}>
                    <Typography variant='body2' color='text.secondary'>
                      {TEAM.includes(orig)
                        ? 'Eligibility target ((own salary + team salary) × 200): '
                        : 'Eligibility target (salary × 200): '}
                      <Typography component='span' variant='subtitle2' fontWeight={700} color='primary.main'>
                        {formatInr(calcResult.target)}
                      </Typography>
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Section 2: Monthly Amount Disbursed */}
          <Grid item xs={12}>
            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <CardHeader
                title='2. Monthly Amount Disbursed'
                subheader='Add every disbursal made in the month. For each one choose the Contributor (or none) and the Hierarchy.'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                subheaderTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
              <Divider />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {list.map((item, i) => {
                  const hopts = getHopts(item)
                  return (
                    <Paper
                      key={i}
                      variant='outlined'
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        borderColor: 'divider',
                        position: 'relative'
                      }}
                    >
                      <Grid container spacing={3} alignItems='center'>
                        <Grid item xs={12} sm={6} md={5}>
                          <TextField
                            fullWidth
                            size='small'
                            label={`Case ${i + 1} Disbursal Amount`}
                            placeholder='e.g. 1500000'
                            value={item.amt}
                            onChange={e => handleAmtChange(i, e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position='start'>₹</InputAdornment>
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={5}>
                          <FormControl fullWidth size='small'>
                            <InputLabel id={`con-label-${i}`}>Loan Contributor</InputLabel>
                            <Select
                              labelId={`con-label-${i}`}
                              label='Loan Contributor'
                              value={item.con}
                              onChange={e => handleConChange(i, e.target.value)}
                            >
                              <MenuItem value=''>
                                <em>No contributor</em>
                              </MenuItem>
                              {conOpts.map(r => (
                                <MenuItem key={r} value={r}>
                                  {r}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        {list.length > 1 && (
                          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                            <Button
                              variant='outlined'
                              color='error'
                              size='small'
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => handleRemoveDisbursal(i)}
                            >
                              Remove
                            </Button>
                          </Grid>
                        )}
                      </Grid>

                      {/* Hierarchy chips */}
                      <Box sx={{ mt: 2.5 }}>
                        <Typography variant='caption' color='text.secondary' fontWeight={500} sx={{ display: 'block', mb: 1 }}>
                          Hierarchy (optional roles above Contributor, or above Originator if no Contributor):
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {hopts.length > 0 ? (
                            hopts.map(r => {
                              const isSelected = item.hier.includes(r)
                              return (
                                <Chip
                                  key={r}
                                  label={r}
                                  size='small'
                                  color={isSelected ? 'primary' : 'default'}
                                  variant={isSelected ? 'filled' : 'outlined'}
                                  onClick={() => handleToggleHier(i, r)}
                                  icon={isSelected ? <CheckCircleIcon fontSize='small' /> : undefined}
                                  sx={{ fontWeight: isSelected ? 600 : 400, cursor: 'pointer' }}
                                />
                              )
                            })
                          ) : (
                            <Typography variant='caption' color='text.disabled' fontStyle='italic'>
                              No roles available.
                            </Typography>
                          )}
                        </Box>

                        {orig === 'RE' && !item.con && item.hier.length === 0 && (
                          <Typography variant='caption' color='success.main' sx={{ display: 'block', mt: 1, fontWeight: 500 }}>
                            ℹ️ Only RE: 100% incentive goes to Loan Originator (RE).
                          </Typography>
                        )}
                        {item.con && (
                          <Typography variant='caption' color='primary.main' sx={{ display: 'block', mt: 1, fontWeight: 500 }}>
                            ℹ️ Rule: Originator {orig} gets 70% · Contributor ({item.con}) gets 20% · Hierarchy gets 10%.
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  )
                })}

                <Box>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    startIcon={<AddIcon />}
                    onClick={handleAddDisbursal}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Add Another Disbursal
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Section 3: Combined incentive for the month */}
          <Grid item xs={12}>
            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <CardHeader
                title='3. Combined Incentive for the Month'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                {/* Form status / Error / Ineligibility Alerts */}
                {calcResult.err && (
                  <Alert severity='info' sx={{ mb: 2 }}>
                    {calcResult.err}
                  </Alert>
                )}

                {calcResult.inel && (
                  <Alert severity='warning' sx={{ mb: 2 }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Incentive Eligibility Not Met</AlertTitle>
                    No incentive is payable below the 100% salary target amount (
                    <strong>{formatInr(calcResult.target)}</strong>) itself. Incentive applies only to the amount
                    disbursed in excess of the salary target. Monthly total disbursed:{' '}
                    <strong>{formatInr(calcResult.total)}</strong>
                    {calcResult.total < calcResult.target && (
                      <span> (short of target by {formatInr(calcResult.target - calcResult.total)})</span>
                    )}
                    .
                  </Alert>
                )}

                {/* Calculation Output Data */}
                {!calcResult.err && !calcResult.inel && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* 5 KPI Metric Cards */}
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4} md={2.4}>
                        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant='caption' color='text.secondary'>
                            Total Disbursed
                          </Typography>
                          <Typography variant='subtitle1' fontWeight={700} color='text.primary' sx={{ mt: 0.5 }}>
                            {formatInr(calcResult.total)}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6} sm={4} md={2.4}>
                        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant='caption' color='text.secondary'>
                            Eligibility Target
                          </Typography>
                          <Typography variant='subtitle1' fontWeight={700} color='text.primary' sx={{ mt: 0.5 }}>
                            {formatInr(calcResult.target)}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6} sm={4} md={2.4}>
                        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant='caption' color='text.secondary'>
                            Extra Amount (Base)
                          </Typography>
                          <Typography variant='subtitle1' fontWeight={700} color='text.primary' sx={{ mt: 0.5 }}>
                            {formatInr(calcResult.extra)}
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={6} sm={4} md={2.4}>
                        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2 }}>
                          <Typography variant='caption' color='text.secondary'>
                            Incentive Rate
                          </Typography>
                          <Typography variant='subtitle1' fontWeight={700} color='text.primary' sx={{ mt: 0.5 }}>
                            0.60%
                          </Typography>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} sm={4} md={2.4}>
                        <Paper
                          variant='outlined'
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            borderColor: alpha(theme.palette.primary.main, 0.3)
                          }}
                        >
                          <Typography variant='caption' color='primary.main' fontWeight={600}>
                            Total Incentive Pool
                          </Typography>
                          <Typography variant='subtitle1' fontWeight={800} color='primary.main' sx={{ mt: 0.5 }}>
                            {formatInr(calcResult.pool)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Hero Highlight Banner */}
                    {calcResult.rows && calcResult.rows.length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(
                            theme.palette.primary.dark || '#5b21b6',
                            0.95
                          )} 100%)`,
                          color: '#ffffff'
                        }}
                      >
                        <Typography variant='body2' sx={{ opacity: 0.9 }}>
                          Loan Originator Incentive for the Month ({calcResult.rows[0].r})
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant='h4' fontWeight={800} sx={{ color: '#fff' }}>
                            {formatInr(calcResult.rows[0].a)}
                          </Typography>
                          <Typography variant='body2' sx={{ opacity: 0.9 }}>
                            ·{' '}
                            {calcResult.pool > 0
                              ? ((calcResult.rows[0].a / calcResult.pool) * 100).toFixed(2) + '%'
                              : '—'}{' '}
                            of {formatInr(calcResult.pool)} Pool
                          </Typography>
                        </Box>
                      </Paper>
                    )}

                    {/* Table 1: Combined Incentive Breakdown */}
                    <Box>
                      <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 1.5 }}>
                        Combined Incentive Breakdown
                      </Typography>
                      <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                        <Table size='small'>
                          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Responsibility</TableCell>
                              <TableCell align='right' sx={{ fontWeight: 700 }}>
                                Combined Incentive
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 700 }}>
                                Share of Pool
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calcResult.rows?.map((x: any, idx: number) => {
                              const isOrig = x.resp === 'Loan Originator'
                              const share =
                                calcResult.pool > 0
                                  ? ((x.a / calcResult.pool) * 100).toFixed(2) + '%'
                                  : '—'
                              return (
                                <TableRow
                                  key={idx}
                                  sx={{
                                    bgcolor: isOrig ? alpha(theme.palette.primary.main, 0.08) : undefined,
                                    '&:last-child td, &:last-child th': { border: 0 }
                                  }}
                                >
                                  <TableCell sx={{ fontWeight: isOrig ? 700 : 500 }}>
                                    {x.r} {isOrig && <Chip label='Originator' size='small' color='primary' sx={{ ml: 1, height: 20, fontSize: 11 }} />}
                                  </TableCell>
                                  <TableCell>{x.resp}</TableCell>
                                  <TableCell align='right' sx={{ fontWeight: 700, color: isOrig ? 'primary.main' : 'text.primary' }}>
                                    {formatInr(x.a)}
                                  </TableCell>
                                  <TableCell align='right' sx={{ color: 'text.secondary' }}>
                                    {share}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                            <TableRow sx={{ bgcolor: alpha(theme.palette.action.hover, 0.3) }}>
                              <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                              <TableCell sx={{ color: 'text.secondary' }}>—</TableCell>
                              <TableCell align='right' sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {formatInr(calcResult.rows?.reduce((s: number, x: any) => s + x.a, 0) || 0)}
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 800 }}>
                                {calcResult.pool > 0 ? '100%' : '—'}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Table 2: Disbursal-wise detail */}
                    <Box>
                      <Typography variant='subtitle2' fontWeight={700}>
                        Disbursal-Wise Detail
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
                        Incentive counts only after the salary target is reached, filling in the order of the disbursals.
                      </Typography>

                      <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                        <Table size='small'>
                          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                              <TableCell align='right' sx={{ fontWeight: 700 }}>
                                Disbursed
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 700 }}>
                                Counted For Incentive
                              </TableCell>
                              <TableCell align='right' sx={{ fontWeight: 700 }}>
                                Pool
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Loan Originator</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Loan Contributor</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Hierarchy</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calcResult.per?.map((x: any, idx: number) => {
                              const renderRoleList = (arr: any[]) =>
                                arr && arr.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {arr.map((q, qi) => (
                                      <Typography key={qi} variant='caption'>
                                        {q.r}: <strong>{formatInr(q.a)}</strong>
                                      </Typography>
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant='caption' color='text.disabled'>
                                    none
                                  </Typography>
                                )

                              return (
                                <TableRow key={idx} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>{x.n}</TableCell>
                                  <TableCell align='right'>{formatInr(x.lp)}</TableCell>
                                  <TableCell align='right'>{formatInr(x.el)}</TableCell>
                                  <TableCell align='right' sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {formatInr(x.p)}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant='caption'>
                                      {x.orig || orig}: <strong>{formatInr(x.o)}</strong>
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {x.con ? renderRoleList(x.cr || []) : <Typography variant='caption' color='text.disabled'>none</Typography>}
                                  </TableCell>
                                  <TableCell>{renderRoleList(x.hr || [])}</TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Save Record Action */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant='contained'
                        color='primary'
                        startIcon={<SaveIcon />}
                        onClick={handleSaveLoanRecord}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Save Monthly Record with Applied Rule
                      </Button>
                      {saveLoanSuccess && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={saveLoanSuccess}
                          color='success'
                          variant='outlined'
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ============================================================== */}
      {/* TAB 1: COMMISSION SETTINGS */}
      {/* ============================================================== */}
      {activeTab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Alert severity='info' sx={{ mb: 1 }}>
              Administrator Area (stored in this browser). The Loan Originator (RE, Individual TL, Individual Manager, TL, Manager or ASM) receives whatever is left after the Contributor and Hierarchy shares.
            </Alert>
          </Grid>

          <Grid item xs={12}>
            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <CardHeader
                title='Commission Rule Configuration'
                subheader='Define baseline share percentages across roles'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Loan Contributor %'
                      helperText='Always paid when a Contributor is selected'
                      value={cfgC}
                      onChange={e => {
                        setCfgC(e.target.value)
                        setSettingsFeedback(null)
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>%</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Hierarchy Pool %'
                      helperText='Split equally among selected hierarchy roles'
                      value={cfgH}
                      onChange={e => {
                        setCfgH(e.target.value)
                        setSettingsFeedback(null)
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position='end'>%</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size='small'
                      disabled
                      label='Originator % (Remainder)'
                      helperText='Remainder allocated to Loan Originator'
                      value={`${originatorRemainder}%`}
                    />
                  </Grid>
                </Grid>

                <Alert
                  severity={originatorRemainder >= 0 ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                >
                  {originatorRemainder >= 0
                    ? `Originator receives ${originatorRemainder}% when both Contributor and Hierarchy are selected. (Total equals 100% ✓)`
                    : 'Contributor % + Hierarchy % exceed 100%! Please adjust the values.'}
                </Alert>

                <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.2) }}>
                  <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.8 }}>
                    <strong>Standard Company Incentive Rule:</strong><br />
                    1) <strong>Only RE:</strong> RE receives <strong>100%</strong> of the incentive pool (when no Contributor &amp; no Hierarchy).<br />
                    2) <strong>RE + Contributor (TL / Manager / ASM / Director):</strong><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;• <strong>RE (Originator):</strong> <strong>70%</strong><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;• <strong>Contributor:</strong> <strong>20%</strong><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;• <strong>Hierarchy:</strong> <strong>10%</strong> (Split equally among selected hierarchy roles).<br />
                    3) <strong>Director as Contributor:</strong> Allowed to select intermediary roles (TL, Manager, ASM) in Hierarchy.<br />
                    4) <strong>Target Requirement:</strong> Disbursals count towards incentive only on the monthly amount in excess of the salary target (Salary × 200).
                  </Typography>
                </Paper>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<SaveIcon />}
                    onClick={handleSaveCommission}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Save Commission Rule
                  </Button>
                  {settingsFeedback && (
                    <Chip
                      label={settingsFeedback.text}
                      color={settingsFeedback.ok ? 'success' : 'error'}
                      variant='outlined'
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ============================================================== */}
      {/* TAB 2: HISTORY */}
      {/* ============================================================== */}
      {activeTab === 2 && (
        <Grid container spacing={4}>
          {/* Rule Change History */}
          <Grid item xs={12}>
            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <CardHeader
                title='Rule Change History'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                {appState.hist.length > 0 ? (
                  <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                    <Table size='small'>
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Date &amp; Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Before</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>After</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appState.hist.map((item, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {new Date(item.t).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{cfgTxt(item.before)}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {cfgTxt(item.after)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    No rule changes yet. Active rule: <strong>{cfgTxt(appState.cfg)}</strong>
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Saved Loan Records */}
          <Grid item xs={12}>
            <Card variant='outlined' sx={{ borderRadius: 2 }}>
              <CardHeader
                title='Saved Loan Records'
                titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                {appState.loans.length > 0 ? (
                  <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
                    <Table size='small'>
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>
                            Total Loan
                          </TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>
                            Pool
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Scenario</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Applied Rule Snapshot</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appState.loans.map((record, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {new Date(record.t).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell align='right' sx={{ fontWeight: 600 }}>
                              {formatInr(record.loan)}
                            </TableCell>
                            <TableCell align='right' sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {formatInr(record.pool)}
                            </TableCell>
                            <TableCell>{record.scn}</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>
                              {cfgTxt(record.cfg)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant='body2' color='text.secondary'>
                    No loans saved yet. You can save monthly calculations from the Calculator tab.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
