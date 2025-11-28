"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { 
  useCreateBlockNote, 
  createReactInlineContentSpec,
  createReactBlockSpec,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
  SideMenuController,
  SideMenu,
  DragHandleMenu,
  RemoveBlockItem,
  BlockColorsItem,
  useComponentsContext,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  defaultBlockSpecs,
  filterSuggestionItems,
} from "@blocknote/core";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { PartialBlock } from "@blocknote/core";
import { toast } from 'react-toastify';
import { CircularProgress, Box } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import TurnIntoDatabaseDialog from './database/TurnIntoDatabaseDialog';
import InlineDatabaseView from './database/InlineDatabaseView';
import type { Database, DatabaseColumn, CellValue } from './database/types';

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
   CUSTOM BLOCK: Database Block
   Renders an embedded database view inside the editor
   Uses window.dispatchEvent to communicate with parent for data fetching
--------------------------------------------------- */
const DatabaseBlock = createReactBlockSpec(
  {
    type: "database",
    propSchema: {
      databaseId: { default: "" },
      title: { default: "Untitled Database" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { databaseId, title } = props.block.props;
      const [database, setDatabase] = React.useState<Database | null>(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState<string | null>(null);

      // Fetch database data
      React.useEffect(() => {
        if (!databaseId) {
          setLoading(false);
          return;
        }

        const fetchDatabase = async () => {
          try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const company_id = user.company_id || '';
            const user_id = user.id || '';
            const role = user.role || '';

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}`,
              {
                headers: {
                  Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error('Failed to fetch database');
            }

            const data = await response.json();
            setDatabase(data);
          } catch (err: any) {
            console.error('Error fetching database:', err);
            setError(err.message || 'Failed to load database');
          } finally {
            setLoading(false);
          }
        };

        fetchDatabase();
      }, [databaseId]);

      // Handle add row
      const handleAddRow = async () => {
        if (!databaseId) return;
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const company_id = user.company_id || '';
          const user_id = user.id || '';
          const role = user.role || '';

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/rows`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
              },
              body: JSON.stringify({ cells: {} }),
            }
          );

          if (response.ok) {
            const updatedDb = await response.json();
            setDatabase(updatedDb);
          }
        } catch (err) {
          console.error('Error adding row:', err);
        }
      };

      // Handle update cell
      const handleUpdateCell = async (rowId: string, columnId: string, value: any) => {
        if (!databaseId) {
          console.error('handleUpdateCell: No databaseId');
          return;
        }
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const company_id = user.company_id || '';
          const user_id = user.id || '';
          const role = user.role || '';

          const cellValue: CellValue = typeof value === 'string' 
            ? { text: value }
            : typeof value === 'number'
            ? { number: value }
            : { text: String(value) };

          console.log('Updating cell:', { databaseId, rowId, columnId, cellValue });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/cells`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
              },
              body: JSON.stringify({
                rowId,
                cells: { [columnId]: cellValue },
              }),
            }
          );

          console.log('Cell update response status:', response.status);

          if (response.ok) {
            const updatedDb = await response.json();
            console.log('Cell update success, new database:', updatedDb);
            setDatabase(updatedDb);
          } else {
            const errorText = await response.text();
            console.error('Cell update failed:', response.status, errorText);
          }
        } catch (err) {
          console.error('Error updating cell:', err);
        }
      };

      // Handle delete row
      const handleDeleteRow = async (rowId: string) => {
        if (!databaseId) return;
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const company_id = user.company_id || '';
          const user_id = user.id || '';
          const role = user.role || '';

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/rows/${rowId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
              },
            }
          );

          if (response.ok) {
            const updatedDb = await response.json();
            setDatabase(updatedDb);
          }
        } catch (err) {
          console.error('Error deleting row:', err);
        }
      };

      // Handle add column
      const handleAddColumn = async (column: Partial<DatabaseColumn>) => {
        if (!databaseId) return;
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const company_id = user.company_id || '';
          const user_id = user.id || '';
          const role = user.role || '';

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/columns`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
              },
              body: JSON.stringify(column),
            }
          );

          if (response.ok) {
            const updatedDb = await response.json();
            setDatabase(updatedDb);
          }
        } catch (err) {
          console.error('Error adding column:', err);
        }
      };

      // Handle update column
      const handleUpdateColumn = async (columnId: string, updates: Partial<DatabaseColumn>) => {
        if (!databaseId) {
          console.error('handleUpdateColumn: No databaseId');
          return;
        }
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const company_id = user.company_id || '';
          const user_id = user.id || '';
          const role = user.role || '';

          console.log('Updating column:', { databaseId, columnId, updates });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/columns/${columnId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
              },
              body: JSON.stringify(updates),
            }
          );

          console.log('Column update response status:', response.status);

          if (response.ok) {
            const updatedDb = await response.json();
            console.log('Column update success, new database:', updatedDb);
            setDatabase(updatedDb);
          } else {
            const errorText = await response.text();
            console.error('Column update failed:', response.status, errorText);
          }
        } catch (err) {
          console.error('Error updating column:', err);
        }
      };

      // Handle delete column
      const handleDeleteColumn = async (columnId: string) => {
        if (!databaseId) return;
        try {
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const company_id = user.company_id || '';
          const user_id = user.id || '';
          const role = user.role || '';

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/databases/${databaseId}/columns/${columnId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token} ${company_id} ${user_id} ${role}`,
              },
            }
          );

          if (response.ok) {
            const updatedDb = await response.json();
            setDatabase(updatedDb);
          }
        } catch (err) {
          console.error('Error deleting column:', err);
        }
      };

      return (
        <div 
          contentEditable={false} 
          style={{ 
            userSelect: 'none',
            width: '100%',
            maxWidth: '100%',
            overflow: 'visible',
          }}
        >
          <InlineDatabaseView
            database={database}
            loading={loading}
            error={error || undefined}
            onAddRow={handleAddRow}
            onUpdateCell={handleUpdateCell}
            onDeleteRow={handleDeleteRow}
            onAddColumn={handleAddColumn}
            onUpdateColumn={handleUpdateColumn}
            onDeleteColumn={handleDeleteColumn}
            readOnly={false}
          />
        </div>
      );
    },
  }
);

/* ---------------------------------------------------
   SCHEMA: Create schema with custom blocks and inline content
--------------------------------------------------- */
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    database: DatabaseBlock(),
  },
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    pageMention: PageMention,
  },
});

/* ---------------------------------------------------
   CUSTOM DRAG HANDLE MENU COMPONENT
   Defined outside main component to avoid type inference issues
--------------------------------------------------- */
interface CustomDragHandleMenuContentProps {
  block: any;
  onTurnIntoDatabase: (block: any) => void;
  [key: string]: any;
}

const CustomDragHandleMenuContent: React.FC<CustomDragHandleMenuContentProps> = (props) => {
  const { block, onTurnIntoDatabase, ...menuProps } = props;
  const Components = useComponentsContext();
  const isTable = block?.type === 'table';
  
  return (
    <DragHandleMenu {...menuProps} block={block}>
      <RemoveBlockItem {...menuProps} block={block}>Delete</RemoveBlockItem>
      <BlockColorsItem {...menuProps} block={block}>Colors</BlockColorsItem>
      {isTable && Components && (
        <Components.Generic.Menu.Item
          onClick={() => onTurnIntoDatabase(block)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon fontSize="small" sx={{ color: '#667eea' }} />
            Turn into Database
          </Box>
        </Components.Generic.Menu.Item>
      )}
    </DragHandleMenu>
  );
};

interface BlockNoteEditorProps {
  initialBlocks: any[];
  isReadOnly: boolean;
  onBlocksChange: (blocks: any[]) => void;
  editorRef?: React.MutableRefObject<any>;
  currentPageId?: string; // For creating child pages (undefined for new pages)
  onImmediateSave?: () => void; // Callback to trigger immediate save (used after creating child page)
  onCreateParentPage?: () => Promise<string | null>; // Callback to create parent page first (returns new page ID)
  onDatabaseCreated?: (databaseId: string) => void; // Callback when a database is created from a table
}

/* ---------------------------------------------------
   SANITIZATION (your same logic, fully compatible)
--------------------------------------------------- */
const sanitizeBlocks = (blocks: any[]): PartialBlock[] | null => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  const sanitizeInlineContent = (item: any): any => {
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

  // Sanitize a single table cell - handles both formats:
  // 1. { type: "tableCell", content: [...], props: {...} } - stored format
  // 2. [...] - array of inline content - BlockNote format
  const sanitizeTableCell = (cell: any): any[] => {
    if (!cell) return [];
    
    // Format 1: Object with type "tableCell" (from database)
    if (cell && typeof cell === "object" && cell.type === "tableCell") {
      if (Array.isArray(cell.content)) {
        return cell.content.map(sanitizeInlineContent).filter(Boolean);
      }
      return [];
    }
    
    // Format 2: Direct array of inline content (BlockNote native)
    if (Array.isArray(cell)) {
      return cell.map(sanitizeInlineContent).filter(Boolean);
    }
    
    return [];
  };

  // Sanitize table content (rows with cells containing inline content)
  const sanitizeTableContent = (content: any): any => {
    if (!content || typeof content !== "object") {
      return { type: "tableContent", rows: [] };
    }
    
    // Handle already-structured tableContent
    if (content.type === "tableContent" && Array.isArray(content.rows)) {
      const sanitizedContent: any = {
        type: "tableContent",
        rows: content.rows.map((row: any) => {
          if (!row || typeof row !== "object") {
            return { cells: [] };
          }
          return {
            cells: Array.isArray(row.cells)
              ? row.cells.map(sanitizeTableCell)
              : [],
          };
        }),
      };
      
      // Preserve columnWidths if present
      if (Array.isArray(content.columnWidths)) {
        sanitizedContent.columnWidths = content.columnWidths;
      }
      
      return sanitizedContent;
    }
    
    // Handle raw array format (rows directly as array)
    if (Array.isArray(content)) {
      return {
        type: "tableContent",
        rows: content.map((row: any) => {
          if (!row || typeof row !== "object") {
            return { cells: [] };
          }
          return {
            cells: Array.isArray(row.cells)
              ? row.cells.map(sanitizeTableCell)
              : [],
          };
        }),
      };
    }
    
    return { type: "tableContent", rows: [] };
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

  const sanitizeBlock = (block: any): any => {
    if (!block || typeof block !== "object") return null;

    const blockType = block.type || "paragraph";
    
    // Handle database blocks - preserve databaseId and title props
    if (blockType === "database") {
      return {
        id: block.id || undefined,
        type: "database",
        props: {
          databaseId: block.props?.databaseId || "",
          title: block.props?.title || "Untitled Database",
        },
        content: undefined,
        children: [],
      };
    }
    
    // Handle table blocks specially - they use tableContent instead of array of inline content
    if (blockType === "table") {
      return {
        id: block.id || undefined,
        type: "table",
        props: sanitizeProps(block.props),
        content: sanitizeTableContent(block.content),
        children: Array.isArray(block.children)
          ? block.children.map(sanitizeBlock).filter(Boolean)
          : [],
      };
    }
    
    // Handle blocks with no content (like images, file, video, audio)
    const noContentTypes = ["image", "file", "video", "audio", "column", "columnList"];
    if (noContentTypes.includes(blockType)) {
      return {
        id: block.id || undefined,
        type: blockType,
        props: sanitizeProps(block.props),
        content: undefined,
        children: Array.isArray(block.children)
          ? block.children.map(sanitizeBlock).filter(Boolean)
          : [],
      };
    }

    // Standard blocks with inline content array
    return {
      id: block.id || undefined,
      type: blockType,
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
  onDatabaseCreated,
}: BlockNoteEditorProps) {
  
  const router = useRouter();
  const [creatingPage, setCreatingPage] = useState(false);
  
  // Turn into Database state
  const [selectedTableBlock, setSelectedTableBlock] = useState<any>(null);
  const [databaseDialogOpen, setDatabaseDialogOpen] = useState(false);
  
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

  /* Handle Turn into Database from Side Menu */
  const handleTurnIntoDatabase = useCallback((block: any) => {
    if (!block || block.type !== 'table') {
      toast.error('Please select a table block');
      return;
    }
    
    if (!currentPageId) {
      toast.error('Please save the page first before converting to database');
      return;
    }
    
    setSelectedTableBlock(block);
    setDatabaseDialogOpen(true);
  }, [currentPageId]);

  /* Handle database creation success - replace table with database block */
  const handleDatabaseCreated = useCallback((databaseId: string, title: string) => {
    if (editor && selectedTableBlock) {
      try {
        // Replace the table block with a database block
        editor.updateBlock(selectedTableBlock.id, {
          type: "database",
          props: {
            databaseId: databaseId,
            title: title || "Untitled Database",
          },
        } as any);
        
        // Notify parent about block changes
        onBlocksChange(editor.document);
        
        // Trigger immediate save to persist the change
        if (onImmediateSave) {
          setTimeout(() => {
            onImmediateSave();
          }, 100);
        }
        
        toast.success('Table converted to database successfully!');
      } catch (err) {
        console.error('Failed to replace table block:', err);
        toast.error('Database created but failed to update editor');
      }
    }
    
    setDatabaseDialogOpen(false);
    setSelectedTableBlock(null);
    
    // Notify parent
    if (onDatabaseCreated) {
      onDatabaseCreated(databaseId);
    }
  }, [editor, selectedTableBlock, onBlocksChange, onImmediateSave, onDatabaseCreated]);

  /* Custom Drag Handle Menu with Turn into Database option */
  // Using a simple functional component approach to avoid complex type issues
  const renderCustomDragHandleMenu = (props: any) => {
    return <CustomDragHandleMenuContent {...props} onTurnIntoDatabase={handleTurnIntoDatabase} />;
  };

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

        /* Database block scroll fix */
        .bn-block-content[data-content-type="database"],
        [data-block-type="database"],
        [data-content-type="database"] {
          overflow: visible !important;
          max-width: 100% !important;
        }
        
        .bn-block-content[data-content-type="database"] > div,
        [data-block-type="database"] > div {
          overflow: visible !important;
        }
      `}</style>

      <BlockNoteView 
        editor={editor as any} 
        theme="light"
        slashMenu={false}
        sideMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor as any), query)
          }
        />
        <SideMenuController
          sideMenu={(props) => (
            <SideMenu {...props} dragHandleMenu={(menuProps: any) => renderCustomDragHandleMenu(menuProps)} />
          )}
        />
      </BlockNoteView>

      {/* Turn into Database Dialog */}
      {selectedTableBlock && currentPageId && (
        <TurnIntoDatabaseDialog
          open={databaseDialogOpen}
          onClose={() => {
            setDatabaseDialogOpen(false);
            setSelectedTableBlock(null);
          }}
          pageId={currentPageId}
          blockId={selectedTableBlock.id || ''}
          tableData={selectedTableBlock.content}
          onSuccess={handleDatabaseCreated}
        />
      )}
      
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
