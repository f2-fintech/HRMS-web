// Database types for frontend components

export type ColumnType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone' | 'person' | 'file' | 'rich-text';

export interface SelectOption {
  id: string;
  label: string;
  color?: string;
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: ColumnType;
  width?: number;
  options?: SelectOption[];
  required?: boolean;
  defaultValue?: any;
}

// CellValue format matching the backend
export interface CellValue {
  text?: string;
  number?: number;
  selectedIds?: string[];
  date?: string;
  checked?: boolean;
  url?: string;
  email?: string;
  phone?: string;
  personIds?: string[];
  fileUrls?: string[];
}

export interface DatabaseCell {
  columnId: string;
  value: any;
}

export interface DatabaseRow {
  id: string;
  cells: DatabaseCell[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ViewType = 'table' | 'kanban' | 'list' | 'calendar' | 'gallery';

export interface FilterCondition {
  columnId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: any;
}

export interface SortCondition {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseView {
  id: string;
  name: string;
  type: ViewType;
  filters?: FilterCondition[];
  sorts?: SortCondition[];
  groupBy?: string;
  hiddenColumns?: string[];
}

export interface Database {
  _id: string;
  page_id: string;
  title: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  company_id: string;
  created_by?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Color options for select/multi-select
export const SELECT_COLORS = [
  { name: 'gray', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  { name: 'red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  { name: 'orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  { name: 'amber', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  { name: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  { name: 'lime', bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
  { name: 'green', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  { name: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  { name: 'teal', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  { name: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  { name: 'sky', bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300' },
  { name: 'blue', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  { name: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  { name: 'violet', bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
  { name: 'purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  { name: 'fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-300' },
  { name: 'pink', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  { name: 'rose', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
];

export const COLUMN_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', icon: 'mdi:format-text' },
  { value: 'number', label: 'Number', icon: 'mdi:numeric' },
  { value: 'select', label: 'Select', icon: 'mdi:form-dropdown' },
  { value: 'multi-select', label: 'Multi-select', icon: 'mdi:tag-multiple' },
  { value: 'date', label: 'Date', icon: 'mdi:calendar' },
  { value: 'checkbox', label: 'Checkbox', icon: 'mdi:checkbox-marked-outline' },
  { value: 'url', label: 'URL', icon: 'mdi:link' },
  { value: 'email', label: 'Email', icon: 'mdi:email-outline' },
  { value: 'phone', label: 'Phone', icon: 'mdi:phone' },
  { value: 'person', label: 'Person', icon: 'mdi:account' },
  { value: 'file', label: 'File', icon: 'mdi:file-document-outline' },
  { value: 'rich-text', label: 'Rich Text', icon: 'mdi:format-paragraph' },
];

export const VIEW_TYPE_OPTIONS = [
  { value: 'table', label: 'Table', icon: 'mdi:table' },
  { value: 'kanban', label: 'Kanban', icon: 'mdi:view-column' },
  { value: 'list', label: 'List', icon: 'mdi:format-list-bulleted' },
  { value: 'calendar', label: 'Calendar', icon: 'mdi:calendar-month' },
  { value: 'gallery', label: 'Gallery', icon: 'mdi:view-grid' },
];

export const FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
];
