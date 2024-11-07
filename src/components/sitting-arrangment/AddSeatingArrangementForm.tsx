import React, { useEffect, useState } from 'react'
import {
    Button,
    TextField,
    DialogActions,
    FormControl,
    Autocomplete,
    Typography,
    Box,
    Snackbar,
    Alert,
    Grid
} from '@mui/material'
import { toast } from 'react-toastify'
import { apiResponse } from '../../utility/apiResponse/employeesResponse'
import { fetchSeatingArrangements } from '@/redux/features/sittingArrangment/seatingArrangementSlice'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/redux/store'

interface AddSeatingArrangementFormProps {
    seatingArrangementId?: string | null
    handleClose: () => void
    onFormSubmitSuccess: (message: string) => void
    onFormSubmitError: (message: string) => void
}

export default function AddSeatingArrangementForm({
    seatingArrangementId = null,
    handleClose,
    onFormSubmitSuccess,
    onFormSubmitError
}: AddSeatingArrangementFormProps) {
    const dispatch = useDispatch<AppDispatch>()

    const [employees, setEmployees] = useState<any[]>([])
    const [formData, setFormData] = useState({
        seatNo: '',
        employee: ''
    })

    const [errors, setErrors] = useState({
        seatNo: '',
        employee: ''
    })

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await apiResponse()
                setEmployees(data)
            } catch (error) {
                console.error('Failed to fetch employees')
            }
        }
        fetchEmployees()
    }, [])

    useEffect(() => {
        if (seatingArrangementId) {
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/${seatingArrangementId}`)
                .then(response => response.json())
                .then(data => {
                    setFormData({
                        seatNo: data.seatNo,
                        employee: data.employee._id
                    })
                })
        }
    }, [seatingArrangementId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleEmployeeChange = (event: any, newValue: any) => {
        setFormData(prev => ({ ...prev, employee: newValue?._id || '' }))
    }

    const validateForm = () => {
        let isValid = true
        const newErrors = { seatNo: '', employee: '' }

        if (!formData.seatNo.trim()) {
            newErrors.seatNo = 'Seat number is required'
            isValid = false
        }
        if (!formData.employee) {
            newErrors.employee = 'Employee is required'
            isValid = false
        }
        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = () => {
        if (!validateForm()) return

        const url = seatingArrangementId
            ? `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/update/${seatingArrangementId}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/create`

        const method = seatingArrangementId ? 'PUT' : 'POST'

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(async response => {
                const data = await response.json()
                if (response.ok) {
                    const successMessage = seatingArrangementId ? 'Seat updated successfully!' : 'Seat created successfully!'
                    dispatch(fetchSeatingArrangements({ page: 1, limit: 10 }))
                    handleClose()
                    onFormSubmitSuccess(successMessage)
                } else {
                    onFormSubmitError(data.message || 'Error saving seating arrangement')
                }
            })
            .catch(() => {
                onFormSubmitError('Error saving seating arrangement')
            })
    }

    return (
        <Box sx={{ p: 3, borderRadius: 2, boxShadow: 3, backgroundColor: 'background.paper' }}>
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                {seatingArrangementId ? 'Edit Seat' : 'Add Seat'}
            </Typography>

            <Grid item xs={12}>
                <FormControl fullWidth margin='normal' sx={{ bgcolor: 'white', borderRadius: 1 }}>
                    <Autocomplete
                        options={employees}
                        getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                        value={employees.find(emp => emp._id === formData.employee) || null}
                        onChange={handleEmployeeChange}
                        renderInput={params => (
                            <TextField {...params} label='Search Employee' fullWidth required variant='outlined' />
                        )}
                    />
                </FormControl>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label='Seat Number'
                        name='seatNo'
                        value={formData.seatNo}
                        onChange={handleInputChange}
                        error={!!errors.seatNo}
                        helperText={errors.seatNo}
                        margin='normal'
                        variant='outlined'
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                </Grid>
            </Grid>

            <DialogActions sx={{ mt: 3, justifyContent: 'center' }}>
                <Button onClick={handleClose} variant='outlined' color='secondary'>
                    Cancel
                </Button>
                <Button variant='contained' color='primary' onClick={handleSubmit}>
                    {seatingArrangementId ? 'Update' : 'Add'}
                </Button>
            </DialogActions>
        </Box>
    )
}
