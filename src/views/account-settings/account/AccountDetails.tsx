'use client';

import { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../../utils/cropUtils';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';

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
}));

const StyledImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain'
});

const CropContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%'
});

const AccountDetails = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [openAlert, setOpenAlert] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_APP_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/configuration`);
        if (!response.ok) throw new Error('Failed to fetch configuration');
        const data = await response.json();

        if (data && data.length > 0) {
          const config = data[0];
          setCompanyName(config.name);
          setAboutUs(config.description);
          setLogo(config.image);
          setConfigId(config._id);
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
        showAlert('Failed to load configuration.', 'error');
      } finally {
        setDataLoaded(true);
      }
    };

    fetchData();
  }, [API_URL]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(reader.result as string);
        setCropMode(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async () => {
    if (logo && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(logo, croppedAreaPixels, rotation);
      setLogo(croppedImage);
      setCropMode(false);
    }
  };

  const handleSubmit = async () => {
    if (!companyName || !aboutUs) {
      showAlert('Please fill out all fields!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', companyName);
    formData.append('description', aboutUs);

    if (logo && !logo.startsWith('http')) {
      const response = await fetch(logo);
      const blob = await response.blob();
      formData.append('image', blob, 'logo.png');
    }

    try {
      if (isEditing && configId) {
        const configResponse = await fetch(`${API_URL}/configuration/update/${configId}`, {
          method: 'PUT',
          body: formData,
        });

        if (!configResponse.ok) throw new Error('Failed to update configuration');
        showAlert('Configuration updated successfully!', 'success');
      } else {
        const configResponse = await fetch(`${API_URL}/configuration/create`, {
          method: 'POST',
          body: formData,
        });

        if (!configResponse.ok) throw new Error('Failed to create configuration');
        const createdConfig = await configResponse.json();
        showAlert('Configuration created successfully!', 'success');
        setConfigId(createdConfig._id);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error submitting configuration:', error);
      showAlert('Failed to submit configuration!', 'error');
    }
  };

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  if (!dataLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {isEditing ? 'Update Configuration' : 'Create Configuration'}
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
                <StyledImage src={logo || '/images/default-logo.png'} alt="Logo" />
              )}
            </ImageContainer>

            <Box display="flex" justifyContent="center" gap={2} mt={2}>
              {cropMode ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleCropComplete}
                    color="primary"
                  >
                    Save Crop
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => setCropMode(false)}
                    color="error"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<PhotoCamera />}
                  sx={{ mt: 2 }}
                >
                  Upload Logo
                  <input hidden type="file" accept="image/*" onChange={handleFileInputChange} />
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              margin="normal"
              variant="outlined"
              required
            />
            <TextField
              fullWidth
              label="About Us"
              value={aboutUs}
              onChange={(e) => setAboutUs(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              variant="outlined"
              required
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              startIcon={<SaveIcon />}
              sx={{ mt: 4 }}
              size="large"
            >
              {isEditing ? 'Update Configuration' : 'Create Configuration'}
            </Button>
          </Grid>
        </Grid>

        <Snackbar
          open={openAlert}
          autoHideDuration={6000}
          onClose={() => setOpenAlert(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setOpenAlert(false)}
            severity={alertSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default AccountDetails;
