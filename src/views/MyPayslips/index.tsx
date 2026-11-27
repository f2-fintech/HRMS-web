'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  CircularProgress,
  Fade
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface Payslip {
  _id: string;
  salaryMonth: string;
  payslipData: {
    netPayable: number;
    grossEarnings: number;
    totalDeductions: number;
  };
  createdAt: string;
}

const tokens = {
  primary: '#4F46E5', 
  primaryHover: '#4338CA', 
  bg: '#F8FAFC', 
  surface: '#FFFFFF',
  border: '#E2E8F0', 
  textMain: '#0F172A',
  textMuted: '#64748B', 
  accent: '#10B981'
};

export default function MyPayslipsView() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchPayslips = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/my-payslips/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setPayslips(data);
        }
      } catch (error) {
        console.error('Failed to fetch payslips', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [userId]);

  const handleDownload = async (payslipId: string, month: string) => {
    setDownloadingId(payslipId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/download/${payslipId}`);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip-${month.replace(' ', '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Failed to download payslip.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!userId) return null;

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: '#EEF2FF', borderRadius: 2, color: tokens.primary }}>
            <ReceiptLongIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: tokens.textMain, letterSpacing: '-0.02em' }}>
              My Payslips
            </Typography>
            <Typography sx={{ color: tokens.textMuted }}>
              View and download your monthly salary slips.
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={40} sx={{ color: tokens.primary }} />
          </Box>
        ) : payslips.length === 0 ? (
          <Fade in timeout={500}>
            <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: `1px solid ${tokens.border}` }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: tokens.textMain }}>No payslips found</Typography>
              <Typography sx={{ color: tokens.textMuted, mt: 1 }}>When payroll is processed, your salary slips will appear here.</Typography>
            </Card>
          </Fade>
        ) : (
          <Grid container spacing={3}>
            {payslips.map((slip, i) => (
              <Grid item xs={12} sm={6} md={4} key={slip._id}>
                <Fade in timeout={400 + (i * 100)}>
                  <Card sx={{ 
                    p: 3, 
                    borderRadius: 4, 
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', 
                    border: `1px solid ${tokens.border}`,
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 25px -5px rgba(0,0,0,0.1)', borderColor: '#C7D2FE' }
                  }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: tokens.primary, textTransform: 'uppercase', letterSpacing: '1px', mb: 0.5 }}>
                      {slip.salaryMonth}
                    </Typography>
                    
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: tokens.textMain, letterSpacing: '-0.03em', mb: 3 }}>
                      ₹ {slip.payslipData?.netPayable?.toLocaleString('en-IN') || '0'}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography sx={{ color: tokens.textMuted, fontSize: '0.9rem' }}>Earnings</Typography>
                      <Typography sx={{ fontWeight: 600, color: tokens.textMain, fontSize: '0.9rem' }}>₹ {slip.payslipData?.grossEarnings?.toLocaleString('en-IN') || '0'}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={3}>
                      <Typography sx={{ color: tokens.textMuted, fontSize: '0.9rem' }}>Deductions</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#EF4444', fontSize: '0.9rem' }}>- ₹ {slip.payslipData?.totalDeductions?.toLocaleString('en-IN') || '0'}</Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      disableElevation
                      startIcon={downloadingId === slip._id ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                      onClick={() => handleDownload(slip._id, slip.salaryMonth)}
                      disabled={downloadingId === slip._id}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.2,
                        borderRadius: 2,
                        bgcolor: '#EEF2FF',
                        color: tokens.primary,
                        '&:hover': { bgcolor: tokens.primary, color: '#fff' }
                      }}
                    >
                      {downloadingId === slip._id ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
