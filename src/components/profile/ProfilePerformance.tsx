'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Avatar, Chip, Stack, Divider,
    LinearProgress, CircularProgress, Select, MenuItem,
    FormControl, InputLabel, Tab, Tabs,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import BlockIcon from '@mui/icons-material/Block';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LoginIcon from '@mui/icons-material/Login';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CancelIcon from '@mui/icons-material/Cancel';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import dayjs from 'dayjs';

/* ── helpers ── */
const asNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (p = 0, d = 0) => {
    if (!p) return d > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((d / p) * 100)));
};
const inr = (n: number) => `₹${Intl.NumberFormat('en-IN').format(n || 0)}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const getMeta = (status?: string) => {
    if (status === 'done') return { chip: 'success' as const, icon: <CheckCircleIcon fontSize="small" />, label: 'Done', bar: '#4caf50' };
    if (status === 'in_progress') return { chip: 'warning' as const, icon: <PendingIcon fontSize="small" />, label: 'In Progress', bar: '#ff9800' };
    return { chip: 'default' as const, icon: <BlockIcon fontSize="small" />, label: 'Planned', bar: '#9e9e9e' };
};

/* ── KPI tile ── */
function KpiTile({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
    return (
        <Box sx={{
            flex: '1 1 30%', minWidth: 0, p: 1.5, borderRadius: 2.5, background: bg,
            color: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            transition: 'transform .2s', '&:hover': { transform: 'translateY(-2px)' },
        }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                <Box sx={{ flexShrink: 0, width: 28, height: 28, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.9, lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {label}
                </Typography>
            </Stack>
            <Typography sx={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value}
            </Typography>
        </Box>
    );
}

/* ── Month/Year selector row ── */
function MonthYearPicker({ month, year, setMonth, setYear, years }: any) {
    return (
        <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2.5}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Month</InputLabel>
                <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
                </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>Year</InputLabel>
                <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                    {years.map((y: number) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
            </FormControl>
        </Stack>
    );
}

/* ── Empty placeholder ── */
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <Box sx={{ py: 6, textAlign: 'center', border: '1.5px dashed', borderColor: 'divider', borderRadius: 3 }}>
            <Box sx={{ color: 'text.disabled', mb: 1, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
            <Typography color="text.secondary" variant="body2">{text}</Typography>
        </Box>
    );
}

/* ═══════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════ */
interface Props { profileId: string; employeeCode?: string; }

export default function ProfilePerformance({ profileId, employeeCode }: Props) {
    const now = new Date();
    const [tab, setTab] = useState(0);
    const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

    /* Self-added state */
    const [selfItems, setSelfItems] = useState<any[]>([]);
    const [selfLoading, setSelfLoading] = useState(false);
    const [selfMonth, setSelfMonth] = useState(now.getMonth() + 1);
    const [selfYear, setSelfYear] = useState(now.getFullYear());

    /* Upload state */
    const [uploadRows, setUploadRows] = useState<any[]>([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadMonth, setUploadMonth] = useState(now.getMonth() + 1);
    const [uploadYear, setUploadYear] = useState(now.getFullYear());

    /* ── fetch self-added ── */
    useEffect(() => {
        if (!profileId) return;
        setSelfLoading(true);
        const token = localStorage.getItem('token') || '';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const params = new URLSearchParams({ employee_id: profileId, month: String(selfMonth), year: String(selfYear), page: '1', limit: '31' });
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/performance/list?${params}`, {
            headers: { Authorization: `Bearer ${token}`, 'x-company-id': user?.company_id || '' },
        })
            .then(r => r.json())
            .then(json => {
                let data: any[] = [];
                if (Array.isArray(json?.data)) {
                    if (json.data[0]?.records) json.data.forEach((g: any) => (g.records || []).forEach((r: any) => { if (!r.employee) r.employee = g.employee; data.push(r); }));
                    else data = json.data;
                }
                data = data.filter(d => String(d?.employee?._id || d?.employee_id || '').trim() === profileId.trim());
                data.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
                setSelfItems(data);
            })
            .catch(() => setSelfItems([]))
            .finally(() => setSelfLoading(false));
    }, [profileId, selfMonth, selfYear]);

    /* ── fetch uploaded ── */
    useEffect(() => {
        if (!employeeCode) return;
        setUploadLoading(true);
        const token = localStorage.getItem('token') || '';
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const company_id = user?.company_id || '';
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/performance-upload/get-performance?company_id=${company_id}&search=${employeeCode}`, {
            headers: { Authorization: `Bearer ${token}`, 'x-company-id': company_id },
        })
            .then(r => r.json())
            .then(raw => {
                const list: any[] = Array.isArray(raw) ? raw : raw?.data || [];
                const norm = list.map(r => ({
                    ...r,
                    login: Number(r.login ?? r.total_logins ?? 0),
                    approval: Number(r.approval ?? r.approval_amount ?? 0),
                    disbursal: Number(r.disbursal ?? r.disbursal_amount ?? 0),
                    rejected: Number(r.rejected ?? r.total_rejected ?? 0),
                    hold: Number(r.hold ?? r.total_hold ?? 0),
                    drop: Number(r.drop ?? r.drop_amount ?? 0),
                    cashback: Number(r.cashback ?? r.cashback_amount ?? 0),
                    gross_approval: Number(r.gross_approval ?? r.grossApproval ?? 0),
                    gross_disbursal: Number(r.gross_disbursal ?? r.grossDisbursal ?? 0),
                    code: String(r.code ?? '').trim(),
                }));
                const filtered = norm.filter(r => {
                    const d = dayjs(r.date);
                    return r.code.toLowerCase() === employeeCode.toLowerCase()
                        && d.month() + 1 === uploadMonth && d.year() === uploadYear;
                });
                filtered.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
                setUploadRows(filtered);
            })
            .catch(() => setUploadRows([]))
            .finally(() => setUploadLoading(false));
    }, [employeeCode, uploadMonth, uploadYear]);

    /* ── aggregate upload rows by date ── */
    const byDate = useMemo(() => {
        const map: Record<string, any> = {};
        uploadRows.forEach(r => {
            if (!map[r.date]) map[r.date] = { date: r.date, login: 0, approval: 0, disbursal: 0, rejected: 0, hold: 0, drop: 0, cashback: 0, gross_approval: 0, gross_disbursal: 0 };
            ['login', 'approval', 'disbursal', 'rejected', 'hold', 'drop', 'cashback', 'gross_approval', 'gross_disbursal'].forEach(k => { map[r.date][k] += (r[k] || 0); });
        });
        return Object.values(map).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    }, [uploadRows]);

    const totals = useMemo(() => {
        const sum = (k: string) => byDate.reduce((s, r) => s + (r[k] || 0), 0);
        return { login: sum('login'), approval: sum('approval'), disbursal: sum('disbursal'), rejected: sum('rejected'), hold: sum('hold'), drop: sum('drop') };
    }, [byDate]);

    return (
        /* OUTER: full width, clips overflow */
        <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Typography variant="h5" fontWeight={800} color="primary" mb={2}>Performance</Typography>

            {/* Section tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
                    <Tab icon={<AssignmentIndIcon fontSize="small" />} iconPosition="start" label="Self-Added" />
                    <Tab icon={<UploadFileIcon fontSize="small" />} iconPosition="start" label="Excel Uploaded" />
                </Tabs>
            </Box>

            {/* ─── SELF-ADDED ─── */}
            {tab === 0 && (
                <Box sx={{ width: '100%', minWidth: 0 }}>
                    <MonthYearPicker month={selfMonth} year={selfYear} setMonth={setSelfMonth} setYear={setSelfYear} years={years} />
                    {selfLoading
                        ? <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
                        : selfItems.length === 0
                            ? <Empty icon={<AssignmentIndIcon sx={{ fontSize: 48 }} />} text={`No self-added performance for ${MONTHS[selfMonth - 1]} ${selfYear}.`} />
                            : <Stack spacing={2}>{selfItems.map(doc => <SelfCard key={doc._id} doc={doc} />)}</Stack>
                    }
                </Box>
            )}

            {/* ─── EXCEL UPLOADED ─── */}
            {tab === 1 && (
                <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                    {!employeeCode
                        ? <Empty icon={<UploadFileIcon sx={{ fontSize: 48 }} />} text="Employee code not available." />
                        : (
                            <>
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" mb={2.5} alignItems="center">
                                    <FormControl size="small" sx={{ minWidth: 130 }}>
                                        <InputLabel>Month</InputLabel>
                                        <Select label="Month" value={uploadMonth} onChange={e => setUploadMonth(Number(e.target.value))}>
                                            {MONTHS.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 90 }}>
                                        <InputLabel>Year</InputLabel>
                                        <Select label="Year" value={uploadYear} onChange={e => setUploadYear(Number(e.target.value))}>
                                            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Chip label={`Code: ${employeeCode}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                                </Stack>

                                {uploadLoading
                                    ? <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
                                    : byDate.length === 0
                                        ? <Empty icon={<UploadFileIcon sx={{ fontSize: 48 }} />} text={`No uploaded data for ${MONTHS[uploadMonth - 1]} ${uploadYear}.`} />
                                        : (
                                            <>
                                                {/* KPI tiles — flex wrap, no negative margins */}
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3, width: '100%', boxSizing: 'border-box' }}>
                                                    <KpiTile label="Total Logins" value={String(totals.login)} icon={<LoginIcon sx={{ fontSize: 16, color: '#fff' }} />} bg="linear-gradient(135deg,#1E3368,#3B5998)" />
                                                    <KpiTile label="Net Approval" value={inr(totals.approval)} icon={<ThumbUpIcon sx={{ fontSize: 16, color: '#fff' }} />} bg="linear-gradient(135deg,#2e7d32,#43a047)" />
                                                    <KpiTile label="Net Disbursal" value={inr(totals.disbursal)} icon={<AccountBalanceWalletIcon sx={{ fontSize: 16, color: '#fff' }} />} bg="linear-gradient(135deg,#0277bd,#0288d1)" />
                                                    <KpiTile label="Rejected" value={String(totals.rejected)} icon={<CancelIcon sx={{ fontSize: 16, color: '#fff' }} />} bg="linear-gradient(135deg,#c62828,#e53935)" />
                                                    <KpiTile label="Hold" value={String(totals.hold)} icon={<PauseCircleIcon sx={{ fontSize: 16, color: '#fff' }} />} bg="linear-gradient(135deg,#e65100,#f57c00)" />
                                                    <KpiTile label="Drop" value={inr(totals.drop)} icon={<RemoveCircleIcon sx={{ fontSize: 16, color: '#fff' }} />} bg="linear-gradient(135deg,#6a1b9a,#8e24aa)" />
                                                </Box>

                                                {/* Table — horizontal scroll container */}
                                                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                                                    Daily Breakdown — {uploadRows.length} entries across {byDate.length} days
                                                </Typography>
                                                <Box sx={{ width: '100%', overflowX: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                                    <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                        <thead>
                                                            <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
                                                                {['Date', 'Logins', 'Approved', 'Disbursed', 'Rejected', 'Hold', 'Drop', 'Cashback'].map(h => (
                                                                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#5c39d4', whiteSpace: 'nowrap', borderBottom: '1px solid #e0e0e0' }}>{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {byDate.map((row, i) => (
                                                                <tr key={row.date} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9fb' }}>
                                                                    <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #f0f0f0' }}>
                                                                        {dayjs(row.date).format('DD MMM YYYY')}
                                                                    </td>
                                                                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>
                                                                        <span style={{ background: '#e8f0fe', color: '#1a56db', fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>{row.login}</span>
                                                                    </td>
                                                                    <td style={{ padding: '9px 12px', color: '#2e7d32', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{inr(row.approval)}</td>
                                                                    <td style={{ padding: '9px 12px', color: '#0277bd', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{inr(row.disbursal)}</td>
                                                                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>
                                                                        {row.rejected > 0
                                                                            ? <span style={{ background: '#fde8e8', color: '#c62828', fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>{row.rejected}</span>
                                                                            : <span style={{ color: '#bbb' }}>—</span>}
                                                                    </td>
                                                                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>
                                                                        {row.hold > 0
                                                                            ? <span style={{ background: '#fff3e0', color: '#e65100', fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>{row.hold}</span>
                                                                            : <span style={{ color: '#bbb' }}>—</span>}
                                                                    </td>
                                                                    <td style={{ padding: '9px 12px', color: '#6a1b9a', fontWeight: 600, borderBottom: '1px solid #f0f0f0' }}>{row.drop ? inr(row.drop) : '—'}</td>
                                                                    <td style={{ padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>{row.cashback ? inr(row.cashback) : '—'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </Box>
                                            </>
                                        )
                                }
                            </>
                        )
                    }
                </Box>
            )}
        </Box>
    );
}

/* ─── Self-Added Card ─── */
function SelfCard({ doc }: { doc: any }) {
    const role = doc.role;
    const emp = doc.employee;
    const em = doc.re?.morning || {};
    const ee = doc.re?.evening || {};
    const mm = doc.manager?.morning || {};
    const me = mm?.expected || {};
    const mo = mm?.ownContribution || {};
    const mev = doc.manager?.evening || {};

    const planLogin = role === 'manager' ? asNum(me.loginsTeam) + asNum(mo.login) : asNum(em.expectedLogins);
    const planAppr = role === 'manager' ? asNum(me.approvalLacs) + asNum(mo.approvalLacs) : asNum(em.expectedApprovals);
    const planDisb = role === 'manager' ? asNum(me.disbursalAmount) + asNum(mo.disbursalLacs) : asNum(em.expectedDisbursal);
    const planPhone = role === 'manager' ? asNum(mm.customerPhoneConnects) : asNum(em.phoneConnects);
    const planMeet = role === 'manager' ? asNum(mm.physicalMeet) : asNum(em.physicalMeet);

    const doneLogin = role === 'manager' ? asNum(mev.teamLoginsDone) : asNum(ee.loginsDone);
    const doneAppr = role === 'manager' ? asNum(mev.teamApprovalDoneAmount) : asNum(ee.approvalsDone);
    const doneDisb = role === 'manager' ? asNum((mev as any).teamDisbursalDoneAmount) : asNum(ee.disbursalDone);
    const donePhone = role === 'manager' ? asNum(mev.customerPhoneConnectsDone) : asNum(ee.phoneConnectsDone);
    const doneMeet = role === 'manager' ? asNum(mev.physicalMeetDone) : asNum(ee.physicalMeetDone);

    const loginPct = pct(planLogin, doneLogin);
    const status = doneLogin >= planLogin && planLogin > 0 ? 'done' : (doneLogin > 0 || planLogin > 0) ? 'in_progress' : 'planned';
    const meta = getMeta(status);

    const rows = [
        { label: 'Phone Connects', p: planPhone, d: donePhone, rupee: false },
        { label: 'Physical Meets', p: planMeet, d: doneMeet, rupee: false },
        { label: 'Logins', p: planLogin, d: doneLogin, rupee: false },
        { label: 'Approvals (₹)', p: planAppr, d: doneAppr, rupee: true },
        { label: 'Disbursals (₹)', p: planDisb, d: doneDisb, rupee: true },
    ];

    return (
        <Paper variant="outlined" sx={{
            borderRadius: 3, p: 2, position: 'relative', overflow: 'hidden',
            borderLeft: `4px solid ${meta.bar}`,
            transition: 'box-shadow .2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.1)' },
        }}>
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                <Avatar src={emp?.image || ''} sx={{ width: 38, height: 38, border: `2px solid ${meta.bar}` }} />
                <Box minWidth={0} flex={1}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                        {emp?.first_name || ''} {emp?.last_name || ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {role === 'manager' ? 'Manager' : emp?.designation || 'Employee'}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexShrink={0}>
                    <Chip size="small" icon={meta.icon} label={meta.label} color={meta.chip} sx={{ borderRadius: 999 }} />
                    {doc.date && <Chip size="small" icon={<CalendarMonthIcon />} label={dayjs(doc.date).format('DD MMM YY')} variant="outlined" sx={{ borderRadius: 999 }} />}
                </Stack>
            </Stack>

            <Divider sx={{ mb: 1.5 }} />

            {/* Morning vs Evening — native table for zero extra width */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '4px 6px', color: '#64748b', fontWeight: 600 }}>Metric</th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', color: '#3b82f6', fontWeight: 700 }}>
                            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.4}>
                                <HourglassBottomIcon sx={{ fontSize: 13 }} />
                                <span>Plan</span>
                            </Stack>
                        </th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', color: '#22c55e', fontWeight: 700 }}>
                            <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.4}>
                                <TrendingUpOutlinedIcon sx={{ fontSize: 13 }} />
                                <span>Done</span>
                            </Stack>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.label} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '5px 6px', color: '#475569' }}>{r.label}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600 }}>{r.rupee ? inr(r.p) : r.p}</td>
                            <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700, color: r.d >= r.p && r.p > 0 ? '#16a34a' : '#dc2626' }}>
                                {r.rupee ? inr(r.d) : r.d}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Progress bar */}
            <Box mt={1.5}>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">Login Achievement</Typography>
                    <Typography variant="caption" fontWeight={700}>{loginPct}%</Typography>
                </Stack>
                <LinearProgress
                    variant="determinate" value={Math.min(loginPct, 100)}
                    sx={{ height: 7, borderRadius: 4 }}
                    color={loginPct >= 100 ? 'success' : loginPct >= 50 ? 'warning' : 'error'}
                />
            </Box>
        </Paper>
    );
}
