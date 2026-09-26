'use client'

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  Paper,
  Divider,
  IconButton,
  Autocomplete,
  Fade,
  Grow
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';

interface Earning {
  id: string;
  name: string;
  amount: number;
}

interface Deduction {
  id: string;
  name: string;
  amount: number;
}

// ---- Premium Design Tokens -----------------------------------------------
const tokens = {
  primary: '#4F46E5', // Indigo 600
  primaryHover: '#4338CA', // Indigo 700
  primarySoft: '#EEF2FF', // Indigo 50
  secondary: '#0F172A', // Slate 900
  secondarySoft: '#1E293B', // Slate 800
  accent: '#10B981', // Emerald 500
  accentSoft: '#D1FAE5', // Emerald 100
  bg: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  border: '#E2E8F0', // Slate 200
  textMain: '#0F172A',
  textMuted: '#64748B', // Slate 500
  danger: '#EF4444', // Red 500
  dangerSoft: '#FEE2E2',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#F8FAFC',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': { borderColor: tokens.border, borderWidth: '1px' },
    '&:hover fieldset': { borderColor: '#CBD5E1' },
    '&.Mui-focused fieldset': { borderColor: tokens.primary, borderWidth: '2px' },
    '&.Mui-focused': { backgroundColor: tokens.surface, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)' }
  },
  '& .MuiInputLabel-root': { color: tokens.textMuted, fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: tokens.primary }
};

