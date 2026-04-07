'use client'

import React from 'react'
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    IconButton,
    Tooltip,
    Chip,
    Pagination,
    CircularProgress,
    Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ReceiptIcon from '@mui/icons-material/Receipt'

interface Payroll {
    _id: string
    employee: {
        _id: string
        first_name: string
        last_name: string
        code: string
        image: string
        designation: string
    }
    month: number
    year: number
    basicPay: number
    incentive: number
    totalPaydays: number
    leaveTaken: number
    leaveDeducted: number
    totalDeductions: number
    netAmount: number
    status: 'draft' | 'approved' | 'paid'
}

interface PayrollTableProps {
    loading: boolean
    payrolls: Payroll[]
    total: number
    page: number
    limit: number
    userRole: string
    onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void
    onEdit: (payroll: Payroll) => void
    onDelete: (payroll: Payroll) => void
    onViewPayslip: (payroll: Payroll) => void
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'paid':
            return 'success'
        case 'approved':
            return 'primary'
        default:
            return 'warning'
    }
}

const PayrollTable: React.FC<PayrollTableProps> = ({
    loading,
    payrolls,
    total,
    page,
    limit,
    userRole,
    onPageChange,
    onEdit,
    onDelete,
    onViewPayslip,
}) => {
    const totalPages = Math.ceil(total / limit)

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        )
    }

    if (payrolls.length === 0) {
        return (
            <Box textAlign="center" p={4}>
                <Typography color="text.secondary">No payroll records found</Typography>
            </Box>
        )
    }

    return (
        <Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Employee</TableCell>
                            <TableCell align="center">Period</TableCell>
                            <TableCell align="right">Basic Pay</TableCell>
                            <TableCell align="right">Incentive</TableCell>
                            <TableCell align="center">Leave Taken</TableCell>
                            <TableCell align="right">Deductions</TableCell>
                            <TableCell align="right">Net Amount</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payrolls.map((payroll) => (
                            <TableRow key={payroll._id} hover>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Avatar
                                            src={payroll.employee?.image}
                                            alt={`${payroll.employee?.first_name} ${payroll.employee?.last_name}`}
                                            sx={{ width: 36, height: 36 }}
                                        />
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {payroll.employee?.first_name} {payroll.employee?.last_name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {payroll.employee?.code}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    {payroll.month}/{payroll.year}
                                </TableCell>
                                <TableCell align="right">₹{payroll.basicPay?.toLocaleString()}</TableCell>
                                <TableCell align="right">₹{payroll.incentive?.toLocaleString()}</TableCell>
                                <TableCell align="center">{payroll.leaveTaken}</TableCell>
                                <TableCell align="right">₹{payroll.totalDeductions?.toLocaleString()}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                    ₹{payroll.netAmount?.toLocaleString()}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                                        color={getStatusColor(payroll.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="View Payslip">
                                        <IconButton size="small" onClick={() => onViewPayslip(payroll)}>
                                            <ReceiptIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {userRole === '1' && (
                                        <>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => onEdit(payroll)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => onDelete(payroll)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={onPageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    )
}

export default PayrollTable
