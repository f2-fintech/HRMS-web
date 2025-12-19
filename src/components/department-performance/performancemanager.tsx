'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Drawer,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    Rating,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

import {
    apiPatch,
    apiPost,
    fetchOneDaily,
    fetchOneMonthly,
    monthISO,
    todayISO,
} from './dpApi';

type TeamApi = {
    _id: string;
    name: string;
    code?: string;
    manager_id?: string;
    employee_ids?: string;
    //   tls?: string[];
};

type Employee = {
    _id: string;
    first_name?: string;
    last_name?: string;
    image?: string;
    designation?: string;
    code?: string;
};

const fullName = (e?: Employee | null) =>
    `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || '—';
const isValidMongoId = (v: any) => /^[a-f\d]{24}$/i.test(String(v || '').trim());

const splitIds = (csv?: string) =>
    String(csv || '')
        .split(',')
        .map((x) => x.trim())
        .filter((id) => isValidMongoId(id)); // ✅ only valid ids


export default function PerformanceManager() {
    const dispatch: AppDispatch = useDispatch();
    const { employees } = useSelector((state: RootState) => state.employees);

    const [teams, setTeams] = useState<TeamApi[]>([]);
    const [loadingTeams, setLoadingTeams] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [teamSearch, setTeamSearch] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
    const [filterDate, setFilterDate] = useState(todayISO());
    const [filterMonth, setFilterMonth] = useState(monthISO());

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
        null,
    );

    const [record, setRecord] = useState<any | null>(null);
    const [loadingRecord, setLoadingRecord] = useState(false);

    const [reviewRating, setReviewRating] = useState<number | null>(null);
    const [reviewText, setReviewText] = useState('');

    // ✅ create form toggle
    const [showMyForm, setShowMyForm] = useState(false);

    // ✅ Manager own submission states
    const [myWhatDoneToday, setMyWhatDoneToday] = useState('');
    const [myWhatCompletedToday, setMyWhatCompletedToday] = useState('');
    const [myPlanForThisMonth, setMyPlanForThisMonth] = useState('');
    const [myCompletedThisMonth, setMyCompletedThisMonth] = useState('');
    const [savingMine, setSavingMine] = useState(false);

    const myId = useMemo(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return String(user?.id || user?._id || '');
    }, []);

    // ✅ employees load
    useEffect(() => {
        if (!employees || employees.length === 0) {
            dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }));
        }
    }, [dispatch, employees?.length]);

    // ✅ teams load (manager only)
    useEffect(() => {
        const run = async () => {
            const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
            const token = localStorage.getItem('token') || '';
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const companyId = localStorage.getItem('company_id') || user.company_id || '';

            try {
                setLoadingTeams(true);
                const res = await fetch(`${base}/teams/get-all-teams`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-company-id': companyId,
                    },
                });
                const data = await res.json();

                const list: TeamApi[] = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.teams)
                        ? data.teams
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

                const filtered = list.filter((t) => {
                    const isMgr = String(t.manager_id || '') === myId;
                    //   const isTL = Array.isArray(t.tls) && t.tls.map(String).includes(String(myId));
                    return isMgr;
                });

                setTeams(filtered);
                if (filtered.length > 0) setSelectedTeamId(filtered[0]._id);
            } catch (e) {
                console.log('❌ get-all-teams error', e);
                setTeams([]);
                setSelectedTeamId(null);
            } finally {
                setLoadingTeams(false);
            }
        };

        if (myId) run();
    }, [myId]);

    const empMap = useMemo(() => {
        const m = new Map<string, Employee>();
        (employees || []).forEach((e: any) => e?._id && m.set(String(e._id), e));
        return m;
    }, [employees]);

    const filteredTeams = useMemo(() => {
        const q = teamSearch.trim().toLowerCase();
        if (!q) return teams;
        return teams.filter((t) => {
            const name = String(t?.name || '').toLowerCase();
            const code = String(t?.code || '').toLowerCase();
            return name.includes(q) || code.includes(q);
        });
    }, [teams, teamSearch]);

    const selectedTeam = useMemo(
        () => teams.find((t) => t._id === selectedTeamId) || null,
        [teams, selectedTeamId],
    );

    // ✅ TL members clean (null removed)
    //   const tlMembers = useMemo(() => {
    //     const ids = Array.isArray(selectedTeam?.tls) ? selectedTeam!.tls! : [];
    //     return ids
    //       .map((id) => empMap.get(String(id)) || null)
    //       .filter((x): x is Employee => x !== null);
    //   }, [selectedTeam, empMap]);

    // ✅ memberIds = team + manager himself
    const memberIds = useMemo(() => {
        const ids = splitIds(selectedTeam?.employee_ids);
        if (myId && !ids.includes(myId)) ids.unshift(myId);
        return ids;
    }, [selectedTeam?.employee_ids, myId]);

    // ✅ hasSavedReview => if already rated/reviewed then lock/hide button
    const hasSavedReview = useMemo(() => {
        const r = Number(record?.rating || 0);
        const txt = String(record?.review || '').trim();
        return r > 0 || txt.length > 0;
    }, [record]);

    // ✅ Load selected employee record
    const loadRecord = async () => {
        if (!selectedEmployeeId) {
            setRecord(null);
            return;
        }
        try {
            setLoadingRecord(true);
            const r =
                tab === 'daily'
                    ? await fetchOneDaily(selectedEmployeeId, filterDate)
                    : await fetchOneMonthly(selectedEmployeeId, filterMonth);

            setRecord(r || null);
            setReviewRating(r?.rating ?? null);
            setReviewText(r?.review ?? '');
        } catch (e) {
            console.log(e);
            setRecord(null);
        } finally {
            setLoadingRecord(false);
        }
    };

    useEffect(() => {
        loadRecord();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, filterDate, filterMonth, selectedEmployeeId]);

    // ✅ Manager own record create (Daily)
    const saveMyDaily = async () => {
        try {
            setSavingMine(true);
            await apiPost(`/department-performance/daily`, {
                date: filterDate,
                whatDoneToday: myWhatDoneToday,
                whatCompletedToday: myWhatCompletedToday,
            });
            alert('✅ Your daily saved');

            if (selectedEmployeeId === myId) loadRecord();
            setShowMyForm(false);
        } catch (e: any) {
            alert(`❌ ${e?.message || 'Error'}`);
        } finally {
            setSavingMine(false);
        }
    };

    // ✅ Manager own record create (Monthly)
    const saveMyMonthly = async () => {
        try {
            setSavingMine(true);
            await apiPost(`/department-performance/monthly`, {
                month: filterMonth,
                planForThisMonth: myPlanForThisMonth,
                completedThisMonth: myCompletedThisMonth,
            });
            alert('✅ Your monthly saved');

            if (selectedEmployeeId === myId) loadRecord();
            setShowMyForm(false);
        } catch (e: any) {
            alert(`❌ ${e?.message || 'Error'}`);
        } finally {
            setSavingMine(false);
        }
    };

    // ✅ Review submit
    const submitReview = async () => {
        if (!record?._id) return;
        try {
            await apiPatch(`/department-performance/${record._id}/review`, {
                rating: reviewRating,
                review: reviewText,
            });

            // ✅ instantly reflect saved review
            setRecord((prev: any) =>
                prev ? { ...prev, rating: reviewRating, review: reviewText } : prev,
            );

            alert('✅ Review saved');
            loadRecord();
        } catch (e: any) {
            alert(`❌ ${e?.message || 'Error'}`);
        }
    };

    return (
        <>
            {/* Teams Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 380, p: 2 } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        My Teams
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <TextField
                    size="small"
                    fullWidth
                    label="Search team"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    sx={{ mt: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                {loadingTeams ? (
                    <Typography color="text.secondary">Loading teams…</Typography>
                ) : filteredTeams.length === 0 ? (
                    <Typography color="text.secondary">No teams found.</Typography>
                ) : (
                    <Stack spacing={1}>
                        {filteredTeams.map((t) => {
                            const active = t._id === selectedTeamId;
                            return (
                                <Paper
                                    key={t._id}
                                    variant="outlined"
                                    onClick={() => {
                                        setSelectedTeamId(t._id);
                                        setSelectedEmployeeId(null);
                                        setDrawerOpen(false);
                                    }}
                                    sx={{
                                        p: 1.2,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        borderColor: active ? 'primary.main' : 'divider',
                                        bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 900 }}>
                                        {t.name || '—'} {t.code ? `(${t.code})` : ''}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Team ID: {t._id}
                                    </Typography>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Drawer>

            {/* Main */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>Manager Dashboard</Typography>
                        <Typography variant="caption" color="text.secondary">
                            My team + my submission + review
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<GroupsIcon />}
                        onClick={() => setDrawerOpen(true)}
                        sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                    >
                        Teams
                    </Button>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {!selectedTeam ? (
                    <Typography color="text.secondary">No team selected.</Typography>
                ) : (
                    <>
                        {/* Header + Tabs */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 900 }} noWrap>
                                    {selectedTeam.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    Members (incl. you): {memberIds.length}
                                </Typography>
                            </Box>

                            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 36 }}>
                                <Tab value="daily" label="Daily" />
                                <Tab value="monthly" label="Monthly" />
                            </Tabs>
                        </Stack>

                        {/* ✅ TL Section (ONLY if TLs exist) */}
                        {/* {tlMembers.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="overline" sx={{ fontWeight: 900 }}>
                  TLs
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {tlMembers.map((e, idx) => (
                    <Paper key={`tl-${idx}`} variant="outlined" sx={{ p: 1.1, borderRadius: 2 }}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar src={e?.image || ''} sx={{ width: 32, height: 32 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }} noWrap>
                            {fullName(e)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {e?.designation || '—'} {e?.code ? `• ${e.code}` : ''}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label="TL"
                          variant="outlined"
                          sx={{ fontWeight: 800, ml: 'auto' }}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )} */}

                        {/* Filters */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {tab === 'daily' ? (
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        maxWidth: 210,
                                        '& .MuiInputBase-root': { height: 36 },
                                    }}
                                />
                            ) : (
                                <TextField
                                    size="small"
                                    type="month"
                                    label="Month"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        maxWidth: 210,
                                        '& .MuiInputBase-root': { height: 36 },
                                    }}
                                />
                            )}

                            <Chip
                                label={
                                    selectedEmployeeId
                                        ? `Selected: ${fullName(empMap.get(selectedEmployeeId) || null)}`
                                        : 'Select employee'
                                }
                                variant="outlined"
                                sx={{ fontWeight: 900 }}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* ✅ Create Form Button + Toggle */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography sx={{ fontWeight: 900 }}>My Submission</Typography>

                            <Button
                                size="small"
                                variant={showMyForm ? 'outlined' : 'contained'}
                                onClick={() => setShowMyForm((p) => !p)}
                                sx={{ borderRadius: 999, fontWeight: 900, textTransform: 'none' }}
                            >
                                {showMyForm ? 'Close Form' : tab === 'daily' ? 'Create My Daily' : 'Create My Monthly'}
                            </Button>
                        </Stack>

                        {/* ✅ My submission form (toggle) */}
                        {showMyForm && (
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                                {tab === 'daily' ? (
                                    <Stack spacing={2}>
                                        <TextField
                                            label="What you have done for today"
                                            value={myWhatDoneToday}
                                            onChange={(e) => setMyWhatDoneToday(e.target.value)}
                                            multiline
                                            minRows={3}
                                        />
                                        <TextField
                                            label="What completed today"
                                            value={myWhatCompletedToday}
                                            onChange={(e) => setMyWhatCompletedToday(e.target.value)}
                                            multiline
                                            minRows={3}
                                        />
                                        <Button
                                            disabled={savingMine}
                                            variant="contained"
                                            onClick={saveMyDaily}
                                            sx={{ alignSelf: 'flex-start', borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
                                        >
                                            Save My Daily
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack spacing={2}>
                                        <TextField
                                            label="What you have to do in this month"
                                            value={myPlanForThisMonth}
                                            onChange={(e) => setMyPlanForThisMonth(e.target.value)}
                                            multiline
                                            minRows={3}
                                        />
                                        <TextField
                                            label="What completed in this month"
                                            value={myCompletedThisMonth}
                                            onChange={(e) => setMyCompletedThisMonth(e.target.value)}
                                            multiline
                                            minRows={3}
                                        />
                                        <Button
                                            disabled={savingMine}
                                            variant="contained"
                                            onClick={saveMyMonthly}
                                            sx={{ alignSelf: 'flex-start', borderRadius: 2, fontWeight: 900, textTransform: 'none' }}
                                        >
                                            Save My Monthly
                                        </Button>
                                    </Stack>
                                )}
                            </Paper>
                        )}

                        {/* Main 2 columns */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            {/* Left list */}
                            <Box sx={{ flex: 1, minWidth: 280 }}>
                                <Typography variant="overline" sx={{ fontWeight: 900 }}>
                                    Team + You
                                </Typography>
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                    {memberIds
                                        .map((id) => String(id || '').trim())
                                        .filter((id) => isValidMongoId(id)) // ✅ remove "--", "", junk
                                        .map((id) => ({ id, emp: empMap.get(id) || null }))
                                        .filter((x) => x.emp) // ✅ remove null employees
                                        .map(({ id, emp }) => {
                                            const active = selectedEmployeeId === id;
                                            const isMe = id === myId;

                                            return (
                                                <Paper
                                                    key={id}
                                                    variant="outlined"
                                                    onClick={() => setSelectedEmployeeId(id)}
                                                    sx={{
                                                        p: 1.1,
                                                        borderRadius: 2,
                                                        cursor: 'pointer',
                                                        borderColor: active ? 'primary.main' : 'divider',
                                                        bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={1.2} alignItems="center">
                                                        <Avatar src={emp?.image || ''} sx={{ width: 32, height: 32 }} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 900 }} noWrap>
                                                                {fullName(emp)} {isMe ? '(Me)' : ''}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {emp?.designation || ''} {emp?.code ? `• ${emp.code}` : ''}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Paper>
                                            );
                                        })}

                                    {/* ✅ If nothing valid */}
                                    {memberIds
                                        .map((id) => String(id || '').trim())
                                        .filter((id) => isValidMongoId(id))
                                        .map((id) => empMap.get(id))
                                        .filter(Boolean).length === 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                No employees found in this team.
                                            </Typography>
                                        )}
                                </Stack>

                            </Box>

                            {/* Right record */}
                            <Box sx={{ flex: 2, minWidth: 320 }}>
                                <Typography variant="overline" sx={{ fontWeight: 900 }}>
                                    Record + Review
                                </Typography>

                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 1 }}>
                                    {loadingRecord ? (
                                        <Typography color="text.secondary">Loading…</Typography>
                                    ) : !selectedEmployeeId ? (
                                        <Typography color="text.secondary">Select an employee from left.</Typography>
                                    ) : !record ? (
                                        <Typography color="text.secondary">No record found for this filter.</Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            <Typography sx={{ fontWeight: 900 }}>
                                                {tab === 'daily' ? `Daily • ${record.date}` : `Monthly • ${record.month}`}
                                            </Typography>

                                            {tab === 'daily' ? (
                                                <>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                            Agenda For Today
                                                        </Typography>
                                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {record.whatDoneToday || '—'}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                            What's completed today
                                                        </Typography>
                                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {record.whatCompletedToday || '—'}
                                                        </Typography>
                                                    </Box>
                                                </>
                                            ) : (
                                                <>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                            Plan for this month
                                                        </Typography>
                                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {record.planForThisMonth || '—'}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" sx={{ fontWeight: 900 }}>
                                                            Completed this month
                                                        </Typography>
                                                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {record.completedThisMonth || '—'}
                                                        </Typography>
                                                    </Box>
                                                </>
                                            )}

                                            <Divider />

                                            {/* ✅ Review nice card */}
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: hasSavedReview ? 'rgba(34,197,94,0.06)' : 'rgba(99,102,241,0.06)',
                                                    borderColor: hasSavedReview ? 'rgba(34,197,94,0.35)' : 'divider',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <RateReviewRoundedIcon sx={{ opacity: 0.85 }} />
                                                        <Typography sx={{ fontWeight: 900 }}>Review & Rating</Typography>
                                                    </Stack>

                                                    {hasSavedReview ? (
                                                        <Chip
                                                            icon={<LockRoundedIcon />}
                                                            label="Submitted"
                                                            size="small"
                                                            sx={{ fontWeight: 900 }}
                                                            variant="outlined"
                                                        />
                                                    ) : null}
                                                </Stack>

                                                <Divider sx={{ my: 1.5 }} />

                                                {!hasSavedReview ? (
                                                    <Stack spacing={1.5}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <StarRoundedIcon sx={{ opacity: 0.75 }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                                                Rating
                                                            </Typography>

                                                            <Rating
                                                                value={reviewRating}
                                                                onChange={(_, v) => setReviewRating(v)}
                                                            />

                                                            <Typography variant="caption" color="text.secondary">
                                                                {reviewRating ? `${reviewRating}/5` : '—'}
                                                            </Typography>
                                                        </Stack>

                                                        <TextField
                                                            label="Write review"
                                                            value={reviewText}
                                                            onChange={(e) => setReviewText(e.target.value)}
                                                            multiline
                                                            minRows={3}
                                                        />

                                                        <Button
                                                            variant="contained"
                                                            onClick={submitReview}
                                                            sx={{
                                                                borderRadius: 2,
                                                                fontWeight: 900,
                                                                textTransform: 'none',
                                                                alignSelf: 'flex-start',
                                                            }}
                                                        >
                                                            Save Review
                                                        </Button>
                                                    </Stack>
                                                ) : (
                                                    <Stack spacing={1.5}>
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: 2,
                                                                bgcolor: 'rgba(255,255,255,0.65)',
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                alignItems="center"
                                                                justifyContent="space-between"
                                                            >
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ fontWeight: 900, opacity: 0.8 }}
                                                                >
                                                                    Rating
                                                                </Typography>

                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Rating value={Number(record?.rating || 0)} readOnly />
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${Number(record?.rating || 0)}/5`}
                                                                        sx={{ fontWeight: 900 }}
                                                                        variant="outlined"
                                                                    />
                                                                </Stack>
                                                            </Stack>

                                                            <Divider sx={{ my: 1.2 }} />

                                                            <Typography
                                                                variant="caption"
                                                                sx={{ fontWeight: 900, opacity: 0.8 }}
                                                            >
                                                                Review
                                                            </Typography>

                                                            <Typography sx={{ mt: 0.7, whiteSpace: 'pre-wrap' }}>
                                                                {String(record?.review || '').trim() || '—'}
                                                            </Typography>
                                                        </Paper>


                                                    </Stack>
                                                )}
                                            </Paper>
                                        </Stack>
                                    )}
                                </Paper>
                            </Box>
                        </Stack>
                    </>
                )}
            </Paper>
        </>
    );
}
