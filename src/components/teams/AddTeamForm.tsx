'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Autocomplete from '@mui/material/Autocomplete'
import { useSelector } from 'react-redux'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close'
import {
    Box,
    Grid,
    Typography,
    IconButton,
    TextField,
    Button,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    FormHelperText
} from '@mui/material'
import type { RootState } from '@/redux/store'
import { debounce } from 'lodash'
import { utility } from '@/utility'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'

interface EmployeeType {
    _id: string
    first_name: string
    last_name: string
    image?: string
    designation?: string
    role_priority?: string
}

interface TeamFormData {
    manager_id: string
    employee_ids: string
    name: string
    code: string
    company_id: string
}

interface AddTeamFormProps {
    handleClose: () => void
    team?: string | null
    debouncedFetch: () => void
}

export default function AddTeamForm({ handleClose, team, debouncedFetch }: AddTeamFormProps) {
    const { company_id } = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : {}
    const { teams } = useSelector((state: RootState) => state.teams)
    const { employees } = useSelector((state: RootState) => state.employees)

    const [formData, setFormData] = useState<TeamFormData>({
        manager_id: '',
        employee_ids: '',
        name: '',
        code: '',
        company_id: company_id
    })

    const [errors, setErrors] = useState({
        name: '',
        manager_id: '',
        employee_ids: '',
        code: ''
    })

    const [selectedEmployees, setSelectedEmployees] = useState<EmployeeType[]>([])

    const { capitalizeInput } = utility()

    useEffect(() => {
        if (team) {
            const selected = teams.find(t => t._id === team)
            if (selected) {
                setFormData({
                    manager_id: selected.manager_id,
                    employee_ids: selected.employee_ids,
                    name: selected.name,
                    code: selected.code,
                    company_id: selected.company_id
                })
                const selectedEmps: EmployeeType[] = []
                selected.employee_ids?.split(',').forEach(id => {
                    const emp = employees.find(e => e._id === id)
                    if (emp) selectedEmps.push(emp)
                })
                setSelectedEmployees(selectedEmps)
            }
        }
    }, [team, teams, employees])

    const validateForm = () => {
        let isValid = true

        const newErrors = {
            name: '',
            manager_id: '',
            employee_ids: '',
            code: ''
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Team name is required'
            isValid = false
        }

        if (!formData.manager_id) {
            newErrors.manager_id = 'Manager selection is required'
            isValid = false
        }

        if (!formData.employee_ids) {
            newErrors.employee_ids = 'At least one employee must be selected'
            isValid = false
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Team code is required'
            isValid = false
        }

        setErrors(newErrors)

        return isValid
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target
        setFormData(prevState => ({
            ...prevState,
            [name as string]: value as string
        }))
    }

    const handleEmployeeChange = (_event: any, value: EmployeeType[]) => {
        const employeeIds = value.map(emp => emp._id).join(',')
        setSelectedEmployees(value)
        setFormData(prevState => ({
            ...prevState,
            employee_ids: employeeIds
        }))
    }

    const handleSubmit = () => {
        if (validateForm()) {
            const method = team ? 'PUT' : 'POST'

            // For example, if you store the env in .env.local or .env
            const url = team
                ? `${process.env.NEXT_PUBLIC_APP_URL}/teams/update/${team}`
                : `${process.env.NEXT_PUBLIC_APP_URL}/teams/create`

            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        if (data.message.includes('success')) {
                            toast.success(data.message, {
                                position: 'top-center'
                            })
                        } else {
                            toast.error('Error: ' + data.message, {
                                position: 'top-center'
                            })
                        }
                    } else {
                        toast.error('Unexpected error occurred', {
                            position: 'top-center'
                        })
                    }
                    handleClose()
                    debouncedFetch()
                })
                .catch(error => {
                    toast.error('Unexpected error occurred', {
                        position: 'top-center'
                    })
                })
        }
    }

    return (
        <Box sx={{ flexGrow: 1, padding: 2 }}>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography style={{ fontSize: '2em', color: 'black' }} variant='h5' gutterBottom>
                    {team ? 'Edit Team' : 'Add Team'}
                </Typography>
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Name'
                        name='name'
                        value={formData.name}
                        onChange={e => capitalizeInput(e, handleChange)}
                        required
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={!!errors.manager_id}>
                        <InputLabel required id='manager-select-label'>
                            Select Manager
                        </InputLabel>
                        <Select
                            label='Select Manager'
                            labelId='manager-select-label'
                            id='manager-select'
                            name='manager_id'
                            value={formData.manager_id}
                            onChange={handleChange}
                            required
                        >
                            {employees
                                .filter(
                                    employee =>
                                        employee.role_priority === '2' ||
                                        employee.designation === 'Founder & CEO' ||
                                        employee.designation === 'Co-Founder & MD'
                                )
                                .map(employee => (
                                    <MenuItem key={employee._id} value={employee._id}>
                                        {employee.first_name} {employee.last_name}
                                    </MenuItem>
                                ))}
                        </Select>
                        {errors.manager_id && <FormHelperText error>{errors.manager_id}</FormHelperText>}
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Autocomplete
                        multiple
                        id='checkboxes-tags-demo'
                        options={employees}
                        disableCloseOnSelect
                        getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                        value={selectedEmployees}
                        onChange={handleEmployeeChange}
                        renderOption={(props, option) => (
                            <li {...props}>
                                {option.first_name} {option.last_name}
                            </li>
                        )}
                        renderInput={params => (
                            <TextField
                                {...params}
                                label='Select Employees'
                                placeholder='Favorites'
                                error={!!errors.employee_ids}
                                helperText={errors.employee_ids}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Code'
                        name='code'
                        value={formData.code}
                        onChange={handleChange}
                        required
                        error={!!errors.code}
                        helperText={errors.code}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'white',
                            padding: 15,
                            backgroundColor: '#ff902f',
                            width: 200
                        }}
                        variant='contained'
                        fullWidth
                        onClick={handleSubmit}
                    >
                        {team ? 'UPDATE TEAM' : 'ADD TEAM'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}
