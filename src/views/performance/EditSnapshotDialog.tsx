'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Grid, TextField, Button
} from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

/* ------------ local helpers + axios ------------ */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500',
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
export interface EditSnapshotDialogProps {
  open: boolean;
  onClose: () => void;
  doc: any | null;               // pass mapServerToCardItem(item) ya raw item
  onSaved: () => void;           // refresh callback
  canAdminComment: boolean;      // role === '1'
}

/* ------------ Component ------------ */
export default function EditSnapshotDialog({
  open, onClose, doc, onSaved, canAdminComment
}: EditSnapshotDialogProps) {
  const [tab, setTab] = useState<'morning' | 'evening' | 'meta'>('morning');
  const [saving, setSaving] = useState(false);

  // Common meta
  const [recordId, setRecordId] = useState<string>('');
  const [role, setRole] = useState<'employee' | 'manager'>('employee');
  const [dateISO, setDateISO] = useState<string>('');

  // Employee forms
  const [empMorning, setEmpMorning] = useState({
    phoneConnects: 0,
    physicalMeet: 0,
    expectedLogins: 0,
    expectedApprovals: 0,
    expectedDisbursal: 0,
  });
  const [empEvening, setEmpEvening] = useState({
    phoneConnectsDone: 0,
    physicalMeetDone: 0,
    loginsDone: 0,
    approvalsDone: 0,
    disbursalDone: 0,
  });

  // Manager forms
  const [mgrMorning, setMgrMorning] = useState({
    teamTargetLoanLacs: 0,
    ownContribution: 0,
    teamMembers: '' as string, // comma separated
    meetings: '' as string,    // comma separated
    expected_logins: 0,
    expected_approvals: 0,
    expected_disbursal: 0,
    mtd_login: 0,
    mtd_approvalLacs: 0,
    mtd_disbursalLacs: 0,
  });
  const [mgrEvening, setMgrEvening] = useState({
    teamLoginsDone: 0,
    teamApprovalDoneAmount: 0,
    topPerformerName: '',
    filesStuck: '' as string, // comma separated
    supportRequired: '',
    overallSentiment: '',
  });

  // Admin comment
  const [adminComment, setAdminComment] = useState('');

  /* ---------- hydrate from doc ---------- */
  useEffect(() => {
    if (!doc) return;
    const raw = doc.__raw ? doc.__raw : doc;
    const r: 'employee' | 'manager' = raw?.role;
    setRecordId(raw?._id || '');
    setRole(r);
    setDateISO(raw?.date ? dayjs(raw.date).format('YYYY-MM-DD') : '');

    if (r === 'employee') {
      setEmpMorning({
        phoneConnects: asNum(raw?.re?.morning?.phoneConnects),
        physicalMeet: asNum(raw?.re?.morning?.physicalMeet),
        expectedLogins: asNum(raw?.re?.morning?.expectedLogins),
        expectedApprovals: asNum(raw?.re?.morning?.expectedApprovals),
        expectedDisbursal: asNum(raw?.re?.morning?.expectedDisbursal),
      });
      setEmpEvening({
        phoneConnectsDone: asNum(raw?.re?.evening?.phoneConnectsDone),
        physicalMeetDone: asNum(raw?.re?.evening?.physicalMeetDone),
        loginsDone: asNum(raw?.re?.evening?.loginsDone),
        approvalsDone: asNum(raw?.re?.evening?.approvalsDone),
        disbursalDone: asNum(raw?.re?.evening?.disbursalDone),
      });
    } else {
      setMgrMorning({
        teamTargetLoanLacs: asNum(raw?.manager?.morning?.teamTargetLoanLacs),
        ownContribution: asNum(raw?.manager?.morning?.ownContribution),
        teamMembers: Array.isArray(raw?.manager?.morning?.teamMembers)
          ? raw.manager.morning.teamMembers.map((m: any) => m?.name || m).join(', ')
          : asStr(raw?.manager?.morning?.teamMembers),
        meetings: Array.isArray(raw?.manager?.morning?.meetings)
          ? raw.manager.morning.meetings.join(', ')
          : asStr(raw?.manager?.morning?.meetings),
        expected_logins: asNum(raw?.manager?.morning?.expected?.logins),
        expected_approvals: asNum(raw?.manager?.morning?.expected?.approvals),
        expected_disbursal: asNum(raw?.manager?.morning?.expected?.disbursal),
        mtd_login: asNum(raw?.manager?.morning?.tillDate?.login),
        mtd_approvalLacs: asNum(raw?.manager?.morning?.tillDate?.approvalLacs),
        mtd_disbursalLacs: asNum(raw?.manager?.morning?.tillDate?.disbursalLacs),
      });
      setMgrEvening({
        teamLoginsDone: asNum(raw?.manager?.evening?.teamLoginsDone),
        teamApprovalDoneAmount: asNum(raw?.manager?.evening?.teamApprovalDoneAmount),
        topPerformerName: asStr(raw?.manager?.evening?.topPerformer?.name),
        filesStuck: Array.isArray(raw?.manager?.evening?.filesStuck)
          ? raw.manager.evening.filesStuck.join(', ')
          : asStr(raw?.manager?.evening?.filesStuck),
        supportRequired: asStr(raw?.manager?.evening?.supportRequired),
        overallSentiment: asStr(raw?.manager?.evening?.overallSentiment),
      });
    }
  }, [doc]);

  /* ---------- API helpers ---------- */
  const saveEmployeeMorning = async () => {
    await api.post('/performance/re/morning', {
      id: recordId,
      date: dateISO,
      phoneConnects: asNum(empMorning.phoneConnects),
      physicalMeet: asNum(empMorning.physicalMeet),
      expectedLogins: asNum(empMorning.expectedLogins),
      expectedApprovals: asNum(empMorning.expectedApprovals),
      expectedDisbursal: asNum(empMorning.expectedDisbursal),
    });
  };
  const saveEmployeeEvening = async () => {
    await api.post('/performance/re/evening', {
      id: recordId,
      date: dateISO,
      phoneConnectsDone: asNum(empEvening.phoneConnectsDone),
      physicalMeetDone: asNum(empEvening.physicalMeetDone),
      loginsDone: asNum(empEvening.loginsDone),
      approvalsDone: asNum(empEvening.approvalsDone),
      disbursalDone: asNum(empEvening.disbursalDone),
    });
  };
  const saveManagerMorning = async () => {
    await api.post('/performance/manager/morning', {
      id: recordId,
      date: dateISO,
      teamTargetLoanLacs: asNum(mgrMorning.teamTargetLoanLacs),
      ownContribution: asNum(mgrMorning.ownContribution),
      teamMembers: mgrMorning.teamMembers.split(',').map(s=>s.trim()).filter(Boolean),
      meetings: mgrMorning.meetings.split(',').map(s=>s.trim()).filter(Boolean),
      expected: {
        logins: asNum(mgrMorning.expected_logins),
        approvals: asNum(mgrMorning.expected_approvals),
        disbursal: asNum(mgrMorning.expected_disbursal),
      },
      tillDate: {
        login: asNum(mgrMorning.mtd_login),
        approvalLacs: asNum(mgrMorning.mtd_approvalLacs),
        disbursalLacs: asNum(mgrMorning.mtd_disbursalLacs),
      },
    });
  };
  const saveManagerEvening = async () => {
    await api.post('/performance/manager/evening', {
      id: recordId,
      date: dateISO,
      teamLoginsDone: asNum(mgrEvening.teamLoginsDone),
      teamApprovalDoneAmount: asNum(mgrEvening.teamApprovalDoneAmount),
      topPerformer: { name: asStr(mgrEvening.topPerformerName) },
      filesStuck: mgrEvening.filesStuck.split(',').map(s=>s.trim()).filter(Boolean),
      supportRequired: asStr(mgrEvening.supportRequired),
      overallSentiment: asStr(mgrEvening.overallSentiment),
    });
  };
  const saveAdminComment = async () => {
    if (!canAdminComment || !adminComment.trim()) return;
    await api.post('/performance/admin/comment', {
      id: recordId,
      date: dateISO,
      comment: adminComment.trim(),
    });
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      if (role === 'employee') {
        await saveEmployeeMorning();
        await saveEmployeeEvening();
      } else {
        await saveManagerMorning();
        await saveManagerEvening();
      }
      await saveAdminComment();
      onSaved();
      onClose();
    } catch (e) {
      console.error('Save all failed', e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!doc) return null;

  /* ---------- UI ---------- */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit {role === 'manager' ? 'Manager' : 'Employee'} Snapshot</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="morning" label="Morning (Plan)" />
          <Tab value="evening" label="Evening (Outcome)" />
          <Tab value="meta" label="Meta & Comments" />
        </Tabs>

        {tab === 'morning' && (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {role === 'employee' ? (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Phone Connects" value={empMorning.phoneConnects} onChange={(e)=>setEmpMorning({...empMorning, phoneConnects: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Physical Meet" value={empMorning.physicalMeet} onChange={(e)=>setEmpMorning({...empMorning, physicalMeet: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Expected Logins" value={empMorning.expectedLogins} onChange={(e)=>setEmpMorning({...empMorning, expectedLogins: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Expected Approvals" value={empMorning.expectedApprovals} onChange={(e)=>setEmpMorning({...empMorning, expectedApprovals: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Expected Disbursal" value={empMorning.expectedDisbursal} onChange={(e)=>setEmpMorning({...empMorning, expectedDisbursal: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12}><Button variant="outlined" onClick={saveEmployeeMorning}>Save Morning Only</Button></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Team Target Loan (Lacs)" value={mgrMorning.teamTargetLoanLacs} onChange={(e)=>setMgrMorning({...mgrMorning, teamTargetLoanLacs: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Own Contribution" value={mgrMorning.ownContribution} onChange={(e)=>setMgrMorning({...mgrMorning, ownContribution: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Team Members (comma separated)" value={mgrMorning.teamMembers} onChange={(e)=>setMgrMorning({...mgrMorning, teamMembers: e.target.value})} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Meetings (comma separated)" value={mgrMorning.meetings} onChange={(e)=>setMgrMorning({...mgrMorning, meetings: e.target.value})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Expected Logins" value={mgrMorning.expected_logins} onChange={(e)=>setMgrMorning({...mgrMorning, expected_logins: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Expected Approvals (₹)" value={mgrMorning.expected_approvals} onChange={(e)=>setMgrMorning({...mgrMorning, expected_approvals: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Expected Disbursal (₹)" value={mgrMorning.expected_disbursal} onChange={(e)=>setMgrMorning({...mgrMorning, expected_disbursal: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="MTD Login (tillDate)" value={mgrMorning.mtd_login} onChange={(e)=>setMgrMorning({...mgrMorning, mtd_login: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="MTD Approvals (Lacs)" value={mgrMorning.mtd_approvalLacs} onChange={(e)=>setMgrMorning({...mgrMorning, mtd_approvalLacs: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="MTD Disbursal (Lacs)" value={mgrMorning.mtd_disbursalLacs} onChange={(e)=>setMgrMorning({...mgrMorning, mtd_disbursalLacs: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12}><Button variant="outlined" onClick={saveManagerMorning}>Save Morning Only</Button></Grid>
              </>
            )}
          </Grid>
        )}

        {tab === 'evening' && (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {role === 'employee' ? (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Phone Connects Done" value={empEvening.phoneConnectsDone} onChange={(e)=>setEmpEvening({...empEvening, phoneConnectsDone: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Physical Meet Done" value={empEvening.physicalMeetDone} onChange={(e)=>setEmpEvening({...empEvening, physicalMeetDone: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Logins Done" value={empEvening.loginsDone} onChange={(e)=>setEmpEvening({...empEvening, loginsDone: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Approvals Done" value={empEvening.approvalsDone} onChange={(e)=>setEmpEvening({...empEvening, approvalsDone: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Disbursal Done" value={empEvening.disbursalDone} onChange={(e)=>setEmpEvening({...empEvening, disbursalDone: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12}><Button variant="outlined" onClick={saveEmployeeEvening}>Save Evening Only</Button></Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Team Logins Done" value={mgrEvening.teamLoginsDone} onChange={(e)=>setMgrEvening({...mgrEvening, teamLoginsDone: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Team Approval Done Amount (₹)" value={mgrEvening.teamApprovalDoneAmount} onChange={(e)=>setMgrEvening({...mgrEvening, teamApprovalDoneAmount: asNum(e.target.value)})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Top Performer" value={mgrEvening.topPerformerName} onChange={(e)=>setMgrEvening({...mgrEvening, topPerformerName: e.target.value})} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Files Stuck (comma separated)" value={mgrEvening.filesStuck} onChange={(e)=>setMgrEvening({...mgrEvening, filesStuck: e.target.value})} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Support Required" value={mgrEvening.supportRequired} onChange={(e)=>setMgrEvening({...mgrEvening, supportRequired: e.target.value})} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Overall Sentiment" value={mgrEvening.overallSentiment} onChange={(e)=>setMgrEvening({...mgrEvening, overallSentiment: e.target.value})} /></Grid>
                <Grid item xs={12}><Button variant="outlined" onClick={saveManagerEvening}>Save Evening Only</Button></Grid>
              </>
            )}
          </Grid>
        )}

        {tab === 'meta' && (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Snapshot Date"
                  value={dateISO ? dayjs(dateISO) : null}
                  onChange={(d)=>setDateISO(d ? d.format('YYYY-MM-DD') : '')}
                  slotProps={{ textField: { fullWidth: true } as any }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Role" value={role} InputProps={{ readOnly: true }} />
            </Grid>

            {canAdminComment && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Admin Comment"
                  multiline
                  minRows={3}
                  value={adminComment}
                  onChange={(e)=>setAdminComment(e.target.value)}
                  placeholder="Write a note for this snapshot…"
                />
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        {canAdminComment && (
          <Button onClick={saveAdminComment} disabled={!adminComment.trim() || saving}>
            Save Comment
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={saveAll} disabled={saving}>
          {saving ? 'Saving…' : 'Save All'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