export default function PayrollView() {
  const dispatch: AppDispatch = useDispatch();
  const { employees } = useSelector((state: RootState) => state.employees);

  useEffect(() => {
    dispatch(fetchEmployees({ limit: 1000 }));
  }, [dispatch]);

  const [tab, setTab] = useState(0);

  // Manual Payslip State
  const [companyName, setCompanyName] = useState('F2 Fintech');
  const [companyAddress, setCompanyAddress] = useState('');
  const [cityPincode, setCityPincode] = useState('');
  const [country, setCountry] = useState('India');

  const [empName, setEmpName] = useState('');
  const [empId, setEmpId] = useState('');
  const [payPeriod, setPayPeriod] = useState('');
  const [paidDays, setPaidDays] = useState<number | ''>('');
  const [lossOfPayDays, setLossOfPayDays] = useState<number | ''>(0);
  const [payDate, setPayDate] = useState('');

  const [earnings, setEarnings] = useState<Earning[]>([
    { id: '1', name: 'Basic', amount: 0 },
    { id: '2', name: 'House Rent Allowance', amount: 0 }
  ]);
  const [deductions, setDeductions] = useState<Deduction[]>([
    { id: '1', name: 'Income Tax', amount: 0 },
    { id: '2', name: 'Provident Fund', amount: 0 }
  ]);

  const [excelFile, setExcelFile] = useState<File | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const addEarning = () => setEarnings([...earnings, { id: Date.now().toString(), name: '', amount: 0 }]);
  const updateEarning = (id: string, field: 'name' | 'amount', value: string | number) => 
    setEarnings(earnings.map(e => e.id === id ? { ...e, [field]: value } : e));
  const removeEarning = (id: string) => setEarnings(earnings.filter(e => e.id !== id));

  const addDeduction = () => setDeductions([...deductions, { id: Date.now().toString(), name: '', amount: 0 }]);
  const updateDeduction = (id: string, field: 'name' | 'amount', value: string | number) => 
    setDeductions(deductions.map(d => d.id === id ? { ...d, [field]: value } : d));
  const removeDeduction = (id: string) => setDeductions(deductions.filter(d => d.id !== id));

  const grossEarnings = earnings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const netPayable = grossEarnings - totalDeductions;

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateManual = async () => {
    setIsGenerating(true);
    try {
      const data = {
        companyName, companyAddress, cityPincode, country,
        empName, empId, payPeriod, paidDays, lossOfPayDays,
        payDate, earnings, deductions, grossEarnings, totalDeductions, netPayable
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/generate-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Failed to generate payslip');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${empId || 'employee'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Error generating payslip');
    } finally {
      setIsGenerating(false);
    }
  };

  const [bulkSalaryMonth, setBulkSalaryMonth] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleBulkUpload = async () => {
    if (!excelFile || !bulkSalaryMonth) {
      alert('Please select an Excel file and enter the Salary Month.');
      return;
    }
    setBulkLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('salaryMonth', bulkSalaryMonth);

      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/bulk-generate`, {
        method: 'POST', body: formData
      });

      if (!res.ok) throw new Error('Failed to process bulk upload');
      alert('Payslips generated & emails are sending!');
      setExcelFile(null);
      setBulkSalaryMonth('');
    } catch (error) {
      console.error(error);
      alert('Error processing bulk upload');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: tokens.bg, minHeight: '100vh', p: { xs: 2, md: 5 } }}>
      <Fade in={true} timeout={500}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: tokens.secondary, letterSpacing: '-0.02em' }}>
              Payroll & Payslips
            </Typography>
            <Typography sx={{ color: tokens.textMuted, mt: 0.5 }}>
              Generate a single payslip by hand, or run payroll for everyone from a spreadsheet.
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={handleTabChange}
            TabIndicatorProps={{ style: { backgroundColor: tokens.primary, height: 3 } }}
            sx={{
              mb: 4,
              minHeight: 0,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: tokens.textMuted,
                minHeight: 0,
                py: 1.5,
                px: 0,
                mr: 4
              },
              '& .Mui-selected': { color: `${tokens.secondary} !important` }
            }}
          >
            <Tab label="Manual Generation" />
            <Tab label="Bulk Upload (Excel)" />
          </Tabs>

          {tab === 0 && (
            <Grow in={true} timeout={400}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '24px',
                  boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.05)',
                  border: `1px solid ${tokens.border}`,
                  overflow: 'hidden',
                  bgcolor: tokens.surface
                }}
              >
                {/* Header / Company Details */}
                <Box sx={{ 
                  bgcolor: '#ffffff', 
                  color: tokens.textMain, 
                  px: { xs: 3, md: 5 }, 
                  py: 4,
                  borderBottom: `1px solid ${tokens.border}`
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
                    <Box flex={1} minWidth={250}>
                      <Typography sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: tokens.textMuted, mb: 1 }}>
                        Company Details
                      </Typography>
                      <TextField
                        variant="standard"
                        placeholder="Company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                        sx={{ mb: 1, '& input': { color: tokens.textMain, fontSize: '1.75rem', fontWeight: 800, p: 0, '&::placeholder': { color: '#CBD5E1' } } }}
                      />
                      <TextField
                        variant="standard"
                        placeholder="Company address"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        fullWidth
                        InputProps={{ disableUnderline: true }}
                        sx={{ mb: 0.5, '& input': { color: tokens.textMuted, fontSize: '0.9rem', p: 0 } }}
                      />
                      <Box display="flex" gap={2}>
                        <TextField
                          variant="standard"
                          placeholder="City, pincode"
                          value={cityPincode}
                          onChange={(e) => setCityPincode(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{ '& input': { color: tokens.textMuted, fontSize: '0.9rem', p: 0 } }}
                        />
                        <TextField
                          variant="standard"
                          placeholder="Country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          InputProps={{ disableUnderline: true }}
                          sx={{ '& input': { color: tokens.textMuted, fontSize: '0.9rem', p: 0 } }}
                        />
                      </Box>
                    </Box>
                    <Box textAlign="right">
                      <Typography sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: tokens.textMuted, mb: 1 }}>
                        Salary Month
                      </Typography>
                      <TextField
                        variant="standard"
                        type="month"
                        value={payPeriod}
                        onChange={(e) => setPayPeriod(e.target.value)}
                        InputProps={{ disableUnderline: true }}
                        sx={{ 
                          bgcolor: tokens.bg, 
                          borderRadius: '8px',
                          px: 2, py: 1,
                          '& input': { color: tokens.textMain, fontSize: '1.1rem', fontWeight: 600, textAlign: 'right', p: 0 } 
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ px: { xs: 3, md: 5 }, py: 5 }}>
                  <Typography sx={{ fontWeight: 700, color: tokens.textMain, mb: 3, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ width: 4, height: 16, bgcolor: tokens.primary, borderRadius: 2 }} />
                    Employee Information
                  </Typography>
                  <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        options={employees}
                        getOptionLabel={(option: any) => `${option.first_name || ''} ${option.last_name || ''}`.trim()}
                        onChange={(event, newValue) => {
                          if (newValue) {
                            setEmpName(`${newValue.first_name || ''} ${newValue.last_name || ''}`.trim());
                            setEmpId(newValue.code || '');
                          } else {
                            setEmpName('');
                            setEmpId('');
                          }
                        }}
                        renderInput={(params) => (
                          <TextField {...params} variant="outlined" label="Employee Name" placeholder="Select employee" sx={fieldSx} />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth variant="outlined" label="Employee ID" placeholder="e.g. EMP-001" value={empId} onChange={e => setEmpId(e.target.value)} sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth variant="outlined" type="number" label="Paid Days" placeholder="30" value={paidDays} onChange={e => setPaidDays(Number(e.target.value))} sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth variant="outlined" type="number" label="Loss of Pay Days" placeholder="0" value={lossOfPayDays} onChange={e => setLossOfPayDays(Number(e.target.value))} sx={fieldSx} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth variant="outlined" type="date" label="Pay Date" value={payDate} onChange={e => setPayDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={fieldSx} />
                    </Grid>
                  </Grid>

                  <Divider sx={{ borderColor: tokens.border, mb: 5, borderStyle: 'dashed' }} />

                  <Grid container spacing={6}>
                    {/* EARNINGS */}
                    <Grid item xs={12} md={6}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography sx={{ fontWeight: 700, color: tokens.textMain, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box component="span" sx={{ width: 8, height: 8, bgcolor: tokens.accent, borderRadius: '50%' }} />
                          Earnings
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: tokens.textMuted, fontSize: '0.85rem' }}>Amount (₹)</Typography>
                      </Box>
                      {earnings.map((e, index) => (
                        <Box key={e.id} display="flex" gap={2} mb={2} alignItems="center">
                          <TextField
                            variant="outlined"
                            placeholder="Earning type"
                            value={e.name}
                            onChange={(ev) => updateEarning(e.id, 'name', ev.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                          />
                          <TextField
                            variant="outlined"
                            type="number"
                            placeholder="0"
                            value={e.amount}
                            onChange={(ev) => updateEarning(e.id, 'amount', ev.target.value)}
                            size="small"
                            sx={{ ...fieldSx, width: '130px', input: { textAlign: 'right', fontWeight: 600 } }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeEarning(e.id)}
                            sx={{ 
                              color: tokens.danger, 
                              bgcolor: tokens.dangerSoft,
                              opacity: index > 1 ? 1 : 0, 
                              pointerEvents: index > 1 ? 'auto' : 'none',
                              '&:hover': { bgcolor: '#FECACA' }
                            }}
                          >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={addEarning}
                        sx={{ mt: 1, textTransform: 'none', color: tokens.primary, fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: tokens.primarySoft } }}
                      >
                        Add Earning
                      </Button>
                    </Grid>

                    {/* DEDUCTIONS */}
                    <Grid item xs={12} md={6}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography sx={{ fontWeight: 700, color: tokens.textMain, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box component="span" sx={{ width: 8, height: 8, bgcolor: tokens.danger, borderRadius: '50%' }} />
                          Deductions
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: tokens.textMuted, fontSize: '0.85rem' }}>Amount (₹)</Typography>
                      </Box>
                      {deductions.map((d, index) => (
                        <Box key={d.id} display="flex" gap={2} mb={2} alignItems="center">
                          <TextField
                            variant="outlined"
                            placeholder="Deduction type"
                            value={d.name}
                            onChange={(ev) => updateDeduction(d.id, 'name', ev.target.value)}
                            fullWidth
                            size="small"
                            sx={fieldSx}
                          />
                          <TextField
                            variant="outlined"
                            type="number"
                            placeholder="0"
                            value={d.amount}
                            onChange={(ev) => updateDeduction(d.id, 'amount', ev.target.value)}
                            size="small"
                            sx={{ ...fieldSx, width: '130px', input: { textAlign: 'right', fontWeight: 600 } }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeDeduction(d.id)}
                            sx={{ 
                              color: tokens.danger, 
                              bgcolor: tokens.dangerSoft,
                              opacity: index > 1 ? 1 : 0, 
                              pointerEvents: index > 1 ? 'auto' : 'none',
                              '&:hover': { bgcolor: '#FECACA' }
                            }}
                          >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={addDeduction}
                        sx={{ mt: 1, textTransform: 'none', color: tokens.primary, fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: tokens.primarySoft } }}
                      >
                        Add Deduction
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Totals Section */}
                  <Box sx={{ mt: 6, borderRadius: '16px', border: `1px solid ${tokens.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <Box display="flex" justifyContent="space-between" px={4} py={2} sx={{ borderBottom: `1px solid ${tokens.border}`, bgcolor: '#FAFAF9' }}>
                      <Typography sx={{ color: tokens.textMuted, fontWeight: 600 }}>Gross Earnings</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>₹ {grossEarnings.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" px={4} py={2} sx={{ borderBottom: `1px solid ${tokens.border}`, bgcolor: '#FAFAF9' }}>
                      <Typography sx={{ color: tokens.textMuted, fontWeight: 600 }}>Total Deductions</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: tokens.danger }}>- ₹ {totalDeductions.toLocaleString('en-IN')}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" px={4} py={3} sx={{ bgcolor: tokens.accentSoft }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#065F46', fontSize: '1.1rem' }}>Net Payable</Typography>
                        <Typography sx={{ color: '#047857', fontSize: '0.8rem', mt: 0.5, fontWeight: 500 }}>Take-home salary for the period</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#065F46', letterSpacing: '-0.02em' }}>
                        ₹ {netPayable.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mt={5} display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                      variant="text"
                      sx={{ textTransform: 'none', color: tokens.textMuted, fontWeight: 600, borderRadius: '10px', px: 3 }}
                    >
                      Reset Form
                    </Button>
                    <Button
                      onClick={handleGenerateManual}
                      variant="contained"
                      disabled={isGenerating}
                      startIcon={<CalculateOutlinedIcon />}
                      disableElevation
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        px: 4,
                        py: 1.2,
                        borderRadius: '10px',
                        bgcolor: tokens.primary,
                        boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
                        '&:hover': { bgcolor: tokens.primaryHover, boxShadow: '0 6px 20px rgba(79, 70, 229, 0.23)' }
                      }}
                    >
                      {isGenerating ? 'Generating...' : 'Generate PDF'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grow>
          )}

          {tab === 1 && (
            <Grow in={true} timeout={400}>
              <Paper
                elevation={0}
                sx={{ 
                  p: { xs: 4, md: 6 }, 
                  borderRadius: '24px', 
                  border: `1px solid ${tokens.border}`,
                  boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.05)',
                  bgcolor: tokens.surface
                }}
              >
                <Box textAlign="center" mb={4}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: tokens.primarySoft, color: tokens.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <CloudUploadOutlinedIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: tokens.secondary, fontSize: '1.5rem', letterSpacing: '-0.02em' }} gutterBottom>
                    Bulk Upload Payroll
                  </Typography>
                  <Typography sx={{ color: tokens.textMuted, maxWidth: 500, mx: 'auto' }}>
                    Upload an Excel sheet containing employee pay details. The system will automatically calculate, generate, and email all payslips.
                  </Typography>
                </Box>

                <Box
                  component="label"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    border: `2px dashed ${excelFile ? tokens.primary : tokens.border}`,
                    borderRadius: '16px',
                    p: 5,
                    mb: 4,
                    cursor: 'pointer',
                    bgcolor: excelFile ? tokens.primarySoft : '#FAFAF9',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: tokens.primary, bgcolor: tokens.primarySoft }
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: excelFile ? tokens.primary : tokens.textMain, fontSize: '1.1rem' }}>
                    {excelFile ? excelFile.name : 'Click or drag an Excel file here'}
                  </Typography>
                  <Typography sx={{ color: tokens.textMuted, fontSize: '0.9rem' }}>
                    Supported formats: .xlsx, .xls, .csv
                  </Typography>
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setExcelFile(e.target.files ? e.target.files[0] : null)}
                  />
                </Box>

                <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      type="month"
                      label="Salary Month"
                      value={bulkSalaryMonth}
                      onChange={(e) => setBulkSalaryMonth(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      disableElevation
                      onClick={handleBulkUpload}
                      disabled={!excelFile || !bulkSalaryMonth || bulkLoading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1.05rem',
                        py: 1.5,
                        borderRadius: '12px',
                        bgcolor: tokens.primary,
                        boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
                        '&:hover': { bgcolor: tokens.primaryHover },
                        '&.Mui-disabled': { bgcolor: tokens.border, color: tokens.textMuted, boxShadow: 'none' }
                      }}
                    >
                      {bulkLoading ? 'Processing & Sending...' : 'Process Bulk Payroll'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grow>
          )}
        </Box>
      </Fade>
    </Box>
  );
}
