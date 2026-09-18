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
  Paper,
  Avatar
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

  const { company_id } = utility().decodedToken() || {};

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
    <Box sx={{ p: 0, overflow: 'hidden' }}>
      {/* Form Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 3, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        bgcolor: 'rgba(0,0,0,0.02)'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5 }}>
            {team ? 'Update Team' : 'Create New Team'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your team structure and hierarchy
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose}
          sx={{ 
            bgcolor: 'background.paper', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': { bgcolor: 'error.light', color: 'error.main' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 4, maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container spacing={4}>
          {/* TEAM NAME */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Team Name"
              placeholder="e.g. IT Development"
              name="name"
              value={formData.name}
              onChange={e => capitalizeInput(e, handleChange)}
              error={!!errors.name}
              helperText={errors.name}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* CODE */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Team Code"
              placeholder="e.g. IT-01"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={!!errors.code}
              helperText={errors.code}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* MANAGER */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.manager_id}>
              <InputLabel shrink>Select Team Manager</InputLabel>
              <Select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleManagerChange}
                displayEmpty
                notched
                label="Select Team Manager"
              >
                <MenuItem value="" disabled>Select a manager</MenuItem>
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
                  label="Assign Members"
                  placeholder="Search and select employees..."
                  error={!!errors.employee_ids}
                  helperText={errors.employee_ids}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          {/* TL SELECTOR */}
          {selectedEmployees.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 3, bgcolor: 'primary.light', borderRadius: 4, color: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Define Hierarchy
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  Optional: Select specific Team Leaders from the assigned members.
                </Typography>
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
                  sx={{ 
                    '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 },
                    '& .MuiInputLabel-root': { color: 'primary.main' }
                  }}
                  renderInput={params => (
                    <TextField {...params} label="Select Team Leaders (TL)" />
                  )}
                />
              </Box>
            </Grid>
          )}

          {/* TL SECTION */}
          <Grid item xs={12}>
            <Collapse in={showTlSection}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  Assign Employees to TLs
                </Typography>

                {tls.map((tl, index) => {
                  const tlEmp = employees.find(e => e._id === tl.tl_id)
                  const assignableEmployees = selectedEmployees.filter(
                    emp => !tls.some(t => t.tl_id === emp._id)
                  )

                  return (
                    <Paper
                      elevation={0}
                      key={tl.tl_id}
                      sx={{
                        p: 3,
                        mb: 2,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.75rem' }}>
                          TL
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {tlEmp?.first_name} {tlEmp?.last_name}
                        </Typography>
                      </Box>

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
                          <TextField {...params} label="Assign employees to this TL" size="small" />
                        )}
                      />
                    </Paper>
                  )
                })}
              </Box>
            </Collapse>
          </Grid>
        </Grid>
      </Box>

      {/* Form Actions */}
      <Box sx={{ 
        p: 3, 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2,
        bgcolor: 'rgba(0,0,0,0.02)'
      }}>
        <Button 
          variant="outlined" 
          onClick={handleClose}
          sx={{ px: 4, py: 1.2, borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ 
            px: 6, 
            py: 1.2, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #2c3ce3 0%, #5665f3 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #1a248a 0%, #2c3ce3 100%)' }
          }}
        >
          {team ? 'Update Team' : 'Create Team'}
        </Button>
      </Box>
    </Box>
  )
}
