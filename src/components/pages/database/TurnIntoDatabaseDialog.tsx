'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../redux/store';
import { convertTableToDatabase } from '../../../redux/features/databases/databasesSlice';
import { SELECT_COLORS } from './types';

interface TurnIntoDatabaseDialogProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  blockId: string;
  tableData: {
    type?: 'tableContent';
    rows?: Array<{
      cells: Array<any>;
    }>;
    content?: Array<{
      type: 'tableRow';
      content: Array<{
        type: 'tableCell';
        content: Array<{ type: string; text?: string; content?: any[] }>;
      }>;
    }>;
  };
  onSuccess?: (databaseId: string, title: string) => void;
}

interface ParsedColumn {
  id: string;
  name: string;
  type: 'text';
}

interface ParsedRow {
  id: string;
  cells: Array<{
    columnId: string;
    value: string;
  }>;
}

const TurnIntoDatabaseDialog: React.FC<TurnIntoDatabaseDialogProps> = ({
  open,
  onClose,
  pageId,
  blockId,
  tableData,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.databases);
  
  const [title, setTitle] = useState('');
  const [useFirstRowAsHeaders, setUseFirstRowAsHeaders] = useState(true);

  // Parse table data to extract columns and rows
  const { columns, rows, preview } = useMemo(() => {
    // Handle different table content structures
    // 1. tableContent with rows array: { type: 'tableContent', rows: [...] }
    // 2. Direct content array: { content: [...] }
    let tableRows: any[] = [];
    
    if (tableData?.type === 'tableContent' && Array.isArray(tableData.rows)) {
      // Format: { type: 'tableContent', rows: [{ cells: [...] }, ...] }
      tableRows = tableData.rows.map(row => ({
        content: row.cells || []
      }));
    } else if (tableData?.content && Array.isArray(tableData.content)) {
      // Format: { content: [{ type: 'tableRow', content: [...] }, ...] }
      tableRows = tableData.content.map(row => ({
        content: row.content || []
      }));
    }
    
    if (tableRows.length === 0) {
      return { columns: [], rows: [], preview: [] };
    }

    // Extract text from cell content
    const extractCellText = (cellContent: any[]): string => {
      if (!cellContent || !Array.isArray(cellContent)) return '';
      return cellContent.map(item => {
        if (item.text) return item.text;
        if (item.content && Array.isArray(item.content)) {
          return extractCellText(item.content);
        }
        return '';
      }).join('');
    };

    // Get first row
    const firstRow = tableRows[0]?.content || [];
    const dataRows = useFirstRowAsHeaders ? tableRows.slice(1) : tableRows;

    // Create columns
    const parsedColumns: ParsedColumn[] = (Array.isArray(firstRow) ? firstRow : []).map((cell: any, index: number) => {
      // Handle different cell formats
      let cellContent: any[];
      if (Array.isArray(cell)) {
        cellContent = cell;
      } else if (cell && typeof cell === 'object' && cell.content) {
        cellContent = cell.content;
      } else {
        cellContent = [];
      }
      
      const headerText = useFirstRowAsHeaders 
        ? extractCellText(cellContent)
        : `Column ${index + 1}`;
      return {
        id: `col_${index}`,
        name: headerText || `Column ${index + 1}`,
        type: 'text' as const,
      };
    });

    // Create rows
    const parsedRows: ParsedRow[] = dataRows.map((row: any, rowIndex: number) => {
      const rowContent = Array.isArray(row.content) ? row.content : [];
      const cells = rowContent.map((cell: any, colIndex: number) => {
        // Handle different cell formats
        let cellContent: any[];
        if (Array.isArray(cell)) {
          cellContent = cell;
        } else if (cell && typeof cell === 'object' && cell.content) {
          cellContent = cell.content;
        } else {
          cellContent = [];
        }
        
        const value = extractCellText(cellContent);
        return {
          columnId: `col_${colIndex}`,
          value,
        };
      });
      return {
        id: `row_${rowIndex}`,
        cells,
      };
    });

    // Generate preview (max 5 rows)
    const previewRows = parsedRows.slice(0, 5).map(row => {
      const rowData: Record<string, string> = {};
      row.cells.forEach(cell => {
        const col = parsedColumns.find(c => c.id === cell.columnId);
        if (col) {
          rowData[col.name] = cell.value;
        }
      });
      return rowData;
    });

    return {
      columns: parsedColumns,
      rows: parsedRows,
      preview: previewRows,
    };
  }, [tableData, useFirstRowAsHeaders]);

  // Handle conversion
  const handleConvert = useCallback(async () => {
    try {
      // Build request payload to match the API
      const payload = {
        page_id: pageId,
        block_id: blockId,
        tableContent: tableData,
        title: title || 'Untitled Database',
      };

      const result = await dispatch(convertTableToDatabase(payload));
      
      if (convertTableToDatabase.fulfilled.match(result)) {
        // Pass both databaseId and title so parent can replace the block
        onSuccess?.(result.payload._id, title || 'Untitled Database');
        onClose();
      }
    } catch (error) {
      console.error('Failed to convert table to database:', error);
    }
  }, [dispatch, pageId, blockId, title, tableData, onSuccess, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon />
          Turn into Database
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Title input */}
        <TextField
          fullWidth
          label="Database Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Database"
          sx={{ mb: 3, mt: 1 }}
        />

        {/* Options */}
        <Box sx={{ mb: 3 }}>
          <Chip
            label="Use first row as headers"
            color={useFirstRowAsHeaders ? 'primary' : 'default'}
            onClick={() => setUseFirstRowAsHeaders(!useFirstRowAsHeaders)}
            icon={useFirstRowAsHeaders ? <CheckIcon /> : <CloseIcon />}
            sx={{ cursor: 'pointer' }}
          />
        </Box>

        {/* Preview */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            Preview ({columns.length} columns, {rows.length} rows)
          </Typography>

          {/* Column chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {columns.map((col, index) => {
              const color = SELECT_COLORS[index % SELECT_COLORS.length];
              return (
                <Chip
                  key={col.id}
                  label={col.name}
                  size="small"
                  className={`${color.bg} ${color.text}`}
                />
              );
            })}
          </Box>

          {/* Data preview table */}
          {preview.length > 0 && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 200,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid rgba(0,0,0,0.1)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid rgba(0,0,0,0.1)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {row[col.name] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <Box sx={{ p: 1, textAlign: 'center', color: 'text.secondary', fontSize: '0.75rem' }}>
                  +{rows.length - 5} more rows
                </Box>
              )}
            </Box>
          )}

          {preview.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No data to preview
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={loading || columns.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : <StorageIcon />}
        >
          {loading ? 'Converting...' : 'Convert to Database'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TurnIntoDatabaseDialog;
