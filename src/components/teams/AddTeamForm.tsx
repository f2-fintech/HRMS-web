'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Autocomplete from '@mui/material/Autocomplete'
import { useSelector } from 'react-redux'
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
  FormHelperText,
  Collapse,
  Paper
} from '@mui/material'
import type { RootState } from '@/redux/store'
import { utility } from '@/utility'

interface EmployeeType {
  _id: string
  first_name: string
  last_name: string
  designation?: string
  manager_id?: string
}

interface TeamFormData {
  manager_id: string
  employee_ids: string
  name: string
  code: string
  company_id: string
}

export default function AddTeamForm({ handleClose, team, debouncedFetch }) {

  const { company_id } =
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')!) : {}

  const { teams } = useSelector((state: RootState) => state.teams)
  const { employees } = useSelector((state: RootState) => state.employees)

  const [formData, setFormData] = useState<TeamFormData>({
    manager_id: '',
    employee_ids: '',
    name: '',
    code: '',
    company_id
  })

  const [errors, setErrors] = useState({
    name: '',
    manager_id: '',
    employee_ids: '',
    code: ''
  })

  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeType[]>([])
  const [tls, setTls] = useState<{ tl_id: string; employees: EmployeeType[] }[]>([])
  const [showTlSection, setShowTlSection] = useState(false)

  const { capitalizeInput } = utility()

  /* ------------------------------------------------------------------
     LOAD TEAM IN EDIT MODE
  ------------------------------------------------------------------ */
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

        const selectedEmps = employees.filter(emp =>
          selected.employee_ids.split(',').includes(emp._id)
        )
        setSelectedEmployees(selectedEmps)

        if (selected.tls) {
          const tlArr = selected.tls.map(t => ({
            tl_id: t.tl_id,
            employees: employees.filter(emp =>
              t.employee_ids.split(',').includes(emp._id)
            )
          }))
          setTls(tlArr)
          setShowTlSection(true)
        }
      }
    }
  }, [team, teams, employees])

  /* ------------------------------------------------------------------
     VALIDATION
  ------------------------------------------------------------------ */
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
      newErrors.employee_ids = 'Select at least one employee'
      isValid = false
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Team code is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  /* ------------------------------------------------------------------
     HANDLE CHANGES
  ------------------------------------------------------------------ */
  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleManagerChange = e => {
    handleChange(e)
  }

  /* ------------------------------------------------------------------
     EMPLOYEES SELECT → UPDATE TEAM MEMBERS
  ------------------------------------------------------------------ */
  const handleEmployeeChange = (_event, value: EmployeeType[]) => {
    const ids = value.map(emp => emp._id).join(',')
    setSelectedEmployees(value)
    setFormData(prev => ({ ...prev, employee_ids: ids }))

    /** ❌ Remove ALL previous TLs if they are no longer selected */
    const filteredTLs = tls.filter(tl =>
      value.some(v => v._id === tl.tl_id)
    )
    setTls(filteredTLs)
    setShowTlSection(filteredTLs.length > 0)
  }

  /* ------------------------------------------------------------------
     SUBMIT TEAM
  ------------------------------------------------------------------ */
  const handleSubmit = () => {
    if (!validateForm()) return

    const method = team ? 'PUT' : 'POST'
    const url = team
      ? `${process.env.NEXT_PUBLIC_APP_URL}/teams/update/${team}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/teams/create`

    const finalTLs = tls.map(tl => ({
      tl_id: tl.tl_id,
      employee_ids: tl.employees.map(e => e._id).join(',')
    }))

    const payload = { ...formData, tls: finalTLs }

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.message?.includes('success')) toast.success(data.message)
        else toast.error(data.message || 'Unexpected error')

        handleClose()
        debouncedFetch()
      })
      .catch(() => toast.error('Unexpected error'))
  }

  /* ==================================================================
     UI STARTS HERE
  ================================================================== */
  return (
    <Box sx={{ flexGrow: 1, padding: 2 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight="600">
          {team ? 'Edit Team' : 'Add Team'}
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>

        {/* TEAM NAME */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Team Name"
            name="name"
            value={formData.name}
            onChange={e => capitalizeInput(e, handleChange)}
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>

        {/* MANAGER */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!errors.manager_id}>
            <InputLabel>Select Manager</InputLabel>
            <Select
              name="manager_id"
              value={formData.manager_id}
              onChange={handleManagerChange}
            >
              {employees.map(emp => (
                <MenuItem key={emp._id} value={emp._id}>
                  {emp.first_name} {emp.last_name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.manager_id}</FormHelperText>
          </FormControl>
        </Grid>

        {/* EMPLOYEES */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            options={employees}
            getOptionLabel={o => `${o.first_name} ${o.last_name}`}
            value={selectedEmployees}
            onChange={handleEmployeeChange}
            renderInput={params => (
              <TextField
                {...params}
                label="Select Employees"
                error={!!errors.employee_ids}
                helperText={errors.employee_ids}
              />
            )}
          />
        </Grid>

        {/* CODE */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Team Code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            error={!!errors.code}
            helperText={errors.code}
          />
        </Grid>

        {/* NEW: MANUAL TL SELECTOR */}
        {selectedEmployees.length > 0 && (
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={selectedEmployees}
              getOptionLabel={op => `${op.first_name} ${op.last_name}`}
              onChange={(e, val) => {
                const newTLs = val.map(tl => ({
                  tl_id: tl._id,
                  employees: []
                }))
                setTls(newTLs)
                setShowTlSection(newTLs.length > 0)
              }}
              renderInput={params => (
                <TextField {...params} label="Select Team Leaders (TL)" />
              )}
            />
          </Grid>
        )}

        {/* TL SECTION */}
        <Grid item xs={12}>
          <Collapse in={showTlSection}>
            <Typography variant="h6" fontWeight="600" mt={2}>
              Team Leaders & Assigned Employees
            </Typography>

            {tls.map((tl, index) => {
              const tlEmp = employees.find(e => e._id === tl.tl_id)

              /** Only non-TLs employees are assignable */
              const assignableEmployees = selectedEmployees.filter(
                emp => !tls.some(t => t.tl_id === emp._id)
              )

              return (
                <Paper
                  elevation={2}
                  key={tl.tl_id}
                  sx={{
                    p: 2,
                    mt: 2,
                    borderRadius: 2,
                    borderLeft: '4px solid #ff902f',
                    background: '#f2f2f2'
                  }}
                >
                  <Typography fontWeight="bold" mb={1}>
                    TL: {tlEmp?.first_name} {tlEmp?.last_name}
                  </Typography>

                  <Autocomplete
                    multiple
                    options={assignableEmployees}
                    getOptionLabel={op => `${op.first_name} ${op.last_name}`}
                    value={tl.employees}
                    onChange={(e, val) => {
                      const copy = [...tls]
                      copy[index].employees = val
                      setTls(copy)
                    }}
                    renderInput={params => (
                      <TextField {...params} label="Employees under this TL" />
                    )}
                  />
                </Paper>
              )
            })}
          </Collapse>
        </Grid>

        {/* SUBMIT */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            sx={{ p: 2, backgroundColor: '#ff902f' }}
            onClick={handleSubmit}
          >
            {team ? 'UPDATE TEAM' : 'ADD TEAM'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
