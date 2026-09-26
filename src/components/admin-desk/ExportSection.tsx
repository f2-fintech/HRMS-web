'use client'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import DownloadIcon from '@mui/icons-material/Download'

interface Props {
  selectedDate: string
}

const ExportSection = ({
  selectedDate
}: Props) => {

  const user = JSON.parse(
    localStorage.getItem('user') || '{}'
  )

  const token =
    localStorage.getItem('token')

  const downloadFile = async (
    url: string,
    fileName: string
  ) => {

    try {

      const response = await fetch(url, {

        headers: {

          Authorization: `Bearer ${token} ${user.company_id}`

        }

      })

      const blob = await response.blob()

      const href =
        window.URL.createObjectURL(blob)

      const link =
        document.createElement('a')

      link.href = href

      link.download = fileName

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(href)

    } catch (err) {

      console.log(err)

    }

  }

  return (

    <Card>

      <CardContent>

        <Typography
          variant="h6"
          mb={4}
        >

          Export Reports

        </Typography>

        <Grid
          container
          spacing={3}
        >

          <Grid item xs={12} md={3}>

            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() =>
                downloadFile(

`${process.env.NEXT_PUBLIC_APP_URL}/punch/export-shift-summary?date=${selectedDate}&company_id=${user.company_id}`,

'ShiftSummary.xlsx'

                )
              }
            >

              Shift Summary

            </Button>

          </Grid>

          <Grid item xs={12} md={3}>

            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={() =>
                downloadFile(

`${process.env.NEXT_PUBLIC_APP_URL}/employees/export?company_id=${user.company_id}`,

'Employees.xlsx'

                )
              }
            >

              Employees

            </Button>

          </Grid>

          <Grid item xs={12} md={3}>

            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<DownloadIcon />}
              onClick={() =>
                downloadFile(

`${process.env.NEXT_PUBLIC_APP_URL}/attendance/export?date=${selectedDate}&company_id=${user.company_id}`,

'Attendance.xlsx'

                )
              }
            >

              Attendance

            </Button>

          </Grid>

          <Grid item xs={12} md={3}>

            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DownloadIcon />}
              onClick={() =>
                downloadFile(

`${process.env.NEXT_PUBLIC_APP_URL}/punch/employees-not-punches-by-date?date=${selectedDate}`,

'MissingPunch.xlsx'

                )
              }
            >

              Missing Punch

            </Button>

          </Grid>

        </Grid>

      </CardContent>

    </Card>

  )

}

export default ExportSection
