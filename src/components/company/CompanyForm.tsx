import React, { useState, useEffect } from 'react';

import { Box, Grid, TextField, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify'; // Assuming you're using react-toastify for notifications

import { utility } from '@/utility';

const AddCompanyForm = ({ handleClose, company, companies, debouncedFetch }) => {
    const { capitalizeInput } = utility();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        website: '',
    });

    const [errors, setErrors] = useState({
        name: '',
        address: '',
        website: '',
    });

    useEffect(() => {
        if (company) {
            const selected = companies.find(h => h._id === company);

            if (selected) {
                setFormData({
                    name: selected.name,
                    address: selected.address,
                    website: selected.website,
                });
            }
        }
    }, [company, companies]);

    const validateForm = () => {
        let isValid = true;

        const newErrors = {
            name: '',
            address: '',
            website: '',
        };

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
            isValid = false;
        }

        setErrors(newErrors);

        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prevState => {
            const updatedFormData = {
                ...prevState,
                [name]: value
            };

            return updatedFormData;
        });
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const method = company ? 'PUT' : 'POST';
            const url = company ? `${process.env.NEXT_PUBLIC_APP_URL}/company/update/${company}` : `${process.env.NEXT_PUBLIC_APP_URL}/company/create`;

            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        if (data.message.includes('success')) {
                            toast.success(data.message, { position: 'top-center' });
                        } else {
                            toast.error('Error: ' + data.message, { position: 'top-center' });
                        }
                    } else {
                        toast.error('Unexpected error occurred', { position: 'top-center' });
                    }

                    handleClose();
                    debouncedFetch();
                })
                .catch(error => {
                    toast.error('Error: ' + error.message, { position: 'top-center' });
                });
        }
    };

    return (
        <Box sx={{ flexGrow: 1, padding: 2 }}>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
                    {company ? 'Edit Company' : 'Add Company'}
                </Typography>
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Name'
                        name='name'
                        value={formData.name}
                        onChange={(e) => capitalizeInput(e, handleChange)}
                        required
                        error={!!errors.name}
                        helperText={errors.name}
                        FormHelperTextProps={{ style: { color: 'red' } }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Address'
                        name='address'
                        value={formData.address}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        required
                        error={!!errors.address}
                        helperText={errors.address}
                        FormHelperTextProps={{ style: { color: 'red' } }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Website'
                        name='website'
                        value={formData.website}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        style={{
                            fontSize: '18px',
                            fontWeight: 600,
                            color: 'white',
                            padding: 15,
                            backgroundColor: '#ff902f',
                            width: 200,
                        }}
                        variant='contained'
                        fullWidth
                        onClick={handleSubmit}
                    >
                        {company ? 'UPDATE COMPANY' : 'ADD COMPANY'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AddCompanyForm;
