'use client'

import Button from '@mui/material/Button'
import VisibilityIcon from '@mui/icons-material/Visibility'

interface DashboardViewButtonProps {

  onClick: () => void

}

export default function DashboardViewButton({

  onClick

}: DashboardViewButtonProps) {

  return (

    <Button

      size="small"

      onClick={onClick}

      startIcon={

        <VisibilityIcon sx={{ fontSize: 16 }} />

      }

      sx={{

  mt: 1.5,

  borderRadius: 999,

  px: 2,

  py: 0.4,

  textTransform: 'none',

  fontWeight: 700,

  fontSize: 12,

  bgcolor: '#5B3CC4',

  color: '#fff',

  border: 'none',

  boxShadow: '0 3px 8px rgba(91,60,196,.25)',

  '&:hover': {

    bgcolor: '#4A2FB8'

  }

}}

    >

      View

    </Button>

  )

}
