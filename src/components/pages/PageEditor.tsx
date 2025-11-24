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
} from '@mui/material';
import {
  Share as ShareIcon,
  FileCopy as CopyIcon,
  CloudUpload as UploadIcon,
  EmojiEmotions as EmojiIcon,
  Save as SaveIcon,
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
  const editorRef = useRef<any>(null);

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
  }, []);

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  if (loading && pageId !== 'new') {
    return <Loader />;
  }

  const isAdmin = userRole === '1';

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 3 }}>
      {/* Cover Image */}
      <Box sx={{ position: 'relative', mb: 3 }}>
        {coverImage ? (
          <Box
            sx={{
              height: 250,
              backgroundImage: `url(${coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            {!isReadOnly && (
              <Button
                component="label"
                variant="contained"
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                }}
              >
                Change Cover
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
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ height: 100, borderStyle: 'dashed' }}
              disabled={coverUploading}
            >
              {coverUploading ? 'Uploading...' : 'Add Cover Image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleCoverUpload}
              />
            </Button>
          )
        )}
      </Box>

      {/* Title Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {/* Icon */}
        <Box sx={{ position: 'relative' }}>
          {icon ? (
            <Typography
              variant="h2"
              sx={{ cursor: !isReadOnly ? 'pointer' : 'default' }}
              onClick={() => !isReadOnly && setEmojiPickerOpen(!emojiPickerOpen)}
            >
              {icon}
            </Typography>
          ) : (
            !isReadOnly && (
              <IconButton
                size="large"
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
              >
                <EmojiIcon fontSize="large" />
              </IconButton>
            )
          )}
          {emojiPickerOpen && (
            <Box sx={{ position: 'absolute', zIndex: 1000, top: 60 }}>
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
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '2.5rem',
              fontWeight: 700,
            },
          }}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!isReadOnly && (
            <>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleManualSave}
                disabled={saving}
              >
                {pageId === 'new' ? 'Create Page' : 'Save'}
              </Button>
              {lastSaved && (
                <Typography variant="caption" color="text.secondary">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </Typography>
              )}
            </>
          )}
          {isReadOnly && (
            <Typography variant="caption" color="text.secondary">
              Read-only mode
            </Typography>
          )}
        </Box>

        {isAdmin && pageId !== 'new' && (
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShareClick}
          >
            Share
          </Button>
        )}
      </Box>

      {/* Read-only Banner */}
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are viewing this page in read-only mode.
        </Alert>
      )}

      {/* BlockNote Editor */}
      {mounted && initialLoadDone && pageId && (
        <BlockNoteEditor
          key={pageId} // Only re-mount when pageId changes, not on every block update
          initialBlocks={blocks}
          isReadOnly={isReadOnly}
          onBlocksChange={handleBlocksChange}
          editorRef={editorRef}
        />
      )}

      {/* Share Dialog */}
      {pageId && pageId !== 'new' && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          pageId={pageId}
          currentSharedWith={currentPage?.shared_with || []}
        />
      )}
    </Box>
  );
}
