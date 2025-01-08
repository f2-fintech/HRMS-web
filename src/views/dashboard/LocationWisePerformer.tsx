import { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import { motion } from 'framer-motion'

import { utility } from '@/utility'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import { fetchAwards, addAward } from '@/redux/features/performer/performereSlice'
import type { AppDispatch, RootState } from '@/redux/store'

import AwardForm from '@/components/performer/AwardForm'
import { formatAmount } from '@/utility/formatAmount/formatAmount'

// Define interfaces for type safety
interface Employee {
  _id: string
  first_name: string
  last_name: string
  designation: string
  location: string
  image?: string
}

interface Award {
  _id: string
  employee: Employee | string
  amount: number
  awardTitle: string
}

interface User {
  id: string
  designation: string
  role: string
}

const LocationWisePerformer = () => {
  const dispatch: AppDispatch = useDispatch()
  const { awards, loading, error } = useSelector((state: RootState) => state.awards)

  // State declarations
  const [selectedAwardIndex, setSelectedAwardIndex] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [awardTitle, setAwardTitle] = useState('')
  const [user, setUser] = useState<User | null>(null)

  const { capitalizeFirstLetter } = utility()

  const getStatusStyles = (status: string | undefined) => {
    // Handle empty or undefined status
    if (!status) {
      return {
        background: 'rgba(156, 163, 175, 0.1)',
        textColor: '#6B7280',
        pulseColor: '#6B7280'
      };
    }

    // Convert status to lowercase for case-insensitive comparison
    const statusLower = status.toLowerCase();

    if (statusLower === 'approved') {
      return {
        background: 'rgba(255, 193, 7, 0.1)',
        textColor: '#FFC107',
        pulseColor: '#FFC107'
      };
    }

    if (statusLower === 'disbursed') {
      return {
        background: 'rgba(16,185,129,0.1)',
        textColor: '#10B981',
        pulseColor: '#10B981'
      };
    }



    return {
      background: 'rgb(248, 225, 183)',
      textColor: 'rgb(117, 78, 26)',
      pulseColor: 'rgb(117, 78, 26)'
    };
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')

    setUser(storedUser)

    const fetchEmployees = async () => {
      try {
        const data = await apiResponse()

        setEmployees(data)
      } catch (error) {
        console.error('Error fetching employees:', error)
      }
    }

    fetchEmployees()
    dispatch(fetchAwards())
  }, [dispatch])

  // Handle menu click for editing
  const handleMenuClick = (index: number) => {
    setSelectedAwardIndex(index)

    if (awards[index]) {
      setIsEditMode(true)
      const award = awards[index]

      const employee = employees.find(emp => emp._id === (award.employee?._id || award.employee))

      setSelectedEmployee(employee || null)
      setAmount(award.amount?.toString() || '')
      setAwardTitle(award.awardTitle || '')
    } else {
      setIsEditMode(false)
      setSelectedEmployee(null)
      setAmount('')
      setAwardTitle('')
    }
  }

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const url =
        isEditMode && selectedAwardIndex !== null
          ? `${process.env.NEXT_PUBLIC_APP_URL}/awards/${awards[selectedAwardIndex]._id}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/awards`

      const method = isEditMode && selectedAwardIndex !== null ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee: selectedEmployee ? selectedEmployee._id : '',
          amount: amount,
          awardTitle: awardTitle
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newAward = await response.json()

      if (isEditMode) {
        dispatch(fetchAwards())
      } else {
        dispatch(addAward({ ...newAward, employee: selectedEmployee }))
      }
    } catch (error) {
      console.error('Error saving award:', error)
    }

    setSelectedAwardIndex(null)
  }

  // Handle form close
  const handleCloseForm = () => {
    setSelectedAwardIndex(null)
  }

  return (
    <Box
      position='relative'
      sx={{
        minHeight: '100vh',
        p: 3
      }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Box display='flex' flexDirection='column' gap={4}>
          {[...awards, ...new Array(3 - awards.length).fill(null)].map((award, index) => (
            <motion.div
              key={award ? award._id : index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                sx={{
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  bgcolor: 'white',
                  color: 'inherit',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                    '& .edit-button': {
                      opacity: 1,
                      visibility: 'visible'
                    }
                  }
                }}
              >
                {/* Edit Button */}
                {(user?.designation === 'Sr. Operation Manager' || user?.role === '1') && (
                  <IconButton
                    className='edit-button'
                    onClick={() => handleMenuClick(index)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      zIndex: 2,
                      p: 1,
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0px 2px 8px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <MoreVertIcon sx={{ color: '#FFFFFF' }} />
                  </IconButton>
                )}

                {/* Blue Header section */}
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #357ABD 60%, #4A90E2 40%)',
                    height: '80px',
                    position: 'relative',
                    mb: 8,
                    display: 'flex',
                    alignItems: 'flex-end',
                    px: 3
                  }}
                >
                  {/* Trophy icon */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 30,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <motion.img
                      src='/images/pages/trophy.png'
                      alt='trophy'
                      style={{
                        height: 50,
                        opacity: 0.9
                      }}
                      initial={{ scale: 0.8 }}
                      animate={{
                        rotate: [0, -5, 0, 5, 0],
                        transition: {
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }
                      }}
                    />
                  </Box>

                  {/* Employee image */}
                  {award?.employee?.image ? (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 40, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        position: 'absolute',
                        bottom: '18px',
                        left: '22px'
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '40px',
                          border: '2px solid white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          overflow: 'hidden'
                        }}
                      >
                        <img
                          src={award.employee.image}
                          alt={`${award.employee.first_name} ${award.employee.last_name}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                    </motion.div>
                  ) : null}
                </Box>

                {/* Content area */}
                <Box sx={{ px: 3, pb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2
                    }}
                  >
                    {/* Name and Role */}
                    <Box>
                      <Typography
                        variant='h5'
                        sx={{
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontFamily: "'Pacifico', cursive",
                          fontSize: '1.5rem',
                          color: 'black',
                          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        {award?.employee ? (
                          <>
                            {capitalizeFirstLetter(award.employee.first_name)}{' '}
                            {capitalizeFirstLetter(award.employee.last_name)}
                            <span>✨</span>
                          </>
                        ) : (
                          'No Award Data'
                        )}
                      </Typography>
                      {award?.employee && (
                        <Typography
                          sx={{
                            color: '#64748B',
                            mt: 0.5,
                            fontWeight: 500
                          }}
                        >
                          {award.employee.designation}
                        </Typography>
                      )}
                    </Box>

                    {/* Location badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        background: 'rgba(74,144,226,0.1)',
                        px: 2,
                        py: 1,
                        borderRadius: '20px'
                      }}
                    >
                      <LocationOnIcon sx={{ color: '#4A90E2', fontSize: '1rem' }} />
                      <Typography
                        sx={{
                          color: '#4A90E2',
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}
                      >
                        {award?.employee?.location.toUpperCase() || '---'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Disbursed Amount Section */}
                  <Box sx={{ mt: 4 }}>
                    <Typography
                      sx={{
                        color: '#64748B',
                        fontWeight: 500,
                        mb: 1
                      }}
                    >
                      Disbursed Amount
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography
                        variant='h4'
                        sx={{
                          color: '#4A90E2',
                          fontWeight: 700
                        }}
                      >
                        ₹{award?.amount || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Progress bar */}
                    <Box
                      sx={{
                        mt: 2,
                        width: '100%',
                        height: '6px',
                        background: '#E2E8F0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, #4A90E2 0%, #357ABD 100%)',
                          borderRadius: '3px',
                          animation: 'pulse 2s infinite'
                        }}
                      />
                    </Box>

                    {/* Status Section */}
                    <Box
                      sx={{
                        mt: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: '16px',
                          background: getStatusStyles(award?.awardTitle).background,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: getStatusStyles(award?.awardTitle).pulseColor,
                            animation: 'pulse 2s infinite'
                          }}
                        />
                        <Typography
                          sx={{
                            color: getStatusStyles(award?.awardTitle).textColor,
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}
                        >
                          {award?.awardTitle ? award.awardTitle.toUpperCase() : 'N/A'}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: '#64748B',
                          fontSize: '0.875rem'
                        }}
                      >
                        Achievement Unlocked
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {/* Award form */}
      {selectedAwardIndex !== null && (
        <AwardForm
          employees={employees}
          selectedEmployee={selectedEmployee}
          amount={amount}
          awardTitle={awardTitle}
          setAwardTitle={setAwardTitle}
          isEditMode={isEditMode}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
          setSelectedEmployee={setSelectedEmployee}
          setAmount={setAmount}
        />
      )}
    </Box>
  )
}

export default LocationWisePerformer
