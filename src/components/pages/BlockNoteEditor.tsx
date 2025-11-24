'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';

interface BlockNoteEditorProps {
  initialBlocks: any[];
  isReadOnly: boolean;
  onBlocksChange: (blocks: any[]) => void;
  editorRef?: React.MutableRefObject<any>;
}

// Inner component that uses BlockNote hooks
function BlockNoteEditorInner({ 
  initialBlocks, 
  isReadOnly, 
  onBlocksChange,
  editorRef: externalEditorRef,
}: BlockNoteEditorProps) {
  const [BlockNoteModule, setBlockNoteModule] = useState<any>(null);
  const [editor, setEditor] = useState<any>(null);
  const editorRef = useRef<any>(null);
  const initialBlocksRef = useRef<any[]>(initialBlocks); 
  // Store initial blocks to prevent re-creation
  console.log('BlockNoteEditorInner rendered with initialBlocks:', initialBlocks);

  // Update the ref if initialBlocks change (for when we navigate to a different page)
  useEffect(() => {
    initialBlocksRef.current = initialBlocks;
  }, [initialBlocks]);

  useEffect(() => {
    let isCancelled = false;

    const loadBlockNote = async () => {
      try {
        const reactModule = await import('@blocknote/react');
        
        // Import CSS separately (use 'style.css' not 'styles.css')
        await import('@blocknote/core/style.css' as any);

        if (isCancelled) return;

        setBlockNoteModule(reactModule);
      } catch (error) {
        console.error('Failed to load BlockNote:', error);
      }
    };

    loadBlockNote();

    return () => {
      isCancelled = true;
      if (editorRef.current) {
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!BlockNoteModule) return;

    const initEditor = async () => {
      try {
        const { BlockNoteEditor } = await import('@blocknote/core');
        
        console.log('Creating editor with blocks:', initialBlocksRef.current);
        
        // Parse initial content if it exists and is valid
        let initialContent = undefined;
        if (initialBlocksRef.current && Array.isArray(initialBlocksRef.current) && initialBlocksRef.current.length > 0) {
          try {
            // Deep sanitization function to remove null/undefined values
            const sanitizeInlineContent = (contentItem: any): any => {
              if (!contentItem || typeof contentItem !== 'object') {
                return { type: 'text', text: '', styles: {} };
              }
              
              // Ensure inline content has required fields
              return {
                type: contentItem.type || 'text',
                text: contentItem.text || '',
                styles: contentItem.styles && typeof contentItem.styles === 'object' 
                  ? Object.fromEntries(
                      Object.entries(contentItem.styles).filter(([_, v]) => v !== null && v !== undefined)
                    )
                  : {}
              };
            };
            
            const sanitizeProps = (props: any): any => {
              if (!props || typeof props !== 'object') {
                return {
                  textColor: 'default',
                  backgroundColor: 'default',
                  textAlignment: 'left'
                };
              }
              
              return Object.fromEntries(
                Object.entries(props).filter(([_, v]) => v !== null && v !== undefined)
              );
            };
            
            const sanitizeBlock = (block: any): any => {
              if (!block || typeof block !== 'object') {
                return null;
              }
              
              const sanitizedBlock: any = {
                id: block.id || crypto.randomUUID?.() || Math.random().toString(36),
                type: block.type || 'paragraph',
                props: sanitizeProps(block.props),
                content: Array.isArray(block.content) 
                  ? block.content.map(sanitizeInlineContent).filter(Boolean)
                  : [],
                children: Array.isArray(block.children)
                  ? block.children.map(sanitizeBlock).filter(Boolean)
                  : []
              };
              
              return sanitizedBlock;
            };
            
            // Validate and sanitize blocks
            const sanitizedBlocks = initialBlocksRef.current
              .map(sanitizeBlock)
              .filter(Boolean);
            
            initialContent = sanitizedBlocks;
            console.log('Using sanitized initial content:', initialContent);
          } catch (e) {
            console.warn('Could not parse initial blocks:', e);
            // If parsing fails, start with empty editor
            initialContent = undefined;
          }
        }
        
        const newEditor = await BlockNoteEditor.create({
          initialContent,
        });

        console.log('Editor created, topLevelBlocks:', newEditor.topLevelBlocks);

        // Set editable state
        newEditor.isEditable = !isReadOnly;

        editorRef.current = newEditor;
        setEditor(newEditor);
        
        // Expose editor to parent component
        if (externalEditorRef) {
          externalEditorRef.current = newEditor;
        }
      } catch (error) {
        console.error('Failed to create editor:', error);
      }
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current._tiptapEditor?.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [BlockNoteModule, isReadOnly]);

  // Handle editor changes
  useEffect(() => {
    if (!editor) return;

    let debounceTimeout: ReturnType<typeof setTimeout>;

    const handleChange = () => {
      clearTimeout(debounceTimeout);

      debounceTimeout = setTimeout(() => {
        try {
          // Get blocks as JSON-serializable format using topLevelBlocks
          const blocks = editor.topLevelBlocks;
          console.log('Editor content changed (debounced), blocks:', blocks);
          onBlocksChange(blocks);
        } catch (error) {
          console.error('Error getting blocks:', error);
        }
      }, 500); // 500ms debounce delay
    };

    // Subscribe to editor changes using the _tiptapEditor event
    editor._tiptapEditor.on('update', handleChange);
    
    return () => {
      editor._tiptapEditor.off('update', handleChange);
      clearTimeout(debounceTimeout);
    };
  }, [editor, onBlocksChange]);

  if (!BlockNoteModule || !editor) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 500,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fafafa',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const { BlockNoteView } = BlockNoteModule;

  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        minHeight: 500,
        backgroundColor: '#fff',
        '& .bn-container': {
          minHeight: 500,
        },
        '& .ProseMirror': {
          padding: '16px',
          minHeight: 500,
        },
      }}
    >
      <BlockNoteView editor={editor} theme="light" />
    </Box>
  );
}

// Use dynamic import with ssr: false to prevent SSR issues
const BlockNoteEditor = dynamic(
  () => Promise.resolve(BlockNoteEditorInner),
  { 
    ssr: false,
    loading: () => (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 500,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fafafa',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }
);

export default BlockNoteEditor;