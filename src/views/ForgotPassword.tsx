'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Mode } from '@core/types'

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import EmailIcon from '@mui/icons-material/Email';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useImageVariant } from '@/@core/hooks/useImageVariant';
import Illustrations from '@/components/Illustrations';
import Logo from '@/@core/svg/Logo';


const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f', // Match the button's red color in the design
    },
  },
});

const ForgotPassword = ({ mode }: { mode: Mode }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const router = useRouter();
  const darkImg = '/images/pages/auth-v1-mask-dark.png';
  const lightImg = '/images/pages/auth-v1-mask-light.png';
  const authBackground = useImageVariant(mode, lightImg, darkImg);


  const handleForgotPassword = async () => {
    setIsLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setAlert({
        type: 'success',
        message: 'Reset link sent to your email. Please check your inbox.',
      });
    } catch (error: any) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to send reset email. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#f7f7f7',
          }}
        >

          <Logo />

          {/* Form Section */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 400,
              textAlign: 'center',
              border: '1px solid #e0e0e0',
            }}
          >
            <img
              src="https://thumbs.dreamstime.com/b/forgot-password-vector-icon-white-background-277222632.jpg"
              alt="Forgot Password Logo"
              style={{ marginBottom: '16px', maxWidth: '100px', height: 'auto' }}
            />

            <Typography component="h1" variant="h5" gutterBottom>
              Forgot your password?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You will receive a link to reset it
            </Typography>

            {alert.message && (
              <Alert
                severity={alert.type as 'error' | 'success'}
                sx={{ width: '100%', mb: 2 }}
              >
                {alert.message}
              </Alert>
            )}

            <TextField
              fullWidth
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleForgotPassword}
              disabled={isLoading}
              sx={{
                mt: 2,
                height: 48,
                backgroundColor: '#d32f2f',
                '&:hover': {
                  backgroundColor: '#b71c1c',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'RESET MY PASSWORD'
              )}
            </Button>
          </Paper>
        </Box>
      </Container>
      <Illustrations maskImg={{ src: authBackground }} />
    </ThemeProvider>
  );
};

export default ForgotPassword;
