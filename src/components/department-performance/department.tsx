// app/(whatever)/department-performance/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import PerformanceAdmin from './performanceadmin';
import PerformanceManager from './performancemanager';
import PerformanceEmployee from './performanceemployee';

type RoleView = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

const getRolePriority = (user: any) => {
  const rpRaw =
    user?.role_priority ??
    user?.rolePriority ??
    user?.role_priority_id ??
    user?.rolePriorityId ??
    user?.role?.priority ??
    user?.role?.role_priority ??
    user?.role; // ✅ IMPORTANT: your user.role = "1"

  const rp = Number(rpRaw);
  return Number.isFinite(rp) ? rp : null;
};

export default function DepartmentPerformance() {
  const [role, setRole] = useState<RoleView | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const rp = getRolePriority(user);

    // ✅ HARD LOCK: role 1 => ADMIN
    if (rp === 1) {
      setRole('ADMIN');
      console.log('ROLE RESOLVED => ADMIN', { rp, user });
      return;
    }

    const raw = String(user?.designation || user?.role_name || user?.user_type || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // ✅ Manager detection
    const isManager = /\bmanager\b/.test(raw);

    setRole(isManager ? 'MANAGER' : 'EMPLOYEE');

    console.log('ROLE RESOLVED =>', { rp, raw, resolved: isManager ? 'MANAGER' : 'EMPLOYEE', user });
  }, []);

  if (!role) return null;

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
