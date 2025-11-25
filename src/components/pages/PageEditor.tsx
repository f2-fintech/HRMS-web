'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Tooltip,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Stack,
  Breadcrumbs,
  Link,
  Chip,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fab,
  Zoom,
  AppBar,
  Toolbar,
  useScrollTrigger,
  Fade as MuiFade,
} from '@mui/material';
import {
  Share as ShareIcon,
  FileCopy as CopyIcon,
  CloudUpload as UploadIcon,
  EmojiEmotions as EmojiIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  Article as ArticleIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  NavigateNext as NavigateNextIcon,
  ArrowUpward as ArrowUpIcon,
  CloudDone as CloudDoneIcon,
  Settings as SettingsIcon,
  KeyboardShortcut,
} from '@mui/icons-material';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { toast } from 'react-toastify';
import type { AppDispatch, RootState } from '@/redux/store';
import {
  fetchPageById,
  updatePage,
  uploadCover,
  createPage,
  setCurrentPage,
} from '@/redux/features/pages/pagesSlice';
import ShareDialog from './ShareDialog';
import Loader from '@/components/loader/loader';

// Dynamically import BlockNote components to avoid SSR issues
const BlockNoteEditor = dynamic(
  () => import('./BlockNoteEditor'),
  { 
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
        <CircularProgress />
      </Box>
    )
  }
);

interface PageEditorProps {
  pageId?: string; // undefined for new pages
}

