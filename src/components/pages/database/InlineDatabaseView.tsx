'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  CircularProgress,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  Skeleton,
  Paper,
  Fade,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import type { Database, DatabaseColumn, DatabaseRow, CellValue, DatabaseView } from './types';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface InlineDatabaseViewProps {
  database: Database | null;
  loading?: boolean;
  error?: string;
  onAddRow?: () => Promise<void>;
  onUpdateCell?: (rowId: string, columnId: string, value: any) => Promise<void>;
  onDeleteRow?: (rowId: string) => Promise<void>;
  onAddColumn?: (column: Partial<DatabaseColumn>) => Promise<void>;
  onUpdateColumn?: (columnId: string, updates: Partial<DatabaseColumn>) => Promise<void>;
  onDeleteColumn?: (columnId: string) => Promise<void>;
  readOnly?: boolean;
}

const InlineDatabaseView: React.FC<InlineDatabaseViewProps> = ({
  database,
  loading = false,
  error,
  onAddRow,
  onUpdateCell,
  onDeleteRow,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  readOnly = false,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [pendingCellUpdate, setPendingCellUpdate] = useState<{ rowId: string; columnId: string; value: string } | null>(null);
  const [pendingColumnUpdate, setPendingColumnUpdate] = useState<{ columnId: string; name: string } | null>(null);


  console.log("database", database)
  // Refs for debounce timers
  const cellDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const columnDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced cell update
  const debouncedCellValue = useDebounce(pendingCellUpdate, 500);

  // Debounced column name update
  const debouncedColumnName = useDebounce(pendingColumnUpdate, 500);

  // Effect to handle debounced cell updates
  useEffect(() => {
    if (debouncedCellValue && onUpdateCell) {
      onUpdateCell(debouncedCellValue.rowId, debouncedCellValue.columnId, debouncedCellValue.value);
    }
  }, [debouncedCellValue, onUpdateCell]);

  // Effect to handle debounced column name updates
  useEffect(() => {
    if (debouncedColumnName && onUpdateColumn) {
      onUpdateColumn(debouncedColumnName.columnId, { name: debouncedColumnName.name });
    }
  }, [debouncedColumnName, onUpdateColumn]);

  // Get cell value as string for display
  const getCellDisplayValue = useCallback((row: DatabaseRow, columnId: string): string => {
    const cells = row.cells as unknown as Record<string, CellValue>;
    const cell = cells[columnId];
    if (!cell) return '';

    if (cell.text !== undefined) return cell.text;
    if (cell.number !== undefined) return String(cell.number);
    if (cell.checked !== undefined) return cell.checked ? '✓' : '';
    if (cell.date) return cell.date;
    if (cell.url) return cell.url;
    if (cell.email) return cell.email;
    if (cell.phone) return cell.phone;

    return '';
  }, []);

  // Handle cell click to start editing
  const handleCellClick = useCallback((rowId: string, columnId: string, currentValue: string) => {
    if (readOnly) return;
    setEditingCell({ rowId, columnId });
    setEditValue(currentValue);
  }, [readOnly]);

  // Handle cell value change with debounce
  const handleCellChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    if (editingCell) {
      setPendingCellUpdate({
        rowId: editingCell.rowId,
        columnId: editingCell.columnId,
        value: newValue,
      });
    }
  }, [editingCell]);

  // Handle cell blur to save
  const handleCellBlur = useCallback(async () => {
    // Immediately save on blur if there's an editing cell (even if value is empty)
    if (editingCell && onUpdateCell) {
      console.log('Saving cell on blur:', { rowId: editingCell.rowId, columnId: editingCell.columnId, value: editValue });
      await onUpdateCell(editingCell.rowId, editingCell.columnId, editValue);
    }
    setEditingCell(null);
    setEditValue('');
    setPendingCellUpdate(null);
  }, [editingCell, editValue, onUpdateCell]);

  // Handle key press in cell
  const handleCellKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  }, [handleCellBlur]);

  // Handle column header click
  const handleColumnClick = useCallback((event: React.MouseEvent<HTMLElement>, columnId: string) => {
    if (readOnly) return;
    setColumnMenuAnchor(event.currentTarget);
    setSelectedColumn(columnId);
  }, [readOnly]);

  // Handle column header double-click to edit name
  const handleColumnDoubleClick = useCallback((columnId: string, currentName: string) => {
    if (readOnly) return;
    setEditingColumn(columnId);
    setEditColumnName(currentName);
  }, [readOnly]);

  // Handle column name change with debounce
  const handleColumnNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setEditColumnName(newName);

    if (editingColumn && newName.trim()) {
      setPendingColumnUpdate({
        columnId: editingColumn,
        name: newName,
      });
    }
  }, [editingColumn]);

  // Handle column name blur
  const handleColumnNameBlur = useCallback(async () => {
    // Immediately save on blur if there's a pending update
    if (editingColumn && onUpdateColumn && editColumnName.trim()) {
      await onUpdateColumn(editingColumn, { name: editColumnName });
    }
    setEditingColumn(null);
    setEditColumnName('');
    setPendingColumnUpdate(null);
  }, [editingColumn, editColumnName, onUpdateColumn]);

  // Handle column name key press
  const handleColumnNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleColumnNameBlur();
    } else if (e.key === 'Escape') {
      setEditingColumn(null);
      setEditColumnName('');
      setPendingColumnUpdate(null);
    }
  }, [handleColumnNameBlur]);

  // Handle add new row
  const handleAddRow = useCallback(async () => {
    if (onAddRow) {
      await onAddRow();
    }
  }, [onAddRow]);

  // Handle delete column
  const handleDeleteColumn = useCallback(async () => {
    if (selectedColumn && onDeleteColumn) {
      await onDeleteColumn(selectedColumn);
    }
    setColumnMenuAnchor(null);
    setSelectedColumn(null);
  }, [selectedColumn, onDeleteColumn]);

  // Handle add column
  const handleAddColumn = useCallback(async () => {
    if (onAddColumn) {
      await onAddColumn({
        name: `Column ${(database?.columns.length || 0) + 1}`,
        type: 'text',
      });
    }
  }, [onAddColumn, database?.columns.length]);

  // Loading state
  if (loading && !database) {
    return (
      <Paper sx={{ my: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {/* Header skeleton */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={40} height={36} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        </Box>
        {/* Table skeleton */}
        <Box sx={{ p: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="text" height={48} sx={{ mb: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  // Error state
  if (error) {
    return (
      <Paper sx={{ my: 2, p: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.lighter' }}>
        <Typography color="error.main" variant="body2">
          <strong>Error:</strong> {error}
        </Typography>
      </Paper>
    );
  }

  // No database state
  if (!database) {
    return (
      <Paper sx={{ my: 2, p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary" variant="body2">
          Database not found
        </Typography>
      </Paper>
    );
  }

  const columns = database.columns || [];
  const rows = database.rows || [];
  const titleColumn = columns.find(c => c.name?.toLowerCase() === 'title' || c.name?.toLowerCase() === 'name') || columns[0];

  // Calculate table width based on columns
  const tableMinWidth = Math.max(600, columns.length * 180 + 60);

  return (
    <Paper
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'visible', // Changed from 'hidden' to allow scroll
        bgcolor: 'background.paper',
        my: 2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        },
      }}
      contentEditable={false}
    >
      {/* Header with title and toolbar */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
        {/* Database Title */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: -0.5 }}>
            {database.title || 'Untitled Database'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {rows.length} {rows.length === 1 ? 'record' : 'records'}
          </Typography>
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {/* View tabs */}
          <Box sx={{ display: 'flex', gap: 0.5, mr: 2 }}>
            <Chip
              label="Table View"
              size="small"
              color="primary"
              variant="filled"
              sx={{
                fontWeight: 600,
                height: 32,
                '& .MuiChip-label': {
                  px: 1.5,
                  fontSize: '0.8rem',
                },
              }}
            />
          </Box>

          {/* Actions */}
          <Tooltip title="Filter records">
            <IconButton size="small" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sort records">
            <IconButton size="small" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              <SortIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Search">
            <IconButton size="small" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Full screen">
            <IconButton size="small" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              <OpenInFullIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton size="small" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* New button */}
          {!readOnly && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              sx={{
                ml: 'auto',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              New Record
            </Button>
          )}
        </Box>
      </Box>

      {/* Empty state */}
      {rows.length === 0 && (
        <Box
          sx={{
            py: 6,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography variant="body2" sx={{ mb: 2 }}>
            No records yet
          </Typography>
          {!readOnly && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              sx={{ textTransform: 'none' }}
            >
              Create first record
            </Button>
          )}
        </Box>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'visible',
            width: '100%',
            position: 'relative',
            pb: 1, // padding for scrollbar
            '&::-webkit-scrollbar': {
              height: 10,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 5,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              },
            },
          }}
        >
          <table style={{
            borderCollapse: 'collapse',
            width: tableMinWidth,
            minWidth: tableMinWidth,
            tableLayout: 'fixed',
          }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                {/* Title column with icon indicator */}
                {columns.map((col, index) => {
                  const isEditingThisColumn = editingColumn === col.id;

                  return (
                    <th
                      key={col.id}
                      onClick={(e) => !isEditingThisColumn && handleColumnClick(e, col.id)}
                      onDoubleClick={() => handleColumnDoubleClick(col.id, col.name)}
                      style={{
                        padding: isEditingThisColumn ? '8px 10px' : '12px 14px',
                        textAlign: 'left',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'rgba(0, 0, 0, 0.6)',
                        cursor: readOnly ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                        width: col.width || (index === 0 ? 200 : 150),
                        minWidth: col.width || (index === 0 ? 200 : 150),
                        maxWidth: col.width || (index === 0 ? 300 : 250),
                        transition: 'background-color 0.2s ease',
                        backgroundColor: isEditingThisColumn ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!readOnly && !isEditingThisColumn) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isEditingThisColumn) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {isEditingThisColumn ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editColumnName}
                          onChange={handleColumnNameChange}
                          onBlur={handleColumnNameBlur}
                          onKeyDown={handleColumnNameKeyDown}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              '& fieldset': {
                                borderColor: 'primary.main',
                              },
                              '& input': {
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                                padding: '6px 8px',
                              },
                            },
                          }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <TextFieldsIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.6 }} />
                          <span style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>{col.name}</span>
                          {!readOnly && (
                            <Tooltip title="Double-click to edit">
                              <EditIcon sx={{ fontSize: 12, color: 'text.secondary', opacity: 0.4, ml: 0.5 }} />
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </th>
                  );
                })}
                {/* Add column button */}
                {!readOnly && (
                  <th
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                      width: 48,
                    }}
                  >
                    <Tooltip title="Add column">
                      <IconButton
                        size="small"
                        onClick={handleAddColumn}
                        sx={{
                          opacity: 0.5,
                          transition: 'opacity 0.2s ease',
                          '&:hover': { opacity: 1, bgcolor: 'action.hover' },
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const isRowSelected = selectedRows.has(row.id);
                const isRowHovered = hoveredRow === row.id;

                return (
                  <tr
                    key={row.id}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                      backgroundColor: isRowSelected
                        ? 'rgba(99, 102, 241, 0.08)'
                        : isRowHovered
                          ? 'rgba(0, 0, 0, 0.02)'
                          : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {columns.map((col, colIndex) => {
                      const cellValue = getCellDisplayValue(row, col.id);
                      const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === col.id;
                      const isFirstColumn = colIndex === 0;

                      return (
                        <td
                          key={col.id}
                          onClick={() => handleCellClick(row.id, col.id, cellValue)}
                          style={{
                            padding: isEditing ? 0 : '12px 14px',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                            fontSize: '0.875rem',
                            cursor: readOnly ? 'default' : 'text',
                            backgroundColor: isEditing ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            width: col.width || (isFirstColumn ? 200 : 150),
                            minWidth: col.width || (isFirstColumn ? 200 : 150),
                            maxWidth: col.width || (isFirstColumn ? 300 : 250),
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          {isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={editValue}
                              onChange={handleCellChange}
                              onBlur={handleCellBlur}
                              onKeyDown={handleCellKeyDown}
                              autoFocus
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  fontSize: '0.875rem',
                                  '& fieldset': {
                                    borderColor: 'primary.main',
                                  },
                                },
                              }}
                            />
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isFirstColumn && (
                                <InsertDriveFileOutlinedIcon
                                  sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0, opacity: 0.5 }}
                                />
                              )}
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: cellValue ? 'inherit' : 'rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                {cellValue || (isFirstColumn ? '—' : '—')}
                              </span>
                            </Box>
                          )}
                        </td>
                      );
                    })}
                    {!readOnly && (
                      <td style={{ width: 48, padding: '12px 14px' }}>
                        <Tooltip title="Delete record">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteRow?.(row.id)}
                            sx={{
                              opacity: isRowHovered ? 1 : 0.3,
                              transition: 'opacity 0.2s ease',
                              color: 'error.main',
                              '&:hover': {
                                bgcolor: 'error.lighter',
                              },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      )}

      {/* Add new row button at bottom */}
      {!readOnly && rows.length > 0 && (
        <Box
          onClick={handleAddRow}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            color: 'text.secondary',
            borderTop: '1px solid',
            borderColor: 'divider',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'primary.main',
            },
          }}
        >
          <AddIcon fontSize="small" sx={{ opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Add record
          </Typography>
        </Box>
      )}

      {/* Column menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => {
          setColumnMenuAnchor(null);
          setSelectedColumn(null);
        }}
        PaperProps={{
          sx: {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            mt: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedColumn) {
              const col = columns.find(c => c.id === selectedColumn);
              if (col) {
                handleColumnDoubleClick(selectedColumn, col.name);
              }
            }
            setColumnMenuAnchor(null);
            setSelectedColumn(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Rename column
        </MenuItem>
        <MenuItem
          onClick={handleDeleteColumn}
          sx={{
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          Delete column
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default InlineDatabaseView;
