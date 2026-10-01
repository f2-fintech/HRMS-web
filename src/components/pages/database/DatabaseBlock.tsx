'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux/store';
import {
  fetchDatabasesByPage,
  addColumn,
  updateColumn,
  deleteColumn,
  addRow,
  updateCells,
  deleteRow,
  addView,
  updateView,
  deleteView,
  setCurrentDatabase,
} from '../../../redux/features/databases/databasesSlice';
import type { Database, DatabaseColumn, DatabaseView, CellValue } from './types';
import DatabaseTableView from './DatabaseTableView';
import DatabaseToolbar from './DatabaseToolbar';

interface DatabaseBlockProps {
  pageId: string;
  databaseId?: string;
  readOnly?: boolean;
}

const DatabaseBlock: React.FC<DatabaseBlockProps> = ({
  pageId,
  databaseId,
  readOnly = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentDatabase, loading, error } = useSelector((state: RootState) => state.databases);
  const [activeViewId, setActiveViewId] = useState<string>('');

  // Fetch database on mount
  useEffect(() => {
    if (pageId) {
      dispatch(fetchDatabasesByPage(pageId));
    }

    return () => {
      dispatch(setCurrentDatabase(null));
    };
  }, [dispatch, pageId]);

  // Set active view when database loads
  useEffect(() => {
    if (currentDatabase && currentDatabase.views.length > 0 && !activeViewId) {
      setActiveViewId(currentDatabase.views[0].id);
    }
  }, [currentDatabase, activeViewId]);

  // Handle add column
  const handleAddColumn = useCallback(async (column: Partial<DatabaseColumn>) => {
    if (!currentDatabase) return;
    await dispatch(addColumn({
      databaseId: currentDatabase._id,
      column: column as any,
    }));
  }, [dispatch, currentDatabase]);

  // Handle update column
  const handleUpdateColumn = useCallback(async (columnId: string, updates: Partial<DatabaseColumn>) => {
    if (!currentDatabase) return;
    await dispatch(updateColumn({
      databaseId: currentDatabase._id,
      columnId,
      data: updates as any,
    }));
  }, [dispatch, currentDatabase]);

  // Handle delete column
  const handleDeleteColumn = useCallback(async (columnId: string) => {
    if (!currentDatabase) return;
    await dispatch(deleteColumn({
      databaseId: currentDatabase._id,
      columnId,
    }));
  }, [dispatch, currentDatabase]);

  // Handle add row
  const handleAddRow = useCallback(async () => {
    if (!currentDatabase) return;
    await dispatch(addRow({
      databaseId: currentDatabase._id,
      cells: {},
    }));
  }, [dispatch, currentDatabase]);

  // Handle update cell
  const handleUpdateCell = useCallback(async (rowId: string, columnId: string, value: any) => {
    if (!currentDatabase) return;
    // Convert to CellValue format
    const cellValue: CellValue = typeof value === 'string' 
      ? { text: value }
      : typeof value === 'number'
      ? { number: value }
      : typeof value === 'boolean'
      ? { checked: value }
      : { text: String(value) };
    
    await dispatch(updateCells({
      databaseId: currentDatabase._id,
      rowId,
      cells: { [columnId]: cellValue },
    }));
  }, [dispatch, currentDatabase]);

  // Handle delete row
  const handleDeleteRow = useCallback(async (rowId: string) => {
    if (!currentDatabase) return;
    await dispatch(deleteRow({
      databaseId: currentDatabase._id,
      rowId,
    }));
  }, [dispatch, currentDatabase]);

  // Handle add view
  const handleAddView = useCallback(async (view: Partial<DatabaseView>) => {
    if (!currentDatabase) return;
    const result = await dispatch(addView({
      databaseId: currentDatabase._id,
      view: view as any,
    }));
    if (addView.fulfilled.match(result)) {
      // Switch to new view
      const newViews = result.payload.views;
      if (newViews && newViews.length > 0) {
        setActiveViewId(newViews[newViews.length - 1].id);
      }
    }
  }, [dispatch, currentDatabase]);

  // Handle update view
  const handleUpdateView = useCallback(async (viewId: string, updates: Partial<DatabaseView>) => {
    if (!currentDatabase) return;
    await dispatch(updateView({
      databaseId: currentDatabase._id,
      viewId,
      data: updates as any,
    }));
  }, [dispatch, currentDatabase]);

  // Handle delete view
  const handleDeleteView = useCallback(async (viewId: string) => {
    if (!currentDatabase) return;
    await dispatch(deleteView({
      databaseId: currentDatabase._id,
      viewId,
    }));
    // Switch to first remaining view
    if (activeViewId === viewId && currentDatabase.views.length > 1) {
      const remainingViews = currentDatabase.views.filter(v => v.id !== viewId);
      if (remainingViews.length > 0) {
        setActiveViewId(remainingViews[0].id);
      }
    }
  }, [dispatch, currentDatabase, activeViewId]);

  // Loading state
  if (loading && !currentDatabase) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error && !currentDatabase) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // No database state
  if (!currentDatabase) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>No database found for this page</Typography>
      </Box>
    );
  }

  const activeView = currentDatabase.views.find(v => v.id === activeViewId) || currentDatabase.views[0];

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {/* Toolbar */}
      <DatabaseToolbar
        database={currentDatabase as unknown as Database}
        activeViewId={activeViewId || activeView?.id || ''}
        onViewChange={setActiveViewId}
        onAddView={handleAddView}
        onUpdateView={handleUpdateView}
        onDeleteView={handleDeleteView}
        readOnly={readOnly}
      />

      {/* View content */}
      {activeView && (
        <>
          {activeView.type === 'table' && (
            <DatabaseTableView
              database={currentDatabase as unknown as Database}
              view={activeView as unknown as DatabaseView}
              onAddColumn={handleAddColumn}
              onUpdateColumn={handleUpdateColumn}
              onDeleteColumn={handleDeleteColumn}
              onAddRow={handleAddRow}
              onUpdateCell={handleUpdateCell}
              onDeleteRow={handleDeleteRow}
              readOnly={readOnly}
            />
          )}

          {activeView.type === 'kanban' && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>Kanban view coming soon...</Typography>
            </Box>
          )}

          {activeView.type === 'list' && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>List view coming soon...</Typography>
            </Box>
          )}

          {activeView.type === 'calendar' && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>Calendar view coming soon...</Typography>
            </Box>
          )}

          {activeView.type === 'gallery' && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography>Gallery view coming soon...</Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default DatabaseBlock;
