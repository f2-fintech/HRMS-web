'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { Snackbar, Alert, MenuItem, Select } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  createExpense,
  listExpenses,
  todayISO,
  adminVerifyExpense,
  updateExpense,
  softDeleteExpense,
} from './expenseApi';
import { fetchEmployees } from '@/redux/features/employees/employeesSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5500';
const getFileNameFromUrl = (url: string) => {
  try {
    const clean = String(url || '').split('?')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    return decodeURIComponent(last || url);
  } catch {
    return url;
  }
};
const prettyFileName = (url: string) => {
  const name = getFileNameFromUrl(url);
  return name.replace(/^\d{10,}-/, '');
};
const isImageUrl = (url: string) =>
  /\.(png|jpe?g|webp|gif)$/i.test(String(url || '').split('?')[0]);
const isPdfUrl = (url: string) => /\.pdf(\?|$)/i.test(String(url || '').split('?')[0]);
const getStatusChipStyle = (status: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
  };

  switch (status) {
    case 'approved':
      return { ...base, background: 'rgba(34,197,94,0.12)', color: '#166534' };
    case 'paid':
      return { ...base, background: 'rgba(59,130,246,0.12)', color: '#1d4ed8' };
    case 'rejected':
      return { ...base, background: 'rgba(239,68,68,0.12)', color: '#b91c1c' };
    case 'pending':
    default:
      return { ...base, background: 'rgba(148,163,184,0.12)', color: '#475569' };
  }
};
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'paid':
      return 'Paid';
    case 'rejected':
      return 'Rejected';
    case 'pending':
    default:
      return 'Pending';
  }
};

// -------- options ----------
const companyAdminOptions = [
  { label: 'Choose Category', value: '' },
  { label: 'Cake', value: 'cake' },
  { label: 'Advance Payment', value: 'advance_payment' },
  { label: 'Stationery', value: 'stationary' },
  { label: 'Water', value: 'water' },
  { label: 'Tea', value: 'tea' },
  { label: 'Internet', value: 'internet' },
  { label: 'Lease Line', value: 'lease_line' },
  { label: 'Leave Encashment', value: 'leave_encashment' },
  { label: 'Dialer', value: 'dialer' },
  { label: 'SIM', value: 'sim' },
  { label: 'Cloud / AI', value: 'cloud_ai' },
  { label: 'AWS Server', value: 'aws_server' },
  { label: 'Rent - Bareilly', value: 'rent_bareilly' },
  { label: 'Rent - Noida', value: 'rent_noida_first_floor' },
  { label: 'Rent - Noida Ground Floor', value: 'rent_noida_ground_floor' },
  { label: 'System Rent', value: 'system_rent' },
  { label: 'Decor', value: 'decor' },
  { label: 'Gifting', value: 'gifting' },
  { label: 'Company Outing', value: 'company_outing' },
  { label: 'Company Get Together', value: 'company_parties' },
  { label: 'IT Consultancy', value: 'it_consultancy' },
  { label: 'Headphones', value: 'headphones' },
  { label: 'Mouse', value: 'mouse' },
  { label: 'Repairs', value: 'repairs' },
  { label: 'Electricity', value: 'electricity' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'convince & Petrol', value: 'convenience_petrol' },
  { label: 'Cab', value: 'cab' },
  { label: 'Travel & Reimbursement', value: 'travel_reimbursement' },
  { label: 'Food & Beverages', value: 'food_beverages' },
  { label: 'Community Building Expense', value: 'community_building_expense' },
  { label: 'Collab Events & Marketing', value: 'collab_events_marketing' },
  { label: 'Advertisement', value: 'advertisement' },
  { label: 'Overtime', value: 'overtime' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Incentives', value: 'incentives' },
  { label: 'Contests', value: 'contests' },

  { label: 'Company Approved Expenses', value: 'company_approval' },
  { label: 'Channel Partner Payment', value: 'expense_channel' },
  { label: 'Payout', value: 'payout' },
  { label: 'Gift/Consultancy to a Customer', value: 'cashback_to_customer' },
  { label: 'Referral Partner Payment', value: 'referral_partner' },
  { label: 'Leave Encashment', value: 'leave_encashment' },
  { label: 'Data Purchase', value: 'data_purchase' },
  { label: 'Management Expense(Harpreet Singh)', value: 'Harpreet_singh_Management' },
  { label: 'Management Expense(Abhinav Awal)', value: 'Abhinav_Awal_Management' },
  { label: 'Others', value: 'other' },
] as const;

type CompanyAdminValue = (typeof companyAdminOptions)[number]['value'];

const companyApprovalOptions = [
  { label: 'Company Approved Expenses', value: 'company_approval' },
  { label: 'Channel Partner Payment', value: 'expense_channel' },
  { label: 'Payout', value: 'payout' },
  { label: 'Gift/Consultancy to a Customer', value: 'cashback_to_customer' },
  { label: 'Referral Partner Payment', value: 'referral_partner' },
  { label: 'Leave Encashment', value: 'leave_encashment' },
  { label: 'Data Purchase', value: 'data_purchase' },
  { label: 'Management Expense(Harpreet Singh)', value: 'Harpreet_singh_Management' },
  { label: 'Management Expense(Abhinav Awal)', value: 'Abhinav_Awal_Management' },
] as const;

type CompanyApprovalValue = (typeof companyApprovalOptions)[number]['value'];

const ALLOWED_TEAM_IDS: string[] = [
  '674abf192cb3ff920ea4a894',
  '680789b86a3572ff9478bcd2',
  '68078bdd6a3572ff9478bd50',
  '68078c506a3572ff9478bd6c',
  '68e8feb4fa8c01760efccf87',
  '693d0c7f5c4e2f15ce95cf0b',
  '6957a5422381863817eb481d',
  '695cb6645585adfa28e9bea3',
  '695ce778b71faf497ee89a54',
  '695df229e3d5943c537019ce',

];

type TeamConfig = {
  categories: CompanyAdminValue[];
  approvals: CompanyApprovalValue[];
};

const TEAM_CONFIG_MAP: Record<string, TeamConfig> = {

  // admin
  // '695df229e3d5943c537019ce': {
  //   categories: [
  //     'tea',
  //     'water',
  //     'stationary',
  //     'leave_encashment',
  //     'bonus',
  //     'overtime',
  //     'advance_payment',
  //     'leave_encashment',
  //     'conveyance_petrol',
  //     'travel_reimbursement',
  //     'overtime',
  //     'bonus',
  //     'incentives',
  //     'other',
  //     'expense_channel',
  //     'payout',
  //     'cashback_to_customer',
  //     'referral_partner',
  //     'Harpreet_singh_Management',
  //     'Abhinav_Awal_Management',
  //     'other',

  //   ],
  //   approvals: ['company_approval'],
  // },
  // admin
  '674abf192cb3ff920ea4a894': {
    categories: [
      'advance_payment',
      'leave_encashment', //spelling wrong

      'travel_reimbursement',
      'overtime',
      'bonus',
      'incentives',
      'other',
      'expense_channel',
      'payout',//sourcer payment
      'cashback_to_customer',
      'referral_partner',

    ],
    approvals: ['company_approval'],
  },
  //HR
  '680789b86a3572ff9478bcd2': {
    categories: [
      'cake',
      'stationary',
      'tea',
      'water',
      'decor',
      'gifting',
      'food_beverages',
      'company_outing',
      'overtime',
      'rent_noida_first_floor',
      'rent_bareilly',
      'stationary',
      'bonus',
      'contests',
      'leave_encashment',
      'bonus',
      'overtime',
      'advance_payment',
      'Harpreet_singh_Management',
      'Abhinav_Awal_Management',
      'other',
    ],
    approvals: ['company_approval'],
  },

  // Marketing
  '68078bdd6a3572ff9478bd50': {
    categories: [
      'data_purchase',
      'overtime',
      'advertisement',
      // 'convenience_petrol',
      'cab',
      'travel_reimbursement',
      'collab_events_marketing',
      'community_building_expense',
      'food_beverages',
      'advertisement',
      'incentives',
      'contests',
      'other',
    ],
    approvals: ['company_approval', 'expense_channel'],
  },


  '6957a5422381863817eb481d': {
    categories: [
      'sim',
      'system_rent',
      'advance_payment',
      'dialer',
      'travel_reimbursement',
      'internet',
      'incentives',
      'cloud_ai',
      'other',
    ],
    approvals: ['company_approval', 'expense_channel'],
  },
  '68078c506a3572ff9478bd6c': {
    categories: [
      'bonus',
      'overtime',
      'advance_payment',
      'leave_encashment',
      'incentives',
      'cloud_ai',
      'other',
    ],
    approvals: ['company_approval', 'expense_channel'],
  },
  '695df229e3d5943c537019ce': {
    categories: [
      // 'advance_payment',
      'stationary',
      'water',
      'tea',
      'repairs',
      'maintenance',
      'travel_reimbursement',
      'food_beverages',
      'Harpreet_singh_Management',
      'Abhinav_Awal_Management',
      'other',

    ],
    approvals: ['company_approval', 'expense_channel'],
  },
  '695ce778b71faf497ee89a54': {
    categories: [
      'payout',
      'gifting',
      'data_purchase',
      'advance_payment',
      'rent_bareilly',
      'rent_noida_first_floor',
      'company_outing',
      'it_consultancy',
      'travel_reimbursement',
      'food_beverages',
      'referral_partner',
      'Harpreet_singh_Management',
      'community_building_expense',
      'Abhinav_Awal_Management',
      'other',
    ],
    approvals: ['company_approval', 'expense_channel'],
  },
  '68e8feb4fa8c01760efccf87': {
    categories: [
      'bonus',
      'travel_reimbursement',
      'overtime',
      'advance_payment',
      'other',
    ],
    approvals: ['company_approval', 'expense_channel'],
  },
  '695cb6645585adfa28e9bea3': {
    categories: [
      'bonus',
      'overtime',
      'travel_reimbursement',
      'leave_encashment',
      'Harpreet_singh_Management',
      'Abhinav_Awal_Management',
      'other',
    ],
    approvals: ['company_approval', 'expense_channel'],
  },


  '693d0c7f5c4e2f15ce95cf0b': {
    categories: [
      'bonus',
      'payout',
      'incentives',
      'overtime',
      'cashback_to_customer',
      'expense_channel',
      'referral_partner',
      'leave_encashment',

      'advance_payment',
      'travel_reimbursement',
      'other',
    ],
    approvals: [
      'company_approval',
      'expense_channel'
    ],
  },
};

type EmployeeType = {
  _id: string;
  first_name: string;
  last_name: string;
  image?: string;
};

type UserLS = {
  _id?: string;
  id?: string;
  role?: number | string;
  role_id?: number | string;
  user_role?: number | string;
  employee_role?: number | string;
  company_id?: string;
};

type PaymentMode = 'account' | 'upi' | 'qr';
type TeamType = { _id: string; name?: string; code?: string };


const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#55657a',
};
const cardStyle: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  background: '#ffffff',
  border: '1px solid #eef2f7',
  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
  overflow: 'hidden',
};

