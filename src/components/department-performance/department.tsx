'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import PerformanceAdmin from './performanceadmin';
import PerformanceManager from './performancemanager';
import PerformanceEmployee from './performanceemployee';

type RoleView = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export default function DepartmentPerformance() {
  const [role, setRole] = useState<RoleView>('EMPLOYEE');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const roleId = String(user?.role || '').trim();          // ✅ "1"
    const rp = Number(user?.role_priority);                  // may be NaN
    const raw = String(user?.designation || user?.role_name || user?.user_type || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // ✅ HARD ADMIN RULE (MOST IMPORTANT)
    const isAdmin = roleId === '1' || rp === 1 || raw.includes('admin') || raw.includes('founder') || raw.includes('ceo');

    const isTeamLeader =
      raw.includes('team leader') ||
      raw === 'tl' ||
      raw.includes(' teamleader ') ||
      raw.includes(' team leader ') ||
      raw.includes(' tl ');

    const isManagerTitle = raw.includes('manager');

    let view: RoleView = 'EMPLOYEE';

    if (isAdmin) view = 'ADMIN';
    else if (isManagerTitle) view = 'MANAGER';
    else view = 'EMPLOYEE'; // TL bhi employee view

    setRole(view);

    console.log('ROLE DEBUG =>', { roleId, rp, raw, isAdmin, isTeamLeader, isManagerTitle, resolvedView: view, user });
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {role === 'ADMIN' ? <PerformanceAdmin /> : role === 'MANAGER' ? <PerformanceManager /> : <PerformanceEmployee />}
    </Box>
  );
}
