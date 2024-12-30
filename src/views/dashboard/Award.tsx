import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import AwardForm from '../../components/performer/AwardForm'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import { utility } from '@/utility'

const Award = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [employeeName, setEmployeeName] = useState(null)
  const [amount, setAmount] = useState('')
  const [awardTitle, setAwardTitle] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [awardData, setAwardData] = useState(null)
  const [userRole, setUserRole] = useState<string>("")
  const [userId, setUserId] = useState(null)
  const [userDesg, setUserDesg] = useState(null)

  const { capitalizeFirstLetter } = utility()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserId(user.id)
    setUserDesg(user.designation)
    setUserRole(user.role)

    const fetchEmployeesAndAwards = async () => {
      let token: string | null = null;
      const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

      if (typeof window !== "undefined") {
        token = localStorage?.getItem("token");
      }
      try {
        const employeesData = await apiResponse();
        setEmployees(employeesData)

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/awards/get`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token} ${company_id}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch award')
        }

        const awardData = await response.json()

        if (Array.isArray(awardData) && awardData.length > 0) {
          const award = awardData[0]
          award.employee = employeesData.find(emp => emp._id === award.employee._id) || award.employee
          setAwardData(award)
          setAwardTitle(award.awardTitle || 'Best seller of the month')
        } else {
          setAwardData(awardData)
        }

        setIsEditMode(!!awardData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchEmployeesAndAwards()
  }, [])

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let token: string | null = null;
    const { company_id } = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user")) : {};

    if (typeof window !== "undefined") {
      token = localStorage?.getItem("token");
    }

    try {
      let url = `${process.env.NEXT_PUBLIC_APP_URL}/awards/performer/month`
      const method = awardData && awardData._id ? 'PUT' : 'POST'

      if (method === 'PUT') {
        url = `${process.env.NEXT_PUBLIC_APP_URL}/awards/month/performer/${awardData._id}`
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token} ${company_id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee: employeeName?._id,
          amount,
          awardTitle,
          company_id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save award')
      }

      const newAward = await response.json()
      const updatedEmployee = employees.find(emp => emp._id === newAward.employee)

      setAwardData({
        ...newAward,
        employee: updatedEmployee || newAward.employee
      })

      setEmployeeName(null)
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error saving award:', error.message)
      alert(`Error: ${error.message}`)
    }
  }

  const handleEditClick = () => {
    setIsEditMode(true)

    if (awardData) {
      setEmployeeName(awardData.employee)
      setAmount(awardData.amount?.toString())
      setAwardTitle(awardData.awardTitle || 'Best seller of the month')
    }

    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setIsEditMode(false)
  }

  return (
    <Box
      sx={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // padding: '20px',
        backgroundColor: '#f4f6f9',
        mr: '4rem'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          key={awardData ? awardData._id : 'no-award'}
          sx={{
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.9)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)'
            }
          }}
        >
          <CardContent
            sx={{
              height: '40vh',
              background: 'linear-gradient(145deg, #f4f6f9 0%, #e9edf3 100%)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant='h4' color='primary'>
                {awardData && awardData.employee ? (
                  <>
                    {userId === awardData.employee._id ? 'Congratulations' : 'Congratulate'}{' '}
                    <span style={{
                      fontWeight: 'bold',
                      color: '#1976d2',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {capitalizeFirstLetter(awardData.employee.first_name)} {capitalizeFirstLetter(awardData.employee.last_name)} 🎉
                    </span>
                  </>
                ) : (
                  'No Award Data'
                )}
              </Typography>

              {awardData && awardData.employee && (
                <Typography
                  variant='subtitle1'
                  sx={{
                    color: '#7e57c2',
                    fontStyle: 'italic',
                    marginTop: '8px'
                  }}
                >
                  {awardData.employee.designation}
                </Typography>
              )}

              <Typography
                variant='h6'
                sx={{
                  marginTop: '16px',
                  color: '#555',
                  fontWeight: 'medium'
                }}
              >
                {awardData?.awardTitle || 'Best seller of the month'}
              </Typography>

              <Typography
                variant='h5'
                color='primary'
                sx={{
                  marginTop: '8px',
                  fontWeight: 'bold',
                  color: '#1976d2'
                }}
              >
                {awardData?.amount ? awardData.amount : 'N/A'}
              </Typography>
            </Box>

            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16
              }}
            >
              <motion.img
                src='/images/pages/trophy.png'
                alt='trophy image'
                height={70}
                initial={{ rotate: -10 }}
                animate={{
                  rotate: [0, -5, 0, 5, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
            </Box>

            {(userDesg === 'Sr. Operation Manager' || userRole === '1') && (
              <Tooltip title='Add/Edit Award'>
                <IconButton
                  onClick={handleEditClick}
                  sx={{
                    position: 'absolute',
                    top: 1,
                    right: 5,

                    '&:hover': {
                      background: 'rgba(25,118,210,0.2)'
                    }
                  }}
                >
                  <MoreVertIcon color="primary" />
                </IconButton>
              </Tooltip>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isFormOpen && (
        <AwardForm
          employees={employees}
          selectedEmployee={employeeName}
          setSelectedEmployee={setEmployeeName}
          amount={amount}
          setAmount={setAmount}
          awardTitle={awardTitle}
          setAwardTitle={setAwardTitle}
          isEditMode={isEditMode}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}
    </Box>
  )
}

export default Award
