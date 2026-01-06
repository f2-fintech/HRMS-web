'use client';

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Paper,
  Divider,
  Container,
  useTheme,
  InputAdornment,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import axios from 'axios';

import { apiResponse } from '../../utility/apiResponse/employeesResponse';

interface QueryFormProps {
  onSubmit?: (queryData: any) => void; // optional + API ke baad callback
  query?: any;
  userRole: string;
  onClose: () => void;
  queryType: 'against' | 'own';
}

interface QueryFormData {
  toQuery: string;
  queryType: string;
  description: string;
  status?: string;
  company_id?: string;
}

const statuses = ['Pending', 'Resolved', 'On Process'];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';

// Teams filter (optional)
const ALLOWED_TEAM_IDS: string[] = [
  '68078c506a3572ff9478bd6c',
  '68e8feb4fa8c01760efccf87',
  '693d0c7f5c4e2f15ce95cf0b',
  '6957a5422381863817eb481d',
  '695cc3c45585adfa28ea6dbf',
  '695cb6645585adfa28e9bea3',
  '674abf5e2cb3ff920ea4a898',
  '680789b86a3572ff9478bcd2',
  '68078bdd6a3572ff9478bd50',

];

const ALLOWED_TEAM_NAMES: string[] = [
  'HR TEAM',
  'MARKETING TEAM',
  'IT TEAM',
  'Credit Team',
  'Ops Team',
  'IT & Infra'

];

