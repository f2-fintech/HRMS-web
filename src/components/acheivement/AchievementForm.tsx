'use client';

import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    Paper,
    Container,
    IconButton,
    InputAdornment,
    Stack,
    Alert,
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_APP_URL + '/achievements';

interface AchievementFormProps {
    id?: string;
    onSuccess: () => void;
}

const AchievementForm: React.FC<AchievementFormProps> = ({ id, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchAchievement(id);
        }
    }, [id]);

    const fetchAchievement = async (achievementId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/${achievementId}`);
            const data = await response.json();
            setTitle(data.title || '');
            setDescription(data.description || '');
        } catch (error) {
            console.error('Error fetching achievement:', error);
            setError('Failed to load achievement details');
        }
        setLoading(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('title', title || 'N/A');
        formData.append('description', description || 'N/A');
        if (file) formData.append('file', file);

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/${id}` : API_URL;

            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (response.ok) {
                onSuccess();
            } else {
                throw new Error('Failed to save achievement');
            }
        } catch (error) {
            console.error('Error saving achievement:', error);
            setError('Failed to save achievement. Please try again.');
        }
        setLoading(false);
    };

    const clearFile = () => {
        setFile(null);
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ mt: 4, p: 4, borderRadius: 2 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                        textAlign: 'center',
                        color: 'primary.main',
                        fontWeight: 600,
                        mb: 4
                    }}
                >
                    {id ? 'Update Achievement' : 'Create Achievement'}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                    <TextField
                        label="Achievement Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        variant="outlined"
                        fullWidth
                        required
                        disabled={loading}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                        label="Achievement Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        variant="outlined"
                        fullWidth
                        required
                        multiline
                        rows={4}
                        disabled={loading}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{
                                borderRadius: 2,
                                height: 56,
                                flexGrow: 1
                            }}
                            disabled={loading}
                        >
                            {file ? file.name : 'Upload File'}
                            <input
                                type="file"
                                onChange={handleFileChange}
                                hidden
                                accept="image/*,.pdf,.doc,.docx"
                            />
                        </Button>
                        {file && (
                            <IconButton onClick={clearFile} disabled={loading}>
                                <Close />
                            </IconButton>
                        )}
                    </Stack>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                            mt: 2,
                            height: 56,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem'
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} sx={{ color: 'white' }} />
                        ) : id ? (
                            'Update Achievement'
                        ) : (
                            'Create Achievement'
                        )}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default AchievementForm;
