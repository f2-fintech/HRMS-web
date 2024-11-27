'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';

import Logo from '@components/layout/shared/Logo';
import { useImageVariant } from '@/@core/hooks/useImageVariant';
import { Mode } from '@/@core/types';
import Illustrations from '@/components/Illustrations';

const ResetPassword = ({ mode }: { mode: Mode }) => {
    const router = useRouter();
    const { token } = useParams();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const darkImg = '/images/pages/auth-v1-mask-dark.png';
    const lightImg = '/images/pages/auth-v1-mask-light.png';
    const authBackground = useImageVariant(mode, lightImg, darkImg);




    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            setAlert({ type: 'error', message: 'Passwords do not match' });
            return;
        }

        setIsLoading(true);
        setAlert({ type: '', message: '' });

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password, confirmPassword }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to reset password');
            }

            setAlert({
                type: 'success',
                message: 'Password reset successfully. Redirecting to login...'
            });

            setTimeout(() => {
                router.push('/login');
            }, 1000);
        } catch (error) {
            setAlert({
                type: 'error',
                message: 'Failed to reset password. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',

                }}
            >
                {/* Logo Positioned on Top */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',


                    }}
                >
                    <Logo />

                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            pt: 6, // Add padding to prevent overlap with the logo
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%',
                            textAlign: 'center',
                            position: 'relative',
                        }}
                    >
                        <img
                            src="https://static.vecteezy.com/system/resources/thumbnails/007/536/069/small_2x/password-reset-icon-for-apps-vector.jpg"
                            alt="Reset Password Icon"
                            style={{
                                marginBottom: '9px',
                                maxWidth: '100px',
                                height: 'auto',
                            }}
                        />

                        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                            Reset Password
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
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="New Password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleResetPassword}
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                position: 'relative',
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress
                                    size={24}
                                    sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-12px',
                                        marginLeft: '-12px',
                                    }}
                                />
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </Paper>
                </Box>
                <Illustrations maskImg={{ src: authBackground }} />
        </Container>
    );
};

export default ResetPassword;