const QueryForm: React.FC<QueryFormProps> = ({
  onSubmit,
  query,
  userRole,
  onClose,
  queryType,
}) => {
  const theme = useTheme();

  const user =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('user') || '{}')
      : {};
  const company_id = user?.company_id;

  const [formData, setFormData] = useState<QueryFormData>({
    toQuery: '',
    queryType: '',
    description: '',
    status: 'Pending',
    company_id,
  });

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // filtered list for "Query To"

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!query;
  const isAgainstQuery = queryType === 'against';

  // 🔹 Replies state
  const [replies, setReplies] = useState<any[]>(query?.replies || []);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // =========================
  // helper: team.employee_ids -> [id1, id2, ...]
  // =========================
  const getTeamEmployeeIds = (team: any): string[] => {
    if (!team || !team.employee_ids) return [];

    if (typeof team.employee_ids === 'string') {
      return team.employee_ids
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    if (Array.isArray(team.employee_ids)) {
      return team.employee_ids.map((id: any) =>
        typeof id === 'string' ? id : id?._id,
      );
    }

    return [];
  };

  const filterEmployeesByTeam = (team: any | null, source?: any[]) => {
    const base = source || allEmployees;

    if (!team) {
      setEmployees(base);
      return;
    }

    const ids = getTeamEmployeeIds(team);

    if (!ids.length) {
      setEmployees(base);
      return;
    }

    const filtered = base.filter((emp: any) => ids.includes(emp._id));
    setEmployees(filtered);
  };

  // =========================
  // initial load: employees + teams + edit prefill
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // employees
        const empRes = await apiResponse();
        const empData = Array.isArray(empRes)
          ? empRes
          : empRes.employees || empRes.data || empRes.results || [];
        setAllEmployees(empData);
        setEmployees(empData);

        // teams
        const token = localStorage.getItem('token') || '';
        const cid =
          localStorage.getItem('company_id') || company_id || '';

        const resp = await fetch(`${API_BASE_URL}/teams/get-all-teams`, {
          headers: {
            Authorization: `Bearer ${token} ${cid}`,
          },
        });

        const json = await resp.json();
        const teamArr: any[] = Array.isArray(json) ? json : json.teams || [];

        // 🔥 filter logic: sirf selected teams rakho
        let filteredTeams = teamArr;

        if (ALLOWED_TEAM_IDS.length || ALLOWED_TEAM_NAMES.length) {
          filteredTeams = teamArr.filter((t: any) => {
            const idAllowed = ALLOWED_TEAM_IDS.length
              ? ALLOWED_TEAM_IDS.includes(t._id)
              : false;
            const nameAllowed = ALLOWED_TEAM_NAMES.length
              ? ALLOWED_TEAM_NAMES.includes(t.name)
              : false;
            // agar dono arrays empty hain, sab allowed; warna koi ek true to allowed
            return ALLOWED_TEAM_IDS.length || ALLOWED_TEAM_NAMES.length
              ? idAllowed || nameAllowed
              : true;
          });
        }

        // edit mode pre-fill
        if (query) {
          setFormData({
            toQuery: query.toQuery?._id || query.toQuery || '',
            queryType: query.queryType || '',
            description: query.description || '',
            status: query.status || 'Pending',
            company_id: query.company_id,
          });

          const toQueryEmp = empData.find(
            (e: any) =>
              e._id === (query.toQuery?._id || query.toQuery),
          );

          if (toQueryEmp) {
            const empId = toQueryEmp._id;
            const teamOfEmp =
              teamArr.find((t: any) =>
                getTeamEmployeeIds(t).includes(empId),
              ) || null;

            if (teamOfEmp) {
              // ensure employee ka team list me ho, chahe allowed list me na bhi ho
              if (
                !filteredTeams.some((t: any) => t._id === teamOfEmp._id)
              ) {
                filteredTeams = [...filteredTeams, teamOfEmp];
              }

              setSelectedTeam(teamOfEmp);
              filterEmployeesByTeam(teamOfEmp, empData);
            }
          }

          setReplies(query.replies || []);
        }

        setTeams(filteredTeams);
      } catch (err) {
        console.error('Error loading teams/employees', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // =========================
  // handlers
  // =========================

  const handleTeamChange = (event: any, value: any) => {
    setSelectedTeam(value || null);
    setFormData(prev => ({ ...prev, toQuery: '' }));
    filterEmployeesByTeam(value || null);
  };

  const handleEmployeeChange = (event: any, value: any) => {
    setFormData(prev => ({
      ...prev,
      toQuery: value ? value._id : '',
    }));
  };

  const handleStatusChange = (event: any, value: string | null) => {
    setFormData(prev => ({ ...prev, status: value || 'Pending' }));
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // =========================
  // validation
  // =========================
  const validate = () => {
    const temp: { [k: string]: string } = {};
    if (!formData.toQuery) temp.toQuery = 'Assigned to name is required';
    if (!formData.queryType) temp.queryType = 'Query Type is required';
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  // =========================
  // submit: direct API call
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token') || '';
      const companyId = localStorage.getItem('company_id') || company_id || '';

      // DTO ke hisaab se payload
      const payload = {
        toQuery: formData.toQuery, // employee _id string
        queryType: formData.queryType,
        description: formData.description,
        status: formData.status || 'Pending',
        company_id: formData.company_id || companyId,
      };

      const isEdit = !!query;

      const url = isEdit
        ? `${API_BASE_URL}/queries/update/${query._id}`
        : `${API_BASE_URL}/queries/create`;

      const method: 'post' | 'put' = isEdit ? 'put' : 'post';

      const res = await axios[method](url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Query API success:', res.data);

      if (onSubmit) {
        onSubmit(res.data);
      }

      onClose();
    } catch (err: any) {
      console.error('Submission error:', err?.response?.data || err.message);
      alert(
        err?.response?.data?.message ||
        'Error while creating/updating query. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // reply: sirf admin + assignee
  // =========================

  const toQueryIdFromQuery =
    query &&
    (query.toQuery?._id ||
      query.toQuery?.id ||
      (typeof query.toQuery === 'string' ? query.toQuery : ''));

  const canReply =
    !!query &&
    (userRole === '1' ||
      (user?.id && String(toQueryIdFromQuery) === String(user.id)));

  const handleAddReply = async () => {
    if (!replyText.trim() || !query?._id || !canReply) return;

    try {
      setReplySubmitting(true);

      const token = localStorage.getItem('token') || '';
      const companyId =
        localStorage.getItem('company_id') || company_id || '';

      const payload = {
        query_id: query._id,
        message: replyText.trim(),
        company_id: companyId,
      };

      const res = await axios.post(
        `${API_BASE_URL}/queries/reply`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const newReply =
        res.data?.reply ||
        res.data || {
          message: replyText.trim(),
          createdAt: new Date().toISOString(),
          employee: {
            first_name: user?.first_name,
            last_name: user?.last_name,
            image: user?.image,
          },
        };

      setReplies(prev => [...prev, newReply]);
      setReplyText('');
    } catch (err: any) {
      console.error('Reply error:', err?.response?.data || err.message);
      alert(
        err?.response?.data?.message ||
        'Reply send karte waqt error aaya. Please try again.',
      );
    } finally {
      setReplySubmitting(false);
    }
  };

  // =========================
  // derived values
  // =========================
  const createdByEmployee = allEmployees.find(
    emp => emp._id === (query?.employee?._id || query?.employee),
  );
  const toQueryEmployee = employees.find(
    emp => emp._id === formData.toQuery,
  );

  // =========================
  // JSX
  // =========================
  return (
    <Container maxWidth="md">
      <Paper
        elevation={6}
        sx={{
          mt: 4,
          mb: 4,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[4],
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #4791db 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold" color="inherit">
              {query ? 'Edit Query' : 'Create a New Query'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 4,
            '& .MuiTextField-root': { mb: 2 },
            '& .MuiAutocomplete-root': { mb: 2 },
          }}
        >
          <Grid container spacing={3}>
            {/* Query By (only in edit) */}
            {query && (
              <Grid item xs={12}>
                <Autocomplete
                  options={allEmployees}
                  getOptionLabel={o =>
                    `${o.first_name} ${o.last_name}`.trim()
                  }
                  loading={loading}
                  value={createdByEmployee || null}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Query By"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {loading && (
                              <CircularProgress
                                color="inherit"
                                size={20}
                              />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  disabled
                />
              </Grid>
            )}

            {/* Department / Team */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={teams}
                getOptionLabel={o => o.name || o.code || ''}
                value={selectedTeam}
                onChange={handleTeamChange}
                loading={loading && !teams.length}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Department"
                    placeholder="Select Department"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {loading && (
                            <CircularProgress
                              color="inherit"
                              size={20}
                            />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                disabled={isEditMode && isAgainstQuery}
              />
            </Grid>

            {/* Query To (filtered by team) */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={employees}
                getOptionLabel={o =>
                  `${o.first_name} ${o.last_name}`.trim()
                }
                loading={loading}
                onChange={handleEmployeeChange}
                value={toQueryEmployee || null}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Query To"
                    placeholder="Select Employee"
                    error={!!errors.toQuery}
                    helperText={errors.toQuery}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {loading && (
                            <CircularProgress
                              color="inherit"
                              size={20}
                            />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    disabled={isEditMode}
                  />
                )}
              />
            </Grid>

            {/* Query Type */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Query Type"
                name="queryType"
                value={formData.queryType}
                onChange={handleChange}
                error={!!errors.queryType}
                helperText={errors.queryType}
                disabled={isEditMode && isAgainstQuery}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <Autocomplete
                options={statuses}
                value={
                  statuses.find(s => s === formData.status) || null
                }
                onChange={(_, value) =>
                  handleStatusChange(_, value || 'Pending')
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Status"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CheckCircleIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                disabled={!query || !(userRole === '1' || isAgainstQuery)}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                disabled={isEditMode && isAgainstQuery}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Grid>

            {/* 🔥 Replies Section (only edit mode) */}
            {query && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Replies / Discussion
                </Typography>

                {/* Existing replies list */}
                <Box
                  sx={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    mb: 2,
                    pr: 1,
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    p: 1.5,
                    backgroundColor: '#fafafa',
                  }}
                >
                  {replies && replies.length > 0 ? (
                    replies.map((r: any, idx: number) => (
                      <Box
                        key={r._id || idx}
                        sx={{
                          mb: 1.5,
                          pb: 1,
                          borderBottom:
                            idx !== replies.length - 1
                              ? '1px solid #e5e7eb'
                              : 'none',
                        }}
                      >
                        <Typography fontWeight={600} variant="subtitle2">
                          {r?.employee
                            ? `${r.employee.first_name || ''} ${r.employee.last_name || ''
                              }`.trim()
                            : 'User'}
                        </Typography>
                        <Typography variant="body2">
                          {r?.message}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No replies till now
                    </Typography>
                  )}
                </Box>

                {/* Add new reply (sirf admin + assignee) */}
                <Box display="flex" gap={1} alignItems="flex-start">
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={4}
                    placeholder={
                      canReply
                        ? 'Type Your Reply'
                        : 'Sirf admin ya "Only the admin or the person to whom the query is assigned can reply.'
                    }
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    disabled={!canReply}
                  />
                  <Button
                    variant="contained"
                    sx={{
                      minWidth: 100, height: '10%',
                      alignSelf: 'center', mt: '7px'
                    }}
                    disabled={replySubmitting || !replyText.trim() || !canReply}
                    onClick={handleAddReply}
                  >
                    {replySubmitting ? 'Sending…' : 'Reply'}
                  </Button>
                </Box>
              </Grid>
            )}

            {/* Submit */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={!submitting && <AssignmentIcon />}
                disabled={submitting}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                  background:
                    'linear-gradient(135deg, #1976d2 0%, #4791db 100%)',
                  boxShadow: theme.shadows[3],
                  '&:hover': {
                    boxShadow: theme.shadows[5],
                    background:
                      'linear-gradient(135deg, #1565c0 0%, #2196f3 100%)',
                  },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : query ? (
                  'Update Query'
                ) : (
                  'Submit Query'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default QueryForm;
