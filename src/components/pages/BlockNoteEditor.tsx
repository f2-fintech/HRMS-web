"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { 
  useCreateBlockNote, 
  createReactInlineContentSpec,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  filterSuggestionItems,
} from "@blocknote/core";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { PartialBlock } from "@blocknote/core";
import { toast } from 'react-toastify';
import { CircularProgress, Box } from '@mui/material';

/* ---------------------------------------------------
   CUSTOM INLINE CONTENT: Page Mention
   Note: Uses window.dispatchEvent to communicate with parent component
   because createReactInlineContentSpec doesn't have access to Next.js router
--------------------------------------------------- */
const PageMention = createReactInlineContentSpec(
  {
    type: "pageMention",
    propSchema: {
      pageId: { default: "" },
      pageTitle: { default: "Untitled" },
      pageIcon: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { pageId, pageTitle, pageIcon } = props.inlineContent.props;
      
      const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (pageId) {
          // Dispatch custom event for navigation (handled by parent component)
          window.dispatchEvent(new CustomEvent('navigateToPage', { 
            detail: { pageId } 
          }));
        }
      };
      
      return (
        <span 
          data-page-id={pageId}
          data-inline-type="pageMention"
          contentEditable={false}
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(102, 126, 234, 0.15)',
            borderRadius: '4px',
            padding: '2px 8px',
            margin: '0 2px',
            cursor: 'pointer',
            fontSize: '0.9em',
            color: '#667eea',
            fontWeight: 500,
            userSelect: 'none',
            textDecoration: 'none',
          }}
          onClick={handleClick}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClick(e as any);
            }
          }}
        >
          {pageIcon || '📄'} {pageTitle || 'Untitled'}
        </span>
      );
    },
  }
);

/* ---------------------------------------------------
   SCHEMA: Create schema with custom inline content
--------------------------------------------------- */
const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageMention: PageMention,
  },
});

interface BlockNoteEditorProps {
  initialBlocks: any[];
  isReadOnly: boolean;
  onBlocksChange: (blocks: any[]) => void;
  editorRef?: React.MutableRefObject<any>;
  currentPageId?: string; // For creating child pages (undefined for new pages)
  onImmediateSave?: () => void; // Callback to trigger immediate save (used after creating child page)
  onCreateParentPage?: () => Promise<string | null>; // Callback to create parent page first (returns new page ID)
}

/* ---------------------------------------------------
   SANITIZATION (your same logic, fully compatible)
--------------------------------------------------- */
const sanitizeBlocks = (blocks: any[]): PartialBlock[] | null => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  const sanitizeInlineContent = (item: any) => {
    if (!item || typeof item !== "object") {
      return { type: "text", text: "", styles: {} };
    }
    
    // Handle pageMention type - preserve all props
    if (item.type === "pageMention") {
      return {
        type: "pageMention",
        props: {
          pageId: item.props?.pageId || "",
          pageTitle: item.props?.pageTitle || "Untitled",
          pageIcon: item.props?.pageIcon || "",
        },
      };
    }
    
    // Handle link type
    if (item.type === "link") {
      return {
        type: "link",
        href: item.href || "",
        content: Array.isArray(item.content) 
          ? item.content.map(sanitizeInlineContent).filter(Boolean)
          : [],
      };
    }
    
    // Default text type
    return {
      type: item.type || "text",
      text: item.text || "",
      styles:
        item.styles && typeof item.styles === "object"
          ? Object.fromEntries(
              Object.entries(item.styles).filter(
                ([, v]) => v !== null && v !== undefined
              )
            )
          : {},
    };
  };

  const sanitizeProps = (props: any) => {
    if (!props || typeof props !== "object") {
      return {
        textColor: "default",
        backgroundColor: "default",
        textAlignment: "left",
      };
    }
    return Object.fromEntries(
      Object.entries(props).filter(([_, v]) => v !== null && v !== undefined)
    );
  };

  const sanitizeBlock = (block: any) => {
    if (!block || typeof block !== "object") return null;

    return {
      id: block.id || undefined,
      type: block.type || "paragraph",
      props: sanitizeProps(block.props),
      content: Array.isArray(block.content)
        ? block.content.map(sanitizeInlineContent).filter(Boolean)
        : [],
      children: Array.isArray(block.children)
        ? block.children.map(sanitizeBlock).filter(Boolean)
        : [],
    };
  };

  try {
    return blocks.map(sanitizeBlock).filter(Boolean) as PartialBlock[];
  } catch (e) {
    console.warn("Block sanitization failed:", e);
    return null;
  }
};

