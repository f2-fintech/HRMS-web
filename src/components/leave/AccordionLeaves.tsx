import React, { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { DriveFileRenameOutlineOutlined, CalendarMonth, EventAvailable, Category, Note, VisibilityOutlined } from '@mui/icons-material';
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
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Category fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">Type:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', ml: 1 }}>
                  {leave.type}
                </Typography>
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityOutlined fontSize="small" />}
              onClick={() => handleClickOpen(leave._id)}
              sx={{ borderRadius: '8px' }}
            >
              View
            </Button>

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
                <TableCell>{leave.type}</TableCell>
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
        <Box display="flex" alignItems="center" width="100%" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Tooltip title="View Profile" arrow>
              <Avatar
                src={params.row.employee.image || ''}
                sx={{
                  width: 36,
                  height: 36,
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  border: `2px solid ${theme.palette.background.paper}`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToProfile(params.row.employee._id);
                }}
              />
            </Tooltip>
            <Box ml={2}>
              <Typography sx={{
                fontSize: '1em',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                color: theme.palette.text.primary
              }}>
                {params.row.employee.first_name} {params.row.employee.last_name}
              </Typography>
              {!isMobile && (
                <Typography variant="caption" color="text.secondary">
                  Employee ID: {params.row.employee._id.substring(0, 8)}...
                </Typography>
              )}
            </Box>
          </Box>
          <Box display="flex" alignItems="center">
            <Chip
              label={`${Array.isArray(params.row.leaves) ? params.row.leaves.length : 0} Leaves`}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.dark,
                fontWeight: 'medium',
                borderRadius: '16px'
              }}
            />
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
