'use client'

import { useEffect, useState } from 'react'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip
} from '@mui/material'

import {
  DataGrid,
  GridColDef
} from '@mui/x-data-grid'

import {

  apiResponse,

  fetchTodayLeaves,

  fetchMonthlyAttendanceSummary,

  fetchShiftSummary,

  fetchEmployeesNotPunchedOut

} from '@/utility/apiResponse/employeesResponse'

interface AdminDataGridProps {

  selectedDate: string

}

interface EmployeeRow {

  id: string

  employeeName: string

  designation: string

  todayLeave: string

  halfDay: number

  monthlyLeave: number

  overallLeave: number

  punchIn: string

  punchOut: string

  punchTiming: string

  missingPunchOut: string

}

const AdminDataGrid = ({

  selectedDate

}: AdminDataGridProps) => {

  const [loading, setLoading] = useState(false)

  const [rows, setRows] =

    useState<EmployeeRow[]>([])

  useEffect(() => {

    if (selectedDate) {

      loadGrid()

    }

  }, [selectedDate])

  const loadGrid = async () => {

  try {

    setLoading(true)

    const month = new Date(selectedDate).getMonth() + 1

    const year = new Date(selectedDate).getFullYear()

    const [

      employeesResponse,

      monthlySummary,

      shiftSummary,

      todayLeaves,

      missingPunchOut

    ] = await Promise.all([

      apiResponse(),

      fetchMonthlyAttendanceSummary(month, year),

      fetchShiftSummary(selectedDate),

      fetchTodayLeaves(),

      fetchEmployeesNotPunchedOut(selectedDate)

    ])

    // ==========================
    // Employee List
    // ==========================

    const employees =

      employeesResponse?.employees ||

      employeesResponse?.data ||

      employeesResponse ||

      []

    // ==========================
    // Monthly Leave Map
    // ==========================

    const monthlyLeaveMap = new Map()

    const halfDayMap = new Map()

    if (Array.isArray(monthlySummary)) {

      monthlySummary.forEach((emp: any) => {

        monthlyLeaveMap.set(

          String(emp.employeeId),

          Number(emp?.statuses?.['On Leave'] || 0)

        )

        halfDayMap.set(

          String(emp.employeeId),

          Number(emp?.statuses?.['On Half'] || 0)

        )

      })

    }

    // ==========================
    // Shift Summary Map
    // ==========================

    const shiftMap = new Map()

    if (Array.isArray(shiftSummary?.employees)) {

      shiftSummary.employees.forEach((emp: any) => {

        shiftMap.set(String(emp.employeeId), emp)

      })

    }

    // ==========================
    // Today's Leave Set
    // ==========================

    const todayLeaveSet = new Set()

    if (todayLeaves?.employees) {

      todayLeaves.employees.forEach((emp: any) => {

        todayLeaveSet.add(String(emp.employee))

      })

    }

    // ==========================
    // Missing Punch Out Set
    // ==========================

    const missingPunchOutSet = new Set()

    if (missingPunchOut?.employees) {

      missingPunchOut.employees.forEach((emp: any) => {

        missingPunchOutSet.add(String(emp.employeeId))

      })

    }

    // ==========================
    // Final Rows
    // ==========================

    const finalRows = employees.map((emp: any) => {

      const shift =

        shiftMap.get(String(emp._id)) || {}

      const monthlyLeave =

        monthlyLeaveMap.get(String(emp._id)) || 0

      const halfDay =

        halfDayMap.get(String(emp._id)) || 0

      const overallLeave =

        monthlyLeave + halfDay

      let punchTiming = '-'

      if (shift.punchIn) {

        const time = shift.punchIn.substring(0, 5)

        if (time < '10:00') {

          punchTiming = 'Before 10'

        }

        else if (time <= '10:15') {

          punchTiming = '10:00-10:15'

        }

        else {

          punchTiming = 'After 10:15'

        }

      }

      return {

        id: emp._id,

        employeeName:

          `${emp.first_name} ${emp.last_name}`,

        designation:

          emp.designation || '-',

        todayLeave:

          todayLeaveSet.has(String(emp._id))

            ? 'Yes'

            : 'No',

        halfDay,

        monthlyLeave,

        overallLeave,

        punchIn:

          shift.punchIn || '-',

        punchOut:

          shift.punchOut || '-',

        punchTiming,

        missingPunchOut:

          missingPunchOutSet.has(String(emp._id))

            ? 'Yes'

            : 'No'

      }

    })

    setRows(finalRows)

  }

  catch (error) {

    console.error(error)

  }

  finally {

    setLoading(false)

  }

}
const columns: GridColDef[] = [

  {
    field: 'employeeName',
    headerName: 'Employee Name',
    flex: 1.5,
    minWidth: 220
  },

  {
    field: 'designation',
    headerName: 'Designation',
    flex: 1,
    minWidth: 160
  },

  {
    field: 'todayLeave',
    headerName: "Today's Leave",
    width: 130,
    renderCell: (params) => (
      <Chip
        size="small"
        label={params.value}
        color={params.value === 'Yes' ? 'error' : 'success'}
      />
    )
  },

  {
    field: 'halfDay',
    headerName: 'Half Day',
    width: 110,
    align: 'center',
    headerAlign: 'center'
  },

  {
    field: 'monthlyLeave',
    headerName: 'Monthly Leave',
    width: 140,
    align: 'center',
    headerAlign: 'center'
  },

  {
    field: 'overallLeave',
    headerName: 'Overall Leave',
    width: 140,
    align: 'center',
    headerAlign: 'center'
  },

  {
    field: 'punchIn',
    headerName: 'Punch In',
    width: 120
  },

  {
    field: 'punchOut',
    headerName: 'Punch Out',
    width: 120
  },

  {
    field: 'punchTiming',
    headerName: 'Punch Category',
    width: 170,

    renderCell: (params) => {

      let color:
        | 'success'
        | 'warning'
        | 'error'
        | 'default' = 'default'

      if (params.value === 'Before 10')
        color = 'success'

      else if (params.value === '10:00-10:15')
        color = 'warning'

      else if (params.value === 'After 10:15')
        color = 'error'

      return (
        <Chip
          size="small"
          label={params.value}
          color={color}
        />
      )
    }
  },

  {
    field: 'missingPunchOut',
    headerName: 'Missing Punch Out',
    width: 170,

    renderCell: (params) => (
      <Chip
        size="small"
        label={params.value}
        color={params.value === 'Yes' ? 'error' : 'success'}
      />
    )
  }

]
return (

  <Card
    sx={{
      mt: 3,
      borderRadius: 3,
      boxShadow: 3
    }}
  >

    <CardContent>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >

        <Typography
          variant="h6"
          fontWeight={700}
        >
          Employee Attendance Report
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {rows.length} Employees
        </Typography>

      </Box>

      <Box
        sx={{
          width: '100%',
          height: 700
        }}
      >

        <DataGrid

          rows={rows}

          columns={columns}

          loading={loading}

          disableRowSelectionOnClick

          pageSizeOptions={[
            10,
            25,
            50,
            100
          ]}

          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 25
              }
            }
          }}

          sx={{
          border: 0,

          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#5B3CC4'
          },

          '& .MuiDataGrid-columnHeader': {
            backgroundColor: '#5B3CC4'
          },

          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px'
          },

          '& .MuiDataGrid-columnSeparator': {
            color: '#FFFFFF50'
          },

          '& .MuiDataGrid-cell': {
            alignItems: 'center'
          }
        }}
        />

      </Box>

    </CardContent>

  </Card>

)

}

export default AdminDataGrid
