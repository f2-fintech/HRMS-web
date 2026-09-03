'use client'
import { useState } from 'react';

import type { FormEvent } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Checkbox,
  Button,
  FormControlLabel,
  Box,
  Container,
  createTheme,
  ThemeProvider
} from '@mui/material';

import { Visibility, VisibilityOff } from '@mui/icons-material';

import type { Mode } from '@core/types';
import { useImageVariant } from '@core/hooks/useImageVariant';
import Illustrations from '@components/Illustrations';
import Loader from '../components/loader/loader';

const bankingTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2557a7',
      light: '#4778c7',
      dark: '#1a4178'
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    },
    text: {
      primary: '#2c3345',
      secondary: '#637381'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#2c3345'
    },
    body1: {
      color: '#637381'
    }
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '&:hover fieldset': {
              borderColor: '#2557a7'
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.08)'
        }
      }
    }
  }
})

const Login = ({ mode }: { mode: Mode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const darkImg = '/images/pages/auth-v1-mask-dark.png'
  const lightImg = '/images/pages/auth-v1-mask-light.png'
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const [isLoading, setIsLoading] = useState(false)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()

        throw new Error(errorData.message || 'Network response was not ok')
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.payload.id,
        name: data.payload.first_name + ' ' + data.payload.last_name,
        role: data.payload.role,
        designation: data.payload.designation,
        code: data.payload.code,
        company_id: data.payload.company_id
      }));

      toast.success('Login successful!', {
        position: 'top-center'
      })

      window.location.href = '/';
    } catch (error: any) {
      toast.error(error.message, {
        position: 'top-center'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ThemeProvider theme={bankingTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)',
          padding: '1.5rem',
          position: 'relative'
        }}
      >
        <ToastContainer />
        <Container maxWidth='sm'>
          <Card
            sx={{
              width: '100%',
              maxWidth: '450px',
              margin: '0 auto',
              position: 'relative',
              overflow: 'visible',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #2557a7, #4778c7)',
                borderRadius: '16px 16px 0 0'
              }
            }}
          >
            <CardContent sx={{ padding: { xs: '2rem', sm: '3rem' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className='flex justify-center items-center'>
                  <Image
                    src='/images/logos/ems-logo.jpg'
                    alt='EMS Logo'
                    width={100} // Set width as needed
                    height={90}
                  />
                </div>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography
                    variant='h4'
                    sx={{
                      mb: 1,
                      color: '#2c3345'
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      color: '#637381'
                    }}
                  >
                    Sign in to continue to your account
                  </Typography>
                </Box>

                <form noValidate autoComplete='off' onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      label='Email'
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isLoading}
                      variant='outlined'
                      InputLabelProps={{
                        shrink: true,
                        sx: { color: '#637381' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '&:hover': {
                            '& fieldset': {
                              borderColor: '#2557a7'
                            }
                          }
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      label='Password'
                      type={isPasswordShown ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading}
                      variant='outlined'
                      InputLabelProps={{
                        shrink: true,
                        sx: { color: '#637381' }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              onClick={handleClickShowPassword}
                              edge='end'
                              disabled={isLoading}
                              sx={{ color: '#637381' }}
                            >
                              {isPasswordShown ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '&:hover': {
                            '& fieldset': {
                              borderColor: '#2557a7'
                            }
                          }
                        }
                      }}
                    />

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={isLoading}
                            sx={{
                              color: '#637381',
                              '&.Mui-checked': {
                                color: '#2557a7'
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ color: '#637381', fontSize: '0.875rem' }}>Remember me</Typography>}
                      />
                      <Link href='/forgot-pass'>
                        <Typography
                          sx={{
                            color: '#2557a7',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              color: '#1a4178',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Forgot password?
                        </Typography>
                      </Link>
                    </Box>

                    <Button
                      fullWidth
                      type='submit'
                      variant='contained'
                      disabled={isLoading}
                      sx={{
                        mt: 2,
                        height: '48px',
                        background: 'linear-gradient(90deg, #2557a7, #4778c7)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(37, 87, 167, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(90deg, #1a4178, #2557a7)',
                          boxShadow: '0 6px 16px rgba(37, 87, 167, 0.3)',
                          transform: 'translateY(-1px)'
                        },
                        '&:active': {
                          transform: 'translateY(0)'
                        }
                      }}
                    >
                      {isLoading ? <Loader /> : 'Sign In'}
                    </Button>
                  </Box>
                </form>
              </Box>
            </CardContent>
          </Card>
        </Container>
        <Illustrations maskImg={{ src: authBackground }} />
      </Box>
    </ThemeProvider>
  )
}

export default Login
