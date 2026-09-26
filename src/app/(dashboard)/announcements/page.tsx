'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Button, TextField, Checkbox, FormControlLabel, RadioGroup, Radio, FormControl, Autocomplete, Stack, Divider, CircularProgress } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

export default function AnnouncementsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific'>('all');
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (String(user.role) === '1') setIsAdmin(true);
    fetchFeeds();
    if (String(user.role) === '1') fetchEmployees();
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
      
      const res = await fetch(`${API_BASE_URL}/employees/get?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token} ${companyId}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.employees || data.data || [];
      setEmployees(list.filter((e: any) => e.status === 'active' || e.status === 'Active' || !e.status));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return alert('Title and description are required.');
    if (targetAudience === 'specific' && selectedEmployees.length === 0) return alert('Please select at least one employee.');

    try {
      setSubmitting(true);
      const payload = {
        title,
        description,
        target_audience: targetAudience,
        target_employees: targetAudience === 'specific' ? selectedEmployees.map(emp => emp._id) : [],
        send_email: sendEmail
      };

      const res = await fetch(`${API_BASE_URL}/feeds`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Announcement created successfully!');
        setTitle('');
        setDescription('');
        setTargetAudience('all');
        setSelectedEmployees([]);
        setSendEmail(false);
        fetchFeeds();
      } else {
        alert('Failed to create announcement');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant="h4" fontWeight={700} mb={4}>Company Announcements</Typography>

      {isAdmin && (
        <Card sx={{ mb: 6, p: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight={600} mb={3}>Create New Announcement</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField label="Announcement Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} required />
              <TextField label="Description" fullWidth multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
              
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
                  options={employees}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
                  value={selectedEmployees}
                  onChange={(e, newValue) => setSelectedEmployees(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Employees" placeholder="Search employees..." />
                  )}
                />
              )}

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
                  {isAdmin && <span style={{ marginLeft: 12 }}>• Target: <b>{feed.target_audience === 'all' ? 'All Employees' : `${feed.target_employees.length} Employees`}</b></span>}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{feed.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </div>
  );
}
