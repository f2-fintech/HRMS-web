'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchPages, deletePage } from '@/redux/features/pages/pagesSlice';
import Loader from '@/components/loader/loader';
import useDebounce from '@/utility/debounce/useDebounce';

export default function PagesView() {
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch();
  const { pages, total, loading, error } = useSelector((state: RootState) => state.pages);

  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    setUserId(user.id);
  }, []);

  useEffect(() => {
    dispatch(
      fetchPages({
        page,
        limit: 12,
        search: debouncedSearchTerm,
      })
    );
  }, [dispatch, page, debouncedSearchTerm]);

  const handleCreatePage = () => {
    router.push('/pages/new');
  };

  const handleEditPage = (pageId: string) => {
    router.push(`/pages/${pageId}`);
  };

  const handleDeleteClick = (pageId: string) => {
    setPageToDelete(pageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (pageToDelete) {
      try {
        await dispatch(deletePage(pageToDelete)).unwrap();
        toast.success('Page deleted successfully');
        setDeleteDialogOpen(false);
        setPageToDelete(null);
      } catch (err) {
        toast.error('Failed to delete page');
      }
    }
  };

  const handleShareClick = (pageId: string) => {
    router.push(`/pages/${pageId}?share=true`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isAdmin = userRole === '1';

  return (
    <Box sx={{ padding: 3 }}>
      <ToastContainer />

      {/* Header */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              Pages
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Dashboard / Pages
            </Typography>
          </Grid>

          {isAdmin && (
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreatePage}
                sx={{
                  borderRadius: 100,
                  padding: '10px 20px',
                }}
              >
                Create Page
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Loading State */}
      {loading && <Loader />}

      {/* Error State */}
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Pages Grid */}
      {!loading && pages.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <ArticleIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No pages found' : 'No pages yet'}
          </Typography>
          {isAdmin && !searchTerm && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreatePage}
              sx={{ mt: 2 }}
            >
              Create Your First Page
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pages.map((pageItem) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={pageItem._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => handleEditPage(pageItem._id)}
              >
                {/* Cover Image */}
                {pageItem.cover_image ? (
                  <Box
                    sx={{
                      height: 120,
                      backgroundImage: `url(${pageItem.cover_image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 120,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Icon + Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {pageItem.icon ? (
                      <Typography variant="h4" sx={{ mr: 1 }}>
                        {pageItem.icon}
                      </Typography>
                    ) : (
                      <ArticleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {pageItem.title}
                    </Typography>
                  </Box>

                  {/* Metadata */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Created {formatDate(pageItem.createdAt)}
                  </Typography>

                  {/* Shared With Count */}
                  {pageItem.shared_with && pageItem.shared_with.length > 0 && (
                    <Chip
                      size="small"
                      label={`Shared with ${pageItem.shared_with.length} ${
                        pageItem.shared_with.length === 1 ? 'person' : 'people'
                      }`}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>

                {/* Actions (Admin Only) */}
                {isAdmin && (
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Share">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareClick(pageItem._id);
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPage(pageItem._id);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(pageItem._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Page</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this page? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
