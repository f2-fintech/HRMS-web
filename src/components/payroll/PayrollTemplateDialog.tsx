'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Button,
    TextField,
    Typography,
    FormControlLabel,
    Switch,
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

interface PayrollTemplateDialogProps {
    template: any
    onClose: () => void
    onSuccess: () => void
}

const PayrollTemplateDialog: React.FC<PayrollTemplateDialogProps> = ({
    template,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [basicPay, setBasicPay] = useState(0)
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        fetchEmployees()

        if (template) {
            setSelectedEmployee(template.employee)
            setBasicPay(template.basicPay || 0)
            setIsActive(template.isActive ?? true)
        }
    }, [template])

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

    const handleSubmit = async () => {
        if (!selectedEmployee) {
            toast.error('Please select an employee')
            return
        }

        if (basicPay <= 0) {
            toast.error('Basic pay must be greater than 0')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('token')
            const { company_id } = JSON.parse(localStorage.getItem('user') || '{}')

            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/payroll/templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token} ${company_id}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employee: selectedEmployee._id,
                    company_id,
                    basicPay,
                    isActive,
                }),
            })

            if (response.ok) {
                toast.success(template ? 'Template updated successfully' : 'Template created successfully')
                onSuccess()
            } else {
                const error = await response.json()
                toast.error(error.message || 'Failed to save template')
            }
        } catch (error) {
            toast.error('Error saving template')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                {template ? 'Edit Salary Template' : 'Create Salary Template'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Templates are used to auto-generate monthly payroll
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <Autocomplete
                    options={employees}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.code})`}
                    value={selectedEmployee}
                    onChange={(_e, value) => setSelectedEmployee(value)}
                    disabled={!!template}
                    renderInput={(params) => (
                        <TextField {...params} label="Select Employee" required />
                    )}
                />

                <TextField
                    fullWidth
                    label="Basic Pay"
                    type="number"
                    value={basicPay}
                    onChange={(e) => setBasicPay(parseFloat(e.target.value) || 0)}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                    }
                    label="Active (include in monthly generation)"
                />
            </Box>

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
                    {loading ? <CircularProgress size={24} /> : template ? 'Update' : 'Create'}
                </Button>
            </Box>
        </Box>
    )
}

export default PayrollTemplateDialog
