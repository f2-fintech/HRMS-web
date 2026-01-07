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

  const rp = Number(user?.role_priority);
  const raw = String(
    user?.designation ||
    user?.role ||
    user?.user_type ||
    ''
  )
    .toLowerCase()
    .trim();

  const isAdmin =
    rp === 1 || raw.includes('admin');

  const isTeamLeader =
    raw.includes('team leader') ||
    raw.includes('tl');

  const isManagerTitle =
    raw.includes('manager');

  let view: RoleView = 'EMPLOYEE';

  if (isAdmin) {
    view = 'ADMIN';
  }
  else if (isTeamLeader) {
    // 👉 Team Leader ALWAYS employee view
    view = 'EMPLOYEE';
  }
  else if (isManagerTitle) {
    // 👉 Only actual MANAGER gets manager view
    view = 'MANAGER';
  }
  else {
    view = 'EMPLOYEE';
  }

  setRole(view);

  console.log('ROLE DEBUG =>', {
    rp,
    raw,
    isAdmin,
    isTeamLeader,
    isManagerTitle,
    resolvedView: view,
    user
  });
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
