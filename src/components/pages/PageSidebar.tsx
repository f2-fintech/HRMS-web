'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Article as ArticleIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchPageTree, deletePage } from '@/redux/features/pages/pagesSlice';

interface PageNode {
  _id: string;
  title: string;
  icon?: string;
  parent_id?: string | null;
  depth?: number;
  children?: PageNode[];
}

interface PageSidebarProps {
  currentPageId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function PageSidebar({ currentPageId, isCollapsed, onToggleCollapse }: PageSidebarProps) {
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch();
  const { pageTree, treeLoading } = useSelector((state: RootState) => state.pages);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; left: number } | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch page tree on mount
  useEffect(() => {
    dispatch(fetchPageTree());
  }, [dispatch]);

  // Auto-expand parents of current page
  useEffect(() => {
    if (currentPageId && pageTree.length > 0) {
      const findAndExpandParents = (nodes: PageNode[], targetId: string, parents: string[] = []): string[] | null => {
        for (const node of nodes) {
          if (node._id === targetId) {
            return parents;
          }
          if (node.children && node.children.length > 0) {
            const result = findAndExpandParents(node.children, targetId, [...parents, node._id]);
            if (result) return result;
          }
        }
        return null;
      };

      const parentIds = findAndExpandParents(pageTree, currentPageId);
      if (parentIds && parentIds.length > 0) {
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          parentIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    }
  }, [currentPageId, pageTree]);

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

  const handleNavigate = (pageId: string) => {
    if (pageId !== currentPageId) {
      router.push(`/pages/${pageId}`);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pageId: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuAnchor({ top: rect.bottom, left: rect.right });
    setSelectedPageId(pageId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedPageId(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPageId) return;
    
    setIsDeleting(true);
    try {
      await dispatch(deletePage(selectedPageId)).unwrap();
      toast.success('Page and all child pages deleted successfully');
      setDeleteDialogOpen(false);
      
      // Refresh tree
      dispatch(fetchPageTree());
      
      // If we deleted the current page, navigate to pages list
      if (selectedPageId === currentPageId) {
        router.push('/pages');
      }
    } catch (err) {
      toast.error('Failed to delete page');
    } finally {
      setIsDeleting(false);
      setSelectedPageId(null);
    }
  };

  const handleShareClick = () => {
    if (selectedPageId) {
      router.push(`/pages/${selectedPageId}?share=true`);
    }
    handleMenuClose();
  };

  // Recursive Tree Node Component
  const TreeNode: React.FC<{ node: PageNode; depth?: number }> = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node._id);
    const isCurrentPage = node._id === currentPageId;

    return (
      <Box>
        <Box
          sx={{
            pl: depth * 1.5 + 1,
            pr: 0.5,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            borderRadius: 1,
            transition: 'all 0.15s ease',
            bgcolor: isCurrentPage ? alpha('#667eea', 0.15) : 'transparent',
            borderLeft: isCurrentPage ? '3px solid' : '3px solid transparent',
            borderColor: isCurrentPage ? 'primary.main' : 'transparent',
            '&:hover': {
              bgcolor: isCurrentPage ? alpha('#667eea', 0.2) : alpha('#667eea', 0.08),
              '& .node-actions': {
                opacity: 1,
              },
            },
          }}
          onClick={() => handleNavigate(node._id)}
        >
          {/* Expand/Collapse */}
          <IconButton
            size="small"
            onClick={(e) => toggleNodeExpansion(node._id, e)}
            sx={{
              p: 0.25,
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              visibility: hasChildren ? 'visible' : 'hidden',
              width: 20,
              height: 20,
            }}
          >
            <ExpandIcon sx={{ fontSize: 16 }} />
          </IconButton>

          {/* Icon */}
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 14,
            }}
          >
            {node.icon ? (
              node.icon
            ) : hasChildren ? (
              isExpanded ? (
                <FolderOpenIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              ) : (
                <FolderIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              )
            ) : (
              <ArticleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            )}
          </Box>

          {/* Title */}
          <Typography
            variant="body2"
            sx={{
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isCurrentPage ? 600 : 400,
              color: isCurrentPage ? 'primary.main' : 'text.primary',
              fontSize: '0.85rem',
            }}
          >
            {node.title || 'Untitled'}
          </Typography>

          {/* Actions */}
          <IconButton
            className="node-actions"
            size="small"
            onClick={(e) => handleMenuOpen(e, node._id)}
            sx={{
              p: 0.25,
              opacity: 0,
              transition: 'opacity 0.15s',
              width: 20,
              height: 20,
            }}
          >
            <MoreIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Children */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {node.children?.map((child) => (
            <TreeNode key={child._id} node={child} depth={depth + 1} />
          ))}
        </Collapse>
      </Box>
    );
  };

  if (isCollapsed) {
    return (
      <Box
        sx={{
          width: 48,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1,
        }}
      >
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton onClick={onToggleCollapse} size="small">
            <ExpandIcon />
          </IconButton>
        </Tooltip>
        <Divider sx={{ width: '80%', my: 1 }} />
        <Tooltip title="All Pages" placement="right">
          <IconButton onClick={() => router.push('/pages')} size="small">
            <HomeIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: 280,
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ArticleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Pages
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="All Pages">
              <IconButton size="small" onClick={() => router.push('/pages')}>
                <HomeIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Collapse sidebar">
              <IconButton size="small" onClick={onToggleCollapse}>
                <CollapseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Tree Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            py: 1,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'divider',
              borderRadius: 3,
            },
          }}
        >
          {treeLoading ? (
            <Stack spacing={0.5} sx={{ px: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Skeleton variant="circular" width={20} height={20} />
                  <Skeleton variant="text" width={`${60 + Math.random() * 30}%`} height={24} />
                </Box>
              ))}
            </Stack>
          ) : pageTree.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No pages yet
              </Typography>
            </Box>
          ) : (
            pageTree.map((node) => (
              <TreeNode key={node._id} node={node} />
            ))
          )}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            fullWidth
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => router.push('/pages/new')}
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha('#667eea', 0.08),
                color: 'primary.main',
              },
            }}
          >
            New Page
          </Button>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={menuAnchor ? { top: menuAnchor.top, left: menuAnchor.left } : undefined}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { minWidth: 160 },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedPageId) handleNavigate(selectedPageId);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShareClick}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, maxWidth: 400 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Delete Page
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this page?
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
            ⚠️ Warning: This will also delete all child/subpages under this page. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{ borderRadius: 2 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
