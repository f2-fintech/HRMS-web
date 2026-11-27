'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Grid,
  CircularProgress,
  useTheme,
  Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export default function IdCard() {
  const [user, setUser] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { data: configuration } = useSelector((state: RootState) => state.configuration);
  const logoSrc = configuration?.image || '/images/logos/placeholder-logo.png';

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof window !== 'undefined') {
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr);
            if (localUser.id) {
              const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/employees/get/${localUser.id}`);
              let empData = localUser;
              if (response.ok) {
                empData = await response.json();
              }
              
              const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/profile/${localUser.id}`);
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                empData = { ...empData, profile: profileData };
              }
              
              setUser(empData);
              return;
            }
            setUser(localUser); // fallback
          } catch (e) {
            console.error('Error loading user profile:', e);
          }
        }
      }
    };
    fetchUserData();
  }, []);

  const handleDownload = async () => {
    if (cardRef.current) {
      // Temporarily unflip to capture the front, or we could capture both.
      // We will capture the currently visible side.
      try {
        const canvas = await html2canvas(cardRef.current, { 
          scale: 3, 
          useCORS: true,
          backgroundColor: null
        });
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ID_Card_${user?.first_name || 'Employee'}.png`;
        link.href = url;
        link.click();
      } catch (err) {
        console.error('Error downloading ID card:', err);
      }
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const designation = user?.designation || 'Employee';
  const empId = user?.code || user?.employeeId || user?.employee_id || user?._id?.substring(0, 8).toUpperCase() || 'EMP-001';
  const qrData = `BEGIN:VCARD\nVERSION:3.0\nN:${user?.last_name || ''};${user?.first_name || ''}\nFN:${fullName}\nORG:F2Fintech\nTITLE:${designation}\nEMAIL:${user?.email || ''}\nTEL:${user?.phone || ''}\nEND:VCARD`;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, fontFamily: "'Montserrat', sans-serif" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
            Digital ID Card
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your official digital identity card. Click or tap to flip.
          </Typography>
        </Box>
        {/* <Button 
          variant="contained" 
          color="primary" 
          startIcon={<DownloadIcon />} 
          onClick={handleDownload}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: '44px', px: 3, bgcolor: '#00569c', '&:hover': { bgcolor: '#003d73' } }}
        >
          Download Card
        </Button> */}
      </Box>

      <Box display="flex" justifyContent="center" mt={6} sx={{ perspective: '1000px' }}>
        {/* Flip Container */}
        <Box 
          onClick={() => setIsFlipped(!isFlipped)}
          sx={{
            width: 330,
            height: 520,
            position: 'relative',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: 'pointer'
          }}
        >
          {/* FRONT OF CARD */}
          <Paper 
            ref={!isFlipped ? cardRef : null}
            elevation={8}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Top Curve Background */}
            <Box sx={{
              width: '140%',
              height: '240px',
              background: '#00569c',
              position: 'absolute',
              top: '-40px',
              left: '-20%',
              borderBottomLeftRadius: '50%',
              borderBottomRightRadius: '50%',
              zIndex: 0
            }} />

            {/* Header Text */}
            <Box sx={{ position: 'relative', zIndex: 1, mt: 3, textAlign: 'center', width: '100%' }}>
              <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
                <img src={logoSrc} alt="Company Logo" style={{ width: '80px', height: 'auto', maxHeight: '40px', objectFit: 'contain' }} />
              </Box>
              <Typography variant="h6" fontWeight={800} color="#ffffff" letterSpacing={1} sx={{ fontSize: '1.1rem' }}>
                {configuration?.name || 'F2FINTECH'}
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.9)" letterSpacing={0.5} sx={{ fontSize: '0.65rem' }}>
                INNOVATION MEETS TECHNOLOGY
              </Typography>
            </Box>

            {/* Profile Picture */}
            <Box sx={{ mt: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ 
                width: 140, 
                height: 140, 
                borderRadius: '50%', 
                bgcolor: '#fff', 
                p: 0.5, 
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
              }}>
                <Avatar 
                  src={user?.image} 
                  sx={{ width: '100%', height: '100%', border: '4px solid #00569c' }}
                >
                  {!user?.image && <Typography variant="h3">{user?.first_name?.[0]}</Typography>}
                </Avatar>
              </Box>
            </Box>

            {/* Name & Designation */}
            <Box textAlign="center" mt={2} px={3} position="relative" zIndex={1} width="100%">
              <Typography variant="h5" fontWeight={800} color="#00569c" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {fullName}
              </Typography>
              <Typography variant="caption" fontWeight={600} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                {designation}
              </Typography>
            </Box>

            {/* Details List */}
            <Box mt={4} px={5} width="100%" position="relative" zIndex={1}>
              <Grid container spacing={1.5} sx={{ '& .MuiTypography-root': { fontSize: '0.85rem', fontWeight: 700 } }}>
                <Grid item xs={5}><Typography color="#334155">Emp. Code</Typography></Grid>
                <Grid item xs={7}><Typography color="#64748b">{empId}</Typography></Grid>

                <Grid item xs={5}><Typography color="#334155">D.O.B</Typography></Grid>
                <Grid item xs={7}><Typography color="#64748b">{user?.dob ? new Date(user.dob).toLocaleDateString('en-GB') : 'N/A'}</Typography></Grid>

                <Grid item xs={5}><Typography color="#334155">Branch</Typography></Grid>
                <Grid item xs={7}><Typography color="#64748b" sx={{ textTransform: 'capitalize' }}>{user?.branch || user?.branch_name || user?.location || 'N/A'}</Typography></Grid>

                <Grid item xs={5}><Typography color="#334155">Blood Group</Typography></Grid>
                <Grid item xs={7}><Typography color="#64748b">{user?.profile?.personalDetails?.bloodGroup || user?.blood_group || 'N/A'}</Typography></Grid>
              </Grid>
            </Box>

            {/* Bottom Corner Accent */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: '#00569c',
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              zIndex: 0
            }} />
          </Paper>

          {/* BACK OF CARD */}
          <Paper 
            elevation={8}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#00569c',
              display: 'flex',
              flexDirection: 'column',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Top White Curve Background */}
            <Box sx={{
              width: '140%',
              height: '240px',
              background: '#ffffff',
              position: 'absolute',
              top: '-40px',
              left: '-20%',
              borderBottomLeftRadius: '50%',
              borderBottomRightRadius: '50%',
              zIndex: 0
            }} />

            {/* Header Text */}
            <Box sx={{ position: 'relative', zIndex: 1, mt: 3, textAlign: 'center', width: '100%' }}>
              <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
                <img src={logoSrc} alt="Company Logo" style={{ width: '80px', height: 'auto', maxHeight: '40px', objectFit: 'contain' }} />
              </Box>
              <Typography variant="h6" fontWeight={800} color="#00569c" letterSpacing={1} sx={{ fontSize: '1.1rem' }}>
                {configuration?.name || 'F2FINTECH'}
              </Typography>
              <Typography variant="caption" color="#64748b" letterSpacing={0.5} sx={{ fontSize: '0.65rem' }}>
                INNOVATION MEETS TECHNOLOGY
              </Typography>
            </Box>

            {/* Barcode/QR */}
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Box sx={{ p: 1, bgcolor: '#fff' }}>
                <QRCode value={qrData} size={64} level="L" />
              </Box>
            </Box>

            {/* Terms & Conditions */}
            <Box position="relative" zIndex={1} px={4} mt={6}>
              <Typography variant="subtitle2" fontWeight={700} color="#ffffff" sx={{ mb: 1, borderBottom: '1px solid rgba(255,255,255,0.3)', pb: 0.5 }}>
                Terms & Conditions:
              </Typography>
              
              <Box display="flex" gap={1} mt={1.5}>
                <Box mt={0.5}><Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff' }}/></Box></Box>
                <Typography color="rgba(255,255,255,0.9)" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                  This card is the property of F2Fintech and must be returned upon request.
                </Typography>
              </Box>
              
              <Box display="flex" gap={1} mt={1.5}>
                <Box mt={0.5}><Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff' }}/></Box></Box>
                <Typography color="rgba(255,255,255,0.9)" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                  It is strictly non-transferable and intended for official use only.
                </Typography>
              </Box>

              <Box display="flex" gap={1} mt={1.5}>
                <Box mt={0.5}><Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff' }}/></Box></Box>
                <Typography color="rgba(255,255,255,0.9)" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                  Loss of this card must be reported immediately to the HR department.
                </Typography>
              </Box>
            </Box>

            {/* Signature Area */}
            <Box position="relative" zIndex={1} sx={{ mt: 'auto', mb: 3, mr: 4, ml: 'auto', width: '120px', textAlign: 'center' }}>
              <Typography sx={{ fontFamily: "'Dancing Script', cursive", color: '#fff', fontSize: '1.2rem', mb: -0.5 }}>F2Fintech</Typography>
              <Divider sx={{ borderColor: '#fff', mb: 0.5 }} />
              <Typography color="#fff" sx={{ fontSize: '0.65rem' }}>Authorised Signature</Typography>
            </Box>

            {/* Bottom Corner Accent */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100px',
              height: '100px',
              background: '#ffffff',
              clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
              zIndex: 0
            }} />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
