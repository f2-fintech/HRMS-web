import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import { useSettings } from '@/@core/hooks/useSettings';


const HolidayPolicyInfo = () => {
  const { settings } = useSettings();
  const isDark = settings.mode === 'dark';

  const rules = [
    {
      icon: <EventAvailableOutlinedIcon sx={{ color: '#ff902f' }} />,
      text: (
        <>
          Out of these <strong>12 holidays</strong>, employees can take only{' '}
          <strong>6 holidays</strong>.
        </>
      ),
    },
    {
      icon: <WorkHistoryOutlinedIcon sx={{ color: '#ff902f' }} />,
      text: (
        <>
          At least <strong>6 months</strong> of employment is necessary to
          become eligible for holidays.
        </>
      ),
    },
  ];

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${isDark ? '#555' : '#ffd9b0'}`,
        backgroundColor: isDark ? '#3a3226' : '#fff7ef',
        p: 2.5,
        mb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <InfoOutlinedIcon sx={{ color: '#ff902f' }} />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: isDark ? '#fff' : '#000' }}
        >
          Holiday Policy
        </Typography>
      </Stack>

      <Stack spacing={1.25}>
        {rules.map((rule, index) => (
          <Stack direction="row" spacing={1.5} alignItems="flex-start" key={index}>
            {rule.icon}
            <Typography
              variant="body2"
              sx={{ color: isDark ? '#e0e0e0' : '#444', lineHeight: 1.6 }}
            >
              {rule.text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default HolidayPolicyInfo;
