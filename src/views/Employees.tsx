'use client'

import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import { useSelector, useDispatch } from 'react-redux'
import { Box, Grid, Typography, TextField, Button, Dialog, DialogContent, Autocomplete } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import AddIcon from '@mui/icons-material/Add'

import { toast, ToastContainer } from 'react-toastify'

import { fetchEmployees, resetEmployees } from '../redux/features/employees/employeesSlice'
import { fetchDesignations } from '@/redux/features/designation/designationSlice'
import Loader from '../components/loader/loader'
import EmployeeForm from '@/components/employee/EmployeeForm'
import EmployeeCard from '@/components/employee/EmployeeCard'
import { utility } from '@/utility'
import { deleteEmployee } from '@/redux/features/employees/employeesSlice'
import 'react-toastify/dist/ReactToastify.css'
import type { RootState } from '@/redux/store'
import useDebounce from '@/utility/debounce/useDebounce'

const { isTokenExpired } = utility()

export default function EmployeeGrid() {
  const dispatch = useDispatch()
  const { employees, hasMore, loading, error } = useSelector((state: RootState) => state.employees)
  const { designations } = useSelector((state: RootState) => state.designations)
  const [showForm, setShowForm] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [searchName, setSearchName] = useState('')
  const [selectedDesignation, setSelectedDesignation] = useState('')
  const [page, setPage] = useState(1)
  const [attendanceStatus, setAttendanceStatus] = useState({})

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const router = useRouter()

  const capitalizeWords = (name: string) => {
    if (!name) return ''

    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  useEffect(() => {
    if (isTokenExpired(token)) {
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      if (userRole === '') {
        const user = JSON.parse(localStorage.getItem('user') || '{}')

        setUserRole(user.role)
      }
    }
  }, [token, userRole, router])

  useEffect(() => {
    dispatch(fetchDesignations({ page: 1, limit: 100, keyword: '' }))
  }, [dispatch])

  useEffect(() => {
    if (searchName === '' && selectedDesignation === '') {
      dispatch(fetchEmployees({ page, limit: 12, search: '', designation: '' }))
    }
  }, [dispatch, page, searchName, selectedDesignation])

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !loading && hasMore) {
      setPage(prevPage => {
        const nextPage = prevPage + 1

        dispatch(fetchEmployees({ page: nextPage, limit: 12, search: searchName, designation: selectedDesignation }))

        return nextPage
      })
    }
  }, [loading, hasMore, searchName, selectedDesignation, dispatch])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleAddEmployeeClick = () => {
    setSelectedEmployee(null)
    setShowForm(true)
  }

  const handleEditEmployeeClick = id => {
    setSelectedEmployee(id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
  }

  const handleDelete = async id => {
    const confirmDelete = confirm('Are you sure you want to delete this employee?')

    if (!confirmDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        dispatch(deleteEmployee(id))
        toast.success('Employee deleted successfully.')
      } else {
        const errorResult = await response.json()

        toast.error(`Failed to delete employee: ${errorResult.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error deleting employee. Please try again.')
    }
  }


  const fetchAttendanceStatus = async () => {
    try {

      const today = new Date().toISOString().split('T')[0]

      const companyId =
        JSON.parse(localStorage.getItem('user') || '{}')?.company_id

      const authHeader = `Bearer ${token} ${companyId}`

      // PRESENT EMPLOYEES
      const punchRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/punch/punches/date/${today}`,
        {
          headers: {
            Authorization: authHeader
          }
        }
      )

      const punchData = await punchRes.json()
      

      // LEAVE EMPLOYEES
      const leaveRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/attendence/today-leaves?company_id=${companyId}`,
        {
          headers: {
            Authorization: authHeader
          }
        }
      )

      const leaveData = await leaveRes.json()
      console.log('leaveData', leaveData)


      const halfRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/attendence/on-half/${today}`,
        {
          headers: {
            Authorization: authHeader
          }
        }
      )

      const halfData = await halfRes.json()
      console.log('halfData', halfData)

      const statusMap = {}

      // PRESENT
      punchData?.forEach((item: any) => {

        const empId = item.employee

        if (empId) {
          statusMap[empId.toString()] = 'PRESENT'
        }
      })
      leaveData?.employees?.forEach((item: any) => {

        const empId = item.employee?._id

        if (empId) {
          statusMap[empId.toString()] = 'LEAVE'
        }
      })

      // HALF DAY
      halfData?.forEach((item: any) => {
        const empId =
          (
            item.employee_id ||
            item.employeeId ||
            item._id
          )?.toString()?.trim()

        statusMap[empId?.toString()] = 'HALF_DAY'
      })
      console.log('statusMap', statusMap)
      setAttendanceStatus(statusMap)

    } catch (error) {
      console.error('Attendance Status Error:', error)
    }
  }

  useEffect(() => {
    if (token) {
      fetchAttendanceStatus()
    }
  }, [token])
  
  const debouncedSearchName = useDebounce(searchName, 500)
  const debouncedDesignation = useDebounce(selectedDesignation, 500)

  useEffect(() => {
    if (debouncedSearchName !== '' || debouncedDesignation !== '') {
      dispatch(resetEmployees())
      dispatch(
        fetchEmployees({
          page: 1,
          limit: 12,
          search: debouncedSearchName,
          designation: debouncedDesignation
        })
      )
    }
  }, [debouncedSearchName, debouncedDesignation, dispatch])

  const handleInputChange = e => {
    const searchValue = e.target.value

    setSelectedDesignation('')
    setSearchName(searchValue)

    if (searchValue === '') {
      setPage(1)
      dispatch(resetEmployees())
    }
  }

  const handleDesignationChange = newValue => {
    setSearchName('')
    setSelectedDesignation(newValue || '')

    if (!newValue) {
      setPage(1)
      dispatch(resetEmployees())
    }
  }

  return (
    <>
      <ToastContainer position='top-center' autoClose={3000} />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <EmployeeForm
              employee={selectedEmployee}
              handleClose={handleClose}
              employees={employees}
              fetchEmployees={fetchEmployees}
              page={page}
            />
          </DialogContent>
        </Dialog>

        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography sx={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Employee
            </Typography>
            <Typography sx={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Employee
            </Typography>
          </Box>
          <Box display='flex' alignItems='center' gap={2}>
            {Number(userRole) <= 1 && (
              <Button
                sx={{ borderRadius: 50, backgroundColor: '#ff902f', '&:hover': { backgroundColor: '#e67e22' } }}
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAddEmployeeClick}
              >
                Add Employee
              </Button>
            )}
            {Number(userRole) === 1 && (
              <Button
                variant='contained'
                onClick={() => router.push('/deleted-emp')}
                sx={{
                  backgroundColor: '#ffebee',
                  borderRadius: '3rem',
                  fontWeight: 'bold',
                  color: '#d32f2f',
                  border: '1px solid #d32f2f',
                  '&:hover': { backgroundColor: '#f8d7da' }
                }}
              >
                Ex Employees
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={4} alignItems='center' mb={4}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Employee Name'
              variant='outlined'
              value={searchName}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <Autocomplete
                id='designation-select'

                // Use a Set to ensure unique values from both new and old fields
                options={Array.from(new Set(designations.map(d => d.title || d.designation)))}
                getOptionLabel={option => option || ''}
                renderInput={params => <TextField {...params} label='Select Designation' variant='outlined' />}
                value={selectedDesignation}
                onChange={(event, newValue) => handleDesignationChange(newValue)}
              />
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={4}>
          {error ? (
            <Typography sx={{ p: 4 }}>Error: {error}</Typography>
          ) : (

            employees.map((employee: any) => (
              <Grid item xs={12} sm={6} md={3} key={employee._id}>
                <EmployeeCard
                  employee={employee}
                  id={employee._id}
                  status={
                    attendanceStatus[
                    employee._id?.toString()?.trim()]
                  }
                  handleEditEmployeeClick={handleEditEmployeeClick}
                  capitalizeWords={capitalizeWords}
                  handleDelete={handleDelete}
                />
              </Grid>
            ))
          )}
        </Grid>
        {loading && <Loader />}
      </Box>
    </>
  )
}
