'use client';
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

import {
  getCasesForKpi,
  getKpiLabel,
  getKpiValue,
  type KPIType,
  type Row,
} from '../_utils/casesFilters';

const rupee = (n: number) =>
  `₹${Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

export default function KPICasesModal({
  open,
  onClose,
  rows,
  kpi,
}: {
  open: boolean;
  onClose: () => void;
  rows: Row[];
  kpi: KPIType;
}) {
  const cases = useMemo(() => getCasesForKpi(rows, kpi), [rows, kpi]);
  const title = `${getKpiLabel(kpi)} Cases (${cases.length})`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: '0 25px 60px rgba(15,23,42,0.35)' },
      }}
    >
      <DialogTitle
        sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <VisibilityIcon sx={{ color: '#0E7490' }} />
        {title}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
        {cases.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <Typography color="text.secondary">No cases found.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                  <TableCell sx={{ fontWeight: 900 }}>S.No.</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Manager / TL</TableCell>

                  <TableCell align="right" sx={{ fontWeight: 900, color: '#0E7490' }}>
                    {getKpiLabel(kpi)} (₹)
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    Net Approval (₹)
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    Net Disbursal (₹)
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {cases.map((r, idx) => (
                  <TableRow key={r._id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 900 }}>{idx + 1}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#4b5563' }}>
                        {r.date ? dayjs(r.date).format('DD-MM-YYYY') : '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 900, color: '#1E293B' }}>
                        {r.employee_name || '-'}
                      </Typography>
                      {r.employee_id && (
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {r.employee_id}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        {r.code || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {r.manager_tl ? (
                        <Chip
                          size="small"
                          label={r.manager_tl}
                          sx={{ bgcolor: '#F3E8FF', fontWeight: 800, color: '#6b21a8' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={rupee(getKpiValue(r, kpi))}
                        sx={{ bgcolor: '#CFFAFE', color: '#0E7490', fontWeight: 900 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={rupee(Number(r.approval || 0))}
                        sx={{ bgcolor: '#E0F2FE', color: '#1E40AF', fontWeight: 900 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={rupee(Number(r.disbursal || 0))}
                        sx={{ bgcolor: '#EDE9FE', color: '#6D28D9', fontWeight: 900 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
