import React, { useState } from 'react';
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
  DialogContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContrastIcon from '@mui/icons-material/Contrast';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';
import { format } from 'date-fns';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material';

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

  const getRowBackgroundColor = (status: string) => {
    if (status === 'Approved') {
      return 'rgba(76, 175, 80, 0.2)'
    } else if (status === 'Rejected') {
      return 'rgba(244, 67, 54, 0.2)'
    } else if (status === 'Pending') {
      return 'rgba(255, 193, 7, 0.2)'
    }
    return ''
  }

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" height="100%" width="100%" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Avatar
              src={params.row.employee.image}
              sx={{ marginLeft: 10, width: 30, height: 30 }}
            />
            <Typography sx={{ fontSize: '1em', fontWeight: 'bold', textTransform: 'capitalize', marginLeft: 4 }}>
              {params.row.employee.first_name} {params.row.employee.last_name}
            </Typography>
          </Box>
          <Box>
            <Typography>{`View all Leaves (${Array.isArray(params.row.leaves) ? params.row.leaves.length : 0})`}</Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ marginTop: 5 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Days</StyledTableCell>
              <StyledTableCell>Start Date</StyledTableCell>
              <StyledTableCell>End Date</StyledTableCell>
              <StyledTableCell>Type</StyledTableCell>
              <StyledTableCell>Application</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Decision</StyledTableCell>
              <StyledTableCell>Edit</StyledTableCell>
              <StyledTableCell>Delete</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(params.row.leaves) && params.row.leaves.length > 0 ? (
              params.row.leaves.map((leave: any) => {
                const dayValue = parseFloat(leave.day);
                const halfPeriod = leave.half_day_period;

                return (
                  <TableRow key={leave._id} style={{ backgroundColor: getRowBackgroundColor(leave.status) }}>
                    {dayValue === 0.5 && halfPeriod ? (
                      <TableCell>
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <ContrastIcon
                            sx={{
                              color: '#989c9a',
                              fontSize: 40,
                            }}
                          />
                          <Typography
                            fontWeight="bold"
                            fontSize="0.9em"
                            color="black"
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
                      <TableCell sx={{ paddingLeft: '25px' }}>{leave.day}</TableCell>
                    )}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {leave.start_date ? format(new Date(leave.start_date), 'dd-MMM-yyyy').toUpperCase() : ''}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {leave.end_date ? format(new Date(leave.end_date), 'dd-MMM-yyyy').toUpperCase() : ''}
                    </TableCell>
                    <TableCell>{leave.type}</TableCell>
                    <TableCell>
                      <Button variant="outlined" onClick={() => handleClickOpen(leave._id)}>
                        View
                      </Button>
                      <BootstrapDialog
                        onClose={() => handleClose(leave._id)}
                        aria-labelledby={`customized-dialog-title-${leave._id}`}
                        open={openDialogs[leave._id] || false}
                      >
                        <DialogTitle sx={{ m: 0, p: 2 }} id={`customized-dialog-title-${leave._id}`}>
                          Application
                        </DialogTitle>
                        <IconButton
                          aria-label="close"
                          onClick={() => handleClose(leave._id)}
                          sx={(theme) => ({
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: theme.palette.grey[500],
                          })}
                        >
                          <CloseIcon />
                        </IconButton>
                        <DialogContent>
                          <Typography>
                            {leave.application}
                          </Typography>
                        </DialogContent>
                      </BootstrapDialog>
                    </TableCell>
                    <TableCell>{leave.status}</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>{leave.reason}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        sx={{ minWidth: '50px', backgroundColor: '#2c3ce3' }}
                        onClick={() => handleLeaveEditClick(leave._id)}
                      >
                        <DriveFileRenameOutlineOutlined />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        sx={{ minWidth: '50px', backgroundColor: 'red' }}
                        onClick={() => handleLeavedelete(leave._id)}
                      >
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No leaves available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
};

export default AccordionLeaves;
