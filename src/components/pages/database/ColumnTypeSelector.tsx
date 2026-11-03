'use client';

import React, { useState } from 'react';
import {
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Button,
  Divider,
} from '@mui/material';
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
import CloseIcon from '@mui/icons-material/Close';
import type { ColumnType, SelectOption } from './types';
import { COLUMN_TYPE_OPTIONS, SELECT_COLORS } from './types';

interface ColumnTypeSelectorProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onSelect: (type: ColumnType, options?: SelectOption[]) => void;
  currentType?: ColumnType;
}

const ColumnTypeSelector: React.FC<ColumnTypeSelectorProps> = ({
  anchorEl,
  open,
  onClose,
  onSelect,
  currentType,
}) => {
  const [selectedType, setSelectedType] = useState<ColumnType | null>(null);
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState('');

  // Get icon for column type
  const getColumnTypeIcon = (type: ColumnType) => {
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
  };

  const handleTypeSelect = (type: ColumnType) => {
    if (type === 'select' || type === 'multi-select') {
      setSelectedType(type);
    } else {
      onSelect(type);
      handleClose();
    }
  };

  const handleAddOption = () => {
    if (newOptionLabel.trim()) {
      const newOption: SelectOption = {
        id: `opt_${Date.now()}`,
        label: newOptionLabel.trim(),
        color: SELECT_COLORS[selectOptions.length % SELECT_COLORS.length].name,
      };
      setSelectOptions([...selectOptions, newOption]);
      setNewOptionLabel('');
    }
  };

  const handleRemoveOption = (optionId: string) => {
    setSelectOptions(selectOptions.filter(o => o.id !== optionId));
  };

  const handleConfirmSelect = () => {
    if (selectedType) {
      onSelect(selectedType, selectOptions);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    setSelectOptions([]);
    setNewOptionLabel('');
    onClose();
  };

  // Render select options editor
  if (selectedType === 'select' || selectedType === 'multi-select') {
    return (
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {selectedType === 'select' ? <ArrowDropDownIcon /> : <TagIcon />}
            <span style={{ fontWeight: 600, marginLeft: 8 }}>
              {selectedType === 'select' ? 'Select' : 'Multi-select'} Options
            </span>
          </Box>

          {/* Options list */}
          <Box sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
            {selectOptions.map((option) => {
              const colorStyle = SELECT_COLORS.find(c => c.name === option.color) || SELECT_COLORS[0];
              return (
                <Box
                  key={option.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 0.5,
                    mb: 0.5,
                    borderRadius: 1,
                  }}
                  className={colorStyle.bg}
                >
                  <span className={colorStyle.text}>{option.label}</span>
                  <CloseIcon
                    fontSize="small"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveOption(option.id)}
                  />
                </Box>
              );
            })}
          </Box>

          {/* Add new option */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Option name"
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
              fullWidth
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddOption}
              disabled={!newOptionLabel.trim()}
            >
              Add
            </Button>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleConfirmSelect}
              disabled={selectOptions.length === 0}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Menu>
    );
  }

  // Render type selection menu
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
    >
      {COLUMN_TYPE_OPTIONS.map((option) => (
        <MenuItem
          key={option.value}
          onClick={() => handleTypeSelect(option.value as ColumnType)}
          selected={currentType === option.value}
        >
          <ListItemIcon>
            {getColumnTypeIcon(option.value as ColumnType)}
          </ListItemIcon>
          <ListItemText>{option.label}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );
};

export default ColumnTypeSelector;
