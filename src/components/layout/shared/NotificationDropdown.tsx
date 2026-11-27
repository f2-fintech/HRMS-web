'use client';

import { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, Typography, Box, Tabs, Tab, Divider, List, ListItem, ListItemText, ListItemIcon, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

interface NotificationData {
  birthdays: any[];
  anniversaries: any[];
  payments: any[];
  feeds?: any[];
}

export default function NotificationDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData>({ birthdays: [], anniversaries: [], payments: [], feeds: [] });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Optionally set up an interval to refresh
    const interval = setInterval(fetchNotifications, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      const safeData = {
        birthdays: data.birthdays || [],
        anniversaries: data.anniversaries || [],
        payments: data.payments || [],
        feeds: data.feeds || []
      };

      setNotifications(safeData);

      const tCount = safeData.birthdays.length + safeData.anniversaries.length + safeData.payments.length + safeData.feeds.length;
      const lastSeenStr = localStorage.getItem('lastSeenNotifications');
      if (lastSeenStr !== JSON.stringify(safeData)) {
        setUnreadCount(tCount);
      } else {
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setUnreadCount(0);
    localStorage.setItem('lastSeenNotifications', JSON.stringify(notifications));
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const totalCount = notifications.birthdays.length + notifications.anniversaries.length + (notifications.payments ? notifications.payments.length : 0) + (notifications.feeds ? notifications.feeds.length : 0);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <i className="ri-notification-3-line" style={{ fontSize: 24 }} />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 380, maxHeight: 500, mt: 1.5 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</Typography>
          <Badge badgeContent={unreadCount} color="primary" />
        </Box>
        <Divider />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Announcements" />
            <Tab label="Birthdays" />
            <Tab label="Anniversaries" />
            {notifications.payments && notifications.payments.length > 0 && <Tab label="Payments" />}
          </Tabs>
        </Box>
        <List sx={{ p: 0, maxHeight: 350, overflowY: 'auto' }}>
          {tabIndex === 0 && (
            notifications.feeds && notifications.feeds.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No announcements</Box>
            ) : (
              (notifications.feeds || []).map((f, i) => (
                <ListItem key={i} divider button onClick={() => setSelectedAnnouncement(f)}>
                  <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>📢</ListItemIcon>
                  <ListItemText primary={f.title} secondary={new Date(f.date).toLocaleDateString()} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
                  <Button size="small" variant="text" color="primary">View</Button>
                </ListItem>
              ))
            )
          )}
          {tabIndex === 1 && (
            notifications.birthdays.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No upcoming birthdays</Box>
            ) : (
              notifications.birthdays.map((b, i) => (
                <ListItem key={i} divider>
                  <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>🎂</ListItemIcon>
                  <ListItemText primary={b.message} secondary={new Date(b.date).toLocaleDateString()} primaryTypographyProps={{ fontSize: 14 }} />
                </ListItem>
              ))
            )
          )}
          {tabIndex === 2 && (
            notifications.anniversaries.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>No upcoming work anniversaries</Box>
            ) : (
              notifications.anniversaries.map((a, i) => (
                <ListItem key={i} divider>
                  <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>🎉</ListItemIcon>
                  <ListItemText primary={a.message} secondary={new Date(a.date).toLocaleDateString()} primaryTypographyProps={{ fontSize: 14 }} />
                </ListItem>
              ))
            )
          )}
          {tabIndex === 3 && (
            notifications.payments && notifications.payments.map((p, i) => (
              <ListItem key={i} divider>
                <ListItemIcon sx={{ minWidth: 36, fontSize: 20 }}>
                  {p.type === 'delayed' ? '⚠️' : 'ℹ️'}
                </ListItemIcon>
                <ListItemText primary={p.message} primaryTypographyProps={{ fontSize: 14, color: p.type === 'delayed' ? 'error.main' : 'warning.main' }} />
              </ListItem>
            ))
          )}
        </List>
      </Menu>
      <Dialog open={Boolean(selectedAnnouncement)} onClose={() => setSelectedAnnouncement(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedAnnouncement?.title}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedAnnouncement?.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAnnouncement(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
