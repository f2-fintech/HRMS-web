'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import DeleteIcon from '@mui/icons-material/Delete'
import { useTheme } from '@mui/material/styles'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogContent,
  FormHelperText,
  Card,
  CardContent,
  CardActions,
  Stack,
  Pagination,
  Tooltip
} from '@mui/material'

import FileOpenIcon from '@mui/icons-material/FileOpen'
import { debounce } from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import { DriveFileRenameOutlineOutlined } from '@mui/icons-material'

import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch, RootState } from '@/redux/store'
import { fetchPolicies } from '@/redux/features/policies/policiesSlice'
import { utility } from '@/utility'

import ConfirmDelete from '@/app/(dashboard)/policy/ConfirmDelete'

interface Policy {
  _id: string;
  name: string;
  description: string;
  document_url: string;
  company_id: string;
}

interface AddPolicyFormProps {
  handleClose: () => void;
  policy: string | null;
}

interface PolicyCardProps {
  policy: Policy;
}

const PolicyGrid = () => {
  const dispatch: AppDispatch = useDispatch()
  const { policies, loading, error, filteredPolicies, total } = useSelector((state: RootState) => state.policies)
  const theme = useTheme()

  const [showForm, setShowForm] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  // State for the confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null)

  const debouncedFetch = useCallback(
    debounce(() => {
      dispatch(fetchPolicies({ page, limit, keyword: selectedKeyword }))
    }, 300),
    [page, limit, selectedKeyword]
  )

  useEffect(() => {
    debouncedFetch()

    return debouncedFetch.cancel
  }, [page, limit, selectedKeyword, debouncedFetch])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    setUserRole(user.role)
    setUserId(user.id)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedKeyword(e.target.value)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage)
    debouncedFetch()
  }

  const handlePolicyAddClick = () => {
    setSelectedPolicy(null)
    setShowForm(true)
  }

  const handlePolicyEditClick = (id: string) => {
    setSelectedPolicy(id)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
  }

  // Open delete confirmation dialog
  const handleDeleteClick = (id: string) => {
    setPolicyToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Confirm deletion
  const handleConfirmDelete = () => {
    if (policyToDelete) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/policies/delete/${policyToDelete}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          return response.json()
        })
        .then(data => {
          if (data.message && data.message.includes('success')) {
            toast.success(data.message, { position: 'top-center' })
            debouncedFetch() // Refresh the data grid
          } else {
            toast.error('Deletion failed: ' + (data.message || 'Unknown error'), { position: 'top-center' })
          }
        })
        .catch(error => {
          toast.error('Error: ' + error.message, { position: 'top-center' })
        })
    }

    setDeleteDialogOpen(false) // Close dialog after deletion
  }

  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setPolicyToDelete(null)
  }

  const PolicyCard = ({ policy }: PolicyCardProps) => {
    const [showDescription, setShowDescription] = useState(false);
    const theme = useTheme();
    const textColor = theme.palette.mode === 'dark' ? 'white' : '#333';
    const [isOverflowing, setIsOverflowing] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);

    const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(policy.document_url)}&embedded=true`;

    useEffect(() => {
      const checkOverflow = () => {
        const element = descriptionRef.current;

        if (element) {
          setIsOverflowing(element.scrollHeight > element.clientHeight);
        }
      };

      checkOverflow();
    }, [policy.description]);

    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
          },
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            p: 2,
            background: 'linear-gradient(to right, rgb(52, 76, 183), #6AB6F1)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 'bold', color: 'white' }}>
            {policy.name}
          </Typography>
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 3, backgroundColor: '#F9FAFB' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            ref={descriptionRef}
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: showDescription ? 'none' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
              color: 'black',
            }}
          >
            {policy.description}
          </Typography>
          {isOverflowing && (
            <Typography
              variant="body2"
              color="primary"
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 'bold',
              }}
              onClick={() => setShowDescription(!showDescription)}
            >
              {showDescription ? 'Read Less' : 'Read More'}
            </Typography>
          )}
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', backgroundColor: '#F1F5F9' }}>
          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={() => window.open(previewUrl, '_blank')}
              color="primary"
            >
              <FileOpenIcon />
            </IconButton>

            <IconButton
              onClick={() => {
                const link = document.createElement('a');

                link.href = policy.document_url;
                link.download = policy.document_url.split('/').pop() || 'document';
                link.click();
              }}
              color="primary"
            >
              <FileDownloadIcon />
            </IconButton>
          </Stack>

          {userRole === '1' && (
            <>
              <Tooltip title="Edit Policy" arrow>
                <IconButton
                  onClick={() => handlePolicyEditClick(policy._id)}
                  color="primary"
                >
                  <DriveFileRenameOutlineOutlined />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Policy" arrow>
                <IconButton
                  onClick={() => handleDeleteClick(policy._id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </CardActions>
      </Card>
    );
  };


  const AddPolicyForm = ({ handleClose, policy }: AddPolicyFormProps) => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage?.getItem("user") || '{}') : {};
    const company_id = user?.company_id;

    const [formData, setFormData] = useState({
      name: '',
      description: '',
      file: null as File | null,
      company_id: company_id
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
            file: null,
            company_id: selected.company_id
          });
        }
      }
    }, [policy, policies]);

    const validateForm = () => {
      let isValid = true

      const newErrors = {
        name: '',
        description: '',
        file: ''
      }

      if (!formData.name.trim()) {
        newErrors.name = 'Policy name is required'
        isValid = false
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required'
        isValid = false
      }

      if (!formData.file && !policy) {
        newErrors.file = 'File is required'
        isValid = false
      }

      setErrors(newErrors)

      return isValid
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, files } = e.target

      setFormData(prevState => ({
        ...prevState,
        [name]: files ? files[0] : value
      }))
    }

    const handleSubmit = () => {
      if (validateForm()) {
        const method = policy ? 'PUT' : 'POST'

        const url = policy
          ? `${process.env.NEXT_PUBLIC_APP_URL}/policies/update/${policy}`
          : `${process.env.NEXT_PUBLIC_APP_URL}/policies/create`

        const formPayload = new FormData()

        formPayload.append('name', formData.name)
        formPayload.append('description', formData.description)

        if (formData.file) {
          formPayload.append('file', formData.file)
        }

        formPayload.append('company_id', formData.company_id)

        fetch(url, {
          method,
          body: formPayload
        })
          .then(response => response.json())
          .then(data => {
            if (data.message) {
              if (data.message.includes('success')) {
                toast.success(data.message, {
                  position: 'top-center'
                })
              } else {
                toast.error('Error: ' + data.message, {
                  position: 'top-center'
                })
              }
            } else {
              toast.error('Unexpected error occurred', {
                position: 'top-center'
              })
            }

            handleClose()
            debouncedFetch()
          })
          .catch(error => {
            console.error('Error:', error)
            toast.error('Failed to process request', {
              position: 'top-center'
            })
          })
      }
    }

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
              onChange={e => capitalizeInput(e, handleChange)}
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
              onChange={e => {
                const { name, value } = e.target
                const [firstWord, ...rest] = value.split(' ')
                const capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
                const capitalizedValue = [capitalizedFirstWord, ...rest].join(' ')

                handleChange({ target: { name, value: capitalizedValue } } as React.ChangeEvent<HTMLInputElement>)
              }}
              required
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant='contained' component='label'>
              Upload Document
              <input
                type='file'
                name='file'
                hidden
                onChange={handleChange}
                required={!policy}
              />
            </Button>
            {errors.file && <FormHelperText error>{errors.file}</FormHelperText>}
          </Grid>

          <Grid item xs={12}>
            <Button variant='contained' color='primary' onClick={handleSubmit}>
              {policy ? 'Update' : 'Add'} Policy
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };


  return (
    <Box>
      <ToastContainer />
      <Box sx={{ flexGrow: 1, padding: 2 }}>
        <Dialog open={showForm} onClose={handleClose} fullWidth maxWidth='md'>
          <DialogContent>
            <AddPolicyForm policy={selectedPolicy} handleClose={handleClose} />
          </DialogContent>
        </Dialog>

        <ConfirmDelete
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />

        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Box>
            <Typography style={{ fontSize: '2em' }} variant='h5' gutterBottom>
              Policy
            </Typography>
            <Typography style={{ fontSize: '1em', fontWeight: 'bold' }} variant='subtitle1' gutterBottom>
              Dashboard / Policy
            </Typography>
          </Box>
          {userRole === '1' && (
            <Button
              style={{ borderRadius: 50, backgroundColor: '#ff902f' }}
              variant='contained'
              color='warning'
              startIcon={<AddIcon />}
              onClick={handlePolicyAddClick}
            >
              Add Policy
            </Button>
          )}
        </Box>

        <TextField
          fullWidth
          label='Search Policies'
          variant='outlined'
          value={selectedKeyword}
          onChange={handleInputChange}
          sx={{ mb: 4 }}
          InputProps={{
            sx: { borderRadius: '50px' },
            endAdornment: (
              <InputAdornment position='end'>
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />

        <Grid container spacing={3}>
          {(filteredPolicies?.length > 0 ? filteredPolicies : policies).map((policy) => (
            <Grid item xs={12} sm={6} md={4} key={policy._id}>
              <PolicyCard policy={policy} />
            </Grid>
          ))}
        </Grid>

        {!loading && (filteredPolicies?.length > 0 || policies.length > 0) && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: theme.palette.mode === 'dark' ? 'white' : undefined,
                }
              }}
            />
          </Box>
        )}

        {!loading && filteredPolicies?.length === 0 && policies.length === 0 && (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="text.secondary">
              No policies found
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default PolicyGrid;


