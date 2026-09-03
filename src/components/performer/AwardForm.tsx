import React from 'react'
import { Box, TextField, Button, IconButton, Typography, createTheme, ThemeProvider } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import TitleIcon from '@mui/icons-material/Title'
import DescriptionIcon from '@mui/icons-material/Description'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import Autocomplete from '@mui/material/Autocomplete'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import { motion } from 'framer-motion'

// Custom theme with blue color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A professional, deep blue
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e', // A complementary accent color
      light: '#ff4081',
      dark: '#9a0036'
    },
    background: {
      default: '#f4f4f4',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: {
      fontWeight: 600,
      letterSpacing: '0.5px'
    }
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& label.Mui-focused': {
            color: '#1976d2'
          },
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2'
            }
          }
        }
      }
    }
  }
})

interface AwardFormProps {
  employees: any[]
  selectedEmployee: any | null
  amount: string
  awardTitle: string
  approved: string
  total: string
  isEditMode: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onClose: () => void
  setSelectedEmployee: (employee: any) => void
  setAmount: (amount: string) => void
  setAwardTitle: (title: string) => void
  setApproved: (approved: string) => void
  setTotal: (total: string) => void
}

const AwardForm: React.FC<AwardFormProps> = ({
  employees,
  selectedEmployee,
  amount,
  awardTitle,
  approved,
  total,
  isEditMode,
  onSubmit,
  onClose,
  setSelectedEmployee,
  setAmount,
  setAwardTitle,
  setApproved,
  setTotal
}) => {
  return (
    <ThemeProvider theme={theme}>
      <Box
        position='fixed'
        top={0}
        left={0}
        width='100%'
        height='100%'
        display='flex'
        alignItems='center'
        justifyContent='center'
        zIndex={999}
        bgcolor='rgba(0,0,0,0.5)'
        padding={2}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: '500px' }}
        >
          <Box position='relative' width='100%' bgcolor='background.paper' padding={4} borderRadius={2} boxShadow={3}>
            <Typography
              variant='h6'
              color='primary'
              gutterBottom
              sx={{
                mb: 3,
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              {isEditMode ? 'Update Award' : 'Create New Award'}
            </Typography>

            <form onSubmit={onSubmit}>
              <Autocomplete
                options={employees}
                getOptionLabel={option => `${option.first_name} ${option.last_name}`}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Employee Name'
                    margin='normal'
                    fullWidth
                    variant='outlined'
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PersonAddIcon color='primary' sx={{ mr: 1, color: 'primary.main' }} />
                    }}
                  />
                )}
                value={selectedEmployee}
                onChange={(event, newValue) => {
                  setSelectedEmployee(newValue)
                }}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                sx={{ mb: 2 }}
              />

              <TextField
                label='Award Title'
                value={awardTitle}
                onChange={e => setAwardTitle(e.target.value)}
                fullWidth
                margin='normal'
                variant='outlined'
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <WorkOutlineIcon color='primary' sx={{ mr: 1, color: 'primary.main' }} />
                }}
              />

              <TextField
                label='Disbursal'
                value={amount}
                onChange={e => setAmount(e.target.value)}
                fullWidth
                multiline
                rows={4}
                margin='normal'
                variant='outlined'
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <DescriptionIcon
                      color='primary'
                      sx={{ mr: 1, color: 'primary.main', alignSelf: 'flex-start', mt: 1 }}
                    />
                  )
                }}
              />

              <TextField
                label='Approved'
                value={approved}
                onChange={e => setApproved(e.target.value)}
                fullWidth
                margin='normal'
                variant='outlined'
                sx={{ mb: 2 }}
              />

              <TextField
                label='Total'
                value={total}
                onChange={e => setTotal(e.target.value)}
                fullWidth
                margin='normal'
                variant='outlined'
                sx={{ mb: 2 }}
              />

              <Box mt={2} display='flex' justifyContent='space-between'>
                <Button type='submit' variant='contained' color='primary' startIcon={<SaveIcon />}>
                  {isEditMode ? 'Update' : 'Add'}
                </Button>
                <Button onClick={onClose} variant='outlined' color='secondary' startIcon={<CancelIcon />}>
                  Cancel
                </Button>
              </Box>
            </form>
          </Box>
        </motion.div>
      </Box>
    </ThemeProvider>
  )
}

export default AwardForm;
