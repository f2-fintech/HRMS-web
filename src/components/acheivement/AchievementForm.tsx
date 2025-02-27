'use client'
import React, { useState, useEffect } from 'react'

import { TextField, Button, Box, Typography, CircularProgress } from '@mui/material'
import { useSettings } from '@/@core/hooks/useSettings' // Import the useSettings hook

const API_URL = process.env.NEXT_PUBLIC_APP_URL + '/achievements'

interface AchievementFormProps {
    id?: string
    onSuccess: () => void
    onClose: () => void // New prop for closing the form
}

const AchievementForm: React.FC<AchievementFormProps> = ({ id, onSuccess, onClose }) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const { settings } = useSettings() // Access dark/light mode settings

    useEffect(() => {
        if (id) {
            fetchAchievement(id)
        }
    }, [id])

    const fetchAchievement = async (achievementId: string) => {
        setLoading(true)

        try {
            const response = await fetch(`${API_URL}/${achievementId}`)
            const data = await response.json()

            setTitle(data?.title || '')
            setDescription(data?.description || '')
        } catch (error) {
            console.error('Error fetching achievement:', error)
        }

        setLoading(false)
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setFile(event.target.files[0])
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData()

        formData.append('title', title || 'N/A')
        formData.append('description', description || 'N/A')
        if (file) formData.append('file', file)

        try {
            const method = id ? 'PUT' : 'POST'
            const url = id ? `${API_URL}/${id}` : API_URL

            const response = await fetch(url, {
                method,
                body: formData
            })

            if (response.ok) {
                onSuccess()
                onClose() // Close the form after successful save
            } else {
                console.error('Failed to save achievement:', await response.text())
            }
        } catch (error) {
            console.error('Error saving achievement:', error)
        }

        setLoading(false)
    }

    return (
        <Box
            component='form'
            onSubmit={handleSubmit}
            sx={{
                maxWidth: 500,
                mx: 'auto',
                p: 2,
                backgroundColor: settings.mode === 'dark' ? '#333' : '#fff', // Dynamic background color based on mode
                borderRadius: 2,
                boxShadow: 3,
                color: settings.mode === 'dark' ? '#fff' : '#000' // Dynamic text color based on mode
            }}
        >
            <Typography variant='h6' fontWeight='bold'>
                {id ? 'Update Achievement' : 'Create Achievement'}
            </Typography>
            {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}

            <TextField
                label='Title'
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
                margin='normal'
                sx={{
                    backgroundColor: settings.mode === 'dark' ? '#555' : '#fff', // Dynamic background for input fields
                    color: settings.mode === 'dark' ? '#fff' : '#000' // Dynamic text color in input fields
                }}
            />

            <textarea
                placeholder='Description'
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                    width: '100%',
                    height: '100px',
                    padding: '10px',
                    borderRadius: '5px',
                    border: settings.mode === 'dark' ? '1px solid #555' : '1px solid #ccc', // Dynamic border color
                    marginTop: '10px',
                    fontSize: '16px',
                    resize: 'vertical',
                    backgroundColor: settings.mode === 'dark' ? '#555' : '#fff', // Dynamic background
                    color: settings.mode === 'dark' ? '#fff' : '#000' // Dynamic text color
                }}
            />

            <input type='file' onChange={handleFileChange} style={{ marginTop: '10px' }} />

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button type='submit' variant='contained' color='primary' fullWidth>
                    {id ? 'Update' : 'Create'}
                </Button>
                <Button variant='outlined' color='secondary' fullWidth onClick={onClose}>
                    Close
                </Button>
            </Box>
        </Box>
    )
}

export default AchievementForm
