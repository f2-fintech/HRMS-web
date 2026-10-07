'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Checkbox,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Select,
  FormControl,
  OutlinedInput,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import NumbersIcon from '@mui/icons-material/Numbers';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import TagIcon from '@mui/icons-material/Tag';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import NotesIcon from '@mui/icons-material/Notes';
import type { Database, DatabaseColumn, DatabaseRow, ColumnType, DatabaseView } from './types';
import { SELECT_COLORS, COLUMN_TYPE_OPTIONS } from './types';

interface DatabaseTableViewProps {
  database: Database;
  view: DatabaseView;
  onAddColumn: (column: Partial<DatabaseColumn>) => void;
  onUpdateColumn: (columnId: string, updates: Partial<DatabaseColumn>) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddRow: () => void;
  onUpdateCell: (rowId: string, columnId: string, value: any) => void;
  onDeleteRow: (rowId: string) => void;
  readOnly?: boolean;
}

const DatabaseTableView: React.FC<DatabaseTableViewProps> = ({
  database,
  view,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onAddRow,
  onUpdateCell,
  onDeleteRow,
  readOnly = false,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedColumn, setSelectedColumn] = useState<DatabaseColumn | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [columnNameValue, setColumnNameValue] = useState('');
  const [typeMenuAnchor, setTypeMenuAnchor] = useState<null | HTMLElement>(null);

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    if (!view.hiddenColumns || view.hiddenColumns.length === 0) {
      return database.columns;
    }
    return database.columns.filter(col => !view.hiddenColumns?.includes(col.id));
  }, [database.columns, view.hiddenColumns]);

  // Get cell value
  const getCellValue = useCallback((row: DatabaseRow, columnId: string) => {
    const cell = row.cells.find(c => c.columnId === columnId);
    return cell?.value ?? '';
  }, []);

  // Handle cell click
  const handleCellClick = useCallback((rowId: string, columnId: string, currentValue: any) => {
    if (readOnly) return;
    setEditingCell({ rowId, columnId });
    setEditValue(currentValue);
  }, [readOnly]);

  // Handle cell blur
  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      onUpdateCell(editingCell.rowId, editingCell.columnId, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onUpdateCell]);

  // Handle column header click
  const handleColumnHeaderClick = useCallback((event: React.MouseEvent<HTMLElement>, column: DatabaseColumn) => {
    if (readOnly) return;
    setSelectedColumn(column);
    setColumnMenuAnchor(event.currentTarget);
  }, [readOnly]);

  // Handle column menu close
  const handleColumnMenuClose = useCallback(() => {
    setColumnMenuAnchor(null);
    setSelectedColumn(null);
  }, []);

  // Handle column name edit
  const handleStartColumnNameEdit = useCallback((column: DatabaseColumn) => {
    setEditingColumnName(column.id);
    setColumnNameValue(column.name);
    handleColumnMenuClose();
  }, [handleColumnMenuClose]);

  // Handle column name save
  const handleSaveColumnName = useCallback(() => {
    if (editingColumnName && columnNameValue.trim()) {
      onUpdateColumn(editingColumnName, { name: columnNameValue.trim() });
    }
    setEditingColumnName(null);
    setColumnNameValue('');
  }, [editingColumnName, columnNameValue, onUpdateColumn]);

  // Render cell based on column type
  const renderCell = useCallback((column: DatabaseColumn, row: DatabaseRow) => {
    const value = getCellValue(row, column.id);
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;

    if (isEditing) {
      return renderCellEditor(column, value);
    }

    switch (column.type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={Boolean(value)}
            onChange={(e) => onUpdateCell(row.id, column.id, e.target.checked)}
            disabled={readOnly}
            size="small"
          />
        );

      case 'select':
        const option = column.options?.find(o => o.id === value);
        if (!option) return null;
        const colorStyle = SELECT_COLORS.find(c => c.name === option.color) || SELECT_COLORS[0];
        return (
          <Chip
            label={option.label}
            size="small"
            className={`${colorStyle.bg} ${colorStyle.text}`}
          />
        );

      case 'multi-select':
        const values = Array.isArray(value) ? value : [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {values.map((v: string) => {
              const opt = column.options?.find(o => o.id === v);
              if (!opt) return null;
              const color = SELECT_COLORS.find(c => c.name === opt.color) || SELECT_COLORS[0];
              return (
                <Chip
                  key={v}
                  label={opt.label}
                  size="small"
                  className={`${color.bg} ${color.text}`}
                />
              );
            })}
          </Box>
        );

      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';

      case 'url':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : '';

      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : '';

      case 'phone':
        return value ? (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : '';

      default:
        return String(value || '');
    }
  }, [editingCell, getCellValue, onUpdateCell, readOnly]);

  // Render cell editor
  const renderCellEditor = useCallback((column: DatabaseColumn, currentValue: any) => {
    switch (column.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <Select
              value={editValue || ''}
              onChange={(e) => {
                setEditValue(e.target.value);
                onUpdateCell(editingCell!.rowId, editingCell!.columnId, e.target.value);
                setEditingCell(null);
              }}
              autoFocus
              open
              onClose={() => setEditingCell(null)}
            >
              {column.options?.map(opt => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multi-select':
        const selectedValues = Array.isArray(editValue) ? editValue : [];
        return (
          <FormControl fullWidth size="small">
            <Select
              multiple
              value={selectedValues}
              onChange={(e) => {
                const val = e.target.value;
                setEditValue(val);
              }}
              onClose={() => {
                handleCellBlur();
              }}
              autoFocus
              open
              input={<OutlinedInput />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => {
                    const opt = column.options?.find(o => o.id === value);
                    return opt ? <Chip key={value} label={opt.label} size="small" /> : null;
                  })}
                </Box>
              )}
            >
              {column.options?.map(opt => (
                <MenuItem key={opt.id} value={opt.id}>
                  <Checkbox checked={selectedValues.includes(opt.id)} size="small" />
                  <ListItemText primary={opt.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            type="date"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            autoFocus
            size="small"
            fullWidth
          />
        );

      case 'number':
        return (
          <TextField
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleCellBlur()}
            autoFocus
            size="small"
            fullWidth
          />
        );

      default:
        return (
          <TextField
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleCellBlur()}
            autoFocus
            size="small"
            fullWidth
          />
        );
    }
  }, [editValue, editingCell, handleCellBlur, onUpdateCell]);

  // Get column type icon
  const getColumnTypeIcon = useCallback((type: ColumnType) => {
    switch (type) {
      case 'text': return <TextFieldsIcon fontSize="small" />;
      case 'number': return <NumbersIcon fontSize="small" />;
      case 'select': return <ArrowDropDownIcon fontSize="small" />;
      case 'multi-select': return <TagIcon fontSize="small" />;
      case 'date': return <CalendarTodayIcon fontSize="small" />;
      case 'checkbox': return <CheckBoxIcon fontSize="small" />;
      case 'url': return <LinkIcon fontSize="small" />;
      case 'email': return <EmailIcon fontSize="small" />;
      case 'phone': return <PhoneIcon fontSize="small" />;
      case 'person': return <PersonIcon fontSize="small" />;
      case 'file': return <AttachFileIcon fontSize="small" />;
      case 'rich-text': return <NotesIcon fontSize="small" />;
      default: return <TextFieldsIcon fontSize="small" />;
    }
  }, []);

  return (
    <Box sx={{ width: '100%', overflow: 'auto' }}>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {/* Row actions column */}
              <TableCell sx={{ width: 40, p: 0.5 }} />
              
              {/* Data columns */}
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{
                    minWidth: column.width || 150,
                    cursor: readOnly ? 'default' : 'pointer',
                    '&:hover': readOnly ? {} : { bgcolor: 'action.hover' },
                    borderRight: '1px solid',
                    borderColor: 'divider',
                  }}
                  onClick={(e) => handleColumnHeaderClick(e, column)}
                >
                  {editingColumnName === column.id ? (
                    <TextField
                      value={columnNameValue}
                      onChange={(e) => setColumnNameValue(e.target.value)}
                      onBlur={handleSaveColumnName}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveColumnName()}
                      autoFocus
                      size="small"
                      fullWidth
                      sx={{ '& .MuiInputBase-input': { p: 0.5, fontSize: '0.875rem' } }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getColumnTypeIcon(column.type)}
                      <span style={{ fontWeight: 600 }}>{column.name}</span>
                    </Box>
                  )}
                </TableCell>
              ))}
              
              {/* Add column button */}
              {!readOnly && (
                <TableCell sx={{ width: 40, p: 0.5 }}>
                  <Tooltip title="Add column">
                    <IconButton
                      size="small"
                      onClick={() => onAddColumn({
                        name: 'New Column',
                        type: 'text',
                      })}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {database.rows.map((row) => (
              <TableRow key={row.id} hover>
                {/* Row actions */}
                <TableCell sx={{ width: 40, p: 0.5 }}>
                  {!readOnly && (
                    <IconButton
                      size="small"
                      onClick={() => onDeleteRow(row.id)}
                      sx={{ opacity: 0, '&:hover': { opacity: 1 } }}
                      className="group-hover:opacity-100"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
                
                {/* Data cells */}
                {visibleColumns.map((column) => (
                  <TableCell
                    key={`${row.id}-${column.id}`}
                    sx={{
                      cursor: readOnly ? 'default' : 'pointer',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      p: 1,
                      '&:hover': readOnly ? {} : { bgcolor: 'action.hover' },
                    }}
                    onClick={() => {
                      if (column.type !== 'checkbox') {
                        handleCellClick(row.id, column.id, getCellValue(row, column.id));
                      }
                    }}
                  >
                    {renderCell(column, row)}
                  </TableCell>
                ))}
                
                {/* Empty cell for add column button alignment */}
                {!readOnly && <TableCell sx={{ width: 40 }} />}
              </TableRow>
            ))}
            
            {/* Add row button */}
            {!readOnly && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} sx={{ p: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={onAddRow}
                    sx={{ width: '100%', borderRadius: 1 }}
                  >
                    <AddIcon />
                    <span style={{ marginLeft: 4, fontSize: '0.875rem' }}>New row</span>
                  </IconButton>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Column context menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
      >
        <MenuItem onClick={() => selectedColumn && handleStartColumnNameEdit(selectedColumn)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => {
          setTypeMenuAnchor(e.currentTarget);
        }}>
          <ListItemIcon>
            <FormatListBulletedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change type</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedColumn) {
              onDeleteColumn(selectedColumn.id);
            }
            handleColumnMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete column</ListItemText>
        </MenuItem>
      </Menu>

      {/* Column type selector menu */}
      <Menu
        anchorEl={typeMenuAnchor}
        open={Boolean(typeMenuAnchor)}
        onClose={() => setTypeMenuAnchor(null)}
      >
        {COLUMN_TYPE_OPTIONS.map((typeOption) => (
          <MenuItem
            key={typeOption.value}
            onClick={() => {
              if (selectedColumn) {
                onUpdateColumn(selectedColumn.id, { type: typeOption.value as ColumnType });
              }
              setTypeMenuAnchor(null);
              handleColumnMenuClose();
            }}
          >
            <ListItemIcon>
              {getColumnTypeIcon(typeOption.value as ColumnType)}
            </ListItemIcon>
            <ListItemText>{typeOption.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default DatabaseTableView;
