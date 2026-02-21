'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import PerformanceAdmin from './performanceadmin';
import PerformanceManager from './performancemanager';
import PerformanceEmployee from './performanceemployee';

type RoleView = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

const resolveRoleView = (user: any): RoleView => {
  const raw = String(user?.designation || user?.role_name || user?.user_type || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const rpRaw =
    user?.role_priority ??
    user?.rolePriority ??
    user?.role_priority_id ??
    user?.rolePriorityId;

  const rp = Number(rpRaw);
  const role = String(user?.role || '').trim();

  const isAdmin =
    rp === 1 ||
    role === '1' ||
    raw.includes('admin') ||
    raw.includes('founder') ||
    raw.includes('ceo');

  const isTeamLeader =
    raw.includes('team leader') || raw.includes('teamleader') || raw === 'tl' || raw.includes(' tl ');

  const isManagerTitle = raw.includes('manager');

  if (isAdmin) return 'ADMIN';
  if (isTeamLeader) return 'EMPLOYEE'; // TL ko employee view hi rakhna hai
  if (isManagerTitle) return 'MANAGER';
  return 'EMPLOYEE';
};

export default function DepartmentPerformanceClient() {
  const [role, setRole] = useState<RoleView>('EMPLOYEE');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(resolveRoleView(user));
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {role === 'ADMIN' ? (
        <PerformanceAdmin />
      ) : role === 'MANAGER' ? (
        <PerformanceManager />
      ) : (
        <PerformanceEmployee />
      )}
    </Box>
  );
}
