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

  const roleStr = String(user?.role || '').trim();          // "1" / "2" / "3"
  const rp = Number(user?.role_priority);                   // optional
  const desig = String(user?.designation || '').toLowerCase().trim();

  let view: RoleView = 'EMPLOYEE';

  // ✅ HARD LOCKS
  if (roleStr === '1' || rp === 1) view = 'ADMIN';
  // else if (roleStr === '2' || rp === 2) view = 'MANAGER';
  else view = 'EMPLOYEE'; // TL + normal employee

  setRole(view);

  console.log('ROLE DEBUG', { roleStr, rp, desig, view, user });
}, []);

  return (
    <Box sx={{ p: 2 }}>
      {role === 'ADMIN' ? <PerformanceAdmin /> : role === 'MANAGER' ? <PerformanceManager /> : <PerformanceEmployee />}
    </Box>
  );
}
