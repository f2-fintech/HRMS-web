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
const DepartmentCard = ({ dept, onAddDesignation, onViewDesignations }: any) => (
  <Box
    sx={{
      backgroundColor: '#ffffff',
      borderRadius: 3,
      p: 2.5,
      height: '100%',
      boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
      border: '1px solid #f1f5f9',
      position: 'relative',
    }}
  >
    <IconButton
      onClick={() => onViewDesignations(dept)}
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        color: '#64748b',
        '&:hover': { color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
      }}
    >
      <VisibilityIcon />
    </IconButton>

    <Box display="flex" alignItems="center" gap={1.5} mb={2} sx={{ pr: 5 }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          backgroundColor: `${dept.color || '#64748b'}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          border: `2px solid ${(dept.color || '#64748b')}30`,
        }}
      >
        {dept.icon || '📁'}
      </Box>

      <Box>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
          {dept.department?.substring(0, 6).toUpperCase() || 'DEPT'}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.15rem' }}>
          {dept.department || dept.name}
        </Typography>
      </Box>
    </Box>

    <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem', mb: 3 }}>
      {dept.designation_Count || 0} DESIGNATIONS
    </Typography>

    <Button
      variant="outlined"
      size="small"
      fullWidth
      startIcon={<AddIcon />}
      onClick={() => onAddDesignation(dept)}
      sx={{
        borderColor: dept.color || '#3b82f6',
        color: dept.color || '#3b82f6',
        textTransform: 'none',
        fontWeight: 600,
      }}
    >
      Add Designation
    </Button>
  </Box>
)

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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    setUserRole(user.role || '');
  }, [debouncedFetchList, dispatch]);
  useEffect(() => {
    debouncedFetchList()
    dispatch(fetchDepartments())

    const user = JSON.parse(localStorage.getItem('user') || '{}')

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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');
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

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', pb: 6 }}>
      <ToastContainer />

      {/* Departments Section */}
      <Box sx={{ px: { xs: 3, md: 5 }, pt: 5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="#1e2937">Departments</Typography>
            <Typography color="text.secondary">Manage teams and designations</Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDeptModal(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Add Department
          </Button>
        </Box>

        {deptLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
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

      <Box sx={{ height: '1px', backgroundColor: '#e2e8f0', mx: { xs: 3, md: 5 }, my: 6 }} />

      {/* All Designations Section */}
      <Box sx={{ px: { xs: 3, md: 5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>All Designations</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartmentFilter}
              label="Department"
              onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
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
            >
              <MenuItem value="">All Levels</MenuItem>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
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
            sx={{ minWidth: 300 }}
          />
        </Box>

        <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {/* Added Serial Number Column */}
                  <TableCell><strong>S.No</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell><strong>Level</strong></TableCell>
                  <TableCell><strong>Role Group</strong></TableCell>
                  <TableCell><strong>Designation</strong></TableCell>
                  <TableCell><strong>Salary Range (₹)</strong></TableCell>
                  {userRole === '1' && <TableCell align="center"><strong>Actions</strong></TableCell>}
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
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>

                      <TableCell>
                        {des.department?.department || des.department || '—' ? (
                          <Chip
                            label={des.department?.department || des.department || '—'}
                            size="small"
                            sx={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 600,
                              borderRadius: '8px',
                              textTransform: 'uppercase',
                              fontSize: '0.75rem'
                            }}
                          />
                        ) : '—'}
                      </TableCell>

                      <TableCell>L{des.level}</TableCell>
                      <TableCell>{des.role_group || '—'}</TableCell>

                      <TableCell>
                        <Chip
                          label={des.title}
                          size="medium"
                          sx={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            fontWeight: 500,
                            borderRadius: '9999px',
                            px: 2,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        ₹{des.salary_min || '—'} - ₹{des.salary_max || '—'}
                      </TableCell>

                      {userRole === '1' && (
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DriveFileRenameOutlineOutlined />}
                            onClick={() => handleDesignationEditClick(des)}   // ← Pass full object
                          >
                            Edit
                          </Button>
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

      {/* Edit Designation Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Edit Designation
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {editingDesignation && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Designation Title"
                value={editingDesignation.title}
                onChange={(e) => setEditingDesignation({
                  ...editingDesignation,
                  title: e.target.value
                })}
              />

              <TextField
                fullWidth
                label="Role Group"
                value={editingDesignation.role_group}
                onChange={(e) => setEditingDesignation({
                  ...editingDesignation,
                  role_group: e.target.value
                })}
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
                  InputProps={{ startAdornment: '₹' }}
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
                  InputProps={{ startAdornment: '₹' }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateDesignation}
            disabled={!editingDesignation?.title}
          >
            Update Designation
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Designations Modal */}
      <Dialog open={openViewModal} onClose={() => setOpenViewModal(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            {selectedViewDepartment?.department || selectedViewDepartment?.name} - Designations
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {levelWiseLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : levelWiseData?.levels && levelWiseData.levels.length > 0 ? (
            levelWiseData.levels.map((levelGroup: any) => (
              <Box key={levelGroup.level} sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: '#1e2937' }}>
                  {levelGroup.level}
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Designation</strong></TableCell>
                        <TableCell><strong>Role Group</strong></TableCell>
                        <TableCell><strong>Salary Range (₹)</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {levelGroup.designations.map((des: any) => (
                        <TableRow key={des._id}>
                          <TableCell>
                            <Chip
                              label={des.title}
                              size="medium"
                              sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>{des.role_group || '—'}</TableCell>
                          <TableCell>
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
            <Typography>No designations found for this department.</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenViewModal(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Designation Modal */}
      <Dialog open={openAddDesignationModal} onClose={() => setOpenAddDesignationModal(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Add Designations - {departments.find(d => (d._id || d.id) === selectedDepartmentId)?.department || 'Department'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Levels & Designations
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Level</TableCell>
                  <TableCell>Role Group</TableCell>
                  <TableCell>Designations</TableCell>
                  <TableCell>Salary Range (₹)</TableCell>
                  <TableCell width={60} />
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((level, index) => (
                  <TableRow key={index} sx={{ verticalAlign: 'top' }}>
                    <TableCell sx={{ width: 120 }}>
                      <Select
                        fullWidth
                        size="small"
                        value={level.level}
                        onChange={(e) => updateLevel(index, 'level', e.target.value)}
                        sx={{ height: 48 }}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <MenuItem key={i} value={`L${i + 1}`}>L{i + 1}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    <TableCell sx={{ width: 180 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Executive, Manager"
                        value={level.roleGroup}
                        onChange={(e) => updateLevel(index, 'roleGroup', e.target.value)}
                        sx={{ '& .MuiInputBase-root': { height: 48 } }}
                      />
                    </TableCell>

                    <TableCell>
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
                        sx={{ mb: 2, '& .MuiInputBase-root': { height: 48, fontSize: '1rem' } }}
                      />

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                        {level.designations.map((des: string, i: number) => (
                          <Chip
                            key={i}
                            label={des}
                            size="medium"
                            onDelete={() => removeDesignationFromLevel(index, i)}
                          />
                        ))}
                        {level.designations.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                            No designations added yet
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="From"
                          value={level.salaryFrom}
                          onChange={(e) => updateLevel(index, 'salaryFrom', e.target.value)}
                          InputProps={{ startAdornment: '₹' }}
                          sx={{ width: 135, '& .MuiInputBase-root': { height: 48 } }}
                        />
                        <TextField
                          size="small"
                          placeholder="To"
                          value={level.salaryTo}
                          onChange={(e) => updateLevel(index, 'salaryTo', e.target.value)}
                          InputProps={{ startAdornment: '₹' }}
                          sx={{ width: 135, '& .MuiInputBase-root': { height: 48 } }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <IconButton color="error" onClick={() => removeLevel(index)} sx={{ mt: 0.5 }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button variant="outlined" startIcon={<AddIcon />} onClick={addNewLevel} sx={{ mt: 3 }}>
            Add Next Level
          </Button>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenAddDesignationModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAllDesignations}>
            Save All Designations
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create New Department Modal with Icon Dropdown + Color Palette */}
      <Dialog open={openCreateDeptModal} onClose={() => setOpenCreateDeptModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>Create New Department</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Department Name"
            fullWidth
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            sx={{
              mb: 3,
              '& input': { textTransform: 'capitalize' } // Visual only
            }}
          />
          {/* Icon Dropdown with Clear Option in List */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Icon</InputLabel>
            <Select
              value={newDeptIcon}
              onChange={(e) => setNewDeptIcon(e.target.value)}
              label="Select Icon"
            >
              {/* Clear Option */}
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748b' }}>
                  <CloseIcon fontSize="small" />
                  <span>No Icon</span>
                </Box>
              </MenuItem>

              {AVAILABLE_ICONS.map((iconObj) => (
                <MenuItem key={iconObj.value} value={iconObj.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: '1.6rem' }}>{iconObj.value}</span>
                    <span>{iconObj.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Color Palette */}
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
            Select Color
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
            {COLOR_PALETTE.map((color) => (
              <Box
                key={color}
                onClick={() => setNewDeptColor(color)}
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: newDeptColor === color ? '3px solid #1e2937' : '2px solid #e2e8f0',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenCreateDeptModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDepartment}
            disabled={!newDeptName.trim() || creating}
            startIcon={creating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {creating ? 'Creating...' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Designation
