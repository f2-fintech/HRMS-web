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
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

type TeamApi = {
  _id: string;
  name: string;
  code?: string;
  company_id?: string;
  manager_id?: string;
  employee_ids?: string; // comma separated
  tls?: string[]; // TL ids array
};

type Employee = {
  _id: string;
  first_name?: string;
  last_name?: string;
  image?: string;
  designation?: string;
  role_priority?: string;
  code?: string;
};

const fullName = (e?: Employee | null) =>
  `${e?.first_name || ''} ${e?.last_name || ''}`.trim() || '—';

const splitIds = (csv?: string) =>
  String(csv || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const MemberRow = ({ emp, label }: { emp: Employee | null; label?: string }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.1,
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.2,
    }}
  >
    <Avatar src={emp?.image || ''} sx={{ width: 36, height: 36 }} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 900 }} noWrap>
        {fullName(emp)}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {emp?.designation || '—'} {emp?.code ? `• Code: ${emp.code}` : ''}
      </Typography>
    </Box>
    {label ? (
      <Chip size="small" label={label} variant="outlined" sx={{ fontWeight: 800 }} />
    ) : null}
  </Paper>
);

export default function DepartmentPerformanceGrid() {
  const dispatch: AppDispatch = useDispatch();
  const { employees } = useSelector((state: RootState) => state.employees);

  const [teams, setTeams] = useState<TeamApi[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // ✅ load employees once (for id->name mapping)
  useEffect(() => {
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees({ page: 1, limit: 0, search: '', designation: '' }));
    }
  }, [dispatch, employees?.length]);

  // ✅ fetch all teams (once)
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
        console.log('✅ get-all-teams RESPONSE:', data);

        const list: TeamApi[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.teams)
          ? data.teams
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setTeams(list);

        // default select first team
        if (list.length > 0) setSelectedTeamId(list[0]._id);
      } catch (e) {
        console.log('❌ get-all-teams error', e);
        setTeams([]);
        setSelectedTeamId(null);
      } finally {
        setLoadingTeams(false);
      }
    };

    run();
  }, []);

  const empMap = useMemo(() => {
    const m = new Map<string, Employee>();
    (employees || []).forEach((e: Employee) => {
      if (e?._id) m.set(String(e._id), e);
    });
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

  const selectedTeam = useMemo(() => {
    return teams.find((t) => t._id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  const selectedTeamDetails = useMemo(() => {
    if (!selectedTeam) return null;

    const manager = selectedTeam.manager_id
      ? empMap.get(String(selectedTeam.manager_id)) || null
      : null;

    const memberIds = splitIds(selectedTeam.employee_ids);
    const members = memberIds.map((id) => empMap.get(id) || null);

    const tls = Array.isArray(selectedTeam.tls) ? selectedTeam.tls : [];
    const tlMembers = tls.map((id) => empMap.get(String(id)) || null);

    return { manager, members, tlMembers, memberIds, tls };
  }, [selectedTeam, empMap]);

  return (
    <Box sx={{ p: 2 }}>
      {/* TOP BAR */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }} noWrap>
            Department Performance
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.7, fontWeight: 700 }} noWrap>
            Dashboard / Department Performance
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<GroupsIcon />}
          onClick={() => setDrawerOpen(true)}
          sx={{
            borderRadius: 999,
            fontWeight: 900,
            textTransform: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Teams
        </Button>
      </Paper>

      {/* DRAWER: TEAMS LIST */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 380, p: 2 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            All Teams
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
                    setDrawerOpen(false);
                  }}
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? 'rgba(44,60,227,0.06)' : 'transparent',
                    transition: '0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
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

      {/* MAIN: SELECTED TEAM DETAILS */}
      {!selectedTeam ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">No team selected.</Typography>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background:
              'radial-gradient(circle at -10% -20%, rgba(99,102,241,0.10) 0, transparent 50%), linear-gradient(180deg,#ffffff 0%,#f7f8ff 100%)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
                {selectedTeam.name || '—'} {selectedTeam.code ? `(${selectedTeam.code})` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Team ID: {selectedTeam._id}
              </Typography>
            </Box>

            <Chip
              label={`Employees: ${selectedTeamDetails?.memberIds.length || 0}`}
              variant="outlined"
              sx={{ fontWeight: 900 }}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="overline" sx={{ fontWeight: 900 }}>
            Manager
          </Typography>
          <Box sx={{ mt: 1 }}>
            <MemberRow emp={selectedTeamDetails?.manager || null} label="Manager" />
          </Box>

          {selectedTeamDetails && selectedTeamDetails.tlMembers.length > 0 && (
            <>
              <Box sx={{ mt: 2 }}>
                <Typography variant="overline" sx={{ fontWeight: 900 }}>
                  TLs
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {selectedTeamDetails.tlMembers.map((e, idx) => (
                    <MemberRow key={`tl-${selectedTeam._id}-${idx}`} emp={e} label="TL" />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="overline" sx={{ fontWeight: 900 }}>
              Employees
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {selectedTeamDetails && selectedTeamDetails.members.length > 0 ? (
                selectedTeamDetails.members.map((e, idx) => (
                  <MemberRow key={`mem-${selectedTeam._id}-${idx}`} emp={e} />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No employees in this team.
                </Typography>
              )}
            </Stack>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
