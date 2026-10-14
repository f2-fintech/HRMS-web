'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Chip } from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';

interface PageMentionInlineProps {
  pageId: string;
  pageTitle: string;
  pageIcon?: string;
}

export default function PageMentionInline({
  pageId,
  pageTitle,
  pageIcon,
}: PageMentionInlineProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/pages/${pageId}`);
  };

  return (
    <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
      <Chip
        icon={pageIcon ? <span style={{ fontSize: '14px' }}>{pageIcon}</span> : <ArticleIcon fontSize="small" />}
        label={pageTitle}
        size="small"
        clickable
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          fontSize: '0.875rem',
          height: '24px',
          mx: 0.5,
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          '&:hover': {
            backgroundColor: 'primary.main',
            color: 'white',
            '& .MuiChip-icon': {
              color: 'white',
            },
          },
          '& .MuiChip-label': {
            px: 1,
          },
        }}
      />
    </span>
  );
}
