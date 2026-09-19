'use client'

import { useEffect, useState } from 'react'

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material'

import GroupsIcon from '@mui/icons-material/Groups'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import DashboardViewButton from './DashboardViewButton'
import DashboardViewModal from './DashboardViewModal'

import {
  apiResponse,
  
  employeesCountResponse,

  fetchShiftSummary,

  fetchTodayLeaves,

  fetchHalfDayEmployees,

  fetchAbsentEmployees,

  fetchEmployeesNotPunchedOut

} from '@/utility/apiResponse/employeesResponse'

interface DashboardCardsProps {

  selectedDate: string

}

interface DashboardSummary {

  totalEmployees: number

  todayLeave: number

  absent: number

  halfDay: number

  before10: number

  grace: number

  late: number

  missingPunchOut: number

}

const DashboardCards = ({

  selectedDate

}: DashboardCardsProps) => {

  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const [modalTitle, setModalTitle] = useState('')

  const [modalRows, setModalRows] = useState<any[]>([])

  const [viewData, setViewData] = useState({

  allEmployees: [],

  // totalEmployees: [],


  todayLeave: [],

  absent: [],

  halfDay: [],

  before10: [],

  grace: [],

  late: [],

  missingPunchOut: []

})

  const [summary, setSummary] =

    useState<DashboardSummary>({

      totalEmployees: 0,

      todayLeave: 0,

      absent: 0,

      halfDay: 0,

      before10: 0,

      grace: 0,

      late: 0,

      missingPunchOut: 0

    })

  useEffect(() => {

    if (selectedDate) {

      loadDashboard()

    }

  }, [selectedDate])
  const loadDashboard = async () => {

  try {

    setLoading(true)

    const yesterday = new Date(selectedDate)

    yesterday.setDate(yesterday.getDate() - 1)

    const yesterdayDate =
      yesterday.toISOString().split('T')[0]

    const [

  employees,

  totalEmployees,

  shiftSummary,

  todayLeaves,

  halfDayEmployees,

  absentEmployees,

  missingPunchOut

] = await Promise.all([
      apiResponse(),

      employeesCountResponse(),

      fetchShiftSummary(selectedDate),

      fetchTodayLeaves(),

      fetchHalfDayEmployees(selectedDate),

      fetchAbsentEmployees(selectedDate),

      fetchEmployeesNotPunchedOut(yesterdayDate)

    ])

    // ===========================
    // Punch Summary
    // ===========================

    let before10 = 0

    let grace = 0

    let late = 0

    const before10Employees: any[] = []

    const graceEmployees: any[] = []

    const lateEmployees: any[] = []

    if (Array.isArray(shiftSummary?.employees)) {

      shiftSummary.employees.forEach((employee: any) => {

        if (!employee.punchIn) return

        const time =
          employee.punchIn.substring(0, 5)

        if (time < '10:00') {

          before10++

before10Employees.push(employee)

        }

        else if (
        time >= '10:00' &&
        time <= '10:15'
      ) {

        grace++

        graceEmployees.push(employee)

      }

        else {

          late++

      lateEmployees.push(employee)

        }

      })

    }

    // ===========================
    // Today's Leave Count
    // ===========================

    const todayLeave =

      todayLeaves?.count ??

      todayLeaves?.employees?.length ??

      (Array.isArray(todayLeaves)
        ? todayLeaves.length
        : 0)

    // ===========================
    // Half Day Count
    // ===========================

    const halfDay =

      halfDayEmployees?.count ??

      halfDayEmployees?.employees?.length ??

      (Array.isArray(halfDayEmployees)
        ? halfDayEmployees.length
        : 0)

    // ===========================
    // Absent Count
    // ===========================

    const absent =

      absentEmployees?.count ??

      absentEmployees?.employees?.length ??

      (Array.isArray(absentEmployees)
        ? absentEmployees.length
        : 0)

    // ===========================
    // Missing Punch Out Yesterday
    // ===========================

    const missingPunchOutCount =

      missingPunchOut?.totalNotPunchedOut ??

      missingPunchOut?.employees?.length ??

      0

    // ===========================
    // Final State
    // ===========================

    setSummary({

      totalEmployees:
        Number(totalEmployees) || 0,

      todayLeave,

      absent,

      halfDay,

      before10,

      grace,

      late,

      missingPunchOut:
        missingPunchOutCount

    })

    setViewData({

allEmployees:
  employees?.employees ||
  employees?.data ||
  employees ||
  [],

  todayLeave:
    todayLeaves?.employees ||
    todayLeaves ||
    [],

  absent:
    absentEmployees?.employees ||
    absentEmployees ||
    [],

  halfDay:
    halfDayEmployees?.employees ||
    halfDayEmployees ||
    [],

  before10:
    before10Employees,

  grace:
    graceEmployees,

  late:
    lateEmployees,

  missingPunchOut:
    missingPunchOut?.employees ||
    []

})
  }

  catch (error) {

    console.error(
      'Dashboard Error',
      error
    )

  }

  finally {

    setLoading(false)

  }

}
const cards = [

  {
  title: 'Total Employees',
  value: summary.totalEmployees,
  rows: viewData.allEmployees,
  color: '#1976d2',
  icon: <GroupsIcon fontSize="large" />
},
  {
  title: "Today's Leave",
  value: summary.todayLeave,
  rows: viewData.todayLeave,
  color: "#ef5350",
  icon: <EventBusyIcon fontSize="large" />
},

  {
  title: 'Absent Today',
  value: summary.absent,
  rows: viewData.absent,
  color: '#8e24aa',
  icon: <PersonOffIcon fontSize="large" />
},

  {
    title: 'Half Day',
    value: summary.halfDay,
    rows: viewData.halfDay,
    color: '#00897b',
    icon: <AccessTimeIcon fontSize="large" />
  },

  {
    title: 'Punch Before 10 AM',
    value: summary.before10,
    rows: viewData.before10,
    color: '#2e7d32',
    icon: <AccessTimeIcon fontSize="large" />
  },

  {
    title: '10:00 - 10:15 AM',
    value: summary.grace,
    rows: viewData.grace,
    color: '#f9a825',
    icon: <AccessTimeIcon fontSize="large" />
  },

  {
    title: 'After 10:15 AM',
    value: summary.late,
    rows: viewData.late,
    color: '#d32f2f',
    icon: <AccessTimeIcon fontSize="large" />
  },

  {
    title: 'Yesterday Missing Punch Out',
    value: summary.missingPunchOut,
    rows: viewData.missingPunchOut,
    color: '#5d4037',
    icon: <HighlightOffIcon fontSize="large" />
  }

]
return (
  <>
    <Grid container spacing={3}>
    {cards.map((card) => (

      <Grid
        item
        xs={12}
        sm={6}
        md={3}
        key={card.title}
      >

        <Card
          sx={{

            borderRadius: 3,

            height: '100%',

            boxShadow: 3,

            transition: '0.3s',

            '&:hover': {

              transform: 'translateY(-5px)',

              boxShadow: 8

            }

          }}
        >

          <CardContent>

            <Box

              display="flex"

              justifyContent="space-between"

              alignItems="center"

            >

              <Box>

                <Typography

                  variant="body2"

                  color="text.secondary"

                >

                  {card.title}

                </Typography>

                <Typography

                  variant="h4"

                  fontWeight={700}

                  mt={2}

                >
                  

                  {loading ? (

                    <CircularProgress size={24} />

                  ) : (

                    card.value

                  )}

                </Typography>
                  {card.rows && (

  <Box mt={1}>

    <DashboardViewButton
      onClick={() => {

        setModalTitle(card.title)

        setModalRows(card.rows)

        setOpen(true)

      }}
    />

  </Box>

)}        </Box>

              <Box

                sx={{

                  width: 60,

                  height: 60,

                  borderRadius: '50%',

                  bgcolor: `${card.color}20`,

                  color: card.color,

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center'

                }}

              >

                {card.icon}

              </Box>

            </Box>

          </CardContent>

        </Card>

      </Grid>

    ))}

  </Grid>

<DashboardViewModal
  open={open}
  title={modalTitle}
  rows={modalRows}
  onClose={() => setOpen(false)}
/>

</>

)

}

export default DashboardCards
