import React, { useEffect, useState } from "react";



import {
  Button,
  Dialog,
  DialogContent,
  Card,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton
} from "@mui/material";
import { Add as AddIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';

import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from "@/redux/store";





import { fetchLeaves } from '@/redux/features/leaves/leavesSlice';
import AddLeavesForm from '@/components/leave/LeaveForm';

const TotalHolidays = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [showForm, setShowForm] = useState(false);
  const [selectedLeaves, setSelectedLeaves] = useState(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [employees, setEmployees] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { leaves, total } = useSelector((state: RootState) => state.leaves);

  const handleLeaveAddClick = () => {
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    dispatch(fetchLeaves({ page: page + 1, limit: rowsPerPage, keyword: selectedKeyword }));
  }, [dispatch, page, rowsPerPage, selectedKeyword]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'secondary';
      default:
        return 'success';
    }
  };

  return (
    <Card >
      <CardHeader
        title='Leaves'
        action={
          <Button
            variant='contained'
            color="primary"
            href="/leaves"
            startIcon={<AddIcon />}
          >
            Apply Leave
          </Button>
        }
      />
      <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
        <DialogContent>
          <AddLeavesForm
            handleClose={handleClose}
            leave={selectedLeaves}
            leaves={leaves}
            userRole={userRole}
            userId={userId}
            employees={employees}
            page={page + 1}
            limit={rowsPerPage}
            selectedKeyword={selectedKeyword}
          />
        </DialogContent>
      </Dialog>
      <TableContainer sx={{ height: '400px' }}>
        <Table >
          <TableHead>
            <TableRow>
              <TableCell>Days</TableCell>
              <TableCell>Start date</TableCell>
              <TableCell>End date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody >
            {
              leaves.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.day}</TableCell>
                  <TableCell>{row.start_date}</TableCell>
                  <TableCell>{row.end_date}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={getStatusColor(row.status)}
                      size='small'
                    />
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={total || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
};

export default TotalHolidays;
