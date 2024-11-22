'use client';

import { useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../../utils/cropUtils';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import axios from 'axios'; // Axios for HTTP requests

const AccountDetails = () => {
  const [logo, setLogo] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [aboutUs, setAboutUs] = useState('');

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
    if (!companyName || !aboutUs || !logo) {
      alert('Please fill out all fields and upload a logo!');
      return;
    }

    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('aboutUs', aboutUs);

    // Convert the logo Base64 to a Blob
    const response = await fetch(logo);
    const blob = await response.blob();
    formData.append('image', blob, 'logo.png');

    try {
      await axios.post('/api/company', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Data successfully submitted!');
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Failed to submit data!');
    }
  };

  return (
    <div>
      <Typography variant="h6">Upload and Crop Logo</Typography>
      <div style={{ position: 'relative', height: 400, width: 400 }}>
        {cropMode && logo ? (
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
        ) : (
          <img
            src={logo || '/images/default-logo.png'}
            alt="Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </div>
      <div className="flex gap-4 mt-4">
        {cropMode ? (
          <>
            <Button variant="contained" onClick={handleCropComplete}>
              Save Crop
            </Button>
            <Button variant="outlined" onClick={() => setCropMode(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button component="label" variant="contained">
            Upload Logo
            <input hidden type="file" accept="image/*" onChange={handleFileInputChange} />
          </Button>
        )}
      </div>

      {/* Form Fields */}
      <div className="mt-4">
        <TextField
          fullWidth
          label="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="About Us"
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          margin="normal"
          multiline
          rows={4}
        />
      </div>

      <div className="mt-4">
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default AccountDetails;
