'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { Box, Grid, Typography, TextField, Button, Dialog, DialogContent, Autocomplete } from '@mui/material'
import FormControl from '@mui/material/FormControl'
import AddIcon from '@mui/icons-material/Add'
import { fetchEmployees, resetEmployees } from '../redux/features/employees/employeesSlice'
import { fetchDesignations } from '@/redux/features/designation/designationSlice'
import Loader from '../components/loader/loader'
import EmployeeForm from '@/components/employee/EmployeeForm'
import EmployeeCard from '@/components/employee/EmployeeCard'
import { utility } from '@/utility'
import { toast, ToastContainer } from 'react-toastify'
import { deleteEmployee } from '@/redux/features/employees/employeesSlice'
import 'react-toastify/dist/ReactToastify.css'
import { RootState } from '@/redux/store'
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const router = useRouter()

  const capitalizeWords = (name: String) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  useEffect(() => {
    if (isTokenExpired(token)) {
      console.log('isTokenExpired(token)', isTokenExpired(token))
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
    dispatch(fetchDesignations({ page: 1, limit: 0, keyword: '' }))
  }, [])

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

  const handleDelete = async id => {
    const confirmDelete = confirm('Are you sure you want to delete this employee?')
    if (!confirmDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer'
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

  const handleClose = () => {
    setShowForm(false)
  }

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

  const handleDesignationChange = e => {
    const designationValue = e.target.value

    setSearchName('')
    setSelectedDesignation(designationValue === null ? '' : designationValue)
    if (designationValue === '') {
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
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Employee
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Employee
            </Typography>
          </Box>
          <Box display='flex' alignItems='center'>
            {Number(userRole) <= 1 && (
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant='contained'
                color='warning'
                startIcon={<AddIcon />}
                onClick={handleAddEmployeeClick}
              >
                Add Employee
              </Button>
            )}
          </Box>
        </Box>
        <Grid container spacing={6} alignItems='center' mb={2}>
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
                options={designations
                  .map(designation => designation.title)
                  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))}
                getOptionLabel={option => option}
                renderInput={params => <TextField {...params} label='Select Designation' variant='outlined' />}
                value={selectedDesignation}
                onChange={(event, newValue) => {
                  handleDesignationChange({ target: { name: 'designation', value: newValue } })
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={6}>
          {error ? (
            <Typography>Error: {error}</Typography>
          ) : (
            employees.map((employee: any) => (
              <Grid item xs={12} sm={6} md={3} key={employee._id}>
                <EmployeeCard
                  employee={employee}
                  id={employee._id}
                  handleEditEmployeeClick={handleEditEmployeeClick}
                  capitalizeWords={capitalizeWords}
                  handleDelete={handleDelete}
                />
              </Grid>
            ))
          )}
        </Grid>
        {loading ? <Loader /> : <div></div>}
      </Box>
    </>
  )
}
