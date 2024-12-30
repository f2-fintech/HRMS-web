import React, { useEffect, useState } from 'react';

import {
  TextField,
  Button,
  Box,
  Autocomplete,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  Label as LabelIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { CurrencyRupee } from '@mui/icons-material';
import { useDispatch } from 'react-redux';

import { toast, ToastContainer } from 'react-toastify';

import { apiResponse } from '@/utility/apiResponse/employeesResponse';
import type { AppDispatch } from '@/redux/store';
import { fetchFines } from '@/redux/features/fines/fineSlice';

import 'react-toastify/dist/ReactToastify.css';

interface FineFormProps {
  fine?: {
    _id: string;
    fineType: string;
    fineAmount: string;
    fineDate: string;
    employee: {
      _id: string;
      first_name: string;
      last_name: string;
    };
  };
  onClose: () => void;
  setToast?: (message: string) => void;
  month?: string;
  year?: string;
}

export default function FineForm({ fine, onClose, setToast, month, year }: FineFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [form, setForm] = useState({
    fineType: fine?.fineType || '',
    fineAmount: fine?.fineAmount || '',
    fineDate: fine?.fineDate || new Date().toISOString().split('T')[0],
    employeeId: fine?.employee?._id || '',
  });

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiResponse();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees');
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleEmployeeChange = (event: any, newValue: any) => {
    setForm((prevForm) => ({
      ...prevForm,
      employeeId: newValue?._id || '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      let token = null;
      const { company_id } = typeof window !== "undefined" && localStorage?.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : {};
      if (typeof window !== 'undefined') {
        token = localStorage?.getItem('token');
      }

      const fineData = {
        fineType: form.fineType,
        fineAmount: form.fineAmount,
        fineDate: form.fineDate,
        employee: form.employeeId,
        company_id: company_id
      };

      const method = fine ? 'PUT' : 'POST';

      const url = fine
        ? `${process.env.NEXT_PUBLIC_APP_URL}/fines/update/${fine._id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/fines/create`;

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fineData),
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            toast[data.message.includes('success') ? 'success' : 'error'](data.message, {
              position: 'top-center',
            });
          } else {
            toast.error('Unexpected error occurred', {
              position: 'top-center',
            });
          }

          dispatch(fetchFines({ page: 1, month, year, limit: 10, keyword: '' }));
          onClose();
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 500,
        margin: 'auto',
        boxShadow: 3,
        borderRadius: 2
      }}
    >
      <CardHeader
        avatar={fine ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
        title={
          <Typography variant="h6" color="primary">
            {fine ? 'Update Fine' : 'Create New Fine'}
          </Typography>
        }
        sx={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid rgba(0,0,0,0.12)'
        }}
      />
      <Divider />
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={employees}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
            value={employees.find((emp) => emp._id === form.employeeId) || null}
            onChange={handleEmployeeChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Employee"
                variant="outlined"
                margin="normal"
                fullWidth
                required
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Fine Type"
            name="fineType"
            value={form.fineType}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LabelIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Fine Amount"
            name="fineAmount"
            value={form.fineAmount}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupee color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Fine Date"
            name="fineDate"
            type="date"
            value={form.fineDate}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EventIcon color="action" />
                </InputAdornment>
              ),
            }}
            required
          />

          <Box display="flex" justifyContent="space-between" mt={2} gap={2}>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              startIcon={<SaveIcon />}
              sx={{
                backgroundColor: '#ff902f',
                '&:hover': {
                  backgroundColor: '#ff7f1a'
                }
              }}
            >
              {fine ? 'Update Fine' : 'Create Fine'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={onClose}
              startIcon={<CloseIcon />}
              color="secondary"
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </CardContent>
      <ToastContainer />
    </Card>
  );
}
