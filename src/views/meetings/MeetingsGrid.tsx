'use client';

import { Box, Button, Typography, Stack } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';

export default function MeetingsPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F3FF',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <VideoCallIcon sx={{ fontSize: 60, color: '#7C3AED' }} />

        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E1B4B' }}>
          Meetings Module
        </Typography>

        <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>
          Currently working on this 🚧
        </Typography>

        <Button
          variant="contained"
          onClick={() => window.history.back()}
          sx={{
            mt: 2,
            background: '#7C3AED',
          }}
        >
          Go Back
        </Button>
      </Stack>
    </Box>
  );
}