export default function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch: AppDispatch = useDispatch();
  const { currentPage, loading } = useSelector((state: RootState) => state.pages);

  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [title, setTitle] = useState('Untitled');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<any>(null);
  
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role);
    setUserId(user.id);

    // Check if share param is present
    if (searchParams?.get('share') === 'true' && pageId) {
      setShareDialogOpen(true);
    }
  }, [searchParams, pageId]);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fetch page data when pageId changes
  useEffect(() => {
    if (pageId && pageId !== 'new') {
      console.log('Fetching page:', pageId);
      setInitialLoadDone(false);
      dispatch(fetchPageById(pageId));
    } else if (pageId === 'new') {
      // Reset for new page
      console.log('Setting up new page');
      setTitle('Untitled');
      setIcon(undefined);
      setCoverImage(undefined);
      setBlocks([]);
      setIsReadOnly(false);
      setInitialLoadDone(true);
    }
  }, [dispatch, pageId]);

  // Initialize state from currentPage once loaded
  useEffect(() => {
    console.log('Effect triggered:', { 
      hasCurrentPage: !!currentPage, 
      pageId, 
      initialLoadDone, 
      userRole, 
      userId,
      currentPageTitle: currentPage?.title,
      currentPageBlocks: currentPage?.blocks?.length
    });
    
    if (currentPage && pageId && pageId !== 'new' && !initialLoadDone && userRole && userId) {
      console.log('Initializing page data:', currentPage);
      
      setTitle(currentPage.title || 'Untitled');
      setIcon(currentPage.icon);
      setCoverImage(currentPage.cover_image);
      if (currentPage.blocks && currentPage.blocks.length > 0) {
        console.log('Setting blocks:', currentPage.blocks);
        setBlocks(currentPage.blocks);
      }

      // Check if user is admin or page creator
      const isAdmin = userRole === '1';
      // Handle created_by as either string or populated object
      const creatorId = typeof currentPage.created_by === 'string' 
        ? currentPage.created_by 
        : currentPage.created_by?._id || currentPage.created_by?.id;
      const isCreator = creatorId === userId;
      
      console.log('Permission check:', { isAdmin, creatorId, userId, isCreator });
      
      // Handle shared_with as array of strings or populated objects
      const sharedWithIds = currentPage.shared_with?.map((sw: any) => 
        typeof sw === 'string' ? sw : (sw._id || sw.id)
      ) || [];
      const isShared = sharedWithIds.includes(userId);

      // Read-only if employee AND not creator (even if shared)
      setIsReadOnly(!isAdmin && !isCreator);
      setInitialLoadDone(true);
    }
  }, [currentPage, userRole, userId, pageId, initialLoadDone]);

  const handleAutoSave = useCallback(async () => {
    if (!pageId || pageId === 'new' || isReadOnly) return;

    setSaving(true);
    try {
      console.log('Auto-saving with blocks:', blocks);
      await dispatch(
        updatePage({
          id: pageId,
          data: {
            title,
            icon,
            blocks: blocks as any,
          },
        })
      ).unwrap();
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [pageId, isReadOnly, title, icon, blocks, dispatch]);

  // Autosave functionality (debounced)
  useEffect(() => {
    if (!isReadOnly && pageId && pageId !== 'new' && mounted) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
    }
  }, [blocks, title, icon, handleAutoSave, mounted, isReadOnly, pageId]);

  const handleManualSave = async () => {
    if (pageId === 'new') {
      // Create new page
      try {
        setSaving(true);
        
        // Get the latest content directly from the editor
        let currentBlocks = blocks;
        if (editorRef.current) {
          try {
            currentBlocks = editorRef.current.topLevelBlocks || blocks;
          } catch (e) {
            console.warn('Could not get editor topLevelBlocks, using state blocks:', e);
          }
        }
        
        console.log('Creating page with blocks:', currentBlocks);
        const result = await dispatch(
          createPage({
            title,
            icon,
            cover_image: coverImage,
            blocks: currentBlocks.length > 0 ? currentBlocks : [],
          })
        ).unwrap();
        
        toast.success('Page created successfully');
        // Navigate to the newly created page
        router.push(`/pages/${result._id}`);
      } catch (error) {
        console.error('Create page error:', error);
        toast.error('Failed to create page');
      } finally {
        setSaving(false);
      }
    } else {
      // Update existing page
      try {
        setSaving(true);
        
        // Get the latest content directly from the editor
        let currentBlocks = blocks;
        if (editorRef.current) {
          try {
            currentBlocks = editorRef.current.topLevelBlocks || blocks;
          } catch (e) {
            console.warn('Could not get editor topLevelBlocks, using state blocks:', e);
          }
        }
        
        console.log('Updating page with blocks:', currentBlocks);
        await dispatch(
          updatePage({
            id: pageId!,
            data: {
              title,
              icon,
              blocks: currentBlocks as any,
            },
          })
        ).unwrap();
        setLastSaved(new Date());
        toast.success('Page saved');
      } catch (error) {
        console.error('Update page error:', error);
        toast.error('Failed to save page');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setIcon(emojiData.emoji);
    setEmojiPickerOpen(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pageId || pageId === 'new') return;

    setCoverUploading(true);
    try {
      const result = await dispatch(uploadCover({ id: pageId, file })).unwrap();
      setCoverImage(result.cover_image);
      toast.success('Cover uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload cover');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleBlocksChange = useCallback((newBlocks: any[]) => {
    console.log('Blocks changed:', newBlocks);
    // Ensure we always set an array, even if undefined is passed
    setBlocks(Array.isArray(newBlocks) ? newBlocks : []);
    
    // Calculate word and character count
    const text = newBlocks
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content.map((c: any) => c.text || '').join(' ');
        }
        return '';
      })
      .join(' ');
    
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, []);

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (!isReadOnly) {
          handleManualSave();
        }
      }
      // Cmd/Ctrl + K to toggle info drawer
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setInfoDrawerOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isReadOnly, handleManualSave]);

  if (loading && pageId !== 'new') {
    return <Loader />;
  }

  const isAdmin = userRole === '1';
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <>
      {/* Floating Action Button - Save for Mobile */}
      {!isReadOnly && (
        <Zoom in timeout={300}>
          <Fab
            color="primary"
            aria-label="save"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: { xs: 'flex', md: 'none' },
            }}
            onClick={handleManualSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          </Fab>
        </Zoom>
      )}

      {/* Scroll to Top Button */}
      <Zoom in={trigger}>
        <Fab
          size="small"
          color="default"
          aria-label="scroll to top"
          sx={{
            position: 'fixed',
            bottom: { xs: 88, md: 24 },
            right: 24,
          }}
          onClick={scrollToTop}
        >
          <ArrowUpIcon />
        </Fab>
      </Zoom>

      <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ mb: 2 }}
          >
            <Link
              underline="hover"
              color="inherit"
              href="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/');
              }}
            >
              <HomeIcon fontSize="small" />
              Dashboard
            </Link>
            <Link
              underline="hover"
              color="inherit"
              href="/pages"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/pages');
              }}
            >
              <ArticleIcon fontSize="small" />
              Pages
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              {title}
            </Typography>
          </Breadcrumbs>

          {/* Status Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {!isReadOnly ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={handleManualSave}
                    disabled={saving}
                    sx={{ borderRadius: 2 }}
                  >
                    {pageId === 'new' ? 'Create Page' : 'Save'}
                  </Button>
                  {lastSaved && (
                    <Chip
                      icon={<CloudDoneIcon />}
                      label={`Saved ${lastSaved.toLocaleTimeString()}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {saving && (
                    <Chip
                      icon={<CircularProgress size={16} />}
                      label="Saving..."
                      size="small"
                      variant="outlined"
                    />
                  )}
                </>
              ) : (
                <Chip
                  icon={<ViewIcon />}
                  label="Read-only mode"
                  size="small"
                  color="info"
                  variant="outlined"
                />
              )}
            </Stack>

            <Stack direction="row" spacing={1}>
              {isAdmin && pageId !== 'new' && (
                <Tooltip title="Share page">
                  <IconButton onClick={handleShareClick} size="small">
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Page info (Ctrl+K)">
                <IconButton onClick={() => setInfoDrawerOpen(true)} size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        </Box>

        {/* Read-only Banner */}
        {isReadOnly && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            You are viewing this page in read-only mode. Only the creator or admins can edit this page.
          </Alert>
        )}

        {/* Cover Image */}
        <Box sx={{ position: 'relative', mb: 3 }}>
          {coverImage ? (
            <Box
              sx={{
                height: 300,
                backgroundImage: `url(${coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 3,
                position: 'relative',
                boxShadow: 2,
              }}
            >
              {!isReadOnly && (
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  startIcon={<UploadIcon />}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    borderRadius: 2,
                  }}
                  disabled={coverUploading}
                >
                  {coverUploading ? 'Uploading...' : 'Change Cover'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={coverUploading}
                  />
                </Button>
              )}
            </Box>
          ) : (
            !isReadOnly &&
            pageId !== 'new' && (
              <Paper
                elevation={0}
                sx={{
                  height: 150,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 3,
                  bgcolor: 'background.default',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                component="label"
              >
                <Stack alignItems="center" spacing={1}>
                  <UploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {coverUploading ? 'Uploading...' : 'Click to add cover image'}
                  </Typography>
                </Stack>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={coverUploading}
                />
              </Paper>
            )
          )}
        </Box>

        {/* Title Bar */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Icon */}
            <Box sx={{ position: 'relative' }}>
              {icon ? (
                <Box
                  sx={{
                    fontSize: 60,
                    cursor: !isReadOnly ? 'pointer' : 'default',
                    transition: 'transform 0.2s',
                    '&:hover': !isReadOnly ? { transform: 'scale(1.1)' } : {},
                  }}
                  onClick={() => !isReadOnly && setEmojiPickerOpen(!emojiPickerOpen)}
                >
                  {icon}
                </Box>
              ) : (
                !isReadOnly && (
                  <Tooltip title="Add icon">
                    <IconButton
                      size="large"
                      onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                      sx={{
                        width: 60,
                        height: 60,
                        border: '2px dashed',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <EmojiIcon fontSize="large" />
                    </IconButton>
                  </Tooltip>
                )
              )}
              {emojiPickerOpen && (
                <Box
                  sx={{
                    position: 'absolute',
                    zIndex: 1000,
                    top: 70,
                    left: 0,
                    boxShadow: 4,
                    borderRadius: 2,
                  }}
                >
                  <EmojiPicker onEmojiClick={handleEmojiSelect} />
                </Box>
              )}
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              value={title}
              onChange={handleTitleChange}
              variant="standard"
              placeholder="Untitled"
              disabled={isReadOnly}
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  padding: 0,
                },
              }}
            />
          </Box>
        </Paper>

        {/* BlockNote Editor */}
        {mounted && initialLoadDone && pageId && (
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <BlockNoteEditor
              key={pageId}
              initialBlocks={blocks}
              isReadOnly={isReadOnly}
              onBlocksChange={handleBlocksChange}
              editorRef={editorRef}
            />
          </Paper>
        )}
      </Box>

      {/* Info Drawer */}
      <Drawer
        anchor="right"
        open={infoDrawerOpen}
        onClose={() => setInfoDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, p: 3 },
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Page Information
            </Typography>
            <IconButton onClick={() => setInfoDrawerOpen(false)}>
              <InfoIcon />
            </IconButton>
          </Stack>

          <Divider />

          {/* Statistics */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Words" secondary={wordCount.toLocaleString()} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Characters" secondary={charCount.toLocaleString()} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Reading Time" secondary={`${readingTime} min`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Blocks" secondary={blocks.length} />
              </ListItem>
            </List>
          </Box>

          <Divider />

          {/* Metadata */}
          {currentPage && pageId !== 'new' && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Metadata
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Created"
                    secondary={new Date(currentPage.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Modified"
                    secondary={new Date(currentPage.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                </ListItem>
                {currentPage.shared_with && currentPage.shared_with.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <ShareIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Shared With"
                      secondary={`${currentPage.shared_with.length} ${
                        currentPage.shared_with.length === 1 ? 'person' : 'people'
                      }`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}

          <Divider />

          {/* Keyboard Shortcuts */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Keyboard Shortcuts
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} size="small" />
                      <Typography variant="body2">+</Typography>
                      <Chip label="S" size="small" />
                      <Typography variant="body2" color="text.secondary">
                        Save
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} size="small" />
                      <Typography variant="body2">+</Typography>
                      <Chip label="K" size="small" />
                      <Typography variant="body2" color="text.secondary">
                        Toggle Info
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
            </List>
          </Box>
        </Stack>
      </Drawer>

      {/* Share Dialog */}
      {pageId && pageId !== 'new' && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          pageId={pageId}
          currentSharedWith={currentPage?.shared_with || []}
        />
      )}
    </>
  );
}
