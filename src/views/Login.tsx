'use client'
import { useState } from 'react';
import type { FormEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';

import type { Mode } from '@core/types'
import { useImageVariant } from '@core/hooks/useImageVariant';
import Logo from '@components/layout/shared/Logo';
import Illustrations from '@components/Illustrations';
import themeConfig from '@configs/themeConfig';
import Loader from '../components/loader/loader'

const Login = ({ mode }: { mode: Mode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const darkImg = '/images/pages/auth-v1-mask-dark.png';
  const lightImg = '/images/pages/auth-v1-mask-light.png';
  const authBackground = useImageVariant(mode, lightImg, darkImg);
  const [isLoading, setIsLoading] = useState(false);


  const handleClickShowPassword = () => setIsPasswordShown(show => !show);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Button clicked, setting loading to true...");
    setIsLoading(true);
    console.log("Loading state after setIsLoading: ", isLoading);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Network response was not ok');
      }

      const data = await response.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.payload.id,
        role: data.payload.role,
        designation: data.payload.designation,
      }));

      toast.success('Login successful!', {
        position: 'top-center',
      });

      router.push('/');
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        toast.error('Invalid email or password', {
          position: 'top-center',
        });
      } else {
        toast.error('Unexpected error occurred', {
          position: 'top-center',
        });
      }

      console.error('There was a problem with the fetch operation:', error);
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] relative p-6'>
      <ToastContainer />
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='p-6 sm:!p-12'>
          <Link href='/' className='flex justify-center items-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-5'>
            <div>
              <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}!👋🏻`}</Typography>
              <Typography className='mbs-1'>Please sign-in to your account and start the adventure</Typography>
            </div>
            <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='Email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <TextField
                fullWidth
                label='Password'
                id='outlined-adornment-password'
                type={isPasswordShown ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                        disabled={isLoading}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />
              <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
                <FormControlLabel control={<Checkbox disabled={isLoading} />} label='Remember me' />
                <Typography className='text-end' color='primary' component={Link} href='/forgot-password'>
                  Forgot password?
                </Typography>
              </div>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                sx={{
                  backgroundColor: 'orange',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'darkorange',
                  },
                }}
              >
                {isLoading ? <Loader /> : 'Log In'}
              </Button>

              <div className='flex justify-center items-center flex-wrap gap-2'>
                <Typography>New on our platform?</Typography>
                <Typography component={Link} href='/register' color='primary'>
                  Create an account
                </Typography>
              </div>
              <Divider className='gap-3'>or</Divider>
              <div className='flex justify-center items-center gap-2'>
                <IconButton size='small' className='text-facebook'>
                  <i className='ri-facebook-fill' />
                </IconButton>
                <IconButton size='small' className='text-twitter'>
                  <i className='ri-twitter-fill' />
                </IconButton>
                <IconButton size='small' className='text-github'>
                  <i className='ri-github-fill' />
                </IconButton>
                <IconButton size='small' className='text-googlePlus' disabled={isLoading}>
                  <i className='ri-google-fill' />
                </IconButton>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <Illustrations maskImg={{ src: authBackground }} />
    </div>
  );
};

export default Login;
