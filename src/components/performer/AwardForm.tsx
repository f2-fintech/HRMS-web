import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Autocomplete from '@mui/material/Autocomplete'
import { motion } from 'framer-motion'

interface AwardFormProps {
  employees: any[]
  selectedEmployee: any | null
  amount: string
  awardTitle: string
  isEditMode: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onClose: () => void
  setSelectedEmployee: (employee: any) => void
  setAmount: (amount: string) => void
  setAwardTitle: (title: string) => void
}

const AwardForm: React.FC<AwardFormProps> = ({
  employees,
  selectedEmployee,
  amount,
  awardTitle,
  isEditMode,
  onSubmit,
  onClose,
  setSelectedEmployee,
  setAmount,
  setAwardTitle
}) => {
  return (
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
        <Box
          position='relative'
          width='100%'
          bgcolor='white'
          padding={4}
          borderRadius={2}
          boxShadow={3}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'grey.600'
            }}
          >
            <CloseIcon />
          </IconButton>

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
            />

            <TextField
              label='Description'
              value={amount}
              onChange={e => setAmount(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin='normal'
              variant='outlined'
              sx={{ mb: 2 }}
            />

            <Box mt={2} display='flex' justifyContent='space-between'>
              <Button
                onClick={onClose}
                variant='outlined'
                color='secondary'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                color='primary'
              >
                {isEditMode ? 'Update' : 'Add'}
              </Button>
            </Box>
          </form>
        </Box>
      </motion.div>
    </Box>
  )
}

export default AwardForm
