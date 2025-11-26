'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  Fade,
  Skeleton,
  Paper,
  Stack,
  Divider,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Article as ArticleIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  MoreVert as MoreIcon,
  ContentCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  AccessTime as RecentIcon,
  AccessTime,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  SubdirectoryArrowRight as SubdirectoryIcon,
  AccountTree as TreeViewIcon,
} from '@mui/icons-material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchPages, deletePage, fetchPageTree } from '@/redux/features/pages/pagesSlice';
import Loader from '@/components/loader/loader';
import useDebounce from '@/utility/debounce/useDebounce';

// Interface for Page with children
interface PageNode {
  _id: string;
  title: string;
  icon?: string;
  cover_image?: string;
  shared_with?: string[];
  parent_id?: string | null;
  depth?: number;
  createdAt: string;
  updatedAt: string;
  children?: PageNode[];
}

export default function PagesView() {
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch();
  const { pages, pageTree, total, loading, error } = useSelector((state: RootState) => state.pages);

  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'tree'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'oldest'>('recent');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const itemsPerPage = 12;

  const isAdmin = userRole === '1';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    setUserId(user.id);
    // Set default view mode based on role
    if (user.role === '1') {
      setViewMode('tree');
    }
  }, []);

  useEffect(() => {
    if (isAdmin && viewMode === 'tree') {
      // Fetch tree structure for admin
      dispatch(fetchPageTree());
    } else {
      dispatch(
        fetchPages({
          page,
          limit: itemsPerPage,
          search: debouncedSearchTerm,
        })
      );
    }
  }, [dispatch, page, debouncedSearchTerm, isAdmin, viewMode]);

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Expand all nodes
  const expandAllNodes = useCallback(() => {
    const getAllNodeIds = (nodes: PageNode[]): string[] => {
      return nodes.reduce<string[]>((acc, node) => {
        acc.push(node._id);
        if (node.children && node.children.length > 0) {
          acc.push(...getAllNodeIds(node.children));
        }
        return acc;
      }, []);
    };
    setExpandedNodes(new Set(getAllNodeIds(pageTree)));
  }, [pageTree]);

  // Collapse all nodes
  const collapseAllNodes = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Count all pages in tree (recursive)
  const countAllPages = (nodes: PageNode[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + (node.children ? countAllPages(node.children) : 0);
    }, 0);
  };

  // Sort pages locally
  const sortedPages = React.useMemo(() => {
    const sorted = [...pages];
    switch (sortBy) {
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [pages, sortBy]);

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

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, pageId: string) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedPageId(pageId);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedPageId(null);
  };

  const handleDuplicatePage = (pageId: string) => {
    // TODO: Implement duplicate functionality
    toast.info('Duplicate feature coming soon!');
    handleActionMenuClose();
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'grid' | 'list' | 'tree' | null) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortChange = (sortOption: 'recent' | 'title' | 'oldest') => {
    setSortBy(sortOption);
    handleSortMenuClose();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Recursive Tree Node Component
  const TreeNode: React.FC<{ node: PageNode; depth?: number }> = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);

    return (
      <Box>
        <Paper
          elevation={0}
          sx={{
            ml: depth * 3,
            mb: 1,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            transition: 'all 0.2s ease',
            bgcolor: depth === 0 ? 'background.paper' : alpha('#667eea', 0.02),
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha('#667eea', 0.08),
              boxShadow: 2,
              transform: 'translateX(4px)',
            },
          }}
          onClick={() => handleEditPage(node._id)}
        >
          {/* Expand/Collapse Button */}
          <IconButton
            size="small"
            onClick={(e) => toggleNodeExpansion(node._id, e)}
            sx={{
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              visibility: hasChildren ? 'visible' : 'hidden',
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>

          {/* Icon/Folder */}
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              background: hasChildren
                ? 'linear-gradient(135deg, #ffd93d 0%, #ff9800 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {node.icon ? (
              <Typography variant="h6">{node.icon}</Typography>
            ) : hasChildren ? (
              isExpanded ? (
                <FolderOpenIcon sx={{ color: 'white' }} />
              ) : (
                <FolderIcon sx={{ color: 'white' }} />
              )
            ) : (
              <ArticleIcon sx={{ color: 'white', opacity: 0.9 }} />
            )}
          </Box>

          {/* Content */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {node.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {formatDate(node.createdAt)}
              </Typography>
              {hasChildren && (
                <Chip
                  size="small"
                  label={`${node.children!.length} ${node.children!.length === 1 ? 'subpage' : 'subpages'}`}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                  color="primary"
                  variant="outlined"
                />
              )}
              {node.shared_with && node.shared_with.length > 0 && (
                <Chip
                  size="small"
                  icon={<ShareIcon fontSize="small" />}
                  label={node.shared_with.length}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>

          {/* Actions */}
          {isAdmin && (
            <Stack direction="row" spacing={0.5} sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
              <Tooltip title="Share">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareClick(node._id);
                  }}
                >
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="More">
                <IconButton
                  size="small"
                  onClick={(e) => handleActionMenuOpen(e, node._id)}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Paper>

        {/* Children */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ position: 'relative' }}>
            {/* Connecting Line */}
            {hasChildren && (
              <Box
                sx={{
                  position: 'absolute',
                  left: depth * 24 + 28,
                  top: 0,
                  bottom: 8,
                  width: 2,
                  bgcolor: 'divider',
                  borderRadius: 1,
                }}
              />
            )}
            {node.children?.map((child) => (
              <TreeNode key={child._id} node={child} depth={depth + 1} />
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <Box sx={{ padding: 3 }}>
      <ToastContainer />

      {/* Header with Stats */}
      <Box mb={4}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Pages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Dashboard / Pages
              {!loading && viewMode === 'tree' && (
                <Chip
                  label={`${countAllPages(pageTree)} ${countAllPages(pageTree) === 1 ? 'Page' : 'Pages'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {!loading && viewMode !== 'tree' && (
                <Chip label={`${total} ${total === 1 ? 'Page' : 'Pages'}`} size="small" color="primary" variant="outlined" />
              )}
            </Typography>
          </Grid>

          {isAdmin && (
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreatePage}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                Create Page
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Filters and Controls */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search pages by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>

          {/* View Mode and Sort Controls */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Expand/Collapse All (Tree View Only) */}
            {isAdmin && viewMode === 'tree' && pageTree.length > 0 && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="text"
                  size="small"
                  onClick={expandAllNodes}
                  sx={{ textTransform: 'none', fontSize: '0.85rem' }}
                >
                  Expand All
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={collapseAllNodes}
                  sx={{ textTransform: 'none', fontSize: '0.85rem' }}
                >
                  Collapse All
                </Button>
              </Stack>
            )}

            {/* Sort Button (only for non-tree view) */}
            {viewMode !== 'tree' && (
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={handleSortMenuOpen}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'title' ? 'A-Z' : 'Oldest'}
              </Button>
            )}

            {/* View Mode Toggle */}
            {!isAdmin && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                sx={{ borderRadius: 2 }}
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <Tooltip title="Grid View">
                    <GridViewIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <Tooltip title="List View">
                    <ListViewIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortMenuClose}
      >
        <MenuItem onClick={() => handleSortChange('recent')} selected={sortBy === 'recent'}>
          <ListItemIcon>
            <RecentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Most Recent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('title')} selected={sortBy === 'title'}>
          <ListItemIcon>
            <SortIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Alphabetical (A-Z)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('oldest')} selected={sortBy === 'oldest'}>
          <ListItemIcon>
            <AccessTime fontSize="small" />
          </ListItemIcon>
          <ListItemText>Oldest First</ListItemText>
        </MenuItem>
      </Menu>

      {/* Loading State with Skeletons */}
      {loading && viewMode === 'tree' && (
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Paper
              key={item}
              elevation={0}
              sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="rounded" width={40} height={40} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="text" width="25%" height={16} />
              </Box>
            </Paper>
          ))}
          {/* Nested skeleton items */}
          {[1, 2].map((item) => (
            <Paper
              key={`nested-${item}`}
              elevation={0}
              sx={{ ml: 3, p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="rounded" width={40} height={40} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="35%" height={24} />
                <Skeleton variant="text" width="20%" height={16} />
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {loading && viewMode !== 'tree' && (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={120} />
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="80%" sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error State */}
      {error && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        </Paper>
      )}

      {/* Empty State */}
      {!loading && sortedPages.length === 0 && viewMode !== 'tree' ? (
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.default',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <ArticleIcon sx={{ fontSize: 60, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {searchTerm ? 'No pages found' : 'No pages yet'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, textAlign: 'center' }}>
              {searchTerm
                ? `No results for "${searchTerm}". Try a different search term.`
                : 'Create your first page to get started with documentation and knowledge sharing.'}
            </Typography>
            {isAdmin && !searchTerm && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreatePage}
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                Create Your First Page
              </Button>
            )}
          </Paper>
        </Fade>
      ) : !loading && viewMode === 'tree' && pageTree.length === 0 ? (
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.default',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'primary.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <FolderIcon sx={{ fontSize: 60, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              No pages yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, textAlign: 'center' }}>
              Create your first page to get started. You can organize pages in a hierarchical structure with parent and child pages.
            </Typography>
            {isAdmin && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleCreatePage}
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                Create Your First Page
              </Button>
            )}
          </Paper>
        </Fade>
      ) : (
        !loading && (
          <>
            {/* Tree View (Admin Only) */}
            {viewMode === 'tree' && isAdmin && (
              <Fade in>
                <Box>
                  {/* Tree Header */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TreeViewIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Page Hierarchy
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Organize and manage your pages in a folder-like structure. Click on a page to edit, or use the arrow to expand subpages.
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Tree Nodes */}
                  <Box sx={{ mt: 2 }}>
                    {pageTree.map((node) => (
                      <TreeNode key={node._id} node={node} />
                    ))}
                  </Box>
                </Box>
              </Fade>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <Grid container spacing={3}>
                {sortedPages.map((pageItem) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={pageItem._id}>
                    <Fade in timeout={300}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'visible',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: 8,
                            '& .quick-actions': {
                              opacity: 1,
                            },
                          },
                        }}
                        onClick={() => handleEditPage(pageItem._id)}
                      >
                        {/* Cover Image */}
                        {pageItem.cover_image ? (
                          <Box
                            sx={{
                              height: 140,
                              backgroundImage: `url(${pageItem.cover_image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              position: 'relative',
                            }}
                          >
                            {pageItem.shared_with && pageItem.shared_with.length > 0 && (
                              <Chip
                                size="small"
                                icon={<ShareIcon fontSize="small" />}
                                label={pageItem.shared_with.length}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'rgba(255,255,255,0.9)',
                                  backdropFilter: 'blur(4px)',
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              height: 140,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {pageItem.icon ? (
                              <Typography variant="h1" sx={{ fontSize: 60 }}>
                                {pageItem.icon}
                              </Typography>
                            ) : (
                              <ArticleIcon sx={{ fontSize: 60, color: 'white', opacity: 0.8 }} />
                            )}
                            {pageItem.shared_with && pageItem.shared_with.length > 0 && (
                              <Chip
                                size="small"
                                icon={<ShareIcon fontSize="small" />}
                                label={pageItem.shared_with.length}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'rgba(255,255,255,0.9)',
                                  backdropFilter: 'blur(4px)',
                                }}
                              />
                            )}
                          </Box>
                        )}

                        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                          {/* Title */}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {pageItem.title}
                          </Typography>

                          {/* Metadata */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(pageItem.createdAt)}
                            </Typography>
                          </Stack>
                        </CardContent>

                        {/* Actions (Admin Only) */}
                        {isAdmin && (
                          <CardActions
                            className="quick-actions"
                            sx={{
                              justifyContent: 'flex-end',
                              pt: 0,
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                          >
                            <Tooltip title="Share">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShareClick(pageItem._id);
                                }}
                              >
                                <ShareIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More">
                              <IconButton
                                size="small"
                                onClick={(e) => handleActionMenuOpen(e, pageItem._id)}
                              >
                                <MoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        )}
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Stack spacing={2}>
                {sortedPages.map((pageItem) => (
                  <Fade in timeout={300} key={pageItem._id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => handleEditPage(pageItem._id)}
                    >
                      {/* Icon/Cover Thumbnail */}
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          background: pageItem.cover_image
                            ? `url(${pageItem.cover_image})`
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {!pageItem.cover_image && (
                          pageItem.icon ? (
                            <Typography variant="h5">{pageItem.icon}</Typography>
                          ) : (
                            <ArticleIcon sx={{ color: 'white', opacity: 0.8 }} />
                          )
                        )}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {pageItem.title}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Created {formatDate(pageItem.createdAt)}
                          </Typography>
                          {pageItem.shared_with && pageItem.shared_with.length > 0 && (
                            <Chip
                              size="small"
                              icon={<ShareIcon fontSize="small" />}
                              label={`Shared with ${pageItem.shared_with.length}`}
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>

                      {/* Actions (Admin Only) */}
                      {isAdmin && (
                        <Stack direction="row" spacing={1}>
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
                          <Tooltip title="More">
                            <IconButton
                              size="small"
                              onClick={(e) => handleActionMenuOpen(e, pageItem._id)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Paper>
                  </Fade>
                ))}
              </Stack>
            )}

            {/* Pagination (not for tree view) */}
            {viewMode !== 'tree' && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedPageId) handleEditPage(selectedPageId);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedPageId) handleShareClick(selectedPageId);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedPageId) handleDuplicatePage(selectedPageId);
          }}
        >
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (selectedPageId) handleDeleteClick(selectedPageId);
            handleActionMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Delete Page
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this page? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
