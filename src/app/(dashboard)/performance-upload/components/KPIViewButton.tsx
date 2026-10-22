'use client';
import React from 'react';
import { Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function KPIViewButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="small"
      onClick={onClick}
      startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
      sx={{
        mt: 1.2,
        borderRadius: 999,
        textTransform: 'none',
        fontWeight: 700,
        px: 2,
        bgcolor: 'rgba(255,255,255,0.18)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.25)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
      }}
    >
      View
    </Button>
  );
}
