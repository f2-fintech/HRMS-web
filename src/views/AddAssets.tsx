'use client'

import React, { useCallback, useEffect, useState } from 'react';

import { debounce } from 'lodash';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import {
  Button,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogContent,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Description, DriveFileRenameOutlineOutlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';

import type { AppDispatch, RootState } from '@/redux/store';
import { fetchAddAssets } from '@/redux/features/addAssets/addAssetsSlice';
import 'react-toastify/dist/ReactToastify.css';
import LocationDropdown from '@/utility/locationdropdown/LocationDropdown';

export default function AddAssets() {
  const dispatch: AppDispatch = useDispatch();
  const { addassets, loading, error, filteredaddassets, total } = useSelector((state: RootState) => state.addAssets);
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);


  console.log('asset>', addassets)

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchAddAssets({ page, limit, keyword: selectedKeyword }));
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

  function AddAssetForm({ handleClose, asset }) {
    const [formData, setFormData] = useState({
      assetName: '',
      category: '',
      description: '',
      model: '',
      serialNo: '',
      uniqueCode: '',
      type: '',
      location: '',
      attachment: '',
    });

    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [errors, setErrors] = useState({
      assetName: '',
      category: '',
      description: '',
      model: '',
      serialNo: '',
      uniqueCode: '',
      type: '',
      location: '',
      attachment: '',
    });

    useEffect(() => {
      if (asset) {
        const selected = addassets.find(a => a._id === asset);

        if (selected) {
          setFormData({
            assetName: selected.assetName,
            category: selected.category,
            description: selected.description,
            model: selected.model,
            serialNo: selected.serialNo,
            uniqueCode: selected.uniqueCode,
            type: selected.type,
            location: selected.location,
            attachment: selected.attachment,
          });
          setImagePreviewUrl(selected.attachment);
        }
      }
    }, [asset, addassets]);

    const validateForm = () => {
      let isValid = true;

      const newErrors = {
        assetName: '',
        category: '',
        description: '',
        model: '',
        serialNo: '',
        uniqueCode: '',
        type: '',
        location: '',
        attachment: '',
      };

      if (!formData.assetName.trim()) {
        newErrors.assetName = 'Item name is required';
        isValid = false;
      }

      if (!formData.category.trim()) {
        newErrors.category = 'Category is required';
        isValid = false;
      }

      if (!formData.model.trim()) {
        newErrors.model = 'Model is required';
        isValid = false;
      }

      if (!formData.serialNo.trim()) {
        newErrors.serialNo = 'Serial number is required';
        isValid = false;
      }

      if (!formData.uniqueCode.trim()) {
        newErrors.uniqueCode = 'Unique code is required';
        isValid = false;
      }

      if (!formData.type.trim()) {
        newErrors.type = 'Type is required';
        isValid = false;
      }

      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
        isValid = false;
      }

      setErrors(newErrors);

      return isValid;
    };

    const handleImageChange = (e) => {
      const file = e.target.files[0];

      if (file) {
        if (file.size > 5 * 1024 * 1024) { // Check if the image is larger than 5MB
          setErrors(prevErrors => ({
            ...prevErrors,
            attachment: 'Image must be less than 5MB'
          }));
        } else {
          setSelectedImage(file);
          setImagePreviewUrl(URL.createObjectURL(file));
          setErrors(prevErrors => ({
            ...prevErrors,
            attachment: ''
          }));
        }
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;

      console.log("name", name, "value", value)

      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    };

    console.log("formdata", formData)

    const handleSubmit = () => {
      if (validateForm()) {
        const method = asset ? 'PUT' : 'POST';
        const url = asset ? `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/update/${asset}` : `${process.env.NEXT_PUBLIC_APP_URL}/add-assets/create`;

        const formPayload = new FormData();

        formPayload.append('assetName', formData.assetName);
        formPayload.append('category', formData.category);
        formPayload.append('description', formData.description);
        formPayload.append('model', formData.model);
        formPayload.append('serialNo', formData.serialNo);
        formPayload.append('uniqueCode', formData.uniqueCode);
        formPayload.append('type', formData.type);
        formPayload.append('location', formData.location);

        if (selectedImage) {
          formPayload.append('attachment', selectedImage);
        }

        console.log([...formPayload.entries()]);

        fetch(url, {
          method,
          body: formPayload,
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }


            return response.json();
          })
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
            toast.error('Error: ' + error.message, {
              position: 'top-center',
            });
          });
      }
    };




    return (
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
            {asset ? 'Edit Item' : 'Add Item'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Item Name'
              name='assetName'
              value={formData.assetName}
              onChange={handleChange}
              required
              error={!!errors.assetName}
              helperText={errors.assetName}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label='Category'
              name='category'
              value={formData.category}
              onChange={handleChange}
              required
              error={!!errors.category}
              helperText={errors.category}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            >
              <MenuItem value="IT Equipments">IT Equipments</MenuItem>
              <MenuItem value="Marketing Equipments">Marketing Equipments</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Description'
              name='description'
              value={formData.description}
              onChange={handleChange}
              required
              error={!!errors.description}
              helperText={errors.description}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Model'
              name='model'
              value={formData.model}
              onChange={handleChange}
              required
              error={!!errors.model}
              helperText={errors.model}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Serial Number'
              name='serialNo'
              value={formData.serialNo}
              onChange={handleChange}
              required
              error={!!errors.serialNo}
              helperText={errors.serialNo}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label='Unique Code'
              name='uniqueCode'
              value={formData.uniqueCode}
              onChange={handleChange}
              required
              error={!!errors.uniqueCode}
              helperText={errors.uniqueCode}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label='Type'
              name='type'
              value={formData.type}
              onChange={handleChange}
              required
              error={!!errors.type}
              helperText={errors.type}
              FormHelperTextProps={{
                style: { color: 'red' }
              }}
            >
              <MenuItem value="Own">Own</MenuItem>
              <MenuItem value="Rented">Rented</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.location}>
              <InputLabel id="demo-simple-select-label">Select Location</InputLabel>
              <LocationDropdown
                selectedLocation={formData.location}
                setSelectedLocation={(location) =>
                  setFormData((prevData) => ({
                    ...prevData,
                    location, // Update the location in formData state
                  }))
                }
              />
              {errors.location && <Typography color="error">{errors.location}</Typography>}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" flexDirection="column">
              <Button
                variant="contained"
                component="label"
              >
                Upload Attachment
                <input
                  type="file"
                  hidden
                  accept='image/*'
                  onChange={handleImageChange}
                />
              </Button>
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt='Preview'
                  style={{ maxHeight: '100%', marginTop: '10px' }}
                />
              )}
              {errors.attachment && (
                <Typography variant="body2" color="error">
                  {errors.attachment}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Button
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'white',
                padding: 15,
                backgroundColor: '#ff902f',
                width: 200
              }}
              variant='contained'
              fullWidth
              onClick={handleSubmit}
            >
              {asset ? 'UPDATE Inventory' : 'ADD Inventory'}
            </Button>
          </Grid>


        </Grid>
      </Box>
    );
  }

  const handleAssetAddClick = () => {
    setSelectedAsset(null);
    setShowForm(true);
  };

  const handleAssetEditClick = (id) => {
    setSelectedAsset(id);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
  };

  const columns: GridColDef[] = [
    {
      sortable: true,
      field: 'lineNo',
      headerName: '#',
      headerClassName: 'super-app-theme--header',
      flex: 0,
      editable: false,
      renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
    },
    { field: 'assetName', headerName: 'Item Name', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    { field: 'category', headerName: 'Category', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    { field: 'model', headerName: 'Model', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    { field: 'serialNo', headerName: 'Serial Number', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    { field: 'uniqueCode', headerName: 'Unique Code', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    { field: 'type', headerName: 'Type', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    { field: 'location', headerName: 'Location', headerClassName: 'super-app-theme--header', width: 150, headerAlign: 'center', align: 'center', sortable: false },
    ...(userRole === '1'
      ? [
        {
          field: 'edit',
          headerName: 'Edit',
          sortable: false,
          headerAlign: 'center',
          width: 160,
          headerClassName: 'super-app-theme--header',
          renderCell: ({ row: { _id } }) => (
            <Box width="85%" m="0 auto" p="5px" display="flex" justifyContent="space-around">
              <Button color="info" variant="contained" sx={{ minWidth: '50px' }} onClick={() => handleAssetEditClick(_id)}>
                <DriveFileRenameOutlineOutlined />
              </Button>
            </Box>
          ),
        },
      ]
      : []),
  ];


  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth="md">
          <DialogContent>
            <AddAssetForm asset={selectedAsset} handleClose={handleClose} />
          </DialogContent>
        </Dialog>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant="h5" gutterBottom>
              Inventory
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant="subtitle1" gutterBottom>
              Dashboard / Inventory
            </Typography>
          </Box>
          {userRole === '1' && (
            <Box display="flex" alignItems="center">
              <Button
                style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
                variant="contained"
                color="warning"
                startIcon={<AddIcon />}
                onClick={handleAssetAddClick}
              >
                Add Item
              </Button>
            </Box>
          )}
        </Box>
        <Grid container spacing={6} alignItems="center" mb={2}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="search" variant="outlined" value={selectedKeyword} onChange={handleInputChange} />
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          sx={{
            '& .super-app-theme--header': {
              fontSize: 17,
              fontWeight: 600,
              alignItems: 'center',
            },
            '& .mui-yrdy0g-MuiDataGrid-columnHeaderRow ': {
              background: 'linear-gradient(270deg, var(--mui-palette-primary-main), #2c3ce3 100%) !important',
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
          components={{
            Toolbar: GridToolbar,
          }}
          rows={filteredaddassets.length > 0 ? filteredaddassets : addassets}
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
