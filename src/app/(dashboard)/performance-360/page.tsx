'use client';

import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Setup Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || '';
    const companyId =
      localStorage.getItem('company_id') ||
      JSON.parse(localStorage.getItem('user') || '{}')?.company_id ||
      '';

    if (!config.headers) config.headers = {} as any;
    if (token) config.headers.Authorization = `Bearer token ${token}`.replace('token ', 'Bearer ');
    if (companyId) config.headers['x-company-id'] = companyId;
  }
  return config;
});

interface AggregatedEmployee {
  empCode: string;
  empName: string;
  doj: string;
  branch: string;
  currentTL: string;
  currentManager: string;
  lwd: string;
  
  totalDisbursedCase: number;
  totalDisbursal: number;
  securedDisbursal: number;
  unsecuredDisbursal: number;
  cashBack: number;
  
  workingMonth: number;
  performingMonth: number;
  unactiveMonth: number;
  avgMonthlyDisbursal: number;

  monthsMap: Record<string, {
    monthStr: string;
    noOfDisbursed: number;
    netAmount: number;
    manager: string;
    cashBack: number;
    _timestamp: number;
    _tlName: string;
  }>;
  sortedMonths: any[];
}

export default function Performance360() {
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbTransactions, setDbTransactions] = useState<any[]>([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState<string | null>(null);
  
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/performance-360/all-data');
      setDbEmployees(res.data.employees || []);
      setDbTransactions(res.data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileIndex: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (fileIndex === 1) setUploading1(true); else setUploading2(true);
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = fileIndex === 1 
         ? '/performance-360/upload-employee-details' 
         : '/performance-360/upload-performance';
         
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert(res.data?.message || 'Upload successful');
      await fetchData();
    } catch(err: any) {
      alert(err.response?.data?.message || 'Upload failed');
      console.error(err);
    } finally {
      if (fileIndex === 1) setUploading1(false); else setUploading2(false);
      e.target.value = ''; // clear input
    }
  };

  // Aggregation Logic
  const { employees, employeeList } = useMemo(() => {
    const map = new Map<string, AggregatedEmployee>();

    dbEmployees.forEach((e: any) => {
      map.set(e.empCode, {
        empCode: e.empCode,
        empName: e.empName || '-',
        doj: e.doj || '-',
        branch: e.branch || '-',
        lwd: e.lwd || '-',
        currentTL: '-',
        currentManager: '-',
        
        totalDisbursedCase: 0,
        totalDisbursal: 0,
        securedDisbursal: 0,
        unsecuredDisbursal: 0,
        cashBack: 0,
        
        workingMonth: 0,
        performingMonth: 0,
        unactiveMonth: 0,
        avgMonthlyDisbursal: 0,
        monthsMap: {},
        sortedMonths: []
      });
    });

    dbTransactions.forEach((t: any) => {
      if (!map.has(t.empCode)) return;
      const emp = map.get(t.empCode)!;

      if (!emp.monthsMap[t.monthStr]) {
        emp.monthsMap[t.monthStr] = {
          monthStr: t.monthStr,
          noOfDisbursed: 0,
          netAmount: 0,
          manager: t.managerName || '-',
          cashBack: 0,
          _timestamp: t.monthValue,
          _tlName: t.tlName || '-',
        };
      }

      const monthData = emp.monthsMap[t.monthStr];
      monthData.noOfDisbursed += 1;
      monthData.netAmount += (t.netLoanAmount || 0);
      monthData.cashBack += (t.cashBack || 0);

      emp.totalDisbursedCase += 1;
      emp.totalDisbursal += (t.netLoanAmount || 0);
      emp.cashBack += (t.cashBack || 0);

      const loanType = (t.loanType || '').toString().toUpperCase();
      if (loanType.includes('SECURED') && !loanType.includes('UNSECURED')) {
        emp.securedDisbursal += (t.netLoanAmount || 0);
      } else {
        emp.unsecuredDisbursal += (t.netLoanAmount || 0);
      }
    });

    // Find global max timestamp to determine the end month
    let globalMaxTimestamp = dayjs().valueOf();
    if (dbTransactions.length > 0) {
      globalMaxTimestamp = Math.max(...dbTransactions.map((t: any) => t.monthValue || 0));
    }
    const globalEnd = dayjs(globalMaxTimestamp).startOf('month');

    // Post-processing for months count and averages
    map.forEach(emp => {
      // Fill missing months from DOJ
      let startDate: dayjs.Dayjs | null = null;
      if (emp.doj && emp.doj !== '-') {
        let dStr = String(emp.doj).trim();
        if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dStr)) {
          const parts = dStr.split(/[-/]/);
          startDate = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          startDate = dayjs(dStr);
        }
      }

      if (startDate && startDate.isValid()) {
        startDate = startDate.startOf('month');
        let endDate = globalEnd;

        // Cap at LWD if employee has left
        if (emp.lwd && emp.lwd !== '-') {
          let lwdStr = String(emp.lwd).trim();
          let lwdDate: dayjs.Dayjs | null = null;
          if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(lwdStr)) {
            const parts = lwdStr.split(/[-/]/);
            lwdDate = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            lwdDate = dayjs(lwdStr);
          }
          if (lwdDate && lwdDate.isValid() && lwdDate.startOf('month').isBefore(endDate)) {
            endDate = lwdDate.startOf('month');
          }
        }

        let current = startDate.clone();
        while (current.isBefore(endDate) || current.isSame(endDate, 'month')) {
          const currentYear = current.year();
          const currentMonth = current.month();
          
          const existingMatch = Object.values(emp.monthsMap).find((m: any) => {
             const mDate = dayjs(m._timestamp);
             return mDate.year() === currentYear && mDate.month() === currentMonth;
          });
          
          if (!existingMatch) {
             const mStr = current.format('MMM-YY').toUpperCase();
             emp.monthsMap[mStr] = {
                monthStr: mStr,
                noOfDisbursed: 0,
                netAmount: 0,
                manager: '-',
                cashBack: 0,
                _timestamp: current.valueOf(),
                _tlName: '-'
             };
          }
          current = current.add(1, 'month');
        }
      }

      const monthsList = Object.values(emp.monthsMap) as any[];
      // Sort months chronologically
      monthsList.sort((a, b) => a._timestamp - b._timestamp);
      emp.sortedMonths = monthsList;
      
      // The most recent month gives the "Current" Manager and TL
      // Only pick from months that actually have a manager (ignore generated 0 months)
      const monthsWithManager = monthsList.filter(m => m.manager !== '-');
      if (monthsWithManager.length > 0) {
        const latestMonth = monthsWithManager[monthsWithManager.length - 1];
        emp.currentManager = latestMonth.manager;
        emp.currentTL = latestMonth._tlName;
      }

      emp.workingMonth = monthsList.length;
      emp.performingMonth = monthsList.filter(m => m.netAmount > 0).length;
      emp.unactiveMonth = emp.workingMonth - emp.performingMonth;
      emp.avgMonthlyDisbursal = emp.workingMonth > 0 ? (emp.totalDisbursal / emp.workingMonth) : 0;
    });

    const list = Array.from(map.values()).sort((a, b) => a.empName.localeCompare(b.empName));

    return { employees: map, employeeList: list };
  }, [dbEmployees, dbTransactions]);

  const selectedEmp = selectedEmpCode ? employees.get(selectedEmpCode) : null;

  if (loading) {
    return (
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Performance 360
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload Employee Detail Sheet and Monthly Consolidated Data Excel to sync database.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} variant="outlined">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              component="label"
              variant="contained"
              startIcon={uploading1 ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              fullWidth
              disabled={uploading1}
              color={dbEmployees.length > 0 ? 'success' : 'primary'}
            >
              {dbEmployees.length > 0 ? `Details Synced (${dbEmployees.length} emps)` : 'Upload Employee Details'}
              <input
                type="file"
                hidden
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileUpload(e, 1)}
              />
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              component="label"
              variant="contained"
              startIcon={uploading2 ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              fullWidth
              disabled={uploading2}
              color={dbTransactions.length > 0 ? 'success' : 'secondary'}
            >
              {dbTransactions.length > 0 ? `Performance Synced (${dbTransactions.length} txns)` : 'Upload Monthly Performance Data'}
              <input
                type="file"
                hidden
                accept=".xlsx, .xls, .csv"
                onChange={(e) => handleFileUpload(e, 2)}
              />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {employeeList.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} variant="outlined">
          <Autocomplete
            options={employeeList}
            getOptionLabel={(option) => `${option.empName} (${option.empCode})`}
            onChange={(e, newValue) => setSelectedEmpCode(newValue?.empCode || null)}
            renderInput={(params) => (
              <TextField {...params} label="Search and Select Employee" variant="outlined" size="small" />
            )}
          />
        </Paper>
      )}

      {selectedEmp && (
        <Box sx={{ mt: 2 }}>
          {/* Main Header */}
          <Box sx={{ bgcolor: '#1d4ed8', color: 'white', p: 1, textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
            EMPLOYEE PERFORMANCE 360 FROM DATE OF JOINING
          </Box>

          {/* Employee Info Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, '& th': { bgcolor: '#9ca3af', color: 'white', fontWeight: 'bold', textAlign: 'center', border: '1px solid #d1d5db' }, '& td': { textAlign: 'center', fontWeight: 'bold', border: '1px solid #d1d5db' } }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" width="50%">EMPLOYEE</TableCell>
                  <TableCell component="th" width="50%">DATE OF JOINING</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{selectedEmp.empName}</TableCell>
                  <TableCell>{selectedEmp.doj}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">TOTAL WORKING MONTHS --&gt;</TableCell>
                  <TableCell component="th">BRANCH</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{Math.floor(selectedEmp.workingMonth / 12)} YEAR - {selectedEmp.workingMonth % 12} MONTHS</TableCell>
                  <TableCell>{selectedEmp.branch}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">CURRENT TL</TableCell>
                  <TableCell component="th">CURRENT MANAGER</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{selectedEmp.currentTL}</TableCell>
                  <TableCell>{selectedEmp.currentManager}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th">LAST DAY OF WORK</TableCell>
                  <TableCell component="th">EMP CODE</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{selectedEmp.lwd}</TableCell>
                  <TableCell>{selectedEmp.empCode}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Snapshot */}
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined" sx={{ '& th': { fontWeight: 'bold', border: '1px solid #d1d5db' }, '& td': { textAlign: 'center', fontWeight: 'bold', border: '1px solid #d1d5db' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={2} sx={{ bgcolor: '#4ade80', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                        {selectedEmp.empName.toUpperCase()}'s SNAP SHOT
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th">TOTAL DISBURSED CASE</TableCell>
                      <TableCell>{selectedEmp.totalDisbursedCase} CASES</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">TOTAL DISBURSAL</TableCell>
                      <TableCell>₹{selectedEmp.totalDisbursal.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">CASH BACK</TableCell>
                      <TableCell>{selectedEmp.cashBack === 0 ? 'ZERO CASH BACK' : `₹${selectedEmp.cashBack.toLocaleString('en-IN')}`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">WORKING MONTH</TableCell>
                      <TableCell>{selectedEmp.workingMonth}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">PERFORMING MONTH</TableCell>
                      <TableCell>{selectedEmp.performingMonth}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">UNACTIVE MONTH</TableCell>
                      <TableCell>{selectedEmp.unactiveMonth}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">AVG MONTHLY DISBURSAL</TableCell>
                      <TableCell>₹{selectedEmp.avgMonthlyDisbursal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Disbursal Breakdown */}
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined" sx={{ '& th': { fontWeight: 'bold', border: '1px solid #d1d5db' }, '& td': { textAlign: 'center', fontWeight: 'bold', border: '1px solid #d1d5db' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={2} sx={{ bgcolor: '#f97316', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                        DISBURSAL BREAKDOWN
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th">UNSECURED DISBURSAL</TableCell>
                      <TableCell>₹{selectedEmp.unsecuredDisbursal.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th">SECURED DISBURSAL</TableCell>
                      <TableCell>₹{selectedEmp.securedDisbursal.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>

          {/* Month-wise Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ '& th': { bgcolor: '#3b82f6', color: 'white', fontWeight: 'bold', textAlign: 'center', border: '1px solid #d1d5db' }, '& td': { textAlign: 'center', fontWeight: 'bold', border: '1px solid #d1d5db' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell component="th">MONTH</TableCell>
                  <TableCell component="th">NO. OF DISBURSED</TableCell>
                  <TableCell component="th">NET AMOUNT</TableCell>
                  <TableCell component="th">MANAGER</TableCell>
                  <TableCell component="th">CASH BACK</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedEmp.sortedMonths.map((m: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{m.monthStr}</TableCell>
                    <TableCell>{m.noOfDisbursed}</TableCell>
                    <TableCell>₹{m.netAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{m.manager}</TableCell>
                    <TableCell>₹{m.cashBack.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        </Box>
      )}
    </Box>
  );
}
