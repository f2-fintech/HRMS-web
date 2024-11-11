
'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { debounce } from 'lodash';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import type { GridColDef } from '@mui/x-data-grid';
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import {
  Button,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'

import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '@/redux/store';
import { fetchPolicies } from '@/redux/features/policies/policiesSlice';
import { utility } from '@/utility';


export default function PolicyGrid() {
  const dispatch: AppDispatch = useDispatch()
  const { policies, loading, error, filteredPolicies, total } = useSelector((state: RootState) => state.policies)

  const [showForm, setShowForm] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchPolicies({ page, limit, keyword: selectedKeyword }));
    }, 300),
    [page, limit, selectedKeyword]
  );

  useEffect(() => {
    debouncedFetch();

    return debouncedFetch.cancel;
  }, [page, limit, selectedKeyword, debouncedFetch]);

  const handleInputChange = (e) => {
    setSelectedKeyword(e.target.value);
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage + 1);
    setLimit(newPageSize);
  };

  const handlePaginationModelChange = (params: { page: number; pageSize: number }) => {
    handlePageChange(params.page, params.pageSize);
    debouncedFetch();
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || '{}');

    setUserRole(user.role);
    setUserId(user.id);
  }, []);

  function AddPolicyForm({ handleClose, policy }) {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      file: null
    });
    const { capitalizeInput } = utility();

    const [errors, setErrors] = useState({
      name: '',
      description: '',
      file: ''
    });

    useEffect(() => {
      if (policy) {
        const selected = policies.find(p => p._id === policy)
        if (selected) {
          setFormData({
            name: selected.name,
            description: selected.description,
            file: null
          });
        }
      }
    }, [policy, policies]);

    const validateForm = () => {
      let isValid = true;
      const newErrors = {
        name: '',
        description: '',
        file: ''
      };

      if (!formData.name.trim()) {
        newErrors.name = 'Policy name is required';
        isValid = false;
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
        isValid = false;
      }

      if (!formData.file && !policy) {
        newErrors.file = 'File is required';
        isValid = false;
      }

      setErrors(newErrors);

      return isValid;
    };

    const handleChange = (e) => {
      const { name, value, files } = e.target;
      setFormData(prevState => ({
        ...prevState,
        [name]: files ? files[0] : value
      }));
    };

    const handleSubmit = () => {
      if (validateForm()) {
        const method = policy ? 'PUT' : 'POST';
        const url = policy ? `${process.env.NEXT_PUBLIC_APP_URL}/policies/update/${policy}` : `${process.env.NEXT_PUBLIC_APP_URL}/policies/create`;

        const formPayload = new FormData();
        formPayload.append('name', formData.name);
        formPayload.append('description', formData.description);
        if (formData.file) {
          formPayload.append('file', formData.file);
        }

        fetch(url, {
          method,
          body: formPayload,
        })
          .then(response => response.json())
          .then(data => {
            if (data.message) {
              if (data.message.includes('success')) {
                toast.success(data.message, {
                  position: 'top-center',
                });
              } else {
                toast.error('Error: ' + data.message, {
                  position: 'top-center',
                });
              }
            } else {
              toast.error('Unexpected error occurred', {
                position: 'top-center',
              });
            }
            handleClose();
            debouncedFetch();
          })
          .catch(error => {
            console.log('Error', error);
          });
      }
    };

    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
            {policy ? 'Edit Policy' : 'Add Policy'}
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
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Description'
              name='description'
              value={formData.description}
              onChange={(e) => {
                const { name, value } = e.target;
                const [firstWord, ...rest] = value.split(' ');
                const capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
                const capitalizedValue = [capitalizedFirstWord, ...rest].join(' ');
                handleChange({ target: { name, value: capitalizedValue } });
              }}

              required
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant='contained' component='label'>
              upload document
              <input
                type="file"
                name="file"
                hidden
                onChange={handleChange}
                required={!policy}
                style={{ marginTop: '16px' }}
              />
            </Button>
            {errors.file && (
              <FormHelperText error>{errors.file}</FormHelperText>
            )}
          </Grid>

          <Grid item xs={12}>
            <Button variant='contained' color='primary' onClick={handleSubmit}>
              {policy ? 'Update' : 'Add'} Policy
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }


  const handlePolicyAddClick = () => {
    setSelectedPolicy(null)
    setShowForm(true)
  }

  const handlePolicyEditClick = (id) => {
    setSelectedPolicy(id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', headerClassName: 'super-app-theme--header', flex: 1, headerAlign: 'center', align: 'center', sortable: false },
    {
      field: 'document_url',
      headerName: 'Open Document',
      headerClassName: 'super-app-theme--header',
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => {
        const documentUrl = params.value;
        const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;

        return (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              window.open(previewUrl, '_blank');
            }}
          >
            Open
          </Button>
        );
      }

    },
    {
      field: 'download',
      headerName: 'Download Document',
      headerClassName: 'super-app-theme--header',
      flex: 1.5,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => {
        const documentUrl = params.row.document_url;

        return (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const link = document.createElement('a');
              link.href = documentUrl;
              link.download = documentUrl.split('/').pop(); // Extract filename from URL
              link.click();
            }}
          >
            Download
          </Button>
        );
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      headerClassName: 'super-app-theme--header',
      flex: 2.5,
      headerAlign: 'center',
      // align: 'center',
      renderCell: (params) => {
        const description = params.row?.description || 'No description available';

        return (
          <Box>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  View Description
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  {description}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        );
      },
    },


    ...(userRole === '1' ? [{
      field: 'edit',
      headerName: 'Edit',
      sortable: false,
      headerAlign: 'center',
      flex: 0.5,
      headerClassName: 'super-app-theme--header',
      renderCell: ({ row: { _id } }) => (
        <Box width="85%" m="0 auto" p="5px" display="flex" justifyContent="space-around">
          <Button color="info" variant="contained" sx={{ minWidth: "50px" }} onClick={() => handlePolicyEditClick(_id)}>
            <DriveFileRenameOutlineOutlined />
          </Button>
        </Box>
      ),
    }] : [])
  ];

  return (

    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddPolicyForm policy={selectedPolicy} handleClose={handleClose} />
          </DialogContent>
        </Dialog>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Policy
            </Typography>
            <Typography
              style={{ fontSize: '1em', fontWeight: 'bold' }}
              variant='subtitle1'
              gutterBottom
            >
              Dashboard / Policy
            </Typography>
          </Box>
          {userRole === "1" && <Box display='flex' alignItems='center'>
            <Button
              style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
              variant='contained'
              color='warning'
              startIcon={<AddIcon />}
              onClick={handlePolicyAddClick}

            >
              Add Policy
            </Button>
          </Box>}
        </Box>
        <Grid container spacing={6} alignItems='center' mb={2}>

          <Grid item xs={12} md={6}>
            <TextField fullWidth label="search" variant='outlined' value={selectedKeyword} onChange={handleInputChange} InputProps={{
              sx: {
                borderRadius: "50px",
              },
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }} />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          getRowHeight={() => 'auto'}
          sx={{
            '& .super-app-theme--header': {
              fontSize: 17,
              fontWeight: 600,
              alignItems: 'center',
            },
            '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
              background: '#2c3ce3 !important',
              color: 'white',
            },
            '& .MuiDataGrid-cell': {
              fontSize: '10',
              align: 'center',
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(odd)': {
                backgroundColor: 'rgb(46 38 61 / 12%)',
              },
              '&:nth-of-type(even)': {
                backgroundColor: '#fffff',
              },
              fontWeight: '600',
              fontSize: '14px',
              boxSizing: 'border-box',
            },
          }}
          rows={filteredPolicies?.length > 0 ? filteredPolicies : policies}
          columns={columns}
          getRowId={(row) => row._id}
          paginationMode="server"
          rowCount={total}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 20, 30]}
          paginationModel={{ page: page - 1, pageSize: limit }}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
}
