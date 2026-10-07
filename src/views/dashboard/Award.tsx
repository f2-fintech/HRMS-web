'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  Paper,
  Avatar,
  CircularProgress,
  IconButton,
} from '@mui/material'

import AwardForm from '../../components/performer/AwardForm'
import { apiResponse } from '@/utility/apiResponse/employeesResponse'
import { utility } from '@/utility'
import { useRouter } from 'next/navigation'
import { useSettings } from '@core/hooks/useSettings'
import MoreVertIcon from '@mui/icons-material/MoreVert'

type AnyObj = any
const AWARD_TITLE = 'Top Disbursal Performer'

const Award = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [employees, setEmployees] = useState<AnyObj[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<AnyObj>(null)

  const [amount, setAmount] = useState('')
  const [awardTitle, setAwardTitle] = useState(AWARD_TITLE)

  const [awardData, setAwardData] = useState<AnyObj>(null)

  const [userRole, setUserRole] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userDesg, setUserDesg] = useState<string | null>(null)

  const [loadingAward, setLoadingAward] = useState(false)

  const { capitalizeFirstLetter } = utility()
  const router = useRouter()
  const { settings } = useSettings()

  // -----------------------------
  // Helpers
  // -----------------------------
  const getUserCtx = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const token = localStorage.getItem('token') || ''
    const company_id = user?.company_id || ''
    return { user, token, company_id }
  }, [])

  const getAuthHeaders = useCallback(() => {
    const { token, company_id } = getUserCtx()
    return {
      Authorization: `Bearer ${token} ${company_id}`,
      'Content-Type': 'application/json',
    }
  }, [getUserCtx])

  const mapAwardEmployee = useCallback((award: AnyObj, list: AnyObj[]) => {
    if (!award) return award

    const empId =
      award?.employee?._id ||
      (typeof award?.employee === 'string' ? award.employee : null)

    if (!empId) return award

    const found = list?.find((e) => e?._id === empId)
    return found ? { ...award, employee: found } : award
  }, [])

 
  const fetchEmployees = useCallback(async () => {
    try {
      const employeesData = await apiResponse()
      const list = Array.isArray(employeesData) ? employeesData : []
      setEmployees(list)
      return list
    } catch (e) {
      console.error('fetchEmployees error:', e)
      setEmployees([])
      return []
    }
  }, [])

  const generateFromPerformance = useCallback(
    async (emps?: AnyObj[]) => {
      setLoadingAward(true)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/awards/auto/performer/month/top-disbursal`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            cache: 'no-store',
          },
        )

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.message || 'Auto generate failed')
        }

        const json = await res.json()
        const saved = json?.performerMonth || null
        if (!saved) throw new Error('Invalid response from server')

        const list = emps || employees
        const mapped = mapAwardEmployee(saved, list)

        setAwardData(mapped)
        setAwardTitle(mapped?.awardTitle || AWARD_TITLE)
        setAmount(String(mapped?.amount ?? ''))
      } catch (e: any) {
        console.error('generateFromPerformance error:', e)
        setAwardData(null)
      } finally {
        setLoadingAward(false)
      }
    },
    [employees, getAuthHeaders, mapAwardEmployee],
  )

  // -----------------------------
  // Init (AUTO RUN)
  // -----------------------------
  useEffect(() => {
    const { user } = getUserCtx()
    setUserId(user?.id || null)
    setUserDesg(user?.designation || null)
    setUserRole(String(user?.role || ''))

    ;(async () => {
      const emps = await fetchEmployees()
      await generateFromPerformance(emps)
    })()
  }, [])

 
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee: selectedEmployee?._id,
          amount,
          awardTitle: awardTitle || AWARD_TITLE,

          approved: amount,
          total: amount,

          company_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.message || 'Failed to save award')
      }

      // ✅ after save, re-run auto to show latest (optional)
      const emps = employees.length ? employees : await fetchEmployees()
      await generateFromPerformance(emps)

      setSelectedEmployee(null)
      setIsFormOpen(false)
    } catch (error: any) {
      console.error('Error saving award:', error?.message)
      alert(`Error: ${error?.message}`)
    }
  }

  const handleEditClick = () => {
    if (awardData) {
      setSelectedEmployee(awardData.employee)
      setAmount(String(awardData.amount ?? ''))
      setAwardTitle(String(awardData.awardTitle || AWARD_TITLE))
    } else {
      setSelectedEmployee(null)
      setAmount('')
      setAwardTitle(AWARD_TITLE)
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => setIsFormOpen(false)
  const handleProfileClick = (id: string) => router.push(`/profile/${id}`)
  const canManage = userRole === '1' || userDesg === 'Sr. Operation Manager'

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          key={awardData ? awardData._id : 'no-award'}
          sx={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            background: settings.mode === 'dark' ? '#333' : '#1a237e',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': { transform: 'translateY(-5px)' },
          }}
        >
          <CardContent
            sx={{
              height: '100%',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2rem',
              backgroundColor: settings.mode === 'dark' ? '#444' : '#ffffff',
              margin: '0px 5px 0px 5px',
              borderTopLeftRadius: '80px',
              borderBottomRightRadius: '80px',
              borderBottomLeftRadius: '-10px',
            }}
          >
            <Box>
              <Paper
                elevation={0}
                sx={{
                  background:
                    settings.mode === 'dark'
                      ? '#424242'
                      : 'rgba(25, 118, 210, 0.05)',
                  padding: '1.5rem',
                  borderRadius: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}
              >
                {loadingAward ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} />
                    <Typography variant="h6">Loading award...</Typography>
                  </Box>
                ) : (
                  <Typography
                    variant="h4"
                    sx={{
                      color: settings.mode === 'dark' ? 'white' : '#1a237e',
                      fontWeight: 700,
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.03125rem',
                    }}
                  >
                    {awardData?.employee ? (
                      <>
                        {userId === awardData.employee._id
                          ? 'Congratulations'
                          : 'Congratulate'}{' '}
                        <span
                          style={{
                            background:
                              'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)',
                            WebkitBackgroundClip: 'text',
                            fontWeight: 800,
                          }}
                        >
                          {capitalizeFirstLetter(awardData.employee.first_name)}{' '}
                          {capitalizeFirstLetter(awardData.employee.last_name)}
                        </span>{' '}
                        <Tooltip title="View Profile" arrow>
                          <Avatar
                            src={awardData.employee.image}
                            alt={`${awardData.employee.first_name} ${awardData.employee.last_name}`}
                            sx={{
                              width: 40,
                              height: 40,
                              marginLeft: '0.5rem',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              cursor: 'pointer',
                            }}
                            onClick={() =>
                              handleProfileClick(awardData.employee._id)
                            }
                          />
                        </Tooltip>
                      </>
                    ) : (
                      'No Award Data'
                    )}
                  </Typography>
                )}

                {awardData?.employee?.designation && (
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: settings.mode === 'dark' ? '#fff' : '#5c6bc0',
                      fontWeight: 500,
                      letterSpacing: '0.03125rem',
                    }}
                  >
                    {awardData.employee.designation}
                  </Typography>
                )}
              </Paper>

              <Box sx={{ marginTop: '1.5rem' }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: settings.mode === 'dark' ? '#fff' : '#3949ab',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    letterSpacing: '0.03125rem',
                  }}
                >
                  {awardData?.awardTitle || AWARD_TITLE}
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    background:
                      'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.75rem',
                    display: 'inline-block',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#ffffff',
                      letterSpacing: '0.0625rem',
                    }}
                  >
                    ₹{awardData?.amount ?? 'N/A'}
                  </Typography>
                </Paper>
              </Box>

              {awardData?.amount !== undefined &&
                awardData?.amount !== null &&
                String(awardData.amount) !== '' && (
                  <Typography
                    variant="h6"
                    sx={{ color: '#5c6bc0', marginTop: '1rem' }}
                  >
                    Total: ₹{awardData.amount}
                  </Typography>
                )}
            </Box>

            {/* edit icon only */}
            {canManage && (
              <Tooltip title="Add/Edit Award">
                <IconButton
                  onClick={handleEditClick}
                  sx={{
                    position: 'absolute',
                    top: '0.2rem',
                    right: '0.2rem',
                  }}
                >
                  <MoreVertIcon
                    sx={{
                      color: settings.mode === 'dark' ? 'white' : '#1a237e',
                    }}
                  />
                </IconButton>
              </Tooltip>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isFormOpen && (
        <AwardForm
          employees={employees}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          amount={amount}
          setAmount={setAmount}
          awardTitle={awardTitle}
          setAwardTitle={setAwardTitle}
          isEditMode={true}
          onSubmit={handleFormSubmit}
          onClose={handleCloseForm}
        />
      )}
    </Box>
  )
}

export default Award
