'use client';

import React, { useState } from 'react';

import type { SelectChangeEvent } from '@mui/material';
import {
  Box, Container, Grid, Paper, Typography, Divider, Button, TextField, MenuItem,
  FormControl, InputLabel, Select, Chip, ToggleButtonGroup, ToggleButton,
  IconButton, Switch, FormControlLabel, Tooltip, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NightlightIcon from '@mui/icons-material/Nightlight';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';

/* ---------------- axios ---------------- */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || '';
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    const company_id =
      user?.company_id ?? user?.companyId ?? user?.company?._id ?? user?.company?.id;

    if (token) (config.headers as any).Authorization = `Bearer ${token}${company_id ? ` ${company_id}` : ''}`;
    if (company_id) (config.headers as any)['x-company-id'] = company_id;
  }


  return config;
});

/* ---------------- helpers ---------------- */
const todayISO = () => new Date().toISOString().split('T')[0];
const countOptions = Array.from({ length: 51 }, (_, i) => i);      // 0..50
const smallCountOptions = Array.from({ length: 11 }, (_, i) => i); // 0..10
const amountLacsOptions = [0, 1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100];

const amountRupeesOptions = [
  0, 100000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 2500000, 5000000, 10000000,
];

const clientTypes = [
  { value: 'cold', label: 'Cold' },
  { value: 'call', label: 'Call' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'channel_partner', label: 'Channel Partner Visit' },
];

/* ---------------- types ---------------- */
type Mode = 'morning' | 'evening';
type InternalRow = { count: number };
type BankerRow = { lenderName: string; lenderContact: string; count: number };
type ClientRow = { type: string; count: number };
type StuckRow = { location: string; reason: string };

