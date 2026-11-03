'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Chip,
  Popover,
  FormControl,
  Select,
  InputLabel,
  Typography,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import TableChartIcon from '@mui/icons-material/TableChart';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import type { Database, DatabaseView, FilterCondition, SortCondition, ViewType } from './types';
import { VIEW_TYPE_OPTIONS, FILTER_OPERATORS } from './types';

interface DatabaseToolbarProps {
  database: Database;
  activeViewId: string;
  onViewChange: (viewId: string) => void;
  onAddView: (view: Partial<DatabaseView>) => void;
  onUpdateView: (viewId: string, updates: Partial<DatabaseView>) => void;
  onDeleteView: (viewId: string) => void;
  readOnly?: boolean;
}

const DatabaseToolbar: React.FC<DatabaseToolbarProps> = ({
  database,
  activeViewId,
  onViewChange,
  onAddView,
  onUpdateView,
  onDeleteView,
  readOnly = false,
}) => {
  const [addViewMenuAnchor, setAddViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedViewForMenu, setSelectedViewForMenu] = useState<string | null>(null);

  const activeView = useMemo(() => {
    return database.views.find(v => v.id === activeViewId) || database.views[0];
  }, [database.views, activeViewId]);

  // Filter state
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({});

  // Sort state
  const [newSort, setNewSort] = useState<Partial<SortCondition>>({});

  const handleAddView = (type: ViewType) => {
    onAddView({
      name: `${VIEW_TYPE_OPTIONS.find(v => v.value === type)?.label || 'New'} View`,
      type,
      filters: [],
      sorts: [],
      hiddenColumns: [],
    });
    setAddViewMenuAnchor(null);
  };

  const handleAddFilter = () => {
    if (newFilter.columnId && newFilter.operator) {
      const currentFilters = activeView.filters || [];
      onUpdateView(activeViewId, {
        filters: [...currentFilters, newFilter as FilterCondition],
      });
      setNewFilter({});
      setFilterAnchor(null);
    }
  };

  const handleRemoveFilter = (index: number) => {
    const currentFilters = activeView.filters || [];
    onUpdateView(activeViewId, {
      filters: currentFilters.filter((_, i) => i !== index),
    });
  };

  const handleAddSort = () => {
    if (newSort.columnId && newSort.direction) {
      const currentSorts = activeView.sorts || [];
      onUpdateView(activeViewId, {
        sorts: [...currentSorts, newSort as SortCondition],
      });
      setNewSort({});
      setSortAnchor(null);
    }
  };

  const handleRemoveSort = (index: number) => {
    const currentSorts = activeView.sorts || [];
    onUpdateView(activeViewId, {
      sorts: currentSorts.filter((_, i) => i !== index),
    });
  };

  const handleViewRightClick = (event: React.MouseEvent, viewId: string) => {
    if (readOnly) return;
    event.preventDefault();
    setSelectedViewForMenu(viewId);
    setViewMenuAnchor(event.currentTarget as HTMLElement);
  };

  const getColumnName = (columnId: string) => {
    return database.columns.find(c => c.id === columnId)?.name || columnId;
  };

  // Get icon for view type
  const getViewTypeIcon = (type: ViewType) => {
    switch (type) {
      case 'table': return <TableChartIcon fontSize="small" />;
      case 'kanban': return <ViewKanbanIcon fontSize="small" />;
      case 'list': return <ViewListIcon fontSize="small" />;
      case 'calendar': return <CalendarMonthIcon fontSize="small" />;
      case 'gallery': return <ViewModuleIcon fontSize="small" />;
      default: return <TableChartIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      {/* View tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tabs
          value={activeViewId}
          onChange={(_, value) => onViewChange(value)}
          sx={{ flexGrow: 1 }}
        >
          {database.views.map((view) => (
            <Tab
              key={view.id}
              value={view.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getViewTypeIcon(view.type)}
                  {view.name}
                </Box>
              }
              onContextMenu={(e) => handleViewRightClick(e, view.id)}
            />
          ))}
        </Tabs>

        {/* Add view button */}
        {!readOnly && (
          <IconButton
            size="small"
            onClick={(e) => setAddViewMenuAnchor(e.currentTarget)}
            sx={{ ml: 1 }}
          >
            <AddIcon />
          </IconButton>
        )}
      </Box>

      {/* Filter and sort controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
        {/* Active filters */}
        {activeView.filters && activeView.filters.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {activeView.filters.map((filter, index) => (
              <Chip
                key={index}
                label={`${getColumnName(filter.columnId)} ${filter.operator} ${filter.value || ''}`}
                size="small"
                onDelete={readOnly ? undefined : () => handleRemoveFilter(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* Active sorts */}
        {activeView.sorts && activeView.sorts.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {activeView.sorts.map((sort, index) => (
              <Chip
                key={index}
                label={`${getColumnName(sort.columnId)} ${sort.direction === 'asc' ? '↑' : '↓'}`}
                size="small"
                onDelete={readOnly ? undefined : () => handleRemoveSort(index)}
                color="secondary"
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* Filter button */}
        {!readOnly && (
          <Button
            size="small"
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
          >
            Filter
          </Button>
        )}

        {/* Sort button */}
        {!readOnly && (
          <Button
            size="small"
            startIcon={<SortIcon />}
            onClick={(e) => setSortAnchor(e.currentTarget)}
          >
            Sort
          </Button>
        )}
      </Box>

      {/* Add view menu */}
      <Menu
        anchorEl={addViewMenuAnchor}
        open={Boolean(addViewMenuAnchor)}
        onClose={() => setAddViewMenuAnchor(null)}
      >
        {VIEW_TYPE_OPTIONS.map((option) => (
          <MenuItem key={option.value} onClick={() => handleAddView(option.value as ViewType)}>
            <ListItemIcon>
              {getViewTypeIcon(option.value as ViewType)}
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* View context menu */}
      <Menu
        anchorEl={viewMenuAnchor}
        open={Boolean(viewMenuAnchor)}
        onClose={() => {
          setViewMenuAnchor(null);
          setSelectedViewForMenu(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedViewForMenu && database.views.length > 1) {
              onDeleteView(selectedViewForMenu);
            }
            setViewMenuAnchor(null);
            setSelectedViewForMenu(null);
          }}
          disabled={database.views.length <= 1}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete view</ListItemText>
        </MenuItem>
      </Menu>

      {/* Filter popover */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => {
          setFilterAnchor(null);
          setNewFilter({});
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 320 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Add Filter
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Column</InputLabel>
            <Select
              value={newFilter.columnId || ''}
              label="Column"
              onChange={(e) => setNewFilter({ ...newFilter, columnId: e.target.value })}
            >
              {database.columns.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  {col.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Operator</InputLabel>
            <Select
              value={newFilter.operator || ''}
              label="Operator"
              onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value as any })}
            >
              {FILTER_OPERATORS.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  {op.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {newFilter.operator && !['is_empty', 'is_not_empty'].includes(newFilter.operator) && (
            <TextField
              fullWidth
              size="small"
              label="Value"
              value={newFilter.value || ''}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={() => setFilterAnchor(null)}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleAddFilter}
              disabled={!newFilter.columnId || !newFilter.operator}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Sort popover */}
      <Popover
        open={Boolean(sortAnchor)}
        anchorEl={sortAnchor}
        onClose={() => {
          setSortAnchor(null);
          setNewSort({});
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Add Sort
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Column</InputLabel>
            <Select
              value={newSort.columnId || ''}
              label="Column"
              onChange={(e) => setNewSort({ ...newSort, columnId: e.target.value })}
            >
              {database.columns.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  {col.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={newSort.direction || ''}
              label="Direction"
              onChange={(e) => setNewSort({ ...newSort, direction: e.target.value as any })}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={() => setSortAnchor(null)}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleAddSort}
              disabled={!newSort.columnId || !newSort.direction}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default DatabaseToolbar;
