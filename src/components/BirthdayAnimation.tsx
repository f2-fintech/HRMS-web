'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
const isBirthday = (dobString?: string) => {
  if (!dobString) return false;
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();

  let dobMonth: number | undefined;
  let dobDate: number | undefined;

  if (dobString.includes('-')) {
    const parts = dobString.split('-');
    if (parts[0].length === 4) {
      dobMonth = parseInt(parts[1], 10);
      dobDate = parseInt(parts[2].substring(0, 2), 10);
    } else {
      dobDate = parseInt(parts[0], 10);
      dobMonth = parseInt(parts[1], 10);
    }
  } else {
    const d = new Date(dobString);
    if (!isNaN(d.getTime())) {
      dobMonth = d.getMonth() + 1;
      dobDate = d.getDate();
    } else {
      return false;
    }
  }
  return todayMonth === dobMonth && todayDate === dobDate;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function BirthdayAnimation({ userId }: { userId?: string }) {
  const [show, setShow] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    const checkBirthday = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${userId}`);
        const data = await response.json();
        if (data && data.dob) {
          const birthdayMatch = isBirthday(data.dob);
          const hasSeen = sessionStorage.getItem('birthday_seen');
          
          if (birthdayMatch && !hasSeen) {
            setUserData(data);
            setShow(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };
    checkBirthday();
  }, [userId]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem('birthday_seen', 'true');
  };

  if (!show) return null;

  const userName = userData?.first_name || "there";

  return (
    <Dialog open={show} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
        🎉 Happy Birthday! 🎂
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={3}>
          <Typography variant="h5" align="center" gutterBottom>
            Wishing you a very Happy Birthday, {userName}!
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            Have a wonderful day filled with joy and happiness.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleClose}>
          Thank You!
        </Button>
      </DialogActions>
    </Dialog>
  );
}
