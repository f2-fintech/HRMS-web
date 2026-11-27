'use client';
import React, { useEffect, useState, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  RadioGroup, 
  Radio, 
  FormControl, 
  Autocomplete, 
  Stack, 
  Divider, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Box,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isImageFile = (urlOrName: string) => {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(urlOrName);
};

const isPdfFile = (urlOrName: string) => {
  return /\.pdf$/i.test(urlOrName);
};

const getFileIcon = (urlOrName: string) => {
  if (isImageFile(urlOrName)) return <ImageIcon color="primary" />;
  if (isPdfFile(urlOrName)) return <PictureAsPdfIcon color="error" />;
  return <InsertDriveFileIcon color="action" />;
};

export default function AnnouncementsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific'>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [sendEmail, setSendEmail] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage Access State
  const [manageAccessModalOpen, setManageAccessModalOpen] = useState(false);
  const [selectedAccessEmployees, setSelectedAccessEmployees] = useState<any[]>([]);
  const [accessSaving, setAccessSaving] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdminRole = String(user.role) === '1' || String(user.role) === '0';
      
      let hasAccess = isAdminRole || user.can_manage_announcements === true;
      
      // Fetch latest user info from DB to avoid needing a re-login
      if (!isAdminRole && user.id) {
        try {
          const res = await fetch(`${API_BASE_URL}/employees/get/${user.id}`);
          if (res.ok) {
            const employeeData = await res.json();
            if (employeeData && employeeData.can_manage_announcements) {
              hasAccess = true;
              
              // Optionally update local storage so it persists
              user.can_manage_announcements = true;
              localStorage.setItem('user', JSON.stringify(user));
            } else {
              hasAccess = false;
              user.can_manage_announcements = false;
              localStorage.setItem('user', JSON.stringify(user));
            }
          }
        } catch (e) {
          console.error("Failed to fetch latest access permissions");
        }
      }

      if (hasAccess) setIsAdmin(true);
      if (isAdminRole) setIsSuperAdmin(true);
      
      fetchFeeds();
      if (hasAccess) fetchEmployees();
    };
    
    checkAccess();
  }, []);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/feeds/my-feeds`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setFeeds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const companyId = user.company_id || '';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/employees/get?limit=1000&page=1`, {
        headers: { 
          'Authorization': `Bearer ${token} ${companyId}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.employees || data.data || [];
      const activeList = list.filter((e: any) => e.status === 'active' || e.status === 'Active' || !e.status);
      setEmployees(activeList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        alert('File size exceeds the 25MB limit.');
        return;
      }
      setFile(selected);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return alert('Title and description are required.');
    if (targetAudience === 'specific' && selectedEmployees.length === 0) return alert('Please select at least one employee.');

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('target_audience', targetAudience);
      if (targetAudience === 'specific') {
        formData.append('target_employees', JSON.stringify(selectedEmployees.map(emp => emp._id)));
      }
      formData.append('send_email', String(sendEmail));
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch(`${API_BASE_URL}/feeds`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (res.ok) {
        alert('Announcement created successfully!');
        setTitle('');
        setDescription('');
        setTargetAudience('all');
        setSelectedEmployees([]);
        setSendEmail(false);
        handleRemoveFile();
        fetchFeeds();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenManageAccess = () => {
    const currentlyGranted = employees.filter(e => e.can_manage_announcements === true);
    setSelectedAccessEmployees(currentlyGranted);
    setManageAccessModalOpen(true);
  };

  const handleSaveManageAccess = async () => {
    try {
      setAccessSaving(true);
      const currentlyGrantedIds = employees.filter(e => e.can_manage_announcements === true).map(e => e._id);
      const newlySelectedIds = selectedAccessEmployees.map(e => e._id);
      
      const grantAccess = newlySelectedIds.filter(id => !currentlyGrantedIds.includes(id));
      const revokeAccess = currentlyGrantedIds.filter(id => !newlySelectedIds.includes(id));

      const res = await fetch(`${API_BASE_URL}/employees/manage-announcement-access`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ grantAccess, revokeAccess })
      });

      if (res.ok) {
        alert('Access updated successfully!');
        setManageAccessModalOpen(false);
        fetchEmployees(); // Refresh employee list
      } else {
        alert('Failed to update access');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating access');
    } finally {
      setAccessSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>Company Announcements</Typography>
        {isSuperAdmin && (
          <Button variant="outlined" color="primary" onClick={handleOpenManageAccess}>
            Manage Access
          </Button>
        )}
      </Box>

      {isAdmin && (
        <Card sx={{ mb: 6, p: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight={600} mb={3}>Create New Announcement</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField 
                label="Announcement Title" 
                fullWidth 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
              
              <TextField 
                label="Description" 
                fullWidth 
                multiline 
                rows={4} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
              />
              
              <FormControl component="fieldset">
                <Typography variant="subtitle2" color="textSecondary" mb={1}>Target Audience</Typography>
                <RadioGroup row value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as 'all' | 'specific')}>
                  <FormControlLabel value="all" control={<Radio />} label="All Employees" />
                  <FormControlLabel value="specific" control={<Radio />} label="Specific Employees" />
                </RadioGroup>
              </FormControl>

              {targetAudience === 'specific' && (
                <Autocomplete
                  multiple
                  options={employees || []}
                  getOptionLabel={(option) => `${option?.first_name || ''} ${option?.last_name || ''} (${option?.email || ''})`}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  value={selectedEmployees || []}
                  onChange={(e, newValue) => setSelectedEmployees(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Employees" placeholder="Search employees..." />
                  )}
                />
              )}

              {/* File Attachment Upload */}
              <Box>
                <Typography variant="subtitle2" color="textSecondary" mb={1}>
                  Attachment (Optional)
                </Typography>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="announcement-file-input"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                />

                {!file ? (
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile.size > 25 * 1024 * 1024) {
                          alert('File size exceeds the 25MB limit.');
                          return;
                        }
                        setFile(droppedFile);
                      }
                    }}
                    sx={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#fafbfc',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: '#f0f7ff',
                      }
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 36, color: 'primary.main', mb: 1 }} />
                    <Typography variant="body2" fontWeight={600} color="textPrimary">
                      Click or drag & drop to attach a file
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Supports PDF, Images, Word, Excel, PPT, ZIP (up to 25MB)
                    </Typography>
                  </Box>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#f8fafc',
                      borderRadius: 2,
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} overflow="hidden">
                      {getFileIcon(file.name)}
                      <Box overflow="hidden">
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Remove file">
                      <IconButton size="small" onClick={handleRemoveFile} color="error">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                )}
              </Box>

              <FormControlLabel 
                control={<Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />} 
                label="Also send an email notification to the target audience immediately" 
              />

              <Button type="submit" variant="contained" color="primary" disabled={submitting} sx={{ alignSelf: 'flex-start', px: 4, py: 1 }}>
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </Button>
            </Stack>
          </form>
        </Card>
      )}

      <Typography variant="h5" fontWeight={600} mb={3}>Recent Announcements</Typography>
      
      {loading ? (
        <CircularProgress />
      ) : feeds.length === 0 ? (
        <Typography color="textSecondary">No announcements available.</Typography>
      ) : (
        <Stack spacing={3}>
          {feeds.map((feed) => (
            <Card key={feed._id} sx={{ p: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" color="primary.main" fontWeight={600} mb={1}>{feed.title}</Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {new Date(feed.createdAt).toLocaleDateString()} at {new Date(feed.createdAt).toLocaleTimeString()}
                  {isAdmin && <span style={{ marginLeft: 12 }}>• Target: <b>{feed.target_audience === 'all' ? 'All Employees' : `${feed.target_employees?.length || 0} Employees`}</b></span>}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{feed.description}</Typography>

                {/* Attached File Display */}
                {feed.file_url && (
                  <Box mt={2.5}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1.5,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 200, maxWidth: '100%' }}>
                        {getFileIcon(feed.file_name || feed.file_url)}
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
                            {feed.file_name || (feed.file_url.split('/').pop()?.split('_').slice(1).join('_') || 'Attached File')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Attachment
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<OpenInNewIcon fontSize="small" />}
                          href={feed.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<DownloadIcon fontSize="small" />}
                          href={feed.file_url}
                          target="_blank"
                          download
                        >
                          Download
                        </Button>
                      </Stack>
                    </Paper>

                    {/* Inline Image Preview */}
                    {isImageFile(feed.file_name || feed.file_url) && (
                      <Box mt={1.5} sx={{ maxWidth: 450, maxHeight: 300, overflow: 'hidden', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <a href={feed.file_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={feed.file_url}
                            alt={feed.file_name || 'Announcement Attachment'}
                            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                          />
                        </a>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Manage Access Modal */}
      <Dialog open={manageAccessModalOpen} onClose={() => setManageAccessModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Announcement Access</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={3} mt={1}>
            Select the employees who should have permission to create and send company announcements.
          </Typography>
          <Autocomplete
            multiple
            options={employees || []}
            getOptionLabel={(option) => `${option?.first_name || ''} ${option?.last_name || ''} (${option?.email || ''})`}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            value={selectedAccessEmployees || []}
            onChange={(e, newValue) => setSelectedAccessEmployees(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Employees" placeholder="Search employees..." />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setManageAccessModalOpen(false)} disabled={accessSaving}>Cancel</Button>
          <Button onClick={handleSaveManageAccess} variant="contained" color="primary" disabled={accessSaving}>
            {accessSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
