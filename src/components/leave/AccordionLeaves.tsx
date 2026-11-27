import React, { useState, useEffect, useMemo } from 'react';
import {
  Avatar,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  DialogContent,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Fade
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContrastIcon from '@mui/icons-material/Contrast';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { format } from 'date-fns';
import { DriveFileRenameOutlineOutlined, CalendarMonth, EventAvailable, Category, Note, VisibilityOutlined } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import useRouterWithMount from '@/utility/useRouterWithMount';

interface AccordionLeavesProps {
  params: any;
  handleLeaveEditClick: (id: string) => void;
  handleLeavedelete: (id: string) => void;
  StyledTableCell: React.ElementType;
  BootstrapDialog: React.ElementType;
}

const AccordionLeaves: React.FC<AccordionLeavesProps> = ({
  params,
  handleLeaveEditClick,
  handleLeavedelete,
  StyledTableCell,
  BootstrapDialog
}) => {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<boolean>(false);
  const [fadeIn, setFadeIn] = useState<boolean>(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { navigateToProfile } = useRouterWithMount();

  // Holidays from Redux store to identify which holidays were taken
  const { holidays, pastHolidays } = useSelector((state: RootState) => state.holidays || { holidays: [], pastHolidays: [] });

  const allHolidaysList = useMemo(() => {
    return [...(holidays || []), ...(pastHolidays || [])];
  }, [holidays, pastHolidays]);

  // Compute breakdown: Total, Holiday, Compensatory, and Regular (excl Holiday & Comp)
  const leaveStats = useMemo(() => {
    const list = Array.isArray(params.row.leaves) ? params.row.leaves : [];

    let totalDays = 0;
    let holidayDays = 0;
    let compDays = 0;
    let regularDays = 0;

    const holidayDetails: Array<{ title: string; date: string; days: number }> = [];

    list.forEach((l: any) => {
      const d = parseFloat(l.day) || 1;
      totalDays += d;

      const typeLower = String(l.type || '').toLowerCase();
      const isComp = typeLower.includes('compensatory') || typeLower.includes('complimentary') || typeLower.includes('comp');

      // Check if festival or matches a holiday date
      const sDateStr = l.start_date ? String(l.start_date).slice(0, 10) : '';
      const matchedH = allHolidaysList.find((h: any) => {
        const hStart = String(h.start_date).slice(0, 10);
        const hEnd = String(h.end_date || h.start_date).slice(0, 10);
        return sDateStr && sDateStr >= hStart && sDateStr <= hEnd;
      });

      const isHoliday = typeLower.includes('festival') || typeLower.includes('holiday') || Boolean(matchedH);

      if (isHoliday) {
        holidayDays += d;
        holidayDetails.push({
          title: matchedH?.title || l.type || 'Holiday/Festival',
          date: l.start_date ? format(new Date(l.start_date), 'dd MMM yyyy') : '',
          days: d
        });
      } else if (isComp) {
        compDays += d;
      } else {
        regularDays += d;
      }
    });

    const round1 = (val: number) => Math.round(val * 10) / 10;

    return {
      totalDays: round1(totalDays),
      holidayDays: round1(holidayDays),
      compDays: round1(compDays),
      regularDays: round1(regularDays),
      count: list.length,
      holidayDetails
    };
  }, [params.row.leaves, allHolidaysList]);

  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFadeIn(false);
    }
  }, [expanded]);

  const handleExpandChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const handleClickOpen = (leaveId: string) => {
    setOpenDialogs(prev => ({
      ...prev,
      [leaveId]: true
    }));
  };

  const handleClose = (leaveId: string) => {
    setOpenDialogs(prev => ({
      ...prev,
      [leaveId]: false
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return {
          bg: 'rgba(76, 175, 80, 0.1)',
          color: '#2e7d32',
          chipBg: 'rgba(76, 175, 80, 0.2)',
          chipColor: '#1b5e20'
        };
      case 'Rejected':
        return {
          bg: 'rgba(244, 67, 54, 0.1)',
          color: '#d32f2f',
          chipBg: 'rgba(244, 67, 54, 0.2)',
          chipColor: '#b71c1c'
        };
      case 'Pending':
        return {
          bg: 'rgba(255, 193, 7, 0.1)',
          color: '#ed6c02',
          chipBg: 'rgba(255, 193, 7, 0.2)',
          chipColor: '#e65100'
        };
      default:
        return {
          bg: 'transparent',
          color: 'text.primary',
          chipBg: 'rgba(0, 0, 0, 0.08)',
          chipColor: 'text.primary'
        };
    }
  };

  const renderMobileView = (leave: any) => {
    const dayValue = parseFloat(leave.day);
    const halfPeriod = leave.half_day_period;
    const statusColors = getStatusColor(leave.status);

    return (
      <Card
        key={leave._id}
        elevation={1}
        sx={{
          mb: 2,
          borderRadius: '12px',
          backgroundColor: statusColors.bg,
          borderLeft: `4px solid ${statusColors.color}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          }
        }}
      >
        <CardContent sx={{ pb: '16px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip
              label={leave.status}
              size="small"
              sx={{
                backgroundColor: statusColors.chipBg,
                color: statusColors.chipColor,
                fontWeight: 'bold',
                mb: 1
              }}
            />
            {dayValue === 0.5 && halfPeriod ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ContrastIcon sx={{ color: theme.palette.text.secondary, fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" fontWeight="medium">
                  {halfPeriod === 'First Half' ? 'First Half' : 'Second Half'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" fontWeight="medium">
                {leave.day} {Number(leave.day) === 1 ? 'Day' : 'Days'}
              </Typography>
            )}
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonth fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Start:</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3 }}>
                {leave.start_date ? format(new Date(leave.start_date), 'dd MMM yyyy') : ''}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventAvailable fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">End:</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 3 }}>
                {leave.end_date ? format(new Date(leave.end_date), 'dd MMM yyyy') : ''}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 0.8 }}>
                <Category fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Type:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
                  {leave.type}
                </Typography>
                {(() => {
                  const typeLower = String(leave.type || '').toLowerCase();
                  const isComp = typeLower.includes('compensatory') || typeLower.includes('complimentary') || typeLower.includes('comp');
                  if (isComp) {
                    return (
                      <Chip
                        size="small"
                        icon={<AccountBalanceWalletIcon sx={{ fontSize: '13px !important', color: '#7c3aed !important' }} />}
                        label="Comp Off (0.5D)"
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          bgcolor: 'rgba(124, 58, 237, 0.12)',
                          color: '#7c3aed',
                          border: '1px solid rgba(124, 58, 237, 0.35)'
                        }}
                      />
                    );
                  }
                  const sDateStr = leave.start_date ? String(leave.start_date).slice(0, 10) : '';
                  const matchedH = allHolidaysList.find((h: any) => {
                    const hStart = String(h.start_date).slice(0, 10);
                    const hEnd = String(h.end_date || h.start_date).slice(0, 10);
                    return sDateStr && sDateStr >= hStart && sDateStr <= hEnd;
                  });
                  if (matchedH) {
                    return (
                      <Chip
                        size="small"
                        icon={<CelebrationIcon sx={{ fontSize: '13px !important', color: '#e65100 !important' }} />}
                        label={`${matchedH.title} (Holiday)`}
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          bgcolor: 'rgba(255, 152, 0, 0.15)',
                          color: '#e65100',
                          border: '1px solid rgba(255, 152, 0, 0.35)'
                        }}
                      />
                    );
                  }
                  if (typeLower === 'absent') {
                    return (
                      <Chip
                        size="small"
                        label="Absent"
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          bgcolor: 'rgba(244, 67, 54, 0.12)',
                          color: '#d32f2f',
                          border: '1px solid rgba(244, 67, 54, 0.35)'
                        }}
                      />
                    );
                  }
                  if (leave.isFromAttendance) {
                    return (
                      <Chip
                        size="small"
                        label="Attendance"
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(2, 136, 209, 0.1)',
                          color: '#0288d1',
                          border: '1px solid rgba(2, 136, 209, 0.3)'
                        }}
                      />
                    );
                  }
                  return null;
                })()}
              </Box>
            </Grid>

            {leave.reason && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Note fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="text.secondary">Decision:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
                    {leave.reason}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityOutlined fontSize="small" />}
              onClick={() => handleClickOpen(leave._id)}
              sx={{ borderRadius: '8px' }}
            >
              View
            </Button>

            {leave.isFromAttendance ? (
              <Chip
                label="Marked in Attendance"
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#0288d1',
                  borderColor: 'rgba(2, 136, 209, 0.35)'
                }}
              />
            ) : (
              <Box>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleLeaveEditClick(leave._id)}
                  sx={{
                    mr: 1,
                    backgroundColor: 'rgba(44, 60, 227, 0.1)',
                    '&:hover': { backgroundColor: 'rgba(44, 60, 227, 0.2)' }
                  }}
                >
                  <DriveFileRenameOutlineOutlined fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleLeavedelete(leave._id)}
                  sx={{
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderDesktopTable = () => (
    <Table size={isTablet ? "small" : "medium"}>
      <TableHead>
        <TableRow>
          <StyledTableCell>Days</StyledTableCell>
          <StyledTableCell>Start Date</StyledTableCell>
          <StyledTableCell>End Date</StyledTableCell>
          <StyledTableCell>Type</StyledTableCell>
          <StyledTableCell>Application</StyledTableCell>
          <StyledTableCell>Status</StyledTableCell>
          <StyledTableCell>Decision</StyledTableCell>
          <StyledTableCell align="center">Actions</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.isArray(params.row.leaves) && params.row.leaves.length > 0 ? (
          params.row.leaves.map((leave: any) => {
            const dayValue = parseFloat(leave.day);
            const halfPeriod = leave.half_day_period;
            const statusColors = getStatusColor(leave.status);

            return (
              <TableRow
                key={leave._id}
                sx={{
                  backgroundColor: statusColors.bg,
                  borderLeft: `4px solid ${statusColors.color}`,
                  '&:hover': {
                    backgroundColor: `${statusColors.bg.replace('0.1', '0.15')}`,
                  }
                }}
              >
                {dayValue === 0.5 && halfPeriod ? (
                  <TableCell>
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ContrastIcon
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: 32,
                        }}
                      />
                      <Typography
                        fontWeight="bold"
                        fontSize="0.75em"
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {halfPeriod === 'First Half' ? 'FH' : 'SH'}
                      </Typography>
                    </Box>
                  </TableCell>
                ) : (
                  <TableCell>{leave.day}</TableCell>
                )}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {leave.start_date ? format(new Date(leave.start_date), 'dd MMM yyyy') : ''}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {leave.end_date ? format(new Date(leave.end_date), 'dd MMM yyyy') : ''}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                    <Typography variant="body2">{leave.type}</Typography>
                    {(() => {
                      const typeLower = String(leave.type || '').toLowerCase();
                      const isComp = typeLower.includes('compensatory') || typeLower.includes('complimentary') || typeLower.includes('comp');
                      if (isComp) {
                        return (
                          <Chip
                            size="small"
                            icon={<AccountBalanceWalletIcon sx={{ fontSize: '13px !important', color: '#7c3aed !important' }} />}
                            label="Comp Off (0.5D)"
                            sx={{
                              height: 22,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(124, 58, 237, 0.12)',
                              color: '#7c3aed',
                              border: '1px solid rgba(124, 58, 237, 0.35)'
                            }}
                          />
                        );
                      }
                      const sDateStr = leave.start_date ? String(leave.start_date).slice(0, 10) : '';
                      const matchedH = allHolidaysList.find((h: any) => {
                        const hStart = String(h.start_date).slice(0, 10);
                        const hEnd = String(h.end_date || h.start_date).slice(0, 10);
                        return sDateStr && sDateStr >= hStart && sDateStr <= hEnd;
                      });
                      if (matchedH) {
                        return (
                          <Chip
                            size="small"
                            icon={<CelebrationIcon sx={{ fontSize: '13px !important', color: '#e65100 !important' }} />}
                            label={`${matchedH.title} (Holiday)`}
                            sx={{
                              height: 22,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(255, 152, 0, 0.15)',
                              color: '#e65100',
                              border: '1px solid rgba(255, 152, 0, 0.35)'
                            }}
                          />
                        );
                      }
                      if (typeLower === 'absent') {
                        return (
                          <Chip
                            size="small"
                            label="Absent"
                            sx={{
                              height: 22,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(244, 67, 54, 0.12)',
                              color: '#d32f2f',
                              border: '1px solid rgba(244, 67, 54, 0.35)'
                            }}
                          />
                        );
                      }
                      if (leave.isFromAttendance) {
                        return (
                          <Chip
                            size="small"
                            label="Attendance"
                            sx={{
                              height: 22,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              bgcolor: 'rgba(2, 136, 209, 0.1)',
                              color: '#0288d1',
                              border: '1px solid rgba(2, 136, 209, 0.3)'
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityOutlined />}
                    onClick={() => handleClickOpen(leave._id)}
                    sx={{ borderRadius: '8px' }}
                  >
                    View
                  </Button>
                </TableCell>
                <TableCell>
                  <Chip
                    label={leave.status}
                    size="small"
                    sx={{
                      backgroundColor: statusColors.chipBg,
                      color: statusColors.chipColor,
                      fontWeight: 'bold'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 100 }}>{leave.reason}</TableCell>
                <TableCell>
                  {leave.isFromAttendance ? (
                    <Box display="flex" justifyContent="center">
                      <Chip
                        label="From Attendance"
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 24,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#0288d1',
                          borderColor: 'rgba(2, 136, 209, 0.35)'
                        }}
                      />
                    </Box>
                  ) : (
                    <Box display="flex" justifyContent="center">
                      <Tooltip title="Edit Leave" arrow>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleLeaveEditClick(leave._id)}
                          sx={{
                            mr: 1,
                            backgroundColor: 'rgba(44, 60, 227, 0.1)',
                            '&:hover': { backgroundColor: 'rgba(44, 60, 227, 0.2)' }
                          }}
                        >
                          <DriveFileRenameOutlineOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Leave" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleLeavedelete(leave._id)}
                          sx={{
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={8} align="center">
              <Typography variant="body2" sx={{ py: 2, color: theme.palette.text.secondary }}>
                No leaves available
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Application View Dialog that's used for both mobile and desktop
  const renderApplicationDialog = (leave: any) => (
    <BootstrapDialog
      onClose={() => handleClose(leave._id)}
      aria-labelledby={`customized-dialog-title-${leave._id}`}
      open={openDialogs[leave._id] || false}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          fontWeight: 600,
          fontSize: '1.25rem',
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        id={`customized-dialog-title-${leave._id}`}
      >
        <Box display="flex" alignItems="center">
          <Note sx={{ mr: 1.5 }} />
          Leave Application
        </Box>
        <Box>
          <Chip
            label={leave.status}
            size="small"
            sx={{
              backgroundColor: getStatusColor(leave.status).chipBg,
              color: getStatusColor(leave.status).chipColor,
              fontWeight: 'bold',
              mr: 2
            }}
          />
        </Box>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => handleClose(leave._id)}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
          '&:hover': {
            color: (theme) => theme.palette.grey[700],
            backgroundColor: (theme) => theme.palette.grey[100]
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        sx={{
          p: 3,
          minWidth: { xs: 300, sm: 400 },
          maxHeight: 500,
          overflowY: 'auto'
        }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Type
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leave.type}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Duration
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leave.day} {Number(leave.day) === 1 ? 'Day' : 'Days'}
              {parseFloat(leave.day) === 0.5 && leave.half_day_period ? ` (${leave.half_day_period})` : ''}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              From
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leave.start_date ? format(new Date(leave.start_date), 'dd MMM yyyy') : ''}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              To
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {leave.end_date ? format(new Date(leave.end_date), 'dd MMM yyyy') : ''}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
          Application Details
        </Typography>
        <Typography
          sx={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'text.primary',
            backgroundColor: theme.palette.background.default,
            p: 2,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {leave.application || "No application details provided."}
        </Typography>

        {leave.reason && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
              Decision Remarks
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'text.primary',
                backgroundColor: getStatusColor(leave.status).bg,
                p: 2,
                borderRadius: 1,
                border: `1px solid ${getStatusColor(leave.status).chipBg}`
              }}
            >
              {leave.reason}
            </Typography>
          </>
        )}
      </DialogContent>
    </BootstrapDialog>
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={handleExpandChange}
      sx={{
        borderRadius: '12px',
        mb: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        '&:before': {
          display: 'none'
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
          backgroundColor: theme.palette.background.default,
          transition: 'all 0.3s ease',
          minHeight: 64,
          '&:hover': {
            backgroundColor: theme.palette.action.hover
          }
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          width="100%"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
        >
          {/* Employee Avatar & Name */}
          <Box display="flex" alignItems="center" sx={{ minWidth: 200 }}>
            <Tooltip title="View Profile" arrow>
              <Avatar
                src={params.row.employee?.image || ''}
                sx={{
                  width: 38,
                  height: 38,
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  border: `2px solid ${theme.palette.background.paper}`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToProfile(params.row.employee?._id);
                }}
              />
            </Tooltip>
            <Box ml={2}>
              <Typography sx={{
                fontSize: '1em',
                fontWeight: 700,
                textTransform: 'capitalize',
                color: theme.palette.text.primary
              }}>
                {params.row.employee?.first_name} {params.row.employee?.last_name}
              </Typography>
              {params.row.employee?.designation && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {params.row.employee.designation}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Badges / Chips Group */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Holiday Leave Chip with Tooltip listing holidays */}
            <Tooltip
              arrow
              title={
                leaveStats.holidayDetails.length > 0 ? (
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                      Holiday(s) Taken:
                    </Typography>
                    {leaveStats.holidayDetails.map((hd, hidx) => (
                      <Typography key={hidx} variant="caption" sx={{ display: 'block' }}>
                        • {hd.title} ({hd.date}) — <b>{hd.days} {hd.days === 1 ? 'day' : 'days'}</b>
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  'No holiday/festival leaves taken'
                )
              }
            >
              <Chip
                icon={<CelebrationIcon sx={{ fontSize: '16px !important', color: '#e65100 !important' }} />}
                label={`Holiday: ${leaveStats.holidayDays}D`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 152, 0, 0.12)',
                  color: '#e65100',
                  border: '1px solid rgba(255, 152, 0, 0.35)',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>

            {/* 2. Compensatory Leave Chip */}
            <Tooltip
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.3 }}>
                    Comp Off Taken: {leaveStats.compDays} day(s)
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • Max 0.5 day/month (Half Day).
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • Option 1: Earned by Last Sunday half-day or full-day work.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • Option 2: Monthly 0.5 allowance (e.g. after 1.5 regular leaves).
                  </Typography>
                </Box>
              }
              arrow
            >
              <Chip
                icon={<AccountBalanceWalletIcon sx={{ fontSize: '16px !important', color: '#7c3aed !important' }} />}
                label={`Comp Off: ${leaveStats.compDays}D`}
                size="small"
                sx={{
                  bgcolor: 'rgba(124, 58, 237, 0.10)',
                  color: '#7c3aed',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: '16px',
                  cursor: 'pointer'
                }}
              />
            </Tooltip>

            {/* 3. Regular Leave Chip (without Holiday and Comp Off) */}
            <Tooltip title={`Regular leaves (excl. Holiday & Comp Off): ${leaveStats.regularDays} day(s)`} arrow>
              <Chip
                icon={<EventAvailable sx={{ fontSize: '16px !important', color: '#0284c7 !important' }} />}
                label={`Regular: ${leaveStats.regularDays}D`}
                size="small"
                sx={{
                  bgcolor: 'rgba(2, 132, 199, 0.10)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.35)',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: '16px'
                }}
              />
            </Tooltip>

            {/* 4. Total Leaves Chip */}
            <Tooltip title={`Total: ${leaveStats.totalDays} day(s) across ${leaveStats.count} application(s)`} arrow>
              <Chip
                label={`Total: ${leaveStats.totalDays}D`}
                size="small"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 12,
                  borderRadius: '16px',
                  boxShadow: '0 2px 4px rgba(44, 60, 227, 0.25)'
                }}
              />
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{
        p: isMobile ? 2 : 3,
        transition: 'opacity 0.3s ease-in-out',
        opacity: fadeIn ? 1 : 0
      }}>
        {isMobile ? (
          <Box>
            {Array.isArray(params.row.leaves) && params.row.leaves.length > 0 ? (
              params.row.leaves.map((leave: any) => renderMobileView(leave))
            ) : (
              <Box sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '8px',
                backgroundColor: theme.palette.background.default
              }}>
                <Typography color="text.secondary">No leaves available</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            {renderDesktopTable()}
          </Box>
        )}

        {/* Render all dialogs for both views */}
        {Array.isArray(params.row.leaves) && params.row.leaves.map((leave: any) => renderApplicationDialog(leave))}
      </AccordionDetails>
    </Accordion>
  );
};

export default AccordionLeaves;
