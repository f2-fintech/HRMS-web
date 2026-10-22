'use client';

import React, { useState } from 'react';

import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Box,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

/* ------------ local helpers + axios ------------ */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || '';

    const companyId =
      localStorage.getItem('company_id') ||
      JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
      '';

    if (!config.headers) config.headers = {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (companyId) config.headers['x-company-id'] = companyId;
  }
  return config;
});

const asNum = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const asStr = (v: any) => (v ?? '').toString();

/* ------------ Props ------------ */
export interface ManagerSnapshotDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void; // refresh callback
}

/* ------------ Component ------------ */
export default function ManagerSnapshotDialog({
  open,
  onClose,
  onSaved,
}: ManagerSnapshotDialogProps) {
  const [saving, setSaving] = useState(false);

  const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs());
  const dateISO = dateValue ? dateValue.format('YYYY-MM-DD') : '';

  // morning / evening toggle
  const [slot, setSlot] = useState<'morning' | 'evening'>('morning');

  // ---------- MANAGER MORNING STATE ----------
  const [mgrMorning, setMgrMorning] = useState({
    teamTargetLoanLacs: 0,

    // Expected team delivery (commitment)
    expected_logins: 0,
    expected_approvalLacs: 0,
    expected_disbursalAmount: 0,

    // Own contribution (manager personally)
    own_login: 0,
    own_approvalLacs: 0,
    own_disbursalLacs: 0,

    // Team members
    team_working: 0,
    team_total: 0,

    // Meetings
    meetings_internal: 0,
    meetings_bankers: 0,
    meetings_clients: 0,

    // Till-date (MTD)
    mtd_login: 0,
    mtd_approvalLacs: 0,
    mtd_disbursalLacs: 0,
  });

  // ---------- MANAGER EVENING STATE ----------
  const [mgrEvening, setMgrEvening] = useState({
    teamLoginsDone: 0,
    teamApprovalDoneAmount: 0,
    teamDisbursalDoneAmount: 0,

    topPerformerName: '',
    topPerformerValueLacs: 0,

    filesStuck: '',
    supportRequired: '',
    overallSentiment: '',
  });

  /* ---------- API helpers ---------- */
  const submitMorning = async () => {
    await api.post('/performance/manager/morning', {
      date: dateISO,
      teamTargetLoanLacs: asNum(mgrMorning.teamTargetLoanLacs),

      expected: {
        loginsTeam: asNum(mgrMorning.expected_logins),
        approvalLacs: asNum(mgrMorning.expected_approvalLacs),
        disbursalAmount: asNum(mgrMorning.expected_disbursalAmount),
      },

      ownContribution: {
        login: asNum(mgrMorning.own_login),
        approvalLacs: asNum(mgrMorning.own_approvalLacs),
        disbursalLacs: asNum(mgrMorning.own_disbursalLacs),
      },

      teamMembers: {
        working: asNum(mgrMorning.team_working),
        total: asNum(mgrMorning.team_total),
      },

      meetings: {
        internal: asNum(mgrMorning.meetings_internal),
        bankers: asNum(mgrMorning.meetings_bankers),
        clients: asNum(mgrMorning.meetings_clients),
      },

      tillDate: {
        login: asNum(mgrMorning.mtd_login),
        approvalLacs: asNum(mgrMorning.mtd_approvalLacs),
        disbursalLacs: asNum(mgrMorning.mtd_disbursalLacs),
      },
    });
  };

  const submitEvening = async () => {
    await api.post('/performance/manager/evening', {
      date: dateISO,
      teamLoginsDone: asNum(mgrEvening.teamLoginsDone),
      teamApprovalDoneAmount: asNum(mgrEvening.teamApprovalDoneAmount),
      teamDisbursalDoneAmount: asNum(mgrEvening.teamDisbursalDoneAmount),

      topPerformer: {
        name: asStr(mgrEvening.topPerformerName),
        valueLacs: asNum(mgrEvening.topPerformerValueLacs),
      },

      filesStuck: mgrEvening.filesStuck
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),

      supportRequired: asStr(mgrEvening.supportRequired),
      overallSentiment: asStr(mgrEvening.overallSentiment),
    });
  };

  const handleSubmit = async () => {
    try {
      if (!dateISO) {
        alert('Please select date');
        return;
      }

      setSaving(true);

      if (slot === 'morning') {
        await submitMorning();
      } else {
        await submitEvening();
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Manager snapshot save failed', err);
      alert('Save failed, please try again');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>TL / Manager — Daily Snapshot</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Top row – Date + Morning/Evening toggle */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                value={dateValue}
                onChange={(d) => setDateValue(d)}
                slotProps={{ textField: { fullWidth: true } as any }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box
              display="flex"
              justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
            >
              <ToggleButtonGroup
                value={slot}
                exclusive
                onChange={(_, v) => v && setSlot(v)}
                size="small"
              >
                <ToggleButton value="morning">Morning</ToggleButton>
                <ToggleButton value="evening">Evening</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>

        {/* ================= MORNING FORM ================= */}
        {slot === 'morning' && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Morning Plan & Commitments
            </Typography>

            <Grid container spacing={2}>
              {/* Team target */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Team Target Loan (Lacs)"
                  value={mgrMorning.teamTargetLoanLacs}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      teamTargetLoanLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Expected Team Delivery */}
              <Grid item xs={12}>
                <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                  Expected Team Delivery (Today)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expected Logins (Team)"
                  value={mgrMorning.expected_logins}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      expected_logins: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expected Approvals (Lacs)"
                  value={mgrMorning.expected_approvalLacs}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      expected_approvalLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expected Disbursal (₹)"
                  value={mgrMorning.expected_disbursalAmount}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      expected_disbursalAmount: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Own contribution */}
              <Grid item xs={12}>
                <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                  Own Contribution (Manager)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Logins (Own)"
                  value={mgrMorning.own_login}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      own_login: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Approvals (Lacs - Own)"
                  value={mgrMorning.own_approvalLacs}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      own_approvalLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Disbursal (Lacs - Own)"
                  value={mgrMorning.own_disbursalLacs}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      own_disbursalLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Team members */}
              <Grid item xs={12}>
                <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                  Team Members
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Working Members"
                  value={mgrMorning.team_working}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      team_working: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Members"
                  value={mgrMorning.team_total}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      team_total: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Meetings Plan */}
              <Grid item xs={12}>
                <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                  Planned Meetings (Count)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Internal"
                  value={mgrMorning.meetings_internal}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      meetings_internal: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Bankers"
                  value={mgrMorning.meetings_bankers}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      meetings_bankers: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Clients"
                  value={mgrMorning.meetings_clients}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      meetings_clients: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Till-date (MTD) */}
              <Grid item xs={12}>
                <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                  MTD Performance (Till Date)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="MTD Login"
                  value={mgrMorning.mtd_login}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      mtd_login: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="MTD Approvals (Lacs)"
                  value={mgrMorning.mtd_approvalLacs}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      mtd_approvalLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="MTD Disbursal (Lacs)"
                  value={mgrMorning.mtd_disbursalLacs}
                  onChange={(e) =>
                    setMgrMorning({
                      ...mgrMorning,
                      mtd_disbursalLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* ================= EVENING FORM ================= */}
        {slot === 'evening' && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Evening Delivery
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Team Logins Done"
                  value={mgrEvening.teamLoginsDone}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      teamLoginsDone: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Team Approval Done (₹)"
                  value={mgrEvening.teamApprovalDoneAmount}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      teamApprovalDoneAmount: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Team Disbursal Done (₹)"
                  value={mgrEvening.teamDisbursalDoneAmount}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      teamDisbursalDoneAmount: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Top performer */}
              <Grid item xs={12}>
                <Typography sx={{ mt: 1, mb: 0.5, fontWeight: 500 }}>
                  Top Performer
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={mgrEvening.topPerformerName}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      topPerformerName: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Value (Lacs)"
                  value={mgrEvening.topPerformerValueLacs}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      topPerformerValueLacs: asNum(e.target.value),
                    })
                  }
                />
              </Grid>

              {/* Files stuck & reasons */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Files Stuck & Reasons (comma separated)"
                  value={mgrEvening.filesStuck}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      filesStuck: e.target.value,
                    })
                  }
                  multiline
                  minRows={2}
                />
              </Grid>

              {/* Support required */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Support Required (Tech / Operations / Banker Access)"
                  value={mgrEvening.supportRequired}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      supportRequired: e.target.value,
                    })
                  }
                  multiline
                  minRows={2}
                />
              </Grid>

              {/* Overall sentiment */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Overall Sentiment (e.g., Green – Targets Achieved)"
                  value={mgrEvening.overallSentiment}
                  onChange={(e) =>
                    setMgrEvening({
                      ...mgrEvening,
                      overallSentiment: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving
            ? slot === 'morning'
              ? 'Submitting Morning…'
              : 'Submitting Evening…'
            : slot === 'morning'
            ? 'Submit Morning'
            : 'Submit Evening'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
