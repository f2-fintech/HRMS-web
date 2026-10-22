'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Breadcrumbs,
  Link,
  Typography,
  Skeleton,
  Box,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Article as ArticleIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import type { AppDispatch, RootState } from '@/redux/store';
import { fetchBreadcrumb } from '@/redux/features/pages/pagesSlice';

interface PageBreadcrumbProps {
  pageId?: string;
  currentTitle?: string;
}

export default function PageBreadcrumb({ pageId, currentTitle }: PageBreadcrumbProps) {
  const router = useRouter();
  const dispatch: AppDispatch = useDispatch();
  const { breadcrumb, breadcrumbLoading } = useSelector((state: RootState) => state.pages);

  useEffect(() => {
    if (pageId && pageId !== 'new') {
      dispatch(fetchBreadcrumb(pageId));
    }
  }, [dispatch, pageId]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Loading state
  if (breadcrumbLoading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="text" width={400} height={32} />
      </Box>
    );
  }

  // For new pages or when no pageId
  if (!pageId || pageId === 'new') {
    return (
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
            handleNavigate('/');
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
            handleNavigate('/pages');
          }}
        >
          <ArticleIcon fontSize="small" />
          Pages
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {currentTitle || 'New Page'}
        </Typography>
      </Breadcrumbs>
    );
  }

  // Show breadcrumb trail from API
  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      {/* Dashboard */}
      <Link
        underline="hover"
        color="inherit"
        href="/"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault();
          handleNavigate('/');
        }}
      >
        <HomeIcon fontSize="small" />
        Dashboard
      </Link>

      {/* Pages root */}
      <Link
        underline="hover"
        color="inherit"
        href="/pages"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault();
          handleNavigate('/pages');
        }}
      >
        <ArticleIcon fontSize="small" />
        Pages
      </Link>

      {/* Ancestor pages from breadcrumb */}
      {breadcrumb.map((page, index) => {
        const isLast = index === breadcrumb.length - 1;
        
        return isLast ? (
          <Typography 
            key={page._id} 
            color="text.primary" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {page.icon && <span>{page.icon}</span>}
            {page.title}
            {page.depth !== undefined && page.depth > 0 && (
              <Chip 
                label={`L${page.depth}`} 
                size="small" 
                sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }}
              />
            )}
          </Typography>
        ) : (
          <Link
            key={page._id}
            underline="hover"
            color="inherit"
            href={`/pages/${page._id}`}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              cursor: 'pointer',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onClick={(e) => {
              e.preventDefault();
              handleNavigate(`/pages/${page._id}`);
            }}
          >
            {page.icon && <span>{page.icon}</span>}
            {page.title}
            {page.depth !== undefined && page.depth > 0 && (
              <Chip 
                label={`L${page.depth}`} 
                size="small" 
                sx={{ height: 18, fontSize: '0.65rem', ml: 0.5 }}
              />
            )}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
