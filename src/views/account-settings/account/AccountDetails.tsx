'use client'

import { useState, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '../../../utils/cropUtils'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Container,
  Grid,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material'
import { styled } from '@mui/material/styles'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

import { useDispatch, useSelector } from 'react-redux'
import { fetchConfiguration } from '@/redux/features/configuration/configurationSlice'
import { RootState, AppDispatch } from '@/redux/store'

// Styled components
const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 300,
  height: 300,
  margin: '0 auto',
  border: `2px dashed ${theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.grey[50]
}))

const StyledImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain'
})

const CropContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%'
})

const AccountDetails = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { data: configuration, loading } = useSelector((state: RootState) => state.configuration)

  const [logo, setLogo] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [rotation, setRotation] = useState(0)
  const [cropMode, setCropMode] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [aboutUs, setAboutUs] = useState('')
  const [email, setEmail] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [locations, setLocations] = useState<string[]>([''])
  const [branches, setBranches] = useState<string[]>([''])
  const [configId, setConfigId] = useState<string | null>(null)

  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success')
  const [openAlert, setOpenAlert] = useState(false)

  const { company_id } = typeof window !== 'undefined' ? JSON.parse(localStorage?.getItem('user')) : {}

  const API_URL = process.env.NEXT_PUBLIC_APP_URL

  useEffect(() => {
    if (!configuration) {
      dispatch(fetchConfiguration())
    } else {
      setCompanyName(configuration.name)
      setAboutUs(configuration.description)
      setEmail(configuration.email || '')
      setContactNo(configuration.contactNo || '')
      setLocations(configuration.address || [''])
      setBranches(configuration.branch || [''])
      setLogo(configuration.image)
      setConfigId(configuration._id)
    }
  }, [dispatch, configuration])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setLogo(reader.result as string)
        setCropMode(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async () => {
    if (logo && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(logo, croppedAreaPixels, rotation)
      setLogo(croppedImage)
      setCropMode(false)
    }
  }

  const handleAddLocation = () => {
    setLocations([...locations, ''])
  }

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index))
  }

  const handleLocationChange = (index: number, value: string) => {
    const updatedLocations = [...locations]
    updatedLocations[index] = value
    setLocations(updatedLocations)
  }

  const handleAddBranch = () => {
    setBranches([...branches, ''])
  }

  const handleRemoveBranch = (index: number) => {
    setBranches(branches.filter((_, i) => i !== index))
  }

  const handleBranchChange = (index: number, value: string) => {
    const updatedBranches = [...branches]
    updatedBranches[index] = value
    setBranches(updatedBranches)
  }

  const handleSubmit = async () => {
    if (!companyName || !aboutUs || !email || !contactNo) {
      showAlert('Please fill out all required fields!', 'error')
      return
    }

    const formData = new FormData()
    formData.append('name', companyName)
    formData.append('description', aboutUs)
    formData.append('email', email)
    formData.append('contactNo', contactNo)
    formData.append('address', JSON.stringify(locations))
    const lowercaseBranches = branches.map(branch => branch.toLowerCase())
    formData.append('branch', JSON.stringify(lowercaseBranches))
    formData.append('company_id', company_id)

    if (logo && !logo.startsWith('http')) {
      const response = await fetch(logo)
      const blob = await response.blob()
      formData.append('image', blob, 'logo.png')
    }

    try {
      const method = configId ? 'PUT' : 'POST'
      const url = configId ? `${API_URL}/configuration/update/${configId}` : `${API_URL}/configuration/create`

      const configResponse = await fetch(url, {
        method,
        body: formData
      })

      if (!configResponse.ok) throw new Error('Failed to save configuration')
      showAlert(configId ? 'Configuration updated successfully!' : 'Configuration created successfully!', 'success')
    } catch (error) {
      console.error('Error submitting configuration:', error)
      showAlert('Failed to submit configuration!', 'error')
    }
  }

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlertMessage(message)
    setAlertSeverity(severity)
    setOpenAlert(true)
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth='md'>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant='h4' gutterBottom color='primary'>
          {configId ? 'Update Configuration' : 'Create Configuration'}
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <ImageContainer>
              {cropMode && logo ? (
                <CropContainer>
                  <Cropper
                    image={logo}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  />
                </CropContainer>
              ) : (
                <StyledImage src={logo || '/images/default-logo.png'} alt='Logo' />
              )}
            </ImageContainer>

            <Box display='flex' justifyContent='center' gap={2} mt={2}>
              {cropMode ? (
                <>
                  <Button variant='contained' startIcon={<SaveIcon />} onClick={handleCropComplete} color='primary'>
                    Save Crop
                  </Button>
                  <Button
                    variant='outlined'
                    startIcon={<CancelIcon />}
                    onClick={() => setCropMode(false)}
                    color='error'
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button component='label' variant='contained' startIcon={<PhotoCamera />} sx={{ mt: 2 }}>
                  Upload Logo
                  <input hidden type='file' accept='image/*' onChange={handleFileInputChange} />
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Company Name'
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              margin='normal'
              variant='outlined'
              required
            />

            <TextField
              fullWidth
              label='Company Email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              margin='normal'
              variant='outlined'
              required
            />

            <TextField
              fullWidth
              label='Company Contact No.'
              value={contactNo}
              onChange={e => setContactNo(e.target.value)}
              margin='normal'
              variant='outlined'
              required
            />

            <Typography variant='h6' gutterBottom sx={{ mt: 2 }}>
              Branches
            </Typography>
            {branches.map((branch, index) => (
              <Box key={index} display='flex' alignItems='center' gap={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Branch ${index + 1}`}
                  value={branch}
                  onChange={e => handleBranchChange(index, e.target.value)}
                  variant='outlined'
                />
                {branches.length > 1 && (
                  <IconButton color='error' onClick={() => handleRemoveBranch(index)} sx={{ p: 1 }}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button variant='outlined' startIcon={<AddIcon />} onClick={handleAddBranch}>
              Add Branch
            </Button>

            <Typography variant='h6' gutterBottom sx={{ mt: 2 }}>
              Locations (Addresses)
            </Typography>
            {locations.map((location, index) => (
              <Box key={index} display='flex' alignItems='center' gap={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Location ${index + 1}`}
                  value={location}
                  onChange={e => handleLocationChange(index, e.target.value)}
                  variant='outlined'
                />
                {locations.length > 1 && (
                  <IconButton color='error' onClick={() => handleRemoveLocation(index)} sx={{ p: 1 }}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button variant='outlined' startIcon={<AddIcon />} onClick={handleAddLocation}>
              Add Location
            </Button>

            <TextField
              fullWidth
              label='About Us'
              value={aboutUs}
              onChange={e => setAboutUs(e.target.value)}
              margin='normal'
              multiline
              rows={4}
              variant='outlined'
              required
            />

            <Box sx={{ mt: 4 }}>
              <Button
                variant='contained'
                color='primary'
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                sx={{ mr: 2 }}
              >
                {configId ? 'Update' : 'Create'} Configuration
              </Button>
              <Button
                variant='outlined'
                color='secondary'
                onClick={() => setCropMode(false)}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar open={openAlert} autoHideDuration={6000} onClose={() => setOpenAlert(false)}>
        <Alert onClose={() => setOpenAlert(false)} severity={alertSeverity}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AccountDetails
