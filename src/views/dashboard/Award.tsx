import { useState, useEffect } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
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
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState(null)
  const [userDesg, setUserDesg] = useState(null)
  const { capitalizeFirstLetter } = utility();


  console.log('userDesg', userDesg)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserId(user.id)
    setUserDesg(user.designation)
    setUserRole(user.role);

    const fetchEmployeesAndAwards = async () => {
      try {
        const employeesData = await apiResponse()

        setEmployees(employeesData)

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/awards/get`)

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

  const handleFormSubmit = async event => {
    event.preventDefault()

    try {
      let url = `${process.env.NEXT_PUBLIC_APP_URL}/awards/performer/month`
      const method = awardData && awardData._id ? 'PUT' : 'POST'

      if (method === 'PUT') {
        url = `${process.env.NEXT_PUBLIC_APP_URL}/awards/month/performer/${awardData._id}`
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee: employeeName?._id,
          amount,
          awardTitle
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
  }

  return (
    <>
      <Card
        key={awardData ? awardData._id : 'no-award'}
        sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <CardContent className='flex-grow relative flex flex-col gap-2 items-start' sx={{ height: '40vh' }}>
          <div>
            <Typography variant='h5'>
              {awardData && awardData.employee ? (
                <Typography variant='h4'>
                  {userId === awardData.employee._id ? 'Congratulations' : 'Congratulate'}{' '}
                  <span style={{ fontWeight: 'bold', color: '#1efd44' }}>
                    {capitalizeFirstLetter(awardData.employee.first_name)} {capitalizeFirstLetter(awardData.employee.last_name)} 🎉
                  </span>
                </Typography>
              ) : (
                'No Award Data'
              )}


              {awardData && awardData.employee && (
                <Typography style={{ fontWeight: 'normal', color: '#bb89d8', fontStyle: 'italic', marginTop: '4px' }}>
                  {awardData.employee.designation}
                </Typography>
              )}
            </Typography>
            <div style={{ paddingRight: '80px', wordWrap: 'break-word', wordBreak: 'break-all' }}>
              <Typography
                variant='h6'
                style={{
                  fontSize: '1rem',
                  marginTop: '8px',
                  wordWrap: 'break-word', // Ensure word wrapping
                  wordBreak: 'break-all',  // Break words that are too long
                }}
              >
                {awardData?.awardTitle || 'Best seller of the month'}
              </Typography>
            </div>

          </div>

          <div style={{ paddingRight: '80px', wordWrap: 'break-word', wordBreak: 'break-all' }}>
            <Typography variant='h5' color='primary' style={{ wordWrap: 'break-word', wordBreak: 'break-all' }}>
              {awardData?.amount ? awardData.amount : 'N/A'}
            </Typography>
          </div>

          <div className='relative w-full'>
            <img src='/images/pages/trophy.png' alt='trophy image' height={70} className='absolute right-4 bottom-6' />
          </div>

          {(userDesg === 'Sr. Operation Manager' || userRole === '1') && (
            <Tooltip title='Add/Edit'>
              <IconButton onClick={handleEditClick} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}

        </CardContent>

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
      </Card>
    </>
  )
}

export default Award
