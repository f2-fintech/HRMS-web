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
    seatNo?: string | null
    handleClose: () => void
    onFormSubmitSuccess: (message: string) => void
    onFormSubmitError: (message: string) => void
}

export default function AddSeatingArrangementForm({
    seatingArrangementId = null,
    seatNo = null,
    handleClose,
    onFormSubmitSuccess,
    onFormSubmitError
}: AddSeatingArrangementFormProps) {
    const dispatch = useDispatch<AppDispatch>()

    const [employees, setEmployees] = useState<any[]>([])
    const [formData, setFormData] = useState({
        seatNo: seatNo || '',
        employee: ''
    })

    const [errors, setErrors] = useState({
        seatNo: '',
        employee: ''
    })

    const isClearSeatAction = formData.employee === ''

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
                        employee: data.employee?._id
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

        if (!seatingArrangementId && !formData.employee) {
            newErrors.employee = 'Employee is required'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleClearSeat = () => {
        setFormData(prev => ({ ...prev, employee: '' }))
        setErrors(prev => ({ ...prev, employee: '' }))
    }

    const handleSubmit = () => {
        if (!validateForm()) return

        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const companyId = user.company_id

        const url = seatingArrangementId
            ? `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/update/${seatingArrangementId}`
            : `${process.env.NEXT_PUBLIC_APP_URL}/seating-arrangement/create`

        const method = seatingArrangementId ? 'PUT' : 'POST'

        const requestData = {
            ...formData,
            employee: formData.employee || null,
            company_id: companyId
        };

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
            .then(async response => {
                const data = await response.json()

                // Explicitly check for a 409 Conflict status
                if (response.status === 409) {
                    // Handle 409 Conflict specifically
                    onFormSubmitError(data.message || 'This seat number is already allocated in the specified location.')
                } else if (response.ok) {
                    // Success case
                    const successMessage = seatingArrangementId ? 'Seat updated successfully!' : 'Seat created successfully!'
                    setErrors({ seatNo: '', employee: '' });
                    dispatch(fetchSeatingArrangements({ page: 1, limit: 10 }))
                    handleClose()
                    onFormSubmitSuccess(successMessage)
                } else {
                    // Handle other errors
                    onFormSubmitError(data.message || 'Error saving seating arrangement')
                }
            })
            .catch(() => {
                // Network or other unexpected errors
                onFormSubmitError('Error saving seating arrangement')
            })
    }

    return (
        <Box sx={{
            p: 4,
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.5)'
        }}>
            <Typography variant='h5' sx={{ mb: 4, fontWeight: 900, textAlign: 'center', color: '#2c3e50', letterSpacing: 1 }}>
                {seatingArrangementId ? 'EDIT SEAT ALLOCATION' : 'ALLOCATE SEAT'}
            </Typography>

            <Grid item xs={12}>
                <FormControl fullWidth margin='normal'>
                    <Autocomplete
                        options={employees}
                        getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                        value={employees.find(emp => emp._id === formData.employee) || null}
                        onChange={handleEmployeeChange}
                        clearOnEscape
                        renderInput={params => (
                            <TextField {...params} label={isClearSeatAction ? 'Employee (Seat will be cleared)' : 'Search Employee'} fullWidth required={!seatingArrangementId || !isClearSeatAction} variant='outlined'
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        bgcolor: '#f8f9fa'
                                    }
                                }}
                            />
                        )}
                    />
                </FormControl>
                {seatingArrangementId && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                            variant='text'
                            size='small'
                            color='warning'
                            onClick={handleClearSeat}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                            Clear seat allocation
                        </Button>
                    </Box>
                )}
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
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: seatNo ? '#e9ecef' : '#f8f9fa'
                            }
                        }}
                        disabled={!!seatNo}
                    />
                </Grid>
            </Grid>

            <DialogActions sx={{ mt: 4, justifyContent: 'center', gap: 2 }}>
                <Button onClick={handleClose} variant='outlined' sx={{ borderRadius: '10px', px: 4, py: 1, color: '#7f8c8d', borderColor: '#bdc3c7', fontWeight: 'bold', '&:hover': { borderColor: '#7f8c8d', bgcolor: '#f1f2f6' } }}>
                    Cancel
                </Button>
                <Button variant='contained' onClick={handleSubmit} sx={{ borderRadius: '10px', px: 5, py: 1, background: 'linear-gradient(135deg, #3498db, #2980b9)', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)', '&:hover': { background: 'linear-gradient(135deg, #2980b9, #2573a7)' } }}>
                    {seatingArrangementId && !formData.employee ? 'Update Empty Seat' : seatingArrangementId ? 'Update' : 'Allocate'}
                </Button>
            </DialogActions>
        </Box>
    )
}