const cardInner: React.CSSProperties = {
  padding: 16,
};
const fieldInputStyle: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: 10,
  border: '1px solid #dde2eb',
  fontSize: 13,
  outline: 'none',
  background: '#fdfdfd',
};
const sectionStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  border: '1px solid #f1f5f9',
  background: '#fafafa',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 12,
  alignItems: 'end',
};

const fieldWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};



const actionRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 14,
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingTop: 12,
  borderTop: '1px solid #f1f5f9',
};


const pillButtonPrimary: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, #0aa674, #068f63)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 6px 16px rgba(6, 143, 99, 0.25)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const pillButtonGhost: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid #dde2eb',
  background: '#f8fafc',
  color: '#4b5563',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

// --- graph helpers ---
const monthKey = (d: string) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const dayKey = (d: string) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return String(dt.getDate()).padStart(2, '0');
};

const currencyINR = (n: number) =>
  `₹ ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// --- upcoming payment helpers ---
const parseYMD = (ymd?: string) => {
  if (!ymd) return null;
  const s = String(ymd).slice(0, 10);
  const dt = new Date(`${s}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const ymdOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ExpenseAdmin() {
  const dispatch = useDispatch<AppDispatch>();
  const defaultDate = useMemo(() => todayISO(), []);

  // Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpenSnackbar(false);
  };

  // USER (ADMIN CHECK)
  const { isAdmin } = useMemo(() => {
    if (typeof window === 'undefined') return { isAdmin: false };
    const user: UserLS = JSON.parse(localStorage.getItem('user') || '{}');
    const rRaw = user?.role ?? user?.role_id ?? user?.user_role ?? user?.employee_role ?? 0;
    const r = Number(rRaw) || 0;
    return { isAdmin: r === 1 };
  }, []);

  // EMPLOYEES
  const employees = useSelector((state: RootState) => (state as any)?.employees?.employees || []) as EmployeeType[];

  useEffect(() => {
    if (!employees || employees.length === 0) dispatch(fetchEmployees());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empMap = useMemo(() => {
    const m = new Map<string, EmployeeType>();
    (employees || []).forEach((e) => {
      if (!e?._id) return;
      m.set(String(e._id), e);
    });
    return m;
  }, [employees]);

  const getEmpData = (idOrObj: any): { name: string; image?: string } => {
    if (!idOrObj) return { name: '-', image: '' };

    if (typeof idOrObj === 'object') {
      const _id = idOrObj?._id ? String(idOrObj._id) : '';
      const nameFromObj = idOrObj?.first_name
        ? `${idOrObj.first_name} ${idOrObj.last_name || ''}`.trim()
        : undefined;
      const empFromMap = _id && empMap.has(_id) ? empMap.get(_id)! : undefined;

      const name =
        nameFromObj ||
        (empFromMap ? `${empFromMap.first_name} ${empFromMap.last_name || ''}`.trim() : _id || '-');

      const image = idOrObj?.image || empFromMap?.image || '';
      return { name: name || '-', image };
    }

    const id = String(idOrObj);
    const emp = empMap.get(id);
    if (emp) return { name: `${emp.first_name} ${emp.last_name || ''}`.trim() || id, image: emp.image };
    return { name: id, image: '' };
  };

  // ✅ TEAMS (Department dropdown) + Invoice Date
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [department, setDepartment] = useState(''); // team_id
  const [invoiceDate, setInvoiceDate] = useState<string>(''); // YYYY-MM-DD

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);

        const token = localStorage.getItem('token') || '';
        const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
        const company_id = (user as any)?.company_id || '';
        const cid = localStorage.getItem('company_id') || company_id || '';

        const resp = await fetch(`${API_BASE_URL}/teams/get-all-teams`, {
          headers: {
            Authorization: `Bearer ${token} ${cid}`,
          },
        });

        const rawText = await resp.text();
        let json: any = {};
        try {
          json = rawText ? JSON.parse(rawText) : {};
        } catch {
          console.error('Teams API non-JSON:', rawText);
          json = {};
        }

        if (!resp.ok) {
          console.error('Teams API failed:', resp.status, json || rawText);
          setTeams([]);
          return;
        }

        const teamArr: any[] =
          Array.isArray(json) ? json : Array.isArray(json?.teams) ? json.teams : Array.isArray(json?.data) ? json.data : [];

        let filteredTeams = teamArr;
        if (ALLOWED_TEAM_IDS.length) {
          filteredTeams = teamArr.filter((t: any) => ALLOWED_TEAM_IDS.includes(String(t._id)));
        }

        const cleaned: TeamType[] = filteredTeams
          .map((t: any) => ({ _id: String(t._id), name: t.name || '', code: t.code || '' }))
          .filter((t) => t._id);

        cleaned.sort((a, b) => String(a.name || a.code || '').localeCompare(String(b.name || b.code || '')));

        setTeams(cleaned);
      } catch (e) {
        console.error('fetchTeams error:', e);
        setTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // CREATE / EDIT STATES
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [date, setDate] = useState(defaultDate);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState<string>('');

  const [companyAdmin, setCompanyAdmin] = useState<CompanyAdminValue>('');
  const [customCategory, setCustomCategory] = useState('');
  const [companyApproval, setCompanyApproval] = useState<CompanyApprovalValue>('company_approval');

  const [paidAmount, setPaidAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [invoices, setInvoices] = useState<File[]>([]);
  const [managerId] = useState<string>('');

  const [expenseChannel, setExpenseChannel] = useState('');
  const [cashbackToCustomer, setCashbackToCustomer] = useState(false);
  const [referralPartner, setReferralPartner] = useState('');

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('account');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrNote, setQrNote] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [showGraphs, setShowGraphs] = useState(false);
  const [actualPaymentDate, setActualPaymentDate] = useState<string>('');
  const [adminVerifyFiles, setAdminVerifyFiles] = useState<File[]>([]);
  // ✅ Month filter (default current month)
  const now = useMemo(() => new Date(), []);
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(now.getMonth() + 1); // 1-12

  const monthLabel = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

  const monthOptions = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 },
  ] as const;

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i); // last 3 + next 2

  const isOther = companyAdmin === 'other';

  const resetForm = () => {
    setDate(defaultDate);
    setExpectedPaymentDate('');
    setCompanyAdmin('');
    setCustomCategory('');
    setCompanyApproval('company_approval');
    setPaidAmount('');
    setDescription('');
    setInvoices([]);
    setExpenseChannel('');
    setCashbackToCustomer(false);
    setReferralPartner('');
    setPaymentMode('account');
    setAccountHolder('');
    setBankName('');
    setAccountNumber('');
    setIfsc('');
    setUpiId('');
    setQrNote('');
    setQrFile(null);
    setEditingId(null);

    setDepartment('');
    setInvoiceDate('');
  };

  const filteredCompanyAdminOptions = useMemo(() => {
    if (!department) return companyAdminOptions.filter((o) => o.value === '');
    const allowed = TEAM_CONFIG_MAP[String(department)]?.categories || [];
    return companyAdminOptions.filter((o) => o.value === '' || allowed.includes(o.value));
  }, [department]);

  //   const cfg = TEAM_CONFIG_MAP[String(department)];

  //   // ✅ agar map me entry nahi: sab approvals dikhado
  //   if (!cfg) return companyApprovalOptions;

  //   const allowed = cfg.approvals || [];
  //   if (!allowed.length) return companyApprovalOptions;

  //   return companyApprovalOptions.filter((o) => allowed.includes(o.value));
  // }, [department]);


  // ✅ keep selections valid when department changes
  useEffect(() => {
    if (!department) {
      setCompanyAdmin('');
      setCompanyApproval('company_approval');
      setCustomCategory('');
      return;
    }

    const cfg = TEAM_CONFIG_MAP[String(department)];

    // const allowedCats = cfg?.categories || [];
    // if (companyAdmin && allowedCats.length && !allowedCats.includes(companyAdmin)) {
    //   setCompanyAdmin('');
    //   setCustomCategory('');
    // }

    const allowedApprovals = cfg?.approvals || [];
    if (companyApproval && allowedApprovals.length && !allowedApprovals.includes(companyApproval)) {
      setCompanyApproval('company_approval');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  // LIST STATES
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const totalPages = Math.max(1, Math.ceil((total || 0) / 10));

  const [note, setNote] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [verifyingId, setVerifyingId] = useState<string>('');

  // 🆕 Payment preview: text + invoices + QR
  const [paymentPreview, setPaymentPreview] = useState<{
    text: string;
    invoices: string[];
    qrUrl?: string | null;
  } | null>(null);

  // ✅ Text preview (Description / Admin Note)
  const [textPreview, setTextPreview] = useState<{ title: string; text: string } | null>(null);

  const showCategory = (r: any) => (r?.company_admin === 'other' ? r?.custom_category || 'Other' : r?.company_admin);

  // LOAD LIST
  const load = async () => {
    try {
      setLoadingList(true);
      if (!isAdmin) {
        setRows([]);
        setTotal(0);
        return;
      }
      const res = await listExpenses({
        page, limit: 10, month: filterMonth,
        year: filterYear,
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
      setTotal(res?.total || data.length);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isAdmin, filterMonth, filterYear]);

  const currentMonth = useMemo(() => monthLabel(filterYear, filterMonth), [filterYear, filterMonth]);
  const currentMonthRows = useMemo(() => rows || [], [rows]); // already filtered from backend

  const monthTotal = useMemo(
    () => currentMonthRows.reduce((sum, r) => sum + Number(r.paid_amount || 0), 0),
    [currentMonthRows],
  );

  const dailySeries = useMemo(() => {
    const map = new Map<string, number>();
    currentMonthRows.forEach((r) => {
      const k = dayKey(r.date);
      map.set(k, (map.get(k) || 0) + Number(r.paid_amount || 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([day, amount]) => ({ day, amount }));
  }, [currentMonthRows]);

  const categorySeries = useMemo(() => {
    const map = new Map<string, number>();
    currentMonthRows.forEach((r) => {
      const cat = showCategory(r) || 'Other';
      map.set(cat, (map.get(cat) || 0) + Number(r.paid_amount || 0));
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, amount]) => ({ category, amount }));
  }, [currentMonthRows]);
  const buildFullMonthSeries = (year: number, month: number, apiDaily: { day: string; amount: number }[]) => {
    const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-12
    const map = new Map<number, number>();
    apiDaily.forEach((d) => map.set(Number(d.day), Number(d.amount || 0)));

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { day: String(day).padStart(2, '0'), amount: map.get(day) || 0 };
    });
  };


  const statusTotals = useMemo(() => {
    const m: Record<string, number> = { pending: 0, approved: 0, paid: 0, rejected: 0 };
    currentMonthRows.forEach((r) => {
      const st = String(r.admin_status || 'pending');
      m[st] = (m[st] || 0) + Number(r.paid_amount || 0);
    });
    return m;
  }, [currentMonthRows]);

  // ======== UPCOMING PAYMENTS (expected date based) =========
  const todayDT = useMemo(() => parseYMD(todayISO())!, []);
  const upcomingBase = useMemo(() => {
    return (rows || []).filter((r) => {
      const st = String(r.admin_status || 'pending');
      const exp = parseYMD(r.expected_payment_date);
      if (!exp) return false;
      if (st === 'paid' || st === 'rejected') return false;
      return true;
    });
  }, [rows]);

  const upcomingSummary = useMemo(() => {
    let dueToday = 0;
    let dueNext7 = 0;
    let overdue = 0;
    let totalOpen = 0;

    const byDate = new Map<string, number>();

    upcomingBase.forEach((r) => {
      const exp = parseYMD(r.expected_payment_date);
      if (!exp) return;
      const amt = Number(r.paid_amount || 0);
      if (!Number.isFinite(amt)) return;

      totalOpen += amt;

      const diffDays = Math.floor((exp.getTime() - todayDT.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) overdue += amt;
      if (diffDays === 0) dueToday += amt;
      if (diffDays >= 0 && diffDays <= 7) dueNext7 += amt;

      const k = ymdOf(exp);
      byDate.set(k, (byDate.get(k) || 0) + amt);
    });

    const nextDates = Array.from(byDate.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);

    const overdueRows = upcomingBase
      .filter((r) => {
        const exp = parseYMD(r.expected_payment_date);
        if (!exp) return false;
        return exp.getTime() < todayDT.getTime();
      })
      .sort((a, b) => {
        const ea = parseYMD(a.expected_payment_date)?.getTime() || 0;
        const eb = parseYMD(b.expected_payment_date)?.getTime() || 0;
        return ea - eb;
      })
      .slice(0, 10);

    const upcomingRows = upcomingBase
      .filter((r) => {
        const exp = parseYMD(r.expected_payment_date);
        if (!exp) return false;
        return exp.getTime() >= todayDT.getTime();
      })
      .sort((a, b) => {
        const ea = parseYMD(a.expected_payment_date)?.getTime() || 0;
        const eb = parseYMD(b.expected_payment_date)?.getTime() || 0;
        return ea - eb;
      })
      .slice(0, 10);

    return { dueToday, dueNext7, overdue, totalOpen, nextDates, overdueRows, upcomingRows };
  }, [upcomingBase, todayDT]);

  // ADMIN VERIFY
  async function verify(id: string, status: 'approved' | 'rejected' | 'paid' | 'pending') {
    try {
      if (!isAdmin) return;
      setVerifyingId(id);

      await adminVerifyExpense(id, { status, note, actual_payment_date: actualPaymentDate || undefined }, adminVerifyFiles);
      setSelectedId('');
      setSelectedRow(null);
      setNote('');
      setActualPaymentDate('');
      await load();

      let msg = '';
      let severity: 'success' | 'error' | 'info' | 'warning' = 'success';

      switch (status) {
        case 'approved':
          msg = 'Expense approved successfully ✅';
          severity = 'success';
          break;
        case 'paid':
          msg = 'Expense marked as PAID 💸';
          severity = 'success';
          break;
        case 'rejected':
          msg = 'Expense rejected';
          severity = 'error';
          break;
        case 'pending':
        default:
          msg = 'Status set to Pending';
          severity = 'info';
          break;
      }

      showSnackbar(msg, severity);
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message || err?.message || 'Error while verifying', 'error');
    } finally {
      setVerifyingId('');
    }
  }

  // START EDIT
  const startEdit = (row: any) => {
    setOpen(true);
    setEditingId(row._id || null);

    setDepartment(row.department ? String(row.department?._id || row.department) : '');
    setInvoiceDate(row.invoice_date ? String(row.invoice_date).slice(0, 10) : '');

    setDate(row.date?.slice(0, 10) || defaultDate);
    setExpectedPaymentDate(row.expected_payment_date ? String(row.expected_payment_date).slice(0, 10) : '');

    setCompanyAdmin((row.company_admin as CompanyAdminValue) || '');
    setCustomCategory(row.custom_category || '');
    setCompanyApproval((row.company_approval as CompanyApprovalValue) || 'company_approval');

    setPaidAmount(row.paid_amount != null ? String(row.paid_amount) : '');
    setDescription(row.description || '');

    setExpenseChannel(row.expense_channel || '');
    setCashbackToCustomer(!!row.cashback_to_customer);
    setReferralPartner(row.referral_partner || '');

    const p: string = (row.payment || '').toString().trim();

    let mode: PaymentMode = 'account';
    let accHolder = '';
    let bank = '';
    let accNo = '';
    let ifscVal = '';
    let upi = '';
    let qrNoteVal = '';

    if (p.startsWith('Account Transfer')) {
      mode = 'account';
      const parts = p.split('|').map((s) => s.trim());

      const namePart = parts.find((s) => s.startsWith('Name:'));
      if (namePart) accHolder = namePart.replace('Name:', '').trim();

      const bankPart = parts.find((s) => s.startsWith('Bank:'));
      if (bankPart) bank = bankPart.replace('Bank:', '').trim();

      const accPart = parts.find((s) => s.startsWith('A/c:'));
      if (accPart) accNo = accPart.replace('A/c:', '').trim();

      const ifscPart = parts.find((s) => s.startsWith('IFSC:'));
      if (ifscPart) ifscVal = ifscPart.replace('IFSC:', '').trim();
    } else if (p.startsWith('UPI')) {
      mode = 'upi';
      const parts = p.split('|').map((s) => s.trim());
      const idPart = parts.find((s) => s.startsWith('ID:'));
      if (idPart) upi = idPart.replace('ID:', '').trim();
    } else if (p.startsWith('QR Payment')) {
      mode = 'qr';
      const parts = p.split('|').map((s) => s.trim());
      if (parts[1]) qrNoteVal = parts[1];
    } else {
      mode = 'account';
    }

    setPaymentMode(mode);
    setAccountHolder(accHolder);
    setBankName(bank);
    setAccountNumber(accNo);
    setIfsc(ifscVal);
    setUpiId(upi);
    setQrNote(qrNoteVal);
    setQrFile(null);
    setInvoices([]);

    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      if (typeof window !== 'undefined') {
        const ok = window.confirm('Are you sure you want to delete this expense?');
        if (!ok) return;
      }
      await softDeleteExpense(id);
      showSnackbar('Expense deleted successfully 🗑️', 'success');
      await load();
    } catch (err: any) {
      showSnackbar(err?.response?.data?.message || err?.message || 'Error while deleting expense', 'error');
    }
  };

  // SUBMIT CREATE / UPDATE
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!department) return showSnackbar('Department required', 'error');
    if (!date) return showSnackbar('Submission date required', 'error');
    if (!companyAdmin) return showSnackbar('Company Admin required', 'error');
    if (isOther && !customCategory.trim()) return showSnackbar('Please enter Other expense name', 'error');
    if (!companyApproval) return showSnackbar('More Expense Type required', 'error');
    if (!paidAmount.trim()) return showSnackbar('Paid amount required', 'error');

    const amt = Number(paidAmount);
    if (!Number.isFinite(amt) || amt <= 0) return showSnackbar('Paid amount must be valid number', 'error');

    if (companyApproval === 'expense_channel' && !expenseChannel.trim())
      return showSnackbar('Expense Channel required', 'error');

    if (companyApproval === 'referral_partner' && !referralPartner.trim())
      return showSnackbar('Referral Partner required', 'error');

    let payment: string | undefined;

    if (paymentMode === 'account') {
      if (!accountHolder.trim() || !bankName.trim() || !accountNumber.trim() || !ifsc.trim()) {
        showSnackbar('Account Holder, Bank Name, Account Number & IFSC are required for Account payment', 'error');
        return;
      }
      payment = [
        'Account Transfer',
        `Name: ${accountHolder.trim()}`,
        `Bank: ${bankName.trim()}`,
        `A/c: ${accountNumber.trim()}`,
        `IFSC: ${ifsc.trim()}`,
      ].join(' | ');
    } else if (paymentMode === 'upi') {
      if (!upiId.trim()) return showSnackbar('UPI ID is required', 'error');
      payment = `UPI | ID: ${upiId.trim()}`;
    } else if (paymentMode === 'qr') {
      payment = `QR Payment${qrNote.trim() ? ' | ' + qrNote.trim() : ''}`;
    }

    const allFiles: File[] = [...invoices, ...(qrFile ? [qrFile] : [])];

    const payload: any = {
      department,
      invoice_date: invoiceDate || undefined,

      date,
      expected_payment_date: expectedPaymentDate || undefined,
      manager_id: managerId || undefined,
      company_admin: companyAdmin as any,
      custom_category: isOther ? customCategory.trim() : undefined,
      company_approval: companyApproval as any,
      paid_amount: amt,
      description,
      expense_channel: companyApproval === 'expense_channel' ? expenseChannel : undefined,
      cashback_to_customer: companyApproval === 'cashback_to_customer' ? cashbackToCustomer : undefined,
      referral_partner: companyApproval === 'referral_partner' ? referralPartner : undefined,
      payment,
      payment_mode: paymentMode,

      account_holder: paymentMode === 'account' ? accountHolder.trim() : undefined,
      bank_name: paymentMode === 'account' ? bankName.trim() : undefined,
      account_number: paymentMode === 'account' ? accountNumber.trim() : undefined,
      ifsc: paymentMode === 'account' ? ifsc.trim() : undefined,

      upi_id: paymentMode === 'upi' ? upiId.trim() : undefined,
      qr_note: paymentMode === 'qr' ? qrNote.trim() : undefined,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateExpense(editingId, payload, allFiles);
        showSnackbar('Expense updated successfully ✅', 'success');
      } else {
        await createExpense(payload, allFiles);
        showSnackbar('Expense created successfully ✅', 'success');
        setPage(1);
      }
      resetForm();
      setOpen(false);
      await load();
    } catch (err: any) {
      showSnackbar(err?.message || 'Error while saving expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  // NON ADMIN VIEW
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f5fb',
          padding: 16,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            background: '#ffffff',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18, color: '#111827' }}>Access Restricted</h3>
          <p style={{ margin: 0, marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
            Only users with <b>Admin (role = 1)</b> can view and manage expenses on this page.
          </p>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div
      style={{
        padding: 16,
        maxWidth: 1200,
        margin: '0 auto',
        background: '#f3f5fb',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 2,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}></h2>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => {
              if (open) resetForm();
              else setEditingId(null);
              setOpen((v) => !v);
            }}
            style={{
              ...pillButtonPrimary,
              boxShadow: '0 8px 18px rgba(14, 116, 144, 0.3)',
              background: open
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              padding: '6px 14px',
              fontSize: 12,
              marginRight: 10,
            }}
          >
            {open ? 'Close Form' : '+ Create Expense'}
          </button>
          <button
            type="button"
            onClick={() => setShowGraphs((v) => !v)}
            style={{
              ...pillButtonGhost,
              padding: '6px 14px',
              fontSize: 12,
              borderRadius: 999,
              background: showGraphs ? '#111827' : '#f8fafc',
              color: showGraphs ? '#fff' : '#4b5563',
              border: showGraphs ? '1px solid #111827' : '1px solid #dde2eb',
              boxShadow: showGraphs ? '0 8px 18px rgba(17,24,39,0.25)' : 'none',
            }}
          >
            {showGraphs ? 'Hide Graphs' : 'View Graphs'}
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              size="small"
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              sx={{ height: 34, borderRadius: 3, bgcolor: '#fff', minWidth: 140 }}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              sx={{ height: 34, borderRadius: 3, bgcolor: '#fff', minWidth: 90 }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </div>

        </div>
      </div>

      {showGraphs && (
        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            padding: 14,
            boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
          }}
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div
              style={{
                flex: '1 1 220px',
                borderRadius: 14,
                padding: 12,
                border: '1px solid #eef2f7',
                background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.06))',
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280' }}>This Month Total Spend</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginTop: 2 }}>
                {currencyINR(monthTotal)}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Month: <b>{currentMonth}</b>
              </div>
            </div>

            {(['paid', 'approved', 'pending', 'rejected'] as const).map((k) => (
              <div
                key={k}
                style={{
                  flex: '1 1 160px',
                  borderRadius: 14,
                  padding: 12,
                  border: '1px solid #eef2f7',
                  background: '#fbfdff',
                }}
              >
                <div style={{ fontSize: 12, color: '#6b7280' }}>{getStatusLabel(k)}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginTop: 2 }}>
                  {currencyINR(statusTotals[k] || 0)}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={getStatusChipStyle(k)}>{getStatusLabel(k)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginTop: 12 }}>
            <div
              style={{
                borderRadius: 14,
                border: '1px solid #eef2f7',
                background: '#ffffff',
                padding: 10,
                minHeight: 260,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Daily Spend (This Month)
              </div>

              {dailySeries.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9ca3af', padding: 12 }}>No data for this month</div>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div
              style={{
                borderRadius: 14,
                border: '1px solid #eef2f7',
                background: '#ffffff',
                padding: 10,
                minHeight: 260,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                Top Categories (This Month)
              </div>

              {categorySeries.length === 0 ? (
                <div style={{ fontSize: 12, color: '#9ca3af', padding: 12 }}>No data for this month</div>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categorySeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {open && (
        <form onSubmit={onSubmit} style={cardStyle}>
          <div style={cardInner}>

            {/* SECTION 1 */}
            <div style={sectionStyle}>
              <div style={gridStyle}>

                {/* Department */}
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Select Department</label>

                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={teamsLoading}
                    displayEmpty
                    sx={{
                      height: 38,
                      borderRadius: 3, // ✅ keep rounded like your inputs (12px vibe)
                      '& .MuiSelect-select': { py: 1.05 },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                          maxHeight: 360,
                          overflowY: 'auto',
                          '&::-webkit-scrollbar': { width: 8 },
                          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 8 },
                          '&::-webkit-scrollbar-track': { background: '#f8fafc' },
                        },
                      },
                      MenuListProps: { sx: { p: 0 } },
                    }}
                    renderValue={(selected) => {
                      if (!selected) return teamsLoading ? 'Loading teams...' : 'You are from which Department';
                      const found = teams.find((t) => t._id === selected);
                      return found?.name || found?.code || 'Unnamed Team';
                    }}
                  >
                    <MenuItem
                      value=""
                      disabled
                      sx={{
                        bgcolor: '#ede9fe',
                        color: '#7c3aed',
                        fontWeight: 700,
                        py: 1.2,
                        px: 2,
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      {teamsLoading ? 'Loading teams...' : 'You are from which Department'}
                    </MenuItem>

                    {teams.map((t) => (
                      <MenuItem
                        key={t._id}
                        value={t._id}
                        sx={{
                          py: 1.3,
                          px: 2,
                          fontSize: 15,
                          '&:hover': { bgcolor: '#f3f4f6' },
                          '&.Mui-selected': { bgcolor: '#f3f4f6' },
                          '&.Mui-selected:hover': { bgcolor: '#e5e7eb' },
                        }}
                      >
                        {t.name || t.code || 'Unnamed Team'}
                      </MenuItem>
                    ))}
                  </Select>
                </div>

                {/* Expense Date */}
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={fieldInputStyle}
                  />
                </div>

                {/* Invoice Date */}
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>

                {/* Expected Payment Date */}
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Expected Payment Date</label>
                  <input
                    type="date"
                    value={expectedPaymentDate}
                    onChange={(e) => setExpectedPaymentDate(e.target.value)}
                    style={fieldInputStyle}
                  />
                </div>

                {/* Expense Category */}
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Expense Category</label>

                  <Select
                    value={companyAdmin}
                    onChange={(e) => setCompanyAdmin(e.target.value as CompanyAdminValue)}
                    disabled={!department}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) return 'Choose Category';
                      const found = filteredCompanyAdminOptions.find((x) => x.value === selected);
                      return found?.label || String(selected);
                    }}
                    sx={{
                      height: 38,
                      borderRadius: 3,
                      '& .MuiSelect-select': { py: 1.05 },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          mt: 1,
                          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                          maxHeight: 360,
                          overflowY: 'auto',
                        },
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Choose Category
                    </MenuItem>

                    {filteredCompanyAdminOptions
                      .filter((o) => o.value !== '')
                      .map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                  </Select>
                </div>
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Amount To Be Pay</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    required
                    style={fieldInputStyle}
                    placeholder="₹0"
                  />
                </div>
                {/* Other category */}
                {isOther && (
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>Other Expense Name</label>
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter expense name"
                      style={fieldInputStyle}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2 */}
            {/* <div style={{ ...sectionStyle, marginTop: 12 }}>
        <div style={gridStyle}>
          {companyApproval === 'expense_channel' && (
            <div style={fieldWrap}>
              <label style={fieldLabelStyle}>Expense Channel</label>
              <input
                value={expenseChannel}
                onChange={(e) => setExpenseChannel(e.target.value)}
                style={fieldInputStyle}
                placeholder="Enter channel name"
              />
            </div>
          )}

          {companyApproval === 'referral_partner' && (
            <div style={fieldWrap}>
              <label style={fieldLabelStyle}>Referral Partner</label>
              <input
                value={referralPartner}
                onChange={(e) => setReferralPartner(e.target.value)}
                style={fieldInputStyle}
                placeholder="Enter partner name"
              />
            </div>
          )}

          <div style={fieldWrap}>
            <label style={fieldLabelStyle}>Amount To Be Pay</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              required
              style={fieldInputStyle}
              placeholder="₹0"
            />
          </div>
        </div>

        {companyApproval === 'cashback_to_customer' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 12,
              background: '#fff',
              border: '1px dashed #d1d5db',
            }}
          >
            <input
              id="cashback_to_customer_admin"
              type="checkbox"
              checked={cashbackToCustomer}
              onChange={(e) => setCashbackToCustomer(e.target.checked)}
            />
            <label htmlFor="cashback_to_customer_admin" style={{ fontSize: 13, color: '#334155' }}>
              Cashback given to customer
            </label>
          </div>
        )}
      </div> */}

            {/* SECTION 3 */}
            <div style={{ ...sectionStyle, marginTop: 12 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.1fr)',
                  gap: 12,
                  alignItems: 'start',
                }}
              >
                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    style={{ ...fieldInputStyle, height: 'auto', resize: 'vertical', minHeight: 68 }}
                    placeholder="Describe what this expense is for..."
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={fieldLabelStyle}>Upload Invoices</label>
                  <div style={{ borderRadius: 12, border: '1px dashed #cbd5e1', padding: 12, background: '#fff' }}>
                    <input type="file" multiple onChange={(e) => setInvoices(Array.from(e.target.files || []))} />
                    {invoices.length > 0 && (
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                        {invoices.length} file(s) selected
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      Upload PDF / Image Here
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT MODE */}
            <div style={{ ...sectionStyle, marginTop: 12 }}>
              <label style={fieldLabelStyle}>Choose Mode Of Payment</label>

              <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 230px', maxWidth: 260 }}>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    style={{
                      ...fieldInputStyle,
                      height: 38,
                      borderRadius: 12,
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: '8px 12px',
                      paddingRight: 38,
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: 18,
                    }}
                    onFocus={(e) => (e.currentTarget.style.border = '1px solid #6366f1')}
                    onBlur={(e) => (e.currentTarget.style.border = '1px solid #d1d5db')}
                  >
                    <option value="account">Bank Account Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="qr">QR Payment</option>
                  </select>
                </div>
              </div>

              {/* Account */}
              {paymentMode === 'account' && (
                <div style={{ marginTop: 8, ...gridStyle }}>
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>Account Holder Name</label>
                    <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} style={fieldInputStyle} />
                  </div>
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>Bank Name</label>
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} style={fieldInputStyle} />
                  </div>
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>Account Number</label>
                    <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={fieldInputStyle} />
                  </div>
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>IFSC</label>
                    <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} style={fieldInputStyle} />
                  </div>
                </div>
              )}

              {/* UPI */}
              {paymentMode === 'upi' && (
                <div style={{ marginTop: 12, ...gridStyle }}>
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>UPI ID</label>
                    <input value={upiId} onChange={(e) => setUpiId(e.target.value)} style={fieldInputStyle} />
                  </div>
                </div>
              )}

              {/* QR */}
              {paymentMode === 'qr' && (
                <div style={{ marginTop: 12, ...gridStyle, alignItems: 'start' }}>
                  <div style={fieldWrap}>
                    <label style={fieldLabelStyle}>Upload QR Image</label>

                    <div
                      style={{
                        borderRadius: 12,
                        border: '1px dashed #cbd5e1',
                        padding: 12,
                        background: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        maxWidth: 280,
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setQrFile(file)
                        }}
                      />

                      {qrFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={URL.createObjectURL(qrFile)}
                            alt="QR Preview"
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 12,
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb',
                            }}
                          />
                          <div style={{ fontSize: 12, color: '#334155' }}>{qrFile.name}</div>
                        </div>
                      )}
                    </div>


                  </div>
                </div>
              )}
            </div>


            {/* ACTIONS */}
            <div style={actionRow}>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                style={pillButtonGhost}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...pillButtonPrimary,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editingId ? 'Update Expense' : 'Submit Expense'}
              </button>
            </div>

          </div>
        </form>
      )}


      {/* LIST */}
      <div style={{ marginTop: 18 }}>
        <div
          style={{
            marginTop: 18,
            overflowX: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: 14,
            background: '#ffffff',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  'Date',
                  'Release Date',
                  'Invoice Date',
                  'Employee',
                  'Contact',
                  'Email',
                  'Branch',
                  'Department',
                  'Category',
                  // 'Expense Type',
                  'Description',
                  'Amount',
                  'Mode Of Payment',
                  'Status',
                  'Admin Note',
                  'Invoices',
                  'Admin Attachment',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 12,
                      padding: 10,
                      borderBottom: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      color: '#4b5563',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!loadingList &&
                rows.map((r) => {
                  const canEdit = r.admin_status === 'pending';
                  const canDelete = r.admin_status === 'pending';
                  const isRowVerifying = verifyingId === r._id;
                  const canVerify = isAdmin;
                  const owner = getEmpData(r.owner_id);
                  const allInvoiceUrls: string[] = Array.isArray(r.invoices) ? r.invoices : [];
                  const isQrPayment = String(r.payment || '').startsWith('QR Payment');
                  let invoiceUrls: string[] = allInvoiceUrls;
                  let qrUrl: string | null = null;
                  if (isQrPayment && allInvoiceUrls.length > 0) {
                    qrUrl = allInvoiceUrls[allInvoiceUrls.length - 1]; // last file = QR
                    invoiceUrls = allInvoiceUrls.slice(0, -1);
                  }

                  const adminAttachmentUrls: string[] = Array.isArray(r.admin_attachments)
                    ? r.admin_attachments
                    : Array.isArray(r.admin_attachment)
                      ? r.admin_attachment
                      : [];

                  return (
                    <tr key={r._id}>
                      {/* Date */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {r.date?.slice(0, 10)}
                      </td>

                      {/* Expected Date */}
                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          color: r.expected_payment_date ? '#111827' : '#9ca3af',
                          fontWeight: r.expected_payment_date ? 600 : 400,
                        }}
                      >
                        {r.expected_payment_date ? String(r.expected_payment_date).slice(0, 10) : '—'}
                      </td>
                      <td
                        style={{
                          padding: 10,
                          borderBottom: '1px solid #f1f1f1',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          color: r.expected_payment_date ? '#111827' : '#9ca3af',
                          fontWeight: r.expected_payment_date ? 600 : 400,
                        }}
                      >
                        {r.invoice_date ? String(r.invoice_date).slice(0, 10) : '—'}
                      </td>

                      {/* Employee */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {owner.image && (
                            <img
                              src={owner.image}
                              alt={owner.name}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid #e5e7eb',
                              }}
                            />
                          )}
                          <span>{owner.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        {(r.owner_contact || '—')}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        {(r.owner_email || '—')}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        {(r.owner_branch || '—')}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        {r.department?.name || r.department?.code || String(r.department || '—')}
                      </td>


                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>{showCategory(r)}</td>
                      {/* <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>{r.company_approval}</td> */}

                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12, minWidth: 120, maxWidth: 140 }}>
                        {r.description ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                              Description
                            </span>

                            <button
                              type="button"
                              onClick={() => setTextPreview({ title: 'Description', text: String(r.description) })}
                              title="View Description"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 999,
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                fontSize: 12,
                                cursor: 'pointer',
                                color: '#ffffff',
                                boxShadow: '0 4px 10px rgba(99,102,241,0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              👁
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        ₹ {Number(r.paid_amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12, minWidth: 120, maxWidth: 140 }}>
                        {r.payment ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                              Payment
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setPaymentPreview({
                                  text: String(r.payment),
                                  invoices: invoiceUrls,
                                  qrUrl,
                                })
                              }
                              title="View Payment Details"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 999,
                                border: 'none',
                                background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                                fontSize: 12,
                                cursor: 'pointer',
                                color: '#ffffff',
                                boxShadow: '0 4px 10px rgba(14,165,233,0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              👁
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12 }}>
                        <span style={getStatusChipStyle(r.admin_status)}>{getStatusLabel(r.admin_status)}</span>
                      </td>

                      {/* Admin Note (only view) */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12, minWidth: 120, maxWidth: 140 }}>
                        {r.admin_note ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                              Note
                            </span>

                            <button
                              type="button"
                              onClick={() => setTextPreview({ title: 'Note', text: String(r.admin_note) })}
                              title="Admin Response"
                              style={{
                                padding: '5px 8px',
                                borderRadius: 999,
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                fontSize: 12,
                                cursor: 'pointer',
                                color: '#ffffff',
                                boxShadow: '0 4px 10px rgba(99,102,241,0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              👁
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      {/* Invoices */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1' }}>
                        {invoiceUrls.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {invoiceUrls.map((url: string, idx: number) => {
                              const name = prettyFileName(url);
                              const img = isImageUrl(url);

                              return (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    textDecoration: 'none',
                                    borderRadius: 10,
                                    border: '1px solid #e5e7eb',
                                    padding: 4,
                                    background: '#f9fafb',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    maxWidth: 160,
                                  }}
                                  title={name}
                                >
                                  {img && (
                                    <img
                                      src={url}
                                      alt={name}
                                      style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }}
                                    />
                                  )}
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: '#1d4ed8',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {name || `Invoice ${idx + 1}`}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        ) : qrUrl ? (
                          <span style={{ fontSize: 11, color: '#6b7280' }}>only QR Uploaded</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>No invoice</span>
                        )}
                      </td>
                      {/* Admin Attachment */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1' }}>
                        {adminAttachmentUrls.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {adminAttachmentUrls.map((url: string, idx: number) => {
                              const name = prettyFileName(url);
                              const img = isImageUrl(url);
                              const pdf = isPdfUrl(url);

                              return (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    textDecoration: 'none',
                                    borderRadius: 10,
                                    border: '1px solid #e5e7eb',
                                    padding: 4,
                                    background: '#eef2ff', // light indigo for admin
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    maxWidth: 170,
                                  }}
                                  title={name}
                                >
                                  {img ? (
                                    <img
                                      src={url}
                                      alt={name}
                                      style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <span style={{ fontSize: 16 }}>{pdf ? '📄' : '📎'}</span>
                                  )}

                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: '#4338ca',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {name || `Admin File ${idx + 1}`}
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: 10, borderBottom: '1px solid #f1f1f1', fontSize: 12, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => startEdit(r)}
                            title="Edit Expense"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 12,
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                              background: canEdit ? '#0ea5e9' : '#e5e7eb',
                              color: canEdit ? '#ffffff' : '#9ca3af',
                            }}
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            disabled={!canDelete}
                            onClick={() => handleDelete(r._id)}
                            title="Delete Expense"
                            style={{
                              padding: '5px 8px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 12,
                              cursor: canDelete ? 'pointer' : 'not-allowed',
                              background: canDelete ? '#ef4444' : '#e5e7eb',
                              color: canDelete ? '#ffffff' : '#9ca3af',
                            }}
                          >
                            🗑
                          </button>

                          <button
                            type="button"
                            disabled={!canVerify || isRowVerifying}
                            onClick={() => {
                              if (!canVerify || isRowVerifying) return;
                              setSelectedId(r._id);
                              setSelectedRow(r);
                              setNote(r.admin_note || '');
                              setActualPaymentDate(
                                r.actual_payment_date ? String(r.actual_payment_date).slice(0, 10) : '',
                              );
                            }}
                            title="Change Status"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              border: 'none',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: !canVerify || isRowVerifying ? 'not-allowed' : 'pointer',
                              background: canVerify && !isRowVerifying ? '#1d4ed8' : '#e5e7eb',
                              color: canVerify && !isRowVerifying ? '#ffffff' : '#9ca3af',
                              boxShadow:
                                canVerify && !isRowVerifying ? '0 3px 10px rgba(37, 99, 235, 0.35)' : 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {r.admin_status === 'pending'
                              ? isRowVerifying
                                ? 'Verifying...'
                                : 'Verify'
                              : isRowVerifying
                                ? 'Updating...'
                                : 'Change'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {loadingList && (
                <tr>
                  <td colSpan={11} style={{ padding: 12, fontSize: 12 }}>
                    Loading...
                  </td>
                </tr>
              )}

              {!loadingList && rows.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 12, fontSize: 12 }}>
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            marginTop: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              ...pillButtonGhost,
              padding: '6px 12px',
              fontSize: 12,
              opacity: page <= 1 ? 0.6 : 1,
            }}
          >
            Prev
          </button>

          <div style={{ fontSize: 12 }}>
            Page <b>{page}</b> / <b>{totalPages}</b>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              ...pillButtonGhost,
              padding: '6px 12px',
              fontSize: 12,
              opacity: page >= totalPages ? 0.6 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* ADMIN VERIFY DIALOG */}
      {selectedId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 520,
              width: '90%',
              padding: 16,
              boxShadow: '0 20px 60px rgba(15,23,42,0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>Admin Verify Expense</div>
              <button
                type="button"
                onClick={() => {
                  setSelectedId('');
                  setSelectedRow(null);
                  setNote('');
                  setActualPaymentDate('');
                  setAdminVerifyFiles([]); // ✅ clear attachments
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {selectedRow && (
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                Current: <b>{getStatusLabel(selectedRow.admin_status)}</b>
              </div>
            )}

            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Please add a note and choose <b>Approve</b>, <b>Paid</b> or <b>Reject</b>. You can also reset
              it to <b>Pending</b>.
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 10,
                border: '1px solid #dde2eb',
                fontSize: 12,
                resize: 'vertical',
                minHeight: 80,
              }}
              placeholder="Add a note for approval / rejection / payment..."
            />

            {/* ✅ Attachment Upload */}
            <div style={{ marginTop: 10 }}>
              <label style={fieldLabelStyle}>Upload Attachment</label>

              <div
                style={{
                  marginTop: 6,
                  borderRadius: 12,
                  border: '1px dashed #cbd5e1',
                  padding: 12,
                  background: '#fff',
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;

                    // append + dedupe
                    setAdminVerifyFiles((prev) => {
                      const map = new Map<string, File>();
                      [...prev, ...files].forEach((f) => {
                        const key = `${f.name}-${f.size}-${f.lastModified}`;
                        map.set(key, f);
                      });
                      return Array.from(map.values());
                    });

                    // allow selecting same file again
                    e.currentTarget.value = '';
                  }}
                />

                {adminVerifyFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {adminVerifyFiles.map((f, idx) => {
                      const isImg = /^image\//.test(f.type);
                      const url = isImg ? URL.createObjectURL(f) : '';

                      return (
                        <div
                          key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: 8,
                            borderRadius: 12,
                            border: '1px solid #e5e7eb',
                            background: '#f9fafb',
                          }}
                        >
                          {isImg ? (
                            <img
                              src={url}
                              alt={f.name}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                objectFit: 'cover',
                                border: '1px solid #e5e7eb',
                                background: '#fff',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                border: '1px solid #e5e7eb',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 18,
                              }}
                            >
                              📄
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#111827',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={f.name}
                            >
                              {f.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>
                              {(f.size / 1024).toFixed(1)} KB
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setAdminVerifyFiles((prev) => prev.filter((_, i) => i !== idx))}
                            style={{
                              border: 'none',
                              background: 'rgba(239,68,68,0.12)',
                              color: '#b91c1c',
                              padding: '6px 10px',
                              borderRadius: 999,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                  Upload proof image / pdf (Admin verify attachment)
                </div>
              </div>
            </div>

            {/* ✅ Actual Payment Date (only for Paid) */}
            {selectedRow && (
              <div style={{ marginTop: 10 }}>
                <label style={fieldLabelStyle}>Actual Payment Date</label>
                <input
                  type="date"
                  value={actualPaymentDate}
                  onChange={(e) => setActualPaymentDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #dde2eb',
                    fontSize: 12,
                    marginTop: 6,
                    background: '#fdfdfd',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                disabled={verifyingId === selectedId}
                onClick={() => verify(selectedId, 'pending', adminVerifyFiles)}
                style={{ ...pillButtonGhost, opacity: verifyingId === selectedId ? 0.6 : 1 }}
              >
                {verifyingId === selectedId ? 'Updating…' : 'Mark Pending'}
              </button>

              <button
                disabled={verifyingId === selectedId}
                onClick={() => verify(selectedId, 'approved', adminVerifyFiles)}
                style={{
                  ...pillButtonPrimary,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 8px 18px rgba(34, 197, 94, 0.3)',
                  opacity: verifyingId === selectedId ? 0.6 : 1,
                }}
              >
                {verifyingId === selectedId ? 'Approving…' : 'Approve'}
              </button>

              <button
                disabled={verifyingId === selectedId || !actualPaymentDate}
                onClick={() => verify(selectedId, 'paid', adminVerifyFiles)}
                style={{
                  ...pillButtonPrimary,
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  boxShadow: '0 8px 18px rgba(59,130,246,0.35)',
                  opacity: verifyingId === selectedId || !actualPaymentDate ? 0.6 : 1,
                  cursor: verifyingId === selectedId || !actualPaymentDate ? 'not-allowed' : 'pointer',
                }}
              >
                {verifyingId === selectedId ? 'Marking…' : 'Mark as Paid'}
              </button>

              <button
                disabled={verifyingId === selectedId}
                onClick={() => verify(selectedId, 'rejected', adminVerifyFiles)}
                style={{
                  ...pillButtonPrimary,
                  background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  boxShadow: '0 8px 18px rgba(239, 68, 68, 0.3)',
                  opacity: verifyingId === selectedId ? 0.6 : 1,
                }}
              >
                {verifyingId === selectedId ? 'Rejecting…' : 'Reject'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedId('');
                  setSelectedRow(null);
                  setNote('');
                  setActualPaymentDate('');
                  setAdminVerifyFiles([]); // ✅ clear attachments
                }}
                style={pillButtonGhost}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* PAYMENT DETAILS DIALOG (✅ QR bigger) */}
      {paymentPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 720,
              width: '92%',
              padding: 16,
              boxShadow: '0 20px 60px rgba(15,23,42,0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>Payment Details</div>
              <button
                type="button"
                onClick={() => setPaymentPreview(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {/* Text */}
            <div
              style={{
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
                padding: '6px 0 4px',
              }}
            >
              {paymentPreview.text}
            </div>

            {/* QR Image */}
            {paymentPreview.qrUrl && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                }}
              >
                <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6, fontWeight: 600 }}>
                  QR Image (click to open)
                </div>

                <a href={paymentPreview.qrUrl} target="_blank" rel="noreferrer">
                  <img
                    src={paymentPreview.qrUrl}
                    alt="QR"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 280,
                      borderRadius: 12,
                      objectFit: 'contain',
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
                      cursor: 'zoom-in',
                    }}
                  />
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" onClick={() => setPaymentPreview(null)} style={pillButtonPrimary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEXT PREVIEW DIALOG */}
      {textPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              maxWidth: 520,
              width: '90%',
              padding: 16,
              boxShadow: '0 20px 60px rgba(15,23,42,0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{textPreview.title}</div>
              <button
                type="button"
                onClick={() => setTextPreview(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
                color: '#374151',
                maxHeight: 320,
                overflow: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 10,
                background: '#f9fafb',
              }}
            >
              {textPreview.text}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" onClick={() => setTextPreview(null)} style={pillButtonPrimary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