/* ---------------- component ---------------- */
export default function ManagerSnapshotForm({ handleClose, onSaved }: { handleClose?: () => void; onSaved?: () => void }) {
  const [mode, setMode] = useState<Mode>('morning');
  const [date, setDate] = useState<string>(todayISO());

  // Snackbar (top-center)
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: 'success' | 'error' | 'info' }>({
    open: false, msg: '', type: 'success'
  });

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => setSnack({ open: true, msg, type });

  /* -------- Morning -------- */
  const [teamTargetLacs, setTeamTargetLacs] = useState<number>(0);
  const [ownLoginCount, setOwnLoginCount] = useState<number>(0);
  const [ownApprovalLacs, setOwnApprovalLacs] = useState<number>(0);
  const [ownDisbursalLacs, setOwnDisbursalLacs] = useState<number>(0);
  const [activeHeadcount, setActiveHeadcount] = useState<number>(0);

  // Meetings — ALL TOGETHER in same card now
  const [hasInternal, setHasInternal] = useState(false);
  const [hasBanker, setHasBanker] = useState(false);
  const [hasClient, setHasClient] = useState(false);

  const [internalList, setInternalList] = useState<InternalRow[]>([]);
  const [bankerList, setBankerList] = useState<BankerRow[]>([]);
  const [clientList, setClientList] = useState<ClientRow[]>([]);

  const addInternal = () => setInternalList(p => [...p, { count: 0 }]);

  const updateInternal = (i: number, count: number) =>
    setInternalList(p => p.map((r, idx) => (idx === i ? { ...r, count } : r)));

  const removeInternal = (i: number) => setInternalList(p => p.filter((_, idx) => idx !== i));

  const addBanker = () => setBankerList(p => [...p, { lenderName: '', lenderContact: '', count: 0 }]);

  const updateBanker = (i: number, key: keyof BankerRow, val: string | number) =>
    setBankerList(p => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const removeBanker = (i: number) => setBankerList(p => p.filter((_, idx) => idx !== i));

  const addClient = () => setClientList(p => (p.length < 3 ? [...p, { type: 'cold', count: 0 }] : p));

  const updateClient = (i: number, key: keyof ClientRow, val: string | number) =>
    setClientList(p => p.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const removeClient = (i: number) => setClientList(p => p.filter((_, idx) => idx !== i));

  const [expectedLogins, setExpectedLogins] = useState<number>(0);
  const [expectedApprovalLacs, setExpectedApprovalLacs] = useState<number>(0);
  const [expectedDisbursalAmount, setExpectedDisbursalAmount] = useState<number>(0); // ₹
  const [tillDateLogin, setTillDateLogin] = useState<number>(0);
  const [tillDateApprovalLacs, setTillDateApprovalLacs] = useState<number>(0);
  const [tillDateDisbursalLacs, setTillDateDisbursalLacs] = useState<number>(0);

  /* -------- Evening -------- */
  const [teamLoginsDone, setTeamLoginsDone] = useState<number>(0);
  const [teamApprovalDoneAmount, setTeamApprovalDoneAmount] = useState<number>(0); // ₹
  const [topPerformerName, setTopPerformerName] = useState<string>('');
  const [topPerformerValueLacs, setTopPerformerValueLacs] = useState<number>(0);
  const [filesStuck, setFilesStuck] = useState<StuckRow[]>([]);
  const [supportRequired, setSupportRequired] = useState<string>('');
  const [overallSentiment, setOverallSentiment] = useState<'green' | 'yellow' | 'red'>('green');
  const [sentimentReason, setSentimentReason] = useState<string>('');

  const addStuck = () => setFilesStuck((p) => [...p, { location: '', reason: '' }]);

  const updateStuck = (i: number, key: keyof StuckRow, val: string) =>
    setFilesStuck((p) => p.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const removeStuck = (i: number) => setFilesStuck(p => p.filter((_, idx) => idx !== i));

  /* -------- Submit handlers (show snackbar) -------- */
  const saveMorning = async () => {
    const totalInternal = hasInternal ? internalList.reduce((a, r) => a + (r.count || 0), 0) : 0;
    const totalBankers = hasBanker ? bankerList.reduce((a, r) => a + (r.count || 0), 0) : 0;
    const totalClients = hasClient ? clientList.reduce((a, r) => a + (r.count || 0), 0) : 0;

    const bankerDetails = hasBanker
      ? bankerList
        .map(b => ({ lenderName: b.lenderName?.trim() || '', lenderContact: b.lenderContact?.trim() || '', count: b.count || 0 }))
        .filter(b => b.lenderName || b.lenderContact || b.count > 0)
      : [];

    const clientDetails = hasClient
      ? clientList.map(c => ({ type: c.type, count: c.count || 0 })).filter(c => c.count > 0)
      : [];

    const morning = {
      teamTargetLoanLacs: teamTargetLacs,
      ownContribution: { login: ownLoginCount, approvalLacs: ownApprovalLacs, disbursalLacs: ownDisbursalLacs },
      teamMembers: { working: activeHeadcount, total: activeHeadcount },
      meetings: { internal: totalInternal, bankers: totalBankers, clients: totalClients, bankerDetails, clientDetails },
      expected: { loginsTeam: expectedLogins, approvalLacs: expectedApprovalLacs, disbursalAmount: expectedDisbursalAmount },
      tillDate: { login: tillDateLogin, approvalLacs: tillDateApprovalLacs, disbursalLacs: tillDateDisbursalLacs },
    };

    try {
      await api.post('/performance/manager', { date, morning });
      notify('✅ Morning snapshot saved', 'success');
      onSaved?.();
      handleClose?.();
    } catch (e: any) {
      notify(e?.response?.data?.message || '❌ Failed to save morning snapshot', 'error');
    }
  };

  const saveEvening = async () => {
    if ((overallSentiment === 'yellow' || overallSentiment === 'red') && !sentimentReason.trim()) {
      notify('Please add a short reason for Yellow/Red sentiment.', 'info');

      return;
    }

    const evening = {
      teamLoginsDone,
      teamApprovalDoneAmount,
      topPerformer: { name: topPerformerName.trim(), valueLacs: topPerformerValueLacs },
      filesStuck: filesStuck.map(f => ({ location: f.location.trim(), reason: f.reason.trim() })).filter(f => f.location || f.reason),
      supportRequired: supportRequired.trim(),
      overallSentiment,
      sentimentReason: sentimentReason.trim() || null,
    };

    try {
      await api.post('/performance/manager', { date, evening });
      notify('🌇 Evening snapshot saved', 'success');
      onSaved?.();
      handleClose?.();
    } catch (e: any) {
      notify(e?.response?.data?.message || '❌ Failed to save evening snapshot', 'error');
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Box sx={{
      py: 2, background:
        'radial-gradient(900px 420px at 10% -10%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(800px 420px at 90% -20%, rgba(236,72,153,0.07), transparent 60%)'
    }}>
      <Container maxWidth="lg">
        {/* Header + controls */}
        <Paper elevation={0} sx={{
          p: { xs: 2, md: 3 }, mb: 2.5, borderRadius: 4, color: 'white',

        }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>TL / Manager — Daily Snapshot</Typography>
          <Grid container spacing={2} sx={{ mt: 1.5 }} alignItems="center">
            <Grid item>
              <TextField size="small" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ bgcolor: 'white', borderRadius: 1 }} />
            </Grid>
            <Grid item>
              <ToggleButtonGroup exclusive value={mode} onChange={(_, v) => v && setMode(v)} size="small" color="secondary">
                <ToggleButton value="morning"><ScheduleIcon sx={{ mr: .6 }} />Morning</ToggleButton>
                <ToggleButton value="evening"><NightlightIcon sx={{ mr: .6 }} />Evening</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item><Chip label="v2" size="small" sx={{ bgcolor: 'rgba(255,255,255,.25)', color: 'white' }} /></Grid>
          </Grid>
        </Paper>

        {/* MORNING — single card with meetings inside */}
        {mode === 'morning' && (
          <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            {/* Team Target */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>1) Team Target (Lacs)</Typography>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Team Target</InputLabel>
                  <Select label="Team Target" value={String(teamTargetLacs)} onChange={(e: SelectChangeEvent<string>) => setTeamTargetLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Own Contribution (three fields) */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>2) Own Contribution</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Login — How many?</InputLabel>
                  <Select label="Login — How many?" value={String(ownLoginCount)} onChange={(e: SelectChangeEvent<string>) => setOwnLoginCount(Number(e.target.value))}>
                    {smallCountOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Approval (Lacs)</InputLabel>
                  <Select label="Approval (Lacs)" value={String(ownApprovalLacs)} onChange={(e: SelectChangeEvent<string>) => setOwnApprovalLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Disbursal (Lacs)</InputLabel>
                  <Select label="Disbursal (Lacs)" value={String(ownDisbursalLacs)} onChange={(e: SelectChangeEvent<string>) => setOwnDisbursalLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Headcount */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>3) Total Active Headcount Today</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Active</InputLabel>
                  <Select label="Active" value={String(activeHeadcount)} onChange={(e: SelectChangeEvent<string>) => setActiveHeadcount(Number(e.target.value))}>
                    {countOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/*  MEETINGS — all together here */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>4) Meetings (Internal • Banker • Client)</Typography>

            {/* Internal */}
            <FormControlLabel
              control={<Switch checked={hasInternal} onChange={(e) => { setHasInternal(e.target.checked); if (!e.target.checked) setInternalList([]); }} />}
              label="Internal / Team"
            />
            {hasInternal && (
              <Box sx={{ mb: 1 }}>
                {internalList.map((row, i) => (
                  <Grid container spacing={1.5} key={`int-${i}`} sx={{ mb: 1 }}>
                    <Grid item xs={10} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>How many</InputLabel>
                        <Select label="How many" value={String(row.count)} onChange={(e: SelectChangeEvent<string>) => updateInternal(i, Number(e.target.value))}>
                          {smallCountOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2} md="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title="Remove"><IconButton color="error" onClick={() => removeInternal(i)}><DeleteOutlineIcon /></IconButton></Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addInternal}>Add Internal</Button>
              </Box>
            )}

            {/* Banker */}
            <FormControlLabel
              control={<Switch checked={hasBanker} onChange={(e) => { setHasBanker(e.target.checked); if (!e.target.checked) setBankerList([]); }} />}
              label="Banker / Partner"
            />
            {hasBanker && (
              <Box sx={{ mb: 1 }}>
                {bankerList.map((row, i) => (
                  <Grid container spacing={1.5} key={`bank-${i}`} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={3}><TextField size="small" fullWidth label="Lender Name" value={row.lenderName} onChange={(e) => updateBanker(i, 'lenderName', e.target.value)} /></Grid>
                    <Grid item xs={12} md={3}><TextField size="small" fullWidth label="Lender Contact" value={row.lenderContact} onChange={(e) => updateBanker(i, 'lenderContact', e.target.value)} /></Grid>
                    <Grid item xs={10} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>How many</InputLabel>
                        <Select label="How many" value={String(row.count)} onChange={(e: SelectChangeEvent<string>) => updateBanker(i, 'count', Number(e.target.value))}>
                          {smallCountOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2} md="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title="Remove"><IconButton color="error" onClick={() => removeBanker(i)}><DeleteOutlineIcon /></IconButton></Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addBanker}>Add Banker</Button>
              </Box>
            )}

            {/* Client */}
            <FormControlLabel
              control={<Switch checked={hasClient} onChange={(e) => { setHasClient(e.target.checked); if (!e.target.checked) setClientList([]); }} />}
              label="Client Interactions"
            />
            {hasClient && (
              <Box>
                {clientList.map((row, i) => (
                  <Grid container spacing={1.5} key={`client-${i}`} sx={{ mb: 1 }}>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Client – Type</InputLabel>
                        <Select label="Client – Type" value={row.type} onChange={(e: SelectChangeEvent<string>) => updateClient(i, 'type', e.target.value)}>
                          {clientTypes.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={10} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>How many</InputLabel>
                        <Select label="How many" value={String(row.count)} onChange={(e: SelectChangeEvent<string>) => updateClient(i, 'count', Number(e.target.value))}>
                          {smallCountOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={2} md="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Tooltip title="Remove"><IconButton color="error" onClick={() => removeClient(i)}><DeleteOutlineIcon /></IconButton></Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addClient} disabled={clientList.length >= 3}>Add Client</Button>
                {clientList.length >= 3 && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(Max 3)</Typography>}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Expected Today */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>5) Expected Today</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Expected Logins (Team)</InputLabel>
                  <Select label="Expected Logins (Team)" value={String(expectedLogins)} onChange={(e: SelectChangeEvent<string>) => setExpectedLogins(Number(e.target.value))}>
                    {countOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Expected Approval (Lacs)</InputLabel>
                  <Select label="Expected Approval (Lacs)" value={String(expectedApprovalLacs)} onChange={(e: SelectChangeEvent<string>) => setExpectedApprovalLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Expected Disbursal (₹)</InputLabel>
                  <Select label="Expected Disbursal (₹)" value={String(expectedDisbursalAmount)} onChange={(e: SelectChangeEvent<string>) => setExpectedDisbursalAmount(Number(e.target.value))}>
                    {amountRupeesOptions.map(v => <MenuItem key={v} value={v}>{v.toLocaleString('en-IN')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Till Date */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Till Date — Snapshot</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Till Date Logins</InputLabel>
                  <Select label="Till Date Logins" value={String(tillDateLogin)} onChange={(e: SelectChangeEvent<string>) => setTillDateLogin(Number(e.target.value))}>
                    {countOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Till Date Approval (Lacs)</InputLabel>
                  <Select label="Till Date Approval (Lacs)" value={String(tillDateApprovalLacs)} onChange={(e: SelectChangeEvent<string>) => setTillDateApprovalLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Till Date Disbursal (Lacs)</InputLabel>
                  <Select label="Till Date Disbursal (Lacs)" value={String(tillDateDisbursalLacs)} onChange={(e: SelectChangeEvent<string>) => setTillDateDisbursalLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button variant="outlined">Cancel</Button>
              <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={saveMorning}
                sx={{ fontWeight: 700, borderRadius: 2, backgroundColor: '#ff902f', '&:hover': { backgroundColor: '#ff7b21' } }}>
                Submit Morning
              </Button>
            </Box>
          </Paper>
        )}

        {/* EVENING */}
        {mode === 'evening' && (
          <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Evening Delivery</Typography>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Team Logins Done</InputLabel>
                  <Select label="Team Logins Done" value={String(teamLoginsDone)} onChange={(e: SelectChangeEvent<string>) => setTeamLoginsDone(Number(e.target.value))}>
                    {countOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Team Approval Done (₹)</InputLabel>
                  <Select label="Team Approval Done (₹)" value={String(teamApprovalDoneAmount)} onChange={(e: SelectChangeEvent<string>) => setTeamApprovalDoneAmount(Number(e.target.value))}>
                    {amountRupeesOptions.map(v => <MenuItem key={v} value={v}>{v.toLocaleString('en-IN')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}><StarIcon sx={{ mr: .6 }} />Top Performer</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField size="small" fullWidth label="Name" value={topPerformerName} onChange={(e) => setTopPerformerName(e.target.value)} /></Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Value (Lacs)</InputLabel>
                  <Select label="Value (Lacs)" value={String(topPerformerValueLacs)} onChange={(e: SelectChangeEvent<string>) => setTopPerformerValueLacs(Number(e.target.value))}>
                    {amountLacsOptions.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 3, mb: 1 }}>Files Stuck & Reasons</Typography>
            {filesStuck.map((row, i) => (
              <Grid container spacing={1.5} key={i} sx={{ mb: 1 }}>
                <Grid item xs={12} md={5}><TextField size="small" fullWidth label="Location / File" value={row.location} onChange={(e) => updateStuck(i, 'location', e.target.value)} /></Grid>
                <Grid item xs={12} md={6}><TextField size="small" fullWidth label="Reason" value={row.reason} onChange={(e) => updateStuck(i, 'reason', e.target.value)} /></Grid>
                <Grid item xs={12} md="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="Remove"><IconButton onClick={() => removeStuck(i)} color="error"><DeleteOutlineIcon /></IconButton></Tooltip>
                </Grid>
              </Grid>
            ))}
            <Button startIcon={<AddIcon />} onClick={addStuck} variant="outlined" sx={{ mt: .5 }}>Add File</Button>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TextField size="small" fullWidth label="Support Required (Tech/Operations/Banker Access)" value={supportRequired} onChange={(e) => setSupportRequired(e.target.value)} multiline rows={2} />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Overall Sentiment</InputLabel>
                  <Select label="Overall Sentiment" value={overallSentiment} onChange={(e: SelectChangeEvent<string>) => setOverallSentiment(e.target.value as any)}>
                    <MenuItem value="green">Green – Targets Achieved</MenuItem>
                    <MenuItem value="yellow">Yellow – Partial Delivery</MenuItem>
                    <MenuItem value="red">Red – Major Gaps</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {overallSentiment !== 'green' && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(255,193,7,0.06)' }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                  {overallSentiment === 'yellow' ? 'What felt off today?' : 'What caused the major gaps today?'}
                </Typography>
                <TextField size="small" fullWidth label={overallSentiment === 'yellow' ? 'Reason (Yellow)' : 'Reason (Red)'} value={sentimentReason} onChange={(e) => setSentimentReason(e.target.value)} multiline rows={2} />
              </Paper>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button variant="outlined">Cancel</Button>
              <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={saveEvening} sx={{ fontWeight: 700, borderRadius: 2 }}>
                Submit Evening
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Snackbar top-center */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
