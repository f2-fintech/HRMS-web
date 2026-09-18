'use client'

import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { debounce } from 'lodash'
import {
  Button,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  TablePagination,
  CircularProgress,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DriveFileRenameOutlineOutlined from '@mui/icons-material/DriveFileRenameOutlineOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'

import { ToastContainer, toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchDepartments,
  createDepartment,
} from '@/redux/features/designation/departmentDesignationsSlice'

import {
  fetchDesignationsByDepartmentLevelWise,
  fetchDesignationList,
  createDesignation,
  selectLevelWiseData,
  selectLevelWiseLoading,
  updateDesignation,
} from '@/redux/features/designation/designationV2Slice';
import { utility } from '@/utility';
import type { AppDispatch, RootState } from '@/redux/store'
import 'react-toastify/dist/ReactToastify.css'

// Expanded Icon List
const AVAILABLE_ICONS = [
  { value: '👑', label: 'Leadership' },
  { value: '📊', label: 'Sales' },
  { value: '👥', label: 'HR' },
  { value: '⚙️', label: 'Operations' },
  { value: '💳', label: 'Credit' },
  { value: '💻', label: 'IT' },
  { value: '🚀', label: 'Product' },
  { value: '📣', label: 'Marketing' },
  { value: '🎨', label: 'Design' },
  { value: '📈', label: 'Finance' },
  { value: '🤝', label: 'Relations' },
  { value: '🔧', label: 'Engineering' },
  { value: '💰', label: 'Money' },
  { value: '🌐', label: 'Global' },
  { value: '🏆', label: 'Achievement' },
  { value: '📋', label: 'Admin' },
  { value: '🔬', label: 'Research' },
  { value: '📚', label: 'Education' },
  { value: '🏥', label: 'Healthcare' },
  { value: '🚚', label: 'Logistics' },
]

const COLOR_PALETTE = [
  '#f59e0b', '#3b82f6', '#06b6d4', '#eab308',
  '#8b5cf6', '#ef4444', '#f97316', '#854d0e',
  '#10b981', '#6366f1', '#ec4899', '#14b8a6',
  '#f43f5e', '#0ea5e9', '#8b5cf6', '#eab308'
]

// ─── Department Card Component ───────────────────────────────────────────────
const DepartmentCard = ({ dept, onAddDesignation, onViewDesignations }: any) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 3,
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.4)' 
          : '0 4px 15px rgba(0,0,0,0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { 
          transform: 'translateY(-6px)', 
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 12px 30px rgba(0,0,0,0.6)' 
            : '0 10px 25px rgba(0,0,0,0.1)',
          borderColor: dept.color || 'primary.main',
        },
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          backgroundColor: dept.color || 'primary.main',
          opacity: 0.8,
        }
      }}
    >
      <IconButton
        onClick={() => onViewDesignations(dept)}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          color: 'text.secondary',
          '&:hover': { 
            color: 'primary.main', 
            backgroundColor: alpha(theme.palette.primary.main, 0.1) 
          },
        }}
      >
        <VisibilityIcon />
      </IconButton>

      <Box display="flex" alignItems="flex-start" gap={1.5} mb={2} sx={{ pr: 5 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            minWidth: 46,
            borderRadius: '12px',
            backgroundColor: alpha(dept.color || theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            border: `1.5px solid ${alpha(dept.color || theme.palette.primary.main, 0.2)}`,
            boxShadow: `0 0 15px ${alpha(dept.color || theme.palette.primary.main, 0.1)}`,
          }}
        >
          {dept.icon || '📁'}
        </Box>

        <Box sx={{ overflow: 'hidden' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 700, 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              display: 'block',
              mb: 0.2
            }}
          >
            {dept.department || 'DEPT'}
          </Typography>
          <Typography 
            variant="h6" 
            fontWeight={800} 
            sx={{ 
              fontSize: '1.05rem', 
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              height: '2.6rem' // Fixed height for 2 lines
            }}
          >
            {dept.department || dept.name}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, mb: 3 }}>
        <Typography 
          sx={{ 
            color: 'success.main', 
            fontWeight: 800, 
            fontSize: '0.8rem', 
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5
          }}
        >
          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
          {dept.designation_Count || 0} DESIGNATIONS
        </Typography>
      </Box>

      <Button
        variant="outlined"
        size="small"
        fullWidth
        startIcon={<AddIcon />}
        onClick={() => onAddDesignation(dept)}
        sx={{
          borderColor: alpha(dept.color || theme.palette.primary.main, 0.5),
          color: dept.color || 'primary.main',
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 2.5,
          py: 0.8,
          '&:hover': {
            borderColor: dept.color || 'primary.main',
            backgroundColor: alpha(dept.color || theme.palette.primary.main, 0.05),
          }
        }}
      >
        Add Designation
      </Button>
    </Box>
  )
}

