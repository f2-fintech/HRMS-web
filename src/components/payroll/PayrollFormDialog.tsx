'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Button,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Autocomplete,
    CircularProgress,
} from '@mui/material'
import { toast } from 'react-toastify'

interface Employee {
    _id: string
    first_name: string
    last_name: string
    code: string
}

interface PayrollFormDialogProps {
    payroll: any
    month: number
    year: number
    onClose: () => void
    onSuccess: () => void
}

const PayrollFormDialog: React.FC<PayrollFormDialogProps> = ({
    payroll,
    month,
    year,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [formData, setFormData] = useState({
        basicPay: 0,
        incentive: 0,
        totalPaydays: 30,
        leaveTaken: 0,
        leaveDeducted: 0,
        status: 'draft',
        remarks: '',
    })

    useEffect(() => {
        fetchEmployees()

        if (payroll) {
            setSelectedEmployee(payroll.employee)
            setFormData({
                basicPay: payroll.basicPay || 0,
                incentive: payroll.incentive || 0,
                totalPaydays: payroll.totalPaydays || 30,
                leaveTaken: payroll.leaveTaken || 0,
                leaveDeducted: payroll.leaveDeducted || 0,
                status: payroll.status || 'draft',
                remarks: payroll.remarks || '',
            })
        }
    }, [payroll])

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token')
            const { company_id } = JSON.parse(localStorage.getItem('user') || '{}')

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/getAll?page=1&limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setEmployees(data.employees || [])
            }
        } catch (error) {
            console.error('Error fetching employees:', error)
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        if (!selectedEmployee) {
            toast.error('Please select an employee')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('token')
            const { company_id } = JSON.parse(localStorage.getItem('user') || '{}')

            const url = payroll
                ? `${process.env.NEXT_PUBLIC_APP_URL}/payroll/${payroll._id}`
                : `${process.env.NEXT_PUBLIC_APP_URL}/payroll`

            const method = payroll ? 'PATCH' : 'POST'

            const body = {
                ...formData,
                employee: selectedEmployee._id,
                company_id,
                month,
                year,
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })

            if (response.ok) {
                toast.success(payroll ? 'Payroll updated successfully' : 'Payroll created successfully')
                onSuccess()
            } else {
                const error = await response.json()
                toast.error(error.message || 'Failed to save payroll')
            }
        } catch (error) {
            toast.error('Error saving payroll')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {payroll ? 'Edit Payroll' : 'Create Payroll'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Period: {month}/{year}
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Autocomplete
                        options={employees}
                        getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.code})`}
                        value={selectedEmployee}
                        onChange={(_e, value) => setSelectedEmployee(value)}
                        disabled={!!payroll}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Employee" required />
                        )}
                    />
                </Grid>

                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Basic Pay"
                        type="number"
                        value={formData.basicPay}
                        onChange={(e) => handleChange('basicPay', parseFloat(e.target.value) || 0)}
                    />
                </Grid>

                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Incentive"
                        type="number"
                        value={formData.incentive}
                        onChange={(e) => handleChange('incentive', parseFloat(e.target.value) || 0)}
                    />
                </Grid>

                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="Total Paydays"
                        type="number"
                        value={formData.totalPaydays}
                        onChange={(e) => handleChange('totalPaydays', parseFloat(e.target.value) || 0)}
                    />
                </Grid>

                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="Leave Taken"
                        type="number"
                        value={formData.leaveTaken}
                        onChange={(e) => handleChange('leaveTaken', parseFloat(e.target.value) || 0)}
                    />
                </Grid>

                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="Leave Deducted"
                        type="number"
                        value={formData.leaveDeducted}
                        onChange={(e) => handleChange('leaveDeducted', parseFloat(e.target.value) || 0)}
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={formData.status}
                            label="Status"
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Remarks"
                        multiline
                        rows={2}
                        value={formData.remarks}
                        onChange={(e) => handleChange('remarks', e.target.value)}
                    />
                </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
                <Button variant="outlined" onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    sx={{ backgroundColor: '#ff902f' }}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : payroll ? 'Update' : 'Create'}
                </Button>
            </Box>
        </Box>
    )
}

export default PayrollFormDialog
