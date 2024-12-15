import React, { useEffect, useState } from 'react';

import { TextField, Button, MenuItem, Box, Autocomplete } from '@mui/material';
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

}

export default function FineForm({ fine, onClose, setToast, month, year }: FineFormProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [form, setForm] = useState({
    fineType: fine?.fineType || '',
    fineAmount: fine?.fineAmount || '',
    fineDate: fine?.fineDate || new Date().toISOString().split('T')[0], // Set default to current date
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

      if (typeof window !== 'undefined') {
        token = localStorage?.getItem('token');
      }

      const fineData = {
        fineType: form.fineType,
        fineAmount: form.fineAmount,
        fineDate: form.fineDate,
        employee: form.employeeId,
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
    <>
      <Box component="form" onSubmit={handleSubmit}>
        <Autocomplete
          options={employees}
          getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
          value={employees.find((emp) => emp._id === form.employeeId) || null}
          onChange={handleEmployeeChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Employee"
              margin="normal"
              fullWidth
              required
            />
          )}
        />
        <TextField
          label="Fine Type"
          name="fineType"
          value={form.fineType}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Fine Amount"
          name="fineAmount"
          value={form.fineAmount}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Fine Date"
          name="fineDate"
          type="date"
          value={form.fineDate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          required
        />

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button variant="contained" type="submit" sx={{ backgroundColor: '#ff902f' }}>
            {fine ? 'Update Fine' : 'Create Fine'}
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </Box>
    </>
  );

}