// Static Sample Data

const Designation = () => {
  const dispatch: AppDispatch = useDispatch()

  // Edit Designation Modal State
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<any>(null);


  // Selectors
  const { departments, loading: deptLoading } = useSelector(
    (state: RootState) => state.department
  )

  const { levelWiseData, levelWiseLoading } = useSelector(
    (state: RootState) => state.designationV2
  )

  // New List Selectors from designationV2
  const {
    designations: listDesignations = [],
    total: listTotal = 0,
    listLoading = false
  } = useSelector((state: RootState) => state.designationV2);

  const [showForm, setShowForm] = useState(false)
  const [selectedDesignation, setSelectedDesignation] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [selectedKeyword, setSelectedKeyword] = useState('')

  // Filters & Pagination
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('')
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Modals State
  const [openAddDesignationModal, setOpenAddDesignationModal] = useState(false)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | ''>('')
  const [levels, setLevels] = useState<any[]>([])

  const [openViewModal, setOpenViewModal] = useState(false)
  const [selectedViewDepartment, setSelectedViewDepartment] = useState<any>(null)

  const [openCreateDeptModal, setOpenCreateDeptModal] = useState(false)
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptIcon, setNewDeptIcon] = useState('')
  const [newDeptColor, setNewDeptColor] = useState('#f59e0b')
  const [creating, setCreating] = useState(false)

  // Fetch List with debounce
  const debouncedFetchList = useCallback(
    debounce(() => {
      const user = utility().decodedToken() || {};
      const company_id = user?.company_id;

      if (!company_id) return;

      dispatch(fetchDesignationList({
        company_id,
        department_id: selectedDepartmentFilter || undefined,   // Now it's _id
        level: selectedLevelFilter ? parseInt(selectedLevelFilter.replace('L', '')) : undefined,
        search: selectedKeyword.trim() || undefined,
        page: page + 1,
        limit: rowsPerPage,
      }));
    }, 400),
    [selectedDepartmentFilter, selectedLevelFilter, selectedKeyword, page, rowsPerPage, dispatch]
  );

  useEffect(() => {
    debouncedFetchList();
    dispatch(fetchDepartments());

    const user = utility().decodedToken() || {};
    setUserRole(user.role || '');
  }, [debouncedFetchList, dispatch]);
  useEffect(() => {
    debouncedFetchList()
    dispatch(fetchDepartments())

    const user = utility().decodedToken() || {}
    setUserRole(user.role || '')
  }, [debouncedFetchList, dispatch])

  // Handle View Designations (Dynamic API Call)
  const handleViewDesignations = (dept: any) => {
    const deptId = dept._id || dept.id

    if (!deptId) {
      toast.error("Department ID not found")

      return
    }

    setSelectedViewDepartment(dept)
    setOpenViewModal(true)

    // Call Level Wise API
    dispatch(fetchDesignationsByDepartmentLevelWise({
      department_id: deptId,
      company_id: dept.company_id
    }))
  }

  const handleDeptAddDesignation = (dept: any) => {
    setSelectedDepartmentId(dept._id || dept.id)
    setLevels([{
      level: 'L1',
      roleGroup: '',
      designations: [] as string[],
      salaryFrom: '',
      salaryTo: '',
    }])
    setOpenAddDesignationModal(true)
  }

  const handleDesignationEditClick = (des: any) => {
    setEditingDesignation({
      _id: des._id,
      title: des.title || '',
      role_group: des.role_group || '',
      level: des.level || 1,
      salary_min: des.salary_min || '',
      salary_max: des.salary_max || '',
      department_id: des.department_id,   // hidden, for backend
    });
    setOpenEditModal(true);
  };

  const handleInputChange = (e: any) => setSelectedKeyword(e.target.value)

  // Level Management Functions (unchanged)
  const addNewLevel = () => {
    setLevels((prev) => [
      ...prev,
      { level: `L${prev.length + 1}`, roleGroup: '', designations: [] as string[], salaryFrom: '', salaryTo: '' },
    ])
  }

  const updateLevel = (index: number, field: string, value: any) => {
    setLevels((prev) =>
      prev.map((level, i) => (i === index ? { ...level, [field]: value } : level))
    )
  }

  const addDesignationToLevel = (levelIndex: number, value: string) => {
    if (!value.trim()) return
    setLevels((prev) =>
      prev.map((level, i) =>
        i === levelIndex
          ? { ...level, designations: [...level.designations, value.trim()] }
          : level
      )
    )
  }

  const removeDesignationFromLevel = (levelIndex: number, desIndex: number) => {
    setLevels((prev) =>
      prev.map((level, i) =>
        i === levelIndex
          ? { ...level, designations: level.designations.filter((_, idx) => idx !== desIndex) }
          : level
      )
    )
  }

  const removeLevel = (index: number) => {
    if (levels.length > 1) setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  // Corrected & Improved handleSaveAllDesignations
  const handleSaveAllDesignations = async () => {
    if (!selectedDepartmentId || levels.length === 0) {
      toast.error('Please select a department and add at least one level');

      return;
    }

    const user = utility().decodedToken() || {};
    const company_id = user?.company_id;

    if (!company_id) {
      toast.error('Company ID not found. Please login again.');

      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const levelItem of levels) {
      if (levelItem.designations.length === 0) continue;

      const levelNumber = parseInt(levelItem.level.replace('L', ''), 10);

      for (const designationTitle of levelItem.designations) {
        const payload = {
          title: designationTitle.trim(),
          department_id: selectedDepartmentId.toString(),
          level: levelNumber,
          role_group: levelItem.roleGroup?.trim() || undefined,
          salary_min: levelItem.salaryFrom ? Number(levelItem.salaryFrom) : undefined,
          salary_max: levelItem.salaryTo ? Number(levelItem.salaryTo) : undefined,
          company_id: company_id,
        };

        try {
          await dispatch(createDesignation(payload)).unwrap();
          successCount++;
        } catch (err: any) {
          console.error(`Failed to create designation "${designationTitle}":`, err);
          failedCount++;
        }
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} designation(s) created successfully!`);
    }

    if (failedCount > 0) {
      toast.warning(`${failedCount} designation(s) failed to create.`);
    }

    // Reset form
    setOpenAddDesignationModal(false);
    setLevels([]);
    setSelectedDepartmentId('');

    // 🔥 IMPORTANT: Refresh the full list so department is populated
    debouncedFetchList();

    // Also refresh departments count
    dispatch(fetchDepartments());
  };

  const handleCreateDepartment = async () => {
    const trimmedName = newDeptName.trim();

    if (!trimmedName) {
      toast.error('Department name is required');

      return;
    }

    // ✅ Proper Capitalization: First letter capital, rest as user typed (or force lowercase if you want)
    const formattedDeptName =
      trimmedName.charAt(0).toUpperCase() +
      trimmedName.slice(1);   // Keep rest as user typed

    // Optional: If you want full title case (every word capitalized):
    // const formattedDeptName = trimmedName
    //   .split(' ')
    //   .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    //   .join(' ');

    setCreating(true);

    try {
      await dispatch(
        createDepartment({
          department: formattedDeptName,   // ← Now guaranteed first letter capital
          icon: newDeptIcon || undefined,
          color: newDeptColor
        })
      ).unwrap();

      toast.success(`Department "${formattedDeptName}" created successfully!`);

      // Reset fields
      setNewDeptName('');
      setNewDeptIcon('');
      setNewDeptColor('#f59e0b');
      setOpenCreateDeptModal(false);

      // Refresh list
      dispatch(fetchDepartments());
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  // Static fallback data (keep for now)
  const staticDesignationData = [
    { id: 1, department: 'Leadership', level: 'L1', roleGroup: 'Executive', designation: 'CEO', salaryFrom: '500000', salaryTo: '800000' },
    { id: 2, department: 'Leadership', level: 'L1', roleGroup: 'Executive', designation: 'CTO', salaryFrom: '450000', salaryTo: '700000' },
    { id: 3, department: 'Leadership', level: 'L2', roleGroup: 'Senior Manager', designation: 'VP Operations', salaryFrom: '300000', salaryTo: '450000' },
    { id: 4, department: 'Sales', level: 'L1', roleGroup: 'Manager', designation: 'Sales Head', salaryFrom: '250000', salaryTo: '400000' },
    { id: 5, department: 'Sales', level: 'L2', roleGroup: 'Executive', designation: 'Senior Sales Executive', salaryFrom: '180000', salaryTo: '280000' },
    { id: 6, department: 'Sales', level: 'L2', roleGroup: 'Executive', designation: 'Sales Executive', salaryFrom: '120000', salaryTo: '200000' },
    { id: 7, department: 'HR', level: 'L1', roleGroup: 'Manager', designation: 'HR Head', salaryFrom: '220000', salaryTo: '350000' },
    { id: 8, department: 'HR', level: 'L2', roleGroup: 'Executive', designation: 'HR Executive', salaryFrom: '100000', salaryTo: '160000' },
    { id: 9, department: 'IT', level: 'L1', roleGroup: 'Manager', designation: 'IT Head', salaryFrom: '280000', salaryTo: '420000' },
    { id: 10, department: 'IT', level: 'L3', roleGroup: 'Senior Executive', designation: 'Software Engineer', salaryFrom: '150000', salaryTo: '250000' },
    { id: 11, department: 'Operations', level: 'L2', roleGroup: 'Manager', designation: 'Operations Manager', salaryFrom: '200000', salaryTo: '320000' },
    { id: 12, department: 'Marketing', level: 'L2', roleGroup: 'Executive', designation: 'Marketing Executive', salaryFrom: '110000', salaryTo: '180000' },
  ]

  // Filtered & Paginated Data (kept as is for now)
  const filteredData = useMemo(() => {
    return staticDesignationData.filter((item) => {
      const matchDepartment = !selectedDepartmentFilter || item.department === selectedDepartmentFilter
      const matchLevel = !selectedLevelFilter || item.level === selectedLevelFilter

      const matchSearch = !selectedKeyword ||
        item.designation.toLowerCase().includes(selectedKeyword.toLowerCase()) ||
        item.roleGroup.toLowerCase().includes(selectedKeyword.toLowerCase())

      return matchDepartment && matchLevel && matchSearch
    })
  }, [selectedDepartmentFilter, selectedLevelFilter, selectedKeyword])

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage


    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage)

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleUpdateDesignation = async () => {
    if (!editingDesignation?._id) {
      toast.error("Designation ID is missing");

      return;
    }

    const user = utility().decodedToken();
    const company_id = user?.company_id;

    if (!company_id) {
      toast.error("Company ID not found. Please login again.");

      return;
    }

    try {
      const payload = {
        id: editingDesignation._id,
        title: editingDesignation.title?.trim(),
        role_group: editingDesignation.role_group?.trim() || undefined,
        level: Number(editingDesignation.level),
        salary_min: editingDesignation.salary_min ? Number(editingDesignation.salary_min) : undefined,
        salary_max: editingDesignation.salary_max ? Number(editingDesignation.salary_max) : undefined,
        company_id: company_id,           // ← Add this
      };

      console.log("Sending update payload:", payload);

      await dispatch(updateDesignation(payload)).unwrap();

      toast.success('Designation updated successfully!');

      setOpenEditModal(false);
      setEditingDesignation(null);

      debouncedFetchList();   // Refresh table

    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err?.message || 'Failed to update designation');
    }
  };

  const uniqueDepartments = [...new Set(staticDesignationData.map(item => item.department))]
  const uniqueLevels = [...new Set(staticDesignationData.map(item => item.level))]

  const groupedByLevel = useMemo(() => {
    if (!selectedViewDepartment) return {}

    const deptData = staticDesignationData.filter(
      item => item.department === selectedViewDepartment.department || item.department === selectedViewDepartment.name
    )

    return deptData.reduce((acc: any, item) => {
      if (!acc[item.level]) acc[item.level] = []
      acc[item.level].push(item)

      return acc
    }, {})
  }, [selectedViewDepartment])

  const theme = useTheme();

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', pb: 6 }}>
      <ToastContainer />

      {/* Departments Section */}
      <Box sx={{ px: { xs: 3, md: 5 }, pt: 5 }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={4}
          sx={{
            p: 3,
            borderRadius: 4,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, #ffffff 100%)`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.5px' }}>
              Departments
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Manage teams and organizational structure
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDeptModal(true)}
            sx={{ 
              borderRadius: 2.5, 
              textTransform: 'none', 
              fontWeight: 700,
              px: 3,
              py: 1,
              boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 12px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Add Department
          </Button>
        </Box>

        {deptLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress thickness={5} size={50} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {departments.length > 0 ? (
              departments.map((dept: any) => (
                <Grid item xs={12} sm={6} md={3} key={dept._id || dept.id}>
                  <DepartmentCard
                    dept={{
                      ...dept,
                      id: dept._id || dept.id,
                      name: dept.department,
                      label: dept.department?.substring(0, 6).toUpperCase(),
                      designationsCount: dept.designation_Count || 0, // later dynamic from API
                    }}
                    onAddDesignation={handleDeptAddDesignation}
                    onViewDesignations={handleViewDesignations}
                  />
                </Grid>
              ))
            ) : (
              <Typography>No departments found. Create one to get started.</Typography>
            )}
          </Grid>
        )}
      </Box>

      <Box sx={{ height: '1px', backgroundColor: 'divider', mx: { xs: 3, md: 5 }, my: 8, opacity: 0.6 }} />

      {/* All Designations Section */}
      <Box sx={{ px: { xs: 3, md: 5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            All Designations
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4, 
          flexWrap: 'wrap',
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartmentFilter}
              label="Department"
              onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((dept: any) => (
                <MenuItem key={dept._id} value={dept._id}>
                  {dept.department}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={selectedLevelFilter}
              label="Level"
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Levels</MenuItem>
              {[1, 2, 3, 4,].map((num) => (
                <MenuItem key={num} value={num.toString()}>
                  L{num}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Search designations..."
            variant="outlined"
            value={selectedKeyword}
            onChange={handleInputChange}
            sx={{ 
              minWidth: 350,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Box>

        <Box sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 4, 
          boxShadow: theme.palette.mode === 'dark' ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.06)', 
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary', py: 2.5 }}>S.No</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Role Group</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Designation</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.primary' }}>Salary Range (₹)</TableCell>
                  {userRole === '1' && <TableCell align="center" sx={{ fontWeight: 800, color: 'text.primary' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {listLoading ? (
                  <TableRow>
                    <TableCell colSpan={userRole === '1' ? 7 : 6} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : listDesignations && listDesignations.length > 0 ? (
                  listDesignations.map((des: any, index: number) => (
                    <TableRow key={des._id} hover>
                      {/* Serial Number Calculation: (Current Page * Rows Per Page) + Index + 1 */}
                      <TableCell sx={{ fontWeight: 600 }}>{page * rowsPerPage + index + 1}</TableCell>

                      <TableCell>
                        {des.department?.department || des.department || '—' ? (
                          <Chip
                            label={des.department?.department || des.department || '—'}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.warning.main, 0.1),
                              color: 'warning.dark',
                              fontWeight: 700,
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              fontSize: '0.7rem',
                              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                            }}
                          />
                        ) : '—'}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                          fontWeight: 800,
                          fontSize: '0.8rem'
                        }}>
                          L{des.level}
                        </Box>
                      </TableCell>
                      
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {des.role_group || '—'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={des.title}
                          size="medium"
                          sx={{
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            color: 'info.dark',
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 1,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>
                        ₹{des.salary_min || '—'} - ₹{des.salary_max || '—'}
                      </TableCell>

                      {userRole === '1' && (
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleDesignationEditClick(des)}
                            sx={{ 
                              color: 'primary.main',
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.15),
                              }
                            }}
                          >
                            <DriveFileRenameOutlineOutlined fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={userRole === '1' ? 7 : 6} align="center" sx={{ py: 4 }}>
                      No designations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 15, 20]}
            component="div"
            count={listTotal}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid #e2e8f0' }}
          />
        </Box>
      </Box>

      <Dialog 
        open={openEditModal} 
        onClose={() => setOpenEditModal(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 4, backgroundImage: 'none' }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 0 }}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Edit Designation
          </Typography>
          <IconButton
            onClick={() => setOpenEditModal(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4 }}>
          {editingDesignation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Designation Title"
                variant="outlined"
                value={editingDesignation.title}
                onChange={(e) => setEditingDesignation({
                  ...editingDesignation,
                  title: e.target.value
                })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                label="Role Group"
                variant="outlined"
                value={editingDesignation.role_group}
                onChange={(e) => setEditingDesignation({
                  ...editingDesignation,
                  role_group: e.target.value
                })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={editingDesignation.level}
                  label="Level"
                  onChange={(e) => setEditingDesignation({
                    ...editingDesignation,
                    level: Number(e.target.value)
                  })}
                  sx={{ borderRadius: 2 }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <MenuItem key={num} value={num}>L{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Salary From"
                  type="number"
                  value={editingDesignation.salary_min}
                  onChange={(e) => setEditingDesignation({
                    ...editingDesignation,
                    salary_min: e.target.value ? Number(e.target.value) : ''
                  })}
                  InputProps={{ 
                    startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>₹</Box>,
                    sx: { borderRadius: 2 }
                  }}
                />
                <TextField
                  fullWidth
                  label="Salary To"
                  type="number"
                  value={editingDesignation.salary_max}
                  onChange={(e) => setEditingDesignation({
                    ...editingDesignation,
                    salary_max: e.target.value ? Number(e.target.value) : ''
                  })}
                  InputProps={{ 
                    startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>₹</Box>,
                    sx: { borderRadius: 2 }
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenEditModal(false)}
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateDesignation}
            disabled={!editingDesignation?.title}
            sx={{ 
              borderRadius: 2, 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openViewModal} 
        onClose={() => setOpenViewModal(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: { borderRadius: 4, backgroundImage: 'none' }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                backgroundColor: alpha(selectedViewDepartment?.color || theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                border: `1px solid ${alpha(selectedViewDepartment?.color || theme.palette.primary.main, 0.2)}`,
              }}
            >
              {selectedViewDepartment?.icon || '📁'}
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
              {selectedViewDepartment?.department || selectedViewDepartment?.name}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setOpenViewModal(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {levelWiseLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress thickness={5} size={40} />
            </Box>
          ) : levelWiseData?.levels && levelWiseData.levels.length > 0 ? (
            levelWiseData.levels.map((levelGroup: any) => (
              <Box key={levelGroup.level} sx={{ mb: 4 }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={800} 
                  sx={{ 
                    mb: 2, 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  Level {levelGroup.level}
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 3, 
                    overflow: 'hidden',
                    borderColor: 'divider',
                    backgroundColor: 'background.default'
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Role Group</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Salary Range (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {levelGroup.designations.map((des: any) => (
                        <TableRow key={des._id} hover>
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={des.title}
                              size="medium"
                              sx={{ 
                                backgroundColor: alpha(theme.palette.info.main, 0.1), 
                                color: 'info.dark', 
                                fontWeight: 700,
                                borderRadius: '6px'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            {des.role_group || '—'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            ₹{des.salary_min || '—'} - ₹{des.salary_max || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          ) : (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body1">
                No designations found for this department.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenViewModal(false)} 
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2, fontWeight: 700, py: 1 }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openAddDesignationModal} 
        onClose={() => setOpenAddDesignationModal(false)} 
        fullWidth 
        maxWidth="lg"
        PaperProps={{
          sx: { borderRadius: 4, backgroundImage: 'none' }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Add Designations
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Department: {departments.find(d => (d._id || d.id) === selectedDepartmentId)?.department || '—'}
          </Typography>
          <IconButton
            onClick={() => setOpenAddDesignationModal(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              borderRadius: 3, 
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 800 }}>Level</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Role Group</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Designations</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Salary Range (₹)</TableCell>
                  <TableCell width={60} />
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((level, index) => (
                  <TableRow key={index} sx={{ verticalAlign: 'top' }}>
                    <TableCell sx={{ width: 140, py: 3 }}>
                      <Select
                        fullWidth
                        size="small"
                        value={level.level}
                        onChange={(e) => updateLevel(index, 'level', e.target.value)}
                        sx={{ borderRadius: 2, height: 48, fontWeight: 700 }}
                      >
                        {Array.from({ length: 4 }, (_, i) => (
                          <MenuItem key={i} value={`L${i + 1}`}>Level {i + 1}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell sx={{ width: 220, py: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Executive, Manager"
                        value={level.roleGroup}
                        onChange={(e) => updateLevel(index, 'roleGroup', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, height: 48 } }}
                      />
                    </TableCell>

                    <TableCell sx={{ py: 3 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Type designation and press Enter"
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addDesignationToLevel(index, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        sx={{ 
                          mb: 2, 
                          '& .MuiOutlinedInput-root': { borderRadius: 2, height: 48 } 
                        }}
                      />

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {level.designations.map((des: string, i: number) => (
                          <Chip
                            key={i}
                            label={des}
                            size="medium"
                            onDelete={() => removeDesignationFromLevel(index, i)}
                            sx={{ 
                              borderRadius: '6px', 
                              fontWeight: 600,
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                            }}
                          />
                        ))}
                        {level.designations.length === 0 && (
                          <Typography variant="body2" color="text.disabled" sx={{ py: 1, fontStyle: 'italic' }}>
                            Add at least one designation...
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Min"
                          value={level.salaryFrom}
                          onChange={(e) => updateLevel(index, 'salaryFrom', e.target.value)}
                          InputProps={{ 
                            startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>₹</Box>,
                            sx: { borderRadius: 2, height: 48 }
                          }}
                          sx={{ width: 120 }}
                        />
                        <TextField
                          size="small"
                          placeholder="Max"
                          value={level.salaryTo}
                          onChange={(e) => updateLevel(index, 'salaryTo', e.target.value)}
                          InputProps={{ 
                            startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.secondary' }}>₹</Box>,
                            sx: { borderRadius: 2, height: 48 }
                          }}
                          sx={{ width: 120 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 3 }}>
                      <IconButton 
                        color="error" 
                        onClick={() => removeLevel(index)} 
                        sx={{ 
                          backgroundColor: alpha(theme.palette.error.main, 0.05),
                          '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={addNewLevel} 
            sx={{ 
              mt: 3, 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 700,
              borderWidth: 2,
              '&:hover': { borderWidth: 2 }
            }}
          >
            Add Next Level
          </Button>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenAddDesignationModal(false)}
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveAllDesignations}
            sx={{ 
              borderRadius: 2, 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            Save Designations
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openCreateDeptModal} 
        onClose={() => setOpenCreateDeptModal(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, backgroundImage: 'none' }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Create New Department
          </Typography>
          <IconButton
            onClick={() => setOpenCreateDeptModal(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4 }}>
          <TextField
            label="Department Name"
            fullWidth
            variant="outlined"
            placeholder="e.g. Engineering, Marketing"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            sx={{
              mb: 4,
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& input': { textTransform: 'capitalize' }
            }}
          />

          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel>Department Icon</InputLabel>
            <Select
              value={newDeptIcon}
              onChange={(e) => setNewDeptIcon(e.target.value)}
              label="Department Icon"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.disabled' }}>
                  <CloseIcon fontSize="small" />
                  <span>No Icon</span>
                </Box>
              </MenuItem>

              {AVAILABLE_ICONS.map((iconObj) => (
                <MenuItem key={iconObj.value} value={iconObj.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box 
                      sx={{ 
                        fontSize: '1.4rem', 
                        width: 32, 
                        height: 32, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      {iconObj.value}
                    </Box>
                    <Typography variant="body2">{iconObj.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Theme Color
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            {COLOR_PALETTE.map((color) => (
              <Box
                key={color}
                onClick={() => setNewDeptColor(color)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: '3px solid',
                  borderColor: newDeptColor === color ? 'text.primary' : 'transparent',
                  boxShadow: newDeptColor === color ? `0 0 0 2px ${alpha(color, 0.3)}` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenCreateDeptModal(false)}
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDepartment}
            disabled={!newDeptName.trim() || creating}
            sx={{ 
              borderRadius: 2, 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            {creating ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Designation
