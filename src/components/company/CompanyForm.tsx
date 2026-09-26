import React, { useState, useEffect } from 'react';

import { Box, Grid, TextField, Typography, IconButton, Button, MenuItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify'; // Assuming you're using react-toastify for notifications

import { utility } from '@/utility';

const AddCompanyForm = ({ handleClose, company, companies, debouncedFetch }) => {
    const { capitalizeInput } = utility();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        alternateNumber: '',
        billingAddress: '',
        gst: '',
        subscriptionType: '',
        trialDuration: '',
        date: '',
        status: '',
        website: '',
    });

    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        billingAddress: '',
        gst: '',
    });

    useEffect(() => {
        if (company) {
            const selected = companies.find(h => h._id === company);

            if (selected) {
                setFormData({
                    name: selected.name,
                    email: selected.email || '',
                    phone: selected.phone || '',
                    alternateNumber: selected.alternateNumber || '',
                    billingAddress: selected.billingAddress || '',
                    gst: selected.gst || '',
                    subscriptionType: selected.subscriptionType || '',
                    trialDuration: selected.trialDuration || '',
                    date: selected.date || '',
                    status: selected.status || '',
                    website: selected.website,
                });
            }
        }
    }, [company, companies]);

    const validateForm = () => {
        let isValid = true;

        const newErrors = {
            name: '',
            email: '',
            phone: '',
            address: '',
            billingAddress: '',
            gst: '',
        };

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
            isValid = false;
        }

        if (!formData.email.trim() || !/^[\w-.]+@[\w-]+\.[a-z]{2,}$/i.test(formData.email)) {
            newErrors.email = 'Valid email is required';
            isValid = false;
        }

        if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Valid phone number is required';
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
                        label='Email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                        FormHelperTextProps={{ style: { color: 'red' } }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Phone'
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        error={!!errors.phone}
                        helperText={errors.phone}
                        FormHelperTextProps={{ style: { color: 'red' } }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Alternate Number'
                        name='alternateNumber'
                        value={formData.alternateNumber}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Billing Address'
                        name='billingAddress'
                        value={formData.billingAddress}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='GST'
                        name='gst'
                        value={formData.gst}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label='Subscription Type'
                        name='subscriptionType'
                        value={formData.subscriptionType}
                        onChange={handleChange}
                    >
                        {['Monthly', 'Quarterly', 'Half-Yearly', 'Annually', 'Trial'].map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                {formData.subscriptionType !== 'Trial' &&
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Trial Duration'
                            name='trialDuration'
                            value={formData.trialDuration}
                            onChange={handleChange}
                            disabled={formData.subscriptionType !== 'Trial'}
                        />
                    </Grid>
                }
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Date'
                        name='date'
                        type='date'
                        value={formData.date}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        select
                        label='Status'
                        name='status'
                        value={formData.status}
                        onChange={handleChange}
                    >
                        {['Active', 'Inactive', 'On-Hold'].map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label='Website'
                        name='website'
                        value={formData.website}
                        onChange={handleChange}
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
