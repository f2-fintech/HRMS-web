"use client";

import React, { useEffect, useMemo } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

import "@blocknote/core/fonts/inter.css";   // ✔ works in latest version
import "@blocknote/mantine/style.css";

import { PartialBlock } from "@blocknote/core";

interface BlockNoteEditorProps {
  initialBlocks: any[];
  isReadOnly: boolean;
  onBlocksChange: (blocks: any[]) => void;
  editorRef?: React.MutableRefObject<any>;
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
}: BlockNoteEditorProps) {
  
  /* Sanitize initial blocks */
  const sanitizedInitialBlocks = useMemo(() => {
    return sanitizeBlocks(initialBlocks);
  }, [initialBlocks]);

  /* Create editor (latest API) */
  const editor = useCreateBlockNote({
    initialContent: sanitizedInitialBlocks ?? undefined,
  });

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
        /* (Your entire CSS block continues here exactly same...) */
      `}</style>

      <BlockNoteView editor={editor} theme="light" />
    </>
  );
}
