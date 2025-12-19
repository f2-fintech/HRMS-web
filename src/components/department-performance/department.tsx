'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

import PerformanceAdmin from './performanceadmin';
import PerformanceManager from './performancemanager';
import PerformanceEmployee from './performanceemployee';

type RoleView = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export default function DepartmentPerformance() {
  const [role, setRole] = useState<RoleView>('EMPLOYEE');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // role_priority / role can be number OR string
    const rp = user?.role_priority;
    const r = user?.role;

    const rolePriorityNum = Number(rp);
    const roleNum = Number(r);

    // fallback string matching
    const raw = String(rp ?? r ?? user?.designation ?? user?.user_type ?? '')
      .toLowerCase()
      .trim();

    // ✅ Most robust mapping:
    // 1 => Admin
    // 2 => Manager/TL
    // else => Employee
    let view: RoleView = 'EMPLOYEE';

    if (rolePriorityNum === 1 || roleNum === 1 || raw.includes('admin')) {
      view = 'ADMIN';
    } else if (
      rolePriorityNum === 2 ||
      roleNum === 2 ||
      raw.includes('manager') ||
      raw.includes('tl') ||
      raw.includes('team lead')
    ) {
      view = 'MANAGER';
    } else {
      view = 'EMPLOYEE';
    }

    setRole(view);

    // ✅ Debug (console me check kar lena)
    console.log('✅ DP ROLE DEBUG =>', {
      rp,
      r,
      rolePriorityNum,
      roleNum,
      raw,
      resolvedView: view,
      user,
    });
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      {/* <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg,#ffffff 0%,#fafbff 100%)',
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Department Performance
        </Typography>

        <Typography variant="subtitle2" sx={{ opacity: 0.7, fontWeight: 700 }}>
          {role === 'ADMIN'
            ? 'Admin View'
            : role === 'MANAGER'
            ? 'Manager View'
            : 'Employee View'}
        </Typography>
      </Paper> */}

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