/* ---------------------------------------------------
   COMPONENT
--------------------------------------------------- */
export default function BlockNoteEditorComponent({
  initialBlocks,
  isReadOnly,
  onBlocksChange,
  editorRef: externalEditorRef,
  currentPageId,
  onImmediateSave,
  onCreateParentPage,
}: BlockNoteEditorProps) {
  
  const router = useRouter();
  const [creatingPage, setCreatingPage] = useState(false);
  
  // Handle navigation events from PageMention clicks
  useEffect(() => {
    const handleNavigateToPage = (event: CustomEvent<{ pageId: string }>) => {
      const { pageId } = event.detail;
      if (pageId) {
        console.log('Navigating to page:', pageId);
        router.push(`/pages/${pageId}`);
      }
    };

    window.addEventListener('navigateToPage', handleNavigateToPage as EventListener);
    
    return () => {
      window.removeEventListener('navigateToPage', handleNavigateToPage as EventListener);
    };
  }, [router]);
  
  /* Sanitize initial blocks */
  const sanitizedInitialBlocks = useMemo(() => {
    return sanitizeBlocks(initialBlocks);
  }, [initialBlocks]);

  /* Create editor with custom schema */
  const editor = useCreateBlockNote({
    schema,
    initialContent: sanitizedInitialBlocks ?? undefined,
  });

  // Debug: Log editor creation
  useEffect(() => {
    if (editor) {
      console.log('Editor created with schema:', {
        hasPageMention: 'pageMention' in (editor.schema.inlineContentSpecs || {}),
        inlineSpecs: Object.keys(editor.schema.inlineContentSpecs || {}),
      });
    }
  }, [editor]);

  /* Create child page and insert inline mention */
  const handleCreateChildPage = async () => {
    if (creatingPage) return;

    setCreatingPage(true);
    
    try {
      // Get auth headers
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const company_id = user.company_id || '';
      const user_id = user.id || '';
      const role = user.role || '';

      // Determine the parent page ID
      let parentId: string | undefined = currentPageId;
      
      // If no currentPageId (new page), create the parent page first
      if (!parentId) {
        if (!onCreateParentPage) {
          toast.error('Please save the page first before adding child pages');
          setCreatingPage(false);
          return;
        }
        
        console.log('Creating parent page first...');
        toast.info('Saving page first...');
        
        // Create parent page and get its ID
        const newParentId: string | null = await onCreateParentPage();
        
        if (!newParentId) {
          toast.error('Failed to create page. Please try again.');
          setCreatingPage(false);
          return;
        }
        
        parentId = newParentId;
        console.log('Parent page created with ID:', parentId);
      }

      // Create child page via API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/pages/${parentId}/child`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
          },
          body: JSON.stringify({
            title: 'Untitled',
            blocks: [],
            created_by: user_id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create child page');
      }

      const newPage = await response.json();

      // Insert page mention as custom inline content at cursor position
      if (editor) {
        try {
          // Focus editor first
          editor.focus();
          
          console.log('Attempting to insert pageMention with:', {
            pageId: newPage._id,
            pageTitle: newPage.title,
          });
          
          // Insert using schema-typed content
          editor.insertInlineContent([
            {
              type: "pageMention",
              props: {
                pageId: newPage._id,
                pageTitle: newPage.title,
                pageIcon: newPage.icon || "",
              },
            },
            " ", // Add space after
          ]);
          
          console.log('Successfully inserted page mention, current document:', editor.document);
          
          // Notify parent about block changes
          onBlocksChange(editor.document);
          
          // Trigger immediate save to persist the pageMention
          if (onImmediateSave) {
            // Small delay to ensure state is updated
            setTimeout(() => {
              onImmediateSave();
            }, 100);
          }
        } catch (insertError) {
          console.error('Insert error details:', insertError);
          throw new Error('Failed to insert page link');
        }
      }

      toast.success('Child page created and linked successfully');
    } catch (error: any) {
      console.error("Failed to create child page:", error);
      
      if (error.message?.includes('Maximum nesting depth')) {
        toast.error('Maximum nesting depth of 10 levels reached');
      } else if (error.message?.includes('Forbidden')) {
        toast.error('You do not have permission to create child pages');
      } else {
        toast.error('Failed to create child page');
      }
    } finally {
      setCreatingPage(false);
    }
  };

  /* Custom slash menu item for page mentions */
  const getCustomSlashMenuItems = (
    editor: any
  ): DefaultReactSuggestionItem[] => [
    {
      title: creatingPage ? "Creating page..." : "Page",
      onItemClick: () => {
        if (!creatingPage) {
          handleCreateChildPage();
        }
      },
      aliases: ["page", "link", "mention", "p"],
      group: "Other",
      subtext: creatingPage ? "Please wait..." : "Create and link a new page",
    },
    ...getDefaultReactSlashMenuItems(editor as any),
  ];

  /* Set read-only mode (latest API) */
  useEffect(() => {
    if (!editor) return;

    editor.isEditable = !isReadOnly;
  }, [editor, isReadOnly]);

  /* Expose editorRef to parent */
  useEffect(() => {
    if (editor && externalEditorRef) {
      externalEditorRef.current = editor;
    }
  }, [editor, externalEditorRef]);

  /* Debounced onChange listener */
  useEffect(() => {
    if (!editor) return;

    let timeout: any;

    const unsubscribe = editor.onChange(() => {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        try {
          onBlocksChange(editor.document);
        } catch (err) {
          console.error("Failed to extract document:", err);
        }
      }, 400);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe(); // cleanup (latest API requirement)
    };
  }, [editor, onBlocksChange]);

  return (
    <>
      {/* Your Custom CSS – untouched */}
      <style>{`
        /* ---- Full CSS copied from your original file ---- */
        /* Custom Slash Menu Styles */
        [data-suggestion-menu] {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
          padding: 8px;
          min-width: 320px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        /* Page mention style */
        .bn-inline-content[data-page-mention="true"] {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 12px;
          padding: 2px 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .bn-inline-content[data-page-mention="true"]:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
      `}</style>

      <BlockNoteView 
        editor={editor as any} 
        theme="light"
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor as any), query)
          }
        />
      </BlockNoteView>
      
      {/* Loading overlay when creating page */}
      {creatingPage && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 3,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Box sx={{ textAlign: 'center' }}>
              Creating child page...
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
